import tkinter as tk
from tkinter import ttk
import sounddevice as sd
import numpy as np
import threading

class GuitarAmpEmulator:
    def __init__(self, root):
        self.root = root
        self.root.title("Guitar Amp Emulator")

        self.knobs = {
            "Gain": tk.DoubleVar(value=5),
            "Bass": tk.DoubleVar(value=5),
            "Mid": tk.DoubleVar(value=5),
            "Treble": tk.DoubleVar(value=5),
            "Volume": tk.DoubleVar(value=5),
            "Presence": tk.DoubleVar(value=5),
            "Reverb": tk.DoubleVar(value=0),
        }

        self.stream = None
        self.running = True
        self.create_ui()
        self.start_audio_thread()

    def create_ui(self):
        frame = ttk.Frame(self.root, padding=20)
        frame.pack(fill=tk.BOTH, expand=True)

        row = 0
        for knob, var in self.knobs.items():
            label = ttk.Label(frame, text=knob)
            label.grid(row=row, column=0, sticky=tk.W)

            slider = ttk.Scale(frame, from_=0, to=10, variable=var, orient=tk.HORIZONTAL, command=self.update_values)
            slider.grid(row=row, column=1, sticky=tk.EW, padx=10)

            rounded_val = tk.StringVar(value=f"{var.get():.1f}")
            var.trace_add("write", lambda *args, v=var, s=rounded_val: s.set(f"{v.get():.1f}"))
            value_label = ttk.Label(frame, textvariable=rounded_val)
            value_label.grid(row=row, column=2, sticky=tk.E)
            row += 1

        frame.columnconfigure(1, weight=1)

    def update_values(self, event=None):
        pass  # values are automatically updated

    def audio_callback(self, indata, outdata, frames, time, status):
        if status:
            print(status)

        signal = indata[:, 0].copy()

        gain = self.knobs["Gain"].get()
        volume = self.knobs["Volume"].get() / 10.0
        bass = self.knobs["Bass"].get() / 10.0
        mid = self.knobs["Mid"].get() / 10.0
        treble = self.knobs["Treble"].get() / 10.0
        presence = self.knobs["Presence"].get() / 10.0

        # Preamp gain
        signal *= gain

        # Apply simple non-linear distortion (tanh saturation)
        signal = np.tanh(signal)

        # Simple EQ shaping (not real filters, just gain staging)
        bass_gain = 1.0 + (bass - 0.5)
        mid_gain = 1.0 + (mid - 0.5)
        treble_gain = 1.0 + (treble - 0.5)

        # Fake 3-band EQ using convolution approximations
        bass_component = signal * bass_gain
        mid_component = signal * mid_gain
        treble_component = signal * treble_gain

        signal = (bass_component + mid_component + treble_component) / 3.0

        # Presence boost (acts as brightener)
        signal *= (1.0 + 0.5 * presence)

        # Volume output control
        signal *= volume

        # Prevent clipping
        signal = np.clip(signal, -1.0, 1.0)

        outdata[:] = np.tile(signal.reshape(-1, 1), (1, indata.shape[1]))


    def start_audio_thread(self):
        def run_audio():
            with sd.Stream(channels=1, callback=self.audio_callback):
                while self.running:
                    sd.sleep(100)

        threading.Thread(target=run_audio, daemon=True).start()

    def stop_audio(self):
        self.running = False

if __name__ == "__main__":
    root = tk.Tk()
    app = GuitarAmpEmulator(root)
    def on_close():
        app.stop_audio()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", on_close)
    root.mainloop()
