const express = require('express');
const router = express.Router();
const dbconfig = require('../database/dbconfig');
const Joi = require('@hapi/joi');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const upload = require('../upload-config/index');
const { getRandomID } = require('../functions/globalFunctions');
const { checkAuth } = require('../auth/index');

const pool = new Pool(dbconfig);

router.get('/', (req, res) => {
  pool.query('SELECT data, id, tracks, followers, following, likes FROM people', (err, result) => {
    if (err) return res.status(500).send(err.stack);
    // Check if each person has profile image
    for (let i = 0; i < result.rowCount; i++) {
      const person = result.rows[i];
      person.hasImage = fs.existsSync(`./images/profiles/${person.id}.jpg`);
    }
    res.send(result.rows);
  });
});

router.get('/:id', (req, res) => {
  pool.query('SELECT data, id, tracks, followers, following, likes FROM people WHERE id = $1',
  [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    if (result.rows.length < 1) return res.status(404).json({ message: 'Person not found.' });
    const personalData = result.rows[0];
    // Check if person has profile image
    personalData.hasImage = fs.existsSync(`./images/profiles/${req.params.id}.jpg`);
    res.send(personalData);
  });
});

router.get('/profile/:username', (req, res) => {
  pool.query("SELECT data, id, tracks, followers, following, likes FROM people WHERE " + 
  "data ->> 'username' = $1", [req.params.username], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    if (result.rows.length < 1) return res.status(404).json({ message: 'Person not found.' });
    const personalData = result.rows[0];
    // Check if person has profile image
    personalData.hasImage = fs.existsSync(`./images/profiles/${personalData.id}.jpg`);
    res.send(personalData);
  });
});

router.post('/', (req, res) => {
  // Validation:
  const schema = Joi.object().keys({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });
  const result = Joi.validate(req.body, schema);
  if (result.error) return res.status(400).send(result.error.details[0].message);
  // Creating personID
  const personID = getRandomID('person', 10);
  req.body.email = req.body.email.toLowerCase();
  pool.query('SELECT id FROM people', (err, result) => {
    if (err) res.status(500).send(err.stack);
    while (result.rows.find(id => id === personID)) {
      personID = getRandomID('person', 10);
    }
  });
  // Creating data
  let personalData = {
    username: personID,
    name: req.body.name,
    email: req.body.email,
    reg_date: Date.now(),
  };
  // Hashing password:
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) return res.status(500).send(err.stack);
    else {
      personalData.hasImage = false;
      // Inserting personal data into db
      pool.query('INSERT INTO people(id, data, password) VALUES ($1, $2, $3)',
                 [personID, personalData, hash])
      .then(() => res.send('Added person successfully.'))
      .catch(err => res.status(500).send(err.stack));
    }
  });
});

router.put('/:id', checkAuth, (req, res) => {
  // Validation:
  const schema = Joi.object().keys({
    username: Joi.string().min(4).max(30).required(),
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(8).max(20), // edit this
    birth_date: Joi.date(),
    city: Joi.string().min(2).max(50),
    country: Joi.string().min(2).max(50),
    reg_date: Joi.date(), // edit this
    hasImage: Joi.boolean(),
  });
  const result = Joi.validate(req.body.data, schema);
  if (result.error) return res.status(400).send(result.error.details[0].message);
  // Setting username and email to lowercase
  req.body.data.username = req.body.data.username.toLowerCase();
  req.body.data.email = req.body.data.email.toLowerCase();
  // Updating personal data
  pool.query('UPDATE people SET data = $2 WHERE id = $1', [req.params.id, req.body.data])
    .then(() => res.send('Edited personal data successfully.'))
    .catch(err => res.status(400).send(err));
});

router.put('/:id/change-image', upload.profileImage.single('image'), (req, res) => {
  res.send('Changed profile image successfully.');
});

router.put('/:id/remove-image', checkAuth, async (req, res) => {
  try {
    // Remove image file
    fs.unlinkSync(`./images/profiles/${req.params.id}.jpg`);
    res.send('Profile image removed successfully.');
  }
  catch (err) {
    res.status(500).send(err);
  }
});

router.put('/:follower_id/follow/:following_id', checkAuth, (req, res) => {
  if (!req.params.follower_id || !req.params.following_id) return res.status(400).json({ message: 'Invalid id.' });
  pool.connect(async (err, client, done) => {
    if(err) return res.status(500).send(err.stack);
    try {
      const followers = await client.query('SELECT followers FROM people WHERE id = $1', [req.params.following_id]);
      if (followers.rows.length < 1) return res.status(404).send('Person not found.');
      else if (followers.rows[0].followers.includes(req.params.follower_id)) {
        return res.json({ message: 'Allready added.' });
      }
      await client.query('UPDATE people SET followers = array_append((SELECT followers FROM people WHERE id = $2),' +
      '$1) WHERE id = $2', [req.params.follower_id, req.params.following_id]);

      const following = await client.query('SELECT following FROM people WHERE id = $1', [req.params.follower_id]);
      if (following.rows.length < 1) return res.status(404).send('Person not found.');
      else if (following.rows[0].following.includes(req.params.following_id)) {
        return res.json({ message: 'Allready added.' });
      }
      await client.query('UPDATE people SET following = array_append((SELECT following FROM people WHERE id = $2),' +
      '$1) WHERE id = $2', [req.params.following_id, req.params.follower_id]);
      
      res.json({ message: 'Added successfully.' });
    }
    catch (err) {
      res.status(500).send(err);
    }
  });
});

router.put('/:follower_id/unfollow/:following_id', checkAuth, (req, res) => {
  if (!req.params.follower_id || !req.params.following_id) return res.status(400).json({ message: 'Invalid id.' });
  pool.connect(async (err, client, done) => {
    if (err) return res.status(500).send(err.stack);
    try {
      const followers = await client.query('SELECT followers FROM people WHERE id = $1', [req.params.following_id]);
      if (followers.rows.length < 1) return res.status(404).send('Person not found.');
      await client.query('UPDATE people SET followers = array_remove((SELECT followers FROM people WHERE id = $2),' +
      '$1) WHERE id = $2', [req.params.follower_id, req.params.following_id]);

      const following = await client.query('SELECT following FROM people WHERE id = $1', [req.params.follower_id]);
      if (following.rows.length < 1) return res.status(404).send('Person not found.');
      await client.query('UPDATE people SET following = array_remove((SELECT following FROM people WHERE id = $2),' +
      '$1) WHERE id = $2', [req.params.following_id, req.params.follower_id]);

      res.json({ message: 'Unfollowed successfully.' });
    }
    catch (err) {
      res.status(500).send(err);
    }
  });
});

router.delete('/:id', checkAuth, (req, res) => {
  pool.query('DELETE FROM people WHERE id = $1', [req.params.id])
    .then(() => res.send('Deleted personal data successfully.'))
    .catch(err => res.status(400).send(err));
});

// unused:
router.get('/:id/following', (req, res) => {
  pool.query('SELECT following FROM people WHERE id = $1', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    res.send(result.rows[0]);
  });
});

// unused:
router.get('/:id/tracks', (req, res) => {
  pool.query('SELECT * FROM music WHERE artist_id = $1', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    else res.send(result.rows);
  });
});

module.exports = router;
