// Global variables
let currentPlaylistId = null;
let currentTracks = [];
let currentTrackIndex = 0;
let isPlaying = false;
let audio = document.getElementById('audio');

// DOM Elements
const homePage = document.getElementById('homePage');
const playlistDetailPage = document.getElementById('playlistDetailPage');
const searchPage = document.getElementById('searchPage');
const profilePage = document.getElementById('profilePage');
const navItems = document.querySelectorAll('.nav-item');
const miniPlayer = document.getElementById('miniPlayer');
const fullPlayer = document.getElementById('fullPlayer');

// Load playlists on start
async function loadPlaylists() {
    const container = document.getElementById('playlistsGrid');
    container.innerHTML = '<div class="loading">Memuat playlist...</div>';
    
    try {
        const response = await fetch('/api/playlist');
        const playlists = await response.json();
        
        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-card" onclick="loadPlaylist('${playlist.playlistId}', '${escapeHtml(playlist.name)}', '${playlist.image || ''}')">
                <div class="playlist-card-img">
                    <img src="${playlist.image || ''}" alt="${playlist.name}" onerror="this.src='https://via.placeholder.com/160'">
                </div>
                <div class="playlist-card-title">${escapeHtml(playlist.name)}</div>
                <div class="playlist-card-subtitle">${playlist.tracksCount || 0} lagu</div>
            </div>
        `).join('');
        
        // Load trending tracks
        loadTrendingTracks();
    } catch (error) {
        console.error('Error loading playlists:', error);
        container.innerHTML = '<div class="loading">Gagal memuat playlist</div>';
    }
}

// Load trending tracks
async function loadTrendingTracks() {
    const container = document.getElementById('trendingTracks');
    
    try {
        // Pakai playlist Top 50 Global
        const response = await fetch('/api/playlist?id=37i9dQZF1DXcBWIGoYBM5M&type=tracks');
        const data = await response.json();
        
        const tracks = data.items || [];
        container.innerHTML = tracks.slice(0, 10).map(item => {
            const track = item.track;
            if (!track) return '';
            return `
                <div class="music-card" onclick="playTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                    <div class="music-card-img">
                        <img src="${track.album.images[0]?.url || ''}" alt="${track.name}">
                    </div>
                    <h4>${escapeHtml(track.name)}</h4>
                    <p>${escapeHtml(track.artists[0]?.name || '')}</p>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading trending:', error);
        container.innerHTML = '<div class="loading">Gagal memuat trending</div>';
    }
}

// Load playlist by ID
window.loadPlaylist = async function(playlistId, playlistName, playlistImage) {
    currentPlaylistId = playlistId;
    
    const headerContainer = document.getElementById('playlistHeader');
    headerContainer.innerHTML = `
        <div class="playlist-header-img">
            <img src="${playlistImage}" alt="${playlistName}" onerror="this.src='https://via.placeholder.com/120'">
        </div>
        <div class="playlist-header-info">
            <h2>${escapeHtml(playlistName)}</h2>
            <p>Playlist • Spotify</p>
        </div>
    `;
    
    const tracksContainer = document.getElementById('playlistTracks');
    tracksContainer.innerHTML = '<div class="loading">Memuat lagu...</div>';
    
    try {
        const response = await fetch(`/api/playlist?id=${playlistId}&type=tracks`);
        const data = await response.json();
        
        currentTracks = data.items.map(item => item.track).filter(t => t !== null);
        
        tracksContainer.innerHTML = currentTracks.map((track, index) => `
            <div class="track-item" onclick="playTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-title">${escapeHtml(track.name)}</div>
                    <div class="track-artist">${escapeHtml(track.artists[0]?.name || '')}</div>
                </div>
                <div class="track-duration">${formatDuration(track.duration_ms)}</div>
            </div>
        `).join('');
        
        // Switch to playlist detail page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        playlistDetailPage.classList.add('active');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
    } catch (error) {
        console.error('Error loading tracks:', error);
        tracksContainer.innerHTML = '<div class="loading">Gagal memuat lagu</div>';
    }
};

// Play track
window.playTrack = function(track) {
    if (!track) return;
    
    currentTrackIndex = currentTracks.findIndex(t => t.id === track.id);
    
    const title = track.name;
    const artist = track.artists.map(a => a.name).join(', ');
    const image = track.album.images[0]?.url || '';
    const previewUrl = track.preview_url;
    
    // Update UI
    document.getElementById('miniTitle').textContent = title;
    document.getElementById('miniArtist').textContent = artist;
    document.getElementById('miniCover').src = image;
    document.getElementById('fullTitle').textContent = title;
    document.getElementById('fullArtist').textContent = artist;
    document.getElementById('fullCover').src = image;
    
    if (previewUrl) {
        audio.src = previewUrl;
        audio.play();
        isPlaying = true;
        updatePlayButtons(true);
        miniPlayer.style.display = 'flex';
    } else {
        alert('Preview tidak tersedia untuk lagu ini. Buka Spotify untuk mendengarkan full lagu.');
    }
};

// Player controls
function updatePlayButtons(playing) {
    const playIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    
    document.getElementById('miniPlayPauseBtn').innerHTML = playing ? pauseIcon : playIcon;
    document.getElementById('fullPlayPauseBtn').innerHTML = playing ? pauseIcon : playIcon;
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
        updatePlayButtons(false);
    } else {
        audio.play();
        updatePlayButtons(true);
    }
    isPlaying = !isPlaying;
}

