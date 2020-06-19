const dbconfig = require('../database/dbconfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool(dbconfig);

module.exports.checkAuth = (req, res, next) => {
  try {
    const token = req.headers['authorization'];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.authData = decoded;
    pool.query('SELECT password FROM people WHERE id = $1', [decoded.id], (err, result) => {
      if (err) return res.status(500).send(err);
      const verified = decoded.password == result.rows[0].password; // needs improvement
      if (!verified) return res.status(401).json({ message: 'Wrong password!' });
      next();
    });
  }
  catch (err) {
    return res.status(401).json({
      message: 'Auth failed.'
    });
  }
};
