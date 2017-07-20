const router = require('express').Router(),
  db = require('../db/db.js');


router.get('/', (req, res) => {
  genSongsResponse().then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err.message
    });
  });
});


const genSongsResponse = () => {
  return new Promise((resolve, reject) => {
    let responseToClient = {};
    db.serialize(() => {
      db.get('SELECT COUNT(ROWID) FROM songs', (err, row) => {
        responseToClient.numberOfSongs = row['COUNT(ROWID)'];
      })
      db.all('SELECT ROWID, * FROM songs', (err, rows) => {
        responseToClient.songs = [];
        rows.forEach(row => {
          responseToClient.songs.push({
            songId: row.rowid,
            songName: row.name,
            artist: row.artist,
            artistId: row.artistId,
            album: row.album,
            albumId: row.albumId,
            year: row.year,
            filePath: row.filePath,
            dirId: row.dirId
          });
        });
        return resolve(responseToClient);
      });
    });
  });
}

module.exports = router;
