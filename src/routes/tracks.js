const express = require('express');
const router = express.Router();
const dbconfig = require('../database/dbconfig');
const fs = require('fs');
const { Pool } = require('pg');
const upload = require('../upload-config/index');
const formidable = require('formidable');
const { checkAuth } = require('../auth/index');
const Schema = require('validate');

const pool = new Pool(dbconfig);

router.get('/', (req, res) => {
  pool.query('SELECT * FROM music', (err, result) => {
    if (err) return res.status(500).send(err.stack);
    else res.send(result.rows);
  });
});

router.get('/:id', (req, res) => {
  pool.query('SELECT * FROM music WHERE id = $1', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    if (result.rows.length < 1) return res.status(404).json({ message: 'Track not found.' });
    const trackData = result.rows[0];
    // Check if track has image
    trackData.hasImage = fs.existsSync(`./images/tracks/${req.params.id}.jpg`);
    res.send(trackData);
  });
});

router.post('/', checkAuth, (req, res, next) => {
  // Validation:
  const trackSchema = new Schema({
    name: {
      type: String,
      required: true,
      length: { min: 2, max: 100 }
    },
    discription: {
      type: String,
      length: { max: 200 }
    },
    genre: {
      type: String
    },
    place: {
      type: String
    }
  });
  trackSchema.message({
    required: (path) => `${path} can not be empty.`
  });
  /*
  const schema = Joi.object().keys({
    name: Joi.string().min(2).required(),
    discription: Joi.string(),
    genre: Joi.string(),
    place: Joi.string().min(2),
  });
  */
  // Parsing trackData from form-data
  let formData = new formidable.IncomingForm();

  // This shit magically works and I don't know how!
  formData.parse(req, async (err, fields, files) => {
    const reqData = JSON.parse(fields.trackData);
    req.body.trackData = reqData;
    
    // const result = await Joi.validate(req.body.trackData, schema);
    const errors = await trackSchema.validate(req.body.data.trackData);

    // if (result.error) return res.status(400).send(result.error.details[0].message);
    if (errors.length > 0) return res.status(400).send(errors);

    /*
    // Generating track id
    let trackID = getRandomID('track_', 15);
    
    const ids = await pool.query('SELECT id FROM tracks');
    while (ids && ids.rows.find(id => id === trackID)) {
      trackID = getRandomID('track_', 15);
    }
    req.body.trackData.id = trackID;
    */
  });
  next();
},
upload.track.single('track'),
(req, res) => {
  delete req.body.trackData['']; // trackData gets '' property (!)
  const values = [
    req.file.id,
    req.authData.id,
    req.body.trackData,
    Date.now(),
  ];
  pool.query('INSERT INTO music(id, artist_id, data, sharing_date)' + 
             'VALUES ($1, $2, $3, $4)',
              values, (err, result) => {
    if (err) return res.status(500).send(err.stack);
    pool.query('UPDATE people SET tracks = array_append((SELECT tracks FROM people WHERE id = $2),' +
              '$1) WHERE id = $2', [req.file.id, req.authData.id], (err, result) => {
      if (err) return res.status(500).send(err.stack);
      res.json({ id: req.file.id, message: 'Track added successfully.' });
    });
  });
});

router.post('/:id/comment', checkAuth, (req, res) => {
  const comment = req.body.comment;
  // [Validation]
  // getting comments to find out avaliable id for new comment
  pool.query('SELECT comments FROM music where id = $1', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    let id = 0;
    const comments = result.rows[0].comments;
    if (comments.length > 0) {
      const ids = [];
      // getting an array of ids
      comments.forEach(cm => {
        ids.push(cm.id);
      })
      // finding out smallest avaliable id
      if (ids) while (ids.includes(id)) id++;
    }
    // set comment id
    comment.id = id;
    pool.query('UPDATE music SET comments = array_append(comments, $2) where id = $1', [req.params.id, comment], (err, result) => {
      if (err) return res.status(500).send(err.stack);
      res.send('Comment added successfully.');
    })
  })
});

router.delete('/:id/comment/:cm_id', checkAuth, (req, res) => {
  pool.query('SELECT comments FROM music where id = $1', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    let comments = result.rows[0].comments;
    let i = 0;
    while (i < comments.length && comments[i].id != req.params.cm_id) i++;
    comments.splice(i, 1);
    pool.query('UPDATE music SET comments = $2 where id = $1', [req.params.id, comments], (err, result2) => {
      if (err) return res.status(500).send(err.stack);
      res.json({
        message: 'Deleted comment successfully.',
        comments: comments,
      });
    });
  });
});

router.put('/:id/comment/:cm_id/reply', checkAuth, (req, res) => {
  pool.query('SELECT comments FROM music where id = $1', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err.stack);
    const comments = result.rows[0].comments;
    comments.forEach(cm => {
      if (cm.id = req.params.cm_id) cm.answer = req.body.answer;
    });
    pool.query('UPDATE music SET comments = $2 where id = $1', [req.params.id, comments], (err, result2) => {
      if (err) return res.status(500).send(err.stack);
      res.send('Added reply successfully.')
    });
  });
});

router.put('/:id/change-image', upload.trackImage.single('image'), (req, res) => {
  res.send('Track image updated successfully.');
});

