/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple synthesizer for classic Minecraft sound effects using Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Classic Minecraft Button Click
export function playClick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Quick retro click tone
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

// 2. Play Retro Experience Orb Sound (Ascending chime)
export function playXp() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  // Fast high pitch ascending frequency sweep
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.setValueAtTime(1100, now + 0.05);
  osc.frequency.setValueAtTime(1500, now + 0.1);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.start();
  osc.stop(now + 0.3);
}

// 3. Play Classic "Oof!" Damage Sound
export function playDamage() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'square';
  const now = ctx.currentTime;
  // Deep grunt voice pitch
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.start();
  osc.stop(now + 0.25);
}

// 4. Play Level Up Chime (Ascending magical arpeggio)
export function playLevelUp() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
  
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.07);
    
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.07 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
    
    osc.start(now + idx * 0.07);
    osc.stop(now + idx * 0.07 + 0.25);
  });
}

// 5. Play Explosion Sound
export function playExplode() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Synthesize white noise for crater explosion
  const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(20, now + 0.5);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  
  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noiseNode.start(now);
  noiseNode.stop(now + 0.55);
}
