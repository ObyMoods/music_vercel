let songs = [];
let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
const audio = document.getElementById('audio');

// DOM Elements
const homePage = document.getElementById('homePage');
const searchPage = document.getElementById('searchPage');
const libraryPage = document.getElementById('libraryPage');
const profilePage = document.getElementById('profilePage');
const navItems = document.querySelectorAll('.nav-item');
const miniPlayer = document.getElementById('miniPlayer');
const fullPlayer = document.getElementById('fullPlayer');
const miniPlayPause = document.getElementById('miniPlayPauseBtn');
const miniPrev = document.getElementById('miniPrevBtn');
const miniNext = document.getElementById('miniNextBtn');
const fullPlayPause = document.getElementById('fullPlayPauseBtn');
const fullPrev = document.getElementById('fullPrevBtn');
const fullNext = document.getElementById('fullNextBtn');
const fullShuffle = document.getElementById('fullShuffleBtn');
const fullRepeat = document.getElementById('fullRepeatBtn');
const fullProgressBar = document.getElementById('fullProgressBar');
const fullProgressFill = document.getElementById('fullProgressFill');
const fullCurrentTime = document.getElementById('fullCurrentTime');
const fullTotalTime = document.getElementById('fullTotalTime');
const fullVolumeSlider = document.getElementById('fullVolumeSlider');
const fullVolumeBtn = document.getElementById('fullVolumeBtn');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
const miniCover = document.getElementById('miniCover');
const fullTitle = document.getElementById('fullTitle');
const fullArtist = document.getElementById('fullArtist');
const fullCover = document.getElementById('fullCover');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Load songs from API
async function loadSongs() {
    try {
        const res = await fetch('/api/songs');
        songs = await res.json();
        renderAll();
        playSong(0);
    } catch (error) {
        console.error('Error loading songs:', error);
        // Fallback: coba load dari file lokal
        const fallbackRes = await fetch('/data/songs.json');
        songs = await fallbackRes.json();
        renderAll();
        playSong(0);
    }
}

function renderAll() {
    const rossaSongs = songs.filter(s => s.album === 'Platinum Collection Rossa');
    document.getElementById('rossaTracklist').innerHTML = rossaSongs.map((song, i) => `
        <div class="track-item" onclick="playById(${song.id})">
            <div class="track-num">${i + 1}</div>
            <div class="track-info">
                <div class="title">${escapeHtml(song.title)}</div>
                <div class="artist">${escapeHtml(song.artist)}</div>
            </div>
            <div class="track-duration">${song.duration}</div>
        </div>
    `).join('');

    const kangenSongs = songs.filter(s => s.album === 'Bintang 14 Hari');
    document.getElementById('kangenTracklist').innerHTML = kangenSongs.map((song, i) => `
        <div class="track-item" onclick="playById(${song.id})">
            <div class="track-num">${i + 1}</div>
            <div class="track-info">
                <div class="title">${escapeHtml(song.title)}</div>
                <div class="artist">${escapeHtml(song.artist)}</div>
            </div>
            <div class="track-duration">${song.duration}</div>
        </div>
    `).join('');

    const viralSongs = songs.filter(s => s.album === 'Lagu Viral TRENDING 2026');
    document.getElementById('viralScroll').innerHTML = viralSongs.map(song => `
        <div class="music-card" onclick="playById(${song.id})">
            <div class="music-card-img"><img src="/images/${song.cover}" onerror="this.src='/images/default.jpg'"></div>
            <h4>${escapeHtml(song.title)}</h4>
            <p>${escapeHtml(song.artist)}</p>
        </div>
    `).join('');

    const galauSongs = songs.filter(s => s.album === 'Lagu Galau BRUTAL 2026');
    document.getElementById('galauScroll').innerHTML = galauSongs.map(song => `
        <div class="music-card" onclick="playById(${song.id})">
            <div class="music-card-img"><img src="/images/${song.cover}" onerror="this.src='/images/default.jpg'"></div>
            <h4>${escapeHtml(song.title)}</h4>
            <p>${escapeHtml(song.artist)}</p>
        </div>
    `).join('');

    const favoriteSongs = songs.filter(s => s.album === 'My Favorite');
    document.getElementById('favoriteScroll').innerHTML = favoriteSongs.map(song => `
        <div class="music-card" onclick="playById(${song.id})">
            <div class="music-card-img"><img src="/images/${song.cover}" onerror="this.src='/images/default.jpg'"></div>
            <h4>${escapeHtml(song.title)}</h4>
            <p>${escapeHtml(song.artist)}</p>
        </div>
    `).join('');

    // Library content
    const albums = [...new Map(songs.map(s => [s.album, s.cover])).entries()];
    document.getElementById('libraryContent').innerHTML = albums.map(([album, cover]) => `
        <div class="music-card" onclick="searchAlbum('${escapeHtml(album)}')">
            <div class="music-card-img"><img src="/images/${cover}" onerror="this.src='/images/default.jpg'"></div>
            <h4>${escapeHtml(album)}</h4>
            <p>Album</p>
        </div>
    `).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.playById = function(id) {
    const idx = songs.findIndex(s => s.id === id);
    if (idx !== -1) playSong(idx);
};

function searchAlbum(album) {
    searchInput.value = album;
    searchMusic();
    document.querySelector('[data-page="search"]').click();
}

function playSong(index) {
    currentIndex = index;
    const song = songs[currentIndex];
    audio.src = `/audio/${song.audioFile}`;
    
    miniTitle.textContent = song.title;
    miniArtist.textContent = song.artist;
    miniCover.src = `/images/${song.cover}`;
    fullTitle.textContent = song.title;
    fullArtist.textContent = song.artist;
    fullCover.src = `/images/${song.cover}`;
    
    audio.play().catch(e => console.log('Auto-play prevented:', e));
    isPlaying = true;
    updatePlayButtons(true);
    miniPlayer.style.display = 'flex';
    
    document.querySelectorAll('.track-item').forEach(item => item.classList.remove('active'));
    const activeTrack = document.querySelectorAll('.track-item')[currentIndex];
    if (activeTrack) activeTrack.classList.add('active');
}

function updatePlayButtons(playing) {
    const playIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    
    if (miniPlayPause) miniPlayPause.innerHTML = playing ? pauseIcon : playIcon;
    if (fullPlayPause) fullPlayPause.innerHTML = playing ? pauseIcon : playIcon;
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
    if (isShuffle) {
        currentIndex = Math.floor(Math.random() * songs.length);
    } else {
        currentIndex = (currentIndex + 1) % songs.length;
    }
    playSong(currentIndex);
}

function prevSong() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        playSong(currentIndex);
    }
}

