import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, update, onValue, set } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithRedirect } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBMPmNPLGHrBBU3d2DNgq1rutE5R5fBAWc",
    authDomain: "buszkoclicker.firebaseapp.com",
    databaseURL: "https://buszkoclicker-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "buszkoclicker",
    storageBucket: "buszkoclicker.firebasestorage.app",
    messagingSenderId: "951563794729",
    appId: "1:951563794729:web:f02b247e6cc5c16cf41f38"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let coins = 0;
let baseCoinsPerClick = 1;
let coinsPerClick = baseCoinsPerClick;
let foodBuff = 0;
let currentSkin = 0;
let unlockedSkins = [true, false, false, false, false, false, false];
let activeHelpers = [false]; // Ensure this is initialized
let lastSavedScore = 0;
let currentAudio = null;
let currentSongId = null;
let progress = {};
let userId = null; // Globalna zmienna na ID użytkownika
let currentNick = ""; // Globalna zmienna na nick
// DOM Elements
const coinDisplay = document.querySelector('.coiny');
const clickerImage = document.getElementById('buszko');
const foodItems = document.querySelectorAll('.food-item');
const skinImages = document.querySelectorAll('.skins .skin-item img');
const resetButton = document.getElementById('resetButton');
const skinPrices = 
[
    0, 
    10000, 
    200000, 
    3000000, 
    40000000, 
    500000000, 
    60000000000, 
    700000000000, 
    80000000000000, 
    90000000000000000, 
    10000000000000000000, 
    11000000000000000000000,
    120000000000000000000000000,
    130000000000000000000000000000
];
const skinMultipliers = [1, 2, 4, 10, 20, 50, 100, 250, 500, 1000, 1200, 1400, 1600, 1800];
const foodPrices = [100, 2500, 10000, 300000, 2500000, 50000000];
const foodBuffs = [1, 5, 10, 25, 100, 250];
const helperPrices = [225000, 1000000, 500000000];
const helperEarnings = [0.01, 0.05, 0.10]; // 10% of current Buszonki per click
const nickInput = document.querySelector('#playerNick');
const songs = [
    { id: 'song1', cost: 0, src: 'bones.mp3', unlocked: true }, // Free song, already unlocked
    { id: 'song2', cost: 9999, src: 'enemy.mp3', unlocked: false },];

function formatCoins(value) {
    if (value < 100_000_000) return value.toString();

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let zeros = Math.floor(Math.log10(value)); // Liczba zer w liczbie
    let letterIndex = Math.max(0, zeros - 8); // Odliczamy od 100 milionów (8 zer)

    // Obsługa wieloliterowych oznaczeń
    let letter = '';
    while (letterIndex >= 0) {
        letter = alphabet[letterIndex % 26] + letter;
        letterIndex = Math.floor(letterIndex / 26) - 1; // Obsługa kolejnych "cykli"
    }

    // Obliczanie prefiksu (pierwsze 4 cyfry)
    const divisor = Math.pow(10, zeros - 3); // Dzielenie liczby tak, aby 4 cyfry zostały
    const prefix = Math.floor(value / divisor); // Prefiks jako liczba całkowita z 4 cyframi

    return `${prefix}${letter}`;
}
async function getGoogleUserId() {
    const provider = new GoogleAuthProvider();
    try {
        // Logowanie użytkownika przez Google
        const result = await signInWithPopup(auth, provider);      
        // Pobranie unikatowego ID użytkownika
        const user = result.user;
        console.log("Zalogowano jako:", user.displayName, "UID:", user.uid);
        // Zwrócenie unikatowego ID użytkownika
        return user.uid;
    } catch (error) {
        console.error("Błąd logowania przez Google:", error);
        return null;
    }
}

async function initializeAuth() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        userId = result.user.uid;
        console.log("Zalogowano jako:", result.user.displayName);
        localStorage.setItem("userId", userId); // Zapisz userId w localStorage
        loadProgressFromFirebase(); // Wczytaj postęp gry z Firebase
        updateLoginButton(); // Aktualizacja przycisku logowania
    } catch (error) {
        console.error("Błąd logowania:", error);
        if (error.code === "auth/popup-blocked") {
            alert("Twoja przeglądarka zablokowała wyskakujące okno. Upewnij się, że jest dozwolone.");
        }
    }
}

document.getElementById('loginButton').addEventListener("click", async () => {
    initializeAuth();
});

