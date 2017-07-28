const router = require('express').Router(),
  db = require('../db/db.js');


router.get('/', (req, res) => {
  genAlbumsResponse().then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err.message
    });
  });
});


const genAlbumsResponse = () => {
  return new Promise((resolve, reject) => {
    let responseToClient = {};
    db.serialize(() => {
      db.get('SELECT COUNT(ROWID) FROM albums', (err, row) => {
        responseToClient.numberOfAlbums = row['COUNT(ROWID)'];
      })
      db.all('SELECT ROWID, * FROM albums', (err, rows) => {
        responseToClient.albums = [];
        rows.forEach(row => {
          responseToClient.albums.push({
            albumId: row.rowid,
            albumName: row.name,
            albumArtist: row.albumArtist,
            art: {
              small: row.artSmall,
              large: row.artLarge,
              mega: row.artMega
            },
            artPalette: {
              vibrant: row.vibrant,
              lightVibrant: row.lightVibrant,
              darkVibrant: row.darkVibrant,
              muted: row.muted,
              lightMuted: row.lightMuted,
              darkMuted: row.darkMuted
            }
          });
        });
        responseToClient.albums.sort((a, b) => {
          let nameA = a.albumName.toLowerCase();
          let nameB = b.albumName.toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
        return resolve(responseToClient);
      });
    });
  });
}

module.exports = router;
