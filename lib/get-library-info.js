const verbose = require('./verbose'),
  db = require('../db/db.js');

const getLibraryInfo = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      let responseToClient = {};
      db.get('SELECT COUNT(ROWID) FROM songs', (err, row) => {
        responseToClient.numSongs = row['COUNT(ROWID)'];
      });
      db.get('SELECT COUNT(ROWID) FROM albums', (err, row) => {
        responseToClient.numAlbums = row['COUNT(ROWID)'];
      });
      db.get('SELECT COUNT(ROWID) FROM artists', (err, row) => {
        responseToClient.numArtists = row['COUNT(ROWID)'];
      });
      db.all('SELECT ROWID, path FROM dirs', (err, rows) => {
        responseToClient.numDirs = rows.length;
        responseToClient.dirs = [];
        rows.forEach(row => {
          let dirsObj = {};
          dirsObj.absolutePath = row.path;
          dirsObj.dirId = row.rowid;
          responseToClient.dirs.push(dirsObj);
        });
        return resolve(responseToClient);
      });
    })
  })
}

module.exports = getLibraryInfo;
