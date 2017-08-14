const express = require('express'),
  bodyParser = require('body-parser'),
  apiRouter = require('./api/api-router'),
  verbose = require('./lib/verbose'),
  spotify = require('./lib/spotify-api'),
  cors = require('cors'),
  opn = require('opn');
  app = express();

process.argv.forEach( val => {
  if (val === '--help' || val === '-h') {
    console.log('\n  node app.js <spotify client id> <spotify client secret> <optional --verbose || -v>\n')
    process.exit(0);
  }
});

app.use(bodyParser.json());
app.use(cors())
app.options('*', cors());

opn('http://localhost:3000/')

// serve web player at root
app.use('/', express.static('public'));

// intercept all requests and print request to console if verbose
app.all('/*', (req, res, next) => {
  if (verbose) {
    console.log(`method: ${req.method} -> route: ${req.url} -> body: ${JSON.stringify(req.body)}`);
  }
  next();
});


// all api routes are handled by /api/router.js
app.use('/api', apiRouter);

const server = app.listen(3000, () => {
  console.log('Song Serve listening on port 3000...')
});

// set http timeout to 30 minutes for long dir adding
server.timeout = 1800000;
