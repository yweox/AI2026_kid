/**
 * SafeKids Kid Mode Module
 * Handles child position detection, safety zone status card,
 * out-of-zone warning modal & Web Audio warning sound FX.
 */

window.KidMode = (function () {
  let currentPos = { lat: 37.28, lng: 127.44 };
  let allZones = [];
  let isInSafetyZone = true;
  let nearestZone = null;
  let audioContext = null;

  /**
   * Initializes Kid Mode with zone data and initial location
   */
  function init(zones, initialPos) {
    allZones = zones;
    if (initialPos) {
      currentPos = initialPos;
    }
    
    bindEvents();
    checkSafetyStatus();
  }

  function bindEvents() {
    const btnEnter = document.getElementById('sim-btn-enter');
    const btnExit = document.getElementById('sim-btn-exit');
    const modalClose = document.getElementById('warning-modal-close');

    if (btnEnter) {
      btnEnter.addEventListener('click', simulateEnterZone);
    }
    if (btnExit) {
      btnExit.addEventListener('click', simulateExitZone);
    }
    if (modalClose) {
      modalClose.addEventListener('click', closeWarningModal);
    }
  }

  /**
   * Calculates Haversine Distance in meters between two lat/lng points
   */
  function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Checks if user is within 300m of any school zone
   */
  function checkSafetyStatus() {
    if (allZones.length === 0) return;

    let minDistance = Infinity;
    let closest = null;

    allZones.forEach(zone => {
      const dist = calculateDistanceMeters(currentPos.lat, currentPos.lng, zone.lat, zone.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = zone;
      }
    });

    nearestZone = closest;
    const SAFETY_THRESHOLD_METERS = 300;
    const previousState = isInSafetyZone;
    isInSafetyZone = minDistance <= SAFETY_THRESHOLD_METERS;

    updateStatusUI(minDistance);
    MapEngine.updateUserMarker(currentPos.lat, currentPos.lng);

    // If transitioned from inside to outside, trigger warning alarm!
    if (previousState && !isInSafetyZone) {
      triggerWarningModal();
      playWarningSound();
    }
  }

  /**
   * Updates Kid Mode Card UI
   */
  function updateStatusUI(distMeters) {
    const card = document.getElementById('kid-status-card');
    const avatar = document.getElementById('kid-status-avatar');
    const title = document.getElementById('kid-status-title');
    const desc = document.getElementById('kid-status-desc');

    if (!card || !title || !desc) return;

    if (isInSafetyZone) {
      card.className = 'kid-status-card in-zone';
      avatar.textContent = '🛡️';
      title.textContent = '안전한 스쿨존 안이에요!';
      desc.textContent = `${nearestZone ? nearestZone.name : '어린이보호구역'} (약 ${Math.round(distMeters)}m 거리)`;
    } else {
      card.className = 'kid-status-card out-zone';
      avatar.textContent = '⚠️';
      title.textContent = '스쿨존 밖으로 이탈했어요!';
      desc.textContent = `가장 가까운 안전구역까지 약 ${Math.round(distMeters)}m. 차조심 하세요!`;
    }
  }

  /**
   * Simulation: Move kid into nearest school zone
   */
  function simulateEnterZone() {
    if (allZones.length === 0) return;
    // Pick the first zone or nearest zone coordinates
    const targetZone = nearestZone || allZones[0];
    // Slightly offset coords within 50 meters
    currentPos = {
      lat: targetZone.lat + 0.0002,
      lng: targetZone.lng + 0.0002
    };

    checkSafetyStatus();
    MapEngine.focusZone(currentPos.lat, currentPos.lng);
  }

  /**
   * Simulation: Move kid outside safety zone (500m away)
   */
  function simulateExitZone() {
    if (allZones.length === 0) return;
    const targetZone = nearestZone || allZones[0];
    // Move ~600 meters away
    currentPos = {
      lat: targetZone.lat + 0.006,
      lng: targetZone.lng + 0.006
    };

    checkSafetyStatus();
    MapEngine.focusZone(currentPos.lat, currentPos.lng);
  }

  /**
   * Displays Danger Alarm Modal
   */
  function triggerWarningModal() {
    const modal = document.getElementById('warning-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  function closeWarningModal() {
    const modal = document.getElementById('warning-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Plays warning sound using Web Audio API synthesis
   */
  function playWarningSound() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const now = audioContext.currentTime;
      
      // High-pitched warning beep 1
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Warning beep 2
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(880, now + 0.35);
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.65);
      gain2.gain.setValueAtTime(0.3, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }

  return {
    init,
    simulateEnterZone,
    simulateExitZone,
    getCurrentPos: () => currentPos
  };
})();
