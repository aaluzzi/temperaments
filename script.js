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
    const type = document.getElementById("tuning").value;
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

document.getElementById("tuning").addEventListener("change", generateFreqs);
document.getElementById("key").addEventListener("change", generateFreqs);

document.getElementById("checkCents").addEventListener("change", e => e.target.checked ? displayCentDifference() : removeCentDifference());

function displayCentDifference() {
    const keys = document.querySelectorAll("#keyboard li:not(.hidden)");
    const key = Number(document.getElementById("key").value);
    let centIndex = key == 0 ? 0 : cents.length - key;
    for (i = 0; i < keys.length; i++) {
        keys[i].children[0].textContent = cents[centIndex];
        if (cents[centIndex] > 0) {
            keys[i].children[0].style.color = "#38bdf8";
        } else if (cents[centIndex] < 0) {
            keys[i].children[0].style.color = "#fb7185";
        } else {
            if (keys[i].classList.contains("black")) {
                keys[i].children[0].style.color = "#fafafa";
            } else {
                keys[i].children[0].style.color = "black";
            }
        }
        keys[i].children[0].style.fontWeight = "bold";
        centIndex = (centIndex + 1) % cents.length;
    }
}

function removeCentDifference() {
    const keys = document.querySelectorAll("#keyboard li:not(.hidden)");
    for (i = 0; i < keys.length; i++) {
        keys[i].children[0].textContent = "";
    }
}

document.getElementById("checkFreqs").addEventListener("change", e => e.target.checked ? displayFreqs() : removeFreqs());

function displayFreqs() {
    const keys = document.querySelectorAll("#keyboard li:not(.hidden)");
    for (i = 0; i < keys.length; i++) {
        keys[i].children[1].textContent = currFreqs[i].toFixed(1);
    }
}

function removeFreqs() {
    const keys = document.querySelectorAll("#keyboard li:not(.hidden)");
    for (i = 0; i < keys.length; i++) {
        keys[i].children[1].textContent = "";
    }
}

generateMeantoneFreqs(1/11);
generateCentDifference();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const madWorldNotes = [21, 25, 20, 21, 18, 20, 16, 15];
const songOfStormsNotes = [15, 18, 27, 15, 18, 27];
let madWorldIndex = 0;
let songOfStormsIndex = 0;
let raining = false;

async function playRain() {
    try {
        const response = await fetch('/assets/rain.wav');
        const arrayBuffer = await response.arrayBuffer();

        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const gainNode = audioCtx.createGain();

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 3);

        source.start(0);
    } catch (error) {
        console.error('Error raining: ', error);
    }
}

function checkSecretMelodies(note) {
    if (note == madWorldNotes[madWorldIndex]) {
        madWorldIndex++;
        if (madWorldIndex === madWorldNotes.length) {
            document.querySelector(".overlay").style.opacity = '1';
            playRain();
            raining = true;
        }
    } else if (note == songOfStormsNotes[songOfStormsIndex]) {
        songOfStormsIndex++;
        if (songOfStormsIndex === songOfStormsNotes.length) {
            document.querySelector(".overlay").style.opacity = '1';
            playRain();
            raining = true;
        }
    } else {
        madWorldIndex = 0;
        songOfStormsIndex = 0;
    }
}

function playNote(number) {
    if (!raining) {
        checkSecretMelodies(number);
    }
    
    playing[number] = true;
    audioCtx.resume();

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.15;
    gainNodes[number] = gainNode;

    const oscillator = audioCtx.createOscillator();
    oscillator.type = document.getElementById("oscillator").value;
    oscillator.frequency.value = currFreqs[number - 1];
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillators[number] = oscillator;
}

function stopNote(number) {
    playing[number] = false;
    gainNodes[number].gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNodes[number].gain.exponentialRampToValueAtTime(0.000001, audioCtx.currentTime + 3);
    oscillators[number].stop(audioCtx.currentTime + 3);
    oscillators[number] = null;
}

let playing = [];

function onKeyPress(key) {
    if (!playing[key.id]) {
        playing[key.id] = true
        key.classList.add("active");
        playNote(key.id);
    }
}

function onKeyRelease(key) {
    if (playing[key.id]) {
        playing[key.id] = false;
        key.classList.remove("active");
        stopNote(key.id);
    }
}

//Mouse listeners
let held = false;
document.querySelectorAll("li").forEach(key => key.addEventListener("mousedown", e => {
    e.preventDefault();
    e.stopPropagation();
    held = true;
    onKeyPress(e.target)
}));
document.querySelectorAll("li").forEach(key => key.addEventListener("mousemove", e => {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (held) {
        onKeyPress(e.target)
    }
}));
document.querySelectorAll("li").forEach(key => key.addEventListener("mouseleave", e => onKeyRelease(e.target)));
document.querySelectorAll("li").forEach(key => key.addEventListener("mouseup", e => {
    held = false;
    onKeyRelease(e.target);
}));
document.addEventListener('mouseup', () => {
    held = false;
})

//Touch listeners
const touchedKeys = new Map();
document.querySelector("#keyboard").addEventListener("touchstart", e => {
    e.preventDefault();

    for (const touch of e.touches) {
        const touchedKey = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (touchedKey && touchedKey.tagName.toLowerCase() === 'li') {
            touchedKeys.set(touch.identifier, touchedKey);
            onKeyPress(touchedKey)
        }
    }
});
document.querySelector("#keyboard").addEventListener("touchmove", e => {
    e.preventDefault();

    for (const touch of e.changedTouches) {
        const touchedKey = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (touchedKey && touchedKey.tagName.toLowerCase() === 'li' && touchedKeys.has(touch.identifier)) {
            if (touchedKeys.get(touch.identifier) !== touchedKey) {
                onKeyRelease(touchedKeys.get(touch.identifier));
                touchedKeys.set(touch.identifier, touchedKey);
                onKeyPress(touchedKey);
            }
        }
    }
});
document.querySelector("#keyboard").addEventListener("touchend", e => {
    for (const touchEnd of e.changedTouches) {
        if (touchedKeys.has(touchEnd.identifier)) {
            onKeyRelease(touchedKeys.get(touchEnd.identifier));
            touchedKeys.delete(touchEnd.identifier); 
        }
    }
});

//Keyboard press listeners
document.addEventListener("keydown", e => {
    const key = document.querySelector(`li[data-key="${e.key}"]`);
    if (key !== null) {
        onKeyPress(key);
    }
});
document.addEventListener("keyup", e => {
    const key = document.querySelector(`li[data-key="${e.key}"]`);
    if (key !== null) {
        onKeyRelease(key)
    }
});

//From midi messages
const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const C_THREE = 48;

navigator.requestMIDIAccess().then(onMIDISuccess);

function onMIDISuccess(midiAccess) {
    midiAccess.inputs.forEach(entry => entry.addEventListener("midimessage", onMIDIMessage));
}

function onMIDIMessage(event) {
    if (event.data[1] >= C_THREE && event.data[1] < C_THREE + currFreqs.length) {
        if ((event.data[0] & 0xF0) === NOTE_ON) {
            onKeyPress(document.getElementById("keyboard").children[event.data[1] - C_THREE]);
        } else if ((event.data[0] & 0xF0) === NOTE_OFF) {
            onKeyRelease(document.getElementById("keyboard").children[event.data[1] - C_THREE]);
        }
    }
}