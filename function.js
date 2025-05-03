// function.js

let audioCtx, mic, preGain, compressor, distortionNode, filterNode, gainNode, dryGain, wetGain;

function makeDistortionCurve(amount) {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = x < 0
      ? Math.tanh(x * amount)
      : Math.tanh(x * amount * 0.6);
  }
  return curve;
}

async function init() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
  filterNode = audioCtx.createBiquadFilter();
  gainNode = audioCtx.createGain();
  dryGain = audioCtx.createGain();
  wetGain = audioCtx.createGain();

  // Node configuration
  preGain.gain.value = 1.0;

  compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
  compressor.knee.setValueAtTime(30, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  distortionNode.curve = makeDistortionCurve(50);
  distortionNode.oversample = '4x';

  filterNode.type = 'lowpass';
  filterNode.frequency.value = 5000;

  gainNode.gain.value = 1.0;
  dryGain.gain.value = 0.5;
  wetGain.gain.value = 0.5;

  // Routing
  mic.connect(preGain);
  preGain.connect(compressor);

  // Dry path
  compressor.connect(dryGain);

  // Wet path
  compressor.connect(distortionNode);
  distortionNode.connect(filterNode);
  filterNode.connect(wetGain);

  // Mix
  dryGain.connect(gainNode);
  wetGain.connect(gainNode);
  gainNode.connect(audioCtx.destination);
}

function setDistortionBlend(amount) {
  const wet = Math.min(Math.max(amount, 0), 1);
  const dry = 1 - wet;
  if (wetGain && dryGain) {
    wetGain.gain.value = wet;
    dryGain.gain.value = dry;
  }
}
