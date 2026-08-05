/**
 * SafeKids Gamification Quest & Animal Sticker Collection Engine
 * Features:
 * 1. Point Milestone Gauge Bar (100pt, 200pt, 300pt, 400pt, 500pt treasure box milestones)
 * 2. Dedicated Animal Sticker Collection Popup Modal Window (12 Cute Animal Species)
 */

window.QuestEngine = (function () {
  // 12 Cute Animal Stickers Database
  const ANIMAL_STICKERS = [
    { id: 'stk-1', emoji: '🐱', name: '아기 고양이', rarity: 'common', rarityLabel: '일반', tip: '길을 건널 때 좌우를 꼭 살피며 걸어가요!' },
    { id: 'stk-2', emoji: '🐶', name: '복실 멍뭉이', rarity: 'common', rarityLabel: '일반', tip: '신호등 초록불이 켜져도 일단 멈추고 확인해요!' },
    { id: 'stk-3', emoji: '🐥', name: '삐약이', rarity: 'common', rarityLabel: '일반', tip: '안전하게 학교에 도착하면 미소 지어봐요!' },
    { id: 'stk-4', emoji: '🐰', name: '깡총 토끼', rarity: 'common', rarityLabel: '일반', tip: '뛰지 않고 차분히 안전하게 걸어요!' },
    { id: 'stk-5', emoji: '🐹', name: '동글 햄스터', rarity: 'uncommon', rarityLabel: '고급', tip: '주위를 조심히 살피며 씽씽 킥보드를 타지 않아요!' },
    { id: 'stk-6', emoji: '🐼', name: '아기 판다', rarity: 'uncommon', rarityLabel: '고급', tip: '스쿨존 안에서는 자동차가 천천히 가야 해요!' },
    { id: 'stk-7', emoji: '🦦', name: '보노 수달', rarity: 'uncommon', rarityLabel: '고급', tip: '횡단보도를 건널 때 손잡이와 난간을 잡아요!' },
    { id: 'stk-8', emoji: '🦊', name: '아기 여우', rarity: 'rare', rarityLabel: '희귀', tip: '골목길 모퉁이에서는 귀를 쫑긋 세워요!' },
    { id: 'stk-9', emoji: '🐻', name: '몽실 곰돌이', rarity: 'rare', rarityLabel: '희귀', tip: '횡단보도를 건널 땐 손을 높이 들어요!' },
    { id: 'stk-10', emoji: '🐨', name: '포근 코알라', rarity: 'rare', rarityLabel: '희귀', tip: '안전 지도 선생님 말씀을 잘 듣고 걸어요!' },
    { id: 'stk-11', emoji: '🐧', name: '아기 펭귄', rarity: 'legendary', rarityLabel: '전설', tip: '비 오는 날엔 시야 확보를 위해 밝은 우산을 써요!' },
    { id: 'stk-12', emoji: '🦄', name: '무지개 유니콘', rarity: 'legendary', rarityLabel: '전설', tip: '언제나 안전 보행을 지키는 반짝이는 최고 어린이!' }
  ];

  const MILESTONES = [100, 200, 300, 400, 500];

  let state = {
    points: 250, // Initial points
    openedMilestones: [100], // Already opened milestone boxes
    badgeCount: 3,
    questCompletedToday: false,
    streakDays: 5,
    unlockedStickers: ['stk-1', 'stk-2', 'stk-5'] // Initial unlocked stickers
  };

  let audioContext = null;

  function init() {
    bindEvents();
    updateQuestUI();
  }

  function bindEvents() {
    const questBtn = document.getElementById('quest-action-btn');
    const openCollectionBtn = document.getElementById('open-collection-btn');
    const boxModalClose = document.getElementById('reward-modal-close');
    const collectionModalClose = document.getElementById('collection-modal-close');

    if (questBtn) {
      questBtn.addEventListener('click', completeQuest);
    }
    if (openCollectionBtn) {
      openCollectionBtn.addEventListener('click', openCollectionModal);
    }
    if (boxModalClose) {
      boxModalClose.addEventListener('click', closeRewardModal);
    }
    if (collectionModalClose) {
      collectionModalClose.addEventListener('click', closeCollectionModal);
    }
  }

  /**
   * Updates Quest Card & Gauge Bar UI
   */
  function updateQuestUI() {
    const badgeCountEl = document.getElementById('badge-count-text');
    const questBtn = document.getElementById('quest-action-btn');
    const questDesc = document.getElementById('quest-desc-text');
    const collectionBadgeCount = document.getElementById('collection-badge-count');

    if (badgeCountEl) badgeCountEl.textContent = `💰 ${state.points}pt`;
    if (collectionBadgeCount) collectionBadgeCount.textContent = `${state.unlockedStickers.length}/${ANIMAL_STICKERS.length}`;

    // Update Milestone Progress Gauge Bar Width
    // Milestone nodes (100pt~500pt) mapped at: 100pt(0%), 200pt(25%), 300pt(50%), 400pt(75%), 500pt(100%)
    const minPt = MILESTONES[0]; // 100
    const maxPt = MILESTONES[MILESTONES.length - 1]; // 500
    let fillPercent = 0;
    if (state.points <= minPt) {
      fillPercent = 0;
    } else {
      fillPercent = Math.min(100, ((state.points - minPt) / (maxPt - minPt)) * 100);
    }
    const gaugeFill = document.getElementById('milestone-gauge-fill');
    if (gaugeFill) gaugeFill.style.width = `${fillPercent}%`;

    // Render Milestone Nodes (100pt, 200pt, 300pt, 400pt, 500pt)
    renderMilestoneNodes();

    if (state.questCompletedToday) {
      if (questBtn) {
        questBtn.textContent = '✅ 오늘 등교 퀘스트 완료!';
        questBtn.style.background = '#E2E8F0';
        questBtn.style.color = '#64748B';
        questBtn.disabled = true;
      }
      if (questDesc) questDesc.textContent = `연속 ${state.streakDays}일째 안심 등교 성공! 상자를 터치해 보세요!`;
    } else {
      if (questBtn) {
        questBtn.textContent = '🎒 등교 완료! (+100pt 획득)';
        questBtn.style.background = '#FFFFFF';
        questBtn.style.color = '#D97706';
        questBtn.disabled = false;
      }
      if (questDesc) questDesc.textContent = '등교 퀘스트를 성공하고 포인트 상자를 오픈하세요!';
    }
  }

  /**
   * Renders Point Milestone Gauge Nodes (100pt 🎁, 200pt 🎁 ...)
   */
  function renderMilestoneNodes() {
    const nodesContainer = document.getElementById('milestone-nodes-container');
    if (!nodesContainer) return;

    nodesContainer.innerHTML = '';

    MILESTONES.forEach(targetPt => {
      const isReached = state.points >= targetPt;
      const isOpened = state.openedMilestones.includes(targetPt);
      
      const nodeEl = document.createElement('div');
      
      let nodeStatusClass = '';
      let boxIconHtml = '🔒';

      if (isOpened) {
        nodeStatusClass = 'opened';
        boxIconHtml = '✅';
      } else if (isReached) {
        nodeStatusClass = 'unlocked';
        boxIconHtml = '🎁';
      } else {
        nodeStatusClass = 'locked';
        boxIconHtml = '🔒';
      }

      nodeEl.className = `milestone-node ${nodeStatusClass}`;
      nodeEl.innerHTML = `
        <div class="node-box-icon">${boxIconHtml}</div>
        <div class="node-point-text">${targetPt}pt</div>
      `;

      // Click event to open ready treasure box!
      nodeEl.addEventListener('click', () => {
        if (isOpened) {
          alert(`이미 ${targetPt}pt 상자를 오픈했습니다! 📦`);
        } else if (isReached) {
          openTreasureBoxForMilestone(targetPt);
        } else {
          alert(`아직 ${targetPt}pt에 도달하지 못했습니다. (현재 ${state.points}pt) 🔒`);
        }
      });

      nodesContainer.appendChild(nodeEl);
    });
  }

  /**
   * Daily Quest Completion (+100pt)
   */
  function completeQuest() {
    if (state.questCompletedToday) return;

    state.questCompletedToday = true;
    state.badgeCount += 1;
    state.points += 100;
    state.streakDays += 1;

    updateQuestUI();
    playFanfareSound();
    alert(`🎉 [오늘의 등교 퀘스트 성공!]\n\n💰 +100 안전 포인트가 적립되었습니다! (현재 ${state.points}pt)\n🎁 게이지 바의 반짝이는 보물상자를 터치하여 열어보세요!`);
  }

  /**
   * Opens Treasure Box at milestone point
   * - New sticker: 🎉 fanfare + new sticker modal
   * - Duplicate sticker: 😢 sad sound + '아쉽게도 중복이네요!' modal
   */
  function openTreasureBoxForMilestone(milestonePt) {
    if (!state.openedMilestones.includes(milestonePt)) {
      state.openedMilestones.push(milestonePt);
    }

    const lockedStickers = ANIMAL_STICKERS.filter(s => !state.unlockedStickers.includes(s.id));
    let rewardSticker;
    let isDuplicate = false;

    if (lockedStickers.length > 0) {
      // 🎉 New sticker!
      const randIdx = Math.floor(Math.random() * lockedStickers.length);
      rewardSticker = lockedStickers[randIdx];
      state.unlockedStickers.push(rewardSticker.id);
      isDuplicate = false;
    } else {
      // 😢 All stickers collected — random duplicate
      const randIdx = Math.floor(Math.random() * ANIMAL_STICKERS.length);
      rewardSticker = ANIMAL_STICKERS[randIdx];
      isDuplicate = true;
    }

    updateQuestUI();
    showRewardModal(rewardSticker, milestonePt, isDuplicate);

    if (isDuplicate) {
      playSadSound();
    } else {
      playChimeSound();
    }
  }

  /**
   * Collection Modal Window Handling (팝업창)
   */
  function openCollectionModal() {
    renderCollectionModalGrid();
    const modal = document.getElementById('collection-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  function closeCollectionModal() {
    const modal = document.getElementById('collection-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Renders the 12 Cute Animal Sticker Grid inside the Collection Popup Modal
   */
  function renderCollectionModalGrid() {
    const grid = document.getElementById('collection-grid-modal');
    const badgeEl = document.getElementById('modal-progress-badge');

    if (!grid) return;

    grid.innerHTML = '';
    const unlockedCount = state.unlockedStickers.length;
    if (badgeEl) badgeEl.textContent = `${unlockedCount} / ${ANIMAL_STICKERS.length} 수집 완료`;

    ANIMAL_STICKERS.forEach(sticker => {
      const isUnlocked = state.unlockedStickers.includes(sticker.id);
      const card = document.createElement('div');
      card.className = `sticker-item-card ${isUnlocked ? 'unlocked' : ''}`;
      
      card.innerHTML = `
        <span class="sticker-rarity-chip rarity-${sticker.rarity}">${sticker.rarityLabel}</span>
        <div class="sticker-emoji-large">${isUnlocked ? sticker.emoji : '❓'}</div>
        <div class="sticker-name-tag">${isUnlocked ? sticker.name : '미수집'}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          playChimeSound();
          alert(`${sticker.emoji} [${sticker.name}] - ${sticker.rarityLabel} 스티커\n\n💬 안전 보행 한마디:\n"${sticker.tip}"`);
        });
      }

      grid.appendChild(card);
    });
  }

  /**
   * Reward Modal — handles both new sticker and duplicate
   * @param {Object} sticker
   * @param {number} milestonePt
   * @param {boolean} isDuplicate
   */
  function showRewardModal(sticker, milestonePt, isDuplicate = false) {
    const modal = document.getElementById('reward-modal');
    const emojiEl = document.getElementById('unlocked-emoji');
    const titleEl = document.getElementById('unlocked-title');
    const tipEl = document.getElementById('unlocked-tip');
    const closeBtn = document.getElementById('reward-modal-close');

    if (emojiEl) emojiEl.textContent = sticker.emoji;

    if (isDuplicate) {
      // 😢 Duplicate case
      if (emojiEl) emojiEl.style.filter = 'grayscale(60%)';
      if (titleEl) {
        titleEl.textContent = '아쉽게도 중복이네요! 😢';
        titleEl.style.color = '#94A3B8';
      }
      if (tipEl) {
        tipEl.textContent = `이미 갖고 있는 [${sticker.rarityLabel}] ${sticker.name} 스티커가 나왔어요.\n조금 더 등교하면 새 친구가 나타날 거예요! 💪`;
        tipEl.style.background = '#F1F5F9';
        tipEl.style.color = '#64748B';
      }
      if (closeBtn) {
        closeBtn.textContent = '그래도 괜찮아요!';
        closeBtn.style.background = '#94A3B8';
      }
    } else {
      // 🎉 New sticker!
      if (emojiEl) emojiEl.style.filter = 'none';
      if (titleEl) {
        titleEl.textContent = `🎉 [${sticker.rarityLabel}] ${sticker.name} 획득!`;
        titleEl.style.color = '#7E22CE';
      }
      if (tipEl) {
        tipEl.textContent = `💡 안전 팁: "${sticker.tip}"`;
        tipEl.style.background = '#F3E8FF';
        tipEl.style.color = '#475569';
      }
      if (closeBtn) {
        closeBtn.textContent = '🎉 도감에 저장하기';
        closeBtn.style.background = 'linear-gradient(135deg, #A855F7, #7E22CE)';
      }
    }

    if (modal) {
      modal.classList.add('active');
    }
  }

  function closeRewardModal() {
    const modal = document.getElementById('reward-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Sound Synthesis
   */
  function playChimeSound() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const now = audioContext.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.3, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  function playFanfareSound() {
    playChimeSound();
  }

  /**
   * Sad "wah-wah" sound for duplicate stickers
   */
  function playSadSound() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const now = audioContext.currentTime;
      // Descending sad "wah wah" trombone-like sound
      const notes = [
        { freq: 440, start: 0, dur: 0.25 },
        { freq: 370, start: 0.28, dur: 0.25 },
        { freq: 311, start: 0.56, dur: 0.4 }
      ];
      notes.forEach(note => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        osc.frequency.exponentialRampToValueAtTime(note.freq * 0.85, now + note.start + note.dur);
        gain.gain.setValueAtTime(0.25, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur + 0.05);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  return {
    init,
    openCollectionModal,
    getState: () => state
  };
})();
