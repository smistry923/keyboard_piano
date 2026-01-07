// Piano note frequencies (extended range)
const noteFrequencies = {
    'C3': 130.81,
    'C#3': 138.59,
    'D3': 146.83,
    'D#3': 155.56,
    'E3': 164.81,
    'F3': 174.61,
    'F#3': 185.00,
    'G3': 196.00,
    'G#3': 207.65,
    'A3': 220.00,
    'A#3': 233.08,
    'B3': 246.94,
    'C4': 261.63,
    'C#4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,
    'A4': 440.00,
    'A#4': 466.16,
    'B4': 493.88,
    'C5': 523.25,
    'C#5': 554.37,
    'D5': 587.33,
    'D#5': 622.25,
    'E5': 659.25,
    'F5': 698.46,
    'F#5': 739.99,
    'G5': 783.99,
    'G#5': 830.61,
    'A5': 880.00,
    'A#5': 932.33,
    'B5': 987.77,
    'C6': 1046.50,
    'C#6': 1108.73,
    'D6': 1174.66,
    'D#6': 1244.51,
    'E6': 1318.51
};

// Real song melodies (note sequences using keyboard mappings)
// Lower octave: C D E F G A B = C3 D3 E3 F3 G3 A3 B3
// Upper octave: Z X V N M K L Q = C4 D4 E4 F4 G4 A4 B4 C5
const songs = [
    {
        name: "Twinkle Twinkle Little Star",
        notes: "zzmmkkllmmnnnmllmmnnllmmnnzzmmkkllmmnnnzzz"
    },
    {
        name: "Happy Birthday",
        notes: "zzxzvxzzxzmxzzzkmzqqklz"
    },
    {
        name: "Mary Had a Little Lamb",
        notes: "xzzxxxxxxxxxxxxxnnxzxxxxxxxxz"
    },
    {
        name: "Jingle Bells",
        notes: "xxxxxxxxxnzxllllxxxxnnnlx"
    },
    {
        name: "Ode to Joy",
        notes: "xxvnmlxzxxzzxxxvnmlxzzxvx"
    },
    {
        name: "Hot Cross Buns",
        notes: "xzzxzzzzzzzxxxxzz"
    },
    {
        name: "Row Row Row Your Boat",
        notes: "zzzxvnnnxvnknvzzznnnxz"
    },
    {
        name: "London Bridge",
        notes: "nmlnxlxlxxxxnnmlnx"
    }
];

// Game state
let currentSong = null;
let currentSentence = '';
let currentIndex = 0;
let score = 0;
let correctCount = 0;
let totalCount = 0;
let audioContext;
let isGameActive = false;
let pitchTranspose = 0; // Semitone offset for key change
let isCustomMode = false; // Track if we're in custom/free-play mode

// DOM elements
const sentenceText = document.getElementById('sentenceText');
const scoreElement = document.getElementById('score');
const accuracyElement = document.getElementById('accuracy');
const newSongBtn = document.getElementById('newSongBtn');
const customSongBtn = document.getElementById('customSongBtn');
const customModal = document.getElementById('customModal');
const customSentence = document.getElementById('customSentence');
const submitCustom = document.getElementById('submitCustom');
const cancelCustom = document.getElementById('cancelCustom');
const keys = document.querySelectorAll('.key');

// Initialize Audio Context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Apply pitch transpose
function getTransposedFrequency(baseFrequency) {
    // Each semitone = multiply by 2^(1/12)
    return baseFrequency * Math.pow(2, pitchTranspose / 12);
}

