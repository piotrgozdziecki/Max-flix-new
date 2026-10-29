import * as THREE from 'three';
import { CHARACTERS } from './characters.ts';
import { sound } from './sound.ts';
import {
  ActivePerks,
  AVAILABLE_PERKS,
  CharacterDef,
  CharacterId,
  CollectibleItem,
  DroppedPerkItem,
  EnemyItem,
  GameState,
  HazardItem,
  PerkType,
  PlatformBlock,
} from './types.ts';
import {
  createArchitectEnemyModel,
  createAgvRobotModel,
  createAisleArrow,
  createBathtubModel,
  createBimberBottleMolotov,
  createMolotovFirePuddle,
  createCarraraCollectible,
  createCharacterModel,
  createCustomerEnemyModel,
  createDeliveryVan,
  createDroppedPerkCrate,
  createEliteGuardEnemyModel,
  createEspressoCollectible,
  createFinishGate,
  createForkliftModel,
  createGoldenCutterCollectible,
  createGoldenThroneEasterEgg,
  createGroutCollectible,
  createHandlowiecEnemyModel,
  createHighBayCatwalk,
  createHighBayLamp,
  createIndustrialSteamVent,
  createInspectorEnemyModel,
  createMagnetCollectible,
  createMonterEnemyModel,
  createNeonShowroomSign,
  createPenaltyNoticeProjectile,
  createPiorunDronModel,
  createSecretFolderEasterEgg,
  createTilePallet,
  createVintageCoffeeCornerEasterEgg,
  createVolumetricLightBeam,
  createWalczakBossModel,
  createWarehouseRack,
  createKurierEnemyModel,
  createItalianVendorEnemyModel,
  createSztaplarEnemyModel,
  createSprayGraffitiDecal,
  createCrimeSceneBodyOutlineDecal,
  createKrolLetoBossModel,
  createDisplayPodium,
  createGlassPartition,
  createShowroomPlant,
  createTrackSpotlights,
  getFloorTexture,
  getShowroomMarbleFloorTexture,
  getShowroomWallTexture,
  getTerminalGraniteFloorTexture,
  getHazardStripeTexture,
  getMaxFlizLogoTexture,
  getWallTexture,
} from './warehouseAssets.ts';

export interface GameCallbacks {
  onScoreUpdate: (score: number, collectedVip: number, totalVip: number) => void;
  onHpUpdate: (hp: number, maxHp: number) => void;
  onAbilityCooldown: (progress: number, ready: boolean) => void;
  onSpeechBubble: (text: string) => void;
  onLevelComplete: (levelId: number, score: number, timeStr: string) => void;
  onGameOver: (reason: string) => void;
  onBossUpdate?: (name: string, hp: number, maxHp: number, visible: boolean, phase?: number) => void;
  onPerksUpdate?: (perks: ActivePerks) => void;
  onFloatingText?: (text: string, x: number, y: number, z: number, type?: 'points' | 'vip' | 'easter-egg' | 'damage' | 'perk' | 'combo' | 'enemy_shout', metadata?: any) => void;
  onPerkDropBanner?: (name: string, icon: string, desc: string, color: string) => void;
}

