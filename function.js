// function.js

let audioCtx, mic, preGain, compressor, distortionNode, gainNode, dryGain, wetGain;
let bassEQ, midEQ, trebleEQ;

function makeDistortionCurve(amount) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}


window.addEventListener('click', async () => {
  if (!audioCtx || audioCtx.state === 'suspended') {
    await init();
    if (typeof setupKnobs === 'function') setupKnobs();
    if (typeof setupRecorder === 'function') setupRecorder();
    if (typeof startTuner === 'function') startTuner();
  }
});

async function init() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    }
  });

  mic = audioCtx.createMediaStreamSource(stream);

  // Set up audio nodes
  preGain = audioCtx.createGain();
  compressor = audioCtx.createDynamicsCompressor();
  distortionNode = audioCtx.createWaveShaper();
  gainNode = audioCtx.createGain();
  dryGain = audioCtx.createGain();
  wetGain = audioCtx.createGain();

  // EQ filters
  bassEQ = audioCtx.createBiquadFilter();
  bassEQ.type = 'lowshelf';
  bassEQ.frequency.value = 100;
  bassEQ.gain.value = 0;

  midEQ = audioCtx.createBiquadFilter();
  midEQ.type = 'peaking';
  midEQ.frequency.value = 800;
  midEQ.Q.value = 1;
  midEQ.gain.value = 0;

  trebleEQ = audioCtx.createBiquadFilter();
  trebleEQ.type = 'highshelf';
  trebleEQ.frequency.value = 3000;
  trebleEQ.gain.value = 0;

  // Node configuration
  preGain.gain.value = 1.0;

  compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
  compressor.knee.setValueAtTime(30, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  distortionNode.curve = makeDistortionCurve(50);
  distortionNode.oversample = '4x';

  gainNode.gain.value = 1.0;

  // Routing
  mic.connect(preGain);
  preGain.connect(compressor);

  // Split
  compressor.connect(dryGain);             // Clean path
  compressor.connect(distortionNode);      // Overdrive path
  // --- Cab Simulation Filter Stack (no .wav needed) ---
  const cabLowCut = audioCtx.createBiquadFilter();
  cabLowCut.type = 'highpass';
  cabLowCut.frequency.value = 90; // remove mud

  const cabMidDip = audioCtx.createBiquadFilter();
  cabMidDip.type = 'peaking';
  cabMidDip.frequency.value = 600;
  cabMidDip.Q.value = 1.5;
  cabMidDip.gain.value = -3; // slight scoop

  const cabHighCut = audioCtx.createBiquadFilter();
  cabHighCut.type = 'lowpass';
  cabHighCut.frequency.value = 4500; // remove harsh fizz

  // Re-route wet signal through fake cab
  distortionNode.connect(cabLowCut);
  cabLowCut.connect(cabMidDip);
  cabMidDip.connect(cabHighCut);
  cabHighCut.connect(wetGain);


  // Merge dry + wet → EQ → Output
  dryGain.connect(bassEQ);
  wetGain.connect(bassEQ);
  bassEQ.connect(midEQ);
  midEQ.connect(trebleEQ);
  trebleEQ.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Start with clean only
  dryGain.gain.value = 1.0;
  wetGain.gain.value = 0.0;
}

function setOverdriveBlend(blend) {
  const wet = Math.min(Math.max(blend, 0), 1);
  const dry = 1 - wet;
  if (wetGain && dryGain) {
    wetGain.gain.value = wet;
    dryGain.gain.value = dry;
  }
}
