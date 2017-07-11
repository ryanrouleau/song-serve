const verbose = require('./verbose'),
  walk = require('walk'),
  fs = require('fs'),
  path = require('path'),
  mm = require('music-metadata'),
  aa = require('album-art');

addDirectory = (req, callback) => {
  return new Promise((resolve, reject) => {
    if (true) {
      // if directory already in db then reject
      return reject('Dir already exists in music library!!');
    }
    //ensure absolutePath is defined in req first, if not, then reject3
    let path = req.body.absolutePath;
    let walker = walk.walk( path, { followLinks: false } );
    if (verbose) {
      console.time('walk complete in');
      console.log(`file walk started on ${path}`);
    }
    let response = [];
    walker.on("file", (root, fileStats, next) => {
      if (verbose) console.log(fileStats.name);

      mm.parseFile(`${root}/${fileStats.name}`).then((metadata) => {
        addSongTotable(metadata.common);
      })
      .catch((err) => {
        // if err just ignore and continue
        console.log(err);
      });
      next();
    });
    walker.on("end", () => {
      if (verbose) console.timeEnd('walk complete in');
      return resolve(response);
    });
  });
}

num = 0;
addSongTotable = (metadata) => {
  if (num > 15) {
    return;
  }
  num++;
  // check if album already exists, if it does then skip grabbing album art
  if (typeof metadata.albumartist !== 'undefined' && typeof metadata.album !== 'undefined') {
    getAlbumArtUrls(metadata.albumartist, metadata.album).then((artUrls) => {
      console.log(`${metadata.albumartist} --> ${metadata.album} --> `);
      console.log(artUrls);
    }, (err) => {
      console.log(`ERROR ERROR ERROR: ${err}`);
    });
  }
  else {
    // handle no album art work
    console.log(`${metadata.title} has no artist or album info`);
  }
}

getAlbumArtUrls = (artist, album) => {
  return new Promise((resolve, reject) => {
    let promises = [];
    promises.push(createAlbumArtAjaxPromise(artist, album, 'large'));
    promises.push(createAlbumArtAjaxPromise(artist, album, 'extralarge'));
    promises.push(createAlbumArtAjaxPromise(artist, album, 'mega'));
    Promise.all(promises).then((urlInfo) => {
      // transform urlInfo from [{size: <size>, url: <url>},{...},{...}]
      // to artUrls -> {large: <url to large>, extralarge: <url to extralarge, ...}
      // and resolve that
      let artUrls = {};
      urlInfo.forEach((urlObj) => {
        artUrls[urlObj.size] = urlObj.url;
      });
        resolve(artUrls);
      }, (err) => {
        console.log(err);
        reject(err);
    });
  });
}

createAlbumArtAjaxPromise = (artist, album, size) => {
    return new Promise((resolve, reject) => {
        aa(artist, album, size, (err, url) => {
            if (err) {
                consle.log('OH FUCK !');
                return reject(err);
            }
            urlInfo = {
                size: size,
                url: url
            }
            resolve(urlInfo);
        });
    });
}

module.exports = addDirectory;
