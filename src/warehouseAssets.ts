import * as THREE from 'three';
import { CharacterDef } from './types.ts';

// Cached procedural textures
let floorTexture: THREE.CanvasTexture | null = null;
let showroomMarbleTexture: THREE.CanvasTexture | null = null;
let showroomWallTexture: THREE.CanvasTexture | null = null;
let terminalGraniteTexture: THREE.CanvasTexture | null = null;
let maxFlizSignTexture: THREE.CanvasTexture | null = null;
let tileBoxTexture: THREE.CanvasTexture | null = null;
let marbleTextures: Record<string, THREE.CanvasTexture> = {};
let hazardStripeTexture: THREE.CanvasTexture | null = null;
let stretchWrapTexture: THREE.CanvasTexture | null = null;
let wallTexture: THREE.CanvasTexture | null = null;

/**
 * 1. Ultra High-Res Polished Epoxy Warehouse Floor
 */
export function getFloorTexture(): THREE.CanvasTexture {
  if (floorTexture) return floorTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Polished dark slate epoxy base
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, 1024, 1024);

  // Large polished concrete slab joints
  ctx.strokeStyle = '#141822';
  ctx.lineWidth = 4;
  const gridSize = 128;
  for (let x = 0; x <= 1024; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Green Pedestrian Safety Corridor
  ctx.fillStyle = 'rgba(22, 163, 74, 0.45)';
  ctx.fillRect(180, 0, 160, 1024);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 4;
  ctx.strokeRect(180, 0, 160, 1024);

  // Corridor Floor Stencil Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Segoe UI", Roboto, sans-serif';
  ctx.save();
  ctx.translate(260, 320);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ALEJA KOMPLETACJI • MAX-FLIZ', 0, 0);
  ctx.restore();

  // Forklift Zebra Crossing
  for (let y = 400; y < 620; y += 40) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(180, y, 160, 20);
  }

  // Realistic tire skid marks
  ctx.strokeStyle = 'rgba(10, 13, 20, 0.5)';
  ctx.lineWidth = 8;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    const sx = Math.random() * 800 + 100;
    const sy = Math.random() * 800 + 100;
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + (Math.random() - 0.5) * 200, sy + (Math.random() - 0.5) * 200, sx + (Math.random() - 0.5) * 350, sy + (Math.random() - 0.5) * 350);
    ctx.stroke();
  }

  // Perimeter Hazard Line
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 0, 1024, 20);
  ctx.fillRect(0, 1004, 1024, 20);
  ctx.fillRect(0, 0, 20, 1024);
  ctx.fillRect(1004, 0, 20, 1024);

  floorTexture = new THREE.CanvasTexture(canvas);
  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  return floorTexture;
}

/**
 * 2. Corrugated Industrial Warehouse Wall Texture
 */
export function getWallTexture(): THREE.CanvasTexture {
  if (wallTexture) return wallTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 256);

  // Ribbed steel cladding panels
  for (let x = 0; x < 512; x += 16) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, 0, 4, 256);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4, 0, 4, 256);
  }

  // Safety sign stencils
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(200, 80, 112, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BHP MAX-FLIZ', 256, 105);

  wallTexture = new THREE.CanvasTexture(canvas);
  wallTexture.colorSpace = THREE.SRGBColorSpace;
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  return wallTexture;
}

/**
 * 2b. Ultra-Luxury Calacatta Gold & Carrara Marble Floor (Showroom Sektor 2)
 * High-end Italian porcelain stoneware with polished brass joints & warm ambient tone
 */
export function getShowroomMarbleFloorTexture(): THREE.CanvasTexture {
  if (showroomMarbleTexture) return showroomMarbleTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Warm alabaster / ivory base
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  bgGrad.addColorStop(0, '#fdfbf7');
  bgGrad.addColorStop(0.5, '#f5efe6');
  bgGrad.addColorStop(1, '#f9f6f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Large format 256x256 slabs (120x120 cm scale)
  const tileSize = 256;
  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      // Subtle porcelain tone variation per slab
      const slabGrad = ctx.createRadialGradient(x + 128, y + 128, 20, x + 128, y + 128, 170);
      slabGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      slabGrad.addColorStop(0.85, 'rgba(240, 233, 222, 0.25)');
      slabGrad.addColorStop(1, 'rgba(218, 207, 192, 0.35)');
      ctx.fillStyle = slabGrad;
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // 3. Organic Calacatta Gold & Grey Veining
  const drawVein = (startX: number, startY: number, endX: number, endY: number, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 80;
    const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 80;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    // Branching offshoot
    if (Math.random() > 0.4) {
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.quadraticCurveTo(
        midX + (Math.random() - 0.5) * 60,
        midY + (Math.random() - 0.5) * 60,
        midX + (Math.random() - 0.5) * 110,
        midY + (Math.random() - 0.5) * 110
      );
      ctx.stroke();
    }
  };

  // Warm Gold veins
  for (let i = 0; i < 16; i++) {
    const sx = Math.random() * 1024;
    const sy = Math.random() * 1024;
    drawVein(sx, sy, sx + (Math.random() - 0.5) * 360, sy + (Math.random() - 0.5) * 360, 'rgba(212, 175, 55, 0.32)', 2.8);
    drawVein(sx + 1, sy + 1, sx + (Math.random() - 0.5) * 280, sy + (Math.random() - 0.5) * 280, 'rgba(245, 158, 11, 0.18)', 1.4);
  }

  // Subtle Silver-Grey veins
  for (let i = 0; i < 14; i++) {
    const sx = Math.random() * 1024;
    const sy = Math.random() * 1024;
    drawVein(sx, sy, sx + (Math.random() - 0.5) * 300, sy + (Math.random() - 0.5) * 300, 'rgba(148, 163, 184, 0.28)', 2.0);
  }

  // 4. Central Decorative Inlay Runway (Nero Marquina & Gold Medallions)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(384, 0, 256, 1024);

  // Gold borders of runner
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(384, 0, 256, 1024);

  // Inlaid Gold Diamond Medallions
  for (let y = 64; y < 1024; y += 128) {
    ctx.save();
    ctx.translate(512, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.fillRect(-22, -22, 44, 44);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-16, -16, 32, 32);
    ctx.restore();
  }

  // Luxury Gold Showroom Inscription
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(512, 512);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('MAX-FLIZ SHOWROOM • STREFA WANNY & SPA', 0, -4);
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
  ctx.fillText('COLLEZIONE ITALIANA • CERAMICA DI LUSSO', 0, 20);
  ctx.restore();

  // 5. Polished Brass Joint Grid
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.75)';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Brass cross spacers at tile corners
  ctx.fillStyle = '#fef08a';
  for (let x = 0; x <= 1024; x += tileSize) {
    for (let y = 0; y <= 1024; y += tileSize) {
      ctx.fillRect(x - 5, y - 5, 10, 10);
    }
  }

  showroomMarbleTexture = new THREE.CanvasTexture(canvas);
  showroomMarbleTexture.colorSpace = THREE.SRGBColorSpace;
  showroomMarbleTexture.wrapS = THREE.RepeatWrapping;
  showroomMarbleTexture.wrapT = THREE.RepeatWrapping;
  return showroomMarbleTexture;
}

/**
 * 2c. Architectural Warm Oak Slat Wall (Showroom Sektor 2)
 */
export function getShowroomWallTexture(): THREE.CanvasTexture {
  if (showroomWallTexture) return showroomWallTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm ivory background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  // Vertical acoustic natural oak slats
  for (let x = 0; x < 512; x += 16) {
    // Slat shadow
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 0, 3, 256);
    // Warm natural oak wood face
    const oakGrad = ctx.createLinearGradient(x + 3, 0, x + 15, 0);
    oakGrad.addColorStop(0, '#c2905b');
    oakGrad.addColorStop(0.5, '#deb887');
    oakGrad.addColorStop(1, '#a6723e');
    ctx.fillStyle = oakGrad;
    ctx.fillRect(x + 3, 0, 13, 256);
  }

  // Warm LED cove strip at top & bottom
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 0, 512, 8);
  ctx.fillRect(0, 248, 512, 8);

  // Brushed brass showroom logo plaque
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(160, 90, 192, 54);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(160, 90, 192, 54);

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 16px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAX-FLIZ SHOWROOM', 256, 115);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('GALERIA WNĘTRZ & ŁAZIENEK', 256, 132);

  showroomWallTexture = new THREE.CanvasTexture(canvas);
  showroomWallTexture.colorSpace = THREE.SRGBColorSpace;
  showroomWallTexture.wrapS = THREE.RepeatWrapping;
  showroomWallTexture.wrapT = THREE.RepeatWrapping;
  return showroomWallTexture;
}

/**
 * 2d. Heavy-Duty Logistics Terminal Granite Floor (Sektor 3)
 */
export function getTerminalGraniteFloorTexture(): THREE.CanvasTexture {
  if (terminalGraniteTexture) return terminalGraniteTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark flamed granite base
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Granite stone slabs 128x128
  const tileSize = 128;
  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      const v = (x * 17 + y * 23) % 20;
      ctx.fillStyle = `rgb(${16 + v}, ${24 + v}, ${38 + v})`;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    }
  }

  // Cyan glowing central AGV / Runway guide tracks
  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.fillRect(480, 0, 64, 1024);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(480, 0, 64, 1024);

  // Glowing center dashed strip
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 6;
  ctx.setLineDash([24, 18]);
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.stroke();
  ctx.setLineDash([]);

  // High-hazard docking chevrons
  for (let y = 60; y < 1024; y += 180) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(60, y, 160, 24);
    ctx.fillRect(804, y, 160, 24);
  }

  // Runway docking stencil
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(512, 512);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('TERMINAL EKSPEDYCJI • DOK B4 GŁÓWNY', 0, -4);
  ctx.restore();

  terminalGraniteTexture = new THREE.CanvasTexture(canvas);
  terminalGraniteTexture.colorSpace = THREE.SRGBColorSpace;
  terminalGraniteTexture.wrapS = THREE.RepeatWrapping;
  terminalGraniteTexture.wrapT = THREE.RepeatWrapping;
  return terminalGraniteTexture;
}

/**
 * 2e. Luxury Raised Showroom Display Podium with Warm LED Cove Skirt
 */
