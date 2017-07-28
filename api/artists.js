const router = require('express').Router(),
  db = require('../db/db.js');

router.get('/', (req, res) => {
  genArtistsResponse().then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err.message
    })
  });
});

const genArtistsResponse = () => {
  return new Promise((resolve, reject) => {
    let responseToClient = {};
    db.serialize(() => {
      db.get('SELECT COUNT(ROWID) FROM artists', (err, row) => {
        responseToClient.numberOfArtists = row['COUNT(ROWID)'];
      });
      db.all('SELECT ROWID, * FROM artists', (err, rows) => {
        responseToClient.artists = [];
        rows.forEach(row => {
          responseToClient.artists.push({
            artistId: row.rowid,
            artistName: row.name,
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
        responseToClient.artists.sort((a, b) => {
          let nameA = a.artistName.toLowerCase();
          let nameB = b.artistName.toLowerCase();
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
