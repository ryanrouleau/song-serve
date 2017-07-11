const sqlite3 = require('sqlite3'),
    db = new sqlite3.Database('db.sqlite3');

// create tables if they don't exist yet
db.serialize(function() {
    let createSongsTable = `
        CREATE TABLE IF NOT EXISTS songs (
            name TEXT,
            album TEXT,
            albumId TEXT,
            artist TEXT,
            artistId TEXT,
            year TEXT,
            filePath TEXT,
            dirId TEXT,
            artLrg TEXT,
            artExtrLrg TEXT,
            artMega TEXT
        )`;
    let createAlbumTable = `
        CREATE TABLE IF NOT EXISTS albums (
            name TEXT
        )`;
    let createArtistTable = `
        CREATE TABLE IF NOT EXISTS artists (
            name TEXT
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

    creationQueries.forEach( (query) => {
        db.run(query, (err) => {
            if (err) console.log(err);
        });
    });

    /*
    db.run(createTableQueries[0], (err) => {
        if (err) console.log(err);
    });

    var stmt = db.prepare("INSERT INTO test VALUES (?)");
    for (var i = 0; i < 10; i++) {
        stmt.run("Ipsum " + i);
    }
    db.run("DELETE FROM test WHERE col1='Ipsum 2'");
    db.run("INSERT INTO test VALUES ('test')", (err) => {
        if (err) console.log(err);
    });

    stmt.finalize();
    db.each('SELECT rowid AS id, col1 FROM test', (err, row) => {
        console.log(row);
    });
    */
});

module.exports = db;