router.put('/:id/remove-image', checkAuth , async (req, res) => {
  try {
    // Remove image file
    fs.unlinkSync(`./images/tracks/${req.params.id}.jpg`);
    res.send('Track image removed successfully.');
  }
  catch (err) {
    res.status(500).send(err);
  }
});

// unused
router.get('/:id/has-image', (req, res) => {
  const exists = fs.existsSync(`./images/tracks/${req.params.id}.jpg`);
  res.json({ hasImage: exists });
});

router.put('/:id', checkAuth, (req, res) => {
  // Validation
  const trackSchema = new Schema({
    name: {
      type: String,
      required: true,
      length: { min: 2, max: 100 }
    },
    discription: {
      type: String,
      length: { max: 200 }
    },
    genre: {
      type: String
    },
    place: {
      type: String
    }
  });
  trackSchema.message({
    required: (path) => `${path} can not be empty.`
  });
  const errors = trackSchema.validate(req.body.data.trackData);
  if (errors.length > 0) return res.status(400).send(errors[0]);

  pool.query('UPDATE music SET data = $2, next_id = $3 WHERE id = $1', [req.params.id, req.body.data.trackData, req.body.data.nextTracks])
    .then(() => res.send('Edited track data successfully.'))
    .catch(err => res.status(400).send(err));
});

router.delete('/:id', checkAuth, async (req, res) => {
  let track;
  try {
    const result = await pool.query('SELECT * FROM music WHERE id = $1', [req.params.id]);
    if (result.rows.length < 1) return res.status(404).json({ message: 'Track not found.' });
    track = result.rows[0];

    // Deleting .mp3 file
    try {
      fs.unlinkSync(`./tracks/${req.params.id}.mp3`);
      const hasImage = fs.existsSync(`./images/tracks/${req.params.id}.jpg`);
      if (hasImage) fs.unlinkSync(`./images/tracks/${req.params.id}.jpg`);
    }
    catch (err) {
      // return res.status(400).send(err);
    }
    // Removing track id from artist tracks list
    await pool.query('UPDATE people SET tracks = array_remove((SELECT tracks FROM people ' + 
    'WHERE id = $2), $1) WHERE id = $2', [req.params.id, track.artist_id]);
    // Removing track id from people's likes
    track.likes.forEach(async (id) => {
      await pool.query('UPDATE people SET likes = array_remove((SELECT likes FROM people ' +
      'WHERE id = $1), $2) WHERE id = $1', [id, track.id]);
    });
    // Removing track from music database
    await pool.query('DELETE FROM music WHERE id = $1', [req.params.id]);

    res.send('Deleted track successfully.');
  }
  catch (err) {
    if (err) return res.status(500).send(err);
  }
});

router.post('/:id/like', checkAuth, async (req, res) => {
  const trackID = req.params.id;
  const authID = req.authData.id;

  try {
    // Check if track avaliable and not been liked from person yet
    const track = await pool.query('SELECT likes FROM music WHERE id = $1', [trackID]);
    if (track.rows.length < 1) return res.status(404).json({ message: 'Track not found.' });
    else if (track.rows[0].likes.includes(authID)) return res.status(400).json({ message: 'Already added.' });

    // Check if person exists and not liked track yet
    const person = await pool.query('SELECT likes FROM people WHERE id = $1', [authID]);
    if (person.rows.length < 1) return res.status(404).json({ message: 'Person not found.' });
    else if (person.rows[0].likes.includes(trackID)) return res.status(400).json({ message: 'Already liked.' });

    // Add person's id to track likes
    await pool.query('UPDATE music SET likes = array_append((SELECT likes FROM music ' +
    'WHERE id = $1), $2) WHERE id = $1', [trackID, authID]);

    // Add track id to person's likes
    await pool.query('UPDATE people SET likes = array_append((SELECT likes FROM people ' +
    'WHERE id = $1), $2) WHERE id = $1', [authID, trackID]);

    res.json({ message: 'Successfully added like.' });

  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/:id/dislike', checkAuth, async (req, res) => {
  const trackID = req.params.id;
  const authID = req.authData.id;

  try {
    // Check if track avaliable and been liked from person
    const track = await pool.query('SELECT likes FROM music WHERE id = $1', [trackID]);
    if (track.rows.length < 1) return res.status(404).json({ message: 'Track not found.' });
    else if (!track.rows[0].likes.includes(authID)) return res.status(400).json({ message: 'Track not been added yet.' });

    // Check if person exists and has liked track
    const person = await pool.query('SELECT likes FROM people WHERE id = $1', [authID]);
    if (person.rows.length < 1) return res.status(404).json({ message: 'Person not found.' });
    else if (!person.rows[0].likes.includes(trackID)) return res.status(400).json({ message: 'Track not been added yet.' });

    // Remove person's id from track likes
    await pool.query('UPDATE music SET likes = array_remove((SELECT likes FROM music ' + 
    'WHERE id = $1), $2) WHERE id = $1', [trackID, authID]);

    // Remove track id from person's likes
    await pool.query('UPDATE people SET likes = array_remove((SELECT likes FROM people ' +
    'WHERE id = $1), $2) WHERE id = $1', [authID, trackID]);

    res.json({ message: 'Successfully removed like.' });

  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
