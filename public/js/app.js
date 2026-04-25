// Global variables
let accessToken = null;
let refreshToken = null;
let currentTrack = null;
let isPlaying = false;
let currentDeviceId = null;
let isShuffle = false;
let isRepeat = false;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const miniPlayer = document.getElementById('miniPlayer');
const fullPlayer = document.getElementById('fullPlayer');
const audio = document.getElementById('audio');

// Check URL for tokens
function checkUrlForToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const urlParams = new URLSearchParams(window.location.search);
    
    let token = params.get('access_token') || urlParams.get('access_token');
    let refresh = params.get('refresh_token') || urlParams.get('refresh_token');
    
    if (token) {
        accessToken = token;
        refreshToken = refresh;
        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_refresh_token', refreshToken);
        window.history.pushState({}, document.title, "/");
        initApp();
    } else {
        const savedToken = localStorage.getItem('spotify_access_token');
        if (savedToken) {
            accessToken = savedToken;
            refreshToken = localStorage.getItem('spotify_refresh_token');
            initApp();
        }
    }
}

// Refresh token
async function refreshAccessToken() {
    try {
        const response = await fetch(`/api/token?refresh_token=${refreshToken}`);
        const data = await response.json();
        accessToken = data.access_token;
        localStorage.setItem('spotify_access_token', accessToken);
        return accessToken;
    } catch (error) {
        console.error('Failed to refresh token:', error);
        logout();
    }
}

// API calls with auto-refresh
async function fetchApi(url, options = {}) {
    const makeRequest = async (token) => {
        return fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    };
    
    let response = await makeRequest(accessToken);
    
    if (response.status === 401 && refreshToken) {
        await refreshAccessToken();
        response = await makeRequest(accessToken);
    }
    
    return response;
}

// Initialize app after login
async function initApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    
    await getUserProfile();
    await getTopTracks();
    await getUserPlaylists();
    await getTopArtists();
    await getFeaturedPlaylists();
}

