function generateNotesWithFreq() {
  const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  const startOctave = 1;
  const endOctave = 6;
  const A4_INDEX = notes.indexOf('A') + 4 * 12; // MIDI number of A4 = 9 + 48 = 57
  const result = {};

  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (let i = 0; i < notes.length; i++) {
      const noteName = notes[i] + octave;

      // Calculate MIDI note number
      const noteIndex = i + octave * 12;

      // Calculate semitones difference from A4 (MIDI 69)
      const semitonesFromA4 = noteIndex - (9 + 4 * 12);

      // Frequency formula: f = 440 * 2^(n/12)
      const freq = 440 * Math.pow(2, semitonesFromA4 / 12);

      result[noteName] = +freq.toFixed(2);
    }
  }
  return result;
}

const notes = generateNotesWithFreq();

// AudioContext gets blocked by browser bc AutoPlay
// For development purposes we disable this safety feature
// In the final release we would have a "Start Game" button that guarantees that the game has permission to play audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();
gainNode.gain.value = 0.04; // volume
gainNode.connect(audioCtx.destination);

function playNote(freq, startTime, duration) {
  const osc = audioCtx.createOscillator();
  osc.type = 'square'; // or 'sine', 'triangle', 'sawtooth'
  osc.frequency.setValueAtTime(freq, startTime);
  osc.connect(gainNode);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Play pattern ad infinitum
function playPattern(pattern) {
  let startTime = audioCtx.currentTime;

  function schedule() {
    let time = startTime;

    for (const { note, duration } of pattern) {
      const freq = notes[note];
      if (freq) {
        playNote(freq, time, duration);
      }
      time += duration;
    }

    // Schedule next loop after total pattern duration
    const patternDuration = pattern.reduce((acc, p) => acc + p.duration, 0);
    startTime += patternDuration;
    setTimeout(schedule, patternDuration * 1000 - 50); // minus small buffer
  }

  schedule();
}

export function playBoogie() {
  playPattern([
    { note: 'c4', duration: 0.3 },
    { note: 'e4', duration: 0.3 },
    { note: 'g4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'a#4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'g4', duration: 0.3 },
    { note: 'e4', duration: 0.3 },
    
    { note: 'c4', duration: 0.3 },
    { note: 'e4', duration: 0.3 },
    { note: 'g4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'a#4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'g4', duration: 0.3 },
    { note: 'e4', duration: 0.3 },

    { note: 'f4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'c5', duration: 0.3 },
    { note: 'd5', duration: 0.3 },
    { note: 'd#5', duration: 0.3 },
    { note: 'd5', duration: 0.3 },
    { note: 'c5', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    
    { note: 'c4', duration: 0.3 },
    { note: 'e4', duration: 0.3 },
    { note: 'g4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'a#4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'g4', duration: 0.3 },
    { note: 'e4', duration: 0.3 },

    { note: 'g4', duration: 0.3 },
    { note: 'b4', duration: 0.3 },
    { note: 'd5', duration: 0.3 },
    { note: 'e5', duration: 0.3 },
    { note: 'f4', duration: 0.3 },
    { note: 'a4', duration: 0.3 },
    { note: 'c5', duration: 0.3 },
    { note: 'd5', duration: 0.3 },
  ]);
}
