const songs = [
    { id: 1, title: "Bersamamu - Vierra", artist: "Vierra", album: "Lyric", duration: "4:12", audioFile: "bersamamu_vierra.mp3", cover: "bersamamu_vierra.jpeg" },
    { id: 2, title: "Ayat-Ayat Cinta", artist: "Vierra", album: "Lyric", duration: "4:12", audioFile: "rossa2.mp3", cover: "album-rossa.jpg" },
    { id: 3, title: "Pudar", artist: "Vierra", album: "Lyric", duration: "4:00", audioFile: "rossa3.mp3", cover: "album-rossa.jpg" },
    { id: 4, title: "Hati Yang Kau Sakiti", artist: "Vierra", album: "Lyric", duration: "4:28", audioFile: "rossa4.mp3", cover: "album-rossa.jpg" },
    { id: 5, title: "Bintang 14 Hari", artist: "Kangen Band", album: "Bintang 14 Hari", duration: "4:30", audioFile: "kangen1.mp3", cover: "album-kangen.jpg" },
    { id: 6, title: "Cinta Terlarang", artist: "Kangen Band", album: "Bintang 14 Hari", duration: "3:55", audioFile: "kangen2.mp3", cover: "album-kangen.jpg" },
    { id: 7, title: "Lagi Viral", artist: "Viral Artist", album: "Lagu Viral TRENDING 2026", duration: "3:30", audioFile: "viral1.mp3", cover: "album-viral.jpg" },
    { id: 8, title: "DJ Remix Viral", artist: "DJ Remixer", album: "Lagu Viral TRENDING 2026", duration: "4:20", audioFile: "viral2.mp3", cover: "album-viral.jpg" },
    { id: 9, title: "Patah Hati Brutal", artist: "Galau Band", album: "Lagu Galau BRUTAL 2026", duration: "4:15", audioFile: "galau1.mp3", cover: "album-galau.jpg" },
    { id: 10, title: "Air Mata Terakhir", artist: "Galau Band", album: "Lagu Galau BRUTAL 2026", duration: "4:45", audioFile: "galau2.mp3", cover: "album-galau.jpg" },
    { id: 11, title: "Rasa Ini", artist: "Vierra", album: "My Favorite", duration: "3:48", audioFile: "vierra1.mp3", cover: "album-vierra.jpg" },
    { id: 12, title: "Tersenyum Untukmu", artist: "Vierra", album: "My Favorite", duration: "4:02", audioFile: "vierra2.mp3", cover: "album-vierra.jpg" },
    { id: 13, title: "Perih", artist: "Vierra", album: "My Favorite", duration: "3:58", audioFile: "vierra3.mp3", cover: "album-vierra.jpg" }
];

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    return res.status(200).json(songs);
}