// Modyfikacja funkcji logoutUser
async function logoutUser() {
    try {
        await auth.signOut();
        userId = null;
        localStorage.removeItem("userId");
        updateLoginButton();
        showLogoutCountdown(); // Wywołanie funkcji odliczania
    } catch (error) {
        console.error("Błąd podczas wylogowania:", error);
    }
}

function updateLoginButton() {
    const loginButton = document.getElementById('loginButton');
    if (userId) {
        loginButton.textContent = "Wyloguj"; // Użytkownik jest zalogowany
        loginButton.removeEventListener("click", initializeAuth);
        loginButton.addEventListener("click", logoutUser);
    } else {
        loginButton.textContent = "Zaloguj"; // Użytkownik jest niezalogowany
        loginButton.removeEventListener("click", logoutUser);
        loginButton.addEventListener("click", initializeAuth);
    }
}

// Modyfikacja logiki przy ładowaniu strony
document.addEventListener("DOMContentLoaded", () => {
    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
        userId = savedUserId;
        loadProgressFromFirebase(); // Wczytaj dane użytkownika z Firebase
    }
    updateLoginButton(); // Zaktualizuj stan przycisku
});

// Funkcja odliczająca czas i odświeżająca stronę
function showLogoutCountdown() {
    let countdown = 10;
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.padding = '20px';
    modal.style.backgroundColor = '#1e1e1e';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    modal.style.zIndex = '1000';
    modal.style.textAlign = 'center';

    const message = document.createElement('p');
    message.textContent = 'Wylogowano pomyślnie! Strona odświeży się za 10 sekund.';
    const timer = document.createElement('p');
    timer.style.fontSize = '24px';
    timer.style.fontWeight = 'bold';
    timer.textContent = `Pozostało: ${countdown} sekund`;
    
    modal.appendChild(message);
    modal.appendChild(timer);
    document.body.appendChild(modal);

    const interval = setInterval(() => {
        countdown--;
        timer.textContent = `Pozostało: ${countdown} sekund`;
        if (countdown === 0) {
            clearInterval(interval);
        }
    }, 1000);

    setTimeout(() => {
        document.body.removeChild(modal);
        location.reload();
    }, 10000);
}

function saveProgress() {
    if (!userId) {
        console.error("Użytkownik nie jest zalogowany. Nie można zapisać progresu.");
        return;
    }
    progress = {
        coins,
        baseCoinsPerClick,
        foodBuff,
        currentSkin,
        unlockedSkins,
        activeHelpers,
        lastOnline: Date.now(),
        foodPrices, // Zapisujemy aktualne ceny jedzenia
    };
    const sanitizedId = userId.replace(/\./g, '_');
    const userRef = ref(db, `leaderboard/${sanitizedId}`);
    update(userRef, progress)
        .then(() => console.log("Progres zapisany w Firebase"))
        .catch((error) => console.error("Błąd podczas zapisu do Firebase:", error));
}

