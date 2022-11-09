const oscillators = [];
for (i = 1; i <= 36; i++) {
    oscillators[i] = null;
}
const gainNodes = [];
const freqs = [];

const pythRatios = [1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2];
const fiveLimitRatios = [1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 16/9, 15/8, 2]

function generateJustFreqs(fundamental, ratios) {
    for (i = 0; i < ratios.length; i++) {
        freqs[i] = fundamental * ratios[i];
    }
    for (i = ratios.length; i < 36; i++) {
        freqs[i] = 2 * freqs[i - 12];
    }
}

function generateEqualFreqs(fundamental) {
    freqs[0] = fundamental;
    for (i = 1; i <= 12; i++) {
        freqs[i] = fundamental * (Math.pow(2, i / 12));
    }

    for (i = 13; i < 36; i++) {
        freqs[i] = 2 * freqs[i - 12];
    }
}

document.getElementById("temperaments").addEventListener("change", e => {
    if (e.target.value === "pythagorean")  {
        generateJustFreqs(130.81, pythRatios);
    } else if (e.target.value === "five") {
        generateJustFreqs(130.81, fiveLimitRatios);
    } else if (e.target.value === "equal") {
        generateEqualFreqs(130.81);
    }
    if (document.getElementById("checkFreqs").checked) {
        displayFreqs();
    }
});

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
        console.log(keys[i]);
        keys[i].textContent = freqs[i].toFixed(1);
    }
}

function removeFreqs() {
    const keys = document.getElementById("keyboard").children;
    for (i = 0; i < keys.length; i++) {
        console.log(keys[i]);
        keys[i].textContent = "";
    }
}

generateJustFreqs(130.81, pythRatios);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playNote(number) {
    audioCtx.resume();

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.1;
    gainNodes[number] = gainNode;

    const oscillator = audioCtx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = freqs[number - 1];
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
