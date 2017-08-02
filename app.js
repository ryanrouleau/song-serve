const express = require('express'),
  bodyParser = require('body-parser'),
  apiRouter = require('./api/api-router'),
  verbose = require('./lib/verbose'),
  spotify = require('./lib/spotify-api'),
  cors = require('cors'),
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

// intercept all requests and print request to console if verbose
app.all('/*', (req, res, next) => {
  if (verbose) {
    console.log(`method: ${req.method} -> route: ${req.url} -> body: ${req.body}`);
  }
  next();
});

// root route is handled here
app.get('/', (req, res) => {
  res.send(`
    <br />
    <h1>yoooo!!! shiieeeeet you at the root bro!!!</1>
    <br />
    <br />
    <h2>the front end static files will be served here</h2>
  `);
});

// all api routes are handled by /api/router.js
app.use('/api', apiRouter);

const server = app.listen(3000, () => {
  console.log('Song Serve listening on port 3000...')
});

// set http timeout to 30 minutes for long dir adding
server.timeout = 1800000;
