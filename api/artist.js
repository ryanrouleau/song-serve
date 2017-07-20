const router = require('express').Router(),
  db = require('../db/db.js');


router.get('/:id', (req, res) => {
  genArtistResponse(req.params.id).then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err.message
    })
  })
});


const genArtistResponse = artistId => {
  return new Promise((resolve, reject) => {
    if (typeof artistId === 'undefined') return reject('Request misformatted, check request.');
    let responseToClient = {};
    db.serialize(() => {
      db.get('SELECT COUNT(ROWID) FROM songs WHERE artistId = ?', artistId, (err, row) => {
        if (err) return reject(err);
        responseToClient.numberOfSongs = row['COUNT(ROWID)'];
      });
      db.all('SELECT ROWID, * FROM songs WHERE artistId = ?', artistId, (err, rows) => {
        if (err) return reject(err);
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
      });
    });
  });
}


module.exports = router;
