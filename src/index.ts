import * as THREE from 'three';
import * as xb from 'xrblocks';
import { CHARACTERS } from './characters.ts';
import {
  ensureLeaderboardServices,
  submitScore,
  getTopLeaderboard,
  testFirestoreConnection,
} from './firebase.ts';
import { MaxFlizGameEngine } from './game.ts';
import { sound } from './sound.ts';
import { IntroCutsceneManager } from './introCutscene.ts';
import { PixelIntroManager } from './pixelIntro.ts';
import { CharacterId } from './types.ts';
import { AssetItem, assetLoader } from './assets.ts';

// warehouseAssets imports moved to assets.ts where they are preloaded

// Global Unhandled Error Logger
window.addEventListener('error', (e) => {
  console.warn('Global Error Captured:', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.warn('Unhandled Rejection Captured:', e.reason);
});

// assetLoader moved to assets.ts

class MaxFlizScene extends xb.Script {
  private engine!: MaxFlizGameEngine;
  private cutscene: IntroCutsceneManager | null = null;
  private pixelIntro: PixelIntroManager | null = null;
  private selectedCharId: CharacterId = 'marcin';
  private selectedLevelId: number = 1;
  private lastScore: number = 0;
  private lastCoins: number = 0;
  private lastTimeSeconds: number = 0;
  private lastBossDefeated: boolean = false;
  private camera: THREE.PerspectiveCamera;
  private fallbackScene: THREE.Scene;
  private lastLoopTick: number = performance.now();

  constructor() {
    super();
    this.fallbackScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.setupUIAndEngine();
  }

  private setupUIAndEngine() {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;

      if (this.camera) {
        if (aspect < 0.75) {
          this.camera.fov = 64;
        } else if (aspect < 1.0) {
          this.camera.fov = 58;
        } else if (aspect < 1.35) {
          this.camera.fov = 50;
        } else {
          this.camera.fov = 44;
        }
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
      }

      const renderer = (xb.core?.renderer as THREE.WebGLRenderer) || null;
      if (renderer) {
        if (typeof renderer.setSize === 'function') {
          renderer.setSize(width, height, false);
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
        if (typeof renderer.setPixelRatio === 'function') {
          renderer.setPixelRatio(dpr);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 150));
    // Do not call handleResize() immediately here because xb.core.renderer is not ready yet.
    // It will be handled in the init() method below.

    const hudHeroName = document.getElementById('hud-hero-name');
    const hudHeroRole = document.getElementById('hud-hero-role');
    const heroAvatar = document.getElementById('hero-avatar');
    const hudHpRow = document.getElementById('hud-hp-row');
    const hudScore = document.getElementById('hud-score');
    const hudVip = document.getElementById('hud-vip');
    const hudTimer = document.getElementById('hud-timer');
    const abilityName = document.getElementById('ability-name');
    const abilityCooldownOverlay = document.getElementById('ability-cooldown-overlay');
    const abilityIcon = document.getElementById('ability-icon');

    const titleScreen = document.getElementById('title-screen');
    const hudTop = document.getElementById('hud-top');
    const hudBottom = document.getElementById('hud-bottom');
    const touchControls = document.getElementById('touch-controls');
    const pauseModal = document.getElementById('pause-modal');
    const victoryModal = document.getElementById('victory-modal');
    const gameoverModal = document.getElementById('gameover-modal');

    const victoryScore = document.getElementById('victory-score');
    const victoryTime = document.getElementById('victory-time');
    const gameoverReason = document.getElementById('gameover-reason');

    const bossHudBar = document.getElementById('boss-hud-bar');
    const bossNameElem = document.getElementById('boss-name');
    const bossHpTextElem = document.getElementById('boss-hp-text');
    const bossHpFillElem = document.getElementById('boss-hp-fill');

    const perkBadgeShield = document.getElementById('perk-badge-shield');
    const perkBadgeJump = document.getElementById('perk-badge-jump');
    const perkJumpTimer = document.getElementById('perk-jump-timer');
    const perkBadgeMagnet = document.getElementById('perk-badge-magnet');
    const perkMagnetTimer = document.getElementById('perk-magnet-timer');
    const perkBadgeSpeed = document.getElementById('perk-badge-speed');
    const perkSpeedTimer = document.getElementById('perk-speed-timer');

    const container = document.getElementById('game-canvas-container');

    interface ActiveToast {
      element: HTMLElement;
      worldPos: THREE.Vector3;
      type: string;
      age: number;
      maxAge: number;
    }
    const activeToasts: ActiveToast[] = [];
    const activeDialogueThrottle = new Map<string, number>();

    const createDialogueCard = (text: string, speakerType: string, side: 'left' | 'right' = 'right') => {
      const containerId = side === 'left' ? 'dialogue-container-left' : 'dialogue-container-right';
      const containerElem = document.getElementById(containerId);
      if (!containerElem) return;

      const now = Date.now();
      const throttleKey = `${speakerType}_${side}`;
      const lastShout = activeDialogueThrottle.get(throttleKey) || 0;
      if (now - lastShout < 3500) return;
      activeDialogueThrottle.set(throttleKey, now);

      const leftContainer = document.getElementById('dialogue-container-left');
      const rightContainer = document.getElementById('dialogue-container-right');
      if (leftContainer) leftContainer.innerHTML = '';
      if (rightContainer) rightContainer.innerHTML = '';

      const card = document.createElement('div');
      const isHero = side === 'left';
      card.className = `dialogue-box-card ${isHero ? 'hero-style' : 'enemy-style'}`;

      const meta = isHero ? getHeroMeta() : getEnemyMeta(speakerType);

      card.innerHTML = `
        <div class="dialogue-box-avatar">${meta.avatar}</div>
        <div class="dialogue-box-content">
          <div class="dialogue-box-header">
            <span class="dialogue-box-name">${meta.name}</span>
          </div>
          <p class="dialogue-box-text">${text}</p>
        </div>
      `;

      containerElem.appendChild(card);

      setTimeout(() => {
        card.classList.add('fading-out');
        setTimeout(() => {
          if (card.parentElement === containerElem) card.remove();
        }, 400);
      }, 4500);
    };

    const getHeroMeta = () => {
      const def = CHARACTERS[this.selectedCharId];
      const avatarIcons: Record<string, string> = {
        marcin: '👷‍♂️', grzesiek: '🚜', dawid: '💪', mateusz: '🎮', piotr: '👨‍🔧',
      };
      return {
        name: def.name,
        role: 'BOHATER LOGISTYKI',
        avatar: avatarIcons[this.selectedCharId] || '👷‍♂️',
      };
    };

    const getEnemyMeta = (type: string) => {
      const metaMap: Record<string, { name: string; role: string; avatar: string }> = {
        kurier: { name: 'Rudy z DPD', role: 'Johnny Walker Express', avatar: '🚚' },
        walczak: { name: 'Walczak', role: 'Były Kierownik', avatar: '👔' },
        krol_leto: { name: 'Król-Leto', role: 'Dyrektor Generalny', avatar: '👑' },
        architect: { name: 'Architektka', role: 'Design & Beż', avatar: '🎨' },
        customer: { name: 'Klient', role: 'Awantura o Fugi', avatar: '📑' },
        handlowiec: { name: 'Handlowiec', role: 'Rabat 3%', avatar: '💼' },
        monter: { name: 'Monter', role: 'Glazurnik Pro', avatar: '🪚' },
        inspector: { name: 'Inspektor', role: 'BHP / PIP', avatar: '📋' },
        sztaplar_szalony: { name: 'Zdzichu', role: 'Mistrz Sztaplarki', avatar: '🚜' },
        piorun_dron: { name: 'PIORUN', role: 'Dron AI', avatar: '⚡' },
      };
      return metaMap[type] || { name: 'Pracownik', role: 'Magazyn', avatar: '👷' };
    };

    const spawnFloatingToast = (
      text: string,
      x: number,
      y: number,
      z: number,
      type: 'points' | 'vip' | 'easter-egg' | 'damage' | 'perk' | 'combo' | 'enemy_shout' = 'points',
      metadata?: any
    ) => {
      if (type === 'enemy_shout') {
        createDialogueCard(text, metadata?.enemyType || 'customer');
        return;
      }

      const popupsLayer = document.getElementById('floating-popups-layer');
      if (!popupsLayer) return;

      const toast = document.createElement('div');
      toast.className = `floating-score-toast ${type}`;
      toast.textContent = text;
      toast.style.position = 'absolute';
      toast.style.top = '0';
      toast.style.left = '0';
      toast.style.willChange = 'transform, opacity';
      popupsLayer.appendChild(toast);

      const duration = 1.6;

      activeToasts.push({
        element: toast,
        worldPos: new THREE.Vector3(x, y, z),
        type,
        age: 0,
        maxAge: duration,
      });
    };

    (this as any)._updateToasts = (dt: number) => {
      const tempVec = new THREE.Vector3();
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      for (let i = activeToasts.length - 1; i >= 0; i--) {
        const t = activeToasts[i];
        t.age += dt;

        if (t.age >= t.maxAge) {
          t.element.remove();
          activeToasts.splice(i, 1);
          continue;
        }

        const floatSpeed = t.type === 'enemy_shout' ? 0.22 : 0.8;
        t.worldPos.y += dt * floatSpeed;

        tempVec.copy(t.worldPos);
        tempVec.project(this.camera);

        if (
          tempVec.z > 1.0 ||
          tempVec.x < -1.3 ||
          tempVec.x > 1.3 ||
          tempVec.y < -1.3 ||
          tempVec.y > 1.3
        ) {
          t.element.style.display = 'none';
          continue;
        }

        t.element.style.display = 'flex';
        const sx = (tempVec.x * 0.5 + 0.5) * screenW;
        const sy = (-(tempVec.y * 0.5) + 0.5) * screenH;

        t.element.style.transform = `translate3d(${Math.round(sx)}px, ${Math.round(sy)}px, 0px) translate(-50%, -50%)`;

        const progress = t.age / t.maxAge;
        let opacity = 1;
        if (progress < 0.08) {
          opacity = progress / 0.08;
        } else if (progress > 0.82) {
          opacity = (1 - progress) / 0.18;
        }
        t.element.style.opacity = opacity.toFixed(2);
      }
    };

    const showPerkDropBanner = (name: string, icon: string, desc: string, color: string) => {
      const banner = document.getElementById('perk-drop-banner');
      if (!banner) return;
      banner.style.borderColor = color;
      banner.style.boxShadow = `0 10px 30px -5px ${color}66`;
      banner.innerHTML = `
        <div class="perk-banner-icon">${icon}</div>
        <div class="perk-banner-text">
          <div class="perk-banner-title" style="color: ${color}">⚡ ZDOBYTO PERK: ${name.toUpperCase()}!</div>
          <div class="perk-banner-desc">${desc}</div>
        </div>
      `;
      banner.classList.remove('hidden');
      clearTimeout((banner as any)._timeout);
      (banner as any)._timeout = setTimeout(() => {
        banner.classList.add('hidden');
      }, 1800);
    };

    this.engine = new MaxFlizGameEngine(
      this as unknown as THREE.Scene,
      this.camera,
      (container || document.body) as HTMLElement,
      {
        onFloatingText: (text, x, y, z, type, metadata) => {
          spawnFloatingToast(text, x, y, z, type, metadata);
        },
        onPerkDropBanner: (name, icon, desc, color) => {
          showPerkDropBanner(name, icon, desc, color);
        },
        onScoreUpdate: (score, collectedVip, totalVip) => {
          if (hudScore) hudScore.textContent = score.toString();
          if (hudVip) hudVip.textContent = `${collectedVip} / ${totalVip}`;
        },
        onHpUpdate: (hp, maxHp) => {
          if (!hudHpRow) return;
          hudHpRow.innerHTML = '';
          for (let i = 0; i < maxHp; i++) {
            const span = document.createElement('span');
            span.className = `hp-mug ${i < hp ? '' : 'lost'}`;
            span.textContent = '☕';
            hudHpRow.appendChild(span);
          }
        },
        onAbilityCooldown: (progress, ready) => {
          if (abilityCooldownOverlay) {
            abilityCooldownOverlay.style.width = `${(1 - progress) * 100}%`;
          }
          const btn = document.getElementById('btn-ability');
          if (btn) {
            btn.style.opacity = ready ? '1' : '0.6';
          }
        },
        onSpeechBubble: (text) => {
          if (text) {
            createDialogueCard(text, 'hero', 'left');
          }
        },
        onPerksUpdate: (perks) => {
          if (perkBadgeShield) {
            perkBadgeShield.classList.toggle('hidden', !perks.shield);
          }
          if (perkBadgeJump && perkJumpTimer) {
            if (perks.doubleJump > 0) {
              perkBadgeJump.classList.remove('hidden');
              perkJumpTimer.textContent = `${Math.ceil(perks.doubleJump)}s`;
            } else {
              perkBadgeJump.classList.add('hidden');
            }
          }
          if (perkBadgeMagnet && perkMagnetTimer) {
            if (perks.magnet > 0) {
              perkBadgeMagnet.classList.remove('hidden');
              perkMagnetTimer.textContent = `${Math.ceil(perks.magnet)}s`;
            } else {
              perkBadgeMagnet.classList.add('hidden');
            }
          }
          if (perkBadgeSpeed && perkSpeedTimer) {
            if (perks.speedBoost > 0) {
              perkBadgeSpeed.classList.remove('hidden');
              perkSpeedTimer.textContent = `${Math.ceil(perks.speedBoost)}s`;
            } else {
              perkBadgeSpeed.classList.add('hidden');
            }
          }
        },
        onLevelComplete: (levelId, score, timeStr) => {
          this.lastScore = score;
          this.lastCoins = this.engine.getCollectedVipCount();
          this.lastTimeSeconds = this.engine.getElapsedSeconds();
          this.lastBossDefeated = this.engine.isBossDefeated();

          const victoryTitle = document.getElementById('victory-title');
          if (victoryTitle) {
            victoryTitle.textContent = levelId < 3 ? `SEKTOR ${levelId} ZALICZONY!` : 'MAGAZYN OPANOWANY!';
          }

          const btnNext = document.getElementById('btn-next-level');
          if (btnNext) {
            if (levelId < 3) {
              btnNext.classList.remove('hidden');
              btnNext.textContent = `WEJDŹ DO SEKTORA ${levelId + 1} ➡️`;
            } else {
              btnNext.classList.add('hidden');
            }
          }

          if (victoryScore) victoryScore.textContent = score.toString();
          if (victoryTime) victoryTime.textContent = timeStr;
          victoryModal?.classList.remove('hidden');
          hudTop?.classList.add('hidden');
          hudBottom?.classList.add('hidden');
          touchControls?.classList.add('hidden');
          bossHudBar?.classList.add('hidden');

          const nickInput = document.getElementById('player-nickname-input') as HTMLInputElement | null;
          const submitBtn = document.getElementById('btn-submit-score') as HTMLButtonElement | null;
          const feedbackMsg = document.getElementById('submit-feedback-msg');
          if (nickInput) {
            const savedNick = localStorage.getItem('maxfliz_player_nick');
            nickInput.value = savedNick || `Kierownik ${CHARACTERS[this.selectedCharId].name}`;
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 ZAPISZ W RANKINGU';
          }
          if (feedbackMsg) {
            feedbackMsg.className = 'submit-feedback hidden';
            feedbackMsg.textContent = '';
          }

          if (levelId < 3) {
            setTimeout(() => {
              if (victoryModal && !victoryModal.classList.contains('hidden')) {
                this.selectedLevelId = levelId + 1;
                this.engine.startGame(this.selectedLevelId);
                victoryModal.classList.add('hidden');
                hudTop?.classList.remove('hidden');
                hudBottom?.classList.remove('hidden');
                touchControls?.classList.remove('hidden');
              }
            }, 6500);
          }
        },
        onGameOver: (reason) => {
          if (gameoverReason) gameoverReason.textContent = reason;
          gameoverModal?.classList.remove('hidden');
          hudTop?.classList.add('hidden');
          hudBottom?.classList.add('hidden');
          touchControls?.classList.add('hidden');
          bossHudBar?.classList.add('hidden');
        },
        onBossUpdate: (name, hp, maxHp, visible, phase) => {
          if (!bossHudBar || !bossNameElem || !bossHpTextElem || !bossHpFillElem) return;
          if (visible && hp > 0) {
            bossHudBar.classList.remove('hidden');
            bossHudBar.classList.toggle('phase-2', phase === 2);
            bossNameElem.textContent = phase === 2 ? `👔 ${name} (SZAŁ!)` : `👔 ${name}`;
            bossHpTextElem.textContent = `${hp} / ${maxHp}`;
            bossHpFillElem.style.width = `${(hp / maxHp) * 100}%`;
          } else {
            bossHudBar.classList.add('hidden');
            bossHudBar.classList.remove('phase-2');
          }
        },
      }
    );

    // Lazy instantiation of cutscenes only when needed
    this.cutscene = null;
    this.pixelIntro = null;

    const updateCharacterUI = (id: CharacterId) => {
      this.selectedCharId = id;
      const def = CHARACTERS[id];
      if (hudHeroName) hudHeroName.textContent = def.name;
      if (hudHeroRole) hudHeroRole.textContent = def.role;
      if (abilityName) abilityName.textContent = def.abilityName;

      const avatarIcons: Record<CharacterId, string> = {
        marcin: '👷‍♂️', grzesiek: '🚜', dawid: '💪', mateusz: '🎮', piotr: '👨‍🔧',
      };
      const abilityIcons: Record<CharacterId, string> = {
        marcin: '📜', grzesiek: '⚡', dawid: '🧱', mateusz: '☕', piotr: '🍾',
      };
      if (heroAvatar) heroAvatar.textContent = avatarIcons[id];
      if (abilityIcon) abilityIcon.textContent = abilityIcons[id] || '⚡';

      const attackNameElem = document.getElementById('attack-name');
      const attackIconElem = document.getElementById('attack-icon');
      const attackNames: Record<CharacterId, string> = {
        marcin: 'Cios Segregatorem',
        grzesiek: 'Łata Brukarska',
        dawid: 'Przecinak do Gresu',
        mateusz: 'Chluśnięcie Espresso',
        piotr: 'Rzut Kluczem Francuskim',
      };
      const attackIcons: Record<CharacterId, string> = {
        marcin: '🥊', grzesiek: '🔨', dawid: '🔪', mateusz: '☕', piotr: '🔧',
      };
      if (attackNameElem) attackNameElem.textContent = attackNames[id] || 'Atak';
      if (attackIconElem) attackIconElem.textContent = attackIcons[id] || '🥊';

      const detailTitle = document.getElementById('char-detail-title');
      const detailBio = document.getElementById('char-detail-bio');
      const detailSkill = document.getElementById('char-detail-skill');
      const detailPassive = document.getElementById('char-detail-passive');
      if (detailTitle && detailBio && detailSkill) {
        detailTitle.textContent = `${def.name} – ${def.title}`;
        detailBio.textContent = def.bio;
        detailSkill.innerHTML = `<strong>⚡ Super Umiejętność:</strong> ${def.abilityName} – ${def.abilityDescription}`;
        if (detailPassive) {
          detailPassive.innerHTML = `<strong>🛡️ Zdolność Pasywna:</strong> ${def.passiveName} – ${def.passiveDescription}`;
        }
      }

      const statBarSpeed = document.getElementById('stat-bar-speed');
      const statValSpeed = document.getElementById('stat-val-speed');
      const statBarJump = document.getElementById('stat-bar-jump');
      const statValJump = document.getElementById('stat-val-jump');
      const statBarPower = document.getElementById('stat-bar-power');
      const statValPower = document.getElementById('stat-val-power');
      const statBarDefense = document.getElementById('stat-bar-defense');
      const statValDefense = document.getElementById('stat-val-defense');

      if (statBarSpeed && statValSpeed) {
        statBarSpeed.style.width = `${(def.stats.speed / 5) * 100}%`;
        statValSpeed.textContent = `${def.stats.speed} / 5`;
      }
      if (statBarJump && statValJump) {
        statBarJump.style.width = `${(def.stats.jump / 5) * 100}%`;
        statValJump.textContent = `${def.stats.jump} / 5`;
      }
      if (statBarPower && statValPower) {
        statBarPower.style.width = `${(def.stats.power / 5) * 100}%`;
        statValPower.textContent = `${def.stats.power} / 5`;
      }
      if (statBarDefense && statValDefense) {
        statBarDefense.style.width = `${(def.stats.defense / 5) * 100}%`;
        statValDefense.textContent = `${def.stats.defense} / 5`;
      }

      this.engine.selectCharacter(id);
    };

    updateCharacterUI('marcin');

    const leaderboardLoading = document.getElementById('leaderboard-loading');
    const leaderboardList = document.getElementById('leaderboard-list');
    const btnRefreshLeaderboard = document.getElementById('btn-refresh-leaderboard') as HTMLButtonElement | null;
    const firestoreStatusBadge = document.getElementById('firestore-status-badge');
    const firestoreStatusText = document.getElementById('firestore-status-text');

    const updateFirestoreStatusUI = (status: 'checking' | 'online' | 'offline', customMsg?: string) => {
      if (!firestoreStatusBadge || !firestoreStatusText) return;
      firestoreStatusBadge.className = `firestore-status-badge ${status}`;
      if (status === 'checking') {
        firestoreStatusText.textContent = customMsg || 'Sprawdzanie bazy...';
      } else if (status === 'online') {
        firestoreStatusText.textContent = customMsg || 'Baza Firestore: Online';
      } else {
        firestoreStatusText.textContent = customMsg || 'Baza Firestore: Offline';
      }
    };

    const renderLeaderboard = async () => {
      if (!leaderboardLoading || !leaderboardList) return;

      if (btnRefreshLeaderboard) {
        btnRefreshLeaderboard.disabled = true;
        btnRefreshLeaderboard.textContent = '⏳ Odświeżanie...';
      }

      updateFirestoreStatusUI('checking', 'Testowanie połączenia...');
      leaderboardLoading.classList.remove('hidden');
      leaderboardLoading.textContent = 'Łączenie z bazą Firebase Firestore...';
      leaderboardList.classList.add('hidden');
      leaderboardList.innerHTML = '';

      try {
        // Direct connectivity check against singleton db instance
        const isConnected = await testFirestoreConnection();
        if (isConnected) {
          updateFirestoreStatusUI('online', 'Baza Firestore: Online');
        } else {
          updateFirestoreStatusUI('offline', 'Baza Firestore: Tryb Offline');
        }

        const topScores = await getTopLeaderboard(15);
        leaderboardLoading.classList.add('hidden');
        leaderboardList.classList.remove('hidden');

        if (topScores.length === 0) {
          leaderboardList.innerHTML = `
            <div class="leaderboard-status-msg">
              Brak jeszcze wyników na tej zmianie! Bądź pierwszym magazynierem, który załaduje zamówienie VIP i zapisze wynik.
            </div>
          `;
        } else {
          topScores.forEach((entry, idx) => {
            const rankIcons = ['🥇', '🥈', '🥉'];
            const rankDisplay = idx < 3 ? rankIcons[idx] : `${idx + 1}.`;
            const heroIcons: Record<string, string> = {
              Marcin: '👷‍♂️', Grzesiek: '🚜', Dawid: '💪', Mateusz: '☕', Piotr: '👨‍🔧',
            };
            const heroIcon = heroIcons[entry.hero] || '👷‍♂️';
            const bossBadge = entry.bossDefeated ? '<span title="Były Kierownik Walczak skasowany!">👔💥</span>' : '';
            const mins = Math.floor(entry.timeSeconds / 60);
            const secs = entry.timeSeconds % 60;
            const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

            const row = document.createElement('div');
            row.className = `leaderboard-item ${idx === 0 ? 'top-1' : ''}`;
            row.innerHTML = `
              <div class="leaderboard-rank">${rankDisplay}</div>
              <div class="leaderboard-hero-tag">${heroIcon}</div>
              <div class="leaderboard-player-info">
                <div class="leaderboard-player-name">${entry.playerName} ${bossBadge}</div>
                <div class="leaderboard-player-meta">${entry.hero} • Czas: ${timeFormatted} • VIP: ${entry.coins}</div>
              </div>
              <div class="leaderboard-score-cluster">
                <div class="leaderboard-score-val">${entry.score} pkt</div>
              </div>
            `;
            leaderboardList.appendChild(row);
          });
        }

        if (btnRefreshLeaderboard) {
          btnRefreshLeaderboard.disabled = false;
          btnRefreshLeaderboard.textContent = '🔄 Odśwież';
        }
      } catch (err) {
        updateFirestoreStatusUI('offline', 'Baza Firestore: Błąd połączenia');
        leaderboardLoading.classList.remove('hidden');
        leaderboardLoading.textContent = '❌ Nie udało się pobrać rankingu. Sprawdź połączenie z bazą Firebase.';
        console.warn('Leaderboard error:', err);

        if (btnRefreshLeaderboard) {
          btnRefreshLeaderboard.disabled = false;
          btnRefreshLeaderboard.textContent = '🔄 Spróbuj ponownie';
        }
      }
    };

    btnRefreshLeaderboard?.addEventListener('click', () => {
      renderLeaderboard();
    });

    document.querySelectorAll('.menu-tab-btn').forEach((tabBtn) => {
      const activateTab = (e?: Event) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        document.querySelectorAll('.menu-tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        tabBtn.classList.add('active');
        const targetId = tabBtn.getAttribute('data-tab');
        if (targetId) {
          document.getElementById(targetId)?.classList.add('active');
          if (targetId === 'tab-leaderboard') {
            renderLeaderboard();
            ensureLeaderboardServices().catch(console.warn);
          }
        }
      };
      tabBtn.addEventListener('click', activateTab);
      tabBtn.addEventListener('touchend', activateTab);
    });

    document.querySelectorAll('.char-card').forEach((card) => {
      const selectChar = (e?: Event) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        document.querySelectorAll('.char-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        const charId = card.getAttribute('data-char') as CharacterId;
        if (charId) {
          updateCharacterUI(charId);
        }
      };
      card.addEventListener('click', selectChar);
      card.addEventListener('touchend', selectChar);
    });

    document.querySelectorAll('.btn-perk-activate').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const btnEl = e.currentTarget as HTMLElement;
        const originalText = btnEl.textContent || 'DROP W GRZE 📍';
        btnEl.textContent = 'DROPI NA MAPIE! 📦';
        btnEl.classList.add('activated');
        setTimeout(() => {
          btnEl.textContent = originalText;
          btnEl.classList.remove('activated');
        }, 2200);
      });
    });

    document.querySelectorAll('.zone-card').forEach((card) => {
      const selectZone = (e?: Event) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        document.querySelectorAll('.zone-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedLevelId = parseInt(card.getAttribute('data-level') || '1', 10);
      };
      card.addEventListener('click', selectZone);
      card.addEventListener('touchend', selectZone);
    });

    let startingGame = false;
    const doStartGame = async (e?: Event) => {
      if (startingGame) return;
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      await assetLoader.waitUntilReady('Gra 3D');

      startingGame = true;
      if (this.pixelIntro && this.pixelIntro.isRunning()) {
        this.pixelIntro.stop();
      }
      if (this.cutscene && this.cutscene.isRunning()) {
        this.cutscene.stop();
      }
      this.engine.setLevelVisible(true);

      const storyModal = document.getElementById('story-intro-modal');
      storyModal?.classList.add('hidden');
      if (titleScreen) {
        titleScreen.classList.add('hidden');
        titleScreen.style.setProperty('display', 'none', 'important');
      }
      pauseModal?.classList.add('hidden');
      victoryModal?.classList.add('hidden');
      gameoverModal?.classList.add('hidden');

      hudTop?.classList.remove('hidden');
      hudBottom?.classList.remove('hidden');
      touchControls?.classList.remove('hidden');

      this.engine.startGame(this.selectedLevelId);
      setTimeout(() => { startingGame = false; }, 600);
    };

    const startBtn = document.getElementById('btn-start-game');
    startBtn?.addEventListener('click', doStartGame);
    startBtn?.addEventListener('touchend', doStartGame);

    window.addEventListener('keydown', (e) => {
      const storyModal = document.getElementById('story-intro-modal');
      const modalVisible = storyModal && !storyModal.classList.contains('hidden');
      if (titleScreen && !titleScreen.classList.contains('hidden')) {
        if ((e.code === 'Enter' || e.code === 'Space') && !modalVisible) {
          doStartGame();
          e.preventDefault();
        }
      }
    });

    const launch3dCutscene = async (e?: Event) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      await assetLoader.waitUntilReady('Scenka 3D');
      
      if (!this.cutscene) {
        this.cutscene = new IntroCutsceneManager(
          xb.core?.scene || this.fallbackScene,
          this.camera,
          (xb.core?.renderer as THREE.WebGLRenderer) || null,
          {
            onComplete: () => {
              this.engine.setLevelVisible(true);
              if (titleScreen) {
                titleScreen.classList.remove('hidden');
                titleScreen.style.setProperty('display', 'flex', 'important');
              }
              this.engine.startTitle();
            },
            onStartGame: () => {
              this.engine.setLevelVisible(true);
              doStartGame();
            },
          }
        );
      }

      if (titleScreen) {
        titleScreen.classList.add('hidden');
        titleScreen.style.setProperty('display', 'none', 'important');
      }
      document.getElementById('story-intro-modal')?.classList.add('hidden');
      this.engine.setLevelVisible(false);
      this.cutscene.start();
    };

    const launchPixelIntro = async (e?: Event) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      await assetLoader.waitUntilReady('Pixel Intro');
      
      if (!this.pixelIntro) {
        this.pixelIntro = new PixelIntroManager({
          onComplete: () => {
            this.engine.setLevelVisible(true);
            if (titleScreen) {
              titleScreen.classList.remove('hidden');
              titleScreen.style.display = 'flex';
            }
            this.engine.startTitle();
          },
          onStartGame: () => {
            this.engine.setLevelVisible(true);
            doStartGame();
          },
        });
      }

      if (titleScreen) {
        titleScreen.classList.add('hidden');
        titleScreen.style.setProperty('display', 'none', 'important');
      }
      document.getElementById('story-intro-modal')?.classList.add('hidden');
      this.engine.setLevelVisible(false);
      this.pixelIntro.start();
    };

    document.getElementById('btn-open-story-modal')?.addEventListener('click', launch3dCutscene);
    document.getElementById('btn-open-3d-cutscene')?.addEventListener('click', launch3dCutscene);
    document.getElementById('btn-open-3d-cutscene')?.addEventListener('touchend', launch3dCutscene);

    document.getElementById('btn-top-intro-3d')?.addEventListener('click', launch3dCutscene);
    document.getElementById('btn-top-intro-3d')?.addEventListener('touchend', launch3dCutscene);

    document.getElementById('btn-open-pixel-intro')?.addEventListener('click', launchPixelIntro);
    document.getElementById('btn-open-pixel-intro')?.addEventListener('touchend', launchPixelIntro);

    document.getElementById('btn-attack')?.addEventListener('click', () => {
      this.engine.triggerAttack();
    });

    document.getElementById('btn-ability')?.addEventListener('click', () => {
      this.engine.triggerAbility();
    });

    document.getElementById('btn-top-camera')?.addEventListener('click', () => {
      this.engine.toggleCameraMode();
    });
    document.getElementById('btn-top-zoom-in')?.addEventListener('click', () => {
      this.engine.zoomInCamera();
    });
    document.getElementById('btn-top-zoom-out')?.addEventListener('click', () => {
      this.engine.zoomOutCamera();
    });

    document.getElementById('btn-minimap-zoom-in')?.addEventListener('click', () => {
      this.engine.zoomInMinimap();
    });
    document.getElementById('btn-minimap-zoom-out')?.addEventListener('click', () => {
      this.engine.zoomOutMinimap();
    });
    document.getElementById('btn-minimap-toggle')?.addEventListener('click', () => {
      this.engine.toggleMinimap();
    });

    const topSoundIcon = document.getElementById('top-sound-icon');
    const soundIcon = document.getElementById('sound-icon');
    const handleSoundToggle = () => {
      const isMuted = sound.toggleMute();
      const icon = isMuted ? '🔇' : '🔊';
      if (topSoundIcon) topSoundIcon.textContent = icon;
      if (soundIcon) soundIcon.textContent = icon;
    };
    document.getElementById('btn-top-sound')?.addEventListener('click', handleSoundToggle);
    document.getElementById('btn-sound')?.addEventListener('click', handleSoundToggle);

    const handlePause = () => {
      this.engine.togglePause();
      pauseModal?.classList.remove('hidden');
    };
    document.getElementById('btn-top-pause')?.addEventListener('click', handlePause);
    document.getElementById('btn-pause')?.addEventListener('click', handlePause);

    const storyModal = document.getElementById('story-intro-modal');
    const btnCloseStory = document.getElementById('btn-close-story');
    const btnStoryPrev = document.getElementById('btn-story-prev') as HTMLButtonElement | null;
    const btnStoryNext = document.getElementById('btn-story-next') as HTMLButtonElement | null;
    const btnStoryPlay = document.getElementById('btn-story-play');
    const storySlides = document.querySelectorAll('.story-slide');
    const storyDots = document.querySelectorAll('.story-progress-dots .dot');
    let currentSlide = 0;

    const updateStorySlides = (index: number) => {
      currentSlide = Math.max(0, Math.min(index, storySlides.length - 1));
      storySlides.forEach((slide, i) => {
        if (i === currentSlide) {
          slide.classList.remove('hidden');
          slide.classList.add('active');
        } else {
          slide.classList.add('hidden');
          slide.classList.remove('active');
        }
      });
      storyDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });

      if (btnStoryPrev) btnStoryPrev.disabled = currentSlide === 0;
      if (btnStoryNext && btnStoryPlay) {
        if (currentSlide === storySlides.length - 1) {
          btnStoryNext.classList.add('hidden');
          btnStoryPlay.classList.remove('hidden');
        } else {
          btnStoryNext.classList.remove('hidden');
          btnStoryPlay.classList.add('hidden');
        }
      }
    };

    btnCloseStory?.addEventListener('click', () => {
      storyModal?.classList.add('hidden');
    });

    btnStoryPrev?.addEventListener('click', () => {
      updateStorySlides(currentSlide - 1);
    });

    btnStoryNext?.addEventListener('click', () => {
      updateStorySlides(currentSlide + 1);
    });

    btnStoryPlay?.addEventListener('click', () => {
      storyModal?.classList.add('hidden');
      doStartGame();
    });

    storyDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const slideIdx = parseInt(dot.getAttribute('data-slide') || '0', 10);
        updateStorySlides(slideIdx);
      });
    });

    const handleCameraToggle = () => {
      const mode = this.engine.toggleCameraMode();
      if (mode === 'close') {
        spawnFloatingToast('📐 KAMERA 3D: AKCJA ZA PLECAMI', this.engine.getPlayerPos().x, this.engine.getPlayerPos().y + 1.2, this.engine.getPlayerPos().z, 'combo');
      } else {
        spawnFloatingToast('📐 KAMERA 3D: SZEROKI PRZEGLĄD', this.engine.getPlayerPos().x, this.engine.getPlayerPos().y + 1.2, this.engine.getPlayerPos().z, 'vip');
      }
    };
    document.getElementById('btn-camera')?.addEventListener('click', handleCameraToggle);
    document.getElementById('btn-top-camera')?.addEventListener('click', handleCameraToggle);

    document.getElementById('btn-resume')?.addEventListener('click', () => {
      pauseModal?.classList.add('hidden');
      this.engine.togglePause();
    });

    document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
      pauseModal?.classList.add('hidden');
      this.engine.startGame(this.selectedLevelId);
    });

    document.getElementById('btn-menu-pause')?.addEventListener('click', () => {
      pauseModal?.classList.add('hidden');
      hudTop?.classList.add('hidden');
      hudBottom?.classList.add('hidden');
      touchControls?.classList.add('hidden');
      if (titleScreen) {
        titleScreen.classList.remove('hidden');
        titleScreen.style.setProperty('display', 'flex', 'important');
      }
      this.engine.startTitle();
    });

    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      victoryModal?.classList.add('hidden');
      hudTop?.classList.remove('hidden');
      hudBottom?.classList.remove('hidden');
      touchControls?.classList.remove('hidden');
      this.selectedLevelId = (this.selectedLevelId % 3) + 1;
      this.engine.startGame(this.selectedLevelId);
    });

    document.getElementById('btn-replay-level')?.addEventListener('click', () => {
      victoryModal?.classList.add('hidden');
      hudTop?.classList.remove('hidden');
      hudBottom?.classList.remove('hidden');
      touchControls?.classList.remove('hidden');
      this.engine.startGame(this.selectedLevelId);
    });

    document.getElementById('btn-menu-victory')?.addEventListener('click', () => {
      victoryModal?.classList.add('hidden');
      if (titleScreen) {
        titleScreen.classList.remove('hidden');
        titleScreen.style.setProperty('display', 'flex', 'important');
      }
      this.engine.startTitle();
    });

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      gameoverModal?.classList.add('hidden');
      hudTop?.classList.remove('hidden');
      hudBottom?.classList.remove('hidden');
      touchControls?.classList.remove('hidden');
      this.engine.startGame(this.selectedLevelId);
    });

    document.getElementById('btn-menu-gameover')?.addEventListener('click', () => {
      gameoverModal?.classList.add('hidden');
      if (titleScreen) {
        titleScreen.classList.remove('hidden');
        titleScreen.style.setProperty('display', 'flex', 'important');
      }
      this.engine.startTitle();
    });

    const submitBtn = document.getElementById('btn-submit-score') as HTMLButtonElement | null;
    const nickInput = document.getElementById('player-nickname-input') as HTMLInputElement | null;
    const feedbackMsg = document.getElementById('submit-feedback-msg');

    submitBtn?.addEventListener('click', async () => {
      const playerName = nickInput?.value.trim() || `Kierownik ${CHARACTERS[this.selectedCharId].name}`;
      localStorage.setItem('maxfliz_player_nick', playerName);

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ ZAPISYWANIE...';
      if (feedbackMsg) {
        feedbackMsg.className = 'submit-feedback';
        feedbackMsg.textContent = 'Wysyłanie wyniku do Firebase Firestore...';
        feedbackMsg.classList.remove('hidden');
      }

      try {
        await submitScore({
          playerName,
          hero: CHARACTERS[this.selectedCharId].name,
          score: this.lastScore,
          coins: this.lastCoins,
          timeSeconds: this.lastTimeSeconds,
          bossDefeated: this.lastBossDefeated,
        });

        submitBtn.textContent = '✅ ZAPISANO!';
        if (feedbackMsg) {
          feedbackMsg.className = 'submit-feedback success';
          feedbackMsg.textContent = '🎉 Sukces! Wynik pomyślnie zapisany w rankingu Firebase!';
        }
        renderLeaderboard();
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'RETRY 💾';
        if (feedbackMsg) {
          feedbackMsg.className = 'submit-feedback error';
          feedbackMsg.textContent = 'Błąd zapisu w Firebase. Spróbuj ponownie!';
        }
      }
    });

    ensureLeaderboardServices().catch(console.warn);
    renderLeaderboard();

    this.setupTouchControls();

    if (titleScreen) {
      titleScreen.classList.remove('hidden');
      titleScreen.style.display = 'flex';
    }
    this.engine.startTitle();
  }

  private setupTouchControls() {
    const joystickZone = document.getElementById('touch-joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickKnob = document.getElementById('joystick-knob');
    if (!joystickZone || !joystickBase || !joystickKnob) return;

    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    const resetJoystick = () => {
      touchId = null;
      joystickBase.classList.remove('active');
      joystickKnob.style.transform = 'translate(0px, 0px)';
      this.engine.setVirtualInput(0, 0);
    };

    const onStart = (e: TouchEvent) => {
      if (touchId !== null) return;
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        startX = touch.clientX;
        startY = touch.clientY;

        joystickBase.style.left = `${startX}px`;
        joystickBase.style.top = `${startY}px`;
        joystickBase.classList.add('active');
        joystickKnob.style.transform = 'translate(0px, 0px)';
        if (e.cancelable) e.preventDefault();
      }
    };

    const onMove = (e: TouchEvent) => {
      if (touchId === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);
          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);

          const nx = Math.cos(angle) * clampedDist;
          const ny = Math.sin(angle) * clampedDist;

          joystickKnob.style.transform = `translate(${nx}px, ${ny}px)`;
          this.engine.setVirtualInput(nx / maxRadius, ny / maxRadius);
          if (e.cancelable) e.preventDefault();
          break;
        }
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (touchId === null) return;
      let stillActive = false;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchId) {
          stillActive = true;
          break;
        }
      }
      if (!stillActive) {
        resetJoystick();
      }
    };

    joystickZone.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', resetJoystick, { passive: true });
    window.addEventListener('blur', resetJoystick);

    const attackBtn = document.getElementById('btn-touch-attack');
    attackBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.engine.triggerAttack();
    }, { passive: false });

    const jumpBtn = document.getElementById('btn-touch-jump');
    jumpBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.engine.triggerJump();
    }, { passive: false });
    jumpBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.engine.triggerJump();
    });

    const abilityBtn = document.getElementById('btn-touch-ability');
    abilityBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.engine.triggerAbility();
    }, { passive: false });
    abilityBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.engine.triggerAbility();
    });
  }

  init() {
    // Initial resize now that xb.core is ready
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = (xb.core?.renderer as THREE.WebGLRenderer) || null;
    if (renderer && typeof renderer.setSize === 'function') {
      renderer.setSize(width, height, false);
    }

    const scene = xb.core?.scene || this.fallbackScene;
    const camera = (xb.core?.camera as THREE.PerspectiveCamera) || this.camera;

    // AGGRESSIVE BACKGROUND CLEANUP
    if (scene) {
      scene.background = new THREE.Color(0x020408);
      scene.fog = new THREE.Fog(0x020408, 1, 60);
    }

    if (this.engine) {
      this.engine.setScene(scene);
      this.engine.setCamera(camera);
      if (renderer) this.engine.threeRenderer = renderer;
    }

    if (this.cutscene) {
      this.cutscene.setScene(scene);
      this.cutscene.setCamera(camera);
      if (renderer) this.cutscene.setRenderer(renderer);
    }

    this.camera = camera;
    this.engine.startTitle();
  }


  update() {
    this.lastLoopTick = performance.now();
    const rawDt = xb.getDeltaTime();
    const dt = Math.min(Math.max(rawDt || 0.016, 0.001), 0.08);

    // PERSISTENT BACKGROUND ENFORCEMENT: Fight simulator environment default (trees/living room)
    // We enforce this until an actual level starts or a cutscene is playing
    if (xb.core.scene) {
       const info = (xb.core.renderer as any)?.info;
       const frame = info?.render?.frame || 0;
       const gameState = this.engine?.getGameState() || 'title';
       
         // Force black background for title screen and early boot
         if (gameState === 'title' || frame < 120) {
           xb.core.scene.background = new THREE.Color(0x020408);
           if (xb.core.scene.fog instanceof THREE.Fog) {
              xb.core.scene.fog.color.setHex(0x020408);
           }
         }
    }

    this.tick(dt);
  }

  private tick(dt: number) {
    try {
      if (this.pixelIntro && this.pixelIntro.isRunning()) {
        // Pixel intro updates internally via its own canvas RAF
      } else if (this.cutscene && this.cutscene.isRunning()) {
        this.cutscene.update(dt);
      } else if (this.engine) {
        this.engine.update(dt);
        const minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement | null;
        if (minimapCanvas) {
          this.engine.renderMinimap(minimapCanvas);
        }
      }
      (this as any)._updateToasts?.(dt);
    } catch (err) {
      console.warn('Loop Error:', err);
    }
  }

  onSelectEnd(event: xb.SelectEvent) {
    this.engine?.triggerAbility();
  }
}

