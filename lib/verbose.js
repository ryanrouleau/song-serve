// setting verbose to true if corresponding command line arg passed in
// verbose bool is used throughout project to have the option of printing debug info to console
module.exports = false;
process.argv.forEach( (val, i, arr) => {
    if (val === '--verbose' || val === '-v') {
        module.exports = true;
    }
});