export function createDisplayPodium(width = 3.4, depth = 2.2, height = 0.22): THREE.Group {
  const group = new THREE.Group();
  group.name = 'showroom_podium';

  // White Carrara Marble Top Slab
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.12,
    metalness: 0.1,
  });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), topMat);
  slab.position.y = height / 2;
  slab.castShadow = true;
  slab.receiveShadow = true;

  // Brushed Brass Edge Trim
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.2,
  });
  const trim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.04, depth + 0.04), brassMat);
  trim.position.y = height - 0.02;

  // Recessed Warm LED Cove Light Skirt
  const ledMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });
  const ledSkirt = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.04, depth - 0.1), ledMat);
  ledSkirt.position.y = 0.02;

  group.add(slab, trim, ledSkirt);
  return group;
}

/**
 * 2f. Modern Architectural Glass Partition Screen with Brass Clamps
 */
export function createGlassPartition(width = 3.0, height = 2.5): THREE.Group {
  const group = new THREE.Group();
  group.name = 'glass_partition';

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.8,
    roughness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const brassClampMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.15,
  });

  // Vertical Posts
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height, 16), frameMat);
  postL.position.set(-width / 2, height / 2, 0);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height, 16), frameMat);
  postR.position.set(width / 2, height / 2, 0);

  // Top header bar
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.05), frameMat);
  topBar.position.set(0, height, 0);

  // Translucent Tempered Glass Pane
  const glass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, height - 0.15, 0.02), glassMat);
  glass.position.set(0, height / 2, 0);

  // Brass Mounting Clamps
  [-width / 2 + 0.08, width / 2 - 0.08].forEach((cx) => {
    [0.4, height - 0.4].forEach((cy) => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.06), brassClampMat);
      clamp.position.set(cx, cy, 0);
      group.add(clamp);
    });
  });

  group.add(postL, postR, topBar, glass);
  return group;
}

/**
 * 2g. Large Sculptural Ceramic Planter with Lush Greenery
 */
export function createShowroomPlant(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'showroom_plant';

  // White geometric ceramic pot
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.05,
  });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.75, 24), potMat);
  pot.position.y = 0.375;
  pot.castShadow = true;
  group.add(pot);

  // Dark organic potting soil
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 });
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.05, 24), soilMat);
  soil.position.y = 0.74;
  group.add(soil);

  // 8 Sculpted Monstera / Ficus Leaves
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.25,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), leafMat);
    stem.position.set(0, 0.74, 0);
    stem.rotation.y = angle;
    stem.rotation.z = 0.5 + (i % 3) * 0.12;

    const leafGeo = new THREE.SphereGeometry(0.22, 12, 8);
    leafGeo.scale(0.8, 1.4, 0.08);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, 0.45, 0);
    leaf.rotation.x = 0.4;
    stem.add(leaf);
    group.add(stem);
  }

  return group;
}

/**
 * 2h. Overhead Track Lighting Rig with Directional Downlight Cones
 */
export function createTrackSpotlights(length = 6.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'track_spotlights';

  const trackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
  const spotMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

  // Black ceiling track
  const track = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.08), trackMat);
  group.add(track);

  // 4 Spot fixtures along the track
  const numSpots = 4;
  for (let i = 0; i < numSpots; i++) {
    const sx = -length / 2 + (length / (numSpots + 1)) * (i + 1);
    const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.16, 16), spotMat);
    spot.rotation.x = 0.25 * ((i % 2 === 0) ? 1 : -1);
    spot.position.set(sx, -0.1, 0);

    const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 16), glowMat);
    bulb.position.y = -0.07;
    spot.add(bulb);
    group.add(spot);
  }

  return group;
}

/**
 * 3. Max-Fliz Brand Showroom Signboard
 */
export function getMaxFlizLogoTexture(): THREE.CanvasTexture {
  if (maxFlizSignTexture) return maxFlizSignTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Deep luxury sapphire navy
  const grad = ctx.createLinearGradient(0, 0, 512, 160);
  grad.addColorStop(0, '#0b1329');
  grad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  // Gold luxury border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  // Subtly bevelled inner border
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 488, 136);

  // Logo Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 12;
  ctx.fillText('MAX - FLIZ', 256, 68);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#f59e0b';
  ctx.font = '700 20px "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('SALON & CENTRUM LOGISTYCZNE', 256, 106);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '13px sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('GRESY WIELKOFORMATOWE • ARMATURA • DESIGN', 256, 134);

  maxFlizSignTexture = new THREE.CanvasTexture(canvas);
  maxFlizSignTexture.colorSpace = THREE.SRGBColorSpace;
  return maxFlizSignTexture;
}

/**
 * 4. Realistic Luxury Spanish & Italian Tiles
 */
export function getMarbleTexture(type: 'calacatta' | 'nero' | 'wood' | 'gold_mosaic' = 'calacatta'): THREE.CanvasTexture {
  if (marbleTextures[type]) return marbleTextures[type];
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (type === 'calacatta') {
    // Calacatta Gold
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    const drawVein = (color: string, width: number, startX: number, startY: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      let cx = startX;
      let cy = startY;
      for (let i = 0; i < 9; i++) {
        cx += (Math.random() - 0.42) * 90;
        cy += Math.random() * 65;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    };

    for (let i = 0; i < 6; i++) {
      drawVein('rgba(148, 163, 184, 0.45)', 5, Math.random() * 512, 0);
      drawVein('rgba(217, 119, 6, 0.4)', 3, Math.random() * 512, 0);
    }
  } else if (type === 'nero') {
    // Nero Marquina
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, 0);
      for (let j = 0; j < 8; j++) {
        ctx.lineTo(Math.random() * 512, (j + 1) * 64);
      }
      ctx.stroke();
    }
  } else if (type === 'wood') {
    // Gres Drewnopodobny
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.35)';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }
  } else {
    // Gold Hexagon Mosaic
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#fbbf24';
    const r = 32;
    for (let x = 0; x < 540; x += r * 1.7) {
      for (let y = 0; y < 540; y += r * 1.5) {
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const px = x + Math.cos(angle) * (r - 4);
          const py = y + Math.sin(angle) * (r - 4);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        if ((x + y) % 3 === 0) ctx.fill();
      }
    }
  }

  // Polished tile outer bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 506);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  marbleTextures[type] = tex;
  return tex;
}

/**
 * 5. Realistic Cardboard Box with Max-Fliz Branding Tape
 */
export function getTileBoxTexture(): THREE.CanvasTexture {
  if (tileBoxTexture) return tileBoxTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c2925b';
  ctx.fillRect(0, 0, 256, 256);

  // Corrugation texture lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.07)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Branded packing tape
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 95, 256, 42);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MAX-FLIZ GRES', 128, 124);

  // Fragile symbol
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(16, 155, 84, 75);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('UWAGA!', 58, 178);
  ctx.fillText('SZKŁO / GRES', 58, 198);
  ctx.fillText('FRAGILE', 58, 218);

  // Barcode
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(135, 165, 105, 55);
  ctx.fillStyle = '#000000';
  for (let x = 142; x < 232; x += 3.5) {
    if (Math.random() > 0.25) {
      ctx.fillRect(x, 170, Math.random() > 0.5 ? 2.5 : 1.5, 34);
    }
  }
  ctx.font = '9px monospace';
  ctx.fillText('PL-590-MF-2026', 188, 213);

  tileBoxTexture = new THREE.CanvasTexture(canvas);
  tileBoxTexture.colorSpace = THREE.SRGBColorSpace;
  return tileBoxTexture;
}

export function getHazardStripeTexture(): THREE.CanvasTexture {
  if (hazardStripeTexture) return hazardStripeTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#0f172a';
  for (let x = -64; x < 320; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 20, 0);
    ctx.lineTo(x - 12, 64);
    ctx.lineTo(x - 32, 64);
    ctx.closePath();
    ctx.fill();
  }

  hazardStripeTexture = new THREE.CanvasTexture(canvas);
  hazardStripeTexture.colorSpace = THREE.SRGBColorSpace;
  hazardStripeTexture.wrapS = THREE.RepeatWrapping;
  hazardStripeTexture.wrapT = THREE.RepeatWrapping;
  return hazardStripeTexture;
}

/**
 * 6. Composite 12+ Part Procedural Character Model
 */
