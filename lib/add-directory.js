const verbose = require('./verbose'),
  walk = require('walk'),
  fs = require('fs'),
  joinPaths = require('path.join'),
  mm = require('music-metadata'),
  aa = require('album-art'),
  db = require('../db/db.js');


const addDirectory = req => {
  return new Promise((resolve, reject) => {
    let dirPath = req.body.absolutePath;
    if (typeof dirPath === 'undefined') return reject('JSON misformatted. Check request');

    addDirToDB(dirPath).then(dirId => {
      return initLibraryForDBInsertion(dirId, dirPath);
    })
    .then(addAlbumArtToLibrary)
    .then(addAlbumsAndArtistsToDB)
    .then(addSongsToDB)
    .then(library => {
      let numSongsAdded = Object.keys(library.songs).length;
      let numAlbumsAdded = Object.keys(library.albums).length;
      let numArtistsAdded = Object.keys(library.artists).length;
      console.log('~~~~~~~~~~~');
      console.log(`Added ${numSongsAdded} songs.`);
      console.log(`Added ${numAlbumsAdded} albums.`);
      console.log(`Added ${numArtistsAdded} artists.`);
      return resolve({
        numSongsAdded: numSongsAdded,
        numAlbumsAdded: numAlbumsAdded,
        numArtistsAdded: numArtistsAdded
      });
    })
    .catch(err => {
      return reject(err);
    });
  });
}


const addDirToDB = dirPath => {
  return new Promise((resolve, reject) => {
    isInDB('dirs', 'path', dirPath)
    .then(alreadyInDB => {
      if (!alreadyInDB) {
        db.serialize(() => {
          db.run('INSERT INTO dirs VALUES(?)', dirPath, err => {
            if (err) return reject(err);
          });
          db.get('SELECT ROWID FROM dirs WHERE path = ?', dirPath, (err, row) => {
            if (err) return reject(err);
            return resolve(row.rowid);
          });
        });
      }
      else return reject('Directory already in DB')
    });
  });
}


const initLibraryForDBInsertion = (dirId, dirPath) => {
  return new Promise((resolve, reject) => {
    let albums = {};
    let artists = {};
    let songs = {};
    let walker = walk.walk(dirPath, {followLinks: false});
    if (verbose) {
      console.log(`Scanning for songs at root: ${dirPath}`);
      console.time('Scanning complete in');
    }
    walker.on("file", (root, fileStats, next) => {
      let fullPath = joinPaths(root, fileStats.name);
      mm.parseFile(fullPath).then(metadata => {
        return new Promise(resolve => {
          metadata = metadata.common;
          if ((typeof metadata.albumartist !== 'undefined' || metadata.artist !== 'undefined')
          && typeof metadata.album !== 'undefined') {

            artists[metadata.artist] = {
              id: '',
              dirId
            };

            let albumArtist = metadata.albumartist;
            if (typeof albumArtist === 'undefined') albumArtist = metadata.artist;
            albums[metadata.album] = {
              albumArtist: albumArtist,
              artSmall: 'undefined',
              artLarge: 'undefined',
              artMega: 'undefined',
              id: '',
              dirId: dirId
            };

            songs[metadata.title] = {
              album: metadata.album,
              albumId: '',
              artist: metadata.artist,
              artistId: '',
              year: metadata.year,
              filePath: fullPath,
              dirId: dirId
            }

            resolve();
          }
          else {
            if (verbose) console.log(`  ${metadata.title} does not have enough metadata, ignoring...`);
            resolve();
          }
        });
      })
      .catch(err => {
        if (err.message !== 'Extension .py not supported.') {
          console.log(err.message);
        }
      })
      .then(() => next());
    });
    walker.on("end", () => {
      if (verbose) console.timeEnd('Scanning complete in');
      resolve({
        albums: albums,
        artists: artists,
        songs: songs
      });
    });
  });
};

