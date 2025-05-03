// tuner-module.js

let tunerAnalyser, tunerBuffer, isTunerRunning = false;

function startTuner() {
  if (!audioCtx || !mic) return;

  tunerAnalyser = audioCtx.createAnalyser();
  tunerAnalyser.fftSize = 4096;
  tunerAnalyser.minDecibels = -90;
  tunerAnalyser.maxDecibels = -10;
  tunerAnalyser.smoothingTimeConstant = 0.85;

  tunerBuffer = new Float32Array(tunerAnalyser.fftSize);
  mic.connect(tunerAnalyser);

  isTunerRunning = true;
  updateTuner();
}
// From 6th string (low E) to 1st string (high E)
const tuningMIDINotes = {
    E: 40,  // E2
    A: 45,  // A2
    D: 50,  // D3
    G: 55,  // G3
    B: 59,  // B3
    'E2': 64 // E4 high E string (needs to be unique from low E)
  };
  
function toggleTuner() {
  const panel = document.getElementById("tunerPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function updateTuner() {
    tunerAnalyser.getFloatTimeDomainData(tunerBuffer);
    const ac = autoCorrelate(tunerBuffer, audioCtx.sampleRate);
    const noteDisplay = document.getElementById('noteDisplay');
    const tuneDirection = document.getElementById('tuneDirection');
  
    if (ac !== -1 && ac < 2000) {
      const detectedMidi = getNote(ac);
      const detectedName = noteStrings[detectedMidi % 12];
  
      noteDisplay.textContent = `${detectedName} (${ac.toFixed(1)} Hz)`;
  
      // Find the closest string note from the current tuning
      let closestStringNote = null;
      let smallestDiff = Infinity;
  
      currentTuning.forEach(note => {
        const midi = tuningMIDINotes[note];
        const freq = getStandardFreq(midi);
        const diff = Math.abs(ac - freq);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestStringNote = { freq, name: note, midi };
        }
      });
  
      const diff = ac - closestStringNote.freq;
  
      if (Math.abs(diff) < 1.5) {
        tuneDirection.textContent = `In Tune with ${closestStringNote.name}`;
        tuneDirection.style.color = "lightgreen";
      } else if (diff < 0) {
        tuneDirection.textContent = `Tune Up ↑ (${closestStringNote.name})`;
        tuneDirection.style.color = "#f39c12";
      } else {
        tuneDirection.textContent = `Tune Down ↓ (${closestStringNote.name})`;
        tuneDirection.style.color = "#e74c3c";
      }
    } else {
      noteDisplay.textContent = "Please Play A String";
      tuneDirection.textContent = "";
    }
  
    requestAnimationFrame(updateTuner);
  }
  
const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNote(frequency) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
}

function frequencyToNoteName(frequency) {
  const note = getNote(frequency);
  return noteStrings[note % 12];
}

function getStandardFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.005) return -1;
  
    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  
    buf = buf.slice(r1, r2);
    SIZE = buf.length;
  
    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) c[i] += buf[j] * buf[j + i];
    }
  
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
  
    return sampleRate / maxpos;
  }
  