const verbose = require('./verbose'),
  db = require('../db/db.js');

const removeDirectory = req => {
  return new Promise((resolve, reject) => {

    let dirId = req.body.dirId;
    if (typeof dirId === 'undefined') return reject('JSON misformatted. Check request');

    let responseToClient = {};

    db.serialize(() => {
      db.get('SELECT COUNT(ROWID) FROM songs WHERE dirId = ?', dirId, (err, row) => {
        responseToClient.numSongsDeleted = row['COUNT(ROWID)'];
      });
      db.get('SELECT COUNT(ROWID) FROM albums WHERE dirId = ?', dirId, (err, row) => {
        responseToClient.numAlbumsDeleted = row['COUNT(ROWID)'];
      });
      db.get('SELECT COUNT(ROWID) FROM artists WHERE dirId = ?', dirId, (err, row) => {
        responseToClient.numArtistsDeleted = row['COUNT(ROWID)'];
      });
      db.run('DELETE FROM songs WHERE dirId = ?', dirId);
      db.run('DELETE FROM albums WHERE dirId = ?', dirId);
      db.run('DELETE FROM artists WHERE dirId = ?', dirId);
      db.run('DELETE FROM dirs WHERE ROWID = ?', dirId, err => {
        console.log('test');
        console.dir(responseToClient);
        return resolve(responseToClient);
      });
    });
  })
}

module.exports = removeDirectory;