// Visual Polish / Theme Injections (Integrated to ensure execution)
const injectThemeStyles = () => {
  if (document.getElementById('maxfliz-inline-theme')) return;
  
  // Set theme variables
  const root = document.documentElement;
  root.style.setProperty('--maxfliz-bg-1', '#050b14');
  root.style.setProperty('--maxfliz-bg-2', '#0b1220');
  root.style.setProperty('--maxfliz-accent', '#f59e0b');
  root.style.setProperty('--maxfliz-blue', '#38bdf8');

  const style = document.createElement('style');
  style.id = 'maxfliz-inline-theme';
  style.textContent = `
    #game-canvas-container {
      z-index: 1 !important;
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: auto !important;
    }
    #game-canvas-container canvas, canvas {
      z-index: 1 !important;
      pointer-events: auto !important;
    }
    #game-shell {
      z-index: 999999 !important;
      position: fixed !important;
      inset: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      pointer-events: none !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .game-screen {
      z-index: 1000000 !important;
      position: fixed !important;
      inset: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: auto !important;
      background: rgba(11, 15, 25, 0.82) !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .game-screen.hidden, #title-screen.hidden, .hidden {
      display: none !important;
      pointer-events: none !important;
      visibility: hidden !important;
    }
    .game-modal {
      z-index: 1000001 !important;
      pointer-events: auto !important;
    }
    .hud-layer {
      pointer-events: none !important;
    }
    .hud-layer button, .hud-layer .minimap-container {
      pointer-events: auto !important;
    }
    #asset-loader-overlay {
      z-index: 2000000 !important;
      background: #0b0f19 !important;
    }
  `;
  document.head.appendChild(style);
};

