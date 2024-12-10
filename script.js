// Variables to track game state
let coins = 0;
let baseCoinsPerClick = 1;
let coinsPerClick = baseCoinsPerClick;
let foodBuff = 0;
let currentSkin = 0;
let unlockedSkins = [true, false, false, false, false, false, false];
let activeHelpers = [false]; // Ensure this is initialized

// DOM Elements
const coinDisplay = document.querySelector('.coiny');
const clickerImage = document.getElementById('buszko');
const foodItems = document.querySelectorAll('.food-item');
const skinImages = document.querySelectorAll('.skins .skin-item img');
const resetButton = document.getElementById('resetButton');

// Helper constants
const skinPrices = [0, 750, 20000, 100000, 690000, 100000000, 420000000000, 69000000000000000, 999999999999999999];
const skinMultipliers = [1, 2, 5, 10, 55, 100, 420, 696, 1000];
const foodPrices = [100, 2500, 100000, 4444444, 240000000, 5600000000];
const foodBuffs = [5, 25, 100, 444, 975, 1650];
const helperPrices = [125000];
const helperEarnings = [0.1]; // 10% of current Buszonki per click

// Song Data
const songs = [
    { id: 'song1', cost: 10000, src: 'bones.mp3', unlocked: true }, // Free song, already unlocked
    { id: 'song2', cost: 999999999999, src: 'enemy.mp3', unlocked: false },
];

// Track Currently Playing Audio and Its ID
let currentAudio = null;
let currentSongId = null;

// Update the coin display
function updateCoinDisplay() {
    coinDisplay.textContent = `Buszonki: ${Math.floor(coins)} (Buszonki na klikniecie: ${Math.floor(coinsPerClick)})`;
}

// Save progress with song unlock states
function saveProgress() {
    const progress = {
        coins,
        baseCoinsPerClick,
        foodBuff,
        currentSkin,
        unlockedSkins,
        activeHelpers,
        songs: songs.map(song => song.unlocked), // Save song unlock states
        lastOnline: Date.now(),
    };
    localStorage.setItem('buszkoClickerProgress', JSON.stringify(progress));
}

// Load progress, including song unlock states
function loadProgress() {
    const savedProgress = localStorage.getItem('buszkoClickerProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        coins = progress.coins || 0;
        baseCoinsPerClick = progress.baseCoinsPerClick || 1;
        foodBuff = progress.foodBuff || 0;
        currentSkin = progress.currentSkin || 0;
        unlockedSkins = progress.unlockedSkins || [true, false, false, false, false, false, false];
        activeHelpers = progress.activeHelpers || [false];
        const savedSongs = progress.songs || [true, false]; // Default to song1 unlocked, song2 locked

        // Restore the song unlock states
        songs.forEach((song, index) => {
            song.unlocked = savedSongs[index];
            const songImage = document.getElementById(song.id);
            if (song.unlocked) {
                songImage.classList.add('unlocked');
                songImage.classList.remove('locked');
            } else {
                songImage.classList.add('locked');
                songImage.classList.remove('unlocked');
            }
        });

        const lastOnline = progress.lastOnline || Date.now();
        const timeElapsed = (Date.now() - lastOnline) / 1000; // Time elapsed in seconds

        // Calculate offline earnings for active helpers
        activeHelpers.forEach((isActive, index) => {
            if (isActive) {
                const earnings = coinsPerClick * helperEarnings[index] * timeElapsed;
                coins += earnings;
            }
        });

        applySkin(currentSkin);
        updateCoinDisplay();
        updateSkinUI();

        // Restart active helpers
        activeHelpers.forEach((isActive, index) => {
            if (isActive) {
                const helperDisplay = document.getElementById(`helperDisplay${index + 1}`);
                if (helperDisplay) {
                    helperDisplay.classList.remove('hidden');
                }
                startHelper(index); // Restart helper interval here
            }
        });
    }
}

// Initialize the game
loadProgress();

// Save progress periodically to track the last online time
setInterval(saveProgress, 10000); // Save every 10 seconds

// Reset all progress
function resetProgress() {
    if (confirm("Czy jesteś pewnien że chcesz zresetować cały postęp?")) {
        coins = 0;
        baseCoinsPerClick = 1;
        coinsPerClick = baseCoinsPerClick;
        foodBuff = 0;
        currentSkin = 0;
        unlockedSkins = [true, false, false, false, false, false, false];
        activeHelpers = [false];
        songs.forEach(song => song.unlocked = false); // Reset all songs to locked

        document.querySelectorAll('.helper-item').forEach((helperItem, index) => {
            const helperDisplay = document.getElementById(`helperDisplay${index + 1}`);
            if (helperDisplay) {
                helperDisplay.classList.add('hidden');
            }
        });

        saveProgress();
        loadProgress();
        alert("Postęp zresetowany!");
    }
}

