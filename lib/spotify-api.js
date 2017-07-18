const request = require('request'),
  verbose = require('./verbose');

const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    let clientId = process.argv[2];
    let clientSecret = process.argv[3];
    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64'))
      },
      form: {
        grant_type: 'client_credentials'
      },
      json: true
    };
    request.post(authOptions, (err, response, body) => {
      if (!err && response.statusCode === 200) {
        var token = body.access_token;
        resolve(token);
      }
      else {
        console.log('Client it and/or client secret id are invalid.');
      }
    });
  });
}

const cache = fn => {
    var NO_RESULT = {}; // unique, would use Symbol if ES2015-able
    var res = NO_RESULT;
    return () => { // if ES2015, name the function the same as fn
        if(res === NO_RESULT) return (res = fn.apply(this, arguments));
        return res;
    };
}

const cachedAccessToken = cache(getAccessToken);

exports.searchAlbum = (album, waitTime) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      cachedAccessToken().then(token => {
        let searchableAlbum = album.replace(' ', '+');
        let payload = {
          url: `https://api.spotify.com/v1/search?q=${searchableAlbum}&type=album&limit=1`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
        if (verbose) console.log(`${album} art requested`);
        request(payload, (err, resp, body) => {
          if (!err && resp.statusCode === 200) {
            return resolve({
              album: album,
              body: JSON.parse(body)
            });
          }
          else {
            console.log(err);
            console.log(resp.statusCode);
            if (resp.statusCode === 429) {
              console.log('Spotify API rate limit reached');
            }
            return resolve({
              album: album,
              body: null
            });
          }
        });
      })
      .catch(err => {
        console.log('test1');
        console.log(err.message);
      });
    }, waitTime);
  });
}

exports.searchArtist = (artist, waitTime) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      cachedAccessToken().then(token => {
        let searchableArtist = artist.replace(' ', '+');
        let payload = {
          url: `https://api.spotify.com/v1/search?q=${searchableArtist}&type=artist&limit=1`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
        if (verbose) console.log(`${artist} art requested`);
        request(payload, (err, resp, body) => {
          if (!err && resp.statusCode === 200) {
            return resolve({
              artist: artist,
              body: JSON.parse(body)
            });
          }
          else {
            console.log(err);
            console.log(resp.statusCode);
            if (resp.statusCode === 429) {
              console.log('Spotify API rate limit reached');
            }
            return resolve({
              artist: artist,
              body: null
            });
          }
        });
      })
      .catch(err => {
        console.log('test1');
        console.log(err.message);
      });
    }, waitTime);
  });
}