function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        if (fullProgressFill) fullProgressFill.style.width = `${percent}%`;
        
        const curMin = Math.floor(audio.currentTime / 60);
        const curSec = Math.floor(audio.currentTime % 60);
        if (fullCurrentTime) fullCurrentTime.textContent = `${curMin}:${curSec.toString().padStart(2, '0')}`;
        
        const totMin = Math.floor(audio.duration / 60);
        const totSec = Math.floor(audio.duration % 60);
        if (fullTotalTime) fullTotalTime.textContent = `${totMin}:${totSec.toString().padStart(2, '0')}`;
    }
}

function setProgress(e) {
    const rect = fullProgressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
}

function setVolume(e) {
    audio.volume = e.target.value;
    const volumeIcon = audio.volume === 0 ? 
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="4" y1="4" x2="20" y2="20"/><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>` :
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
    if (fullVolumeBtn) fullVolumeBtn.innerHTML = volumeIcon;
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    if (fullShuffle) fullShuffle.style.color = isShuffle ? '#1DB954' : '#fff';
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    if (fullRepeat) fullRepeat.style.color = isRepeat ? '#1DB954' : '#fff';
}

function onEnded() {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextSong();
    }
}

function openFullPlayer() {
    if (fullPlayer) fullPlayer.classList.add('open');
}

function closeFullPlayer() {
    if (fullPlayer) fullPlayer.classList.remove('open');
}

function searchMusic() {
    const query = searchInput.value.toLowerCase();
    if (!query) {
        searchResults.innerHTML = '';
        return;
    }
    
    const filtered = songs.filter(s => 
        s.title.toLowerCase().includes(query) || 
        s.artist.toLowerCase().includes(query) ||
        s.album.toLowerCase().includes(query)
    );
    
    searchResults.innerHTML = filtered.map((song, i) => `
        <div class="track-item" onclick="playById(${song.id})">
            <div class="track-num">${i + 1}</div>
            <div class="track-info">
                <div class="title">${escapeHtml(song.title)}</div>
                <div class="artist">${escapeHtml(song.artist)}</div>
            </div>
            <div class="track-duration">${song.duration}</div>
        </div>
    `).join('');
    
    if (filtered.length === 0) {
        searchResults.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">Lagu tidak ditemukan</div>';
    }
}

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) targetPage.classList.add('active');
        item.classList.add('active');
        
        if (page === 'search' && searchInput) {
            searchInput.focus();
        }
    });
});

// Library tabs
document.querySelectorAll('.lib-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// Event listeners
if (miniPlayPause) miniPlayPause.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
if (miniPrev) miniPrev.addEventListener('click', (e) => { e.stopPropagation(); prevSong(); });
if (miniNext) miniNext.addEventListener('click', (e) => { e.stopPropagation(); nextSong(); });
if (fullPlayPause) fullPlayPause.addEventListener('click', togglePlay);
if (fullPrev) fullPrev.addEventListener('click', prevSong);
if (fullNext) fullNext.addEventListener('click', nextSong);
if (fullShuffle) fullShuffle.addEventListener('click', toggleShuffle);
if (fullRepeat) fullRepeat.addEventListener('click', toggleRepeat);
if (fullProgressBar) fullProgressBar.addEventListener('click', setProgress);
if (fullVolumeSlider) fullVolumeSlider.addEventListener('input', setVolume);
if (closePlayerBtn) closePlayerBtn.addEventListener('click', closeFullPlayer);
if (miniPlayer) miniPlayer.addEventListener('click', openFullPlayer);
if (searchInput) searchInput.addEventListener('input', searchMusic);

const playRossaBtn = document.getElementById('playRossaBtn');
if (playRossaBtn) {
    playRossaBtn.addEventListener('click', () => {
        const rossaSongs = songs.filter(s => s.album === 'Platinum Collection Rossa');
        if (rossaSongs.length) playById(rossaSongs[0].id);
    });
}

const playKangenBtn = document.getElementById('playKangenBtn');
if (playKangenBtn) {
    playKangenBtn.addEventListener('click', () => {
        const kangenSongs = songs.filter(s => s.album === 'Bintang 14 Hari');
        if (kangenSongs.length) playById(kangenSongs[0].id);
    });
}

document.querySelectorAll('.see-more').forEach(btn => {
    btn.addEventListener('click', () => {
        const searchNav = document.querySelector('[data-page="search"]');
        if (searchNav) searchNav.click();
    });
});

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', onEnded);

// Start app
loadSongs();