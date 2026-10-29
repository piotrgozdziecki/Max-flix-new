import * as THREE from 'three';
import { CHARACTERS } from './characters.ts';
import { CharacterId } from './types.ts';
import { sound } from './sound.ts';
import {
  getFloorTexture,
  getWallTexture,
  getShowroomMarbleFloorTexture,
  getShowroomWallTexture,
  getTerminalGraniteFloorTexture,
  getMaxFlizLogoTexture,
  getMarbleTexture,
  getTileBoxTexture,
  getHazardStripeTexture,
  createCharacterModel,
  createWalczakBossModel,
  createDisplayPodium,
  createShowroomPlant,
} from './warehouseAssets.ts';

export interface AssetItem {
  id: string;
  name: string;
  category: 'texture' | 'model' | 'audio';
  execute: () => any;
}

export class MaxFlizAssetLoader {
  private isLoaded = false;
  private isLoading = false;
  private preloadPromise: Promise<void> | null = null;
  private progress = 0;
  private overlayElem: HTMLElement | null = null;
  private fillElem: HTMLElement | null = null;
  private textElem: HTMLElement | null = null;
  private percentElem: HTMLElement | null = null;

  public loadingManager!: THREE.LoadingManager;
  public textureLoader!: THREE.TextureLoader;
  private loadedAssets: Map<string, { category: string; durationMs: number; success: boolean }> = new Map();
  private assetCache: Map<string, any> = new Map();

  constructor() {
    this.createOverlayUI();
    this.initLoadingManager();
  }

