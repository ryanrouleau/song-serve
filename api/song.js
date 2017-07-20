const router = require('express').Router(),
  db = require('../db/db.js'),
  fs = require('fs'),
  util = require('util');


router.get('/:id', (req, res) => {
  getSongFile(req.params.id).then(filePath => {
    res.sendFile(filePath);
  })
  .catch(err => {
    res.send({
      err: err
    })
  });
});


const getSongFile = songId => {
  return new Promise((resolve, reject) => {
    db.get('SELECT filePath FROM songs WHERE ROWID = ?', songId, (err, row) => {
      if (typeof row === 'undefined') return reject('Song not in library');
      return resolve(row.filePath);
    });
  });
}


module.exports = router;