setInterval(() => {
    saveProgress();
}, 10000); // Zapisuj co 10 sekund
// Load progress
function loadProgress() {
    const savedProgress = localStorage.getItem('buszkoClickerProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        coins = progress.coins || 0;
        baseCoinsPerClick = progress.baseCoinsPerClick || 1;
        coinsPerClick = baseCoinsPerClick;
        foodBuff = progress.foodBuff || 0;
        currentSkin = progress.currentSkin || 0;
        unlockedSkins = progress.unlockedSkins || [true, false, false, false, false, false, false];
        activeHelpers = progress.activeHelpers || [false];
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
        updateCoinsInFirebase();  // Synchronizuj dane z Firebase
        updateSkinUI();
        // Restart active helpers
	    activeHelpers.forEach((isActive, index) => {

            if (isActive) {

                const helperDisplay = document.getElementById(`helperDisplay${index + 1}`);

                if (helperDisplay) {      helperDisplay.classList.remove('hidden');

                }

                startHelper(index); // Restart helper interval here
            }
        });
    }
}
// Initialize the game
loadProgress();
// Reset all progress
function resetProgress() {
    if (confirm("Czy jesteś pewien, że chcesz zresetować cały postęp?")) {
        // Reset all game state
        localStorage.clear(); // Usuń wszystkie dane z localStorage
        coins = 0;
        baseCoinsPerClick = 1;
        coinsPerClick = baseCoinsPerClick;
        foodBuff = 0;
        currentSkin = 0;
        unlockedSkins = [true, false, false, false, false, false, false];
        activeHelpers = [false]; // Reset all helpers

        // Reset food prices and buffs
        const initialFoodPrices = [100, 2500, 10000, 300000, 2500000, 50000000]; // Początkowe ceny
        foodPrices.forEach((_, index) => {
            foodPrices[index] = initialFoodPrices[index]; // Przywróć początkowe ceny
        });

        // Zaktualizuj wyświetlane ceny jedzenia w interfejsie
        foodItems.forEach((foodItem, index) => {
            const foodSpan = foodItem.querySelector('span');
            foodSpan.textContent = `${foodItem.querySelector('img').alt} [${formatCoins(foodPrices[index])} Buszonki] Buszonki +${foodBuffs[index]}`;
        });

        // Ukryj wszystkie aktywne pomocniki
        document.querySelectorAll('.helper-item').forEach((helperItem, index) => {
            const helperDisplay = document.getElementById(`helperDisplay${index + 1}`);
            if (helperDisplay) {
                helperDisplay.classList.add('hidden');
            }
        });

        // Zapisz progres w Firebase i załaduj od nowa
        saveProgress();
        loadProgress();

        alert("Postęp zresetowany!");
    }
}
// Funkcja do obsługi kliknięcia Buszko
function clickBuszko() {
    coins += coinsPerClick; // Zwiększanie liczby coins o wartość coinsPerClick
    updateCoinDisplay();  // Aktualizowanie wyświetlania liczby coins
    saveProgress();  // Zapisz postęp gry
	updateCoinsInFirebase();
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
    const skinMultiplier = skinMultipliers[currentSkin]; // Mnożnik skina
    coinsPerClick = (baseCoinsPerClick + foodBuff) * skinMultiplier;
}
// Update skin UI
function updateSkinUI() {
    skinImages.forEach((img, index) => {        img.classList.toggle('unlocked', unlockedSkins[index]);
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
// Handle food purchases and quantity logic
foodItems.forEach((foodItem, index) => {
    const buyButton = document.getElementById(`buy-food${index + 1}`);
    const quantityInput = document.getElementById(`food${index + 1}-quantity`);
    const foodSpan = foodItem.querySelector('span'); // Element, w którym będzie wyświetlana cena

    buyButton.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value); // Get the quantity from the input field
        const totalCost = foodPrices[index] * quantity; // Calculate the total cost

        if (quantity <= 0) {
            alert("Wpisz dodatnią liczbę!");
            return;
        }

        if (coins >= totalCost) {
            coins -= totalCost; // Deduct the coins for the total cost
            foodBuff += foodBuffs[index] * quantity; // Apply the food buff multiplied by the quantity
            foodPrices[index] *= 1.05; // Zwiększamy cenę jedzenia o 5%
            
            // Zaktualizuj wyświetlaną cenę
            foodSpan.textContent = `${foodItem.querySelector('img').alt} [${formatCoins(Math.floor(foodPrices[index]))} Buszonki] Buszonki +${foodBuffs[index]}`;

            calculateCoinsPerClick(); // Recalculate the coins per click
            updateCoinDisplay();
            saveProgress(); // Zapisz zmienione dane (w tym ceny jedzenia) w Firebase
        } else {
            alert(`Nie masz wystarczająco Buszonków, żeby to kupić!`);
        }
    });
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
            saveProgress(); // Save progress regularly
        }
    }, 1000); // Autoclick every second
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
        saveProgress(); // Save state after purchase
    } else if (activeHelpers[index]) {

        alert("Już masz tego pomocnika!");

    } else {

        alert("Nie masz wystarczająco Buszonków na tego pomocnika!");

    }

}
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
// Function to Update the UI for Locked/Unlocked Songs
function updateSongUI(song) {
    const songImage = document.getElementById(song.id);
    if (song.unlocked) {
        songImage.classList.remove('locked');
        songImage.classList.add('unlocked');
        songImage.title = "Kliknij żeby odtworzyć";
    } else {
        songImage.classList.remove('unlocked');
        songImage.classList.add('locked');
        songImage.title = `Locked: ${song.cost} Buszonki`;
    }

}
// Function to Unlock Songs
function unlockSong(song) {
    if (coins >= song.cost && !song.unlocked) {
        coins -= song.cost;
        song.unlocked = true;
        updateSongUI(song);
        alert(`Odblokowałeś "${song.id}"!`);
        updateCoinDisplay();
        saveProgress();
    } else if (song.unlocked) {
        alert("Już odblokowałeś tę piosenkę!");

    } else {
        alert("Nie masz wystarczająco Buszonków, żeby odblokować!");
    }
}
// Function to Play or Stop a Song
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
// Event Listeners - For UI Interaction
songs.forEach(song => {
    const songImage = document.getElementById(song.id);
    // Update initial locked/unlocked state on page load
    updateSongUI(song);
    // Handle click events for unlocking or toggling playback
    songImage.addEventListener('click', () => {
        if (!song.unlocked) {
            unlockSong(song);
        } else {
            toggleSongPlayback(song);
        }
    });
});
	
