const querystring = require('querystring');
const axios = require('axios');

const client_id = "501054a922b747c0ad87d028e1ede74d";
const client_secret = "14a71c6c29c442bba0f834d01858bbf2";
const redirect_uri = 'https://xyroomusic.vercel.app/api/callback';

module.exports = async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies.spotify_auth_state : null;
    
    if (state === null || state !== storedState) {
        res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    } else {
        res.setHeader('Set-Cookie', 'spotify_auth_state=; Max-Age=0; Path=/; HttpOnly');
        
        const authOptions = {
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            params: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        try {
            const response = await axios(authOptions);
            const access_token = response.data.access_token;
            const refresh_token = response.data.refresh_token;
            
            res.redirect(`/?access_token=${access_token}&refresh_token=${refresh_token}`);
        } catch (error) {
            res.redirect('/#' + querystring.stringify({ error: 'invalid_token' }));
        }
    }
};