export function createCharacterModel(def: CharacterDef): {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  head: THREE.Mesh;
  body: THREE.Mesh;
  accessory: THREE.Group;
  shadow: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = `character_${def.id}`;

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.55 });
  const clothesMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.5 });
  const vestMat = new THREE.MeshStandardMaterial({ color: def.secondaryColor, roughness: 0.3 });
  const silverReflectMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.6 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x3f2c1d, roughness: 0.8 }); // leather work boots

  // 1. Torso Body
  const bodyGeo = new THREE.BoxGeometry(0.36, 0.46, 0.26);
  const body = new THREE.Mesh(bodyGeo, clothesMat);
  body.position.y = 0.54;
  body.castShadow = true;
  group.add(body);

  // High-Vis Safety Vest
  const vestGeo = new THREE.BoxGeometry(0.38, 0.34, 0.28);
  const vest = new THREE.Mesh(vestGeo, vestMat);
  vest.position.y = 0.56;
  group.add(vest);

  // Silver Retro-Reflective Stripes on Vest
  const stripeH = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.04, 0.29), silverReflectMat);
  stripeH.position.y = 0.54;
  const stripeV1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.29), silverReflectMat);
  stripeV1.position.set(-0.1, 0.56, 0);
  const stripeV2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.29), silverReflectMat);
  stripeV2.position.set(0.1, 0.56, 0);
  group.add(stripeH, stripeV1, stripeV2);

  // 2. Head with Face Details
  const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.94;
  head.castShadow = true;
  group.add(head);

  // Big expressive eyes
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupil = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  [-0.07, 0.07].forEach((ex) => {
    const ew = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeWhite);
    ew.position.set(ex, 0.96, 0.135);
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.025), eyePupil);
    ep.position.set(ex, 0.96, 0.138);
    group.add(ew, ep);
  });

  // Smile / Mouth
  const smile = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.02, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x991b1b })
  );
  smile.position.set(0, 0.88, 0.135);
  group.add(smile);

  // Safety Hardhat or Cap
  if (def.id === 'marcin') {
    // White Shift Manager Helmet with badge
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 });
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), helmetMat);
    helmet.position.y = 1.08;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.38), helmetMat);
    brim.position.set(0, 1.03, 0.03);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x2563eb }));
    badge.position.set(0, 1.10, 0.165);
    group.add(helmet, brim, badge);
  } else if (def.id === 'grzesiek') {
    // Yellow Hardhat with ear defenders
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25 });
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), helmetMat);
    helmet.position.y = 1.08;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.38), helmetMat);
    brim.position.set(0, 1.03, 0.03);
    // Industrial ear defenders
    const earMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
    [-0.18, 0.18].forEach((ex) => {
      const earMuff = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), earMat);
      earMuff.rotation.z = Math.PI / 2;
      earMuff.position.set(ex, 1.05, 0);
      group.add(earMuff);
    });
    group.add(helmet, brim);
  } else if (def.id === 'dawid') {
    // Orange/Red Heavy Duty Hardhat with chin strap
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.25 });
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.15, 0.33), helmetMat);
    helmet.position.y = 1.08;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.38), helmetMat);
    brim.position.set(0, 1.03, 0.03);
    group.add(helmet, brim);
  } else if (def.id === 'mateusz') {
    // Mateusz Designer Cap backwards
    const capMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.5 });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.12, 0.30), capMat);
    cap.position.y = 1.06;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.14), capMat);
    visor.position.set(0, 1.03, -0.16);
    group.add(cap, visor);
  } else {
    // Piotr Senior Foreman Crimson Hardhat with Tactical LED Headlamp & Laser Visor
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.15 });
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.15, 0.33), helmetMat);
    helmet.position.y = 1.08;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.38), helmetMat);
    brim.position.set(0, 1.03, 0.03);
    // Tactical LED Headlamp
    const lampMount = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.05), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    lampMount.position.set(0, 1.09, 0.18);
    const ledLens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    ledLens.rotation.x = Math.PI / 2;
    ledLens.position.set(0, 1.09, 0.21);
    group.add(helmet, brim, lampMount, ledLens);
  }

  // 3. Legs & Leather Steel-toe Boots
  const legGeo = new THREE.BoxGeometry(0.13, 0.34, 0.15);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.1, 0.19, 0);
  leftLeg.castShadow = true;

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.1, 0.19, 0);
  rightLeg.castShadow = true;

  const bootGeo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.15, 0.02);
  leftLeg.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.15, 0.02);
  rightLeg.add(rightBoot);

  group.add(leftLeg, rightLeg);

  // 4. Arms & Hands
  const armGeo = new THREE.BoxGeometry(0.1, 0.36, 0.11);
  const leftArm = new THREE.Mesh(armGeo, clothesMat);
  leftArm.position.set(-0.25, 0.54, 0);
  leftArm.castShadow = true;

  const rightArm = new THREE.Mesh(armGeo, clothesMat);
  rightArm.position.set(0.25, 0.54, 0);
  rightArm.castShadow = true;

  // Hands
  const handGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(0, -0.18, 0);
  leftArm.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0, -0.18, 0);
  rightArm.add(rightHand);

  group.add(leftArm, rightArm);

  // 5. Unique Hero Signature Prop
  const accessory = new THREE.Group();
  if (def.id === 'marcin') {
    // Official WZ delivery clipboard & tablet
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.28, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.24, 0.022),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    const goldClip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.04, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
    );
    goldClip.position.y = 0.12;
    board.add(paper, goldClip);
    accessory.add(board);
    accessory.position.set(0.26, 0.52, 0.16);
    accessory.rotation.x = 0.45;
  } else if (def.id === 'grzesiek') {
    // Pallet jack tiller handle with wheels
    const tiller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7 })
    );
    const tBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x111827 })
    );
    tBar.rotation.z = Math.PI / 2;
    tBar.position.y = 0.2;
    tiller.add(tBar);
    accessory.add(tiller);
    accessory.position.set(0.28, 0.48, 0.14);
    accessory.rotation.x = 0.5;
  } else if (def.id === 'dawid') {
    // Giant Calacatta gold slab held upright
    const tile = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.54, 0.035),
      new THREE.MeshStandardMaterial({
        map: getMarbleTexture('calacatta'),
        roughness: 0.1,
        metalness: 0.1,
      })
    );
    accessory.add(tile);
    accessory.position.set(0, 0.58, 0.25);
    accessory.rotation.x = -0.15;
  } else if (def.id === 'mateusz') {
    // Mateusz steaming ceramic espresso mug
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.06, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    const coffeeInside = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16),
      new THREE.MeshBasicMaterial({ color: 0x2b1406 })
    );
    coffeeInside.position.y = 0.06;
    mug.add(coffeeInside);
    accessory.add(mug);
    accessory.position.set(0.26, 0.5, 0.18);
  } else {
    // Piotr Signature Precision Laser Level (Laserowa Poziomica Cyfrowa)
    const levelBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.08, 0.07),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 })
    );
    // Spirit level vial window in center
    const vial = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.04, 0.075),
      new THREE.MeshBasicMaterial({ color: 0x84cc16 })
    );
    levelBody.add(vial);
    // Front laser diode emitter
    const laserDiode = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    laserDiode.rotation.z = Math.PI / 2;
    laserDiode.position.set(0.23, 0, 0);
    levelBody.add(laserDiode);
    accessory.add(levelBody);
    accessory.position.set(0.28, 0.52, 0.18);
    accessory.rotation.y = 0.2;
    accessory.rotation.x = 0.3;
  }
  group.add(accessory);

  // 6. Dynamic Soft Ground Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(0.55, 0.55);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, leftLeg, rightLeg, leftArm, rightArm, head, body, accessory, shadow };
}

/**
 * 7. Industrial Forklift (Sztaplarka Zdzicha) with Working Headlights & Blinking Strobe Beacon
 */
export function createForkliftModel(color = 0xf59e0b): {
  group: THREE.Group;
  beaconLight: THREE.Mesh;
  wheels: THREE.Mesh[];
  headlights: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.name = 'forklift';

  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.3 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });

  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 0.88), bodyMat);
  chassis.position.set(0, 0.38, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // Counterweight curved back
  const counterweight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.86), darkMetal);
  counterweight.position.set(-0.52, 0.44, 0);
  counterweight.castShadow = true;
  group.add(counterweight);

  // Protective Roll-Cage Pillars
  const pillarGeo = new THREE.BoxGeometry(0.06, 1.0, 0.06);
  [
    [-0.3, 1.05, -0.36],
    [-0.3, 1.05, 0.36],
    [0.28, 1.05, -0.36],
    [0.28, 1.05, 0.36],
  ].forEach(([px, py, pz]) => {
    const p = new THREE.Mesh(pillarGeo, darkMetal);
    p.position.set(px, py, pz);
    group.add(p);
  });

  // Roll-Cage Roof with Grid Protection
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.84), darkMetal);
  roof.position.set(0, 1.55, 0);
  group.add(roof);

  // Blinking Amber Safety Strobe Beacon
  const beaconLight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 16), beaconMat);
  beaconLight.position.set(0, 1.65, 0);
  group.add(beaconLight);

  // Mast Rails & Chrome Hydraulic Lift Pistons
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.6, 0.65), darkMetal);
  mast.position.set(0.72, 0.95, 0);
  group.add(mast);

  const pistonL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), chromeMat);
  pistonL.position.set(0.72, 0.95, -0.22);
  const pistonR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), chromeMat);
  pistonR.position.set(0.72, 0.95, 0.22);
  group.add(pistonL, pistonR);

  // Steel Forks
  const fork1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.12), darkMetal);
  fork1.position.set(1.12, 0.16, -0.2);
  const fork2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.12), darkMetal);
  fork2.position.set(1.12, 0.16, 0.2);
  group.add(fork1, fork2);

  // Cargo Pallet on the forks!
  const cargoPallet = createTilePallet(1);
  cargoPallet.scale.set(0.7, 0.7, 0.7);
  cargoPallet.position.set(1.1, 0.18, 0);
  group.add(cargoPallet);

  // Working Halogen Headlights
  const headlights: THREE.Mesh[] = [];
  [-0.28, 0.28].forEach((hz) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), lightMat);
    hl.position.set(0.68, 0.85, hz);
    group.add(hl);
    headlights.push(hl);

    // Projected ground light spot
    const spot = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      })
    );
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(1.8, 0.02, hz);
    group.add(spot);
  });

  // Heavy Industrial Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.14, 24);
  wheelGeo.rotateX(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  [
    [-0.38, 0.2, 0.46],
    [-0.38, 0.2, -0.46],
    [0.38, 0.2, 0.46],
    [0.38, 0.2, -0.46],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    wheels.push(w);
    group.add(w);
  });

  return { group, beaconLight, wheels, headlights };
}

/**
 * 8. Shrink-Wrapped Pallet with Tile Boxes
 */
export function createTilePallet(tier = 1, tileType: 'calacatta' | 'nero' | 'wood' | 'gold_mosaic' = 'calacatta'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tile_pallet';

  // Wooden EUR Pallet slats
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92653a, roughness: 0.85 });
  const palletBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 1.0), woodMat);
  palletBase.position.y = 0.07;
  palletBase.castShadow = true;
  group.add(palletBase);

  // Stacked Tile Boxes
  const boxMat = new THREE.MeshStandardMaterial({ map: getTileBoxTexture(), roughness: 0.6 });
  const boxCount = tier === 1 ? 4 : 8;

  for (let i = 0; i < boxCount; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.34, 0.42), boxMat);
    const col = i % 2;
    const row = Math.floor((i % 4) / 2);
    const layer = Math.floor(i / 4);
    box.position.set(
      col === 0 ? -0.27 : 0.27,
      0.14 + 0.17 + layer * 0.35,
      row === 0 ? -0.22 : 0.22
    );
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
  }

  // Display Tile on top
  const topTile = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.04, 0.7),
    new THREE.MeshStandardMaterial({ map: getMarbleTexture(tileType), roughness: 0.15, metalness: 0.1 })
  );
  topTile.position.y = 0.14 + (tier === 1 ? 0.36 : 0.72);
  group.add(topTile);

  // Semi-transparent shrink-wrap stretch film effect
  const wrapH = tier === 1 ? 0.42 : 0.78;
  const wrap = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, wrapH, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      roughness: 0.1,
      metalness: 0.1,
    })
  );
  wrap.position.y = 0.14 + wrapH / 2;
  group.add(wrap);

  return group;
}

