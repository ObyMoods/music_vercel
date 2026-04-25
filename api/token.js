const axios = require('axios');

const client_id = "501054a922b747c0ad87d028e1ede74d";
const client_secret = "14a71c6c29c442bba0f834d01858bbf2";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const refresh_token = req.query.refresh_token;
    
    if (!refresh_token) {
        return res.status(400).json({ error: 'No refresh token provided' });
    }
    
    const authOptions = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        params: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        headers: {
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    
    try {
        const response = await axios(authOptions);
        res.json({
            access_token: response.data.access_token,
            refresh_token: refresh_token
        });
    } catch (error) {
        res.status(400).json({ error: 'Invalid refresh token' });
    }
};