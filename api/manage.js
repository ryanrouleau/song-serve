const router = require('express').Router(),
  verbose = require('../lib/verbose'),
  getLibraryInfo = require('../lib/get-library-info'),
  addDirectory = require('../lib/add-directory'),
  removeDirectory = require('../lib/remove-directory');

router.get('/', (req, res) => {
  getLibraryInfo().then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err
    })
  })
});

router.put('/', (req, res) => {
  addDirectory(req).then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err
    });
  });
});

router.delete('/', (req, res) => {
  removeDirectory(req).then(responseToClient => {
    res.send(responseToClient);
  })
  .catch(err => {
    res.send({
      err: err
    })
  })
});

module.exports = router;