/**
 * 9. Luxury Freestanding Bathtub (Trampoline & Launchpad!)
 */
export function createBathtubModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'bathtub_trampoline';

  // White freestanding acrylic tub
  const tubMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.05,
  });

  const tubOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.58, 0.62, 32), tubMat);
  tubOuter.scale.set(1.4, 1, 0.82);
  tubOuter.position.y = 0.31;
  tubOuter.castShadow = true;
  group.add(tubOuter);

  // Shimmering water pool
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.05,
    metalness: 0.15,
    transparent: true,
    opacity: 0.85,
  });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 32), waterMat);
  water.scale.set(1.36, 1, 0.78);
  water.position.y = 0.54;
  group.add(water);

  // Luxury Gold Floor-Standing Mixer Faucet
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.15, metalness: 0.95 });
  const faucetPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 16), goldMat);
  faucetPipe.position.set(0.94, 0.45, 0);
  const faucetArch = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16, Math.PI), goldMat);
  faucetArch.position.set(0.82, 0.9, 0);
  faucetArch.rotation.z = Math.PI / 2;
  group.add(faucetPipe, faucetArch);

  // Glowing spring launch ring decal
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.3, 32),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.57;
  group.add(ring);

  return group;
}

/**
 * 10. High-Bay Industrial Warehouse Rack (Regał Wysokiego Składowania)
 */
export function createWarehouseRack(width = 4.0, height = 3.8, depth = 1.2): THREE.Group {
  const group = new THREE.Group();
  group.name = 'warehouse_rack';

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.45 });
  const orangeBeamMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.35, metalness: 0.4 });
  const meshDeckMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6, metalness: 0.65 });

  const halfW = width / 2;
  const halfD = depth / 2;

  // 4 Upright slotted columns
  const postGeo = new THREE.BoxGeometry(0.12, height, 0.12);
  [
    [-halfW, height / 2, -halfD],
    [-halfW, height / 2, halfD],
    [halfW, height / 2, -halfD],
    [halfW, height / 2, halfD],
  ].forEach(([x, y, z]) => {
    const post = new THREE.Mesh(postGeo, blueMat);
    post.position.set(x, y, z);
    post.castShadow = true;
    group.add(post);
  });

  // Crossbeams & Decking
  const levels = [1.2, 2.5, 3.7];
  levels.forEach((lvlY) => {
    const beamGeo = new THREE.BoxGeometry(width, 0.14, 0.08);
    const bFront = new THREE.Mesh(beamGeo, orangeBeamMat);
    bFront.position.set(0, lvlY, halfD);
    const bBack = new THREE.Mesh(beamGeo, orangeBeamMat);
    bBack.position.set(0, lvlY, -halfD);
    group.add(bFront, bBack);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, 0.05, depth - 0.08), meshDeckMat);
    deck.position.set(0, lvlY - 0.02, 0);
    deck.receiveShadow = true;
    group.add(deck);

    // Populate shelves with varied pallets of luxury goods!
    if (lvlY < 3.0) {
      const p1 = createTilePallet(1, lvlY === 1.2 ? 'calacatta' : 'nero');
      p1.scale.set(0.75, 0.75, 0.75);
      p1.position.set(-width / 3.8, lvlY, 0);
      const p2 = createTilePallet(1, lvlY === 1.2 ? 'wood' : 'gold_mosaic');
      p2.scale.set(0.75, 0.75, 0.75);
      p2.position.set(width / 3.8, lvlY, 0);
      group.add(p1, p2);
    }
  });

  return group;
}

/**
 * 11. Collectible Golden Grout (Złota Fuga)
 */
export function createGroutCollectible(): THREE.Group {
  const group = new THREE.Group();

  const geo = new THREE.OctahedronGeometry(0.24, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.1,
    metalness: 0.95,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  group.add(mesh);

  // Sparkling orbital ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.02, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  ring.rotation.x = Math.PI / 4;
  group.add(ring);

  return group;
}

/**
 * 12. Max-Fliz VIP Delivery Van (Sprinter Style Finish Goal)
 */
export function createDeliveryVan(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'delivery_truck';

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.3 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const signMat = new THREE.MeshStandardMaterial({ map: getMaxFlizLogoTexture(), roughness: 0.35 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.9 });

  // Main Cargo Box
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 1.5), signMat);
  box.position.set(-0.2, 1.15, 0);
  box.castShadow = true;
  group.add(box);

  // Cabin
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 1.4), bodyMat);
  cab.position.set(1.55, 1.0, 0);
  cab.castShadow = true;
  group.add(cab);

  // Windshield & Side Windows
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.7 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 1.25), glassMat);
  windshield.position.set(1.92, 1.2, 0);
  group.add(windshield);

  // Chrome Grille & Headlights
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.8), chromeMat);
  grille.position.set(2.12, 0.75, 0);
  group.add(grille);

  [-0.52, 0.52].forEach((hz) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.18), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
    hl.position.set(2.11, 0.85, hz);
    group.add(hl);
  });

  // Loading Rear Metal Ramp
  const ramp = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 })
  );
  ramp.position.set(-1.8, 0.3, 0);
  ramp.rotation.z = 0.28;
  group.add(ramp);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 24);
  wheelGeo.rotateX(Math.PI / 2);
  [
    [-0.9, 0.3, 0.8],
    [-0.9, 0.3, -0.8],
    [0.4, 0.3, 0.8],
    [0.4, 0.3, -0.8],
    [1.55, 0.3, 0.8],
    [1.55, 0.3, -0.8],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    group.add(w);
  });

  return group;
}

/**
 * 13. Overhead Warehouse High-Bay LED Lamp with Downlight Beam
 */
export function createHighBayLamp(): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const emissiveLed = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

  // UFO Heatsink fixture
  const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.2, 24), metalMat);
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.02, 24), emissiveLed);
  led.position.y = -0.1;
  fixture.add(led);
  group.add(fixture);

  // Hanging steel chain
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.0), metalMat);
  chain.position.y = 1.6;
  group.add(chain);

  // Soft translucent floor light pool
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 32),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb, transparent: true, opacity: 0.12, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -5.8;
  group.add(pool);

  return group;
}

/**
 * 14. Angry Customer with Invoice (Wściekły Klient z Fakturą / Reklamacją)
 */
export function createCustomerEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  invoiceMesh: THREE.Mesh;
  head: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'enemy_customer';

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.6 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45 }); // Red angry puffer jacket
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });

  // Torso
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.24), jacketMat);
  body.position.y = 0.52;
  body.castShadow = true;
  group.add(body);

  // Head with Angry Expression
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), skinMat);
  head.position.y = 0.9;
  head.castShadow = true;
  group.add(head);

  // Hair
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.26), hairMat);
  hair.position.y = 1.04;
  group.add(hair);

  // Angry Slanted Eyebrows & Eyes
  const browMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const bL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), browMat);
  bL.position.set(-0.06, 0.96, 0.13);
  bL.rotation.z = -0.3;
  const bR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), browMat);
  bR.position.set(0.06, 0.96, 0.13);
  bR.rotation.z = 0.3;

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const eL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), eyeMat);
  eL.position.set(-0.06, 0.92, 0.13);
  const eR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), eyeMat);
  eR.position.set(0.06, 0.92, 0.13);

  // Angry open shouting mouth
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x7f1d1d }));
  mouth.position.set(0, 0.84, 0.13);
  group.add(bL, bR, eL, eR, mouth);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.12, 0.32, 0.14);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.09, 0.18, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.09, 0.18, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.09, 0.34, 0.1);
  const armL = new THREE.Mesh(armGeo, jacketMat);
  armL.position.set(-0.23, 0.52, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, jacketMat);
  armR.position.set(0.23, 0.52, 0);
  armR.castShadow = true;
  group.add(armL, armR);

  // Hand waving a crumpled paper INVOICE / REKLAMACJA
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const invoiceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.01), paperMat);
  invoiceMesh.position.set(0, -0.16, 0.12);
  invoiceMesh.rotation.x = 0.6;
  armR.add(invoiceMesh);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, invoiceMesh, head };
}

/**
 * 15. Former Showroom Manager Walczak Boss (Były Kierownik Salonu Walczak)
 */
export function createWalczakBossModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  megaphone: THREE.Mesh;
  head: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'boss_walczak';

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 });
  const suitMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 }); // Grey executive business suit
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 }); // Red power tie
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

  // Suit Torso
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.28), suitMat);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  // White shirt collar & red tie
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  shirt.position.set(0, 0.72, 0.145);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.025), tieMat);
  tie.position.set(0, 0.58, 0.148);
  group.add(shirt, tie);

  // Head with Glasses & Stern Look
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
  head.position.y = 1.02;
  head.castShadow = true;
  group.add(head);

  // Silver Hair combed back
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
  hair.position.y = 1.18;
  group.add(hair);

  // Black frame Glasses
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const rimL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), glassMat);
  rimL.position.set(-0.07, 1.05, 0.145);
  const rimR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), glassMat);
  rimR.position.set(0.07, 1.05, 0.145);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.02), glassMat);
  bridge.position.set(0, 1.05, 0.145);
  group.add(rimL, rimR, bridge);

  // Legs & Polished Oxford Shoes
  const legGeo = new THREE.BoxGeometry(0.14, 0.36, 0.16);
  const legL = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.11, 0.2, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, suitMat);
  legR.position.set(0.11, 0.2, 0);
  legR.castShadow = true;

  const shoeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.22);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(0, -0.16, 0.03);
  legL.add(shoeL);
  const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
  shoeR.position.set(0, -0.16, 0.03);
  legR.add(shoeR);
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.11, 0.4, 0.12);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.28, 0.58, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, suitMat);
  armR.position.set(0.28, 0.58, 0);
  armR.castShadow = true;
  group.add(armL, armR);

  // Right Hand Megaphone ("SZCZEKACZKA WALCZAKA")
  const megaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6 });
  const megaphone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 16), megaMat);
  megaphone.rotation.x = -Math.PI / 2;
  megaphone.position.set(0, -0.2, 0.16);
  armR.add(megaphone);

  // Left Hand Giant Golden Clipboard with "AUDYT WALCZAKA"
  const clipMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.5 });
  const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.02), clipMat);
  const auditPaper = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.3, 0.022),
    new THREE.MeshBasicMaterial({ color: 0xfef08a }) // Yellow audit sheet
  );
  clipboard.add(auditPaper);
  clipboard.position.set(0, -0.16, 0.14);
  clipboard.rotation.x = 0.4;
  armL.add(clipboard);

  // Boss Crown / Badge on top
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.04, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d })
  );
  crown.position.y = 1.25;
  group.add(crown);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, megaphone, head };
}

