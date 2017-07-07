const router = require('express').Router(),
    walk = require('walk'),
    fs = require('fs'),
    path = require('path'),
    verbose = require('../lib/verbose');

router.get('/', (req, res) => {
    res.send(`${req.method} -> ${req.baseUrl}`);
});

router.put('/', (req, res) => {
    let path = req.body.absolutePath;
    let walker = walk.walk( path, { followLinks: false } );
    if (verbose) {
        console.time('walk complete in');
        console.log(`file walk started on ${path}`);
    }
    let files = [];
    walker.on("file", (root, fileStat, next) => {
        files.push(fileStat.name);
        next();
    });
    walker.on("end", () => {
        if (verbose) {
            console.timeEnd('walk complete in');
        }
        res.send(`${files.join('\n')}`);
    });
});

router.delete('/', (req, res) => {
    res.send(`${req.method} -> ${req.baseUrl} -> delete ${req.body.absolutePath}`);
});

module.exports = router;