// Play note sound
function playNote(frequency, duration = 0.3) {
    initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = getTransposedFrequency(frequency);
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Animate piano key
function animateKey(key) {
    if (!key) return;

    key.classList.add('active');
    const note = key.getAttribute('data-note');

    if (note && noteFrequencies[note]) {
        playNote(noteFrequencies[note]);
    }

    setTimeout(() => {
        key.classList.remove('active');
    }, 300);
}

// Get valid keys for piano
function getValidKeys() {
    const validKeys = new Set();
    keys.forEach(key => {
        validKeys.add(key.getAttribute('data-key').toLowerCase());
    });
    return validKeys;
}

// Filter sentence to only include valid piano keys
function filterSentence(text) {
    const validKeys = getValidKeys();
    return text.toLowerCase()
        .split('')
        .filter(char => char === ' ' || validKeys.has(char))
        .join('');
}

// Start new game with random song
function startNewGame() {
    currentSong = songs[Math.floor(Math.random() * songs.length)];
    currentSentence = currentSong.notes;
    resetGame();
}

// Start specific song
function startSong(songIndex) {
    if (songIndex >= 0 && songIndex < songs.length) {
        currentSong = songs[songIndex];
        currentSentence = currentSong.notes;
        resetGame();
    }
}

// Start custom game (pre-entered melody)
function startCustomGame(text) {
    const filtered = filterSentence(text);
    if (filtered.length === 0) {
        alert('Please enter a melody with valid piano keys (c-g, a-b, z, x, v, n, m, k, l, q, and sharps: r, t, u, i, o, s, w, h, j, p)');
        return false;
    }
    currentSong = { name: "Custom Melody", notes: filtered };
    currentSentence = filtered;
    isCustomMode = false;
    resetGame();
    return true;
}

// Start free-play custom mode (live typing)
function startCustomFreePlay() {
    currentSong = { name: "Custom Melody (Live)", notes: "" };
    currentSentence = "";
    isCustomMode = true;
    resetGame();
}

// Change pitch/key
function changePitch(semitones) {
    pitchTranspose += semitones;
    updatePitchDisplay();
}

function updatePitchDisplay() {
    const pitchDisplay = document.getElementById('pitchDisplay');
    if (pitchDisplay) {
        if (pitchTranspose === 0) {
            pitchDisplay.textContent = 'Original';
        } else if (pitchTranspose > 0) {
            pitchDisplay.textContent = `+${pitchTranspose}`;
        } else {
            pitchDisplay.textContent = pitchTranspose;
        }
    }
}

// Reset game state
function resetGame() {
    currentIndex = 0;
    score = 0;
    correctCount = 0;
    totalCount = 0;
    isGameActive = true;
    updateDisplay();
}

// Update display
function updateDisplay() {
    // Update song title
    const songTitle = document.getElementById('songTitle');
    if (songTitle && currentSong) {
        songTitle.textContent = currentSong.name;
    }

    // Update sentence display
    const chars = currentSentence.split('').map((char, index) => {
        let className = 'char';
        if (index < currentIndex) {
            className += ' correct';
        } else if (index === currentIndex) {
            className += ' current';
        }
        return `<span class="${className}">${char.toUpperCase()}</span>`;
    });
    sentenceText.innerHTML = chars.join('');

    // Update score
    scoreElement.textContent = score;

    // Update accuracy
    const accuracy = totalCount === 0 ? 100 : Math.round((correctCount / totalCount) * 100);
    accuracyElement.textContent = accuracy + '%';

    // Update pitch display
    updatePitchDisplay();
}

// Handle keypress
function handleKeyPress(event) {
    if (!isGameActive) return;

    const pressedKey = event.key.toLowerCase();

    // Find the corresponding piano key
    const pianoKey = Array.from(keys).find(key =>
        key.getAttribute('data-key') === pressedKey
    );

    if (!pianoKey) return;

    // Animate the key
    animateKey(pianoKey);

    // Custom mode: add keys as you type
    if (isCustomMode) {
        currentSentence += pressedKey;
        currentIndex++;
        score += 10;
        correctCount++;
        totalCount++;
        updateDisplay();
        return;
    }

    // Regular mode: check against expected key
    const expectedKey = currentSentence[currentIndex];
    totalCount++;

    // Check if correct
    if (pressedKey === expectedKey) {
        correctCount++;
        score += 10;
        currentIndex++;

        // Check if song is complete
        if (currentIndex >= currentSentence.length) {
            setTimeout(() => {
                const songName = currentSong ? currentSong.name : 'the song';
                alert(`Congratulations! You completed ${songName}!\nFinal Score: ${score}\nAccuracy: ${Math.round((correctCount / totalCount) * 100)}%`);
                isGameActive = false;
            }, 300);
        }
    } else {
        // Wrong key
        score = Math.max(0, score - 5);

        // Add shake animation to current char
        const currentChar = sentenceText.children[currentIndex];
        if (currentChar) {
            currentChar.classList.add('incorrect');
            setTimeout(() => {
                currentChar.classList.remove('incorrect');
            }, 300);
        }
    }

    updateDisplay();
}

// Mouse click on piano keys
keys.forEach(key => {
    key.addEventListener('click', () => {
        const keyChar = key.getAttribute('data-key');
        const event = new KeyboardEvent('keydown', { key: keyChar });
        handleKeyPress(event);
    });
});

// Event listeners
document.addEventListener('keydown', handleKeyPress);

newSongBtn.addEventListener('click', () => {
    initAudio();
    startNewGame();
});

customSongBtn.addEventListener('click', () => {
    initAudio();
    startCustomFreePlay();
});

submitCustom.addEventListener('click', () => {
    initAudio();
    const text = customSentence.value.trim();
    if (text && startCustomGame(text)) {
        customModal.classList.remove('active');
    }
});

cancelCustom.addEventListener('click', () => {
    customModal.classList.remove('active');
});

// Close modal on outside click
customModal.addEventListener('click', (e) => {
    if (e.target === customModal) {
        customModal.classList.remove('active');
    }
});

// Pitch control buttons
const pitchUpBtn = document.getElementById('pitchUp');
const pitchDownBtn = document.getElementById('pitchDown');
const pitchResetBtn = document.getElementById('pitchReset');

if (pitchUpBtn) {
    pitchUpBtn.addEventListener('click', () => {
        changePitch(1);
    });
}

if (pitchDownBtn) {
    pitchDownBtn.addEventListener('click', () => {
        changePitch(-1);
    });
}

if (pitchResetBtn) {
    pitchResetBtn.addEventListener('click', () => {
        pitchTranspose = 0;
        updatePitchDisplay();
    });
}

// Song selection
const songSelect = document.getElementById('songSelect');
if (songSelect) {
    songSelect.addEventListener('change', (e) => {
        initAudio();
        const songIndex = parseInt(e.target.value);
        if (songIndex >= 0) {
            startSong(songIndex);
        }
    });
}

// Start with a random sentence
window.addEventListener('load', () => {
    startNewGame();
});
