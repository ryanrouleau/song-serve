const router = require('express').Router(),
    verbose = require('../lib/verbose'),
    addDirectory = require('../lib/addDirectory');

router.get('/', (req, res) => {
    res.send(`${req.method} -> ${req.baseUrl}`);
});

router.put('/', (req, res) => {
    addDirectory(req).then(responseToClient => {
        res.send(responseToClient);
    })
    .catch(err => {
        res.send(err);
    });
});

router.delete('/', (req, res) => {
    res.send(`${req.method} -> ${req.baseUrl} -> delete ${req.body.absolutePath}`);
});
/*
addDirectory = (req, callback) => {
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
            console.log(err);
        });

        next();
    });
    walker.on("end", () => {
        if (verbose) console.timeEnd('walk complete in');
        callback(response);
        //res.send(`${response.join('\n')}`);
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
            //console.log(size);
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
*/
module.exports = router;