// Get user profile
async function getUserProfile() {
    try {
        const response = await fetchApi('https://api.spotify.com/v1/me');
        const user = await response.json();
        
        document.getElementById('welcomeName').innerHTML = `Selamat Datang, ${user.display_name || 'User'}`;
        document.getElementById('profileName').textContent = user.display_name || 'User';
        document.getElementById('profileEmail').textContent = user.email || '';
        document.getElementById('profileFollowers').textContent = `Followers: ${user.followers?.total || 0}`;
        
        if (user.images && user.images[0]) {
            document.getElementById('userAvatar').src = user.images[0].url;
            document.getElementById('profileAvatar').src = user.images[0].url;
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
    }
}

// Get top tracks
async function getTopTracks() {
    try {
        const response = await fetchApi('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term');
        const data = await response.json();
        
        const container = document.getElementById('topTracks');
        container.innerHTML = data.items.map(track => `
            <div class="music-card" onclick="playTrack('${track.id}')">
                <div class="card-img">
                    <img src="${track.album.images[0]?.url || ''}" alt="${track.name}">
                </div>
                <div class="card-title">${escapeHtml(track.name)}</div>
                <div class="card-subtitle">${escapeHtml(track.artists[0].name)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error getting top tracks:', error);
    }
}

// Get user playlists
async function getUserPlaylists() {
    try {
        const response = await fetchApi('https://api.spotify.com/v1/me/playlists?limit=10');
        const data = await response.json();
        
        const container = document.getElementById('userPlaylists');
        container.innerHTML = data.items.map(playlist => `
            <div class="playlist-card" onclick="getPlaylistTracks('${playlist.id}', '${escapeHtml(playlist.name)}')">
                <div class="card-img">
                    <img src="${playlist.images[0]?.url || ''}" alt="${playlist.name}">
                </div>
                <div class="card-title">${escapeHtml(playlist.name)}</div>
                <div class="card-subtitle">${playlist.tracks.total} lagu</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error getting playlists:', error);
    }
}

// Get top artists
async function getTopArtists() {
    try {
        const response = await fetchApi('https://api.spotify.com/v1/me/top/artists?limit=10');
        const data = await response.json();
        
        const container = document.getElementById('topArtists');
        container.innerHTML = data.items.map(artist => `
            <div class="artist-card" onclick="getArtistTopTracks('${artist.id}', '${escapeHtml(artist.name)}')">
                <div class="card-img">
                    <img src="${artist.images[0]?.url || ''}" alt="${artist.name}">
                </div>
                <div class="card-title">${escapeHtml(artist.name)}</div>
                <div class="card-subtitle">Artist</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error getting top artists:', error);
    }
}

// Get featured playlists
async function getFeaturedPlaylists() {
    try {
        const response = await fetchApi('https://api.spotify.com/v1/browse/featured-playlists?limit=10');
        const data = await response.json();
        
        const container = document.getElementById('featuredPlaylists');
        container.innerHTML = data.playlists.items.map(playlist => `
            <div class="playlist-card" onclick="getPlaylistTracks('${playlist.id}', '${escapeHtml(playlist.name)}')">
                <div class="card-img">
                    <img src="${playlist.images[0]?.url || ''}" alt="${playlist.name}">
                </div>
                <div class="card-title">${escapeHtml(playlist.name)}</div>
                <div class="card-subtitle">${playlist.owner.display_name}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error getting featured playlists:', error);
    }
}

// Play track
window.playTrack = async function(trackId, trackName, trackArtist, trackImage) {
    try {
        // Get available devices
        const devicesRes = await fetchApi('https://api.spotify.com/v1/me/player/devices');
        const devices = await devicesRes.json();
        
        if (devices.devices && devices.devices.length > 0) {
            currentDeviceId = devices.devices[0].id;
            
            // Play on device
            await fetchApi(`https://api.spotify.com/v1/me/player/play?device_id=${currentDeviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [`spotify:track:${trackId}`] })
            });
            
            // Get track info
            const trackRes = await fetchApi(`https://api.spotify.com/v1/tracks/${trackId}`);
            const track = await trackRes.json();
            
            currentTrack = track;
            updatePlayerUI(track);
            isPlaying = true;
            updatePlayButtons(true);
            miniPlayer.style.display = 'flex';
        } else {
            // Fallback: play via audio element (preview only)
            const trackRes = await fetchApi(`https://api.spotify.com/v1/tracks/${trackId}`);
            const track = await trackRes.json();
            
            currentTrack = track;
            updatePlayerUI(track);
            
            if (track.preview_url) {
                audio.src = track.preview_url;
                audio.play();
                isPlaying = true;
                updatePlayButtons(true);
                miniPlayer.style.display = 'flex';
            } else {
                alert('No preview available. Open Spotify app to play full track.');
            }
        }
    } catch (error) {
        console.error('Error playing track:', error);
        alert('Please open Spotify app on your device first, then try again.');
    }
};

// Get playlist tracks
window.getPlaylistTracks = async function(playlistId, playlistName) {
    try {
        const response = await fetchApi(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20`);
        const data = await response.json();
        
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = `
            <div class="section-header">
                <h2>${escapeHtml(playlistName)}</h2>
                <button class="see-more" onclick="document.querySelector('[data-page=\'home\']').click()">Kembali</button>
            </div>
            ${data.items.map((item, i) => `
                <div class="track-item" onclick="playTrack('${item.track.id}', '${escapeHtml(item.track.name)}', '${escapeHtml(item.track.artists[0].name)}', '${item.track.album.images[0]?.url || ''}')">
                    <div class="track-num">${i + 1}</div>
                    <div class="track-info">
                        <div class="track-title">${escapeHtml(item.track.name)}</div>
                        <div class="track-artist">${escapeHtml(item.track.artists[0].name)}</div>
                    </div>
                    <div class="track-duration">${formatDuration(item.track.duration_ms)}</div>
                </div>
            `).join('')}
        `;
        
        document.querySelector('[data-page="search"]').click();
        document.getElementById('searchInput').value = playlistName;
    } catch (error) {
        console.error('Error getting playlist tracks:', error);
    }
};

// Get artist top tracks
window.getArtistTopTracks = async function(artistId, artistName) {
    try {
        const response = await fetchApi(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=ID`);
        const data = await response.json();
        
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = `
            <div class="section-header">
                <h2>Top Lagu - ${escapeHtml(artistName)}</h2>
                <button class="see-more" onclick="document.querySelector('[data-page=\'home\']').click()">Kembali</button>
            </div>
            ${data.tracks.map((track, i) => `
                <div class="track-item" onclick="playTrack('${track.id}', '${escapeHtml(track.name)}', '${escapeHtml(track.artists[0].name)}', '${track.album.images[0]?.url || ''}')">
                    <div class="track-num">${i + 1}</div>
                    <div class="track-info">
                        <div class="track-title">${escapeHtml(track.name)}</div>
                        <div class="track-artist">${escapeHtml(track.artists[0].name)}</div>
                    </div>
                    <div class="track-duration">${formatDuration(track.duration_ms)}</div>
                </div>
            `).join('')}
        `;
        
        document.querySelector('[data-page="search"]').click();
        document.getElementById('searchInput').value = artistName;
    } catch (error) {
        console.error('Error getting artist top tracks:', error);
    }
};

// Search
async function searchMusic() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetchApi(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,playlist&limit=20`);
        const data = await response.json();
        
        let html = '';
        
        if (data.tracks && data.tracks.items.length > 0) {
            html += `<div class="section-header"><h2>Lagu</h2></div>`;
            html += data.tracks.items.map((track, i) => `
                <div class="track-item" onclick="playTrack('${track.id}', '${escapeHtml(track.name)}', '${escapeHtml(track.artists[0].name)}', '${track.album.images[0]?.url || ''}')">
                    <div class="track-num">${i + 1}</div>
                    <div class="track-info">
                        <div class="track-title">${escapeHtml(track.name)}</div>
                        <div class="track-artist">${escapeHtml(track.artists[0].name)}</div>
                    </div>
                    <div class="track-duration">${formatDuration(track.duration_ms)}</div>
                </div>
            `).join('');
        }
        
        if (data.artists && data.artists.items.length > 0) {
            html += `<div class="section-header"><h2>Artis</h2></div>`;
            html += `<div class="horizontal-scroll">`;
            html += data.artists.items.map(artist => `
                <div class="artist-card" onclick="getArtistTopTracks('${artist.id}', '${escapeHtml(artist.name)}')">
                    <div class="card-img">
                        <img src="${artist.images[0]?.url || ''}" alt="${artist.name}">
                    </div>
                    <div class="card-title">${escapeHtml(artist.name)}</div>
                    <div class="card-subtitle">Artist</div>
                </div>
            `).join('');
            html += `</div>`;
        }
        
        if (data.playlists && data.playlists.items.length > 0) {
            html += `<div class="section-header"><h2>Playlist</h2></div>`;
            html += `<div class="horizontal-scroll">`;
            html += data.playlists.items.map(playlist => `
                <div class="playlist-card" onclick="getPlaylistTracks('${playlist.id}', '${escapeHtml(playlist.name)}')">
                    <div class="card-img">
                        <img src="${playlist.images[0]?.url || ''}" alt="${playlist.name}">
                    </div>
                    <div class="card-title">${escapeHtml(playlist.name)}</div>
                    <div class="card-subtitle">${playlist.tracks.total} lagu</div>
                </div>
            `).join('');
            html += `</div>`;
        }
        
        if (html === '') {
            html = '<div style="text-align:center;color:#888;padding:40px;">Tidak ditemukan</div>';
        }
        
        document.getElementById('searchResults').innerHTML = html;
    } catch (error) {
        console.error('Error searching:', error);
    }
}

// Update player UI
function updatePlayerUI(track) {
    const title = track.name;
    const artist = track.artists.map(a => a.name).join(', ');
    const image = track.album.images[0]?.url || '';
    
    document.getElementById('miniTitle').textContent = title;
    document.getElementById('miniArtist').textContent = artist;
    document.getElementById('miniCover').src = image;
    document.getElementById('fullTitle').textContent = title;
    document.getElementById('fullArtist').textContent = artist;
    document.getElementById('fullCover').src = image;
}

// Player controls
function updatePlayButtons(playing) {
    const playIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    
    document.getElementById('miniPlayPauseBtn').innerHTML = playing ? pauseIcon : playIcon;
    document.getElementById('fullPlayPauseBtn').innerHTML = playing ? pauseIcon : playIcon;
}

function togglePlay() {
    if (currentDeviceId) {
        fetchApi(`https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}?device_id=${currentDeviceId}`, {
            method: 'PUT'
        }).catch(e => console.error('Error:', e));
    } else if (audio.src) {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    }
    isPlaying = !isPlaying;
    updatePlayButtons(isPlaying);
}

function nextSong() {
    if (currentDeviceId) {
        fetchApi('https://api.spotify.com/v1/me/player/next', { method: 'POST' });
    }
}

function prevSong() {
    if (currentDeviceId) {
        fetchApi('https://api.spotify.com/v1/me/player/previous', { method: 'POST' });
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    if (currentDeviceId) {
        fetchApi(`https://api.spotify.com/v1/me/player/shuffle?state=${isShuffle}`, { method: 'PUT' });
    }
    document.getElementById('fullShuffleBtn').style.color = isShuffle ? '#1DB954' : '#fff';
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    if (currentDeviceId) {
        const state = isRepeat ? 'context' : 'off';
        fetchApi(`https://api.spotify.com/v1/me/player/repeat?state=${state}`, { method: 'PUT' });
    }
    document.getElementById('fullRepeatBtn').style.color = isRepeat ? '#1DB954' : '#fff';
}

function setVolume(e) {
    const volume = e.target.value;
    audio.volume = volume;
    if (currentDeviceId) {
        fetchApi(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume * 100}`, { method: 'PUT' });
    }
}

function openFullPlayer() {
    fullPlayer.classList.add('open');
}

function closeFullPlayer() {
    fullPlayer.classList.remove('open');
}

function logout() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    accessToken = null;
    refreshToken = null;
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
}

// Helper functions
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById(`${page}Page`).classList.add('active');
        item.classList.add('active');
    });
});

// Event listeners
loginBtn.addEventListener('click', () => {
    window.location.href = '/api/auth';
});

logoutBtn.addEventListener('click', logout);

document.getElementById('searchInput')?.addEventListener('input', searchMusic);
document.getElementById('miniPlayPauseBtn')?.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
document.getElementById('miniPrevBtn')?.addEventListener('click', (e) => { e.stopPropagation(); prevSong(); });
document.getElementById('miniNextBtn')?.addEventListener('click', (e) => { e.stopPropagation(); nextSong(); });
document.getElementById('fullPlayPauseBtn')?.addEventListener('click', togglePlay);
document.getElementById('fullPrevBtn')?.addEventListener('click', prevSong);
document.getElementById('fullNextBtn')?.addEventListener('click', nextSong);
document.getElementById('fullShuffleBtn')?.addEventListener('click', toggleShuffle);
document.getElementById('fullRepeatBtn')?.addEventListener('click', toggleRepeat);
document.getElementById('fullProgressBar')?.addEventListener('click', (e) => {});
document.getElementById('fullVolumeSlider')?.addEventListener('input', setVolume);
document.getElementById('closePlayerBtn')?.addEventListener('click', closeFullPlayer);
document.getElementById('openFullPlayer')?.addEventListener('click', openFullPlayer);
document.getElementById('miniPlayer')?.addEventListener('click', openFullPlayer);

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        document.getElementById('fullProgressFill').style.width = `${percent}%`;
        document.getElementById('fullCurrentTime').textContent = formatDuration(audio.currentTime * 1000);
        document.getElementById('fullTotalTime').textContent = formatDuration(audio.duration * 1000);
    }
});

audio.addEventListener('ended', () => {
    isPlaying = false;
    updatePlayButtons(false);
});

// Start
checkUrlForToken();