// Buszko click handler
function clickBuszko() {
    coins += coinsPerClick;
    updateCoinDisplay();
    saveProgress();
}

// Apply a skin
function applySkin(skinIndex) {
    if (unlockedSkins[skinIndex]) {
        currentSkin = skinIndex;
        clickerImage.src = skinImages[skinIndex].src;
        calculateCoinsPerClick();
        updateSkinUI();
        saveProgress();
    } else {
        alert("Jeszcze nie odblokowałeś tego skina :/");
    }
}

// Calculate coins per click
function calculateCoinsPerClick() {
    const skinMultiplier = skinMultipliers[currentSkin];
    coinsPerClick = (baseCoinsPerClick + foodBuff) * skinMultiplier;
}

// Update skin UI
function updateSkinUI() {
    skinImages.forEach((img, index) => {
        img.classList.toggle('unlocked', unlockedSkins[index]);
        img.style.opacity = unlockedSkins[index] ? '1' : '0.5';
        img.style.cursor = unlockedSkins[index] ? 'pointer' : 'not-allowed';
    });
}

// Handle skin click
skinImages.forEach((img, index) => {
    img.addEventListener('click', () => {
        if (unlockedSkins[index]) {
            applySkin(index);
        } else if (coins >= skinPrices[index]) {
            coins -= skinPrices[index];
            unlockedSkins[index] = true;
            applySkin(index);
            alert(`Odblokowałeś skina :D`);
            updateCoinDisplay();
            saveProgress();
        } else {
            alert(`Nie masz wystarczająco Buszonków żeby to kupić :(`);
        }
    });
});

// Handle food purchases
foodItems.forEach((foodItem, index) => {
    const buyButton = document.getElementById(`buy-food${index + 1}`);
    const quantityInput = document.getElementById(`food${index + 1}-quantity`);
    const maxQuantityDisplay = document.getElementById(`food${index + 1}-max`);

    function updateMaxQuantity() {
        const maxQuantity = Math.floor(coins / foodPrices[index]);
        maxQuantityDisplay.textContent = `Max: ${maxQuantity}`;
        quantityInput.setAttribute("max", maxQuantity);
    }

    updateMaxQuantity();

    buyButton.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value);
        const totalCost = foodPrices[index] * quantity;

        if (quantity <= 0) {
            alert("Wpisz dodatnią liczbę!");
            return;
        }

        if (coins >= totalCost) {
            coins -= totalCost;
            foodBuff += foodBuffs[index] * quantity;
            calculateCoinsPerClick();
            alert(`Nakarmiłeś Buszona! Dostajesz więcej Buszonków: ${foodBuffs[index] * quantity}.`);
            updateCoinDisplay();
            saveProgress();
            updateMaxQuantity();
        } else {
            alert(`Nie masz wystarczająco Buszonków, żeby to kupić!`);
        }
    });

    setInterval(updateMaxQuantity, 1000);
});

// Event listener for Buszko click
clickerImage.addEventListener('click', clickBuszko);

// Event listener for Reset Button
resetButton.addEventListener('click', resetProgress);

// Start a helper's autoclick
function startHelper(index) {
    setInterval(() => {
        if (activeHelpers[index]) {
            const earnings = coinsPerClick * helperEarnings[index];
            coins += earnings;
            updateCoinDisplay();
            saveProgress();
        }
    }, 1000);
}

// Purchase a helper
function purchaseHelper(index) {
    if (coins >= helperPrices[index] && !activeHelpers[index]) {
        coins -= helperPrices[index];
        activeHelpers[index] = true;

        const helperDisplay = document.getElementById(`helperDisplay${index + 1}`);
        if (helperDisplay) {
            helperDisplay.classList.remove('hidden');
        }

        startHelper(index);
        alert("Pomocnik kupiony!");
        updateCoinDisplay();
        saveProgress();
    } else if (activeHelpers[index]) {
        alert("Już masz tego pomocnika!");
    } else {
        alert("Nie masz wystarczająco Buszonków na tego pomocnika!");
    }
}

// Add event listeners for helpers
document.querySelectorAll('.helper-item').forEach((helperItem, index) => {
    helperItem.addEventListener('click', () => purchaseHelper(index));
});

// Song handling
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
        saveProgress();
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
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        currentSongId = null;
        alert(`Zatrzymano "${song.id}".`);
    } else {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        currentAudio = new Audio(song.src);
        currentAudio.loop = true;
        currentAudio.play();
        currentSongId = song.id;
        alert(`Odtwarzanie "${song.id}"!`);
    }
}

// Add Event Listeners for Song Images
songs.forEach(song => {
    const songImage = document.getElementById(song.id);
    songImage.addEventListener('click', () => {
        if (!song.unlocked) {
            unlockSong(song);
        } else {
            toggleSongPlayback(song);
        }
    });

    if (!song.unlocked) {
        songImage.classList.add('locked');
    } else {
        songImage.classList.add('unlocked');
    }
});
