const router = require('express').Router(),
  db = require('../db/db.js');


router.get('/:id', (req, res) => {
  genAlbumResponse(req.params.id).then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err.message
    })
  });
});


const genAlbumResponse = albumId => {
  return new Promise((resolve, reject) => {
    if (typeof albumId === 'undefined') return reject('Request misformatted, check request.');
    let responseToClient = {};
    db.serialize(() => {
      db.get('SELECT COUNT(ROWID) FROM songs WHERE albumId = ?', albumId, (err, row) => {
        responseToClient.numberOfSongs = row['COUNT(ROWID)'];
      });
      db.all('SELECT ROWID, * FROM songs WHERE albumId = ?', albumId, (err, rows) => {
        responseToClient.songs = [];
        rows.forEach(row => {
          responseToClient.songs.push({
            songId: row.rowid,
            songName: row.name,
            artist: row.artist,
            album: row.album,
            year: row.year
          });
        });
        return resolve(responseToClient);
      })
    });
  });
}

module.exports = router;
