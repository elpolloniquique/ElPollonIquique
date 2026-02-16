/**
 * Admin Panel - Pollería El Pollón
 * - Botón Activar/Desactivar sonido (timbre para nuevos pedidos)
 * - Reproducción de audio al llegar un nuevo pedido
 */

(function () {
  'use strict';

  const SOUND_ENABLED_KEY = 'pollon_admin_sound_enabled';

  function isSoundEnabled() {
    try {
      return localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function setSoundEnabled(enabled) {
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
      updateSoundButtonUI();
    } catch (e) {
      console.warn('No se pudo guardar preferencia de sonido.');
    }
  }

  let _audioContext = null;

  function getAudioContext() {
    if (!_audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) _audioContext = new Ctx();
    }
    return _audioContext;
  }

  /**
   * Reproduce timbre/alarma por 1 segundo usando Web Audio API.
   * No requiere archivos externos.
   */
  function playOrderAlarm() {
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => playOrderAlarm()).catch(() => {});
        return;
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
      console.warn('No se pudo reproducir el timbre:', e);
    }
  }

  function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function updateSoundButtonUI() {
    const btn = document.getElementById('admin-sound-toggle');
    if (!btn) return;

    const enabled = isSoundEnabled();
    btn.textContent = enabled ? '🔔 Desactivar sonido' : '🔕 Activar sonido';
    btn.classList.toggle('admin-sound-on', enabled);
    btn.classList.toggle('admin-sound-off', !enabled);
  }

  function initSoundButton() {
    const btn = document.getElementById('admin-sound-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      unlockAudio();
      setSoundEnabled(!isSoundEnabled());
    });

    updateSoundButtonUI();
  }

  // Exponer para uso en app.js
  window.PollonAdmin = {
    isSoundEnabled: isSoundEnabled,
    playOrderAlarm: playOrderAlarm
  };

  // Inicializar botón cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSoundButton);
  } else {
    initSoundButton();
  }
})();
