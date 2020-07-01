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
  pool.query('SELECT profile_data, id, tracks, followers, following, likes, reg_date FROM people', (err, result) => {
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
  pool.query('SELECT profile_data, id, tracks, followers, following, likes, reg_date FROM people WHERE id = $1',
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
  pool.query("SELECT profile_data, id, tracks, followers, following, likes, reg_date FROM people WHERE " + 
  "profile_data ->> 'username' = $1", [req.params.username], (err, result) => {
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
    bio: '',
    city: '',
    country: '',
    phone: '',
    birth_date: '',
    hasImage: false,
  };
  // Hashing password:
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) return res.status(500).send(err.stack);
    else {
      // Inserting personal data into db
      pool.query('INSERT INTO people(id, data, password, reg_date) VALUES ($1, $2, $3, $4)',
                 [personID, personalData, hash, Date.now()])
      .then(() => res.send('Added person successfully.'))
      .catch(err => res.status(500).send(err.stack));
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