  private initLoadingManager() {
    this.loadingManager = new THREE.LoadingManager();

    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`%c[AssetLoader:LoadingManager] 🚀 Rozpoczęcie ładowania zasobów (${itemsTotal} pozycji w kolejce)... Pierwszy: ${url}`, 'color: #38bdf8; font-weight: bold;');
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const pct = Math.round((itemsLoaded / itemsTotal) * 100);
      console.log(`%c[AssetLoader:LoadingManager] ⏳ Postęp [${itemsLoaded}/${itemsTotal}] (${pct}%): ${url}`, 'color: #f59e0b;');
      this.updateProgress(pct, `Wczytywanie: ${url.split('/').pop()} (${pct}%)`);
    };

    this.loadingManager.onLoad = () => {
      console.log(`%c[AssetLoader:LoadingManager] ✅ Wszystkie zarejestrowane zasoby zostały pomyślnie przetworzone!`, 'color: #22c55e; font-weight: bold;');
      this.isLoaded = true;
      this.updateProgress(100, 'Zasoby 3D gotowe!');
    };

    this.loadingManager.onError = (url) => {
      console.error(`%c[AssetLoader:LoadingManager] ❌ Błąd ładowania zasobu: ${url}. Aktywowano procedurę bezpiecznego fallbacku.`, 'color: #ef4444; font-weight: bold;');
    };

    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
  }

  private createOverlayUI() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('asset-loader-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'asset-loader-overlay';
    overlay.className = 'asset-loader-overlay hidden';
    overlay.innerHTML = `
      <div class="loader-modal-card">
        <div class="loader-icon-spinner">🏗️</div>
        <div class="loader-header">MAX-FLIZ 3D LOGISTICS ENGINE</div>
        <div class="loader-subtitle">Inicjalizacja zasobów, tekstur i silnika 3D...</div>
        <div class="loader-track">
          <div id="loader-fill" class="loader-fill" style="width: 0%"></div>
        </div>
        <div class="loader-meta">
          <span id="loader-status-text" class="loader-status-text">Inicjalizacja systemu...</span>
          <span id="loader-percent" class="loader-percent">0%</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.overlayElem = overlay;
    this.fillElem = document.getElementById('loader-fill');
    this.textElem = document.getElementById('loader-status-text');
    this.percentElem = document.getElementById('loader-percent');
  }

  public show(message: string = 'Wczytywanie...') {
    if (this.overlayElem) {
      this.overlayElem.classList.remove('hidden');
    }
    this.updateProgress(this.progress, message);
  }

  public hide() {
    if (this.overlayElem) {
      this.overlayElem.classList.add('hidden');
    }
  }

  public updateProgress(percent: number, message: string) {
    this.progress = Math.min(Math.max(percent, 0), 100);
    if (this.fillElem) {
      this.fillElem.style.width = `${this.progress}%`;
    }
    if (this.textElem) {
      this.textElem.textContent = message;
    }
    if (this.percentElem) {
      this.percentElem.textContent = `${Math.round(this.progress)}%`;
    }
  }

  public preloadAll(): Promise<void> {
    if (this.isLoaded) return Promise.resolve();
    if (this.preloadPromise) return this.preloadPromise;

    this.isLoading = true;
    this.show('Inicjalizacja zasobów 3D...');

    this.preloadPromise = (async () => {
      const overallStartTime = performance.now();
      console.group('%c[AssetLoader] 🔍 INSPEKCJA ZASOBÓW: Inicjalizacja modeli 3D i tekstur', 'color: #38bdf8; font-weight: bold;');

      const assetList: AssetItem[] = [
        // --- Tekstury proceduralne Three.js ---
        { id: 'textures/floor_epoxy_warehouse.canvas', name: 'Tekstura: Polerowana Posadzka Epoksydowa (Sektor 1)', category: 'texture', execute: () => getFloorTexture() },
        { id: 'textures/wall_corrugated_metal.canvas', name: 'Tekstura: Ściany z Blachy Przemysłowej (Sektor 1)', category: 'texture', execute: () => getWallTexture() },
        { id: 'textures/showroom_marble_calacatta.canvas', name: 'Tekstura: Włoski Spiek Calacatta Gold (Sektor 2 / Showroom)', category: 'texture', execute: () => getShowroomMarbleFloorTexture() },
        { id: 'textures/showroom_oak_slat_wall.canvas', name: 'Tekstura: Ściany Akustyczne Lamele Dębowe (Showroom)', category: 'texture', execute: () => getShowroomWallTexture() },
        { id: 'textures/terminal_granite_floor.canvas', name: 'Tekstura: Granit Przemysłowy Rampy B1 (Sektor 3)', category: 'texture', execute: () => getTerminalGraniteFloorTexture() },
        { id: 'textures/maxfliz_neon_sign.canvas', name: 'Tekstura: Neon Logotypu Firmowego Max-Fliz', category: 'texture', execute: () => getMaxFlizLogoTexture() },
        { id: 'textures/marble_slab_calacatta.canvas', name: 'Tekstura: Wielkoformatowa Płyta Calacatta 120x280', category: 'texture', execute: () => getMarbleTexture('calacatta') },
        { id: 'textures/marble_slab_nero.canvas', name: 'Tekstura: Marmur Nero Marquina', category: 'texture', execute: () => getMarbleTexture('nero') },
        { id: 'textures/marble_wood_chevron.canvas', name: 'Tekstura: Gres Drewnopodobny Chevron', category: 'texture', execute: () => getMarbleTexture('wood') },
        { id: 'textures/marble_gold_mosaic.canvas', name: 'Tekstura: Mozaika Złota Gresowa', category: 'texture', execute: () => getMarbleTexture('gold_mosaic') },
        { id: 'textures/tile_packaging_box.canvas', name: 'Tekstura: Kartony Opakowaniowe Płytek', category: 'texture', execute: () => getTileBoxTexture() },
        { id: 'textures/hazard_warning_stripes.canvas', name: 'Tekstura: Pasy Ostrzegawcze BHP Żółto-Czarne', category: 'texture', execute: () => getHazardStripeTexture() },

        // --- Modele 3D (Postacie, Boss, Rekwizyty) ---
        { id: 'models/character_marcin.mesh', name: 'Model 3D: Marcin (Kierownik Logistyki)', category: 'model', execute: () => createCharacterModel(CHARACTERS.marcin) },
        { id: 'models/character_grzesiek.mesh', name: 'Model 3D: Grzesiek (Ściskacz 44cm)', category: 'model', execute: () => createCharacterModel(CHARACTERS.grzesiek) },
        { id: 'models/character_dawid.mesh', name: 'Model 3D: Dawid (Arcymistrz Gresu)', category: 'model', execute: () => createCharacterModel(CHARACTERS.dawid) },
        { id: 'models/character_mateusz.mesh', name: 'Model 3D: Mateusz (Gejmer & PS Maniak)', category: 'model', execute: () => createCharacterModel(CHARACTERS.mateusz) },
        { id: 'models/character_piotr.mesh', name: 'Model 3D: Piotr (Weteran & Mistrz Bimbru)', category: 'model', execute: () => createCharacterModel(CHARACTERS.piotr) },
        { id: 'models/boss_walczak.mesh', name: 'Model 3D: Boss Walczak (Były Kierownik)', category: 'model', execute: () => createWalczakBossModel() },
        { id: 'models/showroom_podium.mesh', name: 'Model 3D: Podest Ekspozycyjny Showroomu', category: 'model', execute: () => createDisplayPodium(2.8, 2.2, 0.25) },
        { id: 'models/showroom_plant.mesh', name: 'Model 3D: Złota Donica z Roślinnością Showroomu', category: 'model', execute: () => createShowroomPlant() },

        // --- Moduł syntezatora audio ---
        { id: 'audio/synthesizer_web_audio.ctx', name: 'Syntezator Dźwięków: WebAudio API Context', category: 'audio', execute: () => sound.initCtx() }
      ];

      // Batch processing with Promise.allSettled for safe mode fallback
      const batchSize = 3;
      for (let i = 0; i < assetList.length; i += batchSize) {
        const batch = assetList.slice(i, i + batchSize);
        const promises = batch.map(async (item, idx) => {
          const itemIdx = i + idx + 1;
          const itemStartTime = performance.now();
          this.loadingManager.itemStart(item.id);
          
          try {
            const result = item.execute();
            const duration = Math.round(performance.now() - itemStartTime);
            this.loadedAssets.set(item.id, { category: item.category, durationMs: duration, success: true });
            if (result) {
              this.assetCache.set(item.id, result);
            }
            this.loadingManager.itemEnd(item.id);
            this.updateProgress((itemIdx / assetList.length) * 100, `Wczytano: ${item.name}`);
          } catch (err) {
            console.warn(`[AssetLoader] ⚠️ Ostrzeżenie (Safe Mode Fallback): Zasób ${item.id} nie mógł zostać zainicjalizowany, kontynuuję w trybie awaryjnym.`, err);
            this.loadedAssets.set(item.id, { category: item.category, durationMs: 0, success: false });
            this.loadingManager.itemError(item.id);
            this.loadingManager.itemEnd(item.id);
          }
        });

        await Promise.allSettled(promises);
        await new Promise(r => requestAnimationFrame(r));
      }

      const totalTime = Math.round(performance.now() - overallStartTime);
      console.log(`%c[AssetLoader] 🏁 Załadowano ${assetList.length} zasobów w ${totalTime} ms.`, 'color: #22c55e; font-weight: bold;');
      console.groupEnd();

      this.isLoaded = true;
      this.isLoading = false;
      this.hide();
    })();

    return this.preloadPromise;
  }

  public async waitUntilReady(actionName: string = 'Uruchamianie'): Promise<void> {
    if (this.isLoaded) return;
    this.show(`Przygotowywanie zasobów (${actionName})...`);
    await this.preloadAll();
  }

  public getAsset<T = any>(id: string): T | null {
    return this.assetCache.get(id) || null;
  }

  public getClone<T = any>(id: string): T | null {
    const asset = this.assetCache.get(id);
    if (!asset) return null;
    if (asset.clone && typeof asset.clone === 'function') {
      return asset.clone(true) as unknown as T;
    }
    return asset as unknown as T;
  }
}

export const assetLoader = new MaxFlizAssetLoader();
