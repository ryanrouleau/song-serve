const router = require('express').Router(),
  verbose = require('../lib/verbose'),
  addDirectory = require('../lib/add-directory');

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

module.exports = router;
