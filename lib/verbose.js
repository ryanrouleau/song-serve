// setting verbose to true if corresponding command line arg passed in
module.exports = false;
process.argv.forEach( (val, i, arr) => {
    if (val === '--verbose' || val === '-v') {
        module.exports = true;
    }
});
