export type CharacterId = 'marcin' | 'grzesiek' | 'dawid' | 'mateusz' | 'piotr';

export interface CharacterStats {
  speed: number;    // 1-5 scale
  jump: number;     // 1-5 scale
  power: number;    // 1-5 scale
  defense: number;  // 1-5 scale
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  role: string;
  title: string;
  color: number;
  secondaryColor: number;
  speed: number;
  jumpForce: number;
  abilityName: string;
  abilityDescription: string;
  abilityCooldown: number; // in seconds
  passiveName: string;
  passiveDescription: string;
  voiceLines: string[];
  bio: string;
  stats: CharacterStats;
}

export type CollectibleType =
  | 'grout'
  | 'tile_box'
  | 'coffee'
  | 'vip_item'
  | 'espresso'
  | 'magnet'
  | 'golden_cutter'
  | 'carrara'
  | 'easter_egg';

export interface CollectibleItem {
  id: string;
  type: CollectibleType;
  name: string;
  x: number;
  y: number;
  z: number;
  mesh?: any;
  collected: boolean;
  points: number;
}

export type EnemyType =
  | 'customer'
  | 'walczak'
  | 'forklift'
  | 'architect'
  | 'inspector'
  | 'agv_robot'
  | 'handlowiec'
  | 'monter'
  | 'piorun_dron'
  | 'elite_walczak_guard'
  | 'kurier'
  | 'przedstawiciel_włoski'
  | 'sztaplar_szalony'
  | 'krol_leto';

export interface EnemyItem {
  id: string;
  type: EnemyType;
  name: string;
  mesh?: any;
  speechMesh?: any;
  x: number;
  y: number;
  z: number;
  startX: number;
  endX: number;
  speed: number;
  dir: number;
  hp: number;
  maxHp: number;
  state: 'patrol' | 'chase' | 'searching' | 'stunned' | 'defeated' | 'charging';
  lastKnownPlayerPos?: { x: number; z: number } | null;
  searchTimer?: number;
  stunTimer: number;
  shoutTimer: number;
  shoutText: string;
  attackCooldown: number;
  walkCycle: number;
  legL?: any;
  legR?: any;
  armL?: any;
  armR?: any;
  specialActionTimer?: number;
  bossPhase?: number;
  chargeDir?: number;
  chargeTimer?: number;
  shieldActive?: boolean;
  onFireTimer?: number;
  alerted?: boolean;
  hpBar?: any;
  hpFill?: any;
}

export interface HazardItem {
  id: string;
  type: 'forklift' | 'spill' | 'steam_faucet' | 'falling_lamp' | 'conveyor';
  mesh?: any;
  startX: number;
  startZ: number;
  endX?: number;
  endZ?: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  width: number;
  length: number;
  dir: number;
  active: boolean;
}

export interface PlatformBlock {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  type: 'floor' | 'shelf' | 'pallet' | 'bathtub' | 'conveyor' | 'ramp' | 'finish_truck' | 'scaffold';
  bounce?: number;
  mesh?: any;
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  targetItemsRequired: number;
  spawnPoint: { x: number; y: number; z: number };
  exitPoint: { x: number; y: number; z: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  dialogueQuote: string;
}

export type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export interface ActivePerks {
  doubleJump: number;   // remaining duration in seconds (>0 enables 2nd jump)
  shield: boolean;      // Foreman hardhat 1-hit invulnerability
  magnet: number;       // remaining duration in seconds
  speedBoost: number;   // remaining duration in seconds
}

export type PerkType = 'hardhat' | 'vibram_boots' | 'order_magnet' | 'espresso_boost';

export interface PerkDef {
  id: PerkType;
  name: string;
  description: string;
  icon: string;
  color: number;
  duration?: number;
}

export interface DroppedPerkItem {
  id: string;
  perkId: PerkType;
  name: string;
  icon: string;
  color: number;
  x: number;
  y: number;
  z: number;
  initialY: number;
  mesh: any;
  collected: boolean;
  life: number;
  duration: number;
  beacon?: any;
}

export const AVAILABLE_PERKS: PerkDef[] = [
  {
    id: 'hardhat',
    name: 'Atestowany Kask BHP',
    description: 'Tarcza ochronna na 1 bezpośrednie trafienie od wściekłego klienta, inspektora lub kary Walczaka.',
    icon: '⛑️',
    color: 0x3b82f6,
  },
  {
    id: 'vibram_boots',
    name: 'Buty Magazynowe Vibram',
    description: 'Umożliwia podwójny skok w powietrzu, pozwalając wspinać się na najwyższe regały wysokiego składu.',
    icon: '👟',
    color: 0x10b981,
    duration: 25,
  },
  {
    id: 'order_magnet',
    name: 'Radiowy Magnes Zamówień',
    description: 'Przyciąga wszystkie palety, WZ-tki, kleje i próbki marmuru z odległości aż 9 metrów!',
    icon: '🧲',
    color: 0x8b5cf6,
    duration: 20,
  },
  {
    id: 'espresso_boost',
    name: 'Podwójne Espresso z Showroomu',
    description: 'Maksymalny zryw prędkości (+65%) i natychmiastowa gotowość do omijania wózków i palet.',
    icon: '☕',
    color: 0xf59e0b,
    duration: 18,
  },
];

