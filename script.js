const oscillators = [];
for (i = 1; i <= 36; i++) {
    oscillators[i] = null;
}
const gainNodes = [];
const currFreqs = [];

const baseFreqs = [130.81, 138.59, 146.83, 155.56, 164.81, 174.61, 185.00, 196.00, 207.65, 220.00, 233.08, 246.94];

//const pythRatios = [1, 256/243, 9/8, 32/27, 81/64, 4/3, 729/512, 3/2, 128/81, 27/16, 16/9, 243/128, 2];
const fiveLimitRatios = [1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 16/9, 15/8, 2]

const cents = [];

function generateCentDifference() {
    const key = Number(document.getElementById("key").value);
    for (i = 0; i < 12; i++) {
        cents[i] = (1200 * Math.log2(currFreqs[i + key] / currFreqs[key]) - (i * 100)).toFixed(2);
        if (cents[i] == -0.00) cents[i] = (0).toFixed(2); //hack to get around -0;
    }
}

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

function generateMeantoneFreqs(fractionOfSyntonicComma) {
    generateFreqsByStackingFifths(3/2 * (80/81)**fractionOfSyntonicComma);
}

function generateFreqsByStackingFifths(fifth) {
    const key = Number(document.getElementById("key").value);
    for (i = 0; i < 12; i++) {
        currFreqs[key + i] = baseFreqs[key];
    }
    //This isn't simplified in order to understand the concept easier
    currFreqs[key + 1] *= fifth**-5 * 2**3;
    currFreqs[key + 2] *= fifth**2 * 2**-1;
    currFreqs[key + 3] *= fifth**-3 * 2**2;
    currFreqs[key + 4] *= fifth**4 * 2**-2;
    currFreqs[key + 5] *= fifth**-1 * 2;
    currFreqs[key + 6] *= fifth**6 * 2**-3;
    currFreqs[key + 7] *= fifth;
    currFreqs[key + 8] *= fifth**-4 * 2**3;
    currFreqs[key + 9] *= fifth**3 * 2**-1;
    currFreqs[key + 10] *= fifth**-2 * 2**2;
    currFreqs[key + 11] *= fifth**5 * 2**-2;

    //calculate lower
    for (i = 0; i < key; i++) {
        currFreqs[i] = currFreqs[i + 12] / 2;
    }
    //calculate higher
    for (i = 12 + key; i < 36; i++) {
        currFreqs[i] = 2 * currFreqs[i - 12];
    }
}

function generateFreqs() {
    const type = document.getElementById("temperaments").value;
    if (type === "pythagorean") {
        generateFreqsByStackingFifths(3/2);
    } else if (type === "five") {
        generateJustFreqs(fiveLimitRatios);
    } else if (type === "1/4") {
        generateMeantoneFreqs(1/4);
    } else if (type === "1/3") {
        generateMeantoneFreqs(1/3);
    } else if (type === "1/2") {
        generateMeantoneFreqs(1/2);
    } else if (type === "equal") {
        //1/11 of syntonic comma is very close to 1/12 of pythagorean comma
        generateMeantoneFreqs(1/11); 
    }
    generateCentDifference();
    if (document.getElementById("checkFreqs").checked) {
        displayFreqs();
    }
    if (document.getElementById("checkCents").checked) {
        displayCentDifference();
    }
}

document.getElementById("temperaments").addEventListener("change", generateFreqs);
document.getElementById("key").addEventListener("change", generateFreqs);

document.getElementById("checkCents").addEventListener("change", e => e.target.checked ? displayCentDifference() : removeCentDifference());

function displayCentDifference() {
    const keys = document.getElementById("keyboard").children;
    const key = Number(document.getElementById("key").value);
    let centIndex = key == 0 ? 0 : cents.length - key;
    for (i = 0; i < keys.length; i++) {
        keys[i].children[0].textContent = cents[centIndex];
        if (cents[centIndex] > 0) {
            keys[i].children[0].style.color = "#03bafc";
        } else if (cents[centIndex] < 0) {
            keys[i].children[0].style.color = "#ff5454";
        } else {
            if (keys[i].classList.contains("black")) {
                keys[i].children[0].style.color = "white";
            } else {
                keys[i].children[0].style.color = "black";
            }
        }
        keys[i].children[0].style.fontWeight = "bold";
        centIndex = (centIndex + 1) % cents.length;
    }
}

function removeCentDifference() {
    const keys = document.getElementById("keyboard").children;
    for (i = 0; i < keys.length; i++) {
        keys[i].children[0].textContent = "";
    }
}

document.getElementById("checkFreqs").addEventListener("change", e => e.target.checked ? displayFreqs() : removeFreqs());

function displayFreqs() {
    const keys = document.getElementById("keyboard").children;
    for (i = 0; i < keys.length; i++) {
        keys[i].children[1].textContent = currFreqs[i].toFixed(1);
    }
}

function removeFreqs() {
    const keys = document.getElementById("keyboard").children;
    for (i = 0; i < keys.length; i++) {
        keys[i].children[1].textContent = "";
    }
}

generateFreqsByStackingFifths(3/2);
generateCentDifference();

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
    gainNodes[number].gain.exponentialRampToValueAtTime(0.000001, audioCtx.currentTime + 4);
    oscillators[number].stop(audioCtx.currentTime + 4);
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
