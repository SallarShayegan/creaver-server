const express = require('express');
const people = require('./routes/people');
const tracks = require('./routes/tracks');
const auth = require('./routes/auth');
const cors = require('cors');

const app = express();

app.use(express.json());

app.use(cors());

app.use('/images/profiles/', express.static('images/profiles'));
app.use('/images/tracks/', express.static('images/tracks'));
app.use('/tracks', express.static('tracks'));

app.use('/api/auth', auth);
app.use('/api/people', people);
app.use('/api/tracks', tracks);

module.exports = app;
