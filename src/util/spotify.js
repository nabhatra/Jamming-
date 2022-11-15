let accessToken = '';
const clientID = '7e87a637594d6714b3f84acdadbbbc035e3db2b0b371419a8861a6102f76b158';
//const redirectURI = 'http://localhost:3000/';
const redirectURI = 'https://iamjammin.surge.sh/'
const requestURL = 'https://accounts.spotify.com/authorize?';
const responseType = 'token';
const responseScope = 'playlist-modify-public';
const apiURL = 'https://api.spotify.com/v1'
const searchURL = `${apiURL}/search?type=artist,album,track&q=`;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    } else if (window.location.href.match(/access_token=([^&]*)/) && window.location.href.match(/expires_in=([^&]*)/)) {
      accessToken = window.location.href.match(/access_token=([^&]*)/)[1];
      let expiresIn = window.location.href.match(/expires_in=([^&]*)/)[1];

      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');

      return accessToken;
    } else {
      window.location = `${requestURL}client_id=${clientID}&response_type=${responseType}&scope=${responseScope}&redirect_uri=${redirectURI}`;
    }
  },

  search(term) {
    this.getAccessToken();
    return fetch(`${searchURL}${term}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      if (jsonResponse.tracks) {
        return jsonResponse.tracks.items.map(track => {
            return {
              id: track.id,
              name: track.name,
              artist: track.artists[0].name,
              album: track.album.name,
              uri: track.uri
            }
          }
        )
      } else {
        return [];
      }
    });
  },

  savePlaylist(name, trackURIs) {
    console.log('Saving Playlist');
    if (!name || !trackURIs.length) {
      return
    }

    this.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    let userID;

    return fetch(`${apiURL}/me`, {headers: headers}).then(response => {
      return response.json();
    }).then(jsonResponse => {
      userID = jsonResponse.id;
      console.log("User id is ", userID);

      return fetch(`${apiURL}/users/${userID}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-type': 'application/json',
        },
        body: JSON.stringify({name: name})
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Request failed!');
      }, networkError => console.log(networkError.message)
      ).then(jsonResponse => {
        console.log(jsonResponse);
        let playlistID = jsonResponse.id;

        return fetch(`${apiURL}/playlists/${playlistID}/tracks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trackURIs)
        }).then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Request failed!');
        }, networkError => console.log(networkError.message)
      ).then(jsonResponse => {
        let playlistID = jsonResponse.id;
      })
      })
    })
  }
};

export default Spotify;