/**
 * 16. Flying Penalty Invoice Projectile ("KARA UMOWNA WALCZAKA")
 */
export function createPenaltyNoticeProjectile(): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.3, 0.4, 0.02);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.6,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

/**
 * 17. NEW ENEMY: Architekt Wnętrz z Próbnikami ("Zbyt mało beżowy ten gres!")
 */
export function createArchitectEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
  swatches: THREE.Group;
} {
  const group = new THREE.Group();

  // Burgundy / Charcoal Designer Turtleneck & Slim Trousers
  const turtleneckMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.8 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const glassesMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.1 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.46, 12), turtleneckMat);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  // Scarf
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), scarfMat);
  scarf.position.y = 0.82;
  scarf.rotation.x = Math.PI / 2;
  group.add(scarf);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
  head.position.y = 0.96;
  head.castShadow = true;
  group.add(head);

  // Designer Spectacles (Thick round black frames)
  const leftGlass = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 8, 16), glassesMat);
  leftGlass.position.set(-0.05, 0.97, 0.12);
  const rightGlass = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 8, 16), glassesMat);
  rightGlass.position.set(0.05, 0.97, 0.12);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.01), glassesMat);
  bridge.position.set(0, 0.97, 0.13);
  group.add(leftGlass, rightGlass, bridge);

  // Beret / Stylish Hair
  const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x27272a }));
  hair.position.y = 1.08;
  hair.rotation.z = 0.15;
  group.add(hair);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.1, 0.2, 0);
  legL.castShadow = true;

  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.1, 0.2, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.38, 8);
  const armL = new THREE.Mesh(armGeo, turtleneckMat);
  armL.position.set(-0.25, 0.65, 0);
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, turtleneckMat);
  armR.position.set(0.25, 0.65, 0);
  armR.castShadow = true;

  // Swatches Fan in Right Hand
  const swatches = new THREE.Group();
  const swatchColors = [0xfef08a, 0xfde047, 0xd4d4d8, 0x78716c, 0x0284c7];
  swatchColors.forEach((col, idx) => {
    const sMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.18, 0.006),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 })
    );
    sMesh.rotation.z = (idx - 2) * 0.28;
    sMesh.position.set((idx - 2) * 0.02, 0.08, idx * 0.008);
    swatches.add(sMesh);
  });
  swatches.position.set(0, -0.18, 0.12);
  swatches.rotation.x = 0.5;
  armR.add(swatches);

  group.add(armL, armR);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, head, swatches };
}

/**
 * 18. NEW ENEMY: Inspektor BHP z Notatnikiem i Gwizdkiem
 */
export function createInspectorEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
  whistle: THREE.Mesh;
} {
  const group = new THREE.Group();

  const vestMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0x7c2d12, emissiveIntensity: 0.3, roughness: 0.5 });
  const silverTapeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
  const darkPantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.1 });

  // Torso with Safety Vest
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.22), vestMat);
  body.position.y = 0.62;
  body.castShadow = true;

  // Reflective Silver Strips
  const tape1 = new THREE.Mesh(new THREE.BoxGeometry(0.385, 0.05, 0.225), silverTapeMat);
  tape1.position.y = 0.04;
  const tape2 = new THREE.Mesh(new THREE.BoxGeometry(0.385, 0.05, 0.225), silverTapeMat);
  tape2.position.y = -0.12;
  body.add(tape1, tape2);
  group.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
  head.position.y = 0.98;
  head.castShadow = true;
  group.add(head);

  // Hardhat (BHP Yellow Helmet)
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
  helmet.position.y = 0.98;
  const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16), helmetMat);
  helmetBrim.position.y = 0.98;
  group.add(helmet, helmetBrim);

  // Whistle around neck
  const whistleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
  const whistle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.07, 8), whistleMat);
  whistle.rotation.x = Math.PI / 2;
  whistle.position.set(0, 0.82, 0.14);
  group.add(whistle);

  // Legs (Dark Navy work pants with reinforced knees)
  const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.42, 8);
  const legL = new THREE.Mesh(legGeo, darkPantsMat);
  legL.position.set(-0.11, 0.21, 0);
  legL.castShadow = true;

  const legR = new THREE.Mesh(legGeo, darkPantsMat);
  legR.position.set(0.11, 0.21, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.4, 8);
  const armL = new THREE.Mesh(armGeo, vestMat);
  armL.position.set(-0.26, 0.68, 0);
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, vestMat);
  armR.position.set(0.26, 0.68, 0);
  armR.castShadow = true;

  // Left hand clipboard
  const clipboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.28, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
  );
  const checklist = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.24, 0.022),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  clipboard.add(checklist);
  clipboard.position.set(0, -0.16, 0.12);
  clipboard.rotation.x = 0.4;
  armL.add(clipboard);

  group.add(armL, armR);

  // Contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.65),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, head, whistle };
}

/**
 * 19. NEW ENEMY: Autonomiczny Wózek AGV (Automated Guided Vehicle)
 */
export function createAgvRobotModel(): {
  group: THREE.Group;
  lidar: THREE.Mesh;
  beacon: THREE.Mesh;
} {
  const group = new THREE.Group();

  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.05 });

  // Low heavy chassis with rounded box
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.7), chassisMat);
  base.position.y = 0.16;
  base.castShadow = true;
  group.add(base);

  // Hazard striped bumper
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.04), bumperMat);
  bumperF.position.set(0, 0.14, 0.36);
  const bumperB = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.04), bumperMat);
  bumperB.position.set(0, 0.14, -0.36);
  group.add(bumperF, bumperB);

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  [-0.42, 0.42].forEach((x) => {
    [-0.24, 0.24].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, rubberMat);
      wheel.position.set(x, 0.08, z);
      group.add(wheel);
    });
  });

  // 360 Lidar scanner
  const lidar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 })
  );
  lidar.position.set(0.3, 0.31, 0.22);
  group.add(lidar);

  // Amber flashing beacon
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 })
  );
  beacon.position.set(-0.32, 0.32, -0.22);
  group.add(beacon);

  // Cargo: Stack of Luxury Ceramic Sinks
  const sinkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.14, 16), porcelainMat);
  sinkBase.position.set(0, 0.34, 0);
  sinkBase.castShadow = true;

  const sinkTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 16), porcelainMat);
  sinkTop.position.set(0, 0.46, 0);
  sinkTop.castShadow = true;
  group.add(sinkBase, sinkTop);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.9),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, lidar, beacon };
}

/**
 * 20. NEW COLLECTIBLE: Podwójne Espresso Max-Fliz (Restores HP + Speed)
 */
export function createEspressoCollectible(): THREE.Group {
  const group = new THREE.Group();

  const porcelain = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 });
  const coffee = new THREE.MeshStandardMaterial({ color: 0x3e1d09, roughness: 0.2 });

  // Saucer
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.03, 20), porcelain);
  saucer.position.y = 0.02;
  const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.008, 8, 20), gold);
  saucerRim.rotation.x = Math.PI / 2;
  saucerRim.position.y = 0.035;

  // Cup
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.15, 20), porcelain);
  cup.position.y = 0.1;
  const cupGoldRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.008, 8, 20), gold);
  cupGoldRim.rotation.x = Math.PI / 2;
  cupGoldRim.position.y = 0.175;

  // Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 8, 16, Math.PI * 1.3), porcelain);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.13, 0.1, 0);

  // Coffee Crema
  const crema = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), coffee);
  crema.rotation.x = -Math.PI / 2;
  crema.position.y = 0.165;

  // Floating Steam Helix
  const steamGeo = new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI * 1.5);
  const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const steam = new THREE.Mesh(steamGeo, steamMat);
  steam.rotation.x = Math.PI / 2;
  steam.position.y = 0.26;

  group.add(saucer, saucerRim, cup, cupGoldRim, handle, crema, steam);
  group.scale.setScalar(1.2);
  return group;
}

/**
 * 21. NEW COLLECTIBLE: Magnetyczny Pas Narzędziowy (Order Magnet)
 */
export function createMagnetCollectible(): THREE.Group {
  const group = new THREE.Group();

  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.3 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });

  // Horseshoe curved body
  const body = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 12, 24, Math.PI), redMat);
  body.rotation.z = Math.PI;
  body.position.y = 0.18;

  // Two silver poles
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 16), silverMat);
  poleL.position.set(-0.18, 0.13, 0);
  const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 16), silverMat);
  poleR.position.set(0.18, 0.13, 0);

  // Glow ring
  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.01, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
  );
  glowRing.position.y = 0.18;

  group.add(body, poleL, poleR, glowRing);
  group.scale.setScalar(1.1);
  return group;
}

/**
 * 22. NEW COLLECTIBLE: Złoty Przecinak do Płytek (Tile Cutter)
 */
export function createGoldenCutterCollectible(): THREE.Group {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });

  // Sturdy base plate
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.18), goldMat);
  base.position.y = 0.02;

  // Dual guide bars
  const barGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.48, 12);
  barGeo.rotateZ(Math.PI / 2);
  const bar1 = new THREE.Mesh(barGeo, chromeMat);
  bar1.position.set(0, 0.1, 0.04);
  const bar2 = new THREE.Mesh(barGeo, chromeMat);
  bar2.position.set(0, 0.1, -0.04);

  // Lever Handle
  const lever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
  );
  lever.position.set(0, 0.18, 0);
  lever.rotation.z = -0.4;

  group.add(base, bar1, bar2, lever);
  group.scale.setScalar(1.1);
  return group;
}