function nextSong() {
    if (currentTracks.length > 0 && currentTrackIndex < currentTracks.length - 1) {
        currentTrackIndex++;
        playTrack(currentTracks[currentTrackIndex]);
    }
}

function prevSong() {
    if (currentTracks.length > 0 && currentTrackIndex > 0) {
        currentTrackIndex--;
        playTrack(currentTracks[currentTrackIndex]);
    } else if (currentTrackIndex === 0) {
        audio.currentTime = 0;
    }
}

function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        document.getElementById('fullProgressFill').style.width = `${percent}%`;
        
        const curMin = Math.floor(audio.currentTime / 60);
        const curSec = Math.floor(audio.currentTime % 60);
        document.getElementById('fullCurrentTime').textContent = `${curMin}:${curSec.toString().padStart(2, '0')}`;
        
        const totMin = Math.floor(audio.duration / 60);
        const totSec = Math.floor(audio.duration % 60);
        document.getElementById('fullTotalTime').textContent = `${totMin}:${totSec.toString().padStart(2, '0')}`;
    }
}

function setProgress(e) {
    const rect = document.getElementById('fullProgressBar').getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
}

function setVolume(e) {
    audio.volume = e.target.value;
}

// Search
async function searchMusic() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/playlist?type=search&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        let html = '';
        
        if (data.tracks && data.tracks.items.length > 0) {
            html += `<div class="section-header"><h2>Lagu</h2></div>`;
            html += data.tracks.items.map((track, i) => `
                <div class="track-item" onclick="playTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})">
                    <div class="track-number">${i + 1}</div>
                    <div class="track-info">
                        <div class="track-title">${escapeHtml(track.name)}</div>
                        <div class="track-artist">${escapeHtml(track.artists[0]?.name || '')}</div>
                    </div>
                    <div class="track-duration">${formatDuration(track.duration_ms)}</div>
                </div>
            `).join('');
        }
        
        if (data.playlists && data.playlists.items.length > 0) {
            html += `<div class="section-header"><h2>Playlist</h2></div>`;
            html += `<div class="horizontal-scroll">`;
            html += data.playlists.items.map(playlist => `
                <div class="playlist-card" style="min-width:140px" onclick="loadPlaylist('${playlist.id}', '${escapeHtml(playlist.name)}', '${playlist.images[0]?.url || ''}')">
                    <div class="playlist-card-img">
                        <img src="${playlist.images[0]?.url || ''}" alt="${playlist.name}">
                    </div>
                    <div class="playlist-card-title">${escapeHtml(playlist.name)}</div>
                    <div class="playlist-card-subtitle">${playlist.tracks.total} lagu</div>
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

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        if (page === 'home') {
            homePage.classList.add('active');
        } else if (page === 'search') {
            searchPage.classList.add('active');
            document.getElementById('searchInput').focus();
        } else if (page === 'profile') {
            profilePage.classList.add('active');
        }
        
        item.classList.add('active');
    });
});

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
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function openFullPlayer() {
    fullPlayer.classList.add('open');
}

function closeFullPlayer() {
    fullPlayer.classList.remove('open');
}

// Back to home from playlist detail
function goBackToHome() {
    homePage.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('.nav-item[data-page="home"]').classList.add('active');
}

// Add back button to playlist detail
document.addEventListener('DOMContentLoaded', () => {
    // Add back button to playlist header
    const headerLarge = document.querySelector('.playlist-header-large');
    if (headerLarge && !document.getElementById('backToHomeBtn')) {
        const backBtn = document.createElement('button');
        backBtn.id = 'backToHomeBtn';
        backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><polyline points="15 18 9 12 15 6"/></svg>';
        backBtn.style.cssText = 'position:absolute;top:20px;left:20px;background:none;border:none;color:#fff;cursor:pointer;';
        backBtn.onclick = goBackToHome;
        document.querySelector('.playlist-header-large')?.appendChild(backBtn);
    }
});

// Event listeners
document.getElementById('searchInput')?.addEventListener('input', searchMusic);
document.getElementById('miniPlayPauseBtn')?.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
document.getElementById('miniPrevBtn')?.addEventListener('click', (e) => { e.stopPropagation(); prevSong(); });
document.getElementById('miniNextBtn')?.addEventListener('click', (e) => { e.stopPropagation(); nextSong(); });
document.getElementById('fullPlayPauseBtn')?.addEventListener('click', togglePlay);
document.getElementById('fullPrevBtn')?.addEventListener('click', prevSong);
document.getElementById('fullNextBtn')?.addEventListener('click', nextSong);
document.getElementById('fullProgressBar')?.addEventListener('click', setProgress);
document.getElementById('fullVolumeSlider')?.addEventListener('input', setVolume);
document.getElementById('closePlayerBtn')?.addEventListener('click', closeFullPlayer);
document.getElementById('openFullPlayer')?.addEventListener('click', openFullPlayer);
document.getElementById('miniPlayer')?.addEventListener('click', openFullPlayer);

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
    isPlaying = false;
    updatePlayButtons(false);
    nextSong();
});

// Start
loadPlaylists();