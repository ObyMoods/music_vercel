const querystring = require('querystring');

const client_id = "501054a922b747c0ad87d028e1ede74d";
const redirect_uri = "https://xyroomusic.vercel.app/api/auth";

const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const stateKey = 'spotify_auth_state';

module.exports = (req, res) => {
    const state = generateRandomString(16);
    res.setHeader('Set-Cookie', `${stateKey}=${state}; Path=/; HttpOnly`);
    
    const scope = 'user-read-private user-read-email user-top-read playlist-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';
    
    const queryParams = querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    });
    
    res.redirect('https://accounts.spotify.com/authorize?' + queryParams);
};
