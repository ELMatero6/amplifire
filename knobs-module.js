// knobs-module.js

function setupKnobs() {
    createKnob(document.getElementById('volume'), 0, 2, 1, 'volumeVal', '%', v => {
      if (gainNode) gainNode.gain.value = v;
    });
  
    createKnob(document.getElementById('distortion'), 0, 1, 0.5, 'distortionVal', '%', v => {
      setDistortionBlend(v); // use dry/wet blend properly
    });
  
    createKnob(document.getElementById('tone'), 500, 20000, 5000, 'toneVal', 'Hz', v => {
      if (filterNode) filterNode.frequency.value = v;
    });
  }
  
  function createKnob(canvas, min, max, initial, displayId, unit, callback) {
    const ctx = canvas.getContext('2d');
    const center = canvas.width / 2;
    const radius = center - 10;
    let value = initial;
    let angle = (value - min) / (max - min) * 270 - 135;
  
    const updateDisplay = () => {
      const display = document.getElementById(displayId);
      const percent = ((value - min) / (max - min)) * 100;
      display.textContent = unit === 'Hz' ? `${Math.round(value)} Hz` : `${Math.round(percent)}%`;
    };
  
    function drawKnob() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 5;
      ctx.stroke();
  
      const rad = (angle + 135) * (Math.PI / 180);
      const knobX = center + Math.cos(rad) * radius;
      const knobY = center + Math.sin(rad) * radius;
  
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(knobX, knobY);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  
    canvas.addEventListener('mousedown', e => {
      let lastY = e.clientY;
  
      const moveHandler = e => {
        const deltaY = e.clientY - lastY;
        lastY = e.clientY;
        angle = Math.max(-135, Math.min(135, angle - deltaY));
        value = ((angle + 135) / 270) * (max - min) + min;
        callback(value);
        updateDisplay();
        drawKnob();
      };
  
      const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
      };
  
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    });
  
    updateDisplay();
    drawKnob();
    callback(value);
  }
  