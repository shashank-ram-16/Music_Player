import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-auth.js';

const firebaseConfig = {
    apiKey: " ",
    authDomain: " ",
    projectId: " ",
    storageBucket: " ",
    messagingSenderId: "",
    appId: " ",
    measurementId: " "
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentTrackIndex = 0;
let tracks = [];
let isPlaying = false;

let audioPlayer;
let seekBar;
let currentTimeElem;
let totalTimeElem;

document.addEventListener('DOMContentLoaded', () => {
    audioPlayer = document.getElementById('audio-player');
    seekBar = document.getElementById('seek-bar');
    currentTimeElem = document.getElementById('current-time');
    totalTimeElem = document.getElementById('total-time');
    audioPlayer.addEventListener('loadedmetadata', () => {
        totalTimeElem.textContent = formatTime(audioPlayer.duration);
    });
    
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayPauseButton(false);
    });
    
    setInterval(updateSeekBar, 1000); // Update seek bar every second

    document.getElementById('search-query').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchYouTube();
        }
    });

    document.getElementById('search-button').addEventListener('click', searchYouTube);
    document.getElementById('play-pause-button').addEventListener('click', togglePlayPause);
    document.querySelector('.control-button:nth-child(2)').addEventListener('click', playPrevious);
    document.querySelector('.control-button:nth-child(4)').addEventListener('click', playNext);
    document.getElementById('results').addEventListener('click', handleResultsClick);
    document.getElementById('playlist').addEventListener('click', handlePlaylistClick);

    audioPlayer.addEventListener('timeupdate', updateSeekBar);
    seekBar.addEventListener('input', seekAudio);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userDoc);

                if (!userSnap.exists()) {
                    await setDoc(userDoc, { playlist: [] });
                }
                displayPlaylist();
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        } else {
            document.getElementById('playlist').innerHTML = '<p>Please log in to view your playlist.</p>';
        }
    });
});

async function searchYouTube() {
    const query = document.getElementById('search-query').value;
    if (!query) {
        alert('Please enter a search query');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Error fetching search results:', error);
    }
}

function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    tracks = results;

    results.forEach((result, index) => {
        const videoElement = document.createElement('div');
        videoElement.classList.add('video');
        videoElement.innerHTML = `
            <img src="${result.snippet.thumbnails.default.url}" alt="${result.snippet.title}">
            <p>${result.snippet.title}</p>
            <button data-index="${index}" class="play-button">Play</button>
            <button data-index="${index}" class="add-to-playlist-button">Add to Playlist</button>
        `;
        resultsContainer.appendChild(videoElement);
    });
}

function playAudio(index) {
    currentTrackIndex = index;
    if (!tracks[currentTrackIndex]) {
        console.error('Track not found at index:', currentTrackIndex);
        return;
    }
    const videoId = tracks[currentTrackIndex].id.videoId;
    const thumbnail = document.getElementById('thumbnail');

    audioPlayer.src = `http://localhost:3000/stream?id=${videoId}`;
    thumbnail.src = tracks[currentTrackIndex].snippet.thumbnails.default.url;

    audioPlayer.play();
    isPlaying = true;
    updatePlayPauseButton(true);
    seekBar.value = 0;
    currentTimeElem.textContent = '0:00';
    totalTimeElem.textContent = '0:00';
}

function playNext() {
    if (currentTrackIndex < tracks.length - 1) {
        playAudio(currentTrackIndex + 1);
    }
}


function playPrevious() {
    if (currentTrackIndex > 0) {
        playAudio(currentTrackIndex - 1);
    }
}

function togglePlayPause() {
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        updatePlayPauseButton(false);
    } else {
        audioPlayer.play();
        isPlaying = true;
        updatePlayPauseButton(true);
    }
}

function updatePlayPauseButton(isPlaying) {
    const playPauseButton = document.getElementById('play-pause-button');
    playPauseButton.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9658;';
}

async function addToPlaylist(index) {
    const track = tracks[index];
    
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to add tracks to your playlist.');
        return;
    }

    try {
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);

        const newTrack = {
            id: track.id.videoId,
            title: track.snippet.title,
            thumbnail: track.snippet.thumbnails.default.url
        };

        if (userSnap.exists()) {
            await updateDoc(userDoc, {
                playlist: arrayUnion(newTrack)
            });
        } else {
            await setDoc(userDoc, {
                playlist: [newTrack]
            });
        }

        displayPlaylist();
        alert('Track added to your playlist!');
    } catch (error) {
        console.error('Error adding track to playlist:', error);
        alert('An error occurred while adding the track to your playlist.');
    }
}

async function displayPlaylist() {
    const user = auth.currentUser;
    if (!user) {
        document.getElementById('playlist').innerHTML = '<p>Please log in to view your playlist.</p>';
        return;
    }

    try {
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const playlist = userData.playlist || [];

            const playlistContainer = document.getElementById('playlist');
            playlistContainer.innerHTML = '<h2>Playlist</h2>';

            tracks = playlist; // Update the tracks array with the playlist data

            playlist.forEach((track, index) => {
                const trackElement = document.createElement('div');
                trackElement.classList.add('playlist-item');
                trackElement.innerHTML = `
                    <img src="${track.thumbnail}" alt="${track.title}">
                    <p>${track.title}</p>
                    <button class="play-button" data-id="${track.id}" data-index="${index}">Play</button>
                    <button class="remove-button" data-index="${index}">Remove</button>
                `;
                playlistContainer.appendChild(trackElement);
            });
        } else {
            console.log('No user data found');
        }
    } catch (error) {
        console.error('Error fetching playlist:', error);
        alert('An error occurred while fetching your playlist.');
    }
}

function playAudioFromPlaylist(videoId) {
    const track = tracks.find(t => t.id === videoId);
    if (track) {
        const thumbnail = document.getElementById('thumbnail');

        audioPlayer.src = `http://localhost:3000/stream?id=${videoId}`;
        thumbnail.src = track.thumbnail;

        audioPlayer.play();
        isPlaying = true;
        updatePlayPauseButton(true);
    } else {
        console.error('Track not found in current tracks');
    }
    
}

async function removeFromPlaylist(index) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to remove tracks from your playlist.');
        return;
    }

    try {
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const track = tracks[index];

            await updateDoc(userDoc, {
                playlist: arrayRemove(track)
            });

            displayPlaylist();
            alert('Track removed from your playlist!');
        }
    } catch (error) {
        console.error('Error removing track from playlist:', error);
        alert('An error occurred while removing the track from your playlist.');
    }
}

function handleResultsClick(event) {
    if (event.target.classList.contains('play-button')) {
        const index = event.target.getAttribute('data-index');
        playAudio(parseInt(index));
    }

    if (event.target.classList.contains('add-to-playlist-button')) {
        const index = event.target.getAttribute('data-index');
        addToPlaylist(parseInt(index));
    }
}

function handlePlaylistClick(event) {
    if (event.target.classList.contains('play-button')) {
        const videoId = event.target.getAttribute('data-id');
        playAudioFromPlaylist(videoId);
    }

    if (event.target.classList.contains('remove-button')) {
        const index = event.target.getAttribute('data-index');
        removeFromPlaylist(parseInt(index));
    }
}

function updateSeekBar() {
    if (!isNaN(audioPlayer.duration)) {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;

        seekBar.value = (currentTime / duration) * 100;
        currentTimeElem.textContent = formatTime(currentTime);
        totalTimeElem.textContent = formatTime(duration);
    }
}

function seekAudio() {
    const seekTo = (audioPlayer.duration / 100) * seekBar.value;
    audioPlayer.currentTime = seekTo;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
