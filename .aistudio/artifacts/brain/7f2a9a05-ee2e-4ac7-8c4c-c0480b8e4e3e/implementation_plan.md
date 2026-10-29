# Plan Implementacji: Wizualne Dopracowanie Map, Sektorów i Auto-Skalowanie

## 1. Cel i Zakres Zmian
Użytkownik zwrócił uwagę, że w **Sektorze 2 (Showroom)** jest zbyt ciemno („jest czarno po prostu”), brakuje zróżnicowanych, atrakcyjnych posadzek w sektorach oraz potrzebne jest pełne auto-skalowanie i spójność wizualna. Zgodnie z odpowiedziami w ankiecie wprowadzamy:
- **Jasną posadzkę luksusową w Sektorze 2** z włoskiego gresu Calacatta Gold / Carrara ze złotymi dylatacjami i ciepłym światłem salonowym.
- **Ekskluzywne podesty wystawowe**, szklane panele działowe oraz elementy zieleni (rośliny w ceramicznych donicach Max-Fliz).
- **Zróżnicowane, dedykowane posadzki proceduralne** dla każdego z trzech sektorów.
- **Pełne dynamiczne auto-skalowanie** renderera, HUD-u oraz adaptacyjnego kąta widzenia (FOV) kamery na urządzeniach mobilnych, tabletach i desktopach.

---

## 2. Architektura i Zmiany w Modułach

### Krok 1: Nowe Proceduralne Tekstury Podłóg (`src/warehouseAssets.ts`)
- **`getShowroomMarbleFloorTexture()` (Sektor 2):**
  - Wygenerowanie na Canvasie 2048x2048 ultra-jasnej posadzki z wielkoformatowych płyt gresowych 120x120 cm (odcienie bieli kości słoniowej, delikatne złoto-szare użylenie Calacatta).
  - Szlachetne mosiężne fugi (`#d4af37` / `#e2b357`) z subtelnym podświetleniem.
  - Wyznaczone strefy ekspozycyjne dla wolnostojących wanien i baterii.
- **`getTerminalGraniteFloorTexture()` (Sektor 3):**
  - Wzmocniona ciemna posadzka granitowa z podświetlanymi pasami LED (`#38bdf8` i `#ef4444`) oraz pasami ostrzegawczymi ramp załadunkowych.
- **Zachowanie i wzbogacenie `getFloorTexture()` (Sektor 1):**
  - Polerowany beton epoksydowy z zielonym korytarzem pieszym i pasami dla wózków widłowych.

### Krok 2: Elementy Architektoniczne Showroomu (`src/warehouseAssets.ts`)
- **Podesty ekspozycyjne (`createDisplayPodium`):**
  - Eleganckie, podwyższone podesty z podświetleniem krawędziowym LED (ciepła biel 3000K), na których stoją wanny i eksponaty VIP.
- **Szklane ścianki działowe (`createGlassPartition`):**
  - Nowoczesne, przezierne panele szklane z czarnymi/mosiężnymi profilami, dzielące showroom na ekskluzywne strefy łazienkowe.
- **Roślinność dekoracyjna (`createShowroomPlant`):**
  - Ceramiczne donice wielkiego formatu z bujną zielenią (monstery, fikusy), ożywiające przestrzeń salonu i kontrastujące z kaflami.
- **Reflektory szynowe (`createTrackSpotlights`):**
  - Zespoły ciepłych punktów świetlnych oświetlających ekspozycje zamiast ciemnej pustki.

### Krok 3: Przebudowa Sektorów w Logice Gry (`src/game.ts`)
- **Sektor 2 (Showroom & Spa):**
  - Zmiana koloru i parametrów materiału podłogi: `map: getShowroomMarbleFloorTexture()`, `roughness: 0.12`, `metalness: 0.1`, jasny kolor bazowy `0xf8fafc` (zamiast ciemnoniebieskiego `0x0f2b46`).
  - Rozjaśnienie ściany tylnej (jasny beż architektoniczny z podświetleniem liniowym).
  - Umieszczenie podestów, szklanych parawanów i roślin wzdłuż alei.
  - Zmiana mgły (`scene.fog`) w Sektorze 2 na ciepłą, salonową (jasny grafit/złocisty odcień zamiast czerni).
- **Sektor 3 (Baza Przeładunkowa & Arena Bossa):**
  - Nowa posadzka terminalowa z podświetlanymi liniami wyznaczającymi strefę walki z Walczakiem i Królem-Leto.
- **Sektor 1 (Magazyn Główny B4):**
  - Wzbogacenie o dodatkowe palety gresu i oznaczenia pionowe regałów.

### Krok 4: Auto-Skalowanie i Responsywność (`src/index.ts` & `src/index.css`)
- **Adaptacyjne FOV Kamery:**
  - W `handleResize`: dynamiczne dopasowanie FOV w zależności od proporcji ekranu (na pionowych ekranach smartfonów FOV rozszerza się do 58–62°, a na ekranach ultrapanoramicznych do 42–45°), aby cała szerokość korytarza była zawsze widoczna.
- **Auto-skalowanie Canvasu:**
  - Prawidłowe pobieranie `window.innerWidth`, `window.innerHeight` oraz obsługa `window.devicePixelRatio` (z limitem do 2.0 dla zachowania płynności 60 FPS).
- **Responsywność HUD-u:**
  - Skalowanie wielkości czcionek i przycisków za pomocą `clamp()` i jednostek `dvh`/`vw`.
  - Elastyczne rozmieszczenie statystyk (Fugi, VIP, Czas, Paski Bossów) zapobiegające nachodzeniu na wycięcia aparatów (safe-area-inset).

---

## 3. Plan Weryfikacji
1. **Kompilacja i Linting:**
   - Wywołanie `compile_applet` i `lint_applet` z celem zerowych błędów TypeScript i budowania.
2. **Weryfikacja Wizualna Sektora 2:**
   - Sprawdzenie, czy Sektor 2 jest jasny, przestronny i nastrojowy (brak czarnego tła).
   - Weryfikacja obecności podestów, szklanych paneli i donic z roślinami.
3. **Weryfikacja Auto-Skalowania:**
   - Sprawdzenie zachowania kamery i interfejsu przy zmianie rozmiaru okna przeglądarki.
