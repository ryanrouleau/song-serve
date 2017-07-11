const express = require('express'),
    bodyParser = require('body-parser'),
    apiRouter = require('./api/apiRouter'),
    verbose = require('./lib/verbose'),
    app = express();

app.use(bodyParser.json());

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

app.listen(3000, () => {
    console.log('SoundServe listening on port 3000...')
});
