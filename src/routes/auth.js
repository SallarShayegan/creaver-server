const express = require('express');
const router = express.Router();
const dbconfig = require('../database/dbconfig');
const Joi = require('@hapi/joi');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const upload = require('../upload-config/index');
const { checkAuth } = require('../auth/index');
// const Schema = require('validate');

const pool = new Pool(dbconfig);

router.post('/login', (req, res) => {
  let personalData = {};

  function login(payload) {
    if (!payload) return res.status(404).json({ message: 'Person not found.' });
    bcrypt.compare(req.body.password, payload.password, (err, result) => {
      if (err) return res.status(500).send(err);
      else if (!result) return res.status(401).json({ message: 'Invalid password. '});
      const authData = {
        id: payload.id,
        username: payload.data.username,
        email: payload.data.email,
        password: payload.password,
      }
      // Check if person has profile image
      payload.hasImage = fs.existsSync(`./images/profiles/${payload.id}.jpg`);
      const token = jwt.sign(authData, process.env.JWT_KEY, { expiresIn: '1h' });
      payload.token = token;
      delete payload.password;
      res.send(payload);
    });
  }
  // If login via email
  if (req.body.email) {
    pool.query("SELECT * FROM people WHERE data ->> 'email' = $1",
               [req.body.email], (err, result) => {
      if (err) return res.status(500).send(err);
      personalData = result.rows[0];
      login(personalData);
    });
  }
  // If login via username
  else if (req.body.username) {
    pool.query("SELECT * FROM people WHERE data ->> 'username' = $1",
               [req.body.username], (err, result) => {
      if (err) return res.status(500).send(err);
      personalData = result.rows[0];
      login(personalData);
    });
  }
  else res.status(401).json({ message: 'Invalid login data.' });

});

router.get('/:id', (req, res) => {
  pool.query('SELECT * FROM people WHERE id = $1', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    let personalData = result.rows[0];
    delete personalData.password;
    // Check if person has profile image
    personalData.hasImage = fs.existsSync(`./images/profiles/${personalData.id}.jpg`);
    res.send(personalData);
  });
});

router.put('/edit-profile', checkAuth, (req, res) => {
  // Validation:
  const schema = Joi.object().keys({
    username: Joi.string().min(4).max(30).required(),
    name: Joi.string().min(2).max(50).required(),
    bio: Joi.string().max(300),
    email: Joi.string().email().required(),
    phone: Joi.string().min(8).max(20), // edit this
    birth_date: Joi.date(),
    city: Joi.string().min(2).max(50),
    country: Joi.string().min(2).max(50),
    reg_date: Joi.date(), // edit this
    hasImage: Joi.boolean(),
  });
  /*
  const authSchema = new schema({
    username: {
      type: String,
      required: true,
      length: { min: 4, max: 30 }
    },
    name: {
      type: String,
      required: true,
      length: { min: 2, max: 50 }
    },
    email: {
      type: String,
      required: true,
      length: { min: 4, max: 30 }
    },
  });*/
  const result = Joi.validate(req.body.data, schema);
  if (result.error) return res.status(400).send(result.error.details[0].message);
  // Setting username and email to lowercase
  req.body.data.username = req.body.data.username.toLowerCase();
  req.body.data.email = req.body.data.email.toLowerCase();
  // Updating personal data
  pool.query('UPDATE people SET data = $2 WHERE id = $1', [req.authData.id, req.body.data])
    .then(() => res.send('Edited personal data successfully.'))
    .catch(err => res.status(400).send(err));
});

router.put('/change-image', checkAuth, upload.profileImage.single('image'), (req, res) => {
  res.send('Changed profile image successfully.');
});

router.put('/remove-image', checkAuth, async (req, res) => {
  try {
    // Remove image file
    fs.unlinkSync(`./images/profiles/${req.authData.id}.jpg`);
    res.send('Profile image removed successfully.');
  }
  catch (err) {
    res.status(500).send(err);
  }
});

router.put('/follow/:id', checkAuth, (req, res) => {
  if (!req.authData.id || !req.params.id) return res.status(400).json({ message: 'Invalid id.' });
  pool.connect(async (err, client, done) => {
    if(err) return res.status(500).send(err.stack);
    try {
      // Check if person being followed exists and not been added yet
      const followers = await client.query('SELECT followers FROM people WHERE id = $1', [req.params.id]);
      if (followers.rows.length < 1) return res.status(404).send('Person not found.');
      else if (followers.rows[0].followers.includes(req.authData.id)) {
        return res.json({ message: 'Allready added.' });
      }
      // Check if person who's following exists and hasn't followed person yet
      const following = await client.query('SELECT following FROM people WHERE id = $1', [req.authData.id]);
      if (following.rows.length < 1) return res.status(404).send('Person not found.');
      else if (following.rows[0].following.includes(req.params.id)) {
        return res.json({ message: 'Allready added.' });
      }
      // Add follower id to following person's data
      await client.query('UPDATE people SET followers = array_append((SELECT followers ' +
      'FROM people WHERE id = $2), $1) WHERE id = $2', [req.authData.id, req.params.id]);
      // Add following person's id to follower's data
      await client.query('UPDATE people SET following = array_append((SELECT following ' +
      'FROM people WHERE id = $2), $1) WHERE id = $2', [req.params.id, req.authData.id]);
      
      res.json({ message: 'Added successfully.' });
    }
    catch (err) {
      res.status(500).send(err);
    }
  });
});

router.put('/unfollow/:id', checkAuth, (req, res) => {
  if (!req.authData.id || !req.params.id) return res.status(400).json({ message: 'Invalid id.' });
  pool.connect(async (err, client, done) => {
    if (err) return res.status(500).send(err.stack);
    try {
      // Check if person being unfollowed exists
      const followers = await client.query('SELECT followers FROM people WHERE id = $1', [req.params.id]);
      if (followers.rows.length < 1) return res.status(404).send('Person not found.');
      // Check if person who's unfollowing exists
      const following = await client.query('SELECT following FROM people WHERE id = $1', [req.authData.id]);
      if (following.rows.length < 1) return res.status(404).send('Person not found.');
      // Remove follower id from following person's data
      await client.query('UPDATE people SET followers = array_remove((SELECT followers ' +
      'FROM people WHERE id = $2), $1) WHERE id = $2', [req.authData.id, req.params.id]);
      // Remove following person's id from follower's data
      await client.query('UPDATE people SET following = array_remove((SELECT following ' +
      'FROM people WHERE id = $2), $1) WHERE id = $2', [req.params.id, req.authData.id]);

      res.json({ message: 'Unfollowed successfully.' });
    }
    catch (err) {
      res.status(500).send(err);
    }
  });
});

router.delete('/delete-account', checkAuth, (req, res) => {
  pool.query('DELETE FROM people WHERE id = $1', [req.authData.id])
    .then(() => res.send('Deleted account successfully.'))
    .catch(err => res.status(400).send(err));
});

module.exports = router;