/**
 * 23. NEW COLLECTIBLE: Włoski Marmur Carrara Gold
 */
export function createCarraraCollectible(): THREE.Group {
  const group = new THREE.Group();

  const marbleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.15,
    metalness: 0.1,
  });

  // Slab
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.04), marbleMat);
  slab.castShadow = true;

  // Gold Bevelled Edge / Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.038), frameMat);

  // Certified Emblem
  const emblem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.045, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 })
  );
  emblem.rotation.x = Math.PI / 2;

  group.add(frame, slab, emblem);
  return group;
}

/**
 * 24. Volumetric Light Cone for High Bay Lamps
 */
export function createVolumetricLightBeam(): THREE.Mesh {
  const geo = new THREE.ConeGeometry(3.5, 8, 16, 1, true);
  geo.translate(0, -4, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfffbeb,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 5;
  return mesh;
}

/**
 * 25. Holographic Finish Loading Gate (Rampa Załadunku / Cel Poziomu)
 */
export function createFinishGate(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'finish_gate';

  const archMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x15803d,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.5,
  });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });

  // Left & right support pillars
  const pillarGeo = new THREE.BoxGeometry(0.18, 3.2, 0.18);
  const pL = new THREE.Mesh(pillarGeo, archMat);
  pL.position.set(0, 1.6, -1.4);
  const pR = new THREE.Mesh(pillarGeo, archMat);
  pR.position.set(0, 1.6, 1.4);

  // Top overhead banner beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 3.0), archMat);
  beam.position.set(0, 3.2, 0);

  // Beacons on pillars
  const bL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 12), beaconMat);
  bL.position.set(0, 3.5, -1.4);
  const bR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 12), beaconMat);
  bR.position.set(0, 3.5, 1.4);

  // Glowing landing beacon ring on ground
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.3, 32),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;

  group.add(pL, pR, beam, bL, bR, ring);
  return group;
}

/**
 * 26. Directional Safety Arrow on Floor
 */
export function createAisleArrow(length = 1.2): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });

  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(length * 0.6, 0.25), mat);
  shaft.rotation.x = -Math.PI / 2;
  shaft.position.x = -length * 0.2;
  shaft.position.y = 0.015;

  const head = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  const vertices = new Float32Array([
    0, 0, -0.4,
    length * 0.4, 0, 0,
    0, 0, 0.4,
  ]);
  head.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  head.position.y = 0.015;

  group.add(shaft, head);
  return group;
}

/**
 * 27. EASTER EGG: Złoty Tron Prezesa (24-karatowa toaleta z Włoch)
 */
export function createGoldenThroneEasterEgg(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'easter_egg_golden_throne';

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.1,
    emissive: 0x78350f,
    emissiveIntensity: 0.35,
  });

  // Base Pedestal
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.38, 24), goldMat);
  base.position.y = 0.19;
  base.castShadow = true;

  // Bowl
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), goldMat);
  bowl.position.y = 0.38;
  bowl.rotation.x = Math.PI;

  // Cistern tank at back
  const cistern = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.22), goldMat);
  cistern.position.set(0, 0.58, -0.22);
  cistern.castShadow = true;

  // Golden Crown / Halo floating above
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.025, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  halo.position.y = 1.05;
  halo.rotation.x = Math.PI / 2;

  group.add(base, bowl, cistern, halo);
  group.scale.setScalar(1.1);
  return group;
}

/**
 * 28. EASTER EGG: Ukryty Kącik Kawowy Zdzicha (Vintage Espresso Machine)
 */
export function createVintageCoffeeCornerEasterEgg(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'easter_egg_coffee_corner';

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.3, roughness: 0.4 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

  // Wooden table shelf
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.45), woodMat);
  table.position.y = 0.03;

  // Retro Italian Espresso Machine Body
  const machine = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.32), redMat);
  machine.position.set(0, 0.22, 0);

  // Chrome Group Head & Boiler Lever
  const boilerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), chromeMat);
  boilerCap.position.set(0, 0.43, 0);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 12), chromeMat);
  lever.position.set(0.18, 0.38, 0);
  lever.rotation.z = -0.5;

  // Steaming cup
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 12), chromeMat);
  cup.position.set(-0.16, 0.1, 0.08);

  // Golden Sparkle
  const spark = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.08, 0),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  spark.position.set(0, 0.65, 0);

  group.add(table, machine, boilerCap, lever, cup, spark);
  return group;
}

/**
 * 29. EASTER EGG: Zaginiona Teczka WZ z 2012 Roku (Złoty Certyfikat)
 */
export function createSecretFolderEasterEgg(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'easter_egg_secret_folder';

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.15,
    emissive: 0xb45309,
    emissiveIntensity: 0.5,
  });

  // Glowing golden folder
  const folder = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.05), goldMat);
  folder.position.y = 0.23;
  folder.castShadow = true;

  // Seal Ribbon
  const ribbon = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.02, 8, 16),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  ribbon.position.set(0, 0.23, 0.035);

  // Floating Star
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.1, 0),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  star.position.set(0, 0.6, 0);

  group.add(folder, ribbon, star);
  return group;
}

/**
 * 30. NEW ENEMY: Agresywny Handlowiec z Ofertami Rabatowymi
 */
export function createHandlowiecEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
  briefcase: THREE.Mesh;
} {
  const group = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }); // Bright corporate blue suit
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const briefcaseMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.3, roughness: 0.4 });
  const goldLockMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });

  // Body / Suit Jacket
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.22), suitMat);
  body.position.y = 0.6;
  body.castShadow = true;

  // White Shirt & Red Tie Insert
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.02), shirtMat);
  shirt.position.set(0, 0.02, 0.115);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.025), tieMat);
  tie.position.set(0, -0.04, 0.12);
  body.add(shirt, tie);
  group.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
  head.position.y = 0.98;
  head.castShadow = true;

  // Sleek hair
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.148, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.48), new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.8 }));
  hair.position.y = 1.0;
  group.add(head, hair);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.42, 8);
  const legL = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.1, 0.21, 0);
  legL.castShadow = true;

  const legR = new THREE.Mesh(legGeo, suitMat);
  legR.position.set(0.1, 0.21, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.38, 8);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.25, 0.65, 0);
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, suitMat);
  armR.position.set(0.25, 0.65, 0);
  armR.castShadow = true;

  // Briefcase in Right Hand
  const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.35), briefcaseMat);
  briefcase.position.set(0, -0.22, 0.1);
  const goldLock = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.06), goldLockMat);
  goldLock.position.set(0, 0.08, 0);
  briefcase.add(goldLock);
  armR.add(briefcase);

  group.add(armL, armR);

  // Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, head, briefcase };
}

/**
 * 31. NEW ENEMY: Monter Płytek z Młotkiem Gumowym ("Fuga pękła!")
 */
export function createMonterEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
  hammer: THREE.Mesh;
} {
  const group = new THREE.Group();

  const dungareesMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 }); // Blue dungarees
  const tShirtMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }); // Red t-shirt
  const kneePadMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });

  // Body / Dungarees
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.22), dungareesMat);
  body.position.y = 0.6;
  body.castShadow = true;

  // Red T-shirt sleeves & top
  const shirtUnder = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.225), tShirtMat);
  shirtUnder.position.set(0, 0.16, 0);
  body.add(shirtUnder);
  group.add(body);

  // Head with Builder Baseball Cap
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
  head.position.y = 0.98;
  head.castShadow = true;

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.148, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
  cap.position.y = 1.0;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16, 1, false, 0, Math.PI), capMat);
  brim.rotation.x = -Math.PI / 2;
  brim.position.set(0, 1.0, 0.12);
  group.add(head, cap, brim);

  // Legs with Knee Pads
  const legGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.42, 8);
  const legL = new THREE.Mesh(legGeo, dungareesMat);
  legL.position.set(-0.1, 0.21, 0);
  const padL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), kneePadMat);
  padL.position.set(0, 0, 0.05);
  legL.add(padL);

  const legR = new THREE.Mesh(legGeo, dungareesMat);
  legR.position.set(0.1, 0.21, 0);
  const padR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), kneePadMat);
  padR.position.set(0, 0, 0.05);
  legR.add(padR);
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.38, 8);
  const armL = new THREE.Mesh(armGeo, tShirtMat);
  armL.position.set(-0.25, 0.65, 0);
  const armR = new THREE.Mesh(armGeo, tShirtMat);
  armR.position.set(0.25, 0.65, 0);

  // Giant Rubber Mallet (Młotek do dobijania płytek)
  const hammer = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), woodMat);
  const hammerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 12), rubberMat);
  hammerHead.rotation.z = Math.PI / 2;
  hammerHead.position.set(0, 0.24, 0);
  hammer.add(hammerHead);
  hammer.position.set(0, -0.15, 0.2);
  hammer.rotation.x = 0.5;
  armR.add(hammer);

  group.add(armL, armR);

  return { group, legL, legR, armL, armR, head, hammer };
}

/**
 * 32. NEW ENEMY: Piorun Dron (Autonomiczny Dron Skanujący Kod Kreskowy AI)
 */
export function createPiorunDronModel(): {
  group: THREE.Group;
  rotors: THREE.Mesh[];
  scannerBeam: THREE.Mesh;
} {
  const group = new THREE.Group();

  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.3, roughness: 0.4 });
  const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const rotorMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 });

  // Central Core
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), yellowMat);
  core.position.y = 0.5;
  group.add(core);

  // Digital Eye / Camera Lens
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), carbonMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0.5, 0.22);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), redGlowMat);
  eye.position.set(0, 0.5, 0.26);
  group.add(lens, eye);

  // 4 Rotor Booms
  const rotors: THREE.Mesh[] = [];
  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  angles.forEach((ang) => {
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.45), carbonMat);
    boom.rotation.y = ang;
    boom.position.set(0, 0.5, 0);
    group.add(boom);

    // Motor Hub
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), carbonMat);
    const dist = 0.42;
    hub.position.set(Math.sin(ang) * dist, 0.54, Math.cos(ang) * dist);
    group.add(hub);

    // Spinning Blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.04), rotorMat);
    blade.position.copy(hub.position);
    blade.position.y += 0.04;
    group.add(blade);
    rotors.push(blade);
  });

  // Downward Scanning Laser Cone
  const scanGeo = new THREE.ConeGeometry(0.8, 1.8, 16, 1, true);
  scanGeo.translate(0, -0.9, 0);
  const scanMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const scannerBeam = new THREE.Mesh(scanGeo, scanMat);
  scannerBeam.position.set(0, 0.45, 0);
  group.add(scannerBeam);

  return { group, rotors, scannerBeam };
}

