const oscillators = [];
for (i = 1; i <= 36; i++) {
    oscillators[i] = null;
}
const gainNodes = [];
const currFreqs = [];

const baseFreqs = [130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94];

const pythRatios = [1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2];
const fiveLimitRatios = [1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 16/9, 15/8, 2]

function generateJustFreqs(ratios) {
    const key = Number(document.getElementById("key").value);
    for (i = 0; i < ratios.length; i++) {
        currFreqs[key + i] = baseFreqs[key] * ratios[i];
    }

    //calculate lower
    for (i = 0; i < key; i++) {
        currFreqs[i] = currFreqs[i + 12] / 2;
    }
    //calculate higher
    for (i = ratios.length + key; i < 36; i++) {
        currFreqs[i] = 2 * currFreqs[i - 12];
    }
}

function generateEqualFreqs() {
    const key = Number(document.getElementById("key").value);
    for (i = 0; i <= 12; i++) {
        currFreqs[i + key] = baseFreqs[key] * (Math.pow(2, i / 12));
    }

     //calculate lower
     for (i = 0; i < key; i++) {
        currFreqs[i] = currFreqs[i + 12] / 2;
    }

    //calculate higher
    for (i = 13 + key; i < 36; i++) {
        currFreqs[i] = 2 * currFreqs[i - 12];
    }
}

function generateFreqs() {
    const type = document.getElementById("temperaments").value;
    if (type === "pythagorean") {
        generateJustFreqs(pythRatios);
    } else if (type === "five") {
        generateJustFreqs(fiveLimitRatios);
    } else if (type === "equal") {
        generateEqualFreqs();
    }
    if (document.getElementById("checkFreqs").checked) {
        displayFreqs();
    }
}

document.getElementById("temperaments").addEventListener("change", generateFreqs);
document.getElementById("key").addEventListener("change", generateFreqs);

document.getElementById("checkFreqs").addEventListener("change", e => {
    if (e.target.checked) {
        displayFreqs();
    } else {
        removeFreqs();
    }
});

function displayFreqs() {
    const keys = document.getElementById("keyboard").children;
    for (i = 0; i < keys.length; i++) {
        keys[i].textContent = currFreqs[i].toFixed(1);
    }
}

function removeFreqs() {
    const keys = document.getElementById("keyboard").children;
    for (i = 0; i < keys.length; i++) {
        keys[i].textContent = "";
    }
}

generateJustFreqs(pythRatios);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playNote(number) {
    audioCtx.resume();

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.1;
    gainNodes[number] = gainNode;

    const oscillator = audioCtx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = currFreqs[number - 1];
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillators[number] = oscillator;
}

function stopNote(number) {
    gainNodes[number].gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNodes[number].gain.exponentialRampToValueAtTime(0.000001, audioCtx.currentTime + 2);
    oscillators[number].stop(audioCtx.currentTime + 2);
    oscillators[number] = null;
}

document.querySelectorAll("li").forEach(key => key.addEventListener("mousedown", e => {
    const key = e.target;
    key.classList.add("active");
    playNote(key.id);
}));

document.querySelectorAll("li").forEach(key => key.addEventListener("mouseleave", e => {
    const key = e.target;
    if (oscillators[key.id] !== null) {
        key.classList.remove("active");
        stopNote(key.id);
    }
}));

document.querySelectorAll("li").forEach(key => key.addEventListener("mouseup", e => {
    if (oscillators[key.id] !== null) {
        key.classList.remove("active");
        stopNote(key.id);
    }
}));

document.querySelectorAll("li").forEach(key => key.addEventListener("touchstart", e => {
    e.preventDefault();
    const key = e.target;
    key.classList.add("active");
    playNote(key.id);
}));

document.querySelectorAll("li").forEach(key => key.addEventListener("touchend", e => {
    const key = e.target;
    if (oscillators[key.id] !== null) {
        key.classList.remove("active");
        stopNote(key.id);
    }
}));

document.addEventListener("keydown", e => {
    const key = document.querySelector(`li[data-key="${e.key}"]`);
    if (key !== null && oscillators[key.id] === null) {
        key.classList.add("active");
        playNote(key.id);
    }
});

document.addEventListener("keyup", e => {
    const key = document.querySelector(`li[data-key="${e.key}"]`);
    if (key !== null && oscillators[key.id] !== null) {
        key.classList.remove("active");
        stopNote(key.id);
    }
});
