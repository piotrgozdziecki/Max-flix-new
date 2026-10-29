import { CharacterDef, CharacterId } from './types.ts';

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  marcin: {
    id: 'marcin',
    name: 'Marcin',
    role: 'Kierownik Zmiany & Główny Audytor Logistyki',
    title: 'Władca WZ-tek, Harmonogramu i Strefy Bezpieczeństwa',
    color: 0x1e3a8a, // Navy / Royal Blue
    secondaryColor: 0xf59e0b, // Amber / Gold
    speed: 7.5,
    jumpForce: 8.8,
    passiveName: 'Autorytet BHP & Pieczęć Pewności',
    passiveDescription: 'Zasięg automatycznego przyciągania zamówień VIP i WZ-tek powiększony o 100%. Marcin jest całkowicie odporny na odrzucenia od wózków widłowych.',
    abilityName: 'Pieczęć WZ-tki & Protokół Reklamacji',
    abilityDescription: 'Wbija wielką pieczęć kauczukową w podłogę! Emituje złotą falę sejsmiczną, odzyskuje 1 punkt utraconej kawy, ogłusza wrogów w promieniu 8m na 5 sekund i daje 8 sekund całkowitej nietykalności.',
    abilityCooldown: 6.0,
    voiceLines: [
      'Gdzie jest podpis na dokumencie WZ?! Bez podpisu paleta nie wyjedzie!',
      'Paleta z Włoch miała być na regale B4, ale sam to ogarnę!',
      'Spokojnie panowie, zgodnie z procedurą Max-Fliz: porządek i precyzja!',
      'Kto przestawił gres Calacatta Gold bez mojej autoryzacji?!',
      'Czysty magazyn to bezpieczny magazyn i premia dla każdego!',
      'Protokół reklamacji otwarty – zamykam tę aleję na własnych warunkach!'
    ],
    bio: 'Legenda krakowskiej logistyki Max-Fliz. Nigdy nie rozstaje się z aluminiową podkładką z dokumentami i pancernym tabletem. Zna kod kreskowy każdego formatu płytek na pamięć. Gdy Marcin krzyknie "KTO TO PODPISAŁ?!", na hali cichną nawet silniki spalinowych sztaplarek.',
    stats: {
      speed: 4,
      jump: 3,
      power: 4,
      defense: 5
    }
  },
  grzesiek: {
    id: 'grzesiek',
    name: 'Grzesiek',
    role: 'Ściskacz & Taran Magazynowy',
    title: 'Mistrz 44 cm w Obwodzie Ramienia',
    color: 0x16a34a, // Emerald Green
    secondaryColor: 0x22c55e,
    speed: 8.9,
    jumpForce: 8.5,
    passiveName: 'Masa Mięśniowa & Stalowy Biceps',
    passiveDescription: 'Każdy bezpośredni atak i naskok odrzuca przeciwników na podwójną odległość i natychmiast rozbija tarcze ochroniarzy Walczaka.',
    abilityName: 'Ścisk Zagłady 44cm',
    abilityDescription: 'Grzesiek wzywa obracające się z zawrotną prędkością hydrauliczne ramię miażdżące z kleszczami o sile 44 ton! Ściska przestrzeń, zadaje 3 obrażenia i wywołuje potężny wstrząs hali.',
    abilityCooldown: 4.5,
    voiceLines: [
      'Ściskam, bo muszę! To nie jest agresja, to czysta logistyczna potrzeba!',
      '44 cm obwodu ramienia i jeden ruch, a cała aleja robi się pusta!',
      'Pan Zdzichu mówił, że tak nie wolno, ale tak jest 3 razy szybciej!',
      'Trąbcie jak wjeżdżam w korytarz, bo nie biorę jeńców!',
      'Maksymalny załadunek regału? Dla mnie to dopiero rozgrzewka!',
      'Jeden ścisk i Walczak leży na palecie ze zniżką!'
    ],
    bio: 'Prawdziwy gladiator korytarza C. Potrafi podnieść paletę kleju bez użycia paleciaka i zawrócić wózkiem widłowym na monecie 5-złotowej. W ramieniu ma dumne 44 cm obwodu wypracowane na tysiącach ton hiszpańskiego gresu. Kiedy rusza do przodu, żadna przeszkoda nie ma racji bytu.',
    stats: {
      speed: 5,
      jump: 3,
      power: 5,
      defense: 4
    }
  },
  dawid: {
    id: 'dawid',
    name: 'Dawid',
    role: 'Arcymistrz Gresu & Cięcia pod Kątem 45°',
    title: 'Siłacz Wielkiego Formatu ("Ja Wiem Lepiej!")',
    color: 0xd97706, // Amber / Terracotta
    secondaryColor: 0xb45309,
    speed: 6.8,
    jumpForce: 10.2,
    passiveName: 'Kąt 45 Stopni z Chłodzeniem Wodnym',
    passiveDescription: 'Dystansowe pociski gresowe zadają 2x obrażenia, rykoszetują od ścian i automatycznie zbierają trafione przedmioty z mapy.',
    abilityName: 'Rzut Płytą Bouncing Calacatta 120x280',
    abilityDescription: 'Wyrzuca gigantyczną, obracającą się płytę gresową wielkiego formatu, która penetruje rzędy wrogów, usuwa przeszkody i aktywuje Atestowany Kask BHP na 15 sekund.',
    abilityCooldown: 5.0,
    voiceLines: [
      'Ja wiem lepiej, jak kłaść ten gres! Walczak nie ma zielonego pojęcia!',
      'Architekt chciał 3-metrowe płyty bez dylatacji na podłogówkę?! Przecież gres musi pracować! Ja wiem najlepiej!',
      'Zemsta za wyszczerbione płytki będzie cięta diamentem pod kątem 45 stopni!',
      'Format 120x280 cm? Dajcie mi dwie sztuki na raz pod pachę!',
      'Dla Max-Fliz i dla mnie fizyka budowlana nie ma żadnych tajemnic!',
      'Spójrz na tę fazę – gładka jak lustro! Odsunąć się, gres leci!'
    ],
    bio: 'Bezkompromisowy autorytet ceramiki luksusowej. Jego motto: "Ja wiem lepiej!" uciszyło już setki pseudo-ekspertów i zdezorientowanych architektów. Posiada tytaniczny skok, dzięki któremu bez trudu sięga najwyższych poziomów regałów wysokiego składu.',
    stats: {
      speed: 3,
      jump: 5,
      power: 5,
      defense: 4
    }
  },
  mateusz: {
    id: 'mateusz',
    name: 'Mateusz',
    role: 'Gejmer & Maniak PlayStation (9 mies. kontraktu)',
    title: 'Zdobywca Platyn i Pogromca Lagów',
    color: 0x7c3aed, // Purple / Indigo
    secondaryColor: 0xec4899,
    speed: 8.5,
    jumpForce: 9.5,
    passiveName: 'Efekt "9 Miesięcy Kontraktu"',
    passiveDescription: 'Mateusz odlicza dni do wolności. Co 9 zebranych przedmiotów lub pokonanych wrogów wyzwala falę energii "Speedrun", dającą 3 sekundy nietykalności i +100% prędkości sprintu.',
    abilityName: 'Atak Specjalny: "Pad DualSense & BSOD"',
    abilityDescription: 'Mateusz rzuca padem DualSense, wywołując błąd systemu "Niebieski Ekran Śmierci" u wrogów! Wszyscy przeciwnicy w zasięgu 10m zostają zamrożeni w "lagu" na 5 sekund, a Mateusz zyskuje "Buffa z Patcha 1.0", który odnawia mu 1 kawę.',
    abilityCooldown: 5.5,
    voiceLines: [
      'Pad mi się rozładował! Kto zajumał kabel USB-C z salonu?!',
      'Mam umowę na 9 miesięcy, jeszcze tylko 270 dni do platyny w prawdziwym życiu!',
      'To nie jest magazyn, to jest tryb Hardcore w Dark Souls, a Walczak to tylko średni boss.',
      'Laga mam! Ktoś na biurze znowu odpalił Netflixa na łączu magazynowym!',
      'Zaraz wpadnie trofeum: "Przetrwanie Zmiany bez Reklamacji"!',
      'Press F to pay respects dla tej palety gresu... Walczak, GG WP!'
    ],
    bio: 'Maniak konsolowy, który każdą wolną chwilę na magazynie spędza planując kolejne trofeum. Podpisał umowę na 9 miesięcy i odlicza dni do wolności, traktując korytarze Max-Fliz jak mapę w wymagającym souliksie. Jego biurko w showroomie to w rzeczywistości zamaskowane stanowisko gamingowe z PS5.',
    stats: {
      speed: 5,
      jump: 4,
      power: 4,
      defense: 4
    }
  },
  piotr: {
    id: 'piotr',
    name: 'Piotr',
    role: 'Senior Magazynier & Weteran Rezerw',
    title: 'Weteran Max-Fliz i Mistrz Ukrytej Flaszki Bimbru 70%',
    color: 0xef4444, // Crimson Red
    secondaryColor: 0xfacc15, // Bright Yellow
    speed: 9.0,
    jumpForce: 9.4,
    passiveName: 'Oko Majstra z 30-letnim Stażem',
    passiveDescription: 'Pokonani przeciwnicy ZAWSZE dropią skrzynie z perkami lub espresso! Piotr posiada stały wbudowany podwójny skok bez ograniczeń czasowych.',
    abilityName: 'Rzut Ukrytą Flaszką z Bimbrem (Koktajl Mołotowa)',
    abilityDescription: 'Piotr sięga za regał B4, wyjmuje butelkę 70% bimbru z płonącym knotem i miota nią jak koktajlem Mołotowa! Przy zderzeniu flaszka eksploduje, rozpryskuje szkło i tworzy na 6 sekund wielką plamę żywego ognia, która podpala i zadaje ciągłe obrażenia wszystkim wrogom!',
    abilityCooldown: 4.8,
    voiceLines: [
      'Bimber ze skarbczyka! 70 voltów zrobionych na drożdżach szlachetnych zza regału B4!',
      'Z drogi, bo rzucam flaszką! To stary przepis magazynowy – pali się lepiej niż napalm!',
      'Walczak myślał, że znalazł wszystkie moje ukryte zapasy? Ta butelka leżakowała od 2012 roku!',
      'Płonąca flaszka rozwiązuje każdy problem logistyczny w trzy sekundy!',
      'Za moich czasów zimą ogrzewaliśmy się tylko tym koktajlem!',
      'Jeden rzut i w korytarzu robi się ciepło! Ogień na gresie!'
    ],
    bio: 'Żywa historia i fundament magazynu Max-Fliz. Przetrwał kilkanaście reorganizacji, przeprowadzek i fuzji. Zna każdy zakamarek hali i tajemne schowki za paletami gresu. Jego sekretna broń to ukryta flaszka z 70-procentowym bimbrem domowej roboty, którą podpala i ciska niczym koktajl Mołotowa, zamieniając korytarz w morze ognia.',
    stats: {
      speed: 5,
      jump: 4,
      power: 5,
      defense: 5
    }
  }
};