/**
 * 33. NEW ENEMY: Elitarny Ochroniarz Walczaka (z Tarczą BHP i Pałką Kierowania Ruchem)
 */
export function createEliteGuardEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
  shield: THREE.Group;
} {
  const group = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
  const redBatonMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.7 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });

  // Heavy Tactical Vest
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.28), armorMat);
  body.position.y = 0.65;
  body.castShadow = true;
  group.add(body);

  // Helmet with Visor
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), skinMat);
  head.position.y = 1.05;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 16), armorMat);
  helmet.position.y = 1.06;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), visorMat);
  visor.position.set(0, 1.05, 0.14);
  group.add(head, helmet, visor);

  // Heavy Armored Legs
  const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.44, 8);
  const legL = new THREE.Mesh(legGeo, armorMat);
  legL.position.set(-0.12, 0.22, 0);
  const legR = new THREE.Mesh(legGeo, armorMat);
  legR.position.set(0.12, 0.22, 0);
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.42, 8);
  const armL = new THREE.Mesh(armGeo, armorMat);
  armL.position.set(-0.28, 0.7, 0);

  const armR = new THREE.Mesh(armGeo, armorMat);
  armR.position.set(0.28, 0.7, 0);

  // Heavy Riot Shield (Tarcza BHP Max-Fliz) in Left Arm
  const shield = new THREE.Group();
  const shieldPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.85, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
  );
  const shieldCross = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.12, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.4 })
  );
  shield.add(shieldPlate, shieldCross);
  shield.position.set(0, -0.15, 0.25);
  armL.add(shield);

  // Glowing Traffic Baton in Right Arm
  const baton = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 12), redBatonMat);
  baton.position.set(0, -0.2, 0.15);
  baton.rotation.x = 0.5;
  armR.add(baton);

  group.add(armL, armR);

  return { group, legL, legR, armL, armR, head, shield };
}

/**
 * 34. NEW 3D WORLD-DROP PERK PICKUP (Crate / Orb / Beacon)
 */
export function createDroppedPerkCrate(perkId: string, color: number): THREE.Group {
  const group = new THREE.Group();
  group.name = `dropped_perk_${perkId}`;

  // 1. Vertical Atmospheric Light Beacon
  const beaconGeo = new THREE.CylinderGeometry(0.12, 0.5, 8.0, 16, 1, true);
  beaconGeo.translate(0, 4.0, 0);
  const beaconMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.renderOrder = 10;
  group.add(beacon);

  // 2. Pulsing Ground Ring
  const groundRing = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.8, 32),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
  );
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.02;
  group.add(groundRing);

  // 3. Floating Holographic Outer Cage / Octahedron
  const cageGeo = new THREE.OctahedronGeometry(0.38, 0);
  const cageMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.5,
    metalness: 0.9,
    roughness: 0.1,
    wireframe: true,
  });
  const cage = new THREE.Mesh(cageGeo, cageMat);
  cage.position.y = 0.75;
  group.add(cage);

  // 4. Rotating Energy Rings
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.025, 8, 24),
    new THREE.MeshBasicMaterial({ color })
  );
  ring1.position.y = 0.75;
  ring1.rotation.x = Math.PI / 3;
  group.add(ring1);

  // 5. Iconic 3D Core Prop
  let coreProp: THREE.Object3D;
  if (perkId === 'hardhat') {
    coreProp = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.2, emissive: 0x1d4ed8, emissiveIntensity: 0.5 })
    );
  } else if (perkId === 'vibram_boots') {
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.24), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.5 }));
    bootL.position.x = -0.08;
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.24), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.5 }));
    bootR.position.x = 0.08;
    coreProp = new THREE.Group();
    coreProp.add(bootL, bootR);
  } else if (perkId === 'order_magnet') {
    coreProp = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.06, 12, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.8, emissive: 0x6d28d9, emissiveIntensity: 0.6 })
    );
    coreProp.rotation.z = Math.PI;
  } else {
    // Espresso
    coreProp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.1, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.6 })
    );
  }
  coreProp.position.y = 0.75;
  group.add(coreProp);

  return group;
}

/**
 * 35. Industrial Steam Vent / Valve Pipe
 */
export function createIndustrialSteamVent(): THREE.Group {
  const group = new THREE.Group();
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const valveMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.4 });

  // Main vertical pipe
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 16), pipeMat);
  pipe.position.y = 1.1;

  // Horizontal nozzle
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16), pipeMat);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(0.3, 1.8, 0);

  // Wheel valve
  const valve = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), valveMat);
  valve.position.set(0, 1.4, 0.12);

  group.add(pipe, nozzle, valve);
  return group;
}

/**
 * 36. Neon Showroom Overhead Billboard Sign
 */
export function createNeonShowroomSign(text: string, neonColor = '#38bdf8'): THREE.Group {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark metallic backdrop
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = neonColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 1004, 236);

  // Neon text glow
  ctx.shadowColor = neonColor;
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 512, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 1.5, 0.15),
    new THREE.MeshStandardMaterial({
      map: texture,
      emissive: new THREE.Color(neonColor),
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.4,
    })
  );
  group.add(signMesh);

  return group;
}

/**
 * 37. Elevated Steel High-Bay Catwalk Platform
 */
export function createHighBayCatwalk(width: number, depth: number): THREE.Group {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 }); // Safety yellow rail

  // Steel grating floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), steelMat);
  group.add(floor);

  // Safety railings on both sides
  const railBack = new THREE.Mesh(new THREE.BoxGeometry(width, 0.7, 0.05), railMat);
  railBack.position.set(0, 0.4, -depth / 2 + 0.025);
  const railFront = new THREE.Mesh(new THREE.BoxGeometry(width, 0.7, 0.05), railMat);
  railFront.position.set(0, 0.4, depth / 2 - 0.025);

  group.add(railBack, railFront);
  return group;
}

/**
 * 38. Piotr's Signature Hidden Bimber Moonshine Bottle (Koktajl Mołotowa)
 * An authentic vintage glass moonshine bottle with a burning rag wick!
 */
export function createBimberBottleMolotov(): {
  group: THREE.Group;
  flameMesh: THREE.Mesh;
  flameLight: THREE.PointLight;
} {
  const group = new THREE.Group();

  // Glass bottle body (thick greenish-amber glass)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x3d5a2b,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
  });
  const bottleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 16), glassMat);
  bottleBody.position.y = 0.21;
  bottleBody.castShadow = true;

  // Bimber moonshine liquid inside (golden amber 70%)
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0xd97706,
    emissiveIntensity: 0.35,
  });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.125, 0.3, 16), liquidMat);
  liquid.position.y = 0.16;

  // Vintage Moonshine Label
  const labelMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.125, 0.18, 16, 1, true, 0, Math.PI * 1.3), labelMat);
  label.position.y = 0.21;

  // Bottle Shoulder taper
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.12, 16), glassMat);
  shoulder.position.y = 0.48;

  // Slender Bottle Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.18, 16), glassMat);
  neck.position.y = 0.63;

  // Cork Stopper
  const corkMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.04, 0.06, 12), corkMat);
  cork.position.y = 0.73;

  // Burning Cloth Wick (Rag soaked in bimber)
  const ragMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
  const rag = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.14, 8), ragMat);
  rag.position.set(0.01, 0.8, 0);
  rag.rotation.z = -0.15;

  // Fiery Flame at the tip of the wick
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
  const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 12), flameMat);
  flameMesh.position.set(0.02, 0.92, 0);

  // Inner bright yellow flame core
  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, 0.11, 10),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  innerFlame.position.y = -0.02;
  flameMesh.add(innerFlame);

  // Flickering Warm Light
  const flameLight = new THREE.PointLight(0xff6600, 2.2, 5.0);
  flameLight.position.set(0.02, 0.92, 0);

  group.add(bottleBody, liquid, label, shoulder, neck, cork, rag, flameMesh, flameLight);
  group.scale.setScalar(0.95);

  return { group, flameMesh, flameLight };
}

/**
 * 39. Lingering Burning Pool of Bimber (Morze Ognia Koktajlu Mołotowa)
 * Raging flaming ground puddle with animated flickering fire spires!
 */
export function createMolotovFirePuddle(radius = 3.8): {
  group: THREE.Group;
  flames: THREE.Mesh[];
  light: THREE.PointLight;
} {
  const group = new THREE.Group();

  // Charred ground scorch mark & molten flaming bimber liquid
  const groundGeo = new THREE.CircleGeometry(radius, 32);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.4,
    emissive: 0xd97706,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const scorchMesh = new THREE.Mesh(groundGeo, groundMat);
  scorchMesh.rotation.x = -Math.PI / 2;
  scorchMesh.position.y = 0.02;
  group.add(scorchMesh);

  // Flaming fiery center ring
  const ringGeo = new THREE.RingGeometry(0.2, radius * 0.85, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff3b00,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.03;
  group.add(ringMesh);

  // Multiple 3D flickering flame spires distributed across the puddle
  const flames: THREE.Mesh[] = [];
  const flameColors = [0xff2200, 0xff5500, 0xff9900, 0xffd000];

  const flameCount = 14;
  for (let i = 0; i < flameCount; i++) {
    const height = 0.6 + Math.random() * 0.9;
    const baseRadius = 0.12 + Math.random() * 0.16;
    const color = flameColors[i % flameColors.length];

    const coneGeo = new THREE.ConeGeometry(baseRadius, height, 10);
    const coneMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
    });
    const flame = new THREE.Mesh(coneGeo, coneMat);

    // Random position within circle
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (radius * 0.78);
    const fx = Math.cos(angle) * r;
    const fz = Math.sin(angle) * r;
    flame.position.set(fx, height / 2 + 0.04, fz);

    // Store custom animation phase
    flame.userData = {
      baseY: height / 2 + 0.04,
      baseHeight: height,
      baseScale: 1.0,
      phase: Math.random() * Math.PI * 2,
      speed: 10 + Math.random() * 12,
    };

    // Inner bright yellow tip
    const innerTip = new THREE.Mesh(
      new THREE.ConeGeometry(baseRadius * 0.55, height * 0.55, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 })
    );
    innerTip.position.y = -height * 0.1;
    flame.add(innerTip);

    group.add(flame);
    flames.push(flame);
  }

  // Warm fire illumination
  const light = new THREE.PointLight(0xff5500, 3.8, 10.0);
  light.position.set(0, 1.2, 0);
  group.add(light);

  return { group, flames, light };
}

