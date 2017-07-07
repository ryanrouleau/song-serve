const router = require('express').Router();

router.get('/', (req, res) => {
    res.send(`${req.method} -> ${req.baseUrl}`);
});

module.exports = router;