// Save Nick and Coins to Firebase
async function saveScoreToFirebase(nick, coins) {
    if (!userId) {
        console.error("Użytkownik nie jest zalogowany. Nie można zapisać wyniku.");
        return;
    }
    try {
        const sanitizedId = userId.replace(/\./g, '_'); // Ensure the ID is safe for Firebase
        const userRef = ref(db, `leaderboard/${sanitizedId}`);
        // Save both nickname and coins (as raw number) in Firebase
        await update(userRef, {
            nick: nick,
            coins: coins,  // zapisujemy oryginalną liczbę monet
            lastUpdated: Date.now() // Timestamp for last update
        });
        console.log("Dane zapisane w Firebase:", { nick, coins });
    } catch (error) {
        console.error("Błąd podczas zapisu danych do Firebase:", error);
    }
}
// Load progress and nickname from Firebase
async function loadProgressFromFirebase() {
    if (!userId) {
        console.error("Użytkownik nie jest zalogowany.");
        return;
    }

    try {
        const sanitizedId = userId.replace(/\./g, '_');
        const userRef = ref(db, `leaderboard/${sanitizedId}`);

        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const savedProgress = snapshot.val();
                if (savedProgress) {
                    coins = savedProgress.coins || 0;
                    baseCoinsPerClick = savedProgress.baseCoinsPerClick || 1;
                    foodBuff = savedProgress.foodBuff || 0;
                    currentSkin = savedProgress.currentSkin || 0;
                    unlockedSkins = savedProgress.unlockedSkins || [true, false, false, false, false, false, false];
                    activeHelpers = savedProgress.activeHelpers || [false];
                    foodPrices = savedProgress.foodPrices || [100, 2500, 10000, 300000, 2500000, 50000000]; // Wczytujemy ceny jedzenia
                    updateUI();
                }
            } else {
                console.log("Brak zapisanych danych dla tego użytkownika. Inicjalizacja nowego progresu.");
                saveProgress(); // Zapisz dane dla nowego użytkownika
            }
        });
    } catch (error) {
        console.error("Błąd podczas wczytywania danych z Firebase:", error);
    }
}
function updateUI() {
    calculateCoinsPerClick();
    updateCoinDisplay();
    updateSkinUI();
}
document.addEventListener("DOMContentLoaded", async () => {
    // First check if the user is already logged in (i.e., if userId is set in localStorage)
    const savedUserId = localStorage.getItem("userId");

    if (savedUserId) {
        userId = savedUserId;  // Set userId from localStorage
        loadProgressFromFirebase();  // Load the progress if the user is already logged in
    } else {
        await initializeAuth();  // Only call initializeAuth if userId is not found in localStorage
    }
});
// Sprawdzanie istnienia elementów przed przypisaniem zdarzenia
document.addEventListener("DOMContentLoaded", () => {
    const submitButton = document.getElementById("submitNick");
    const nickInput = document.getElementById("playerNick");
    // Ensure both elements exist before proceeding
    if (!submitButton || !nickInput) {
        console.error("Submit button or nick input is missing in the DOM.");
        return;
    }
     submitButton.addEventListener("click", () => {
        const nick = nickInput.value.trim();
        if (!nick) {
            alert("Proszę wprowadzić poprawny nick!");
            return;
        }
    saveScoreToFirebase(nick, coins); // Save both nickname and coins to Firebase
    });
});
    // Other initialization logic requiring nickInput
    setInterval(() => {
    const nick = nickInput.value.trim();
    if (nick && coins !== lastSavedScore) { // Zapis tylko jeśli monety się zmieniły
        saveNickAndCoinsToFirebase(nick);
        lastSavedScore = coins; // Aktualizuj ostatnio zapisany wynik
    }
}, 30000); // Zmiana na zapis co 30 sekund
function updateCoinDisplay() {
    const safeCoins = Number.isFinite(coins) ? Math.floor(coins) : 0;
    const safeCoinsPerClick = Number.isFinite(coinsPerClick) ? Math.floor(coinsPerClick) : 0;

    // Formatowanie liczb za pomocą funkcji formatCoins
    const formattedCoins = formatCoins(safeCoins);
    const formattedCoinsPerClick = formatCoins(safeCoinsPerClick);

    coinDisplay.textContent = `Buszonki: ${formattedCoins} (Buszonki na kliknięcie: ${formattedCoinsPerClick})`;

    // Użyj globalnej zmiennej zamiast pola tekstowego
    if (currentNick && currentNick !== "Unknown") {
        saveNickAndCoinsToFirebase(currentNick);
    }

    if (progress && typeof progress === "object") {
        localStorage.setItem("buszkoClickerProgress", JSON.stringify(progress));
    } else {
        console.error("Niepoprawny obiekt progress:", progress);
    }
}