/**
 * 23. NEW ENEMY: Szybki Kurier Ekspresowy z Paczką Calacatta
 */
export function createKurierEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
} {
  const group = new THREE.Group();

  const vestMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Hi-vis yellow vest
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }); // Blue courier shirt
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const parcelMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }); // Cardboard box

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 0.22), vestMat);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  // Reflective Stripes
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.04, 0.23), stripeMat);
  stripe1.position.y = 0.62;
  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.04, 0.23), stripeMat);
  stripe2.position.y = 0.52;
  group.add(stripe1, stripe2);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
  head.position.y = 0.96;
  head.castShadow = true;
  group.add(head);

  // Courier Cap with Visor
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 16), capMat);
  cap.position.y = 1.08;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.1), capMat);
  visor.position.set(0, 1.06, 0.16);
  visor.rotation.x = 0.15;
  group.add(cap, visor);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.13, 0.38, 0.14);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.1, 0.2, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.1, 0.2, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms carrying Cardboard Parcel Box
  const armGeo = new THREE.BoxGeometry(0.11, 0.38, 0.11);
  const armL = new THREE.Mesh(armGeo, shirtMat);
  armL.position.set(-0.24, 0.56, 0.08);
  armL.rotation.x = -0.6;
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, shirtMat);
  armR.position.set(0.24, 0.56, 0.08);
  armR.rotation.x = -0.6;
  armR.castShadow = true;
  group.add(armL, armR);

  // Parcel Box
  const parcel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.26), parcelMat);
  parcel.position.set(0, 0.52, 0.2);
  parcel.castShadow = true;

  // Parcel tape
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.04), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  parcel.add(tape);
  group.add(parcel);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, head };
}

/**
 * 24. NEW ENEMY: Włoski Dostawca Armatury z Mediolanu
 */
export function createItalianVendorEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
} {
  const group = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.3 }); // Purple Italian suit
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 }); // Golden Faucet
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const glassesMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.95 });

  // Body with open jacket & golden tie
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.2), suitMat);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.02), shirtMat);
  shirt.position.set(0, 0.58, 0.101);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.03), goldMat);
  tie.position.set(0, 0.56, 0.11);
  group.add(shirt, tie);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
  head.position.y = 0.96;
  head.castShadow = true;
  group.add(head);

  // Golden Aviator Sunglasses
  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), glassesMat);
  shades.position.set(0, 0.98, 0.13);
  group.add(shades);

  // Sleek hair
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), new THREE.MeshStandardMaterial({ color: 0x18181b }));
  hair.position.y = 1.08;
  group.add(hair);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.12, 0.38, 0.14);
  const legL = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.1, 0.2, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, suitMat);
  legR.position.set(0.1, 0.2, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.11, 0.38, 0.11);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.24, 0.58, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, suitMat);
  armR.position.set(0.24, 0.58, 0);
  armR.castShadow = true;
  group.add(armL, armR);

  // Golden Faucet in right hand
  const faucet = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), goldMat);
  faucet.position.set(0, -0.16, 0.12);
  faucet.rotation.y = Math.PI / 2;
  armR.add(faucet);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, head };
}

/**
 * 25. NEW ENEMY: Szalony Operator Paleciaka B4
 */
export function createSztaplarEnemyModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
} {
  const group = new THREE.Group();

  const overallMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }); // Heavy orange overalls
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const hardhatMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 }); // Red hardhat
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

  // Heavy-set Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.28), overallMat);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), skinMat);
  head.position.y = 0.98;
  head.castShadow = true;
  group.add(head);

  // Heavy Red Industrial Hardhat
  const hardhat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), hardhatMat);
  hardhat.position.y = 1.1;
  group.add(hardhat);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.15, 0.38, 0.16);
  const legL = new THREE.Mesh(legGeo, overallMat);
  legL.position.set(-0.12, 0.2, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, overallMat);
  legR.position.set(0.12, 0.2, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms holding Steering Handle / Pallet Jack Bar
  const armGeo = new THREE.BoxGeometry(0.13, 0.38, 0.13);
  const armL = new THREE.Mesh(armGeo, overallMat);
  armL.position.set(-0.28, 0.58, 0.08);
  armL.rotation.x = -0.5;
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, overallMat);
  armR.position.set(0.28, 0.58, 0.08);
  armR.rotation.x = -0.5;
  armR.castShadow = true;
  group.add(armL, armR);

  // Heavy Pallet Jack Control Handle
  const handleBar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), wheelMat);
  handleBar.position.set(0, 0.5, 0.22);
  handleBar.rotation.x = Math.PI / 2;
  group.add(handleBar);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  return { group, legL, legR, armL, armR, head };
}

/**
 * 26. Spray Graffiti Decal ("Arkadiusz, byłem tu") - MASSIVE & GLOWING
 */
export function createSprayGraffitiDecal(text: string = "ARKADIUSZ"): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 512);

  // Clean, Sharp Text - No blur, No stars, No glow effects
  ctx.font = 'bold 96px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Strong dark stroke for legibility on floor
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(text, 512, 170);

  // Main Text - Solid White
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 512, 170);
  
  // Ghost symbol directly under the text without any stars or blur
  ctx.font = '110px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Arial"';
  ctx.fillText('👻', 512, 340);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), mat);
  return mesh;
}

/**
 * 27. Chalk Body Outline Crime Scene Decal ("Rudy Śmierdziuch") - LARGE & DISTINCT
 */
export function createCrimeSceneBodyOutlineDecal(label: string = 'RUDY ŚMIERDZIUCH'): THREE.Group {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 1024);

  // Thick Crime Scene Caution Tape Border
  ctx.fillStyle = '#f59e0b';
  const bw = 30;
  ctx.fillRect(0, 0, 1024, bw);
  ctx.fillRect(0, 1024 - bw, 1024, bw);
  ctx.fillRect(0, 0, bw, 1024);
  ctx.fillRect(1024 - bw, 0, bw, 1024);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px sans-serif';
  for (let x = 40; x < 1000; x += 140) {
    ctx.fillText('POLICJA • CRIME SCENE • DO NOT CROSS', x, bw - 6);
  }

  // White Chalk Silhouette - Thick & Messy
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(512, 220, 80, 0, Math.PI * 2); // Larger Head
  ctx.moveTo(512, 300); // Torso
  ctx.lineTo(512, 600);
  ctx.moveTo(512, 380); // Arms
  ctx.lineTo(320, 500);
  ctx.lineTo(260, 640);
  ctx.moveTo(512, 380);
  ctx.lineTo(700, 500);
  ctx.lineTo(760, 640);
  ctx.moveTo(512, 600); // Legs
  ctx.lineTo(380, 880);
  ctx.moveTo(512, 600);
  ctx.lineTo(640, 880);
  ctx.stroke();

  // Bold High-Contrast Label
  ctx.font = '900 100px "Segoe UI", "Arial Black", sans-serif';
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 35;
  
  // Outer Stroke for Label
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ef4444';
  ctx.strokeText(label, 512, 970);
  ctx.fillText(label, 512, 970);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8), mat);
  decalMesh.rotation.x = -Math.PI / 2;
  decalMesh.position.y = 0.02;

  group.add(decalMesh);
  return group;
}

/**
 * 28. ADDITIONAL BOSS: Król-Leto (Dyrektor Generalny)
 * Imposing Boss with royal crown, suit, and lethal Disciplinary Discharge folder!
 */
export function createKrolLetoBossModel(): {
  group: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  head: THREE.Mesh;
} {
  const group = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }); // Obsidian Tuxedo Suit
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 }); // Royal Crown & Gold Trim
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 }); // Red Tie & Disciplinary Folder
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd0b0, roughness: 0.4 });
  const glassesMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.8 }); // Glowing Red Glasses

  // Imposing Tall Body (Scale 1.3x)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), suitMat);
  body.position.y = 0.78;
  body.castShadow = true;
  group.add(body);

  // White Shirt Front & Red Tie
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.58, 0.02), shirtMat);
  shirt.position.set(0, 0.78, 0.141);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.03), redMat);
  tie.position.set(0, 0.76, 0.15);
  group.add(shirt, tie);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
  head.position.y = 1.25;
  head.castShadow = true;
  group.add(head);

  // Glowing Red Boss Eyewear
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.05), glassesMat);
  glasses.position.set(0, 1.28, 0.16);
  group.add(glasses);

  // ROYAL CROWN (Król-Leto)
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 1.48, 0);

  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), goldMat);
  crownGroup.add(crownBase);

  // 5 Spikes on Crown
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), goldMat);
    spike.position.set(Math.cos(angle) * 0.15, 0.08, Math.sin(angle) * 0.15);
    crownGroup.add(spike);
  }
  group.add(crownGroup);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.16, 0.5, 0.18);
  const legL = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.14, 0.25, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, suitMat);
  legR.position.set(0.14, 0.25, 0);
  legR.castShadow = true;
  group.add(legL, legR);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.33, 0.78, 0);
  armL.castShadow = true;

  const armR = new THREE.Mesh(armGeo, suitMat);
  armR.position.set(0.33, 0.78, 0);
  armR.castShadow = true;
  group.add(armL, armR);

  // Right Hand Holds "DYSCYPLINARKA" Lethal Red Document Folder
  const folder = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.06), redMat);
  folder.position.set(0, -0.22, 0.14);
  folder.rotation.y = -0.3;

  // Folder label "DYSCYPLINARKA"
  const folderLabel = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.07),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  folder.add(folderLabel);
  armR.add(folder);

  // Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.8),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  group.scale.setScalar(1.25);
  return { group, legL, legR, armL, armR, head };
}

