const verbose = require('./verbose'),
  walk = require('walk'),
  fs = require('fs'),
  joinPaths = require('path.join'),
  mm = require('music-metadata'),
  db = require('../db/db.js'),
  spotify = require('./spotify-api.js'),
  vibrant = require('node-vibrant');

// ms delay between Spotify API requests when many are needed
// => 0.1s is good balance between speed & avoiding rate limiting
const SPOTIFY_REQUEST_INTERVAL = 100;

const addDirectory = req => {
  return new Promise((resolve, reject) => {
    let dirPath = req.body.absolutePath;
    if (typeof dirPath === 'undefined') return reject('JSON misformatted. Check request');

    addDirToDB(dirPath).then(dirId => {
      return initLibraryForDBInsertion(dirId, dirPath);
    })
    .then(addAlbumArtToLibrary)
    .then(addAlbumArtPalettesToLibrary)
    .then(addArtistArtToLibrary)
    .then(addArtistArtPalettesToLibrary)
    .then(addAlbumsAndArtistsToDB)
    .then(addSongsToDB)
    .then(createResponseToClient)
    .then(responseToClient => {
      return resolve(responseToClient)
    })
    .catch(err => {
      console.log(err);
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

            let artist = typeof metadata.artist === 'undefined' ? metadata.albumartist : metadata.artist;
            artists[artist] = {
              id: '',
              artSmall: 'undefined',
              artLarge: 'undefined',
              artMega: 'undefined',
              dirId
            };

            let albumArtist = typeof metadata.albumartist === 'undefined' ? metadata.artist : metadata.albumartist;
            albums[metadata.album] = {
              albumArtist: albumArtist,
              artSmall: 'undefined',
              artLarge: 'undefined',
              artMega: 'undefined',
              artPalette: {
                Vibrant: 'undefined',
                LightVibrant: 'undefined',
                DarkVibrant: 'undefined',
                Muted: 'undefined',
                LightMuted: 'undefined',
                DarkMuted: 'undefined',
              },
              id: '',
              dirId: dirId
            };

            songs[metadata.title] = {
              album: metadata.album,
              albumId: '',
              artist: artist,
              artistId: '',
              year: metadata.year,
              filePath: fullPath,
              artPalette: {
                Vibrant: 'undefined',
                LightVibrant: 'undefined',
                DarkVibrant: 'undefined',
                Muted: 'undefined',
                LightMuted: 'undefined',
                DarkMuted: 'undefined',
              },
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


const addAlbumArtToLibrary = library => {
  return new Promise((resolve, reject) => {
    if (verbose) {
      console.log('Getting album art from Spotify...');
      console.time('Got all album art in');
    }

    let waitTime = 0;

    let artPromises = Object.keys(library.albums).map(album => {
      waitTime += SPOTIFY_REQUEST_INTERVAL;
      return spotify.searchAlbum(album, waitTime);
    });

    Promise.all(artPromises).then(allResponses => {
      allResponses.forEach(response => {
        let albumInfo = library.albums[response.album];
        if (response.body === null ||
            typeof response.body.albums.items[0] === 'undefined' ||
            typeof response.body.albums.items[0].images === 'undefined' ||
            response.body.albums.items[0].images.length < 3)
        {
          albumInfo['artMega'] = 'undefined';
          albumInfo['artLarge'] = 'undefined';
          albumInfo['artSmall'] = 'undefined';
        }
        else {
          let art = response.body.albums.items[0].images;
          albumInfo['artMega'] = art[0].url;
          albumInfo['artLarge'] = art[1].url;
          albumInfo['artSmall'] = art[2].url;
        }
      });
      if (verbose) console.timeEnd('Got all album art in');
      return resolve(library);
    })
    .catch(err => {
      console.log(err);
    });
  });
}


const addAlbumArtPalettesToLibrary = library => {
  return new Promise((resolve, reject) => {
    if (verbose) {
      console.log('Generating color palettes for album art...');
      console.time('Generated color palettes for album art in');
    }
    let palettePromises = Object.keys(library.albums).map(album => {
      return createColorPalette(library.albums[album]['artLarge'], album);
    });
    Promise.all(palettePromises).then(allPalettes => {
      allPalettes.forEach(palette => {
        library.albums[palette.meta].artPalette = palette;
      });
      console.timeEnd('Generated color palettes for album art in');
      return resolve(library);
    })
    .catch(err => {
      console.error(err);
    });
  });
}


const addArtistArtToLibrary = library => {
  return new Promise((resolve, reject) => {
    if (verbose) {
      console.log('Getting artist art from Spotify...');
      console.time('Got all artist art in');
    }

    let waitTime = 0;

    promises = Object.keys(library.artists).map(artist => {
      waitTime += SPOTIFY_REQUEST_INTERVAL;
      return spotify.searchArtist(artist, waitTime);
    });

    Promise.all(promises).then(allResponses => {
      allResponses.forEach(response => {
        let artistInfo = library.artists[response.artist];
        if (response.body === null ||
            typeof response.body.artists.items[0] === 'undefined' ||
            typeof response.body.artists.items[0].images === 'undefined' ||
            response.body.artists.items[0].images.length < 3)
        {
          artistInfo['artMega'] = 'undefined';
          artistInfo['artLarge'] = 'undefined';
          artistInfo['artSmall'] = 'undefined';
        }
        else {
          let art = response.body.artists.items[0].images;
          artistInfo['artMega'] = art[0].url;
          artistInfo['artLarge'] = art[1].url;
          artistInfo['artSmall'] = art[2].url;
        }
      });
      if (verbose) console.timeEnd('Got all artist art in');
      return resolve(library);
    })
    .catch(err => {
      console.log(err);
    })
  });
}


const addArtistArtPalettesToLibrary = library => {
  return new Promise((resolve, reject) => {
    if (verbose) {
      console.log('Generating color palettes for artist art...');
      console.time('Generated color palettes for artist art in');
    }
    let palettePromises = Object.keys(library.artists).map(artist => {
      return createColorPalette(library.artists[artist]['artLarge'], artist);
    });
    Promise.all(palettePromises).then(allPalettes => {
      allPalettes.forEach(palette => {
        library.artists[palette.meta].artPalette = palette;
      });
      console.timeEnd('Generated color palettes for artist art in');
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
        db.run('INSERT INTO albums VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          album,
          albumInfo.albumArtist,
          albumInfo.artSmall,
          albumInfo.artLarge,
          albumInfo.artMega,
          albumInfo.artPalette.Vibrant,
          albumInfo.artPalette.LightVibrant,
          albumInfo.artPalette.DarkVibrant,
          albumInfo.artPalette.Muted,
          albumInfo.artPalette.LightMuted,
          albumInfo.artPalette.DarkMuted,
          albumInfo.dirId
        );
      });
      db.run('COMMIT');
      db.run('BEGIN TRANSACTION');
      Object.keys(library.artists).forEach(artist => {
        let artistInfo = library.artists[artist];
        db.run('INSERT INTO artists VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          artist,
          artistInfo.artSmall,
          artistInfo.artLarge,
          artistInfo.artMega,
          artistInfo.artPalette.Vibrant,
          artistInfo.artPalette.LightVibrant,
          artistInfo.artPalette.DarkVibrant,
          artistInfo.artPalette.Muted,
          artistInfo.artPalette.LightMuted,
          artistInfo.artPalette.DarkMuted,
          artistInfo.dirId
        );
      });
      db.run('COMMIT');

      db.all('SELECT name, ROWID FROM albums', (err, rows) => {
        if (err) return reject(err);
        rows.forEach(row => {
          if (typeof library.albums[row.name] !== 'undefined') library.albums[row.name]['id'] = row.rowid;
        });
      });

      db.all('SELECT name, ROWID FROM artists', (err, rows) => {
        if (err) return reject(err);
        rows.forEach(row => {
          if (typeof library.albums[row.name] !== 'undefined') library.artists[row.name]['id'] = row.rowid;
        });
        if (verbose) console.timeEnd('Insertion took');
        return resolve(library);
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
          artistInfo[songInfo.artist].id, // artistId corresponds to first artist
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


const createResponseToClient = library => {
  return new Promise((resolve, reject) => {
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


const createColorPalette = (url, meta) => {
  return new Promise((resolve, reject) => {
    if (url !== 'undefined') {
      vibrant.from(url).getPalette((err, palette) => {
        let minPalette = {};
        Object.keys(palette).forEach(swatch => {
          if (palette[swatch]) {
            minPalette[swatch] = palette[swatch]._rgb.toString();
          }
          else {
            minPalette[swatch] = 'undefined';
          }
        });
        minPalette['meta'] = meta;
        return resolve(minPalette);
      });
    }
    else {
      let minPalette = {
        Vibrant: 'undefined',
        LightVibrant: 'undefined',
        DarkVibrant: 'undefined',
        Muted: 'undefined',
        LightMuted: 'undefined',
        DarkMuted: 'undefined',
      };
      minPalette['meta'] = meta;
      return resolve(minPalette);
    }
  });
}


module.exports = addDirectory;
