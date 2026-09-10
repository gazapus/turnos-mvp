/**
 * Reproduce un chime corto de aviso (dos tonos).
 * Requiere gesto previo del usuario para que el browser permita audio.
 */
export function playWaitingRoomChime(): void {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const tones = [880, 1174];
  tones.forEach((freq, index) => {
    const offset = index * 0.18;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.16);
  });
}
