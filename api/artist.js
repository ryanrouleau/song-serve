const router = require('express').Router();

router.get('/:id', (req, res) => {
  res.send(`${req.method} -> ${req.baseUrl} -> artist id: ${req.params.id}`);
});

module.exports = router;