// add artist images to artist table as well
const addAlbumArtToLibrary = library => {
  return new Promise((resolve, reject) => {
    let num = 0;
    if (verbose) {
      console.log('Getting album art from last.fm...');
      console.time('Got all album art in');
    }
    promises = Object.keys(library.albums).map(album => {
      return getAlbumArtUrls(library.albums[album]['albumArtist'], album);
    });
    Promise.all(promises).then(allUrls => {
      allUrls.forEach(urlObj => {
        let albumInfo = library.albums[urlObj.album];
        albumInfo['artSmall'] = urlObj['large'];
        albumInfo['artLarge'] = urlObj['extralarge'];
        albumInfo['artMega'] = urlObj['mega'];
      });
      if (verbose) console.timeEnd('Got all album art in');
      return resolve(library);
    });
  });
}


const addAlbumsAndArtistsToDB = library => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      if (verbose) {
        console.log('Inserting albums and artists into DB...');
        console.time('Insertion took');
      }
      db.run('BEGIN TRANSACTION');
      Object.keys(library.albums).forEach(album => {
        let albumInfo = library.albums[album];
        db.run(
          'INSERT INTO albums VALUES(?, ?, ?, ?, ?, ?)',
          album,
          albumInfo.albumArtist,
          albumInfo.artSmall,
          albumInfo.artLarge,
          albumInfo.artMega,
          albumInfo.dirId
        );
      });
      db.run('COMMIT');
      db.run('BEGIN TRANSACTION');
      Object.keys(library.artists).forEach(artist => {
        let artistInfo = library.artists[artist];
        db.run('INSERT INTO artists VALUES(?, ?)', artist, artistInfo.dirId);
      });
      db.run('COMMIT');

      db.all('SELECT name, ROWID FROM albums', (err, rows) => {
        if (err) return reject(err);
        rows.forEach(row => {
          library.albums[row.name]['id'] = row.rowid;
        });
      });

      db.all('SELECT name, ROWID FROM artists', (err, rows) => {
        if (err) return reject(err);
        rows.forEach(row => {
          library.artists[row.name]['id'] = row.rowid;
        });
        if (verbose) console.timeEnd('Insertion took');
        resolve(library);
      });
    });
  });
}


const addSongsToDB = library => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {

      if (verbose) {
        console.log('Inserting songs into DB...');
        console.time('Insertion took');
      }

      db.run('BEGIN TRANSACTION');
      Object.keys(library.songs).forEach(song => {
        let songInfo = library.songs[song];
        let albumInfo = library.albums;
        let artistInfo = library.artists;
        db.run(
          'INSERT INTO songs VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
          song,
          songInfo.album,
          albumInfo[songInfo.album].id,
          songInfo.artist,
          artistInfo[songInfo.artist].id,
          songInfo.year,
          songInfo.filePath,
          songInfo.dirId
        )
      });
      db.run('END');

      db.get('SELECT * FROM dirs', (err, row) => {
        if (verbose) console.timeEnd('Insertion took');
        resolve(library);
      });

    });
  });
}


const isInDB = (table, col, toMatch) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${table} WHERE ${col} = "${toMatch}"`, (err, row) => {
      if (err) return reject(err);
      if (typeof row === 'undefined') return resolve(false);
      else return resolve(true);
    });
  })
}


const getAlbumArtUrls = (artist, album) => {
  return new Promise((resolve, reject) => {
    sizes = ['large', 'extralarge', 'mega'];
    promises = [];
    sizes.forEach(size => {
      promises.push(createAlbumArtAjaxPromise(artist, album, size));
    });
    Promise.all(promises).then(urlInfo => {
      // transform urlInfo from [{size: <size>, url: <url>},{...},{...}]
      // to {large: <url to large>, extralarge: <url to extralarge, ...}
      let artUrls = {};
      urlInfo.forEach(urlObj => {
        artUrls[urlObj.size] = urlObj.url;
      });
      artUrls['album'] = album;
      //console.log(`${album}: ${artUrls['large']}`);
      return resolve(artUrls);
    });
  });
}


const createAlbumArtAjaxPromise = (artist, album, size) => {
  return new Promise((resolve, reject) => {
    aa(artist, album, size, (err, url) => {
      //if (err) return reject(err);
      return resolve({
        size: size,
        url: url
      });
    });
  });
}

module.exports = addDirectory;