document.querySelector("#submitNick").addEventListener("click", () => {
    const nick = nickInput.value.trim();
    if (!nick) {
        alert("Proszę wprowadzić poprawny nick!");
        return;
    }
    currentNick = nick; // Aktualizacja globalnej zmiennej
    saveNickAndCoinsToFirebase(nick);
});

setInterval(() => {
    if (currentNick && coins !== lastSavedScore) {
        saveNickAndCoinsToFirebase(currentNick);
        lastSavedScore = coins;
    }
}, 10000);

function updateCoinsInFirebase() {
    if (!userId) {
        console.error("Nie można zaktualizować danych w Firebase: brak userId.");
        return;
    }
    try {
        const sanitizedId = userId.replace(/\./g, '_'); // Upewnij się, że ID jest bezpieczne do użycia w Firebase
        const userRef = ref(db, `leaderboard/${sanitizedId}`);
        const data = {
            coins,
            baseCoinsPerClick,
            foodBuff,
            currentSkin,
            unlockedSkins,
            activeHelpers,
            lastOnline: Date.now(),
        };
        update(userRef, data)
            .then(() => {
                console.log("Dane zostały pomyślnie zaktualizowane w Firebase.");
            })
            .catch((error) => {
                console.error("Błąd podczas aktualizacji danych w Firebase:", error);
            });
    } catch (error) {
        console.error("Błąd w funkcji updateCoinsInFirebase:", error);
    }
}
async function saveNickAndCoinsToFirebase(nick) {
    if (!userId) {
        console.error("Użytkownik nie jest zalogowany.");
        return;
    }
    if (!nick || nick.trim() === "") {
        console.error("Nie można zapisać pustego nicku.");
        return; // Nie zapisuj, jeśli nick jest pusty
    }
    const userRef = ref(db, `leaderboard/${userId}`);
    try {
        await update(userRef, { nick, coins });
        console.log("Nick i coins zapisano pomyślnie w Firebase.");
    } catch (error) {
        console.error("Błąd zapisu do Firebase:", error);
    }
}

    // Automatyczny zapis wyniku co 10 sekund
    document.addEventListener('DOMContentLoaded', () => {
        const nickInput = document.querySelector('#playerNick');
        setInterval(() => {
            const nick = nickInput.value.trim();
            if (nick && coins !== lastSavedScore) {
                saveScoreToFirebase(nick, coins);
                lastSavedScore = coins;
            }
        }, 10000);
    });
// Funkcja do aktualizacji tablicy wyników
function updateLeaderboard() {
    const leaderboardRef = ref(db, "leaderboard");
    onValue(leaderboardRef, (snapshot) => {
        const leaderboardTable = document.querySelector("#leaderboardTable tbody");
        if (!leaderboardTable) return;
        leaderboardTable.innerHTML = ""; // Wyczyść tabelę przed odświeżeniem
        const data = snapshot.val();
        if (data) {
            const sortedData = Object.values(data).sort((a, b) => b.coins - a.coins);
            sortedData.forEach((entry) => {
                const formattedCoins = formatCoins(entry.coins); // Formatowanie monet
                const row = document.createElement("tr");
                row.innerHTML = `<td>${entry.nick}</td><td>${formattedCoins}</td>`; // Wyświetlenie sformatowanych monet
                leaderboardTable.appendChild(row);
            });
        }
    });
}

updateLeaderboard();
