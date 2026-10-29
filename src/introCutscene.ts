import * as THREE from 'three';
import { CHARACTERS } from './characters.ts';
import { sound } from './sound.ts';
import {
  createCharacterModel,
  createWalczakBossModel,
  createDisplayPodium,
  createGroutCollectible,
  createCarraraCollectible,
  createNeonShowroomSign,
  getShowroomMarbleFloorTexture,
  getShowroomWallTexture,
  createShowroomPlant,
  createTrackSpotlights,
} from './warehouseAssets.ts';
import { assetLoader } from './assets.ts';

export interface CutsceneCallbacks {
  onComplete: () => void;
  onStartGame?: () => void;
  onSelectCharacter?: (charId: string) => void;
}

export class IntroCutsceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private callbacks: CutsceneCallbacks;

  private rootGroup: THREE.Group;
  private active: boolean = false;
  private paused: boolean = false;
  private currentTime: number = 0;
  private totalDuration: number = 38.0; // 38 seconds total cinematic experience

  // 3D Actors
  private walczak!: { group: THREE.Group; armL: THREE.Mesh; armR: THREE.Mesh; legL: THREE.Mesh; legR: THREE.Mesh };
  private marcin!: { group: THREE.Group; leftArm: THREE.Mesh; rightArm: THREE.Mesh; leftLeg: THREE.Mesh; rightLeg: THREE.Mesh };
  private grzesiek!: { group: THREE.Group; leftArm: THREE.Mesh; rightArm: THREE.Mesh; leftLeg: THREE.Mesh; rightLeg: THREE.Mesh };
  private dawid!: { group: THREE.Group; leftArm: THREE.Mesh; rightArm: THREE.Mesh; leftLeg: THREE.Mesh; rightLeg: THREE.Mesh };
  private mateusz!: { group: THREE.Group; leftArm: THREE.Mesh; rightArm: THREE.Mesh; leftLeg: THREE.Mesh; rightLeg: THREE.Mesh };
  private piotr!: { group: THREE.Group; leftArm: THREE.Mesh; rightArm: THREE.Mesh; leftLeg: THREE.Mesh; rightLeg: THREE.Mesh };

  // Special Props & Effects
  private wzSealMesh!: THREE.Group;
  private dawidTileMesh!: THREE.Mesh;
  private bsodScreenMesh!: THREE.Mesh;
  private bimberFirePuddle!: THREE.Group;
  private shockwaveRing!: THREE.Mesh;
  private spotlight1!: THREE.SpotLight;
  private spotlight2!: THREE.SpotLight;
  private sirenLight!: THREE.PointLight;
  private goldPillar!: THREE.Mesh;
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];

  // UI Elements
  private overlayEl: HTMLElement | null = null;
  private currentActIndex: number = -1;
  private playedTriggers: Set<string> = new Set();

  private renderer: THREE.WebGLRenderer | null = null;
  private shake: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer | null, callbacks: CutsceneCallbacks) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.callbacks = callbacks;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'IntroCutsceneRoot';
  }

  public setScene(scene: THREE.Scene) {
    if (this.active && this.scene && this.scene !== scene) {
      this.scene.remove(this.rootGroup);
      scene.add(this.rootGroup);
    }
    this.scene = scene;
  }

  public setCamera(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public setRenderer(renderer: THREE.WebGLRenderer | null) {
    this.renderer = renderer;
  }

  public isRunning(): boolean {
    return this.active;
  }

  public async start() {
    console.group('%c[IntroCutscene3D] 🎬 Inicjalizacja sceny kinowej 3D (Showroom Cutscene)', 'color: #f59e0b; font-weight: bold;');
    const t0 = performance.now();
    this.active = true;
    this.paused = false;
    this.currentTime = 0;
    this.currentActIndex = -1;
    this.playedTriggers.clear();

    this.clearRoot();
    
    // Split initialization to avoid long frame freeze
    this.buildStage();
    await new Promise(r => requestAnimationFrame(r));
    
    this.buildActors();
    await new Promise(r => requestAnimationFrame(r));
    
    this.createUIOverlay();

    if (this.scene) {
      this.scene.add(this.rootGroup);
    }
    
    try {
      sound.playCinematicBoom();
    } catch (e) {
      console.warn('[IntroCutscene3D] Audio notice:', e);
    }

    // Immediately render frame 0 so Act 1 and subtitles are ready on frame 0
    this.updateTimeline(0);
    this.updateUIOverlay();
    console.log(`[IntroCutscene3D] ✅ Scena kinowa 3D zainicjalizowana pomyślnie w ${Math.round(performance.now() - t0)} ms.`);
    console.groupEnd();
  }

  public stop() {
    if (!this.active) return;
    this.active = false;
    if (this.scene) {
      this.scene.remove(this.rootGroup);
    }
    this.clearRoot();
    this.removeUIOverlay();
    this.callbacks.onComplete();
  }

  private clearRoot() {
    while (this.rootGroup.children.length > 0) {
      this.rootGroup.remove(this.rootGroup.children[0]);
    }
    this.particles = [];
  }

  private buildStage() {
    // Stage Floor (Showroom Calacatta Marble)
    const floorGeo = new THREE.PlaneGeometry(50, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      map: getShowroomMarbleFloorTexture(),
      roughness: 0.1,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.rootGroup.add(floor);

    // Back Wall (Natural Oak Slat Wall with Neon Sign)
    const wallGeo = new THREE.BoxGeometry(50, 8.5, 0.4);
    const wallMat = new THREE.MeshStandardMaterial({
      map: getShowroomWallTexture(),
      roughness: 0.6,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 4.25, -12);
    this.rootGroup.add(backWall);

    // Neon Max-Fliz Title Banner
    const neonSign = createNeonShowroomSign('MAX-FLIZ • FILM FABULARNY 3D', '#fbbf24');
    neonSign.position.set(0, 6.2, -11.75);
    this.rootGroup.add(neonSign);

    // Showroom Spotlights
    const trackLights = createTrackSpotlights(40);
    trackLights.position.set(0, 7.8, -4);
    this.rootGroup.add(trackLights);

    // Dramatic Dynamic Spotlights for Character Intros
    this.spotlight1 = new THREE.SpotLight(0xfbbf24, 85, 45, Math.PI / 5, 0.4, 1);
    this.spotlight1.position.set(0, 10, 2);
    this.spotlight1.castShadow = true;
    this.rootGroup.add(this.spotlight1);

    this.spotlight2 = new THREE.SpotLight(0x38bdf8, 65, 45, Math.PI / 5, 0.4, 1);
    this.spotlight2.position.set(-10, 10, 2);
    this.spotlight2.castShadow = true;
    this.rootGroup.add(this.spotlight2);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.rootGroup.add(ambient);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    this.rootGroup.add(hemi);

    // Five Multi-Tier Display Podiums for Finale
    const podiumXPositions = [-16, -8, 0, 8, 16];
    podiumXPositions.forEach((px) => {
      const podium = createDisplayPodium(2.8, 2.2, 0.25);
      podium.position.set(px, 0, -2);
      this.rootGroup.add(podium);
    });

    // Special Props: WZ Seal
    this.wzSealMesh = new THREE.Group();
    const sealHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, metalness: 0.8, roughness: 0.2 })
    );
    sealHandle.position.y = 0.3;
    const sealBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 })
    );
    this.wzSealMesh.add(sealHandle, sealBase);
    this.wzSealMesh.position.set(0, -10, 0); // Hide initially
    this.rootGroup.add(this.wzSealMesh);

    // Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    this.shockwaveRing.rotation.x = -Math.PI / 2;
    this.shockwaveRing.position.set(0, 0.05, 0);
    this.rootGroup.add(this.shockwaveRing);

    // Alarm Siren Light (Act 1 Sabotage)
    this.sirenLight = new THREE.PointLight(0xef4444, 0, 25);
    this.sirenLight.position.set(0, 4, -4);
    this.rootGroup.add(this.sirenLight);

    // Radiant Golden Pillar (Act 2 Marcin's WZ Seal)
    const pillarGeo = new THREE.CylinderGeometry(0.6, 1.2, 12, 24, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.goldPillar = new THREE.Mesh(pillarGeo, pillarMat);
    this.goldPillar.position.set(0, -20, 0);
    this.rootGroup.add(this.goldPillar);

    // Dawid's 120x280 Calacatta Tile
    const tileGeo = new THREE.BoxGeometry(1.2, 2.8, 0.08);
    const tileMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1 });
    this.dawidTileMesh = new THREE.Mesh(tileGeo, tileMat);
    this.dawidTileMesh.position.set(0, -10, 0);
    this.rootGroup.add(this.dawidTileMesh);

    // Mateusz's BSOD Screen Quad
    const bsodCanvas = document.createElement('canvas');
    bsodCanvas.width = 512;
    bsodCanvas.height = 320;
    const ctx = bsodCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0000aa';
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(':( Aproblem has occurred', 30, 60);
      ctx.font = '16px monospace';
      ctx.fillText('BSOD 0x000000FF: MATEUSZ_PS5_LAG', 30, 110);
      ctx.fillText('WALCZAK DRONES FROZEN IN TIME', 30, 140);
      ctx.fillText('PRESS F TO PAY RESPECTS TO GRES', 30, 180);
      ctx.fillText('STATUS: SPEEDRUN IN PROGRESS', 30, 220);
    }
    const bsodTex = new THREE.CanvasTexture(bsodCanvas);
    const bsodGeo = new THREE.PlaneGeometry(4.0, 2.5);
    const bsodMat = new THREE.MeshBasicMaterial({ map: bsodTex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    this.bsodScreenMesh = new THREE.Mesh(bsodGeo, bsodMat);
    this.bsodScreenMesh.position.set(0, -10, 0);
    this.rootGroup.add(this.bsodScreenMesh);

    // Piotr's Bimber Fire Puddle
    this.bimberFirePuddle = new THREE.Group();
    const puddleGeo = new THREE.CircleGeometry(2.2, 24);
    const puddleMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 });
    const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
    puddleMesh.rotation.x = -Math.PI / 2;
    puddleMesh.position.y = 0.04;
    this.bimberFirePuddle.add(puddleMesh);

    for (let i = 0; i < 8; i++) {
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 })
      );
      flame.position.set((Math.random() - 0.5) * 2.8, 0.4, (Math.random() - 0.5) * 2.8);
      this.bimberFirePuddle.add(flame);
    }
    this.bimberFirePuddle.position.set(0, -10, 0);
    this.rootGroup.add(this.bimberFirePuddle);
  }

  private buildActors() {
    console.log('[IntroCutscene3D] 🎭 Inicjalizacja modeli 3D aktorów sceny...');

    const createActorSafe = (name: string, assetId: string, factory: () => any) => {
      const t = performance.now();
      try {
        // Try to get from cache first (cloned for animation safety)
        let actor = assetLoader.getClone(assetId);
        if (actor) {
          console.log(`[IntroCutscene3D] 📦 Użyto zbuforowanego modelu: ${name} (${assetId})`);
          return actor;
        }

        console.log(`[IntroCutscene3D] ⏳ Budowanie modelu 3D (brak w cache): ${name}...`);
        actor = factory();
        console.log(`[IntroCutscene3D] ✅ Model 3D gotowy: ${name} (${Math.round(performance.now() - t)} ms)`);
        return actor;
      } catch (err) {
        console.error(`[IntroCutscene3D] ❌ Błąd podczas budowania modelu 3D ${name}:`, err);
        const fallbackGroup = new THREE.Group();
        const placeholder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.5), new THREE.MeshStandardMaterial({ color: 0x888888 }));
        placeholder.position.y = 0.9;
        fallbackGroup.add(placeholder);
        return {
          group: fallbackGroup,
          leftArm: placeholder,
          rightArm: placeholder,
          leftLeg: placeholder,
          rightLeg: placeholder,
          armL: placeholder,
          armR: placeholder,
          legL: placeholder,
          legR: placeholder,
        };
      }
    };

    // 1. Walczak Boss
    this.walczak = createActorSafe('Walczak Boss', 'models/boss_walczak.mesh', () => createWalczakBossModel());
    this.walczak.group.position.set(0, 0.4, -4);
    this.rootGroup.add(this.walczak.group);

    // 2. Marcin
    this.marcin = createActorSafe('Marcin (Kierownik)', 'models/character_marcin.mesh', () => createCharacterModel(CHARACTERS.marcin));
    this.marcin.group.position.set(-25, 0.4, 0);
    this.rootGroup.add(this.marcin.group);

    // 3. Grzesiek
    this.grzesiek = createActorSafe('Grzesiek (Ściskacz 44cm)', 'models/character_grzesiek.mesh', () => createCharacterModel(CHARACTERS.grzesiek));
    this.grzesiek.group.position.set(-28, 0.4, 0);
    this.rootGroup.add(this.grzesiek.group);

    // 4. Dawid
    this.dawid = createActorSafe('Dawid (Mistrz Gresu)', 'models/character_dawid.mesh', () => createCharacterModel(CHARACTERS.dawid));
    this.dawid.group.position.set(25, 0.4, 0);
    this.rootGroup.add(this.dawid.group);

    // 5. Mateusz
    this.mateusz = createActorSafe('Mateusz (Gejmer)', 'models/character_mateusz.mesh', () => createCharacterModel(CHARACTERS.mateusz));
    this.mateusz.group.position.set(28, 0.4, 0);
    this.rootGroup.add(this.mateusz.group);

    // 6. Piotr
    this.piotr = createActorSafe('Piotr (Weteran & Mistrz Bimbru)', 'models/character_piotr.mesh', () => createCharacterModel(CHARACTERS.piotr));
    this.piotr.group.position.set(32, 0.4, 0);
    this.rootGroup.add(this.piotr.group);
  }

  public update(dt: number) {
    if (!this.active || this.paused) return;

    this.currentTime += dt;
    if (this.currentTime >= this.totalDuration) {
      this.stop();
      return;
    }

    this.updateTimeline(dt);
    this.updateParticles(dt);
    this.updateVisualEffects(dt);
    this.updateUIOverlay();
  }

  private updateVisualEffects(dt: number) {
    if (this.shake > 0) {
      this.shake -= dt;
      const s = this.shake * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.camera.position.z += (Math.random() - 0.5) * s;
    }

    // Dynamic Exposure for impacts
    if (this.renderer) {
      const targetExposure = 1.12 + Math.max(0, Math.sin(this.currentTime * 20) * (this.shake > 0 ? 0.3 : 0));
      this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, targetExposure, dt * 10);
    }
  }

  private updateTimeline(dt: number) {
    const t = this.currentTime;

    // -------------------------------------------------------------
    // ACT 1: (0s - 7s) SABOTAŻ WALCZAKA NA MAGAZYNIE B4
    // -------------------------------------------------------------
    if (t >= 0 && t < 7) {
      this.setActIndex(0);

      // Camera: Slow ominous glide towards Walczak sneaking at night
      const progress = t / 7.0;
      this.camera.position.set(
        Math.sin(progress * 0.8) * 8.0,
        3.2 + Math.cos(progress * 1.2) * 0.6,
        6.0 - progress * 4.0
      );
      this.camera.lookAt(this.walczak.group.position.x, 1.4, this.walczak.group.position.z);

      // Flashing warehouse alarm siren
      if (this.sirenLight) {
        this.sirenLight.intensity = Math.max(0, Math.sin(t * 12)) * 350; // Massively brighter for mobile visibility
        this.sirenLight.position.set(Math.sin(t * 3) * 8, 6.0, -4);
      }

      // Walczak sneak animation
      this.walczak.group.position.x = Math.sin(t * 2.5) * 1.8;
      this.walczak.group.rotation.y = Math.PI + Math.sin(t * 2.5) * 0.4;
      this.walczak.armL.rotation.x = Math.sin(t * 8) * 0.6;
      this.walczak.armR.rotation.x = -Math.sin(t * 8) * 0.6;

      this.triggerOnce('act1_laugh', 1.5, () => {
        sound.playEvilLaugh();
        sound.playSirens();
      });

      this.triggerOnce('act1_scatter', 4.0, () => {
        sound.playGlassBreak();
        for (let i = 0; i < 18; i++) {
          this.spawnParticle(
            this.walczak.group.position.x + (Math.random() - 0.5) * 3,
            0.5 + Math.random() * 0.8,
            this.walczak.group.position.z + (Math.random() - 0.5) * 3,
            0xf59e0b
          );
        }
      });
    }

    // -------------------------------------------------------------
    // ACT 2: (7s - 14s) WEJŚCIE MARCINA I PROTOKÓŁ WZ
    // -------------------------------------------------------------
    else if (t >= 7 && t < 14) {
      this.setActIndex(1);
      if (this.sirenLight) this.sirenLight.intensity = 0;
      const actProgress = (t - 7) / 7.0;

      // Spotlight on Marcin
      this.spotlight1.position.set(-4 + actProgress * 4, 9, 2);
      this.spotlight1.target = this.marcin.group;

      // Marcin walks in with slow-motion authority
      this.marcin.group.position.set(-10 + actProgress * 10, 0.4, 0);
      this.marcin.group.rotation.y = Math.PI / 2;
      this.marcin.leftLeg.rotation.x = Math.sin(t * 6) * 0.4;
      this.marcin.rightLeg.rotation.x = -Math.sin(t * 6) * 0.4;

      // Camera: Dramatic low angle tracking Marcin
      this.camera.position.set(this.marcin.group.position.x - 3.5, 1.8, 3.2);
      this.camera.lookAt(this.marcin.group.position.x, 1.3, 0);

      this.triggerOnce('act2_entrance', 7.2, () => {
        sound.playCinematicBoom();
      });

      // Marcin slams WZ Seal at 11s
      if (t >= 11) {
        this.wzSealMesh.position.set(this.marcin.group.position.x + 0.8, 0.1, 0);
        this.wzSealMesh.rotation.y += dt * 5;

        // Radiant Golden Pillar of WZ Authority shoots upward
        if (this.goldPillar) {
          this.goldPillar.position.set(this.marcin.group.position.x + 0.8, 6, 0);
          this.goldPillar.rotation.y += dt * 3;
          const mat = this.goldPillar.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.75 - (t - 11) * 0.25);
        }

        this.triggerOnce('act2_seal_slam', 11.2, () => {
          sound.playAbility('marcin');
          sound.playCinematicBoom();
          this.shake = 0.55;
          this.shockwaveRing.position.set(this.marcin.group.position.x + 0.8, 0.05, 0);
          this.shockwaveRing.scale.set(1, 1, 1);
          (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = 0.95;
        });

        if (this.shockwaveRing.scale.x < 16) {
          this.shockwaveRing.scale.addScalar(dt * 18);
          (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = Math.max(
            0,
            (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity - dt * 1.5
          );
        }

        // Walczak gets startled and jumps back
        this.walczak.group.position.x = 6.0 + (t - 11) * 2.0;
        this.walczak.group.position.y = 0.4 + Math.abs(Math.sin((t - 11) * 8)) * 1.2;
      }
    }

    // -------------------------------------------------------------
    // ACT 3: (14s - 22s) GRZESIEK & DAWID – ŚCISK 44CM I GRES 120x280
    // -------------------------------------------------------------
    else if (t >= 14 && t < 22) {
      this.setActIndex(2);
      if (this.goldPillar) (this.goldPillar.material as THREE.MeshBasicMaterial).opacity = 0;
      const actProgress = (t - 14) / 8.0;

      // Grzesiek drives in on pallet jack from left, Dawid jumps from top right
      this.grzesiek.group.position.set(-16 + actProgress * 12, 0.4, -2);
      this.grzesiek.group.rotation.y = Math.PI / 2;
      this.grzesiek.leftArm.rotation.z = Math.sin(t * 10) * 1.2; // Flexing biceps!
      this.grzesiek.rightArm.rotation.z = -Math.sin(t * 10) * 1.2;

      this.dawid.group.position.set(14 - actProgress * 10, 0.4 + Math.abs(Math.sin(t * 4)) * 1.5, 1);
      this.dawid.group.rotation.y = -Math.PI / 2;

      // Dawid throws Calacatta Slab high in the air in an arc
      const tossProgress = ((t - 14) % 3.5) / 3.5;
      const tossY = 1.2 + Math.sin(tossProgress * Math.PI) * 2.6;
      this.dawidTileMesh.position.set(this.dawid.group.position.x, this.dawid.group.position.y + tossY, 1);
      this.dawidTileMesh.rotation.x += dt * 4;
      this.dawidTileMesh.rotation.y += dt * 5;

      // Camera: High energy whip-pan between Grzesiek and Dawid
      this.camera.position.set(
        Math.sin(actProgress * Math.PI) * 10,
        3.5,
        7.0
      );
      this.camera.lookAt(0, 1.2, 0);

      this.triggerOnce('act3_flex', 15.0, () => {
        sound.playAbility('grzesiek');
        sound.playHonk();
      });

      this.triggerOnce('act3_dawid_landing', 18.5, () => {
        sound.playAbility('dawid');
        sound.playCinematicBoom();
        this.shake = 0.45;
        for (let i = 0; i < 24; i++) {
          this.spawnParticle(this.dawid.group.position.x, 0.4, 1, 0x38bdf8);
        }
      });
    }

    // -------------------------------------------------------------
    // ACT 4: (22s - 30s) MATEUSZ & PIOTR – BSOD I BIMBER 70%
    // -------------------------------------------------------------
    else if (t >= 22 && t < 30) {
      this.setActIndex(3);
      const actProgress = (t - 22) / 8.0;

      // Mateusz & Piotr enter center stage
      this.mateusz.group.position.set(6 - actProgress * 4, 0.4, 0);
      this.mateusz.group.rotation.y = -Math.PI / 4;

      this.piotr.group.position.set(-6 + actProgress * 4, 0.4, -1);
      this.piotr.group.rotation.y = Math.PI / 4;

      // Mateusz casts giant blue BSOD Hologram with glitch pulse
      this.bsodScreenMesh.position.set(2, 2.5 + Math.sin(t * 4) * 0.15, 0);
      this.bsodScreenMesh.rotation.y = Math.sin(t * 2) * 0.2;
      (this.bsodScreenMesh.material as THREE.MeshBasicMaterial).opacity = 0.85 + Math.sin(t * 16) * 0.12;

      // Piotr ignites Bimber Fire Puddle
      this.bimberFirePuddle.position.set(-2, 0, 0);

      // Camera: 360 Matrix Orbit around Mateusz and Piotr
      const angle = (t - 22) * 0.8;
      this.camera.position.set(Math.sin(angle) * 7.5, 2.8, Math.cos(angle) * 7.5);
      this.camera.lookAt(0, 1.5, 0);

      this.triggerOnce('act4_bsod', 23.0, () => {
        sound.playCoffeePowerup();
        for (let i = 0; i < 16; i++) {
          this.spawnParticle(2 + (Math.random() - 0.5) * 3, 2.5, (Math.random() - 0.5) * 2, 0x38bdf8);
        }
      });

      this.triggerOnce('act4_bimber_fire', 26.5, () => {
        sound.playAbility('piotr');
        sound.playFireCrackle();
        sound.playCinematicBoom();
        this.shake = 0.6;
        for (let i = 0; i < 20; i++) {
          this.spawnParticle(-2 + (Math.random() - 0.5) * 3, 0.5, (Math.random() - 0.5) * 3, 0xf97316);
        }
      });
    }

    // -------------------------------------------------------------
    // ACT 5: (30s - 38s) ZJEDNOCZONA EKIPA & FINALE MOVIE
    // -------------------------------------------------------------
    else {
      this.setActIndex(4);
      const actProgress = (t - 30) / 8.0;

      // All 5 heroes stand side-by-side on display podiums in heroic poses
      const podiumXs = [-16, -8, 0, 8, 16];
      this.marcin.group.position.set(podiumXs[0], 0.65, -2);
      this.marcin.group.rotation.y = 0;

      this.grzesiek.group.position.set(podiumXs[1], 0.65, -2);
      this.grzesiek.group.rotation.y = 0;

      this.dawid.group.position.set(podiumXs[2], 0.65, -2);
      this.dawid.group.rotation.y = 0;

      this.mateusz.group.position.set(podiumXs[3], 0.65, -2);
      this.mateusz.group.rotation.y = 0;

      this.piotr.group.position.set(podiumXs[4], 0.65, -2);
      this.piotr.group.rotation.y = 0;

      // Spotlights dance across the triumphant heroes
      this.spotlight1.position.set(Math.sin(t * 1.5) * 14, 10, 4);
      this.spotlight1.target = this.dawid.group;
      this.spotlight2.position.set(-Math.sin(t * 1.5) * 14, 10, 4);
      this.spotlight2.target = this.grzesiek.group;

      // Walczak defeated flees on a wheelbarrow off screen to the right
      this.walczak.group.position.set(12 + actProgress * 15, 0.4, 2);
      this.walczak.group.rotation.y = Math.PI / 2;

      // Camera: Sweep out to grand wide shot with hero lighting
      this.camera.position.set(0, 3.8 + Math.sin(actProgress * Math.PI) * 0.5, 16.5);
      this.camera.lookAt(0, 1.8, -2);

      this.triggerOnce('act5_applause', 30.2, () => {
        sound.playApplause();
      });

      // Confetti & sparkle shower
      if (Math.random() < 0.7) {
        const colors = [0xf59e0b, 0x38bdf8, 0x4ade80, 0xec4899, 0xfacc15];
        this.spawnParticle(
          (Math.random() - 0.5) * 36,
          6 + Math.random() * 2,
          -2 + (Math.random() - 0.5) * 4,
          colors[Math.floor(Math.random() * colors.length)]
        );
      }
    }
  }

  private triggerOnce(key: string, timestamp: number, fn: () => void) {
    if (this.currentTime >= timestamp && !this.playedTriggers.has(key)) {
      this.playedTriggers.add(key);
      fn();
    }
  }

  private spawnParticle(x: number, y: number, z: number, color: number) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      new THREE.MeshBasicMaterial({ color })
    );
    p.position.set(x, y, z);
    this.rootGroup.add(p);
    this.particles.push({
      mesh: p,
      vel: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4),
      life: 1.2,
      maxLife: 1.2,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.rootGroup.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= dt * 6; // gravity
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 5;
      p.mesh.scale.setScalar(p.life / p.maxLife);
    }
  }

  private createUIOverlay() {
    this.removeUIOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'cinematic-movie-overlay';
    overlay.className = 'cinematic-movie-overlay';

    overlay.innerHTML = `
      <div class="vhs-scanline-fx"></div>
      <div class="cinematic-vignette"></div>
      <div class="cinematic-grain"></div>
      <div class="cinematic-top-bar">
        <div class="cinematic-badge">
          <span class="rec-dot">🔴</span>
          <span class="cinematic-title">FILM INTRO 3D • MAX-FLIZ SHOWDOWN</span>
        </div>
        <div class="cinematic-time-counter">
          <span id="cinematic-timer-text">00:00 / 00:38</span>
        </div>
        <div class="cinematic-quick-btns">
          <button id="btn-cutscene-pause" class="cinematic-btn">⏸️ PAUZA</button>
          <button id="btn-cutscene-replay" class="cinematic-btn">🔄 REPLAY</button>
          <button id="btn-cutscene-skip" class="cinematic-btn btn-skip">⏩ PRZESKOCZ</button>
          <button id="btn-cutscene-playnow" class="cinematic-btn btn-play-now">🚀 GRAJ TERAZ</button>
        </div>
      </div>

      <div class="cinematic-center-callout" id="cinematic-callout-box">
        <div id="cinematic-speaker-badge" class="speaker-badge">👔 BYŁY KIEROWNIK WALCZAK</div>
        <div id="cinematic-subtitle-text" class="subtitle-text">“Tylko ja mogłem kierować tą fabryką! Cała dostawa Calacatta Gold zostaje zablokowana! Hahaha!”</div>
      </div>

      <div class="cinematic-bottom-bar">
        <div class="act-indicators-row">
          <div class="act-step" data-act="0"><span class="act-num">1</span> <span class="act-name">SABOTAŻ</span></div>
          <div class="act-step" data-act="1"><span class="act-num">2</span> <span class="act-name">MARCIN</span></div>
          <div class="act-step" data-act="2"><span class="act-num">3</span> <span class="act-name">GRZESIEK & DAWID</span></div>
          <div class="act-step" data-act="3"><span class="act-num">4</span> <span class="act-name">MATEUSZ & PIOTR</span></div>
          <div class="act-step" data-act="4"><span class="act-num">5</span> <span class="act-name">FINAŁ</span></div>
        </div>
        <div class="cinematic-progress-track">
          <div id="cinematic-progress-fill" class="cinematic-progress-fill"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    // Attach button listeners
    document.getElementById('btn-cutscene-pause')?.addEventListener('click', () => {
      this.paused = !this.paused;
      const btn = document.getElementById('btn-cutscene-pause');
      if (btn) btn.textContent = this.paused ? '▶️ WZNÓW' : '⏸️ PAUZA';
    });

    document.getElementById('btn-cutscene-replay')?.addEventListener('click', () => {
      this.start();
    });

    document.getElementById('btn-cutscene-skip')?.addEventListener('click', () => {
      this.stop();
    });

    document.getElementById('btn-cutscene-playnow')?.addEventListener('click', () => {
      this.stop();
      this.callbacks.onStartGame?.();
    });

    // Act step clicks
    overlay.querySelectorAll('.act-step').forEach((stepEl) => {
      stepEl.addEventListener('click', () => {
        const act = parseInt(stepEl.getAttribute('data-act') || '0', 10);
        const actTimes = [0, 7.0, 14.0, 22.0, 30.0];
        this.currentTime = actTimes[act] || 0;
        this.playedTriggers.clear();
      });
    });
  }

  private setActIndex(index: number) {
    if (this.currentActIndex === index) return;
    this.currentActIndex = index;

    if (!this.overlayEl) return;
    this.overlayEl.querySelectorAll('.act-step').forEach((stepEl) => {
      const act = parseInt(stepEl.getAttribute('data-act') || '0', 10);
      if (act === index) stepEl.classList.add('active');
      else stepEl.classList.remove('active');
    });
  }

  private updateUIOverlay() {
    if (!this.overlayEl) return;

    // Timer text
    const curSec = Math.floor(this.currentTime);
    const totSec = Math.floor(this.totalDuration);
    const timerText = document.getElementById('cinematic-timer-text');
    if (timerText) {
      const m1 = Math.floor(curSec / 60);
      const s1 = curSec % 60;
      const m2 = Math.floor(totSec / 60);
      const s2 = totSec % 60;
      timerText.textContent = `${m1 < 10 ? '0' : ''}${m1}:${s1 < 10 ? '0' : ''}${s1} / ${m2 < 10 ? '0' : ''}${m2}:${s2 < 10 ? '0' : ''}${s2}`;
    }

    // Progress bar fill
    const progressFill = document.getElementById('cinematic-progress-fill');
    if (progressFill) {
      progressFill.style.width = `${(this.currentTime / this.totalDuration) * 100}%`;
    }

    // Subtitle content based on act
    const badgeEl = document.getElementById('cinematic-speaker-badge');
    const subTextEl = document.getElementById('cinematic-subtitle-text');

    const subtitles = [
      {
        badge: '👔 BYŁY KIEROWNIK WALCZAK',
        text: '“Tylko ja mogłem kierować tą fabryką! Cała dostawa Calacatta Gold zostaje zablokowana! Hahaha!”',
      },
      {
        badge: '👷‍♂️ MARCIN – KIEROWNIK LOGISTYKI',
        text: '“Gdzie jest podpis na dokumencie WZ?! Protokół reklamacji otwarty – zamykam tę aleję na własnych warunkach!”',
      },
      {
        badge: '🚜 GRZESIEK & 💪 DAWID',
        text: '“Grzesiek: 44 cm w bicepsie i Ścisk Zagłady! • Dawid: Gres 120x280 leci pod kątem 45° – Ja Wiem Najlepiej!”',
      },
      {
        badge: '🎮 MATEUSZ & 👨‍🔧 PIOTR',
        text: '“Mateusz: Laga mają! BSOD i platyna wpada na konto! • Piotr: 70 voltów bimbru zza regału B4! Ogień na gresie!”',
      },
      {
        badge: '🏆 BOHATEROWIE MAX-FLIZ',
        text: '“Dostawa zabezpieczona! Wybierz swojego magazyniera i rozpocznij zmianę w Max-Fliz Showdown 3D!”',
      },
    ];

    const currentSub = subtitles[this.currentActIndex] || subtitles[0];
    if (badgeEl) badgeEl.textContent = currentSub.badge;
    if (subTextEl) subTextEl.textContent = currentSub.text;
  }

  private removeUIOverlay() {
    if (this.overlayEl && this.overlayEl.parentElement) {
      this.overlayEl.parentElement.removeChild(this.overlayEl);
      this.overlayEl = null;
    }
  }
}
