const oscillators = [];
for (i = 1; i <= 36; i++) {
    oscillators[i] = null;
}
const gainNodes = [];
const freqs = [];

function generateJustFreqs(fundamental) {
    freqs[0] = fundamental;
    freqs[1] = fundamental * 16 / 15;
    freqs[2] = fundamental * 9 / 8;
    freqs[3] = fundamental * 6 / 5;
    freqs[4] = fundamental * 5 / 4;
    freqs[5] = fundamental * 4 / 3;
    freqs[6] = fundamental * 7 / 5;
    freqs[7] = fundamental * 3 / 2;
    freqs[8] = fundamental * 8 / 5;
    freqs[9] = fundamental * 5 / 3;
    freqs[10] = fundamental * 16 / 9;
    freqs[11] = fundamental * 15 / 8;
    freqs[12] = 2 * fundamental;
    for (i = 13; i < 36; i++) {
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
    if (e.target.value === "just") {
        generateJustFreqs(130.81);
    } else if (e.target.value === "equal") {
        generateEqualFreqs(130.81);
    }
});

generateJustFreqs(130.81);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playNote(number) {
    audioCtx.resume();

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.1;
    gainNodes[number] = gainNode;

    console.log(freqs[number - 1])
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
