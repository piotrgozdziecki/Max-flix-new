import { sound } from './sound.ts';

export interface PixelIntroCallbacks {
  onComplete: () => void;
  onStartGame?: () => void;
}

export class PixelIntroManager {
  private callbacks: PixelIntroCallbacks;
  private overlayEl: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private active: boolean = false;
  private paused: boolean = false;
  private time: number = 0;
  private currentScene: number = 0;
  private animFrameId: number | null = null;
  private playedEvents: Set<string> = new Set();
  private lastFrameTime: number = 0;

  // Particle systems for HD action effects
  private particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(callbacks: PixelIntroCallbacks) {
    this.callbacks = callbacks;
  }

  public isRunning(): boolean {
    return this.active;
  }

  public start() {
    console.log('%c[PixelIntro] 🕹️ Inicjalizacja Retro Intro 2D/VHS (20s High-Octane Action)...', 'color: #38bdf8; font-weight: bold;');
    this.active = true;
    this.paused = false;
    this.time = 0;
    this.currentScene = 0;
    this.playedEvents.clear();
    this.particles = [];

    this.mountOverlay();
    try {
      sound.playCinematicBoom();
    } catch (e) {
      console.warn('[PixelIntro] Sound Boom Notice:', e);
    }

    // Immediately render scene 0 and update UI
    this.renderHdScene(0, 0);
    this.updateUI();

    this.lastFrameTime = performance.now();
    console.log('[PixelIntro] ✅ Retro Intro 2D gotowe i uruchomione.');
    this.loop();
  }

  public stop() {
    if (!this.active) return;
    this.active = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.unmountOverlay();
    this.callbacks.onComplete();
  }

  private loop = () => {
    if (!this.active) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.08);
    this.lastFrameTime = now;