async function startApp() {
  console.log('%c[App:Boot] 🚀 Rozpoczynanie sekwencji startowej Max-Fliz 3D...', 'color: #38bdf8; font-weight: bold;');
  injectThemeStyles();

  const titleScreen = document.getElementById('title-screen');
  const shell = document.getElementById('game-shell');

  // Safety fallback: reveal UI even if loading hangs
  const safetyTimeout = setTimeout(() => {
    console.warn('[App:Boot] ⚠️ Przekroczono czas ładowania (Safety Timeout 12s). Wymuszanie wyświetlenia interfejsu.');
    assetLoader.hide();
    if (titleScreen) {
      titleScreen.classList.remove('hidden');
      titleScreen.style.setProperty('display', 'flex', 'important');
      titleScreen.style.setProperty('z-index', '10000000', 'important');
    }
    if (shell) {
      shell.classList.remove('hidden');
      shell.style.setProperty('display', 'flex', 'important');
      shell.style.setProperty('z-index', '9999999', 'important');
    }
  }, 12000);

  try {
    // 1. Show Asset Loader immediately
    assetLoader.show('Inicjalizacja systemu...');

    // 2. Preload all procedural textures and sounds (non-blocking)
    console.log('[App:Boot] ⏳ Wstępne ładowanie zasobów...');
    await assetLoader.preloadAll();
    console.log('[App:Boot] ✅ Zasoby załadowane.');

    // 3. Ensure canvas in container
    const canvasContainer = document.getElementById('game-canvas-container');
    let canvas = canvasContainer?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas && canvasContainer) {
      canvas = document.createElement('canvas');
      canvas.id = 'maxfliz-3d-canvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvasContainer.appendChild(canvas);
    }

    // 4. Initialize XR Blocks Options
    console.log('[App:Boot] 🛠️ Inicjalizacja silnika XR Blocks...');
    const options = new xb.Options();
    options.setAppTitle('Max-Fliz Magazyn Showdown 3D');
    options.reticles.enabled = false;
    options.enableSimulator = true;
    options.xrButton.enabled = true;
    options.xrButton.showEnterSimulatorButton = true;
    options.xrButton.alwaysAutostartSimulator = false; 
    
    // EXPLICITLY KILL SIMULATOR ENVIRONMENT BACKGROUND (TREES/ROOM)
    // This is the primary way to ensure no "forest" shows up in AI Studio Preview.
    // @ts-ignore - 'environment' is a simulator-specific option
    options.simulator.environment = 'none'; 
    options.simulator.defaultMode = xb.SimulatorMode.CONTROLLER;
    
    if (canvas) {
      options.canvas = canvas;
    }

    // 5. Create Scene Script
    const sceneScript = new MaxFlizScene();
    xb.add(sceneScript);

    // 6. Init WebXR Engine
    try {
      console.log('[App:Boot] 🔗 Łączenie z silnikiem renderingu...');
      
      // FORCE SIMULATOR ENVIRONMENT TO NONE BEFORE INIT
      // @ts-ignore
      options.simulator.environment = 'none';
      
      await xb.init(options);
      console.log('[App:Boot] ✅ Silnik XR zainicjalizowany.');
      
      // PERSISTENT BACKGROUND ENFORCEMENT: Fight simulator environment default (trees/living room)
      if (xb.core.scene) {
        xb.core.scene.background = new THREE.Color(0x020408);
        xb.core.scene.fog = new THREE.Fog(0x020408, 1, 60);
      }

      // Ensure the container itself is opaque black to hide any leaking simulator UI
      const container = document.getElementById('game-canvas-container');
      if (container) {
        container.style.backgroundColor = '#020408';
        container.style.zIndex = '1';
      }
    } catch (e) {
      console.warn('[App:Boot] ⚠️ Uwaga inicjalizacji XR:', e);
    }

    clearTimeout(safetyTimeout);
    assetLoader.hide();

    // 7. Reveal UI with high priority
    if (shell) {
      shell.classList.remove('hidden');
      shell.style.setProperty('display', 'flex', 'important');
      shell.style.setProperty('z-index', '9999999', 'important');
    }

    if (titleScreen) {
      titleScreen.classList.remove('hidden');
      titleScreen.style.setProperty('display', 'flex', 'important');
      titleScreen.style.setProperty('z-index', '10000000', 'important');
      console.log('[App:Boot] 🎉 Ekran tytułowy gotowy.');
    }

  } catch (err) {
    console.error('[App:Boot] ❌ KRYTYCZNY BŁĄD STARTU:', err);
    clearTimeout(safetyTimeout);
    assetLoader.hide();
    if (titleScreen) {
      titleScreen.classList.remove('hidden');
      titleScreen.style.setProperty('display', 'flex', 'important');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void startApp());
} else {
  void startApp();
}


