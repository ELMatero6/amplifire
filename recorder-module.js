// recorder-module.js
let mediaRecorder, recordedChunks = [];

function setupRecorder() {
    document.getElementById('recordBtn').addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        document.getElementById('recordBtn').textContent = "Start Recording";
      } else {
        startRecording();
        document.getElementById('recordBtn').textContent = "Stop Recording";
      }
    });
  }
  
  function startRecording() {
    const dest = audioCtx.createMediaStreamDestination(); // Use shared audioCtx
    gainNode.connect(dest); // Use the global gainNode from function.js
  
    mediaRecorder = new MediaRecorder(dest.stream);
    recordedChunks = [];
  
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
  
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.getElementById('downloadLink');
      const audioPlayer = document.getElementById('audioPlayer');
  
      downloadLink.href = url;
      downloadLink.download = "guitar_recording.wav";
      downloadLink.textContent = "Download Recording";
      downloadLink.style.display = "block";
  
      audioPlayer.src = url;
      audioPlayer.style.display = "block";
    };
  
    mediaRecorder.start();
  }
  