export class MaxFlizGameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public container: HTMLElement;
  public threeRenderer: THREE.WebGLRenderer | null = null;


  private state: GameState = 'title';
  private currentCharacterId: CharacterId = 'marcin';
  private charDef: CharacterDef;

  // Player state
  private playerPos = new THREE.Vector3(0, 1, 0);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerRot = 0;
  private isGrounded = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private hp = 3;
  private maxHp = 3;
  private score = 0;
  private comboStreak = 0;
  private comboTimer = 0;
  private collectedVipCount = 0;
  private totalVipCount = 0;
  private invulnerableTimer = 0;
  private abilityTimer = 0;
  private abilityActiveDuration = 0;
  private attackCooldownTimer = 0;
  private attackSwingTimer = 0;
  private walkCycle = 0;
  private speechBubbleTimer = 0;
  private levelStartTime = 0;
  private cameraShake = 0;
  private screenShakeDuration = 0;
  private screenShakeIntensity = 0;
  private screenShakeTimer = 0;
  private cameraMode: 'iso' | 'close' = 'iso';
  private camZoomFactor = 1.0;
  private minimapZoomScale = 3.5;
  private minimapVisible = true;
  private minimapFrameCounter = 0;
  private finishGatePos = new THREE.Vector3(30, 0, 0);
  private smoothCamY = 0.5;
  private currentCamOffset = new THREE.Vector3(9.0, 16.0, 15.0);
  private currentLookAt = new THREE.Vector3(0, 1.2, 0);
  private bossCamZoom = 1.0;
  private finishWarningTimer = 0;
  private dodgeCooldownTimer = 0;
  private hitStopTimer = 0;
  private targetRing!: THREE.Mesh;
  private bloomPulseTimer = 0;
  private levelBounds = { minX: -35, maxX: 35, minZ: -15, maxZ: 15 };

  public triggerBloomPulse(durationSec = 0.3) {
    this.bloomPulseTimer = durationSec;
  }

  public zoomInCamera() {
    this.camZoomFactor = Math.max(0.4, this.camZoomFactor - 0.15);
  }

  public zoomOutCamera() {
    this.camZoomFactor = Math.min(2.8, this.camZoomFactor + 0.15);
  }

  public toggleCameraMode(): 'iso' | 'close' {
    this.cameraMode = this.cameraMode === 'iso' ? 'close' : 'iso';
    return this.cameraMode;
  }

  public zoomInMinimap() {
    this.minimapZoomScale = Math.min(7.5, this.minimapZoomScale + 0.8);
  }

  public zoomOutMinimap() {
    this.minimapZoomScale = Math.max(1.8, this.minimapZoomScale - 0.8);
  }

  public toggleMinimap() {
    this.minimapVisible = !this.minimapVisible;
    const elem = document.getElementById('minimap-container');
    if (elem) {
      if (this.minimapVisible) elem.classList.remove('collapsed');
      else elem.classList.add('collapsed');
    }
  }

  public setLevelVisible(visible: boolean) {
    this.levelRoot.visible = visible;
    if (this.targetRing) this.targetRing.visible = visible;
  }

  public triggerScreenShake(intensity: number, durationSec: number = 0.5) {
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    this.screenShakeDuration = durationSec;
    this.screenShakeTimer = durationSec;
    this.cameraShake = Math.max(this.cameraShake, intensity * 0.6);
  }

  public triggerHitStop(durationSec = 0.04) {
    this.hitStopTimer = Math.max(this.hitStopTimer, durationSec);
  }
  private marcinReclamationTimer = 0;
  private grzesiekCrushTimer = 0;
  private grzesiekCrushPulse = 0;
  private mateuszPassiveCount = 0;
  private mateuszLagTimer = 0;

  // Active Perks & Jump Modifiers
  private activePerks: ActivePerks = {
    doubleJump: 0,
    shield: false,
    magnet: 0,
    speedBoost: 0,
  };
  private hasDoubleJumped = false;

  // 3D Player Meshes
  private playerGroup: THREE.Group | null = null;
  private leftLeg: THREE.Mesh | null = null;
  private rightLeg: THREE.Mesh | null = null;
  private leftArm: THREE.Mesh | null = null;
  private rightArm: THREE.Mesh | null = null;
  private playerHead: THREE.Mesh | null = null;
  private playerBody: THREE.Mesh | null = null;

  // Level geometry & entities
  private currentLevelId = 1;
  private levelRoot = new THREE.Group();
  private platforms: PlatformBlock[] = [];
  private collectibles: CollectibleItem[] = [];
  private droppedPerks: DroppedPerkItem[] = [];
  private hazards: HazardItem[] = [];
  private enemies: EnemyItem[] = [];
  private enemyProjectiles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; isDyscyplinarka?: boolean }[] = [];
  private particles: {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];
  private projectiles: {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
  }[] = [];
  private specialEffects: {
    mesh: THREE.Mesh | THREE.Group;
    life: number;
    maxLife: number;
    grow: number;
    spin: number;
    update?: (dt: number, progress: number) => void;
  }[] = [];
  private bimberMolotovs: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    spin: THREE.Vector3;
    life: number;
    flameLight?: THREE.PointLight;
    flameMesh?: THREE.Mesh;
  }[] = [];
  private bimberFirePuddles: {
    group: THREE.Group;
    x: number;
    y: number;
    z: number;
    radius: number;
    duration: number;
    maxDuration: number;
    tickTimer: number;
    flames: THREE.Mesh[];
    light: THREE.PointLight;
  }[] = [];

  // Input state
  private keys: Record<string, boolean> = {};
  private virtualJoystick = { x: 0, y: 0 };
  private callbacks: GameCallbacks;

  // Lighting
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private rimLight!: THREE.DirectionalLight;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, container: HTMLElement, callbacks: GameCallbacks) {
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    this.callbacks = callbacks;
    this.charDef = CHARACTERS[this.currentCharacterId];

    this.camera.far = 160;
    this.scene.background = new THREE.Color(0x07131d);
    this.scene.add(this.levelRoot);

    this.targetRing = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.75, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    this.targetRing.rotation.x = -Math.PI / 2;
    this.scene.add(this.targetRing);

    this.setupLighting();
    this.setupInput();
    // loadLevel(1) removed from constructor to prevent blocking main thread on boot
  }

  private setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xcfe8ff, 0.7);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xbfe6ff, 0x101827, 1.45);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff4d6, 3.6);
    this.dirLight.position.set(18, 28, 16);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 80;
    const d = 22;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    this.rimLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    this.rimLight.position.set(-18, 10, -16);
    this.scene.add(this.rimLight);

    this.scene.fog = new THREE.Fog(0x091827, 18, 90);
  }

  private setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        this.jumpBufferTimer = 0.16;
        e.preventDefault();
      }
      if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.triggerAbility();
      }
      if (e.code === 'KeyF' || e.code === 'KeyJ' || e.code === 'KeyX' || e.code === 'Numpad0') {
        this.triggerAttack();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
      }
      if (e.code === 'KeyC' || e.code === 'KeyV') {
        this.toggleCameraMode();
      }
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        this.zoomInCamera();
      }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        this.zoomOutCamera();
      }
      if (e.code === 'KeyN') {
        this.toggleMinimap();
      }
    });

    this.container?.addEventListener('wheel', (e: WheelEvent) => {
      if (this.state === 'playing') {
        e.preventDefault();
        if (e.deltaY > 0) {
          this.zoomOutCamera();
        } else {
          this.zoomInCamera();
        }
      }
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        if (this.playerVel.y > 2.0) {
          this.playerVel.y *= 0.52;
        }
      }
    });

    const canvasContainer = document.getElementById('game-canvas-container');
    canvasContainer?.addEventListener('pointerdown', (e) => {
      if (this.state === 'playing' && e.button === 0) {
        const target = e.target as HTMLElement | null;
        if (target && (target.closest('.hud-layer') || target.closest('.touch-layer') || target.closest('.game-modal') || target.closest('.game-screen'))) {
          return;
        }
        this.triggerAttack();
      }
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.virtualJoystick = { x: 0, y: 0 };
    });
  }

  public setVirtualInput(x: number, y: number) {
    this.virtualJoystick.x = x;
    this.virtualJoystick.y = y;
  }

  public selectCharacter(id: CharacterId) {
    this.currentCharacterId = id;
    this.charDef = CHARACTERS[id];
    this.rebuildPlayerMesh();
    this.sayRandomVoiceLine();
  }

  public getCharacterDef(): CharacterDef {
    return this.charDef;
  }

  public getCameraMode(): 'iso' | 'close' {
    return this.cameraMode;
  }

  public isPaused(): boolean {
    return this.state === 'paused';
  }

  public setCamera(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public setScene(scene: THREE.Scene) {
    this.scene = scene;
    if (!this.scene.children.includes(this.levelRoot)) {
      this.scene.add(this.levelRoot);
    }
  }

  private rebuildPlayerMesh() {
    if (this.playerGroup) {
      this.levelRoot.remove(this.playerGroup);
    }
    const built = createCharacterModel(this.charDef);
    this.playerGroup = built.group;
    this.leftLeg = built.leftLeg;
    this.rightLeg = built.rightLeg;
    this.leftArm = built.leftArm;
    this.rightArm = built.rightArm;
    this.playerHead = built.head;
    this.playerBody = built.body;
    this.playerGroup.position.copy(this.playerPos);
    this.levelRoot.add(this.playerGroup);
  }

  public startTitle() {
    this.state = 'title';
    this.hp = this.maxHp;
    this.score = 0;
    this.collectedVipCount = 0;
    this.abilityTimer = 0;
    this.activePerks = {
      doubleJump: 0,
      shield: false,
      magnet: 0,
      speedBoost: 0,
    };
    this.marcinReclamationTimer = 0;
    this.grzesiekCrushTimer = 0;
    this.grzesiekCrushPulse = 0;
    this.callbacks.onPerksUpdate?.(this.activePerks);
    this.callbacks.onSpeechBubble('');
    this.rebuildPlayerMesh();
    this.playerPos.set(0, 0.5, 0);
    this.callbacks.onBossUpdate?.('', 0, 0, false);
    this.setLevelVisible(true);
    
    // Build initial level for title visual if not already built
    if (this.levelRoot.children.length === 0) {
      this.loadLevel(1);
    }
  }

  public startGame(levelId = 1) {
    this.state = 'playing';
    this.hp = this.maxHp;
    this.score = 0;
    this.comboStreak = 0;
    this.collectedVipCount = 0;
    this.abilityTimer = 0;
    this.levelStartTime = performance.now();
    this.marcinReclamationTimer = 0;
    this.grzesiekCrushTimer = 0;
    this.grzesiekCrushPulse = 0;
    this.activePerks = {
      doubleJump: 0,
      shield: false,
      magnet: 0,
      speedBoost: 0,
    };
    this.cameraMode = 'close';
    this.callbacks.onPerksUpdate?.(this.activePerks);
    this.callbacks.onSpeechBubble('');
    this.loadLevel(levelId);
    this.callbacks.onHpUpdate(this.hp, this.maxHp);
    this.callbacks.onScoreUpdate(this.score, this.collectedVipCount, this.totalVipCount);
    this.sayRandomVoiceLine();
  }

  public togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  private clearLevel() {
    while (this.levelRoot.children.length > 0) {
      this.levelRoot.remove(this.levelRoot.children[0]);
    }
    this.platforms = [];
    this.collectibles = [];
    this.droppedPerks = [];
    this.hazards = [];
    this.enemies = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.projectiles = [];
    this.specialEffects = [];
    this.bimberMolotovs = [];
    this.bimberFirePuddles = [];
    this.totalVipCount = 0;
    this.collectedVipCount = 0;
    this.marcinReclamationTimer = 0;
    this.grzesiekCrushTimer = 0;
    this.grzesiekCrushPulse = 0;
  }

  public loadLevel(levelId: number) {
    this.currentLevelId = levelId;
    this.clearLevel();
    this.rebuildPlayerMesh();

    if (levelId === 1) {
      // Sektor 1: Industrial Warehouse B4
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xcfe8ff);
        this.ambientLight.intensity = 0.75;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0xbfe6ff);
        this.hemiLight.groundColor.setHex(0x101827);
        this.hemiLight.intensity = 1.45;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfff4d6);
        this.dirLight.intensity = 3.6;
      }
      if (this.rimLight) {
        this.rimLight.color.setHex(0x60a5fa);
        this.rimLight.intensity = 1.2;
      }
      this.scene.background = new THREE.Color(0x07131d);
      this.levelBounds = { minX: -36, maxX: 36, minZ: -14, maxZ: 14 };
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(0x091827);
        this.scene.fog.near = 18;
        this.scene.fog.far = 90;
      }
      this.buildLevel1();
    } else if (levelId === 2) {
      // Sektor 2: Prestigious Calacatta Gold Showroom - Bright & Warm Luxury
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xfff5ea);
        this.ambientLight.intensity = 1.25;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0xffeedd);
        this.hemiLight.groundColor.setHex(0x3a2e22);
        this.hemiLight.intensity = 1.7;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfffaec);
        this.dirLight.intensity = 4.2;
      }
      if (this.rimLight) {
        this.rimLight.color.setHex(0xfbbf24);
        this.rimLight.intensity = 1.4;
      }
      this.scene.background = new THREE.Color(0x1b1928);
      this.levelBounds = { minX: -42, maxX: 42, minZ: -15, maxZ: 15 };
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(0x221e30);
        this.scene.fog.near = 28;
        this.scene.fog.far = 115;
      }
      this.buildLevel2();
    } else {
      // Sektor 3: Baza Przeładunkowa & Terminal - Flamed Granite & Illuminated AGV Guidance
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xdbeafe);
        this.ambientLight.intensity = 0.85;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0x93c5fd);
        this.hemiLight.groundColor.setHex(0x0c1322);
        this.hemiLight.intensity = 1.5;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xffedd5);
        this.dirLight.intensity = 3.8;
      }
      if (this.rimLight) {
        this.rimLight.color.setHex(0x38bdf8);
        this.rimLight.intensity = 1.5;
      }
      this.scene.background = new THREE.Color(0x080e18);
      this.levelBounds = { minX: -50, maxX: 50, minZ: -18, maxZ: 18 };
      if (this.scene.fog instanceof THREE.Fog) {
        this.scene.fog.color.setHex(0x091220);
        this.scene.fog.near = 20;
        this.scene.fog.far = 95;
      }
      this.buildLevel3();
    }

    this.smoothCamY = this.playerPos.y;
    this.currentLookAt.set(this.playerPos.x, this.playerPos.y + 0.85, this.playerPos.z);
    this.finishWarningTimer = 0;

    this.callbacks.onScoreUpdate(this.score, this.collectedVipCount, this.totalVipCount);
  }

  private addGroutItem(id: string, x: number, y: number, z: number, points = 50) {
    const mesh = createGroutCollectible();
    mesh.position.set(x, y, z);
    this.levelRoot.add(mesh);
    this.collectibles.push({
      id,
      type: 'grout',
      name: 'Puszka Fugi Max-Fliz',
      x,
      y,
      z,
      mesh,
      collected: false,
      points,
    });
  }

  private addVipItem(id: string, x: number, y: number, z: number, name: string, points = 300) {
    const mesh = createCarraraCollectible();
    mesh.position.set(x, y, z);
    this.levelRoot.add(mesh);
    this.totalVipCount++;
    this.collectibles.push({
      id,
      type: 'vip_item',
      name,
      x,
      y,
      z,
      mesh,
      collected: false,
      points,
    });
  }

  private addEspressoItem(id: string, x: number, y: number, z: number) {
    const mesh = createEspressoCollectible();
    mesh.position.set(x, y, z);
    this.levelRoot.add(mesh);
    this.collectibles.push({
      id,
      type: 'espresso',
      name: 'Espresso z Showroomu (+Prędkość)',
      x,
      y,
      z,
      mesh,
      collected: false,
      points: 100,
    });
  }

  private addMagnetItem(id: string, x: number, y: number, z: number) {
    const mesh = createMagnetCollectible();
    mesh.position.set(x, y, z);
    this.levelRoot.add(mesh);
    this.collectibles.push({
      id,
      type: 'magnet',
      name: 'Skaner Radiowy (+Magnes)',
      x,
      y,
      z,
      mesh,
      collected: false,
      points: 120,
    });
  }

  private addGoldenCutterItem(id: string, x: number, y: number, z: number) {
    const mesh = createGoldenCutterCollectible();
    mesh.position.set(x, y, z);
    this.levelRoot.add(mesh);
    this.collectibles.push({
      id,
      type: 'golden_cutter',
      name: 'Złota Gilotyna do Gresu (+Podwójny Skok)',
      x,
      y,
      z,
      mesh,
      collected: false,
      points: 150,
    });
  }

  private addEasterEgg(id: string, x: number, y: number, z: number, name: string, eggType: 'throne' | 'coffee' | 'folder', points = 500) {
    let group: THREE.Group;
    if (eggType === 'throne') {
      group = createGoldenThroneEasterEgg();
    } else if (eggType === 'coffee') {
      group = createVintageCoffeeCornerEasterEgg();
    } else {
      group = createSecretFolderEasterEgg();
    }
    group.position.set(x, y, z);
    this.levelRoot.add(group);

    this.collectibles.push({
      id,
      type: 'easter_egg',
      name,
      x,
      y,
      z,
      mesh: group,
      collected: false,
      points,
    });
  }

  private addForkliftHazard(id: string, startX: number, endX: number, z: number, speed: number, color = 0xf59e0b) {
    const built = createForkliftModel(color);
    built.group.position.set(startX, 0, z);
    this.levelRoot.add(built.group);
    this.hazards.push({
      id,
      type: 'forklift',
      mesh: built.group,
      startX,
      startZ: z,
      endX,
      endZ: z,
      x: startX,
      y: 0,
      z,
      speed,
      width: 1.8,
      length: 2.8,
      dir: 1,
      active: true,
    });
  }

  private addCustomerEnemy(id: string, x: number, minX: number, maxX: number, name: string) {
    const built = createCustomerEnemyModel();
    built.group.position.set(x, 0.4, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'customer',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.4,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 1.8,
      dir: 1,
      hp: 2,
      maxHp: 2,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
    });
  }

  private addArchitectEnemy(id: string, x: number, maxX: number, z: number, name: string) {
    const built = createArchitectEnemyModel();
    built.group.position.set(x, 0.4, z);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'architect',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.4,
      z,
      startX: x,
      endX: maxX,
      speed: 2.2,
      dir: 1,
      hp: 3,
      maxHp: 3,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
    });
  }

  private addAgvRobotEnemy(id: string, minX: number, maxX: number, z: number, name: string) {
    const built = createAgvRobotModel();
    built.group.position.set(minX, 0.2, z);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'agv_robot',
      name,
      mesh: built.group,
      x: minX,
      y: 0.2,
      z,
      startX: minX,
      endX: maxX,
      speed: 2.6,
      dir: 1,
      hp: 2,
      maxHp: 2,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
    });
  }

  private addWalczakBossEnemy(id: string, x: number, z: number) {
    const built = createWalczakBossModel();
    built.group.position.set(x, 0.6, z);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'walczak',
      name: 'Były Kierownik Walczak',
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.6,
      z,
      startX: x - 14,
      endX: x + 14,
      speed: 3.2,
      dir: -1,
      hp: 10,
      maxHp: 10,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
      specialActionTimer: 2.5,
      bossPhase: 1,
    });
    this.callbacks.onBossUpdate?.('Były Kierownik Walczak', 10, 10, true);
  }

  private addKrolLetoBossEnemy(id: string, x: number, z: number) {
    const built = createKrolLetoBossModel();
    built.group.position.set(x, 0.6, z);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'krol_leto',
      name: 'Król-Leto (Dyrektor Generalny)',
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.6,
      z,
      startX: x - 12,
      endX: x + 12,
      speed: 3.8,
      dir: -1,
      hp: 12,
      maxHp: 12,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
      specialActionTimer: 2.2,
      bossPhase: 1,
    });
    this.callbacks.onBossUpdate?.('Król-Leto (Dyrektor Generalny)', 12, 12, true);
  }

  private addInspectorEnemy(id: string, x: number, minX: number, maxX: number, name: string) {
    const built = createInspectorEnemyModel();
    built.group.position.set(x, 0.4, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'inspector',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.4,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 2.0,
      dir: 1,
      hp: 3,
      maxHp: 3,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
      specialActionTimer: 2.5,
    });
  }

  private addHandlowiecEnemy(id: string, x: number, minX: number, maxX: number, name: string) {
    const built = createHandlowiecEnemyModel();
    built.group.position.set(x, 0.4, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'handlowiec',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.4,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 2.8,
      dir: 1,
      hp: 3,
      maxHp: 3,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
      specialActionTimer: 3.0,
    });
  }

  private addMonterEnemy(id: string, x: number, minX: number, maxX: number, name: string) {
    const built = createMonterEnemyModel();
    built.group.position.set(x, 0.4, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'monter',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.4,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 2.2,
      dir: 1,
      hp: 4,
      maxHp: 4,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
      specialActionTimer: 2.8,
    });
  }

  private addPiorunDronEnemy(id: string, startX: number, endX: number, z: number, y = 1.9, name = 'Piorun Dron Magazynowy AI') {
    const built = createPiorunDronModel();
    built.group.position.set(startX, y, z);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'piorun_dron',
      name,
      mesh: built.group,
      x: startX,
      y,
      z,
      startX,
      endX,
      speed: 3.5,
      dir: 1,
      hp: 2,
      maxHp: 2,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.rotors[0],
      legR: built.rotors[1],
      armL: built.rotors[2],
      armR: built.rotors[3],
    });
  }

  private addEliteGuardEnemy(id: string, x: number, minX: number, maxX: number, name: string) {
    const built = createEliteGuardEnemyModel();
    built.group.position.set(x, 0.5, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'elite_walczak_guard',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.5,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 2.4,
      dir: 1,
      hp: 5,
      maxHp: 5,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
      shieldActive: true,
    });
  }

  private addKurierEnemy(id: string, x: number, minX: number, maxX: number, name = 'Rudy z DPD od Johnny Walker') {
    const built = createKurierEnemyModel();
    built.group.position.set(x, 0.4, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'kurier',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.4,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 4.5,
      dir: 1,
      hp: 2,
      maxHp: 2,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
    });
  }

  private addItalianVendorEnemy(id: string, x: number, minX: number, maxX: number, name = 'Włoski Dostawca Armatury z Mediolanu') {
    const built = createItalianVendorEnemyModel();
    built.group.position.set(x, 0.4, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'przedstawiciel_włoski',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.4,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 2.6,
      dir: 1,
      hp: 3,
      maxHp: 3,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
      specialActionTimer: 2.5,
    });
  }

  private addSztaplarEnemy(id: string, x: number, minX: number, maxX: number, name = 'Szalony Operator Paleciaka B4') {
    const built = createSztaplarEnemyModel();
    built.group.position.set(x, 0.5, minX);
    this.levelRoot.add(built.group);
    this.enemies.push({
      id,
      type: 'sztaplar_szalony',
      name,
      mesh: built.group,
      speechMesh: null,
      x,
      y: 0.5,
      z: minX,
      startX: minX,
      endX: maxX,
      speed: 3.5,
      dir: 1,
      hp: 4,
      maxHp: 4,
      state: 'patrol',
      stunTimer: 0,
      shoutTimer: 0,
      shoutText: '',
      attackCooldown: 0,
      walkCycle: 0,
      legL: built.legL,
      legR: built.legR,
      armL: built.armL,
      armR: built.armR,
    });
  }

  public spawnDroppedPerk(x: number, y: number, z: number, forcedPerkId?: PerkType) {
    const perkDef = forcedPerkId
      ? AVAILABLE_PERKS.find((p) => p.id === forcedPerkId)!
      : AVAILABLE_PERKS[Math.floor(Math.random() * AVAILABLE_PERKS.length)];

    const id = `drop_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const mesh = createDroppedPerkCrate(perkDef.id, perkDef.color);
    mesh.position.set(x, y + 0.1, z);
    this.levelRoot.add(mesh);

    const dropped: DroppedPerkItem = {
      id,
      perkId: perkDef.id,
      name: perkDef.name,
      icon: perkDef.icon,
      color: perkDef.color,
      x,
      y: y + 0.1,
      z,
      initialY: y + 0.1,
      mesh,
      collected: false,
      life: 55, // 55 seconds to collect
      duration: perkDef.duration || 20,
    };

    this.droppedPerks.push(dropped);
    this.spawnParticleRing(x, y + 0.6, z, perkDef.color);
    this.emitFloatingToast(`📦 ZRZUT: ${perkDef.name}!`, x, y + 1.2, z, 'perk');
    sound.playPickup(1);
  }

  private updateDroppedPerks(dt: number) {
    const time = performance.now() * 0.003;

    for (let i = this.droppedPerks.length - 1; i >= 0; i--) {
      const perk = this.droppedPerks[i];
      if (perk.collected || !perk.mesh) continue;

      perk.life -= dt;
      if (perk.life <= 0) {
        this.levelRoot.remove(perk.mesh);
        this.droppedPerks.splice(i, 1);
        continue;
      }

      // Floating bob and spin
      perk.mesh.rotation.y += dt * 2.2;
      perk.mesh.position.y = perk.initialY + Math.sin(time + i * 1.5) * 0.18;

      // Magnetic pull to player
      const dist = Math.hypot(perk.x - this.playerPos.x, perk.z - this.playerPos.z);
      const dy = Math.abs(perk.y - (this.playerPos.y + 0.5));

      const magnetActive = this.activePerks.magnet > 0 || this.charDef.id === 'marcin';
      const magnetRadius = magnetActive ? 9.5 : 2.5;

      if (dist < magnetRadius) {
        const pullSpeed = (magnetActive ? 10.5 : 4.5) * dt;
        perk.x += ((this.playerPos.x - perk.x) / Math.max(0.1, dist)) * pullSpeed;
        perk.z += ((this.playerPos.z - perk.z) / Math.max(0.1, dist)) * pullSpeed;
        perk.y += ((this.playerPos.y + 0.6 - perk.y) / Math.max(0.1, dist)) * pullSpeed;
        perk.mesh.position.set(perk.x, perk.y, perk.z);
      }

      // Collect condition
      if (dist < 1.15 && dy < 1.4) {
        perk.collected = true;
        this.levelRoot.remove(perk.mesh);
        this.droppedPerks.splice(i, 1);

        this.activatePerk(perk.perkId, perk.duration);
        sound.playPickup(3);
        this.spawnParticleRing(perk.x, perk.y + 0.6, perk.z, perk.color);
        this.score += 250;
        this.emitFloatingToast(`⚡ ODBIÓR: ${perk.name}!`, perk.x, perk.y + 1.2, perk.z, 'perk');

        const def = AVAILABLE_PERKS.find((p) => p.id === perk.perkId);
        const hexColor = `#${perk.color.toString(16).padStart(6, '0')}`;
        this.callbacks.onPerkDropBanner?.(perk.name, perk.icon, def?.description || 'Aktywowano ulepszenie!', hexColor);
        this.callbacks.onScoreUpdate(this.score, this.collectedVipCount, this.totalVipCount);
      }
    }
  }

  private emitFloatingToast(
    text: string,
    worldX: number,
    worldY: number,
    worldZ: number,
    type: 'points' | 'vip' | 'easter-egg' | 'damage' | 'perk' | 'combo' | 'enemy_shout' = 'points',
    metadata?: any
  ) {
    this.callbacks.onFloatingText?.(text, worldX, worldY, worldZ, type, metadata);
  }


  private buildLevel1() {
    // 1. Expanded Warehouse Floor (72x26)
    const floorGeo = new THREE.PlaneGeometry(72, 26);
    const floorMat = new THREE.MeshStandardMaterial({
      map: getFloorTexture(),
      roughness: 0.28,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.levelRoot.add(floor);
    this.platforms.push({ x: 0, y: 0, z: 0, width: 72, height: 0.2, depth: 26, type: 'floor' });

    // Back Wall with industrial corrugated siding
    const wallGeo = new THREE.BoxGeometry(72, 9.0, 0.4);
    const wallMat = new THREE.MeshStandardMaterial({ map: getWallTexture(), roughness: 0.7 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 4.5, -13);
    this.levelRoot.add(backWall);

    // Glowing Neon Showroom & Logistics Overhead Banner
    const neonSign = createNeonShowroomSign('MAX-FLIZ • SEKTOR LOGISTYKI B4', '#38bdf8');
    neonSign.position.set(0, 6.2, -12.75);
    this.levelRoot.add(neonSign);

    // Volumetric Overhead High-Bay Lamps & Light Beams
    [-28, -14, 0, 14, 28].forEach((lx) => {
      const lamp = createHighBayLamp();
      lamp.position.set(lx, 7.2, 0);
      const beam = createVolumetricLightBeam();
      beam.position.set(lx, 7.2, 0);
      this.levelRoot.add(lamp, beam);
    });

    // Floor Pedestrian & Navigation Safety Arrows
    [-24, -16, -8, 0, 8, 16, 24].forEach((ax) => {
      const arrow = createAisleArrow(1.5);
      arrow.position.set(ax, 0.015, -2.0);
      this.levelRoot.add(arrow);
    });

    // Steam vents along the back wall
    [-22, 5, 22].forEach((vx) => {
      const vent = createIndustrialSteamVent();
      vent.position.set(vx, 0, -12.2);
      this.levelRoot.add(vent);
    });

    // Spawn Point
    this.playerPos.set(-32, 0.5, 0);
    this.playerVel.set(0, 0, 0);

    // Multi-tier Pallet Platforms
    const palletPositions = [
      { x: -30, z: -2.5, tier: 1 },
      { x: -26, z: 2.5, tier: 2 },
      { x: -22, z: -2.5, tier: 1 },
      { x: -18, z: 2.5, tier: 2 },
      { x: -14, z: -2.2, tier: 1 },
      { x: -10, z: 2.5, tier: 2 },
      { x: -6, z: -2.5, tier: 1 },
      { x: -2, z: 2.2, tier: 2 },
      { x: 2, z: -2.5, tier: 1 },
      { x: 6, z: 2.5, tier: 2 },
      { x: 10, z: -2.2, tier: 1 },
      { x: 14, z: 2.5, tier: 2 },
      { x: 18, z: -2.5, tier: 1 },
      { x: 22, z: 2.2, tier: 2 },
      { x: 26, z: -2.5, tier: 1 },
    ];
    palletPositions.forEach((p, idx) => {
      const pallet = createTilePallet(p.tier);
      pallet.position.set(p.x, 0, p.z);
      this.levelRoot.add(pallet);
      const h = p.tier === 1 ? 0.6 : 0.95;
      this.platforms.push({ x: p.x, y: h / 2, z: p.z, width: 1.25, height: h, depth: 1.05, type: 'pallet' });
      this.addGroutItem(`grout_l1_${idx}`, p.x, h + 0.35, p.z, 50);
    });

    // High Warehouse Racks
    const rack1 = createWarehouseRack(6.0, 4.2, 1.5);
    rack1.position.set(-18, 0, -8.0);
    const rack2 = createWarehouseRack(6.0, 4.2, 1.5);
    rack2.position.set(0, 0, -8.0);
    const rack3 = createWarehouseRack(6.0, 4.2, 1.5);
    rack3.position.set(18, 0, -8.0);
    const rack4 = createWarehouseRack(6.0, 4.2, 1.5);
    rack4.position.set(-10, 0, 8.0);
    const rack5 = createWarehouseRack(6.0, 4.2, 1.5);
    rack5.position.set(10, 0, 8.0);
    this.levelRoot.add(rack1, rack2, rack3, rack4, rack5);

    this.platforms.push({ x: -18, y: 1.4, z: -8.0, width: 6.0, height: 0.15, depth: 1.5, type: 'shelf' });
    this.platforms.push({ x: 0, y: 1.4, z: -8.0, width: 6.0, height: 0.15, depth: 1.5, type: 'shelf' });
    this.platforms.push({ x: 18, y: 1.4, z: -8.0, width: 6.0, height: 0.15, depth: 1.5, type: 'shelf' });
    this.platforms.push({ x: -10, y: 1.4, z: 8.0, width: 6.0, height: 0.15, depth: 1.5, type: 'shelf' });
    this.platforms.push({ x: 10, y: 1.4, z: 8.0, width: 6.0, height: 0.15, depth: 1.5, type: 'shelf' });

    // Elevated Steel Catwalk Connecting Racks at y=3.4
    const catwalk1 = createHighBayCatwalk(12.0, 1.6);
    catwalk1.position.set(-9, 3.4, -8.0);
    const catwalk2 = createHighBayCatwalk(12.0, 1.6);
    catwalk2.position.set(9, 3.4, -8.0);
    this.levelRoot.add(catwalk1, catwalk2);
    this.platforms.push({ x: -9, y: 3.4, z: -8.0, width: 12.0, height: 0.15, depth: 1.6, type: 'scaffold' });
    this.platforms.push({ x: 9, y: 3.4, z: -8.0, width: 12.0, height: 0.15, depth: 1.6, type: 'scaffold' });

    // VIP Collectibles
    this.addVipItem('vip_tile1', -18, 1.8, -8.0, 'Gres Hiszpański Calacatta Gold 120x60');
    this.addVipItem('vip_tile2', 0, 1.8, -8.0, 'Złota Mozaika Ceramiczna Max-Fliz');
    this.addVipItem('vip_tile3', 18, 1.8, -8.0, 'Klej do Wielkiego Formatu Pro Flex');
    this.addVipItem('vip_tile4', -9, 3.8, -8.0, 'Specyfikacja Projektowa dla Hotelu 5*');

    // Pre-placed World-Drop Perks on Elevated Platforms!
    this.spawnDroppedPerk(-9, 3.8, -8.0, 'vibram_boots');
    this.spawnDroppedPerk(9, 3.8, -8.0, 'hardhat');
    this.spawnDroppedPerk(-10, 1.8, 8.0, 'order_magnet');
    this.spawnDroppedPerk(14, 0.5, 3.5, 'espresso_boost');

    // Bonus Collectibles & Espresso
    this.addEspressoItem('esp_l1_1', -20, 0.4, 3.5);
    this.addEspressoItem('esp_l1_2', 8, 0.4, -3.5);
    this.addGoldenCutterItem('cutter_l1_1', 14, 1.8, -8.0);
    this.addMagnetItem('mag_l1_1', -6, 1.0, 2.5);

    // Easter Eggs
    this.addEasterEgg('egg_coffee_1', -24, 0.05, -8.5, 'Ukryty Kącik Kawowy Zdzicha', 'coffee', 400);
    this.addEasterEgg('egg_wz_1', 12, 1.85, 8.0, 'Zaginiona WZ-tka z 2012 Roku', 'folder', 450);

    // Forklift Hazard
    this.addForkliftHazard('forklift_1', -24, 20, 0, 4.4, 0xf59e0b);

    // Spray Graffiti & Crime Scene Chalk Outline Decals - PROMINENT FLOOR PLACEMENT
    // Arkadiusz - Clear floor placement in open aisle away from shelves
    const arkadiusz1 = createSprayGraffitiDecal();
    arkadiusz1.position.set(-14, 0.035, -3.5);
    arkadiusz1.rotation.x = -Math.PI / 2;
    arkadiusz1.scale.set(1.4, 1.4, 1);
    this.levelRoot.add(arkadiusz1);

    const crime1 = createCrimeSceneBodyOutlineDecal('RUDY ŚMIERDZIUCH');
    crime1.position.set(-26, 0.035, 8.5);
    crime1.rotation.y = Math.PI / 4;
    crime1.scale.setScalar(3.2); 
    this.levelRoot.add(crime1);

    // Expanded Dense Roster of Enemies on Level 1
    this.addCustomerEnemy('cust_1', -16, -6, 6, 'Klient z Reklamacją na Fugi');
    this.addCustomerEnemy('cust_2', 4, -6, 6, 'Pan Janusz (Gdzie moja faktura?!)');
    this.addCustomerEnemy('cust_3', -8, -6, 6, 'Awanturujący się Klient po Rabaty');
    this.addKurierEnemy('kurier_l1_1', -10, -6, 6, 'Rudy z DPD (Johnny Walker Express)');
    this.addItalianVendorEnemy('ital_l1_1', 8, -5, 5, 'Włoski Dostawca Armatury z Mediolanu');
    this.addSztaplarEnemy('sztaplar_l1_1', -2, -6, 6, 'Szalony Operator Paleciaka B4');
    this.addAgvRobotEnemy('agv_1', -4, 12, 2.8, 'Autonomiczny AGV ze zlewami');
    this.addAgvRobotEnemy('agv_2', 8, -12, -2.8, 'Szalony Sztaplar AGV B4');
    this.addHandlowiecEnemy('handl_1', -12, -5, 5, 'Handlowiec z Ofertą na Rabat 3%');
    this.addHandlowiecEnemy('handl_2', 12, -5, 5, 'Przedstawiciel z Próbkami Marmuru');
    this.addMonterEnemy('monter_1', 10, -6, 6, 'Monter z Młotkiem Gumowym');
    this.addInspectorEnemy('insp_1', -2, -5, 5, 'Inspektor BHP z Listą Zastrzeżeń');
    this.addPiorunDronEnemy('dron_1', -18, 16, 0, 2.2, 'Piorun Dron Skaner Kodów B4');

    // DYNAMIC ACCENT LIGHTING
    const l1 = new THREE.PointLight(0x38bdf8, 18, 25);
    l1.position.set(-18, 5, 8);
    this.levelRoot.add(l1);
    const l2 = new THREE.PointLight(0xf59e0b, 15, 22);
    l2.position.set(12, 4, -8);
    this.levelRoot.add(l2);
    this.addPiorunDronEnemy('dron_2', -10, 22, -4, 2.4, 'Dron Inspekcyjny Sektora B');

    // Finish Loading Gate & Delivery Van
    const finishGate = createFinishGate();
    finishGate.position.set(30, 0, 0);
    this.finishGatePos.set(30, 0, 0);
    this.levelRoot.add(finishGate);

    const van = createDeliveryVan();
    van.position.set(31.8, 0, 0);
    van.rotation.y = -Math.PI / 2;
    this.levelRoot.add(van);
    this.platforms.push({ x: 31.8, y: 0.8, z: 0, width: 3.5, height: 1.6, depth: 2.6, type: 'finish_truck' });
  }

  private buildLevel2() {
    // 1. Radiant Luxury Italian Calacatta Gold Marble Floor (80x28)
    const floorGeo = new THREE.PlaneGeometry(80, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      map: getShowroomMarbleFloorTexture(),
      roughness: 0.1,
      metalness: 0.12,
      color: 0xffffff,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.levelRoot.add(floor);
    this.platforms.push({ x: 0, y: 0, z: 0, width: 80, height: 0.2, depth: 28, type: 'floor' });

    // Architectural Natural Oak Slat Showroom Wall with LED Cove Lighting
    const wallGeo = new THREE.BoxGeometry(80, 9.5, 0.4);
    const wallMat = new THREE.MeshStandardMaterial({
      map: getShowroomWallTexture(),
      roughness: 0.35,
      metalness: 0.1,
      color: 0xffffff,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 4.75, -14);
    this.levelRoot.add(backWall);

    // Showroom Neon Sign
    const neonSign = createNeonShowroomSign('MAX-FLIZ SHOWROOM • STREFA WANNY & SPA', '#ec4899');
    neonSign.position.set(0, 6.8, -13.75);
    this.levelRoot.add(neonSign);

    // Ceiling Track Spotlights providing warm ambient downlight
    [-24, -8, 8, 24].forEach((tx) => {
      const track = createTrackSpotlights(8.0);
      track.position.set(tx, 7.2, 0);
      this.levelRoot.add(track);
    });

    // Architectural Glass Partitions dividing exhibition bays
    [-23, -13, -3, 7, 17].forEach((px) => {
      const glassNorth = createGlassPartition(2.8, 2.6);
      glassNorth.position.set(px, 0, -5.5);
      this.levelRoot.add(glassNorth);

      const glassSouth = createGlassPartition(2.8, 2.6);
      glassSouth.position.set(px, 0, 5.5);
      this.levelRoot.add(glassSouth);
    });

    // Sculptural Ceramic Planters with Lush Greenery (Monsteras / Ficuses)
    [-34, -26, -16, -6, 4, 14, 24, 32].forEach((px, idx) => {
      const plant = createShowroomPlant();
      plant.position.set(px, 0, idx % 2 === 0 ? -9.5 : 9.5);
      this.levelRoot.add(plant);
    });

    this.playerPos.set(-35, 0.5, 0);
    this.playerVel.set(0, 0, 0);

    // Super Bouncy Bathtubs placed on Luxury Marble Display Podiums with LED Cove Skirts
    const tubPositions = [
      { x: -28, z: -5 },
      { x: -18, z: 5 },
      { x: -8, z: -5 },
      { x: 2, z: 5 },
      { x: 12, z: -5 },
      { x: 22, z: 5 },
    ];
    tubPositions.forEach((tp, idx) => {
      // Luxury Display Podium
      const podium = createDisplayPodium(3.2, 2.0, 0.22);
      podium.position.set(tp.x, 0, tp.z);
      this.levelRoot.add(podium);

      const tub = createBathtubModel();
      tub.position.set(tp.x, 0.22, tp.z);
      this.levelRoot.add(tub);
      this.platforms.push({
        x: tp.x,
        y: 0.72,
        z: tp.z,
        width: 2.4,
        height: 1.0,
        depth: 1.4,
        type: 'bathtub',
        bounce: 17.5,
      });
      this.addGroutItem(`grout_l2_${idx}`, tp.x, 1.6, tp.z, 60);
    });

    // Elevated Luxury Catwalks & Onyx Podiums
    const catwalks = [
      { x: -28, y: 3.5, z: -5, w: 5.0, d: 2.6 },
      { x: -18, y: 3.5, z: 5, w: 5.0, d: 2.6 },
      { x: -8, y: 3.5, z: -5, w: 5.0, d: 2.6 },
      { x: 2, y: 3.5, z: 5, w: 5.0, d: 2.6 },
      { x: 12, y: 3.5, z: -5, w: 5.0, d: 2.6 },
      { x: 22, y: 3.5, z: 5, w: 5.0, d: 2.6 },
    ];
    catwalks.forEach((cw, idx) => {
      const cwGroup = createHighBayCatwalk(cw.w, cw.d);
      cwGroup.position.set(cw.x, cw.y, cw.z);
      this.levelRoot.add(cwGroup);
      this.platforms.push({ x: cw.x, y: cw.y, z: cw.z, width: cw.w, height: 0.2, depth: cw.d, type: 'shelf' });
      this.addGroutItem(`grout_cw_${idx}`, cw.x, cw.y + 0.4, cw.z, 80);
    });

    // VIP Showroom Items
    this.addVipItem('vip_bath1', -28, 3.9, -5, 'Złota Bateria Wolnostojąca Villeroy & Boch');
    this.addVipItem('vip_bath2', -8, 3.9, -5, 'Wanna Wolnostojąca z Hydromasażem Marmur Carrara');
    this.addVipItem('vip_bath3', 12, 3.9, -5, 'Umywalka Nablatowa z Naturalnego Onyksu');
    this.addVipItem('vip_bath4', 22, 3.9, 5, 'Kolekcja Armatury Złotej z Mediolanu');

    // Dropped Perks & Collectibles in World
    this.spawnDroppedPerk(-18, 3.9, 5, 'espresso_boost');
    this.spawnDroppedPerk(2, 3.9, 5, 'order_magnet');
    this.spawnDroppedPerk(22, 0.5, -6, 'hardhat');
    this.spawnDroppedPerk(-28, 3.9, -5, 'vibram_boots');

    this.addEspressoItem('esp_l2_1', -22, 0.4, -2.0);
    this.addEspressoItem('esp_l2_2', 18, 0.4, 2.0);
    this.addGoldenCutterItem('cutter_l2_1', -18, 3.9, 5);
    this.addMagnetItem('mag_l2_1', 12, 3.9, -5);

    // Easter Eggs
    this.addEasterEgg('egg_throne_1', 30, 0.05, -9, 'Złoty Tron Prezesa z 24k Złotem', 'throne', 600);
    this.addEasterEgg('egg_l2_coffee', -32, 0.05, 8.5, 'Tajemna Kawiarka Ciśnieniowa z Mediolanu (Zapas Espresso)', 'coffee', 500);
    this.addEasterEgg('egg_l2_wz', 6, 3.8, 5, 'Zagubiona Umowa z Włoską Fabryką Gresu na Wyłączność', 'folder', 550);

    // Decals - LARGE & VISIBLE ON FLOOR (y = 0.035 prevents z-fighting)
    const spray2 = createSprayGraffitiDecal();
    spray2.position.set(0, 0.035, -4.0);
    spray2.rotation.x = -Math.PI / 2;
    spray2.scale.setScalar(2.5);
    this.levelRoot.add(spray2);

    const crime2 = createCrimeSceneBodyOutlineDecal('RUDY ŚMIERDZIUCH');
    crime2.position.set(-28, 0.035, 9.0);
    crime2.scale.setScalar(3.0);
    this.levelRoot.add(crime2);

    // Dense Enemies in Showroom
    this.addCustomerEnemy('cust_l2_1', -22, -6, 6, 'Zdezorientowany Klient Szukający Syfonu');
    this.addCustomerEnemy('cust_l2_2', 10, -6, 6, 'Klient z Projektantką Wnętrz');
    this.addKurierEnemy('kurier_l2_1', -16, -6, 6, 'Rudy z DPD (Johnny Walker Express)');
    this.addItalianVendorEnemy('ital_l2_1', 2, -6, 6, 'Przedstawiciel Fabryki z Bolonii');
    this.addSztaplarEnemy('sztaplar_l2_1', 18, -6, 6, 'Kierowca Sztaplarki Showroomu');
    this.addArchitectEnemy('arch_l2_1', -12, -6, 6, 'Główny Projektant Wnętrz z Warszawy');
    this.addArchitectEnemy('arch_l2_2', 6, -6, 6, 'Krytyk Mieszanek Tynkarskich i Beżu');
    this.addArchitectEnemy('arch_l2_3', -20, -6, 6, 'Stylista Luksusowych Łazienek');
    this.addInspectorEnemy('insp_l2_1', -4, -6, 6, 'Inspektor BHP z PIP-u');
    this.addInspectorEnemy('insp_l2_2', 16, -6, 6, 'Kontroler Jakości Armatury');
    this.addHandlowiecEnemy('handl_l2_1', 14, -6, 6, 'Kierownik Sprzedaży Salonu');
    this.addMonterEnemy('monter_l2_1', -14, -6, 6, 'Hydraulik z Kluczem Nastawnym');
    this.addPiorunDronEnemy('dron_l2_1', -20, 20, 0, 2.4, 'Dron Multimedialny Showroomu');
    this.addPiorunDronEnemy('dron_l2_2', -15, 25, 4, 2.5, 'Skrzydlaty Skaner Ekspozycji');

    // LUXURY ACCENT LIGHTS
    const sl1 = new THREE.PointLight(0xec4899, 20, 30);
    sl1.position.set(-25, 5, 5);
    this.levelRoot.add(sl1);
    const sl2 = new THREE.PointLight(0xfbbf24, 16, 25);
    sl2.position.set(20, 4, -5);
    this.levelRoot.add(sl2);

    // BOSS LEVEL 2: Król-Leto
    this.addKrolLetoBossEnemy('boss_krol_leto_l2', 24, 0);

    // Finish Loading Gate
    // Arkadiusz tu był
    const arkadiusz2 = createSprayGraffitiDecal();
    arkadiusz2.position.set(12, 0.035, -7.0);
    arkadiusz2.rotation.x = -Math.PI / 2;
    arkadiusz2.scale.set(3.2, 2.2, 1);
    this.levelRoot.add(arkadiusz2);

    const crime2_boss = createCrimeSceneBodyOutlineDecal('INSPEKTOR BHP');
    crime2_boss.position.set(12, 0.035, -6);
    crime2_boss.scale.setScalar(3.5);
    this.levelRoot.add(crime2_boss);

    const finishGate = createFinishGate();
    finishGate.position.set(34, 0, 0);
    this.finishGatePos.set(34, 0, 0);
    this.levelRoot.add(finishGate);

    const van = createDeliveryVan();
    van.position.set(35.8, 0, 0);
    van.rotation.y = -Math.PI / 2;
    this.levelRoot.add(van);
    this.platforms.push({ x: 35.8, y: 0.8, z: 0, width: 3.5, height: 1.6, depth: 2.6, type: 'finish_truck' });
  }

  private buildLevel3() {
    // 1. Massive Final Arena: Baza Przeładunkowa & Starcie z Walczakiem i Królem-Leto (90x32)
    const floorGeo = new THREE.PlaneGeometry(90, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      map: getTerminalGraniteFloorTexture(),
      roughness: 0.28,
      metalness: 0.18,
      color: 0xffffff,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.levelRoot.add(floor);
    this.platforms.push({ x: 0, y: 0, z: 0, width: 90, height: 0.2, depth: 32, type: 'floor' });

    // Industrial Dark Reinforced Back Wall
    const wallGeo = new THREE.BoxGeometry(90, 10.5, 0.4);
    const wallMat = new THREE.MeshStandardMaterial({ map: getWallTexture(), roughness: 0.8, color: 0x0f172a });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 5.25, -16);
    this.levelRoot.add(backWall);

    // Decals Level 3 - ULTIMATE FLOOR VISIBILITY
    const spray3 = createSprayGraffitiDecal();
    spray3.position.set(0, 0.035, -6.0);
    spray3.rotation.x = -Math.PI / 2;
    spray3.scale.setScalar(2.8);
    this.levelRoot.add(spray3);

    const crime3 = createCrimeSceneBodyOutlineDecal('RUDY ŚMIERDZIUCH');
    crime3.position.set(-32, 0.035, 11.0);
    crime3.scale.setScalar(3.5);
    this.levelRoot.add(crime3);

    // Ominous Warning Neon Sign
    const neonSign = createNeonShowroomSign('STREFA ZAMKNIĘTA • GŁÓWNY AUDYT WALCZAKA & KRÓLA-LETO', '#ef4444');
    neonSign.position.set(0, 7.5, -15.75);
    this.levelRoot.add(neonSign);

    // Player Spawn
    this.playerPos.set(-40, 0.5, 0);
    this.playerVel.set(0, 0, 0);

    // Massive Storage Racks along both sides
    [-30, -18, -6, 6, 18, 30].forEach((rx, idx) => {
      const rack = createWarehouseRack(6.5, 4.5, 1.6);
      rack.position.set(rx, 0, -10);
      this.levelRoot.add(rack);
      this.platforms.push({ x: rx, y: 1.5, z: -10, width: 6.5, height: 0.15, depth: 1.6, type: 'shelf' });
      this.addGroutItem(`grout_l3_${idx}`, rx, 1.9, -10, 80);
    });

    // Elevated Dual Catwalks connecting the battleground
    const cwL = createHighBayCatwalk(16.0, 1.8);
    cwL.position.set(-18, 3.6, -10);
    const cwR = createHighBayCatwalk(16.0, 1.8);
    cwR.position.set(18, 3.6, -10);
    this.levelRoot.add(cwL, cwR);
    this.platforms.push({ x: -18, y: 3.6, z: -10, width: 16.0, height: 0.15, depth: 1.8, type: 'scaffold' });
    this.platforms.push({ x: 18, y: 3.6, z: -10, width: 16.0, height: 0.15, depth: 1.8, type: 'scaffold' });

    // Strategic Steam Vents
    [-26, 0, 26].forEach((vx) => {
      const vent = createIndustrialSteamVent();
      vent.position.set(vx, 0, -14.5);
      this.levelRoot.add(vent);
    });

    // VIP Documents & Treasures
    this.addVipItem('vip_l3_1', -30, 2.0, -10, 'Główny Protokół Odbioru Magazynu z 2026 r.');
    this.addVipItem('vip_l3_2', 0, 2.0, -10, 'Faktura Korygująca Walczaka na 2.5 MLN PLN');
    this.addVipItem('vip_l3_3', 30, 2.0, -10, 'Złota Zgrzewarka Foliowa Max-Fliz 24k');
    this.addVipItem('vip_l3_4', -18, 4.0, -10, 'Pancerne Zamówienie dla Rezydencji Prezesa');

    // Strategic In-World Perk Crates before boss confrontation!
    this.spawnDroppedPerk(-24, 0.5, 4, 'hardhat');
    this.spawnDroppedPerk(-18, 4.0, -10, 'espresso_boost');
    this.spawnDroppedPerk(18, 4.0, -10, 'vibram_boots');
    this.spawnDroppedPerk(0, 2.0, -10, 'order_magnet');
    this.spawnDroppedPerk(-10, 0.5, -4, 'order_magnet');
    this.spawnDroppedPerk(10, 0.5, 4, 'hardhat');

    this.addEspressoItem('esp_l3_1', -28, 0.4, -2.0);
    this.addEspressoItem('esp_l3_2', 20, 0.4, 2.0);
    this.addGoldenCutterItem('cutter_l3_1', -18, 4.0, -10);
    this.addMagnetItem('mag_l3_1', 18, 4.0, -10);

    // Easter Eggs in Level 3
    this.addEasterEgg('egg_l3_bimber', -26, 0.05, -14.2, 'Tajemny Rezerwuar Bimbru 70% Piotra (Rocznik 2012)', 'coffee', 650);
    this.addEasterEgg('egg_l3_level', 18, 3.8, -10.0, 'Złota Poziomica Majstra z Grawerem Max-Fliz 1992', 'folder', 750);
    this.addEasterEgg('egg_l3_throne', 32, 0.05, 10.0, 'Tron Królewski Dyrekcji z Marmuru Carrara 24k', 'throne', 800);

    // Forklift Hazards Criss-Crossing the arena
    this.addForkliftHazard('fork_l3_1', -32, 28, -3, 5.2, 0xef4444);
    this.addForkliftHazard('fork_l3_2', 28, -32, 5, 5.6, 0x3b82f6);

    // Massive Enemy Vanguard (Simultaneous Action!)
    this.addEliteGuardEnemy('guard_1', -14, -8, 8, 'Ochroniarz Walczaka z Tarczą BHP');
    this.addEliteGuardEnemy('guard_2', 10, -8, 8, 'Inspektor Taktyczny Walczaka');
    this.addEliteGuardEnemy('guard_3', -2, -8, 8, 'Kapitan Straży Walczaka');
    this.addKurierEnemy('kurier_l3_1', -26, -8, 8, 'Rudy z DPD (Johnny Walker Express)');
    this.addItalianVendorEnemy('ital_l3_1', -12, -8, 8, 'Główny Importer Gresu z Italii');
    this.addSztaplarEnemy('sztaplar_l3_1', 12, -8, 8, 'Taran Sztaplarka Straży Walczaka');
    this.addCustomerEnemy('cust_l3_1', -22, -8, 8, 'Niezadowolony Nabywca Próbek');
    this.addArchitectEnemy('arch_l3_1', -16, -8, 8, 'Militarny Architekt Projektu');
    this.addMonterEnemy('monter_l3_1', -8, -8, 8, 'Brygadzista Budowlany Walczaka');
    this.addMonterEnemy('monter_l3_2', 14, -8, 8, 'Majster ze Szlifierką Kątową');
    this.addHandlowiecEnemy('handl_l3_1', 2, -8, 8, 'Szalony Negocjator Ofertowy');
    this.addInspectorEnemy('insp_l3_1', -20, -8, 8, 'Główny Audytor Zdzichu');
    this.addPiorunDronEnemy('dron_l3_1', -25, 25, 0, 2.6, 'Dron Bojowy Walczaka V3');
    this.addPiorunDronEnemy('dron_l3_2', -20, 28, -4, 2.8, 'Dron Obserwacyjny Areny B4');

    // DUAL FINAL BOSSES: Były Kierownik Walczak & Król-Leto!
    this.addWalczakBossEnemy('boss_walczak', 26, -4);
    this.addKrolLetoBossEnemy('boss_krol_leto_l3', 26, 4);

    // Final Victory Gate
    // Arkadiusz tu był
    const arkadiusz3 = createSprayGraffitiDecal();
    arkadiusz3.position.set(-18, 0.035, -7.5);
    arkadiusz3.rotation.x = -Math.PI / 2;
    arkadiusz3.scale.set(3.5, 2.5, 1);
    this.levelRoot.add(arkadiusz3);

    const crime3_boss = createCrimeSceneBodyOutlineDecal('WALCZAK');
    crime3_boss.position.set(20, 0.035, 5);
    crime3_boss.scale.setScalar(4.0);
    this.levelRoot.add(crime3_boss);

    const finishGate = createFinishGate();
    finishGate.position.set(40, 0, 0);
    this.finishGatePos.set(40, 0, 0);
    this.levelRoot.add(finishGate);

    const van = createDeliveryVan();
    van.position.set(41.8, 0, 0);
    van.rotation.y = -Math.PI / 2;
    this.levelRoot.add(van);
    this.platforms.push({ x: 41.8, y: 0.8, z: 0, width: 3.5, height: 1.6, depth: 2.6, type: 'finish_truck' });

    // OMINOUS FINAL LIGHTING
    const fl1 = new THREE.PointLight(0xef4444, 25, 35);
    fl1.position.set(25, 6, 0);
    this.levelRoot.add(fl1);
    const fl2 = new THREE.PointLight(0x3b82f6, 18, 28);
    fl2.position.set(-30, 4, 0);
    this.levelRoot.add(fl2);
  }

  public update(dt: number) {
    if (this.state !== 'playing' && this.state !== 'title') return;

    let effectiveDt = dt;
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      effectiveDt = dt * 0.2; // Dramatic slow-mo impact instead of a full freeze
    }
    const simDt = effectiveDt;

    this.updatePerkTimers(simDt);

    if (this.state === 'playing') {
      if (this.invulnerableTimer > 0) this.invulnerableTimer -= simDt;
      if (this.marcinReclamationTimer > 0) this.marcinReclamationTimer = Math.max(0, this.marcinReclamationTimer - simDt);
      if (this.grzesiekCrushTimer > 0) this.grzesiekCrushTimer = Math.max(0, this.grzesiekCrushTimer - simDt);
      if (this.grzesiekCrushPulse > 0) this.grzesiekCrushPulse = Math.max(0, this.grzesiekCrushPulse - simDt);
      if (this.mateuszLagTimer > 0) this.mateuszLagTimer = Math.max(0, this.mateuszLagTimer - simDt);
      if (this.finishWarningTimer > 0) this.finishWarningTimer = Math.max(0, this.finishWarningTimer - simDt);

      if (this.speechBubbleTimer > 0) {
        this.speechBubbleTimer -= simDt;
        if (this.speechBubbleTimer <= 0) {
          this.callbacks.onSpeechBubble('');
        }
      }

      if (this.comboTimer > 0) {
        this.comboTimer -= simDt;
        if (this.comboTimer <= 0) {
          this.comboStreak = 0;
        }
      }

      this.updatePlayerMovement(simDt);
      this.updateCollectibles(simDt);
      this.updateDroppedPerks(simDt);
      this.updateHazards(simDt);
      this.updateEnemies(simDt);
      this.updateProjectiles(simDt);
      this.updateBimberMolotovs(simDt);
      this.updateBimberFirePuddles(simDt);
      this.updateSpecialEffects(simDt);
      this.updateParticles(simDt);
    }

    if (this.bloomPulseTimer > 0) {
      this.bloomPulseTimer -= dt;
      if (this.threeRenderer) {
        const exposure = 1.12 + Math.max(0, Math.sin(this.bloomPulseTimer * 10) * 0.5);
        this.threeRenderer.toneMappingExposure = exposure;
      }
    } else {
      if (this.threeRenderer) this.threeRenderer.toneMappingExposure = 1.12;
    }

    this.updateCamera(dt);
  }

  private updatePerkTimers(dt: number) {
    let changed = false;
    if (this.activePerks.doubleJump > 0) {
      this.activePerks.doubleJump = Math.max(0, this.activePerks.doubleJump - dt);
      changed = true;
    }
    if (this.activePerks.magnet > 0) {
      this.activePerks.magnet = Math.max(0, this.activePerks.magnet - dt);
      changed = true;
    }
    if (this.activePerks.speedBoost > 0) {
      this.activePerks.speedBoost = Math.max(0, this.activePerks.speedBoost - dt);
      changed = true;
    }
    if (changed) {
      this.callbacks.onPerksUpdate?.(this.activePerks);
    }
  }

  private updatePlayerMovement(dt: number) {
    let screenX = 0;
    let screenY = 0;

    if (this.keys['KeyD'] || this.keys['ArrowRight']) screenX += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) screenX -= 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) screenY += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) screenY -= 1;

    if (Math.abs(this.virtualJoystick.x) > 0.08 || Math.abs(this.virtualJoystick.y) > 0.08) {
      screenX = this.virtualJoystick.x;
      screenY = -this.virtualJoystick.y; // dragging up moves forward
    }

    // Dynamic camera-aligned projection on the horizontal floor:
    // Screen UP moves along camera forward projection; Screen RIGHT moves along camera right projection.
    const camToPlayerX = this.playerPos.x - this.camera.position.x;
    const camToPlayerZ = this.playerPos.z - this.camera.position.z;
    const camFwdLen = Math.hypot(camToPlayerX, camToPlayerZ);
    const fwdX = camFwdLen > 0.001 ? camToPlayerX / camFwdLen : 0;
    const fwdZ = camFwdLen > 0.001 ? camToPlayerZ / camFwdLen : -1;
    const rightX = -fwdZ;
    const rightZ = fwdX;

    let inputX = rightX * screenX + fwdX * screenY;
    let inputZ = rightZ * screenX + fwdZ * screenY;

    const inputLen = Math.hypot(inputX, inputZ);
    if (inputLen > 1) {
      inputX /= inputLen;
      inputZ /= inputLen;
    }

    let speed = this.charDef.speed;
    if (this.charDef.id === 'mateusz' && this.invulnerableTimer > 0) {
      speed *= 1.45;
    }
    if (this.activePerks.speedBoost > 0) {
      speed *= 1.35;
      if (Math.random() < 0.25) {
        this.spawnDust(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0xec4899);
      }
    }

    if (inputLen > 0.08) {
      const targetX = inputX * speed;
      const targetZ = inputZ * speed;
      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, targetX, 22, dt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, targetZ, 22, dt);
      this.playerVel.x = THREE.MathUtils.clamp(this.playerVel.x, -speed * 1.35, speed * 1.35);
      this.playerVel.z = THREE.MathUtils.clamp(this.playerVel.z, -speed * 1.35, speed * 1.35);
      this.playerRot = Math.atan2(inputX, inputZ);

      this.walkCycle += dt * 15;
      if (this.leftLeg && this.rightLeg && this.leftArm && this.rightArm) {
        this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.6;
        this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.6;
        this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.6;
        this.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.6;
      }
    } else {
      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, 0, 24, dt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, 0, 24, dt);
      if (this.leftLeg && this.rightLeg && this.leftArm && this.rightArm) {
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
      }
    }

    if (this.grzesiekCrushTimer > 0) {
      const t = 1 - this.grzesiekCrushTimer / 0.9;
      const swing = Math.sin(t * Math.PI);
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.z = -1.2 + swing * 1.5;
        this.rightArm.rotation.z = 1.2 - swing * 1.5;
        this.leftArm.rotation.x = -1.3 + swing * 1.8;
        this.rightArm.rotation.x = -1.3 + swing * 1.8;
      }
    }

    if (this.marcinReclamationTimer > 0 && this.playerGroup) {
      const pulse = 1 + Math.sin(performance.now() * 0.02) * 0.08;
      this.playerGroup.scale.set(pulse, 1.08, pulse);
    }

    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    if (this.attackSwingTimer > 0) {
      this.attackSwingTimer -= dt;
      if (this.rightArm) {
        this.rightArm.rotation.x = -1.8 + (this.attackSwingTimer / 0.25) * 1.5;
        this.rightArm.rotation.z = -0.4;
      }
    } else if (this.rightArm) {
      this.rightArm.rotation.z = 0;
    }

    const gravity = 22.0;
    this.playerVel.y -= gravity * dt;

    if (this.isGrounded) {
      this.coyoteTimer = 0.12;
      this.hasDoubleJumped = false;
    } else {
      this.coyoteTimer -= dt;
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
      if (this.coyoteTimer > 0) {
        this.playerVel.y = this.charDef.jumpForce;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        sound.playJump();
        this.spawnDust(this.playerPos.x, this.playerPos.y, this.playerPos.z);
        if (this.playerGroup) this.playerGroup.scale.set(0.82, 1.25, 0.82);
      } else if (this.activePerks.doubleJump > 0 && !this.hasDoubleJumped) {
        this.playerVel.y = this.charDef.jumpForce * 1.05;
        this.hasDoubleJumped = true;
        this.jumpBufferTimer = 0;
        sound.playDoubleJump();
        this.spawnParticleRing(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0x38bdf8);
        this.sayQuote('PODWÓJNY SKOK! Sprężyste odbicie Vibram!');
        if (this.playerGroup) this.playerGroup.scale.set(0.8, 1.3, 0.8);
      }
    }

    const currentBounds = this.currentLevelId === 1
      ? { minX: -34.5, maxX: 33.5, minZ: -12.2, maxZ: 12.2 }
      : this.currentLevelId === 2
      ? { minX: -38.5, maxX: 37.5, minZ: -13.2, maxZ: 13.2 }
      : { minX: -43.5, maxX: 43.5, minZ: -15.2, maxZ: 15.2 };

    const nextX = THREE.MathUtils.clamp(this.playerPos.x + this.playerVel.x * dt, currentBounds.minX, currentBounds.maxX);
    const nextY = this.playerPos.y + this.playerVel.y * dt;
    const nextZ = THREE.MathUtils.clamp(this.playerPos.z + this.playerVel.z * dt, currentBounds.minZ, currentBounds.maxZ);

    let landed = false;
    const pRadius = 0.28;

    for (const plat of this.platforms) {
      const minX = plat.x - plat.width / 2;
      const maxX = plat.x + plat.width / 2;
      const minZ = plat.z - plat.depth / 2;
      const maxZ = plat.z + plat.depth / 2;
      const topY = plat.y + plat.height / 2;

      if (nextX + pRadius > minX && nextX - pRadius < maxX &&
          nextZ + pRadius > minZ && nextZ - pRadius < maxZ) {

        if (this.playerPos.y >= topY - 0.22 && nextY <= topY) {
          if (plat.type === 'bathtub' && plat.bounce) {
            this.playerVel.y = plat.bounce;
            sound.playBounce();
            this.cameraShake = 0.35;
            this.sayQuote('HOP DO WANNY! Odlot na regał!');
            this.spawnParticleRing(plat.x, topY, plat.z, 0x06b6d4);
          } else {
            this.playerVel.y = 0;
            this.playerPos.y = topY;
            landed = true;
            if (plat.type === 'conveyor') {
              this.playerPos.x += 3.6 * dt;
            }
          }

          if (plat.type === 'finish_truck') {
            this.checkLevelFinish();
          }
        }
      }
    }

    const wasGrounded = this.isGrounded;
    this.isGrounded = landed;
    this.playerPos.x = nextX;
    if (!landed) {
      this.playerPos.y = Math.max(0.0, nextY);
      if (this.playerPos.y === 0.0) {
        landed = true;
        this.playerVel.y = 0;
      }
    }
    this.playerPos.z = nextZ;

    // Proximity trigger for finish gate / delivery van
    const finishTriggerX = this.currentLevelId === 1 ? 29.2 : this.currentLevelId === 2 ? 33.2 : 39.2;
    if (this.playerPos.x >= finishTriggerX && Math.abs(this.playerPos.z) < 3.2 && this.playerPos.y >= 0) {
      this.checkLevelFinish();
    }

    if (!wasGrounded && landed && this.playerGroup) {
      this.playerGroup.scale.set(1.2, 0.82, 1.2);
    }

    if (this.playerPos.y < -4.5) {
      this.takeDamage('Wypadłeś z rampy załadunkowej!');
      this.playerPos.set(this.currentLevelId === 3 ? -40 : -32, 2, 0);
      this.playerVel.set(0, 0, 0);
    }
    // SOLID BOUNDARY CLAMPING
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, this.levelBounds.minX, this.levelBounds.maxX);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, this.levelBounds.minZ, this.levelBounds.maxZ);

    if (this.playerGroup) {
      this.playerGroup.position.copy(this.playerPos);
      this.playerGroup.rotation.y = this.playerRot;
      this.playerGroup.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 8);
    }

    if (this.targetRing) {
      this.targetRing.position.set(this.playerPos.x, 0.05, this.playerPos.z);
      this.targetRing.rotation.z += dt * 2;
      (this.targetRing.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(performance.now() * 0.005) * 0.15;
    }
  }

  private updateCollectibles(dt: number) {
    this.collectibles.forEach((c) => {
      if (c.collected || !c.mesh) return;

      c.mesh.rotation.y += dt * 2.5;

      // Magnet Perk pull
      if (this.activePerks.magnet > 0) {
        const magDist = Math.hypot(c.x - this.playerPos.x, c.z - this.playerPos.z);
        if (magDist < 8.5) {
          const pullSpeed = 9.0 * dt;
          c.x += ((this.playerPos.x - c.x) / magDist) * pullSpeed;
          c.z += ((this.playerPos.z - c.z) / magDist) * pullSpeed;
          c.y += ((this.playerPos.y + 0.5 - c.y) / magDist) * pullSpeed;
          c.mesh.position.set(c.x, c.y, c.z);
        }
      }

      const dist = Math.hypot(c.x - this.playerPos.x, c.z - this.playerPos.z);
      const dy = Math.abs(c.y - (this.playerPos.y + 0.5));

      if (dist < 0.95 && dy < 1.2) {
        c.collected = true;
        this.levelRoot.remove(c.mesh);

        if (c.type === 'grout') {
          this.score += c.points;
          this.handleMateuszPassive(1);
          sound.playPickup();
          this.emitFloatingToast(`+${c.points} Pkt Fuga`, c.x, c.y + 0.5, c.z, 'points');
        } else if (c.type === 'vip_item') {
          this.score += c.points;
          this.handleMateuszPassive(1);
          this.collectedVipCount++;
          sound.playPickup(2);
          this.sayQuote(`ZEBRANO VIP: ${c.name}!`);
          this.emitFloatingToast(`📦 VIP ITEM!`, c.x, c.y + 0.5, c.z, 'vip');
        } else if (c.type === 'espresso') {
          this.activatePerk('espresso_boost', 18);
          this.emitFloatingToast(`☕ ESPRESSO!`, c.x, c.y + 0.5, c.z, 'points');
        } else if (c.type === 'magnet') {
          this.activatePerk('order_magnet', 20);
          this.emitFloatingToast(`🧲 RADIOMAGNES!`, c.x, c.y + 0.5, c.z, 'points');
        } else if (c.type === 'golden_cutter') {
          this.activatePerk('vibram_boots', 25);
          this.emitFloatingToast(`👟 VIBRAM BOOTS!`, c.x, c.y + 0.5, c.z, 'points');
        } else if (c.type === 'easter_egg') {
          this.score += c.points;
          this.handleMateuszPassive(1);
          sound.playEasterEgg();
          this.sayQuote(`EASTER EGG ODNALEZIONY: ${c.name}! (+${c.points} pkt)`);
          this.emitFloatingToast(`🎉 EASTER EGG!`, c.x, c.y + 0.5, c.z, 'easter-egg');
        }

        this.callbacks.onScoreUpdate(this.score, this.collectedVipCount, this.totalVipCount);
      }
    });
  }

  private updateHazards(dt: number) {
    this.hazards.forEach((h) => {
      if (!h.active || !h.mesh) return;

      if (h.type === 'forklift') {
        h.x += h.speed * h.dir * dt;
        if (h.dir > 0 && h.x >= h.endX!) {
          h.dir = -1;
          h.mesh.rotation.y = Math.PI;
        } else if (h.dir < 0 && h.x <= h.startX) {
          h.dir = 1;
          h.mesh.rotation.y = 0;
        }
        h.mesh.position.set(h.x, h.y, h.z);

        const dist = Math.hypot(h.x - this.playerPos.x, h.z - this.playerPos.z);
        if (dist < 1.4 && Math.abs(h.y - this.playerPos.y) < 1.2) {
          this.takeDamage('Zostałeś potrącony przez wózek widłowy!');
        }
      }
    });
  }

  private static readonly ENEMY_QUOTES: Record<string, string[]> = {
    customer: [
      "Gdzie moje kafelki?!",
      "Awantura o rabat 10%!",
      "Chcę widzieć kierownika!",
      "Płytki miały być gładkie!"
    ],
    architect: [
      "To ma być ecru czy beż?!",
      "Brak dylatacji na podłodze!",
      "Gres niezgodny z projektem!",
      "Wizualizacja mówiła inaczej!"
    ],
    agv_robot: [
      "BEEP BOOP ZLEW B4!",
      "Uwaga! Transport palety!",
      "Błąd czujnika przeszkód!",
      "Sztaplowanie w toku!"
    ],
    inspector: [
      "Gdzie kask BHP?!",
      "Brak protokołu odbioru!",
      "Mandat 500 PLN za bałagan!",
      "Przekroczenie normy hałasu!"
    ],
    handlowiec: [
      "Mam super ofertę na zlew!",
      "Rabat 3% tylko dzisiaj!",
      "A może zestaw baterii?!",
      "Darmowa dostawa do hotelu!"
    ],
    monter: [
      "Dobiję to gumowym młotkiem!",
      "Brak poziomu w alei!",
      "Cięcie po skosie 45°!",
      "Mieszam klej wysokie wiązanie!"
    ],
    piorun_dron: [
      "BZZZT SKAN KODU B4!",
      "Niezgodność numeru WZ!",
      "Skanowanie palety A1!",
      "Detekcja ruchu w alei!"
    ],
    elite_walczak_guard: [
      "Strefa Walczaka zamknięta!",
      "Brak przepustki B4!",
      "Odwrót z magazynu!",
      "Tarcza BHP w gotowości!"
    ],
    kurier: [
      "Dostawa DPD od Rudego z DPD! Załatwię Johnny Walkera tanio",
      "Paczka ekspresowa DPD dla VIP! Załatwię Johnny Walkera tanio",
      "Paczka od Rudego! Załatwię Johnny Walkera tanio",
      "Johnny Walker Express u drzwi! Załatwię Johnny Walkera tanio"
    ],
    przedstawiciel_włoski: [
      "Mamma mia, armatura de lux!",
      "Zlatane baterie z Mediolanu!",
      "Prego, uwaga na marmur!",
      "Amore, to jest prawdziwy styl!"
    ],
    sztaplar_szalony: [
      "Z drogi, 3 tony ładunku!",
      "Paleciak bez hamulców!",
      "Uwaga wyjazd z alei C!",
      "Czysta moc 300 Nm!"
    ],
    walczak: [
      "Ten magazyn jest MÓJ!",
      "Anuluję wszystkie faktury!",
      "Zawiadamiam Centralę!",
      "Nikt tu nie wygra ze mną!"
    ],
    krol_leto: [
      "ZWALNIAM CIĘ DYSCYPLINARNIE!",
      "Dyscyplinarka w trybie natychmiastowym!",
      "Oddawaj kask BHP i przepustkę!",
      "Moja decyzja o zwolnieniu jest OSTATECZNA!",
      "Błąd w WZ-tce? To koniec Twojej kariery!"
    ]
  };

  private updateEnemies(dt: number) {
    this.enemies.forEach((e) => {
      if (e.state === 'defeated' || !e.mesh) return;

      const dx = this.playerPos.x - e.x;
      const dz = this.playerPos.z - e.z;
      const distToPlayer = Math.hypot(dx, dz);

      // Distance culling: skip heavy updates for distant non-boss enemies
      if (distToPlayer > 42 && e.type !== 'walczak' && e.type !== 'krol_leto') return;

      if (!e.hpBar) {
        e.hpBar = new THREE.Group();
        const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.08), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }));
        const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.08), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        fill.position.z = 0.01;
        e.hpBar.add(bg, fill);
        e.hpBar.position.y = e.type === 'walczak' || e.type === 'krol_leto' ? 2.4 : 1.65;
        e.mesh.add(e.hpBar);
        e.hpFill = fill;
        e.hpBar.visible = false;
      }
      if (e.hpBar) {
        const isDamaged = e.hp < e.maxHp;
        e.hpBar.visible = isDamaged;
        if (isDamaged) {
          e.hpBar.lookAt(this.camera.position);
          e.hpFill.scale.x = Math.max(0, e.hp / e.maxHp);
          e.hpFill.position.x = (e.hpFill.scale.x - 1) * 0.4;
        }
      }

      e.walkCycle += dt * 8;
      if (e.legL && e.legR && e.type !== 'piorun_dron') {
        e.legL.rotation.x = Math.sin(e.walkCycle) * 0.5;
        e.legR.rotation.x = -Math.sin(e.walkCycle) * 0.5;
      }

      // TACTICAL INDICATOR
      if (e.state === 'chase' || e.state === 'searching') {
        const pulse = 1.0 + Math.sin(performance.now() * 0.01) * 0.15;
        e.mesh.scale.set(pulse, pulse, pulse);
      } else {
        e.mesh.scale.set(1, 1, 1);
      }

      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        if (e.stunTimer <= 0) {
          e.state = 'searching';
          e.searchTimer = 2.5;
        }
        return;
      }

      // SIGHT & DETECTION LOGIC
      const detectionRange = (e.type === 'walczak' || e.type === 'krol_leto') ? 16.0 : (e.state === 'chase' ? 12.0 : 8.5);
      const canSeePlayer = distToPlayer < detectionRange;

      if (canSeePlayer) {
        e.state = 'chase';
        e.lastKnownPlayerPos = { x: this.playerPos.x, z: this.playerPos.z };
        e.searchTimer = 0;
      } else if (e.state === 'chase') {
        e.state = 'searching';
        e.searchTimer = 3.5;
      }

      if (e.state === 'searching' && e.searchTimer !== undefined) {
        e.searchTimer -= dt;
        if (e.searchTimer <= 0) {
          e.state = 'patrol';
          e.lastKnownPlayerPos = null;
        } else if (e.lastKnownPlayerPos) {
          const sdx = e.lastKnownPlayerPos.x - e.x;
          const sdz = e.lastKnownPlayerPos.z - e.z;
          const sdist = Math.hypot(sdx, sdz);
          if (sdist > 0.5) {
            e.x += (sdx / sdist) * e.speed * 0.7 * dt;
            e.z += (sdz / sdist) * e.speed * 0.7 * dt;
          }
        }
      }

      // Random Shout Quotes floating above head without frame
      e.shoutTimer = (e.shoutTimer || 0) - dt;
      if (e.shoutTimer <= 0 && distToPlayer < 12.0) {
        e.shoutTimer = 3.2 + Math.random() * 2.8;
        const quotes = MaxFlizGameEngine.ENEMY_QUOTES[e.type] || ["Z drogi!"];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        e.shoutText = quote;
        this.emitFloatingToast(quote, e.x, e.y + 1.25, e.z, 'enemy_shout', { enemyType: e.type });
      }

      // Special movement per type
      if (e.type === 'piorun_dron') {
        if (e.legL) e.legL.rotation.y += dt * 30;
        if (e.legR) e.legR.rotation.y += dt * 30;
        if (e.armL) e.armL.rotation.y += dt * 30;
        if (e.armR) e.armR.rotation.y += dt * 30;

        e.x += e.speed * e.dir * dt;
        if (e.dir > 0 && e.x >= e.endX) {
          e.dir = -1;
        } else if (e.dir < 0 && e.x <= e.startX) {
          e.dir = 1;
        }
        e.mesh.position.set(e.x, e.y + Math.sin(performance.now() * 0.005) * 0.12, e.z);
      } else if (e.type === 'walczak') {
        // Boss AI: Walczak
        const isPhase2 = e.hp <= e.maxHp * 0.5;
        if (isPhase2 && e.bossPhase !== 2) {
          e.bossPhase = 2;
          e.speed *= 1.45;
          sound.playSirens();
          this.triggerScreenShake(0.8, 1.0);
          this.emitFloatingToast('🚨 WALCZAK: TRYB SZAŁU (FAZA 2)!', e.x, e.y + 1.8, e.z, 'damage');
        }

        if (distToPlayer < 14.0) {
          const angle = Math.atan2(dx, dz);
          e.mesh.rotation.y = angle;
          e.x += (dx / Math.max(0.1, distToPlayer)) * e.speed * 0.95 * dt;
          e.z += (dz / Math.max(0.1, distToPlayer)) * e.speed * 0.95 * dt;
        } else {
          e.x += e.speed * e.dir * dt;
          if (e.dir > 0 && e.x >= e.endX) {
            e.dir = -1;
            e.mesh.rotation.y = Math.PI / 2;
          } else if (e.dir < 0 && e.x <= e.startX) {
            e.dir = 1;
            e.mesh.rotation.y = -Math.PI / 2;
          }
        }
        e.mesh.position.set(e.x, e.y, e.z);

        if (e.specialActionTimer !== undefined) {
          e.specialActionTimer -= dt;
          const cooldown = isPhase2 ? 1.8 : 3.0;
          if (e.specialActionTimer <= 0) {
            e.specialActionTimer = cooldown;
            this.spawnPenaltyNotice(e.x, e.y + 1.2, e.z);
          }
        }
        this.callbacks.onBossUpdate?.(e.name, e.hp, e.maxHp, true, e.bossPhase);
      } else if (e.type === 'krol_leto') {
        // Boss AI: Król-Leto
        const isPhase2 = e.hp <= e.maxHp * 0.5;
        if (isPhase2 && e.bossPhase !== 2) {
          e.bossPhase = 2;
          e.speed *= 1.5;
          sound.playEvilLaugh();
          this.triggerScreenShake(1.2, 1.5);
          this.emitFloatingToast('🔥 KRÓL-LETO: OSTATECZNE ZWOLNIENIE!', e.x, e.y + 1.8, e.z, 'damage');
        }

        if (distToPlayer < 15.0) {
          const angle = Math.atan2(dx, dz);
          e.mesh.rotation.y = angle;
          e.x += (dx / Math.max(0.1, distToPlayer)) * e.speed * 1.05 * dt;
          e.z += (dz / Math.max(0.1, distToPlayer)) * e.speed * 1.05 * dt;
          if (isPhase2 && Math.random() < 0.05) this.triggerScreenShake(0.1, 0.2);
        } else if (e.state === 'searching' && e.lastKnownPlayerPos) {
          const angle = Math.atan2(e.lastKnownPlayerPos.x - e.x, e.lastKnownPlayerPos.z - e.z);
          e.mesh.rotation.y = angle;
        } else {
          e.x += e.speed * e.dir * dt;
          if (e.dir > 0 && e.x >= e.endX) {
            e.dir = -1;
            e.mesh.rotation.y = Math.PI / 2;
          } else if (e.dir < 0 && e.x <= e.startX) {
            e.dir = 1;
            e.mesh.rotation.y = -Math.PI / 2;
          }
        }
        e.mesh.position.set(e.x, e.y, e.z);

        if (e.specialActionTimer !== undefined) {
          e.specialActionTimer -= dt;
          const cooldown = isPhase2 ? 1.2 : 2.2;
          if (e.specialActionTimer <= 0 && distToPlayer < 12.0) {
            e.specialActionTimer = cooldown;
            this.spawnDyscyplinarkaNotice(e.x, e.y + 1.2, e.z);
            this.emitFloatingToast('🚨 DYSCYPLINARKA!', e.x, e.y + 1.5, e.z, 'damage');
          }
        }
        this.callbacks.onBossUpdate?.(e.name, e.hp, e.maxHp, true, e.bossPhase);
      } else {
        // Dynamic Chase / Tracking AI for ground enemies
        const chaseRadius = e.type === 'kurier' ? 14.0 : e.type === 'sztaplar_szalony' ? 12.0 : 10.0;

        if (distToPlayer < chaseRadius) {
          if (e.state === 'patrol' && !e.alerted) {
            e.alerted = true;
            this.emitFloatingToast('!', e.x, e.y + 1.35, e.z, 'damage');
            sound.playAlert();
          }
          e.state = 'chase';
          const angle = Math.atan2(dx, dz);
          e.mesh.rotation.y = angle;

          const chaseSpeed = e.speed * (e.type === 'kurier' ? 1.35 : 1.2);
          e.x += (dx / Math.max(0.1, distToPlayer)) * chaseSpeed * dt;
          e.z += (dz / Math.max(0.1, distToPlayer)) * chaseSpeed * dt;
        } else {
          e.alerted = false;
          e.state = 'patrol';
          e.z += e.speed * e.dir * dt;
          if (e.dir > 0 && e.z >= e.endX) {
            e.dir = -1;
            e.mesh.rotation.y = Math.PI;
          } else if (e.dir < 0 && e.z <= e.startX) {
            e.dir = 1;
            e.mesh.rotation.y = 0;
          }
        }
        e.mesh.position.set(e.x, e.y, e.z);

        // Ranged special attacks
        if ((e.type === 'handlowiec' || e.type === 'przedstawiciel_włoski') && e.specialActionTimer !== undefined) {
          e.specialActionTimer -= dt;
          if (e.specialActionTimer <= 0 && distToPlayer < 9.0) {
            e.specialActionTimer = 2.8;
            this.spawnPenaltyNotice(e.x, e.y + 0.8, e.z);
            const msg = e.type === 'przedstawiciel_włoski' ? '🇮🇹 ARMATURA DE LUX!' : '📑 OFERTA RABATOWA!';
            this.emitFloatingToast(msg, e.x, e.y + 1.2, e.z, 'damage');
          }
        } else if (e.type === 'inspector' && e.specialActionTimer !== undefined) {
          e.specialActionTimer -= dt;
          if (e.specialActionTimer <= 0 && distToPlayer < 6.5) {
            e.specialActionTimer = 2.8;
            sound.playWhistle();
            this.emitFloatingToast('🚨 KONTROLA BHP!', e.x, e.y + 1.2, e.z, 'damage');
          }
        }
      }

      // Check collision with player
      const dist = Math.hypot(e.x - this.playerPos.x, e.z - this.playerPos.z);
      const hitRadius = e.type === 'walczak' || e.type === 'krol_leto' ? 1.5 : e.type === 'elite_walczak_guard' ? 1.3 : 1.1;

      if (dist < hitRadius) {
        // 1. STOMP MECHANIC (Naskok z góry)
        if (this.playerVel.y < -0.8 && this.playerPos.y > e.y + 0.35) {
          const bounceForce = e.type === 'agv_robot' ? this.charDef.jumpForce * 1.3 : this.charDef.jumpForce * 0.95;
          this.playerVel.y = bounceForce;
          sound.playBounce();
          this.cameraShake = 0.35;
          this.spawnParticleRing(e.x, e.y + 0.8, e.z, 0x38bdf8);

          e.hp -= 2;
          this.emitFloatingToast('💥 STOMP! +150', e.x, e.y + 1.2, e.z, 'points');
          this.emitFloatingToast('-2 HP', e.x, e.y + 0.7, e.z, 'damage');

          if (e.hp <= 0) {
            this.defeatEnemy(e, 260, true);
          } else {
            e.stunTimer = 1.0;
            e.state = 'stunned';
          }
        } else if (Math.abs(e.y - this.playerPos.y) < 1.1) {
          // Horizontal Contact
          if (this.marcinReclamationTimer > 0) {
            e.stunTimer = 2.5;
            e.state = 'stunned';
            this.emitFloatingToast('🛡️ AUDYT BHP!', e.x, e.y + 1, e.z, 'perk');
          } else if (this.grzesiekCrushTimer > 0) {
            e.hp -= 3;
            this.emitFloatingToast('-3 HP ŚCISK!', e.x, e.y + 1, e.z, 'damage');
            if (e.hp <= 0) this.defeatEnemy(e, 280, true);
          } else if (e.type === 'krol_leto') {
            if (this.activePerks.shield) {
              this.activePerks.shield = false;
              this.invulnerableTimer = 1.2;
              sound.playShieldBreak();
              this.sayQuote('Kask BHP zamortyzował atak Króla-Leto!');
            } else {
              this.takeDamage('🚨 ZWOLNIENIE DYSCYPLINARNE NA HITA OD KRÓLA-LETO!');
            }
          } else {
            this.takeDamage(`Zaatakował Cię: ${e.name}!`);
          }
        }
      }
    });
  }

  private spawnPenaltyNotice(x: number, y: number, z: number) {
    const mesh = createPenaltyNoticeProjectile();
    mesh.position.set(x, y, z);
    this.levelRoot.add(mesh);
    const dir = new THREE.Vector3(this.playerPos.x - x, 0, this.playerPos.z - z).normalize();
    this.enemyProjectiles.push({ mesh, vel: dir.multiplyScalar(7.5), life: 3.5 });
    sound.playWhistle();
  }

  private spawnDyscyplinarkaNotice(x: number, y: number, z: number) {
    const mesh = createPenaltyNoticeProjectile();
    mesh.scale.setScalar(1.6);
    (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
    mesh.position.set(x, y, z);
    this.levelRoot.add(mesh);
    const dir = new THREE.Vector3(this.playerPos.x - x, 0, this.playerPos.z - z).normalize();
    this.enemyProjectiles.push({ mesh, vel: dir.multiplyScalar(10.0), life: 3.5, isDyscyplinarka: true });
    sound.playWhistle();
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      let hit = false;
      this.enemies.forEach((e) => {
        if (e.state === 'defeated') return;
        const dist = Math.hypot(p.mesh.position.x - e.x, p.mesh.position.z - e.z);
        if (dist < 1.25 && Math.abs(p.mesh.position.y - e.y) < 1.2) {
          hit = true;

          // Check if guard has active shield
          if (e.shieldActive && this.charDef.id !== 'grzesiek') {
            sound.playShieldBreak();
            this.triggerBloomPulse(0.08);
            this.emitFloatingToast('🛡️ BLOK TARCZY!', e.x, e.y + 1, e.z, 'damage');
            e.shieldActive = false; // Shield breaks after 1 hit!
          } else {
            const dmg = this.charDef.id === 'dawid' ? 2 : 1;
            e.hp -= dmg;
            sound.playSmack();
            this.triggerBloomPulse(0.1);
            this.cameraShake = 0.25;
            this.spawnParticleRing(e.x, e.y + 0.8, e.z, 0xf59e0b);
            this.emitFloatingToast(`-${dmg} HP`, e.x, e.y + 0.8, e.z, 'damage');

            if (e.hp <= 0) {
              this.defeatEnemy(e, 250, true);
            } else {
              e.stunTimer = 0.6;
              e.state = 'stunned';
            }
          }
        }
      });

      if (hit || p.life <= 0) {
        this.levelRoot.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.life -= dt;
      ep.mesh.position.addScaledVector(ep.vel, dt);

      const dist = Math.hypot(ep.mesh.position.x - this.playerPos.x, ep.mesh.position.z - this.playerPos.z);
      if (dist < 0.85 && Math.abs(ep.mesh.position.y - this.playerPos.y) < 1.0) {
        if (ep.isDyscyplinarka) {
          if (this.activePerks.shield) {
            this.activePerks.shield = false;
            this.invulnerableTimer = 1.2;
            sound.playShieldBreak();
            this.sayQuote('Kask BHP zamortyzował DYSCYPLINARKĘ Króla-Leto!');
            this.emitFloatingToast('🛡️ BLOK DYSCYPLINARKI!', this.playerPos.x, this.playerPos.y + 1, this.playerPos.z, 'perk');
          } else {
            this.takeDamage('🚨 ZWOLNIENIE DYSCYPLINARNE NA HITA OD KRÓLA-LETO!', 99);
          }
        } else {
          this.takeDamage('Trafiło Cię wezwanie wyjaśniające od Walczaka!');
        }
        this.levelRoot.remove(ep.mesh);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (ep.life <= 0) {
        this.levelRoot.remove(ep.mesh);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private updateSpecialEffects(dt: number) {
    for (let i = this.specialEffects.length - 1; i >= 0; i--) {
      const effect = this.specialEffects[i];
      effect.life -= dt;
      const t = 1 - effect.life / effect.maxLife;

      if (effect.update) {
        effect.update(dt, t);
      } else {
        effect.mesh.scale.setScalar(1 + t * effect.grow);
        effect.mesh.rotation.z += dt * effect.spin;
        const mat = (effect.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial | undefined;
        if (mat && 'opacity' in mat) {
          mat.opacity = Math.max(0, (effect.life / effect.maxLife) * 0.9);
        }
      }

      if (effect.life <= 0) {
        this.levelRoot.remove(effect.mesh);
        this.specialEffects.splice(i, 1);
      }
    }
  }

  private spawnGrzesiekShockwave() {
    // 1. Ground Shockwaves
    const geo = new THREE.TorusGeometry(0.9, 0.12, 14, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(this.playerPos.x, this.playerPos.y + 0.12, this.playerPos.z);
    mesh.scale.setScalar(0.2);
    this.levelRoot.add(mesh);
    this.specialEffects.push({ mesh, life: 0.7, maxLife: 0.7, grow: 7.5, spin: 9.0 });

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.08, 12, 32),
      new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(this.playerPos.x, this.playerPos.y + 0.12, this.playerPos.z);
    ring2.scale.setScalar(0.18);
    this.levelRoot.add(ring2);
    this.specialEffects.push({ mesh: ring2, life: 0.6, maxLife: 0.6, grow: 8.5, spin: -7.0 });

    // 2. GIANT ROTATING & SQUEEZING MECHANICAL CRUSHER ARM (ŚCIŚK ZAGŁADY)
    const armGroup = new THREE.Group();
    armGroup.position.set(this.playerPos.x, this.playerPos.y + 1.1, this.playerPos.z);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.5, roughness: 0.3, emissive: 0x15803d, emissiveIntensity: 0.5 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const teethMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.2, emissive: 0xeab308, emissiveIntensity: 0.4 });

    // Base Turret
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.3, 16), steelMat);
    armGroup.add(baseMesh);

    // Boom arm
    const boomGroup = new THREE.Group();
    boomGroup.position.set(0, 0.15, 0);

    const boomMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.2, 0.22), greenMat);
    boomMesh.position.set(0, 0.6, 0.2);
    boomMesh.rotation.x = 0.4;
    boomGroup.add(boomMesh);

    // Hydraulic cylinder
    const cylMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 12), chromeMat);
    cylMesh.position.set(0, 0.5, 0.05);
    cylMesh.rotation.x = 0.4;
    boomGroup.add(cylMesh);

    // Forearm
    const forearmGroup = new THREE.Group();
    forearmGroup.position.set(0, 1.1, 0.5);

    const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), steelMat);
    forearmMesh.position.set(0, 0.4, 0.2);
    forearmMesh.rotation.x = -0.5;
    forearmGroup.add(forearmMesh);

    // Squeezing Pincer Jaws
    const clawBaseGroup = new THREE.Group();
    clawBaseGroup.position.set(0, 0.8, 0.4);

    const clawHub = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), greenMat);
    clawBaseGroup.add(clawHub);

    // Left Jaw
    const leftJaw = new THREE.Group();
    const leftJawBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.15), steelMat);
    leftJawBar.position.set(-0.25, 0.35, 0);
    leftJawBar.rotation.z = -0.2;
    leftJaw.add(leftJawBar);

    const leftTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.12), teethMat);
    leftTeeth.position.set(-0.15, 0.6, 0.08);
    leftJaw.add(leftTeeth);
    clawBaseGroup.add(leftJaw);

    // Right Jaw
    const rightJaw = new THREE.Group();
    const rightJawBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.15), steelMat);
    rightJawBar.position.set(0.25, 0.35, 0);
    rightJawBar.rotation.z = 0.2;
    rightJaw.add(rightJawBar);

    const rightTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.12), teethMat);
    rightTeeth.position.set(0.15, 0.6, 0.08);
    rightJaw.add(rightTeeth);
    clawBaseGroup.add(rightJaw);

    forearmGroup.add(clawBaseGroup);
    boomGroup.add(forearmGroup);
    armGroup.add(boomGroup);

    armGroup.scale.setScalar(1.6);
    this.levelRoot.add(armGroup);

    let sparkTimer = 0;

    this.specialEffects.push({
      mesh: armGroup,
      life: 0.9,
      maxLife: 0.9,
      grow: 0,
      spin: 0,
      update: (dt: number, progress: number) => {
        // High-speed rotation around Y-axis
        armGroup.rotation.y += dt * 18.0;

        // Dynamic heavy slam arc
        armGroup.rotation.x = Math.sin(progress * Math.PI) * 0.5;

        // SQUEEZING / PINCHING CLAW ACTION (Obracające się i ściskające ramię):
        const closeAmount = Math.max(0, Math.sin(progress * Math.PI)); 
        leftJaw.rotation.z = closeAmount * 0.85;
        rightJaw.rotation.z = -closeAmount * 0.85;

        // Glowing teeth intensity
        teethMat.emissiveIntensity = 0.4 + closeAmount * 1.8;

        // Energy sparks burst during peak crush
        if (progress > 0.2 && progress < 0.8) {
          sparkTimer += dt;
          if (sparkTimer > 0.04) {
            sparkTimer = 0;
            this.spawnParticleRing(
              armGroup.position.x + (Math.random() - 0.5) * 0.8,
              armGroup.position.y + 1.2,
              armGroup.position.z + (Math.random() - 0.5) * 0.8,
              0x4ade80
            );
          }
        }

        // Smooth scale fade out near end
        if (progress > 0.7) {
          const fade = (1 - progress) / 0.3;
          armGroup.scale.setScalar(1.6 * fade);
        }
      },
    });
  }

  private updateParticles(dt: number) {
    if (this.particles.length > 80) {
      const excess = this.particles.splice(0, this.particles.length - 80);
      excess.forEach((p) => this.levelRoot.remove(p.mesh));
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.mesh.position.addScaledVector(pt.vel, dt);
      const scale = Math.max(0.001, pt.life / pt.maxLife);
      pt.mesh.scale.setScalar(scale);

      if (pt.life <= 0) {
        this.levelRoot.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  public triggerJump() {
    if (this.state !== 'playing') return;
    this.jumpBufferTimer = 0.22;
  }

  public triggerAttack() {
    if (this.state !== 'playing' || this.attackCooldownTimer > 0) return;
    this.attackCooldownTimer = 0.35;
    this.attackSwingTimer = 0.25;

    sound.playAttackWhoosh();

    const forward = new THREE.Vector3(Math.sin(this.playerRot), 0, Math.cos(this.playerRot));
    const projGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const projMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, emissive: 0xf59e0b, emissiveIntensity: 0.5 });
    const proj = new THREE.Mesh(projGeo, projMat);
    proj.position.set(this.playerPos.x, this.playerPos.y + 0.8, this.playerPos.z).addScaledVector(forward, 0.6);
    this.levelRoot.add(proj);

    this.projectiles.push({
      mesh: proj,
      vel: forward.multiplyScalar(14.0),
      life: 0.8,
    });

    // Agile enemies attempt dodge reactions
    this.enemies.forEach((e) => {
      if (e.state === 'defeated' || e.state === 'stunned') return;
      const dist = Math.hypot(e.x - this.playerPos.x, e.z - this.playerPos.z);
      if (dist < 4.0 && (e.type === 'piorun_dron' || e.type === 'kurier' || e.type === 'monter' || e.type === 'elite_walczak_guard')) {
        if (Math.random() < 0.4) {
          const dodgeOffset = (Math.random() > 0.5 ? 1.4 : -1.4);
          e.z = THREE.MathUtils.clamp(e.z + dodgeOffset, e.startX, e.endX);
          this.emitFloatingToast('💨 UNIK!', e.x, e.y + 1.0, e.z, 'damage');
        }
      }
    });
  }

  public triggerAbility() {
    if (this.state !== 'playing' || this.abilityTimer > 0) return;
    this.abilityTimer = this.charDef.abilityCooldown;

    sound.playAbility(this.currentCharacterId);
    this.cameraShake = 0.45;
    this.spawnParticleRing(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z, this.charDef.color);

    if (this.currentCharacterId === 'marcin') {
      this.marcinReclamationTimer = 8;
      this.invulnerableTimer = Math.max(this.invulnerableTimer, 8);
      this.hp = Math.min(this.maxHp, this.hp + 1);
      this.callbacks.onHpUpdate(this.hp, this.maxHp);
      this.sayQuote('WYJAZD NA REKLAMACJE! Zamykam tę sprawę pieczęcią – 8 sekund całkowitej nietykalności i +1 Kawa!');
      sound.playReclamation();
      this.spawnParticleRing(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z, 0xcbd5e1);
      const radius = 8.5;
      this.enemies.forEach((e) => {
        if (e.state === 'defeated') return;
        const dist = Math.hypot(e.x - this.playerPos.x, e.z - this.playerPos.z);
        if (dist < radius) {
          e.stunTimer = 5.0;
          e.state = 'stunned';
          e.hp = Math.max(0, e.hp - 1);
          this.emitFloatingToast('-1 HP Pieczęć', e.x, e.y + 0.8, e.z, 'damage');
          if (e.hp <= 0) {
            this.defeatEnemy(e, 220, false);
          }
        }
      });
    } else if (this.currentCharacterId === 'grzesiek') {
      this.grzesiekCrushTimer = 0.9;
      this.grzesiekCrushPulse = 1.0;
      this.spawnGrzesiekShockwave();
      const forward = new THREE.Vector3(Math.sin(this.playerRot), 0, Math.cos(this.playerRot));
      this.playerPos.x += forward.x * 1.6;
      this.playerPos.z += forward.z * 1.6;
      this.sayQuote('ŚCIŚK ZAGŁADY! 44 cm obwodu ramienia. Tu nie ma już miejsca na wątpliwości!');
      sound.playSciskCrush();
      this.spawnParticleRing(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z, 0x4ade80);
      this.enemies.forEach((e) => {
        if (e.state === 'defeated') return;
        const dx = e.x - this.playerPos.x;
        const dz = e.z - this.playerPos.z;
        const dist = Math.hypot(dx, dz);
        const dirDot = (dx * forward.x + dz * forward.z) / Math.max(1, dist);
        if (dist < 5.2 && dirDot > -0.3) {
          e.hp -= 3;
          e.stunTimer = 1.6;
          e.state = 'stunned';
          this.cameraShake = 0.65;
          this.spawnParticleRing(e.x, e.y + 0.6, e.z, 0x86efac);
          this.emitFloatingToast('-3 HP ŚCISK!', e.x, e.y + 0.8, e.z, 'damage');
          if (e.hp <= 0) {
            this.defeatEnemy(e, 300, false);
          }
        }
      });
    } else if (this.currentCharacterId === 'dawid') {
      this.activatePerk('hardhat', 15);
      this.sayQuote('JA WIEM LEPIEJ! Gres Calacatta 120x280 leci pod kątem 45 stopni!');
      sound.playAttackWhoosh();
      const angles = [-0.35, 0, 0.35];
      angles.forEach((offsetAngle) => {
        const rot = this.playerRot + offsetAngle;
        const forward = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
        const tileGeo = new THREE.BoxGeometry(0.7, 0.1, 0.45);
        const tileMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          emissive: 0xd97706,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2,
        });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.position.set(this.playerPos.x, this.playerPos.y + 0.6, this.playerPos.z).addScaledVector(forward, 0.6);
        this.levelRoot.add(tile);
        this.projectiles.push({
          mesh: tile,
          vel: forward.multiplyScalar(16.0),
          life: 1.2,
        });
      });
      this.emitFloatingToast('🧱 GRESOWY DESZCZ!', this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 'perk');
    } else if (this.currentCharacterId === 'mateusz') {
      this.hp = Math.min(this.maxHp, this.hp + 1);
      this.callbacks.onHpUpdate(this.hp, this.maxHp);
      this.sayQuote('BSOD! ŁAPCIE LAGA! Niech system Max-Fliz się zawiesi!');
      sound.playAbility('mateusz');
      this.spawnParticleRing(this.playerPos.x, this.playerPos.y + 0.8, this.playerPos.z, 0x3b82f6);
      this.emitFloatingToast('🎮 ATAL BSOD: LAGI DLA WROGÓW!', this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 'perk');
      
      this.enemies.forEach((e) => {
        if (e.state === 'defeated') return;
        const dist = Math.hypot(e.x - this.playerPos.x, e.z - this.playerPos.z);
        if (dist < 10.0) {
          e.stunTimer = 5.0;
          e.state = 'stunned';
          this.emitFloatingToast('LAG...', e.x, e.y + 0.8, e.z, 'damage');
        }
      });
    } else if (this.currentCharacterId === 'piotr') {
      this.sayQuote('FLASZKA ZE SKARBCZYKA! 70% bimbru zza regału B4 – z drogi, bo będzie ogień!');
      this.throwBimberMolotov();
    }
  }

  private throwBimberMolotov() {
    sound.playMolotovThrow();
    this.attackSwingTimer = 0.35;
    if (this.rightArm) {
      this.rightArm.rotation.x = -2.2;
    }

    const forward = new THREE.Vector3(Math.sin(this.playerRot), 0, Math.cos(this.playerRot));
    const molotovData = createBimberBottleMolotov();
    const startPos = new THREE.Vector3(
      this.playerPos.x + forward.x * 0.7,
      this.playerPos.y + 1.1,
      this.playerPos.z + forward.z * 0.7
    );
    molotovData.group.position.copy(startPos);
    this.levelRoot.add(molotovData.group);

    // Initial forward velocity + high arc
    const throwVel = forward.clone().multiplyScalar(13.5);
    throwVel.y = 5.8;

    this.bimberMolotovs.push({
      mesh: molotovData.group,
      pos: startPos,
      vel: throwVel,
      spin: new THREE.Vector3(
        8.0 + Math.random() * 4.0,
        3.0 + Math.random() * 2.0,
        2.0 + Math.random() * 2.0
      ),
      life: 2.8,
      flameLight: molotovData.flameLight,
      flameMesh: molotovData.flameMesh,
    });

    this.emitFloatingToast('🍾 KOKTAJL MOŁOTOWA Z BIMBREM!', this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 'combo');
  }

  private updateBimberMolotovs(dt: number) {
    for (let i = this.bimberMolotovs.length - 1; i >= 0; i--) {
      const b = this.bimberMolotovs[i];
      b.life -= dt;

      // Gravity pulls it down
      b.vel.y -= 17.0 * dt;
      b.pos.addScaledVector(b.vel, dt);

      // Tumbling spin in flight
      b.mesh.rotation.x += b.spin.x * dt;
      b.mesh.rotation.y += b.spin.y * dt;
      b.mesh.rotation.z += b.spin.z * dt;
      b.mesh.position.copy(b.pos);

      // Flickering flame wick
      if (b.flameMesh) {
        const pulse = 1.0 + Math.sin(performance.now() * 0.02) * 0.3;
        b.flameMesh.scale.set(pulse, pulse * 1.2, pulse);
      }
      if (b.flameLight) {
        b.flameLight.intensity = 2.0 + Math.sin(performance.now() * 0.03) * 0.8;
      }

      // Trail of glowing sparks/smoke
      if (Math.random() < 0.5) {
        this.spawnParticleRing(b.pos.x, b.pos.y, b.pos.z, 0xff7700);
      }

      // Check collision with enemies
      let hitEnemy = false;
      this.enemies.forEach((e) => {
        if (e.state === 'defeated') return;
        const dist = Math.hypot(b.pos.x - e.x, b.pos.z - e.z);
        if (dist < 1.15 && Math.abs(b.pos.y - e.y) < 1.2) {
          hitEnemy = true;
        }
      });

      // Find platform ground height beneath the bottle
      let floorY = 0;
      for (const p of this.platforms) {
        const halfW = p.width / 2;
        const halfD = p.depth / 2;
        if (
          b.pos.x >= p.x - halfW &&
          b.pos.x <= p.x + halfW &&
          b.pos.z >= p.z - halfD &&
          b.pos.z <= p.z + halfD
        ) {
          const top = p.y + p.height / 2;
          if (top > floorY && b.pos.y >= top - 0.4) {
            floorY = top;
          }
        }
      }

      const hitGround = b.pos.y <= floorY + 0.15 && b.vel.y <= 0;

      if (hitEnemy || hitGround || b.life <= 0) {
        // DETONATION!
        this.detonateBimberMolotov(b.pos.x, Math.max(floorY, 0), b.pos.z);
        this.levelRoot.remove(b.mesh);
        this.bimberMolotovs.splice(i, 1);
      }
    }
  }

  private detonateBimberMolotov(x: number, y: number, z: number) {
    sound.playGlassShatter();
    sound.playFireCrackle();
    this.triggerScreenShake(0.55, 0.45);

    // 1. Shards of broken glass flying in all directions
    for (let s = 0; s < 12; s++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 5.0;
      const shardGeo = new THREE.BoxGeometry(0.08, 0.08, 0.03);
      const shardMat = new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.9 });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.set(x, y + 0.3, z);
      this.levelRoot.add(shard);
      this.particles.push({
        mesh: shard,
        vel: new THREE.Vector3(Math.cos(angle) * speed, 2.5 + Math.random() * 3.5, Math.sin(angle) * speed),
        life: 0.6,
        maxLife: 0.6,
      });
    }

    // 2. Fireball impact flash
    const flashGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xff3b00,
      transparent: true,
      opacity: 0.85,
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(x, y + 0.6, z);
    this.levelRoot.add(flash);
    this.specialEffects.push({
      mesh: flash,
      life: 0.45,
      maxLife: 0.45,
      grow: 3.5,
      spin: 4.0,
    });

    // 3. Initial burst damage to anyone in the direct splash
    this.enemies.forEach((e) => {
      if (e.state === 'defeated') return;
      const dist = Math.hypot(e.x - x, e.z - z);
      if (dist < 3.2 && Math.abs(e.y - y) < 1.8) {
        e.hp -= 2;
        e.stunTimer = 1.5;
        e.state = 'stunned';
        e.onFireTimer = 3.5;
        this.emitFloatingToast('💥 -2 HP KOKTAJL!', e.x, e.y + 0.9, e.z, 'damage');
        if (e.hp <= 0) {
          this.defeatEnemy(e, 280, false);
        }
      }
    });

    this.emitFloatingToast('🔥 MORZE OGNIA 70%!', x, y + 1.3, z, 'combo');

    // 4. Create persistent burning fire puddle
    const puddle = createMolotovFirePuddle(3.8);
    puddle.group.position.set(x, y + 0.02, z);
    this.levelRoot.add(puddle.group);

    this.bimberFirePuddles.push({
      group: puddle.group,
      x,
      y,
      z,
      radius: 3.8,
      duration: 6.0,
      maxDuration: 6.0,
      tickTimer: 0.4,
      flames: puddle.flames,
      light: puddle.light,
    });
  }

  private updateBimberFirePuddles(dt: number) {
    for (let i = this.bimberFirePuddles.length - 1; i >= 0; i--) {
      const p = this.bimberFirePuddles[i];
      p.duration -= dt;

      // Animate flickering fire spires
      const time = performance.now() * 0.001;
      p.flames.forEach((flame) => {
        const u = flame.userData;
        const flicker = Math.sin(time * u.speed + u.phase);
        const scaleY = Math.max(0.3, 1.0 + flicker * 0.4);
        flame.scale.set(1.0 + flicker * 0.15, scaleY, 1.0 + flicker * 0.15);
      });

      // Flickering light
      p.light.intensity = 3.5 + Math.sin(time * 14) * 1.2;

      // Rising smoke and embers
      if (Math.random() < 0.45) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * (p.radius * 0.7);
        const ex = p.x + Math.cos(angle) * r;
        const ez = p.z + Math.sin(angle) * r;
        const ember = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, 0.08),
          new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 })
        );
        ember.position.set(ex, p.y + 0.3, ez);
        this.levelRoot.add(ember);
        this.particles.push({
          mesh: ember,
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.8 + Math.random() * 1.5, (Math.random() - 0.5) * 0.8),
          life: 0.5,
          maxLife: 0.5,
        });
      }

      // Damage ticks over time
      p.tickTimer -= dt;
      if (p.tickTimer <= 0) {
        p.tickTimer = 0.5; // Damage every 0.5s

        this.enemies.forEach((e) => {
          if (e.state === 'defeated') return;
          const dist = Math.hypot(e.x - p.x, e.z - p.z);
          if (dist < p.radius && Math.abs(e.y - p.y) < 1.5) {
            e.hp -= 1;
            e.onFireTimer = 2.0;
            e.speed = Math.max(1.0, e.speed * 0.85); // Slowed by burning bimber
            sound.playHit();
            this.emitFloatingToast('🔥 -1 HP OGIEŃ!', e.x, e.y + 0.8, e.z, 'damage');
            this.spawnParticleRing(e.x, e.y + 0.5, e.z, 0xff5500);

            if (e.hp <= 0) {
              this.defeatEnemy(e, 260, false);
            }
          }
        });
      }

      // Fade out near expiration
      if (p.duration <= 0.8) {
        const fade = p.duration / 0.8;
        p.group.scale.set(fade, fade, fade);
        p.light.intensity *= fade;
      }

      if (p.duration <= 0) {
        // Puddle extinguishes with a puff of smoke
        for (let k = 0; k < 6; k++) {
          this.spawnDust(p.x + (Math.random() - 0.5) * 2, p.y + 0.2, p.z + (Math.random() - 0.5) * 2, 0x64748b);
        }
        this.levelRoot.remove(p.group);
        this.bimberFirePuddles.splice(i, 1);
      }
    }
  }

  private defeatEnemy(e: EnemyItem, points: number, showToast: boolean = true) {
    if (e.state === 'defeated') return;
    e.state = 'defeated';
    e.mesh.visible = false;
    const hitStopDur = (e.type === 'walczak' || e.type === 'krol_leto') ? 0.22 : 0.05;
    this.triggerHitStop(hitStopDur);

    // Combo streak calculation
    this.comboStreak++;
    this.comboTimer = this.charDef.id === 'mateusz' ? 5.5 : 3.8;
    const comboMultiplier = 1 + (this.comboStreak - 1) * 0.25;
    const finalPoints = Math.round(points * comboMultiplier);
    this.score += finalPoints;
    this.handleMateuszPassive(2);

    if (showToast) {
      this.emitFloatingToast(`+${finalPoints} Pkt Neutralizacja!`, e.x, e.y + 1, e.z, 'points');
    }

    if (this.comboStreak >= 2) {
      const comboMsg =
        this.comboStreak >= 5
          ? `👑 LEGENDARNY KIEROWNIK x${this.comboStreak}!`
          : this.comboStreak >= 4
            ? `⚡⚡ SAKRAMENCKI FLOW x${this.comboStreak}!`
            : this.comboStreak >= 3
              ? `🔥🔥 WŚCIEKŁY MAGAZYNIER x${this.comboStreak}!`
              : `🔥 COMBO x${this.comboStreak}!`;
      this.emitFloatingToast(comboMsg, e.x, e.y + 1.6, e.z, 'combo');
    }

    this.callbacks.onScoreUpdate(this.score, this.collectedVipCount, this.totalVipCount);

    // In-world Perk Drop (Perki dropione na mapie z wrogów!)
    const dropChance =
      this.charDef.id === 'piotr'
        ? 1.0
        : e.type === 'walczak' || e.maxHp >= 4
          ? 1.0
          : 0.48;

    if (Math.random() <= dropChance) {
      this.spawnDroppedPerk(e.x, e.y + 0.1, e.z);
    }

    if (e.type === 'walczak' || e.maxHp >= 4) {
      this.callbacks.onBossUpdate?.(e.name, 0, e.maxHp, false);
      this.sayQuote('BYŁY KIEROWNIK WALCZAK ZANEUTRALIZOWANY! Droga wolna!');

      // Intense long screen shake for boss defeat!
      this.triggerScreenShake(2.2, 1.25);

      this.spawnParticleRing(e.x, e.y + 1.0, e.z, 0xef4444);
      this.spawnParticleRing(e.x, e.y + 1.5, e.z, 0xf59e0b);
      this.spawnParticleRing(e.x, e.y + 2.0, e.z, 0x3b82f6);

      const geo = new THREE.TorusGeometry(1.2, 0.18, 16, 48);
      const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(e.x, e.y + 0.5, e.z);
      this.levelRoot.add(mesh);
      this.specialEffects.push({ mesh, life: 1.2, maxLife: 1.2, grow: 12.0, spin: 15.0 });
    } else {
      // Mild screen shake for regular enemies
      this.triggerScreenShake(0.35, 0.25);
    }
  }

  private takeDamage(reason: string, amount: number = 1) {
    if (this.invulnerableTimer > 0) return;

    if (this.marcinReclamationTimer > 0) {
      this.triggerScreenShake(0.2, 0.2);
      return;
    }

    if (this.activePerks.shield) {
      this.activePerks.shield = false;
      this.invulnerableTimer = 1.2;
      sound.playShieldBreak();
      this.sayQuote('Kask BHP amortyzował uderzenie!');
      this.spawnParticleRing(this.playerPos.x, this.playerPos.y + 1, this.playerPos.z, 0x3b82f6);
      this.callbacks.onPerksUpdate?.(this.activePerks);
      this.triggerScreenShake(0.4, 0.3);
      return;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 1.8;
    sound.playHit();
    this.triggerBloomPulse(0.45);
    this.callbacks.onHpUpdate(this.hp, this.maxHp);

    // Screen Shake on damage received by player!
    this.triggerScreenShake(0.9, 0.5);

    if (this.hp <= 0) {
      this.state = 'gameover';
      sound.stopMusic();
      sound.playGameOver();
      this.callbacks.onGameOver(reason);
    }
  }

  private checkLevelFinish() {
    if (this.state !== 'playing') return;

    if (this.collectedVipCount < this.totalVipCount) {
      if (this.finishWarningTimer <= 0) {
        this.finishWarningTimer = 2.5;
        const remaining = this.totalVipCount - this.collectedVipCount;
        this.sayQuote(`BHP Magazynu: Zbierz jeszcze ${remaining} brakujących zamówień VIP przed odjazdem!`);
        this.emitFloatingToast(`📦 BRAKUJE ${remaining} VIP!`, this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 'vip');
        sound.playHit();
      }
      return;
    }

    this.state = 'victory';
    sound.stopMusic();
    sound.playWin();
    const elapsed = Math.max(1, Math.round((performance.now() - this.levelStartTime) / 1000));
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
    this.callbacks.onLevelComplete(this.currentLevelId, this.score, timeStr);
  }

  private spawnDust(x: number, y: number, z: number, color = 0xd1d5db) {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.1, z);
    this.levelRoot.add(mesh);
    this.particles.push({
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 0.8 + 0.2, (Math.random() - 0.5) * 1.5),
      life: 0.4,
      maxLife: 0.4,
    });
  }

  private spawnParticleRing(x: number, y: number, z: number, color = 0x38bdf8) {
    const num = 16;
    for (let i = 0; i < num; i++) {
      const angle = (i / num) * Math.PI * 2;
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.levelRoot.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * 4.5, Math.random() * 1.2, Math.sin(angle) * 4.5),
        life: 0.6,
        maxLife: 0.6,
      });
    }
  }

  private sayQuote(quote: string) {
    this.speechBubbleTimer = 3.5;
    this.callbacks.onSpeechBubble(quote);
  }

  private sayRandomVoiceLine() {
    if (this.charDef.voiceLines && this.charDef.voiceLines.length > 0) {
      const idx = Math.floor(Math.random() * this.charDef.voiceLines.length);
      this.sayQuote(this.charDef.voiceLines[idx]);
    }
  }

  private updateCamera(dt: number) {
    if (this.state === 'title') {
      const t = performance.now() * 0.0004;
      this.camera.position.x = Math.sin(t) * 16;
      this.camera.position.y = 8 + Math.cos(t * 0.5) * 2;
      this.camera.position.z = Math.cos(t) * 16;
      this.camera.lookAt(0, 2, 0);
      return;
    }

    // Determine target positions with smooth velocity look-ahead
    const velLookAheadX = THREE.MathUtils.clamp(this.playerVel.x * 0.18, -2.5, 2.5);
    const velLookAheadZ = THREE.MathUtils.clamp(this.playerVel.z * 0.18, -2.5, 2.5);
    const targetX = this.playerPos.x + velLookAheadX;
    const targetZ = this.playerPos.z + velLookAheadZ;

    // Smooth vertical tracking: dampen camera Y so jumping doesn't violently bounce the screen
    const targetGroundY = this.isGrounded ? this.playerPos.y : this.smoothCamY;
    this.smoothCamY = THREE.MathUtils.damp(this.smoothCamY, targetGroundY, this.isGrounded ? 8.0 : 2.4, dt);
    const targetY = this.smoothCamY;

    // Check if an active boss is nearby to dynamically pull camera out slightly for tactical awareness
    const activeBoss = this.enemies.find((e) => (e.type === 'walczak' || e.type === 'krol_leto') && e.state !== 'defeated');
    let targetBossZoom = 1.0;
    if (activeBoss) {
      const bossDist = Math.hypot(activeBoss.x - this.playerPos.x, activeBoss.z - this.playerPos.z);
      if (bossDist < 20) {
        targetBossZoom = 1.18;
      }
    }
    this.bossCamZoom = THREE.MathUtils.damp(this.bossCamZoom, targetBossZoom, 2.5, dt);

    // Target offsets for camera modes:
    // Close: immersive wide action view (X=4.5, Y=8.0, Z=8.5)
    // Iso: wide-angle warehouse tactical overview (X=9.0, Y=16.0, Z=15.0)
    const zoomMultiplier = this.bossCamZoom * this.camZoomFactor;
    const targetOffsetX = (this.cameraMode === 'iso' ? 9.0 : 4.5) * zoomMultiplier;
    const targetOffsetY = (this.cameraMode === 'iso' ? 16.0 : 8.0) * zoomMultiplier;
    const targetOffsetZ = (this.cameraMode === 'iso' ? 15.0 : 8.5) * zoomMultiplier;

    // Smoothly interpolate camera offset between modes
    this.currentCamOffset.x = THREE.MathUtils.damp(this.currentCamOffset.x, targetOffsetX, 4.5, dt);
    this.currentCamOffset.y = THREE.MathUtils.damp(this.currentCamOffset.y, targetOffsetY, 4.5, dt);
    this.currentCamOffset.z = THREE.MathUtils.damp(this.currentCamOffset.z, targetOffsetZ, 4.5, dt);

    const camTarget = new THREE.Vector3(
      targetX + this.currentCamOffset.x,
      targetY + this.currentCamOffset.y,
      targetZ + this.currentCamOffset.z
    );

    let shakeX = 0;
    let shakeY = 0;
    let shakeZ = 0;

    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
      const progress = Math.max(0, this.screenShakeTimer / Math.max(0.001, this.screenShakeDuration));
      const currentIntensity = this.screenShakeIntensity * Math.pow(progress, 1.2);

      shakeX = (Math.random() - 0.5) * currentIntensity * 2.2;
      shakeY = (Math.random() - 0.5) * currentIntensity * 2.2;
      shakeZ = (Math.random() - 0.5) * currentIntensity * 2.2;

      // DOM container shake transform
      if (this.container) {
        const domPxX = (Math.random() - 0.5) * currentIntensity * 28;
        const domPxY = (Math.random() - 0.5) * currentIntensity * 28;
        const domDeg = (Math.random() - 0.5) * currentIntensity * 3.5;
        this.container.style.transform = `translate3d(${domPxX.toFixed(1)}px, ${domPxY.toFixed(1)}px, 0px) rotate(${domDeg.toFixed(2)}deg)`;
      }

      if (this.screenShakeTimer <= 0) {
        this.screenShakeIntensity = 0;
        if (this.container) {
          this.container.style.transform = '';
        }
      }
    } else if (this.cameraShake > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShake;
      shakeY = (Math.random() - 0.5) * this.cameraShake;
      shakeZ = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
      if (this.container && this.container.style.transform !== '') {
        this.container.style.transform = '';
      }
    } else {
      if (this.container && this.container.style.transform !== '') {
        this.container.style.transform = '';
      }
    }

    camTarget.x += shakeX;
    camTarget.y += shakeY;
    camTarget.z += shakeZ;

    // Smooth camera position follow
    this.camera.position.lerp(camTarget, dt * 6.5);

    // Smooth lookAt target leading slightly in velocity direction
    const desiredLookAt = new THREE.Vector3(
      this.playerPos.x + velLookAheadX * 0.4 + shakeX * 0.3,
      this.smoothCamY + 0.85 + shakeY * 0.3,
      this.playerPos.z + velLookAheadZ * 0.4 + shakeZ * 0.3
    );
    this.currentLookAt.lerp(desiredLookAt, dt * 7.5);
    this.camera.lookAt(this.currentLookAt);

    if (this.dirLight) {
      this.dirLight.position.set(this.playerPos.x + 14, 28, this.playerPos.z + 12);
      this.dirLight.target.position.copy(this.playerPos);
      this.dirLight.target.updateMatrixWorld();
    }
    if (this.rimLight) {
      this.rimLight.position.set(this.playerPos.x - 18, 12, this.playerPos.z - 18);
    }
  }

  public getPlayerPos(): THREE.Vector3 {
    return this.playerPos.clone();
  }

  public getScore(): number {
    return this.score;
  }

  public getCollectedVipCount(): number {
    return this.collectedVipCount;
  }

  public getElapsedSeconds(): number {
    return Math.max(1, Math.round((performance.now() - this.levelStartTime) / 1000));
  }

  public isBossDefeated(): boolean {
    return this.enemies.some((e) => e.type === 'walczak' && e.state === 'defeated');
  }

  public getActivePerks(): ActivePerks {
    return { ...this.activePerks };
  }

  public activatePerk(perkId: 'hardhat' | 'vibram_boots' | 'order_magnet' | 'espresso_boost', duration: number = 20): boolean {
    if (perkId === 'hardhat') {
      this.activePerks.shield = true;
      sound.playPerkPickup();
      this.sayQuote('Założono atestowany kask BHP!');
    } else if (perkId === 'vibram_boots') {
      this.activePerks.doubleJump = Math.max(this.activePerks.doubleJump, duration);
      sound.playDoubleJump();
      this.sayQuote('Buty robocze Vibram: podwójny skok w powietrzu aktywny!');
    } else if (perkId === 'order_magnet') {
      this.activePerks.magnet = Math.max(this.activePerks.magnet, duration);
      sound.playMagnetHum();
      this.sayQuote('Skaner radiowy przyciąga zamówienia!');
    } else if (perkId === 'espresso_boost') {
      this.activePerks.speedBoost = Math.max(this.activePerks.speedBoost, duration);
      sound.playPerkPickup();
      this.sayQuote('Podwójne espresso: sprint po korytarzu!');
    }

    this.callbacks.onPerksUpdate?.(this.activePerks);
    return true;
  }

  private handleMateuszPassive(amount: number) {
    if (this.currentCharacterId !== 'mateusz') return;
    this.mateuszPassiveCount += amount;
    if (this.mateuszPassiveCount >= 9) {
      this.mateuszPassiveCount -= 9;
      this.activatePerk('espresso_boost', 3);
      this.invulnerableTimer = Math.max(this.invulnerableTimer, 3);
      this.sayQuote('UMOWA NA 9 MIESIĘCY! Speedrun aktywowany!');
      this.emitFloatingToast('🚀 SPEEDRUN CONTRACT!', this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 'combo');
      this.spawnParticleRing(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z, 0xffffff);
    }
  }

  public renderMinimap(canvas: HTMLCanvasElement | null) {
    if (!canvas || this.state !== 'playing' || !this.minimapVisible) return;
    
    this.minimapFrameCounter++;
    if (this.minimapFrameCounter % 2 !== 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // High-tech radar dark background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const scale = this.minimapZoomScale;

    // Concentric grid rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, w * 0.22, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, w * 0.42, 0, Math.PI * 2);
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, h);
    ctx.moveTo(0, centerY); ctx.lineTo(w, centerY);
    ctx.stroke();

    // 1. Level Platforms & Aisle Boundaries
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      const dx = (p.x - this.playerPos.x) * scale;
      const dz = (p.z - this.playerPos.z) * scale;
      const pw = Math.max(3, p.width * scale);
      const pd = Math.max(3, p.depth * scale);

      const mx = centerX + dx - pw / 2;
      const my = centerY + dz - pd / 2;

      if (mx + pw >= 0 && mx <= w && my + pd >= 0 && my <= h) {
        ctx.fillRect(mx, my, pw, pd);
        ctx.strokeRect(mx, my, pw, pd);
      }
    }

    // 2. Collectibles & VIP Orders
    for (let i = 0; i < this.collectibles.length; i++) {
      const col = this.collectibles[i];
      if (col.collected) continue;
      const dx = (col.x - this.playerPos.x) * scale;
      const dz = (col.z - this.playerPos.z) * scale;
      const mx = centerX + dx;
      const my = centerY + dz;

      if (mx >= 0 && mx <= w && my >= 0 && my <= h) {
        ctx.fillStyle = col.type === 'vip_item' || col.type === 'golden_cutter' ? '#f59e0b' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(mx, my, col.type === 'vip_item' ? 4.5 : 3.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Dropped Perk Crates
    for (let i = 0; i < this.droppedPerks.length; i++) {
      const perk = this.droppedPerks[i];
      if (perk.collected) continue;
      const dx = (perk.x - this.playerPos.x) * scale;
      const dz = (perk.z - this.playerPos.z) * scale;
      const mx = centerX + dx;
      const my = centerY + dz;

      if (mx >= 0 && mx <= w && my >= 0 && my <= h) {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(mx, my, 4.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Exit Gate (WYJŚCIE 🏁)
    if (this.finishGatePos) {
      const dx = (this.finishGatePos.x - this.playerPos.x) * scale;
      const dz = (this.finishGatePos.z - this.playerPos.z) * scale;
      const mx = centerX + dx;
      const my = centerY + dz;

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(mx, my, 6.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.font = '900 9px Google Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WYJŚCIE 🏁', mx, my - 8);
    }

    // 5. Enemies (Red markers / Alert Exclamation)
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.state === 'defeated') continue;
      const dx = (e.x - this.playerPos.x) * scale;
      const dz = (e.z - this.playerPos.z) * scale;
      const mx = centerX + dx;
      const my = centerY + dz;

      if (mx >= -10 && mx <= w + 10 && my >= -10 && my <= h + 10) {
        const isBoss = e.type === 'walczak' || e.type === 'krol_leto';
        ctx.fillStyle = isBoss ? '#ef4444' : e.state === 'chase' || e.state === 'charging' ? '#ff4d4d' : '#f43f5e';
        const size = isBoss ? 6.5 : 4.0;

        ctx.beginPath();
        ctx.arc(mx, my, size, 0, Math.PI * 2);
        ctx.fill();

        if (isBoss) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (e.state === 'chase' || e.state === 'charging') {
          ctx.fillStyle = '#facc15';
          ctx.font = '900 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('!', mx, my - size - 2);
        }
      }
    }

    // 6. Player Marker (Centered with direction indicator)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.playerRot);

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Radar scan line effect
    const sweep = (performance.now() * 0.0025) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(sweep) * (w * 0.45), centerY + Math.sin(sweep) * (h * 0.45));
    ctx.stroke();
  }
}
