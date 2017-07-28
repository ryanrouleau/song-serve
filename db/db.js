const sqlite3 = require('sqlite3'),
  db = new sqlite3.Database('./db/db.sqlite3');

// create tables if they don't exist yet
db.serialize(() => {
  let createSongsTable = `
    CREATE TABLE IF NOT EXISTS songs (
      name TEXT,
      album TEXT,
      albumId TEXT,
      artist TEXT,
      artistId TEXT,
      year TEXT,
      filePath TEXT,
      dirId TEXT
    )`;
  let createAlbumTable = `
    CREATE TABLE IF NOT EXISTS albums (
      name TEXT,
      albumArtist TEXT,
      artSmall TEXT,
      artLarge TEXT,
      artMega TEXT,
      vibrant TEXT,
      lightVibrant TEXT,
      darkVibrant TEXT,
      muted TEXT,
      lightMuted TEXT,
      darkMuted TEXT,
      dirId TEXT
    )`;
  let createArtistTable = `
    CREATE TABLE IF NOT EXISTS artists (
      name TEXT,
      artSmall TEXT,
      artLarge TEXT,
      artMega TEXT,
      vibrant TEXT,
      lightVibrant TEXT,
      darkVibrant TEXT,
      muted TEXT,
      lightMuted TEXT,
      darkMuted TEXT,
      dirId TEXT
    )`;
  let createDirTable = `
    CREATE TABLE IF NOT EXISTS dirs (
      path TEXT
    )`;

  let creationQueries = [
    createSongsTable,
    createAlbumTable,
    createArtistTable,
    createDirTable
  ];

  creationQueries.forEach(query => {
    db.run(query, (err) => {
      if (err) console.log(err);
    });
  });
});

module.exports = db;
