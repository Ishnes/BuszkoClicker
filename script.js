// Variables to track game state
let coins = 0;
let baseCoinsPerClick = 1;
let coinsPerClick = baseCoinsPerClick;
let foodBuff = 0;
let currentSkin = 0;
let unlockedSkins = [true, false, false, false, false, false, false];

// DOM Elements
const coinDisplay = document.querySelector('.coiny');
const clickerImage = document.getElementById('buszko');
const foodItems = document.querySelectorAll('.food-item');
const skinImages = document.querySelectorAll('.skins .skin-item img');
const resetButton = document.getElementById('resetButton');

const skinPrices = [0, 750, 5000, 20000, 6900000, 100000000, 69000000000000000];
const skinMultipliers = [1, 2, 5, 10, 55, 100, 500];
const foodPrices = [100, 2500, 100000, 44444444, 240000000, 5600000000];
const foodBuffs = [5, 25, 100, 444, 890, 1650];

// Update the coin display
function updateCoinDisplay() {
    coinDisplay.textContent = `Buszonki: ${coins} (Buszonki na klikniecie: ${coinsPerClick})`;
}

// Save progress
function saveProgress() {
    const progress = {
        coins,
        baseCoinsPerClick,
        foodBuff,
        currentSkin,
        unlockedSkins
    };
    localStorage.setItem('buszkoClickerProgress', JSON.stringify(progress));
}

// Load progress
function loadProgress() {
    const savedProgress = localStorage.getItem('buszkoClickerProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        coins = progress.coins || 0;
        baseCoinsPerClick = progress.baseCoinsPerClick || 1;
        foodBuff = progress.foodBuff || 0;
        currentSkin = progress.currentSkin || 0;
        unlockedSkins = progress.unlockedSkins || [true, false, false, false, false, false, false];
        applySkin(currentSkin);
        updateCoinDisplay();
        updateSkinUI();
    }
}

// Reset all progress
function resetProgress() {
    if (confirm("Czy jesteś pewnien że chcesz zresetować cały postęp?")) {
        coins = 0;
        baseCoinsPerClick = 1;
        coinsPerClick = baseCoinsPerClick;
        foodBuff = 0;
        currentSkin = 0;
        unlockedSkins = [true, false, false, false, false, false, false];
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
    foodItem.addEventListener('click', () => {
        if (coins >= foodPrices[index]) {
            coins -= foodPrices[index];
            foodBuff += foodBuffs[index];
            calculateCoinsPerClick();
            alert(`Nakarmiłeś Buszona! dostajesz wiecej Buszonków ${foodBuffs[index]}.`);
            updateCoinDisplay();
            saveProgress();
        } else {
            alert(`Nie masz wystarczająco Buszonków żeby to kupić :(`);
        }
    });
});

// Initialize the game
loadProgress();

// Event listener for Buszko click
clickerImage.addEventListener('click', clickBuszko);

// Event listener for Reset Button
resetButton.addEventListener('click', resetProgress);