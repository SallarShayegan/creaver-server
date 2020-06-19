const multer = require('multer');
const dbconfig = require('../database/dbconfig');
const { Pool } = require('pg');
const { getRandomID } = require('../functions/globalFunctions');

const pool = new Pool(dbconfig);

// profile image upload configuration
const profileImagesStorage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, './images/profiles/'),
  filename: (req, file, callback) => {
    // callback(null, req.params.id + '.jpg');
    callback(null, req.authData.id + '.jpg');
  },
});

// track upload configuration
const tracksStorage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, './tracks'),
  filename: (req, file, callback) => {
    
    let trackID = getRandomID('track_', 15);
    pool.query('SELECT id FROM tracks', (err, result) => {
      while (result && result.rows.find(id => id === trackID)) {
        trackID = getRandomID('track_', 15);
      }
      file.id = trackID;
      callback(null, trackID + '.mp3');
    });
    
    // callback(null, req.body.trackData.id + '.mp3');
  },
});

// track image upload configuration
const trackImagesStorage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, './images/tracks/'),
  filename: (req, file, callback) => {
    callback(null, req.params.id + '.jpg');
  },
});

const uploadConfig = {

  profileImage: multer({
    storage: profileImagesStorage,
    limits: { fileSize: 1025 * 1025 * 5 },
    fileFilter: (req, file, callback) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  }),

  track: multer({
    storage: tracksStorage,
    limits: { fileSize: 1025 * 1025 * 10 },
    // fileFilter: (req, file, callback) => {},
  }),

  trackImage: multer({
    storage: trackImagesStorage,
    limits: { fileSize: 1025 * 1025 * 5 },
    fileFilter: (req, file, callback) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  }),

}

module.exports = uploadConfig;