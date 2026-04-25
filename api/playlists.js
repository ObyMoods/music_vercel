const axios = require('axios');

const PLAYLISTS = {
  'top50': '37i9dQZF1DXcBWIGoYBM5M',
  'indonesia': '37i9dQZF1DX5sW6TJWr7kR'
  'pop': '37i9dQZF1DX5T5uRPnLMNU',
  'dangdut': '37i9dQZF1DX5rB6YADdRSM',
  'galau': '37i9dQZF1DXcRXocBYa5Oj',
  'study': '37i9dQZF1DX8Uebhn9wzrS'
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id, type = 'playlist' } = req.query;
  
  const SPOTIFY_CLIENT_ID = "501054a922b747c0ad87d028e1ede74d";
  const SPOTIFY_CLIENT_SECRET = "14a71c6c29c442bba0f834d01858bbf2";
  
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Spotify credentials not configured' });
  }
  
  try {
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    if (type === 'playlist' && id) {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json(response.data);
    }
    
    if (type === 'tracks' && id) {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json(response.data);
    }
    
    if (type === 'track' && id) {
      const response = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json(response.data);
    }
    
    if (type === 'search') {
      const { q } = req.query;
      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: { q, type: 'track,playlist,artist', limit: 20 },
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json(response.data);
    }
    
    const playlistList = await Promise.all(
      Object.entries(PLAYLISTS).map(async ([key, id]) => {
        try {
          const response = await axios.get(`https://api.spotify.com/v1/playlists/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          return {
            id: key,
            playlistId: id,
            name: response.data.name,
            description: response.data.description,
            image: response.data.images[0]?.url,
            tracksCount: response.data.tracks.total
          };
        } catch (e) {
          return null;
        }
      })
    );
    
    res.json(playlistList.filter(p => p));
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error?.message || error.message 
    });
  }
};