const router = require('express').Router();

// library management
router.use('/manage', require('./manage.js'));

// album routes
router.use('/albums', require('./albums.js'));
router.use('/album', require('./album.js'));

// artist routes
router.use('/artists', require('./artists.js'));
router.use('/artist', require('./artist.js'));

// song routes
router.use('/song', require('./song.js'));

module.exports = router;
