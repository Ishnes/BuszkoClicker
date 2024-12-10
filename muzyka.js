// Song Data: Updated Prices and States
const songs = [
    { id: 'song1', cost: 0, src: 'bones.mp3', unlocked: true }, // Free song, already unlocked
    { id: 'song2', cost: 99999999999999999, src: 'enemy.mp3', unlocked: false },
];

// Track Currently Playing Audio and Its ID
let currentAudio = null;
let currentSongId = null;

// Initialize coins (this should be stored and loaded from localStorage)
let coins = 100; // Example initial value, adjust as needed

// Function to Unlock Songs
function unlockSong(song) {
    if (coins >= song.cost && !song.unlocked) {
        coins -= song.cost;
        song.unlocked = true;

        const songImage = document.getElementById(song.id);
        songImage.classList.remove('locked');
        songImage.classList.add('unlocked');
        songImage.title = "Kliknij żeby odtworzyć";

        alert(`Unlocked "${song.id}"!`);
        updateCoinDisplay();
        saveProgress();  // Save progress after unlocking the song
    } else if (song.unlocked) {
        alert("Już to odblokowałeś!");
    } else {
        alert("Nie masz wystarczająco Buszonków, żeby to kupić!");
    }
}

// Function to Play or Stop a Song
function toggleSongPlayback(song) {
    if (!song.unlocked) {
        alert("Musisz najpierw odblokować to");
        return;
    }

    if (currentAudio && currentSongId === song.id) {
        // Stop the current song
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        currentSongId = null;
        alert(`Zatrzymano "${song.id}".`);
    } else {
        // Stop any playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        // Play the selected song
        currentAudio = new Audio(song.src);
        currentAudio.loop = true;
        currentAudio.play();
        currentSongId = song.id;
        alert(`Odtwarzanie "${song.id}"!`);
    }
}

// Function to Save Progress to localStorage
function saveProgress() {
    const progress = {
        coins,
        songs: songs.map(song => ({
            id: song.id,
            unlocked: song.unlocked
        }))
    };

    // Save the progress in localStorage as a JSON string
    localStorage.setItem('gameProgress', JSON.stringify(progress));
    console.log('Progress saved:', progress); // For debugging
}

// Function to Load Progress from localStorage
function loadProgress() {
    const savedProgress = localStorage.getItem('gameProgress');
    if (savedProgress) {
        const { coins: savedCoins, songs: savedSongs } = JSON.parse(savedProgress);

        // Restore coins
        coins = savedCoins;

        // Restore song unlock states
        savedSongs.forEach(savedSong => {
            const song = songs.find(s => s.id === savedSong.id);
            if (song) {
                song.unlocked = savedSong.unlocked;

                // Update the UI for the song
                const songImage = document.getElementById(song.id);
                if (song.unlocked) {
                    songImage.classList.remove('locked');
                    songImage.classList.add('unlocked');
                    songImage.title = "Kliknij żeby odtworzyć";
                } else {
                    songImage.classList.add('locked');
                }
            }
        });

        console.log('Progress loaded:', { coins, songs }); // For debugging
    }
}

// Function to Update Coin Display (UI)
function updateCoinDisplay() {
    const coinDisplay = document.getElementById('coinDisplay');
    if (coinDisplay) {
        coinDisplay.textContent = coins;
    }
}

// Add Event Listeners for Song Images
songs.forEach(song => {
    const songImage = document.getElementById(song.id);

    // Handle Click
    songImage.addEventListener('click', () => {
        if (!song.unlocked) {
            unlockSong(song);
        } else {
            toggleSongPlayback(song);
        }
    });

    // Update Initial Locked State
    if (!song.unlocked) {
        songImage.classList.add('locked');
    } else {
        songImage.classList.add('unlocked');
    }
});

// Show helper displays only if they exist
activeHelpers.forEach((isActive, index) => {
    const helperDisplay = document.getElementById(`helperDisplay${index + 1}`);
    if (helperDisplay && isActive) {
        helperDisplay.classList.remove('hidden');
    }
});

// Add event listeners for helpers
document.querySelectorAll('.helper-item').forEach((helperItem, index) => {
    helperItem.addEventListener('click', () => purchaseHelper(index));
});

// Load saved progress when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    updateCoinDisplay(); // Ensure coin count is displayed
});