    if (!this.paused) {
      this.time += dt;
      if (this.time >= 20.0) { // 20s High-Octane Action Intro
        this.stop();
        return;
      }
      this.renderHdScene(this.time, dt);
      this.updateUI();
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private mountOverlay() {
    this.unmountOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'pixel-intro-overlay';
    overlay.className = 'pixel-intro-overlay';

    overlay.innerHTML = `
      <div class="pixel-crt-scanlines"></div>
      <div class="cinematic-vignette"></div>
      <div class="cinematic-grain"></div>
      <div class="pixel-vhs-header">
        <div class="pixel-badge">
          <span class="pixel-rec-dot">🔴</span>
          <span class="pixel-badge-text">MAX-FLIZ 2000s HIGH-OCTANE ACTION MOVIE HD</span>
        </div>
        <div class="pixel-timer" id="pixel-timer-display">00:00 / 00:20</div>
        <div class="pixel-quick-btns">
          <button id="btn-pixel-pause" class="pixel-btn">⏸️ PAUZA</button>
          <button id="btn-pixel-replay" class="pixel-btn">🔄 REPLAY</button>
          <button id="btn-pixel-skip" class="pixel-btn btn-skip">⏩ PRZESKOCZ</button>
          <button id="btn-pixel-play" class="pixel-btn btn-play-now">🚀 GRAJ TERAZ</button>
        </div>
      </div>

      <div class="pixel-canvas-wrapper">
        <canvas id="pixel-intro-canvas" width="1920" height="1080"></canvas>
      </div>

      <div class="pixel-subtitle-box">
        <div id="pixel-speaker-tag" class="pixel-speaker-tag">👔 BYŁY KIEROWNIK WALCZAK</div>
        <div id="pixel-subtitle-text" class="pixel-subtitle-text">“Aleja B4 należy do mnie! Żadna płytka Calacatta Gold stąd dzisiaj nie wyjedzie! Hahaha!”</div>
      </div>

      <div class="pixel-footer-bar">
        <div class="pixel-scene-steps">
          <div class="pixel-step active" data-scene="0">1. SABOTAŻ</div>
          <div class="pixel-step" data-scene="1">2. MARCIN</div>
          <div class="pixel-step" data-scene="2">3. GRZESIEK & DAWID</div>
          <div class="pixel-step" data-scene="3">4. MATEUSZ & PIOTR</div>
          <div class="pixel-step" data-scene="4">5. FINAŁ AKCJI</div>
        </div>
        <div class="pixel-progress-track">
          <div id="pixel-progress-fill" class="pixel-progress-fill"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    this.canvas = document.getElementById('pixel-intro-canvas') as HTMLCanvasElement | null;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      if (this.ctx) {
        this.ctx.imageSmoothingEnabled = true; // Crisp HD anti-aliased rendering
        this.ctx.imageSmoothingQuality = 'high';
      }
    }

    // Attach listeners
    document.getElementById('btn-pixel-pause')?.addEventListener('click', () => {
      this.paused = !this.paused;
      const btn = document.getElementById('btn-pixel-pause');
      if (btn) btn.textContent = this.paused ? '▶️ WZNÓW' : '⏸️ PAUZA';
    });

    document.getElementById('btn-pixel-replay')?.addEventListener('click', () => {
      this.start();
    });

    document.getElementById('btn-pixel-skip')?.addEventListener('click', () => {
      this.stop();
    });

    document.getElementById('btn-pixel-play')?.addEventListener('click', () => {
      this.stop();
      this.callbacks.onStartGame?.();
    });

    overlay.querySelectorAll('.pixel-step').forEach((stepEl) => {
      stepEl.addEventListener('click', () => {
        const sc = parseInt(stepEl.getAttribute('data-scene') || '0', 10);
        const sceneTimes = [0, 4.0, 8.0, 12.0, 16.0];
        this.time = sceneTimes[sc] || 0;
        this.playedEvents.clear();
      });
    });
  }

  private unmountOverlay() {
    if (this.overlayEl && this.overlayEl.parentElement) {
      this.overlayEl.parentElement.removeChild(this.overlayEl);
      this.overlayEl = null;
      this.canvas = null;
      this.ctx = null;
    }
  }

  private triggerOnce(key: string, timestamp: number, fn: () => void) {
    if (this.time >= timestamp && !this.playedEvents.has(key)) {
      this.playedEvents.add(key);
      fn();
    }
  }

  private renderHdScene(t: number, dt: number) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear Screen
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Update Particles
    this.updateParticles(dt);

    // Determine Active Act (0 to 4)
    if (t < 4.0) {
      this.currentScene = 0;
      this.renderAct0(ctx, w, h, t);
    } else if (t < 8.0) {
      this.currentScene = 1;
      this.renderAct1(ctx, w, h, t - 4.0);
    } else if (t < 12.0) {
      this.currentScene = 2;
      this.renderAct2(ctx, w, h, t - 8.0);
    } else if (t < 16.0) {
      this.currentScene = 3;
      this.renderAct3(ctx, w, h, t - 12.0);
    } else {
      this.currentScene = 4;
      this.renderAct4(ctx, w, h, t - 16.0);
    }

    // Draw Particles on Top
    this.drawParticles(ctx);
  }

  // ---------------------------------------------------------------------
  // ACT 0: NOCNY SABOTAŻ WALCZAKA (0.0s - 4.0s)
  // ---------------------------------------------------------------------
  private renderAct0(ctx: CanvasRenderingContext2D, w: number, h: number, st: number) {
    // High-contrast Dark Warehouse Background with Red Hazard Beacons
    this.drawHdWarehouseBG(ctx, w, h, '#020617', '#1e1b4b', '#431407');

    // Flashing Red Alert Beacons & Lightning
    const alarmFlash = Math.sin(st * 12) > 0;
    if (alarmFlash) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.fillRect(0, 0, w, h);
    }

    // Speedlines on edges
    this.drawSpeedlines(ctx, w, h, 'rgba(239, 68, 68, 0.15)', st);

    // Walczak Sneaking HD Silhouette & Megaphone
    const walczakX = w * 0.35 + Math.sin(st * 4) * 120;
    const walczakY = h * 0.62;

    this.drawHdCharacterBadge(
      ctx,
      walczakX,
      walczakY,
      '👔',
      'BYŁY KIEROWNIK WALCZAK',
      'SABOTAŻ DOSTAWY CALACATTA!',
      '#ef4444',
      1.1 + Math.sin(st * 6) * 0.05
    );

    // Scattered Contract Papers Flying in Air
    for (let i = 0; i < 12; i++) {
      const px = (w * 0.2 + i * 140 + st * 220) % w;
      const py = h * 0.3 + Math.sin(st * 5 + i) * 80;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(st * 3 + i);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-15, -20, 30, 40);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('CANCEL', -18, 5);
      ctx.restore();
    }

    // Comic Callout Box
    this.drawActionCallout(ctx, w * 0.5, h * 0.25, 'MIA HA HA! GRES B4 ZABLOKOWANY!', '#ef4444');

    this.triggerOnce('act0_audio', 0.5, () => {
      sound.playEvilLaugh();
      sound.playSirens();
    });
  }

  // ---------------------------------------------------------------------
  // ACT 1: MARCIN & POTĘŻNA PIECZĘĆ WZ (4.0s - 8.0s)
  // ---------------------------------------------------------------------
  private renderAct1(ctx: CanvasRenderingContext2D, w: number, h: number, st: number) {
    this.drawHdWarehouseBG(ctx, w, h, '#0f172a', '#1e3a8a', '#1d4ed8');

    // Action Radial Rays
    this.drawRadialActionRays(ctx, w * 0.5, h * 0.5, '#38bdf8', st);

    // Marcin Superhero Entry
    const marcinX = w * 0.32;
    const marcinY = h * 0.62;

    this.drawHdCharacterBadge(
      ctx,
      marcinX,
      marcinY,
      '👷‍♂️',
      'MARCIN – KIEROWNIK LOGISTYKI',
      'WYJAZD NA REKLAMACJE! ZAMYKAM TU WSZYSTKO!',
      '#f59e0b',
      1.15
    );

    // Stamp Slam Effect at 2.0s
    if (st >= 1.5) {
      const slamProgress = Math.min((st - 1.5) * 6, 1);
      const shakeX = (Math.random() - 0.5) * (1 - slamProgress) * 40;
      const shakeY = (Math.random() - 0.5) * (1 - slamProgress) * 40;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Giant Golden WZ Stamp
      const stampX = w * 0.68;
      const stampY = h * 0.55;
      const stampScale = 0.2 + slamProgress * 0.9;

      ctx.save();
      ctx.translate(stampX, stampY);
      ctx.scale(stampScale, stampScale);

      // Stamp Outer Glow Ring
      const grad = ctx.createRadialGradient(0, 0, 50, 0, 0, 300);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 300, 0, Math.PI * 2);
      ctx.fill();

      // Golden Stamp Box
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-220, -130, 440, 260);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 12;
      ctx.strokeRect(-220, -130, 440, 260);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 84px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PROTOKÓŁ WZ', 0, -20);
      ctx.font = '900 48px sans-serif';
      ctx.fillStyle = '#16a34a';
      ctx.fillText('APPROVED • ZATWIERDZONE', 0, 55);

      ctx.restore();

      // Shockwave Ring
      const shockRadius = (st - 1.5) * 600;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 14 * (1 - Math.min(shockRadius / 900, 1));
      ctx.beginPath();
      ctx.arc(stampX, stampY, shockRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      this.drawActionCallout(ctx, w * 0.68, h * 0.18, 'BEZ PODPISU WZ PALETA NIE WYJEDZIE!', '#f59e0b');

      this.triggerOnce('act1_slam', 1.6, () => {
        sound.playAbility('marcin');
        sound.playCinematicBoom();
        this.spawnBurstParticles(stampX, stampY, '#f59e0b', 40);
      });
    }
  }

  // ---------------------------------------------------------------------
  // ACT 2: GRZESIEK & DAWID – ŚCISK & GRES 120x280 (8.0s - 12.0s)
  // ---------------------------------------------------------------------
  private renderAct2(ctx: CanvasRenderingContext2D, w: number, h: number, st: number) {
    this.drawHdWarehouseBG(ctx, w, h, '#064e3b', '#047857', '#10b981');

    this.drawSpeedlines(ctx, w, h, 'rgba(16, 185, 129, 0.25)', st);

    // Left Hero: Grzesiek on Forklift
    const grzesiekX = w * 0.28;
    this.drawHdCharacterBadge(
      ctx,
      grzesiekX,
      h * 0.6,
      '🚜',
      'GRZESIEK – ŚCISKACZ B4',
      '44 CM W BICEPSIE! ŚCISK ZAGŁADY!',
      '#10b981',
      1.1
    );

    // Right Hero: Dawid Superhero Landing
    const dawidX = w * 0.72;
    this.drawHdCharacterBadge(
      ctx,
      dawidX,
      h * 0.6,
      '💪',
      'DAWID – ARCYMISTRZ GRESU',
      'GRES 120x280 POD KĄTEM 45°!',
      '#f59e0b',
      1.1
    );

    // Giant 120x280 Calacatta Gold Tile Flying In Center
    if (st >= 1.2) {
      const tileProgress = Math.min((st - 1.2) * 5, 1);
      const tileX = w * 0.5;
      const tileY = h * 0.48;

      ctx.save();
      ctx.translate(tileX, tileY);
      ctx.rotate(Math.sin(st * 8) * 0.15);
      ctx.scale(tileProgress, tileProgress);

      // Tile Body
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-180, -280, 360, 560);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(-180, -280, 360, 560);

      // Gold Veins
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-120, -200);
      ctx.lineTo(80, -50);
      ctx.lineTo(-40, 150);
      ctx.lineTo(120, 240);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CALACATTA GOLD', 0, -20);
      ctx.fillText('120 x 280 cm', 0, 30);

      ctx.restore();

      this.drawActionCallout(ctx, w * 0.5, h * 0.14, 'JA WIEM NAJLEPIEJ! GRES 120x280 LEĆ!', '#10b981');

      this.triggerOnce('act2_boom', 1.3, () => {
        sound.playAbility('grzesiek');
        sound.playAbility('dawid');
        sound.playCinematicBoom();
        this.spawnBurstParticles(w * 0.5, h * 0.48, '#10b981', 45);
      });
    }
  }

  // ---------------------------------------------------------------------
  // ACT 3: MATEUSZ & PIOTR – BSOD MATRIX & BIMBER 70% (12.0s - 16.0s)
  // ---------------------------------------------------------------------
  private renderAct3(ctx: CanvasRenderingContext2D, w: number, h: number, st: number) {
    this.drawHdWarehouseBG(ctx, w, h, '#311b92', '#4a148c', '#880e4f');

    // Matrix Cyber Lines Background
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const lx = (i * 100 + st * 300) % w;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, h);
      ctx.stroke();
    }

    // Left Hero: Mateusz Gamer
    const mateuszX = w * 0.28;
    this.drawHdCharacterBadge(
      ctx,
      mateuszX,
      h * 0.6,
      '🎮',
      'MATEUSZ – PS MANIAK',
      'BSOD! ZAWIESZAM SYSTEM WALCZAKA!',
      '#38bdf8',
      1.1
    );

    // Right Hero: Piotr Weteran
    const piotrX = w * 0.72;
    this.drawHdCharacterBadge(
      ctx,
      piotrX,
      h * 0.6,
      '👨‍🔧',
      'PIOTR – WETERAN B4',
      '70% BIMBRU ZZA REGAŁU! OGIEŃ!',
      '#ef4444',
      1.1
    );

    // Firestorm & BSOD Glitch Explosion at 1.5s
    if (st >= 1.5) {
      // Fire puddle on ground
      const fireGrad = ctx.createRadialGradient(w * 0.5, h * 0.85, 20, w * 0.5, h * 0.85, 600);
      fireGrad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
      fireGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.7)');
      fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = fireGrad;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);

      // BSOD Box in center
      ctx.fillStyle = '#0000aa';
      ctx.fillRect(w * 0.38, h * 0.22, w * 0.24, h * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(w * 0.38, h * 0.22, w * 0.24, h * 0.22);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(':( BSOD 0x0000FF', w * 0.5, h * 0.3);
      ctx.font = '700 20px sans-serif';
      ctx.fillText('WALCZAK DRONES FROZEN!', w * 0.5, h * 0.36);

      this.drawActionCallout(ctx, w * 0.5, h * 0.1, '70 VOLTÓW ZZA REGAŁU! OGIEŃ NA GRESIE!', '#ef4444');

      this.triggerOnce('act3_boom', 1.6, () => {
        sound.playAbility('piotr');
        sound.playFireCrackle();
        sound.playGlassBreak();
        this.spawnBurstParticles(w * 0.5, h * 0.8, '#ef4444', 50);
      });
    }
  }

  // ---------------------------------------------------------------------
  // ACT 4: FINAŁOWE ZGROMADZENIE BOHATERÓW MAX-FLIZ (16.0s - 20.0s)
  // ---------------------------------------------------------------------
  private renderAct4(ctx: CanvasRenderingContext2D, w: number, h: number, st: number) {
    // Golden Victory Arena Background
    this.drawHdWarehouseBG(ctx, w, h, '#020617', '#1e293b', '#f59e0b');

    // Fireworks & Confetti Burst
    this.drawRadialActionRays(ctx, w * 0.5, h * 0.4, '#f59e0b', st);

    // Five Hero Display Stand Positions
    const xs = [w * 0.16, w * 0.32, w * 0.48, w * 0.64, w * 0.8];
    const badges = [
      { icon: '👷‍♂️', name: 'MARCIN', role: 'LOGISTYKA', color: '#f59e0b' },
      { icon: '🚜', name: 'GRZESIEK', role: 'ŚCISKACZ', color: '#10b981' },
      { icon: '💪', name: 'DAWID', role: 'ARCYMISTRZ', color: '#38bdf8' },
      { icon: '🎮', name: 'MATEUSZ', role: 'GEJMER', color: '#a855f7' },
      { icon: '👨‍🔧', name: 'PIOTR', role: 'WETERAN', color: '#ef4444' },
    ];

    badges.forEach((b, idx) => {
      this.drawHdCharacterBadge(
        ctx,
        xs[idx],
        h * 0.62,
        b.icon,
        b.name,
        b.role,
        b.color,
        1.0 + Math.sin(st * 4 + idx) * 0.04
      );
    });

    // Walczak Flees in Panic on Right Edge
    const fleeX = w * 0.88 + st * 150;
    ctx.font = '72px sans-serif';
    ctx.fillText('🏃‍♂️👔💨', fleeX, h * 0.75);

    // Grand Metallic Title Banner
    ctx.save();
    ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
    ctx.shadowBlur = 30;

    const titleGrad = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.22);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.5, '#f59e0b');
    titleGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = titleGrad;
    ctx.font = '900 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MAX-FLIZ SHOWDOWN 3D: GOTOWI DO AKCJI!', w * 0.5, h * 0.16);

    ctx.restore();

    this.triggerOnce('act4_applause', 0.5, () => {
      sound.playApplause();
      this.spawnBurstParticles(w * 0.5, h * 0.3, '#f59e0b', 60);
    });
  }

  // ---------------------------------------------------------------------
  // GRAPHICS HELPERS FOR 1080p HIGH-DEFINITION ACTION
  // ---------------------------------------------------------------------
  private drawHdWarehouseBG(ctx: CanvasRenderingContext2D, w: number, h: number, c1: string, c2: string, c3: string) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(0.65, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // High-Bay Warehouse Floor Grid & Safety Markings
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, h * 0.695, w, 8); // Yellow safety hazard line
  }

  private drawSpeedlines(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, st: number) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + st * 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + Math.cos(angle) * 400, h * 0.5 + Math.sin(angle) * 300);
      ctx.lineTo(w * 0.5 + Math.cos(angle) * 1200, h * 0.5 + Math.sin(angle) * 900);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRadialActionRays(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, st: number) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + st;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 1400, angle, angle + 0.12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawHdCharacterBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    avatarEmoji: string,
    title: string,
    subtext: string,
    accentColor: string,
    scale = 1.0
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Glowing Aura Box
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 25;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(-180, -160, 360, 320);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(-180, -160, 360, 320);

    ctx.shadowBlur = 0; // Reset blur for sharp text

    // Emoji Avatar
    ctx.font = '96px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(avatarEmoji, 0, -30);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.fillText(title, 0, 60);

    // Subtext
    ctx.fillStyle = accentColor;
    ctx.font = '700 16px sans-serif';
    ctx.fillText(subtext, 0, 100);

    ctx.restore();
  }

  private drawActionCallout(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
    ctx.save();
    ctx.translate(x, y);

    // Comic Callout Background
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-420, -45, 840, 90);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(-420, -45, 840, 90);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 10);

    ctx.restore();
  }

  private spawnBurstParticles(cx: number, cy: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 500;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 12,
        color,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private updateUI() {
    if (!this.overlayEl) return;

    // Timer display
    const curSec = Math.floor(this.time);
    const timerEl = document.getElementById('pixel-timer-display');
    if (timerEl) {
      const s1 = curSec < 10 ? `0${curSec}` : `${curSec}`;
      timerEl.textContent = `00:${s1} / 00:20`;
    }

    // Progress bar fill
    const fillEl = document.getElementById('pixel-progress-fill');
    if (fillEl) {
      fillEl.style.width = `${(this.time / 20.0) * 100}%`;
    }

    // Update active scene step indicator
    this.overlayEl.querySelectorAll('.pixel-step').forEach((stepEl) => {
      const sc = parseInt(stepEl.getAttribute('data-scene') || '0', 10);
      if (sc === this.currentScene) stepEl.classList.add('active');
      else stepEl.classList.remove('active');
    });

    // Subtitle updates
    const speakerEl = document.getElementById('pixel-speaker-tag');
    const textEl = document.getElementById('pixel-subtitle-text');

    const subtitles = [
      {
        speaker: '👔 BYŁY KIEROWNIK WALCZAK',
        text: '“Tylko ja mogłem kierować tą fabryką! Cała dostawa Calacatta Gold zostaje zablokowana!”',
      },
      {
        speaker: '👷‍♂️ MARCIN – KIEROWNIK LOGISTYKI',
        text: '“Gdzie jest podpis na dokumencie WZ?! Protokół reklamacji otwarty – zamykam tę aleję na własnych warunkach!”',
      },
      {
        speaker: '🚜 GRZESIEK & 💪 DAWID',
        text: '“Grzesiek: 44 cm w bicepsie i Ścisk Zagłady! • Dawid: Gres 120x280 leci pod kątem 45° – Ja Wiem Najlepiej!”',
      },
      {
        speaker: '🎮 MATEUSZ & 👨‍🔧 PIOTR',
        text: '“Mateusz: Laga mają! BSOD i platyna wpada na konto! • Piotr: 70 voltów zza regału B4! Ogień na gresie!”',
      },
      {
        speaker: '🏆 BOHATEROWIE MAX-FLIZ',
        text: '“Dostawa zabezpieczona! Wybierz swojego magazyniera i rozpocznij zmianę w Max-Fliz Showdown 3D!”',
      },
    ];

    const currentSub = subtitles[this.currentScene] || subtitles[0];
    if (speakerEl) speakerEl.textContent = currentSub.speaker;
    if (textEl) textEl.textContent = currentSub.text;
  }
}
