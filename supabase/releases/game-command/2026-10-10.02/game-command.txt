// @ts-nocheck — Generated dashboard bundle; edit source modules instead.
// supabase/functions/game-command/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

// src/config.js
var RES = [
  "metal",
  "crystal",
  "fuel"
];
var BUILDINGS = {
  metal: {
    name: "Metallmine",
    icon: "\u26CF",
    cost: [
      80,
      35,
      0
    ],
    time: 8,
    description: "F\xF6rdert Metall f\xFCr Geb\xE4ude und Schiffe."
  },
  crystal: {
    name: "Kristallmine",
    icon: "\u25C6",
    cost: [
      65,
      60,
      0
    ],
    time: 9,
    description: "Kristalle f\xFCr Forschung und Elektronik."
  },
  fuel: {
    name: "Treibstoffanlage",
    icon: "\u25B0",
    cost: [
      90,
      50,
      0
    ],
    time: 10,
    description: "Versorgt deine Flotten mit Treibstoff."
  },
  solar: {
    name: "Solarkraftwerk",
    icon: "\u2600",
    cost: [
      75,
      40,
      0
    ],
    time: 8,
    description: "Liefert 45 Energie je Stufe."
  },
  warehouse: {
    name: "Lagerkomplex",
    icon: "\u25A4",
    cost: [
      120,
      60,
      0
    ],
    time: 10,
    description: "Erweitert alle lokalen Ressourcenlager."
  },
  lab: {
    name: "Forschungslabor",
    icon: "\u2697",
    cost: [
      150,
      100,
      0
    ],
    time: 12,
    description: "Schaltet imperiumsweite Forschung frei."
  },
  shipyard: {
    name: "Schiffswerft",
    icon: "\u2692",
    cost: [
      200,
      100,
      0
    ],
    time: 12,
    description: "Baut Sonden, Frachter, Kolonieschiffe und Kriegsschiffe.",
    requires: {
      building: "lab",
      level: 1
    }
  },
  robotics: {
    name: "Arbeitsroboter",
    icon: "\u2699",
    cost: [
      400,
      300,
      60
    ],
    time: 20,
    description: "Verk\xFCrzen neue Bauauftr\xE4ge um 8 % je Stufe.",
    requires: {
      tech: "engineering",
      level: 1
    }
  },
  orbital: {
    asset: "./assets/pvp-resource-v1/buildings/orbital.webp",
    name: "Orbitalplattform",
    icon: "\u25CE",
    cost: [
      600,
      400,
      120
    ],
    time: 60,
    description: "Je Stufe vier Pl\xE4tze f\xFCr orbitale Verteidigung; maximal Stufe 4.",
    requires: {
      tech: "military",
      level: 1
    }
  },
  bunker: {
    asset: "./assets/pvp-resource-v1/buildings/bunker.webp",
    name: "Ressourcenbunker",
    icon: "\u25A3",
    cost: [
      450,
      300,
      80
    ],
    time: 45,
    description: "Je Stufe sch\xFCtzt er 2,5 % der Lagerkapazit\xE4t, insgesamt maximal 2000 je Rohstoff.",
    requires: {
      tech: "military",
      level: 1
    }
  },
  tidal: {
    name: "Gezeitenkraftwerk",
    icon: "\u2248",
    cost: [
      700,
      450,
      80
    ],
    time: 30,
    description: "Liefert 180 Energie je Stufe auf Ozeanwelten.",
    requires: {
      tech: "energy",
      level: 3
    },
    ocean: true
  }
};
var TECHS = {
  scout: {
    name: "Sensortechnik",
    description: "Stufe 1: Sonden. Weitere Stufen: k\xFCrzere Sondenfl\xFCge und fr\xFChere PvP-Warnungen (90 % bis 10 % der Flugzeit).",
    cost: [
      100,
      100,
      30
    ],
    time: 10,
    lab: 1,
    max: 5
  },
  logistics: {
    name: "Transporttechnik",
    description: "Frachter freischalten; je Stufe +15 % Laderaum.",
    cost: [
      150,
      120,
      40
    ],
    time: 12,
    lab: 1,
    max: 5,
    requires: {
      tech: "scout",
      level: 1
    }
  },
  colonization: {
    name: "Kolonisierung",
    description: "Stufen 1\u20133: die drei Tutorial-Kolonien. Stufen 4\u20136: Pl\xE4tze f\xFCr die k\xFCnftige gemeinsame Galaxie.",
    cost: [
      350,
      250,
      100
    ],
    time: 16,
    lab: 2,
    max: 6,
    requires: {
      tech: "scout",
      level: 1
    }
  },
  drive: {
    name: "Verbrennungstriebwerke",
    description: "F\xFCr Sonden, Kolonieschiffe, kleine Transporter, Kurier und Falke: je Stufe +12 % Antriebsleistung; k\xFCrzere Fl\xFCge und weniger Verbrauch. Stufe 3 erm\xF6glicht Staustrahlforschung.",
    cost: [
      200,
      150,
      80
    ],
    time: 14,
    lab: 2,
    max: 5,
    requires: {
      tech: "logistics",
      level: 1
    }
  },
  ramjet: {
    name: "Staustrahltriebwerke",
    description: "Stufe 1: W\xE4chter; Stufe 2: Karawane. Je Stufe +12 % Leistung und weniger Verbrauch nur f\xFCr diese Schiffe. Stufe 1 bereitet Fl\xFCge in die k\xFCnftige gemeinsame Galaxie vor; Stufe 3 erm\xF6glicht Impulstriebwerke.",
    cost: [
      600,
      450,
      200
    ],
    time: 24,
    lab: 3,
    max: 5,
    requires: {
      tech: "drive",
      level: 3
    }
  },
  impulse: {
    name: "Impulstriebwerke",
    description: "Stufe 1: Donner; Stufe 2: Atlas. Je Stufe +12 % Leistung und weniger Verbrauch nur f\xFCr diese Schiffe. Stufe 3 erm\xF6glicht Hyperraumtriebwerke.",
    cost: [
      1800,
      1400,
      650
    ],
    time: 40,
    lab: 4,
    max: 5,
    requires: {
      tech: "ramjet",
      level: 3
    }
  },
  hyperspace: {
    name: "Hyperraumtriebwerke",
    description: "Stufe 1: Titan; Stufe 2: Arche. Je Stufe +12 % Leistung und weniger Verbrauch nur f\xFCr diese Schiffe.",
    cost: [
      5500,
      4200,
      2e3
    ],
    time: 65,
    lab: 5,
    max: 5,
    requires: {
      tech: "impulse",
      level: 3
    }
  },
  engineering: {
    name: "Bautechnik",
    description: "Je Stufe 5 % k\xFCrzere neue Bauauftr\xE4ge; Arbeitsroboter.",
    cost: [
      250,
      200,
      40
    ],
    time: 16,
    lab: 2,
    max: 5
  },
  military: {
    name: "Milit\xE4rtechnik",
    description: "Schaltet Falke, W\xE4chter, Donner und Titan frei. Schaltet die vier Kriegsschiffklassen und orbitale Verteidigung frei.",
    cost: [
      300,
      220,
      80
    ],
    time: 18,
    lab: 2,
    max: 4,
    requires: {
      tech: "engineering",
      level: 1
    }
  },
  weapons: {
    asset: "./assets/pvp-resource-v1/research/weapons.webp",
    name: "Waffentechnik",
    description: "Je Stufe +8 % Angriffsschaden.",
    cost: [
      400,
      300,
      100
    ],
    time: 60,
    lab: 3,
    max: 5,
    requires: {
      tech: "military",
      level: 1
    }
  },
  shields: {
    asset: "./assets/pvp-resource-v1/research/shields.webp",
    name: "Schildtechnik",
    description: "Je Stufe +8 % Schildst\xE4rke.",
    cost: [
      350,
      450,
      100
    ],
    time: 60,
    lab: 3,
    max: 5,
    requires: {
      tech: "military",
      level: 1
    }
  },
  armor: {
    asset: "./assets/pvp-resource-v1/research/armor.webp",
    name: "Panzerung",
    description: "Je Stufe +8 % H\xFCllenpunkte.",
    cost: [
      500,
      250,
      100
    ],
    time: 60,
    lab: 3,
    max: 5,
    requires: {
      tech: "military",
      level: 1
    }
  },
  assaultDrive: {
    asset: "./assets/pvp-resource-v1/research/assaultDrive.webp",
    name: "Falke-Galaxieantrieb",
    description: "R\xFCstet Falken f\xFCr interstellare Angriffe und Stationierungen mit Staustrahlantrieb aus.",
    cost: [
      600,
      400,
      200
    ],
    time: 60,
    lab: 3,
    max: 1,
    requires: {
      tech: "ramjet",
      level: 1
    }
  },
  energy: {
    name: "Energietechnik",
    description: "Je Stufe +10 % Energie; Stufe 3: Gezeitenkraftwerk.",
    cost: [
      200,
      180,
      50
    ],
    time: 15,
    lab: 2,
    max: 5
  }
};
var SHIPS = {
  probe: {
    name: "Erkundungssonde",
    icon: "\u2301",
    category: "civil",
    role: "Erkundet unbekannte Welten.",
    cost: [
      90,
      60,
      20
    ],
    time: 5,
    tech: "scout",
    cargo: 0,
    speed: 1,
    fuel: 1.5
  },
  transport: {
    name: "Kleiner Transporter",
    icon: "\u27A4",
    category: "freighter",
    role: "Bew\xE4hrter Allrounder f\xFCr deine ersten Kolonien.",
    cost: [
      180,
      100,
      40
    ],
    time: 8,
    tech: "logistics",
    cargo: 1e3,
    speed: 1,
    fuel: 4
  },
  longProbe: {
    name: "Fernsonde",
    icon: "\u2301",
    category: "civil",
    image: "probe",
    role: "Untersucht Planeten in der gemeinsamen Galaxie.",
    cost: [
      280,
      200,
      80
    ],
    time: 10,
    tech: "scout",
    techLevel: 2,
    shipyard: 2,
    engine: "ramjet",
    engineLevel: 1,
    cargo: 0,
    speed: 1,
    fuel: 3
  },
  starColony: {
    name: "Interstellares Kolonieschiff",
    icon: "\u2726",
    category: "civil",
    image: "colony",
    role: "Besiedelt eine erkundete Galaxiewelt und wird dabei verbraucht.",
    cost: [
      1200,
      850,
      400
    ],
    time: 30,
    tech: "colonization",
    techLevel: 4,
    shipyard: 3,
    engine: "ramjet",
    engineLevel: 1,
    cargo: 0,
    speed: 1,
    fuel: 18
  },
  colony: {
    name: "Kolonieschiff",
    icon: "\u2726",
    category: "civil",
    role: "Gr\xFCndet eine Kolonie und wird dabei verbraucht.",
    cost: [
      500,
      300,
      100
    ],
    time: 12,
    tech: "colonization",
    cargo: 0,
    speed: 1,
    fuel: 4
  },
  kurier: {
    name: "Kurier",
    icon: "\u27A4",
    category: "freighter",
    tier: 1,
    role: "Leichter Frachter f\xFCr schnelle kleine Lieferungen.",
    cost: [
      140,
      80,
      30
    ],
    time: 6,
    tech: "logistics",
    techLevel: 1,
    shipyard: 1,
    cargo: 750,
    speed: 1.35,
    fuel: 3
  },
  karawane: {
    name: "Karawane",
    icon: "\u27A4",
    category: "freighter",
    tier: 2,
    role: "Modulfrachter f\xFCr regelm\xE4\xDFige Handelsrouten.",
    cost: [
      800,
      450,
      180
    ],
    time: 20,
    tech: "logistics",
    techLevel: 2,
    shipyard: 2,
    engine: "ramjet",
    engineLevel: 2,
    cargo: 5e3,
    speed: 0.9,
    fuel: 12
  },
  atlas: {
    name: "Atlas",
    icon: "\u27A4",
    category: "freighter",
    tier: 3,
    role: "Schwerlastfrachter f\xFCr den Ausbau ganzer Kolonien.",
    cost: [
      2400,
      1400,
      600
    ],
    time: 45,
    tech: "logistics",
    techLevel: 3,
    shipyard: 4,
    engine: "impulse",
    engineLevel: 2,
    cargo: 16e3,
    speed: 0.7,
    fuel: 28
  },
  arche: {
    name: "Arche",
    icon: "\u27A4",
    category: "freighter",
    tier: 4,
    role: "Megafrachter f\xFCr gro\xDFe Sammellieferungen.",
    cost: [
      7600,
      4400,
      2e3
    ],
    time: 90,
    tech: "logistics",
    techLevel: 5,
    shipyard: 6,
    engine: "hyperspace",
    engineLevel: 2,
    cargo: 5e4,
    speed: 0.55,
    fuel: 70
  },
  falke: {
    name: "Falke",
    icon: "\u2727",
    category: "military",
    tier: 1,
    role: "Abfangj\xE4ger f\xFCr schnelle Verlegungen.",
    cost: [
      240,
      150,
      60
    ],
    time: 60,
    tech: "military",
    techLevel: 1,
    shipyard: 1,
    cargo: 0,
    speed: 1.5,
    fuel: 6
  },
  waechter: {
    name: "W\xE4chter",
    icon: "\u2727",
    category: "military",
    tier: 2,
    role: "Eskortfregatte als Grundlage f\xFCr sp\xE4teren Geleitschutz.",
    cost: [
      900,
      600,
      220
    ],
    time: 180,
    tech: "military",
    techLevel: 2,
    shipyard: 2,
    engine: "ramjet",
    engineLevel: 1,
    cargo: 0,
    speed: 1.1,
    fuel: 16
  },
  donner: {
    name: "Donner",
    icon: "\u2727",
    category: "military",
    tier: 3,
    role: "Angriffskreuzer f\xFCr die sp\xE4tere Kampfflotte.",
    cost: [
      3e3,
      1800,
      700
    ],
    time: 480,
    tech: "military",
    techLevel: 3,
    shipyard: 4,
    engine: "impulse",
    engineLevel: 1,
    cargo: 0,
    speed: 0.85,
    fuel: 40
  },
  flak: {
    asset: "./assets/pvp-resource-v1/defense/flak.webp",
    name: "Orbitalflak",
    icon: "\u2723",
    category: "defense",
    role: "Abwehr gegen Falken.",
    cost: [
      160,
      80,
      20
    ],
    time: 60,
    tech: "military",
    techLevel: 1,
    shipyard: 2,
    slots: 1,
    cargo: 0,
    speed: 0,
    fuel: 0
  },
  laser: {
    asset: "./assets/pvp-resource-v1/defense/laser.webp",
    name: "Laserbatterie",
    icon: "\u2295",
    category: "defense",
    role: "Universelle orbitale Abwehr.",
    cost: [
      450,
      300,
      70
    ],
    time: 180,
    tech: "military",
    techLevel: 2,
    shipyard: 3,
    slots: 2,
    cargo: 0,
    speed: 0,
    fuel: 0
  },
  rail: {
    asset: "./assets/pvp-resource-v1/defense/rail.webp",
    name: "Railgun",
    icon: "\u2316",
    category: "defense",
    role: "Abwehr gegen schwere Kriegsschiffe.",
    cost: [
      1400,
      1e3,
      280
    ],
    time: 480,
    tech: "military",
    techLevel: 3,
    shipyard: 4,
    slots: 3,
    cargo: 0,
    speed: 0,
    fuel: 0
  },
  plasma: {
    asset: "./assets/pvp-resource-v1/defense/plasma.webp",
    name: "Plasmagesch\xFCtz",
    icon: "\u273A",
    category: "defense",
    role: "Schwere Abwehr gegen Titanen.",
    cost: [
      4e3,
      2800,
      900
    ],
    time: 1200,
    tech: "military",
    techLevel: 4,
    shipyard: 6,
    slots: 4,
    cargo: 0,
    speed: 0,
    fuel: 0
  },
  titan: {
    name: "Titan",
    icon: "\u2727",
    category: "military",
    tier: 4,
    role: "Schlachtschiff als Kern einer schweren Flotte.",
    cost: [
      9500,
      6500,
      2500
    ],
    time: 1200,
    tech: "military",
    techLevel: 4,
    shipyard: 6,
    engine: "hyperspace",
    engineLevel: 1,
    cargo: 0,
    speed: 0.6,
    fuel: 100
  }
};
function isFreighter(key) {
  return SHIPS[key]?.category === "freighter";
}
var TARGETS = [
  {
    id: "ferrum",
    name: "Ferrum",
    coord: "1:2:7",
    kind: "Gesteinsplanet",
    specialty: "Metall",
    distance: 2,
    mult: [
      1.8,
      0.75,
      0.65
    ],
    color: "#ba7047",
    ocean: false,
    energy: 1
  },
  {
    id: "nereus",
    name: "Nereus",
    coord: "1:3:7",
    kind: "Eisplanet",
    specialty: "Treibstoff",
    distance: 3,
    mult: [
      0.7,
      1,
      1.9
    ],
    color: "#80cbe3",
    ocean: false,
    energy: 1.2
  },
  {
    id: "thalassa",
    name: "Thalassa",
    coord: "1:4:5",
    kind: "Ozeanplanet",
    specialty: "Kristall",
    distance: 4,
    mult: [
      0.85,
      1.6,
      1.1
    ],
    color: "#3c92c9",
    ocean: true,
    energy: 1
  }
];
function vector(values) {
  return Object.fromEntries(RES.map((k, i) => [
    k,
    values[i]
  ]));
}
function costAt(item, level) {
  return vector(item.cost.map((v) => Math.ceil(v * Math.pow(1.6, level))));
}
var ROUTE_ECONOMY = {
  time: 1.25,
  fuel: 0.75
};
function shipFlightEngine(s, key, remote = false) {
  return remote && key === "falke" && (s.tech.assaultDrive || 0) >= 1 ? "ramjet" : SHIPS[key]?.engine || "drive";
}
function canFlyInterstellar(s, key) {
  const engine = shipFlightEngine(s, key, true);
  return (key === "falke" ? (s.tech.assaultDrive || 0) >= 1 : !!SHIPS[key]?.engine) && (s.tech[engine] || 0) >= 1;
}

// src/combat.js
var COMBAT = {
  probe: {
    hp: 30,
    shield: 0,
    attack: 0,
    shots: 1
  },
  longProbe: {
    hp: 60,
    shield: 10,
    attack: 0,
    shots: 1
  },
  colony: {
    hp: 250,
    shield: 30,
    attack: 0,
    shots: 1
  },
  starColony: {
    hp: 500,
    shield: 80,
    attack: 0,
    shots: 1
  },
  transport: {
    hp: 100,
    shield: 20,
    attack: 0,
    shots: 1
  },
  kurier: {
    hp: 80,
    shield: 10,
    attack: 0,
    shots: 1
  },
  karawane: {
    hp: 450,
    shield: 80,
    attack: 0,
    shots: 1
  },
  atlas: {
    hp: 1400,
    shield: 200,
    attack: 0,
    shots: 1
  },
  arche: {
    hp: 4e3,
    shield: 600,
    attack: 0,
    shots: 1
  },
  falke: {
    hp: 160,
    shield: 40,
    attack: 30,
    shots: 1,
    bonus: {
      donner: 0.25,
      titan: 0.25
    }
  },
  waechter: {
    hp: 650,
    shield: 180,
    attack: 100,
    shots: 2,
    bonus: {
      falke: 0.5
    }
  },
  donner: {
    hp: 2e3,
    shield: 400,
    attack: 350,
    shots: 2,
    bonus: {
      flak: 0.5,
      laser: 0.5,
      rail: 0.5,
      plasma: 0.5
    }
  },
  titan: {
    hp: 6500,
    shield: 1400,
    attack: 1100,
    shots: 4,
    bonus: {
      waechter: 0.25,
      donner: 0.25
    }
  },
  flak: {
    hp: 180,
    shield: 30,
    attack: 35,
    shots: 2,
    bonus: {
      falke: 0.75
    }
  },
  laser: {
    hp: 600,
    shield: 150,
    attack: 100,
    shots: 2
  },
  rail: {
    hp: 1600,
    shield: 300,
    attack: 300,
    shots: 1,
    bonus: {
      donner: 0.25,
      titan: 0.25
    }
  },
  plasma: {
    hp: 4500,
    shield: 800,
    attack: 800,
    shots: 2,
    bonus: {
      titan: 0.25
    }
  }
};
function combatStats(key, tech = {}) {
  const c = COMBAT[key];
  if (!c) throw Error("Unbekannte Kampfeinheit.");
  return {
    ...c,
    hp: c.hp * (1 + 0.08 * (tech.armor || 0)),
    shield: c.shield * (1 + 0.08 * (tech.shields || 0)),
    attack: c.attack * (1 + 0.08 * (tech.weapons || 0))
  };
}
function attackFleet(fleet) {
  if (!fleet || typeof fleet !== "object" || Array.isArray(fleet)) throw Error("Ung\xFCltige Angriffsflotte.");
  const entries = Object.entries(fleet);
  if (!entries.length || entries.some(([k, n]) => ![
    "military",
    "freighter"
  ].includes(SHIPS[k]?.category) || !Number.isSafeInteger(n) || n < 1) || entries.reduce((a, [, n]) => a + n, 0) > 100 || !entries.some(([k]) => SHIPS[k].category === "military")) throw Error("W\xE4hle 1\u2013100 Schiffe und mindestens ein Kriegsschiff.");
  return {
    ...fleet
  };
}
function attackFlight(s, from, to, fleet) {
  attackFleet(fleet);
  if (!to.system) throw Error("Angriffsziele m\xFCssen fremde gemeinsame Kolonien sein.");
  const origin = from.system ? from : {
    ...s.galaxy,
    slot: 0
  };
  if (![
    origin.x,
    origin.y,
    origin.slot,
    to.x,
    to.y,
    to.slot
  ].every(Number.isFinite)) throw Error("Der pers\xF6nliche Galaxie-Startplatz fehlt. Bitte die Galaxie aktualisieren.");
  if (!from.system && (s.tech.ramjet || 0) < 1) throw Error("F\xFCr Angriffe aus dem Heimatsystem fehlen Staustrahltriebwerke Stufe 1.");
  const dist = Math.max(1, Math.hypot(origin.x - to.x, origin.y - to.y) / 40 + Math.abs(origin.slot - to.slot) * 0.15);
  let ms2 = 0, fuel = 0, slowest = "";
  for (const [key, count] of Object.entries(fleet)) {
    const sh = SHIPS[key], remote = from.system !== to.system;
    const engine = shipFlightEngine(s, key, remote);
    if (remote && !canFlyInterstellar(s, key)) throw Error(key === "falke" ? "F\xFCr interstellare Fl\xFCge fehlt ein geeigneter Antrieb: Falke-Galaxieantrieb 1 und Staustrahltriebwerke 1 erforderlich." : "F\xFCr interstellare Fl\xFCge fehlt ein geeigneter Antrieb.");
    if (remote && (s.tech[engine] || 0) < 1) throw Error("F\xFCr interstellare Fl\xFCge fehlt die passende Triebwerksforschung.");
    const factor = 1 + 0.12 * (s.tech[engine] || 0);
    const time = Math.max(3e5, Math.ceil((600 + dist * 120) * 1e3 / (sh.speed * factor)));
    if (time > ms2) {
      ms2 = time;
      slowest = key;
    }
    fuel += Math.ceil(sh.fuel * 2 * dist * count / factor);
  }
  return {
    distance: dist,
    ms: ms2,
    fuel,
    slowest
  };
}
function warningFraction(sensorLevel) {
  return Math.max(0.1, Math.min(0.9, 0.9 - 0.16 * sensorLevel));
}
function takeHulls(p, fleet) {
  const out = {};
  p.hulls ??= {};
  for (const [k, n] of Object.entries(fleet)) {
    const damaged = p.hulls[k] || [];
    out[k] = damaged.splice(0, n);
    if (!damaged.length) delete p.hulls[k];
  }
  return out;
}
function putHulls(p, hulls = {}) {
  p.hulls ??= {};
  for (const [k, hp] of Object.entries(hulls)) if (hp.length) p.hulls[k] = [
    ...p.hulls[k] || [],
    ...hp
  ];
}
function rng(seed) {
  let n = 2166136261;
  for (const c of seed) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    return (n >>> 0) / 4294967296;
  };
}
function units(fleet, tech, hulls, shieldFactor2 = 1) {
  const out = [];
  for (const key of Object.keys(fleet).sort()) {
    const n = fleet[key];
    if (!Number.isInteger(n) || n < 0) throw Error("Ung\xFCltiger Flottenbestand.");
    if (out.length + n > 5e3) throw Error("Kampfflotten sind vorerst auf 5000 Einheiten je Seite begrenzt.");
    const z = combatStats(key, tech);
    z.shield *= shieldFactor2;
    for (let i = 0; i < n; i++) out.push({
      key,
      ...z,
      maxHp: z.hp,
      hp: z.hp * (hulls?.[key]?.[i] ?? 1)
    });
  }
  return out;
}
function survivors(list) {
  const fleet = {}, hulls = {};
  for (const u of list) if (u.hp > 1e-8) {
    fleet[u.key] = (fleet[u.key] || 0) + 1;
    if (u.hp < u.maxHp - 1e-8) (hulls[u.key] ??= []).push(u.hp / u.maxHp);
  }
  return {
    fleet,
    hulls
  };
}
function resolveBattleLegacy(attacker, defender, seed) {
  const a = units(attacker.fleet, attacker.tech, attacker.hulls, attacker.shieldFactor), d = units(defender.fleet, defender.tech, defender.hulls, defender.shieldFactor), random = rng(seed), rounds = [];
  for (let i = 1; i <= 6; i++) {
    let fire = function(shooters, targets) {
      for (const u of shooters) if (u.attack) for (let shot = 0; shot < u.shots; shot++) {
        const target = targets[Math.floor(random() * targets.length)], hit = u.attack / u.shots * (1 + (u.bonus?.[target.key] || 0));
        damage.set(target, (damage.get(target) || 0) + hit);
      }
    };
    const aa2 = a.filter((u) => u.hp > 1e-8), dd2 = d.filter((u) => u.hp > 1e-8);
    if (!aa2.length || !dd2.length) break;
    const damage = /* @__PURE__ */ new Map();
    fire(aa2, dd2);
    fire(dd2, aa2);
    for (const [u, hit] of damage) {
      const shield = Math.min(u.shield, hit);
      u.shield -= shield;
      u.hp -= hit - shield;
    }
    rounds.push({
      round: i,
      attacker: a.filter((u) => u.hp > 1e-8).length,
      defender: d.filter((u) => u.hp > 1e-8).length
    });
  }
  const aa = survivors(a), dd = survivors(d), ac = Object.values(aa.fleet).reduce((a2, b) => a2 + b, 0), dc = Object.values(dd.fleet).reduce((a2, b) => a2 + b, 0);
  const debris = vector([
    0,
    0,
    0
  ]), defenseRepair = vector([
    0,
    0,
    0
  ]);
  for (const u of [
    ...a,
    ...d
  ]) if (u.hp <= 1e-8) {
    const sh = SHIPS[u.key], out = sh.category === "defense" ? defenseRepair : debris, rate = sh.category === "defense" ? 0.7 : 0.3;
    out.metal += sh.cost[0] * rate;
    out.crystal += sh.cost[1] * rate;
  }
  for (const k of RES) {
    debris[k] = Math.floor(debris[k]);
    defenseRepair[k] = Math.floor(defenseRepair[k]);
  }
  return {
    outcome: ac && !dc ? "attacker" : dc && !ac ? "defender" : "draw",
    attacker: aa,
    defender: dd,
    debris,
    defenseRepair,
    rounds
  };
}
var COMBAT_RULE_VERSION = 2;
function resolveBattle(attacker, defender, seed, version = COMBAT_RULE_VERSION) {
  if (version === 1) return resolveBattleLegacy(attacker, defender, seed);
  if (version !== 2) throw Error("Unbekannte Kampfregelversion.");
  const a = units(attacker.fleet, attacker.tech, attacker.hulls, attacker.shieldFactor), d = units(defender.fleet, defender.tech, defender.hulls, defender.shieldFactor), random = rng(String(seed)), rounds = [], logs = [];
  for (const [side, list] of [
    [
      "A",
      a
    ],
    [
      "D",
      d
    ]
  ]) {
    const counts = {};
    for (const u of list) {
      counts[u.key] = (counts[u.key] || 0) + 1;
      u.id = side + "-" + u.key + "-" + String(counts[u.key]).padStart(3, "0");
    }
  }
  const snapshot = (u) => ({
    id: u.id,
    key: u.key,
    side: u.id[0] === "A" ? "attacker" : "defender",
    category: SHIPS[u.key].category,
    name: SHIPS[u.key].name,
    definition: {
      ...COMBAT[u.key],
      cost: [
        ...SHIPS[u.key].cost
      ]
    },
    hp: Math.max(0, u.hp),
    maxHp: u.maxHp,
    shield: u.shield,
    maxShield: combatStats(u.key, u.id[0] === "A" ? attacker.tech : defender.tech).shield,
    attack: u.attack,
    shots: u.shots,
    bonus: {
      ...u.bonus
    }
  });
  const initial = [
    ...a,
    ...d
  ].map(snapshot);
  const total = (list) => ({
    count: list.filter((u) => u.hp > 1e-8).length,
    hp: list.reduce((n, u) => n + Math.max(0, u.hp), 0),
    shield: list.filter((u) => u.hp > 1e-8).reduce((n, u) => n + u.shield, 0)
  });
  for (let round = 1; round <= 6; round++) {
    let fire = function(shooters, targets) {
      const military = targets.filter((t) => SHIPS[t.key].category === "military");
      const allowed = military.length ? targets.filter((t) => [
        "military",
        "defense"
      ].includes(SHIPS[t.key].category)) : targets;
      const defense = allowed.filter((t) => SHIPS[t.key].category === "defense");
      for (const u of shooters) if (u.attack) {
        const bonusTargets = allowed.filter((t) => (u.bonus?.[t.key] || 0) > 0);
        const pool = bonusTargets.length ? bonusTargets : military.length ? military : defense.length ? defense : allowed;
        const reason = bonusTargets.length ? "bonus" : military.length ? "military" : defense.length ? "defense" : "civil";
        for (let shot = 1; shot <= u.shots; shot++) {
          const target = pool[Math.floor(random() * pool.length)], base = u.attack / u.shots, bonus = u.bonus?.[target.key] || 0, hit = base * (1 + bonus);
          shots.push({
            shooter: u.id,
            target: target.id,
            shot,
            base,
            bonus,
            damage: hit,
            reason
          });
          damage.set(target, (damage.get(target) || 0) + hit);
        }
      }
    };
    const aa2 = a.filter((u) => u.hp > 1e-8), dd2 = d.filter((u) => u.hp > 1e-8);
    if (!aa2.length || !dd2.length) break;
    const damage = /* @__PURE__ */ new Map(), shots = [];
    fire(aa2, dd2);
    fire(dd2, aa2);
    const impacts = [];
    for (const [u, hit] of damage) {
      const hpBefore = u.hp, shieldBefore = u.shield, shieldDamage = Math.min(u.shield, hit), hullDamage = Math.min(Math.max(0, u.hp), hit - shieldDamage);
      u.shield -= shieldDamage;
      u.hp -= hit - shieldDamage;
      impacts.push({
        target: u.id,
        damage: hit,
        shieldDamage,
        hullDamage,
        overkill: Math.max(0, hit - shieldDamage - hpBefore),
        hpBefore,
        shieldBefore,
        hpAfter: Math.max(0, u.hp),
        shieldAfter: u.hp > 1e-8 ? u.shield : 0,
        destroyed: u.hp <= 1e-8
      });
    }
    const after = {
      attacker: total(a),
      defender: total(d)
    };
    rounds.push({
      round,
      attacker: after.attacker.count,
      defender: after.defender.count
    });
    logs.push({
      round,
      shots,
      impacts,
      after
    });
  }
  const aa = survivors(a), dd = survivors(d), ac = Object.values(aa.fleet).reduce((n, v) => n + v, 0), dc = Object.values(dd.fleet).reduce((n, v) => n + v, 0), outcome = ac && !dc ? "attacker" : dc && !ac ? "defender" : "draw";
  const debris = vector([
    0,
    0,
    0
  ]), defenseRepair = vector([
    0,
    0,
    0
  ]);
  for (const u of [
    ...a,
    ...d
  ]) if (u.hp <= 1e-8) {
    const sh = SHIPS[u.key], out = sh.category === "defense" ? defenseRepair : debris, rate = sh.category === "defense" ? 0.7 : 0.3;
    out.metal += sh.cost[0] * rate;
    out.crystal += sh.cost[1] * rate;
  }
  for (const k of RES) {
    debris[k] = Math.floor(debris[k]);
    defenseRepair[k] = Math.floor(defenseRepair[k]);
  }
  return {
    outcome,
    attacker: aa,
    defender: dd,
    debris,
    defenseRepair,
    rounds,
    trace: {
      version: 1,
      ruleVersion: 2,
      seed: String(seed),
      tech: {
        attacker: {
          ...attacker.tech
        },
        defender: {
          ...defender.tech
        }
      },
      shieldFactors: {
        attacker: attacker.shieldFactor ?? 1,
        defender: defender.shieldFactor ?? 1
      },
      initial,
      final: [
        ...a,
        ...d
      ].map(snapshot),
      rounds: logs
    }
  };
}
function loadPlunder(stock, depot, bunker, capacity2, debris, victory, budget = stock) {
  const loot = vector([
    0,
    0,
    0
  ]), salvage = vector([
    0,
    0,
    0
  ]);
  let room = Math.max(0, capacity2);
  if (victory) for (const k of RES) {
    loot[k] = Math.min(room, Math.floor(Math.max(0, stock[k] + depot[k] - bunker) * 0.25), budget[k]);
    room -= loot[k];
  }
  if (victory) for (const k of RES) {
    salvage[k] = Math.min(room, debris[k]);
    room -= salvage[k];
  }
  return {
    loot,
    salvage,
    cargo: vector(RES.map((k) => loot[k] + salvage[k]))
  };
}

// src/engine.js
function planet(id, name, meta = {}) {
  return {
    id,
    name,
    coord: meta.coord || "1:1:4",
    kind: meta.kind || "Heimatwelt",
    mult: meta.mult || [
      1,
      1,
      1
    ],
    color: meta.color || "#53add3",
    ocean: meta.ocean ?? true,
    energy: meta.energy || 1,
    distance: meta.distance || 0,
    reserves: vector([
      0,
      0,
      0
    ]),
    resources: vector([
      0,
      0,
      0
    ]),
    depot: vector([
      0,
      0,
      0
    ]),
    buildings: Object.fromEntries(Object.keys(BUILDINGS).map((k) => [
      k,
      0
    ])),
    ships: Object.fromEntries(Object.keys(SHIPS).map((k) => [
      k,
      0
    ])),
    build: null,
    shipjob: null
  };
}
function newGame(name = "Commander", now = Date.now()) {
  const home = planet("home", "Aurelia");
  home.resources = vector([
    3e3,
    2200,
    1e3
  ]);
  Object.assign(home.buildings, {
    metal: 1,
    crystal: 1,
    fuel: 1,
    solar: 3
  });
  return {
    version: 1,
    name: name.trim().slice(0, 30) || "Commander",
    time: now,
    created: now,
    seq: 0,
    active: "home",
    planets: [
      home
    ],
    tech: Object.fromEntries(Object.keys(TECHS).map((k) => [
      k,
      0
    ])),
    research: null,
    discovered: [],
    missions: [],
    reports: []
  };
}
function getPlanet(s, id) {
  const p = s.planets.find((p2) => p2.id === id);
  if (!p) throw Error("Planet nicht gefunden.");
  return p;
}
function capacity(p) {
  return 4e3 * Math.pow(1.7, p.buildings.warehouse);
}
function stats(s, p) {
  const supply = (p.buildings.solar * 45 + p.buildings.tidal * 180) * (1 + s.tech.energy * 0.1);
  const demand = (p.buildings.metal * 15 + p.buildings.crystal * 18 + p.buildings.fuel * 20) * p.energy;
  const ratio = demand ? Math.min(1, supply / demand) : 1;
  const rates = vector(RES.map((k, i) => p.buildings[k] ? [
    300,
    220,
    140
  ][i] * p.buildings[k] * Math.pow(1.12, p.buildings[k] - 1) * p.mult[i] * ratio : 0));
  return {
    supply,
    demand,
    ratio,
    rates,
    cap: capacity(p)
  };
}
function settle(p) {
  const cap = capacity(p);
  for (const k of RES) {
    const n = Math.min(Math.max(0, cap - p.resources[k]), p.depot[k]);
    p.resources[k] += n;
    p.depot[k] -= n;
  }
}
function deliver(p, cargo) {
  for (const k of RES) p.depot[k] += cargo[k];
  settle(p);
}
function produce(s, ms2) {
  for (const p of s.planets) {
    settle(p);
    const z = stats(s, p);
    for (const k of RES) p.resources[k] = Math.min(z.cap, p.resources[k] + z.rates[k] * ms2 / 36e5);
  }
}
function report(s, title, body) {
  s.reports.unshift({
    id: ++s.seq,
    time: s.time,
    title,
    body
  });
  s.reports = s.reports.slice(0, 60);
}
function need(s, p, req) {
  if (!req) return "";
  if (req.tech && s.tech[req.tech] < req.level) return `Ben\xF6tigt ${TECHS[req.tech].name} Stufe ${req.level}.`;
  if (req.building && p.buildings[req.building] < req.level) return `Ben\xF6tigt ${BUILDINGS[req.building].name} Stufe ${req.level}.`;
  return "";
}
function buildInfo(s, p, key) {
  const b = BUILDINGS[key];
  if (!b) throw Error("Unbekanntes Geb\xE4ude.");
  const l = p.buildings[key];
  return {
    cost: costAt(b, l),
    ms: Math.ceil(b.time * Math.pow(1.35, l) * Math.pow(0.95, s.tech.engineering) * Math.pow(0.92, p.buildings.robotics) * 1e3),
    reason: need(s, p, b.requires) || (b.ocean && !p.ocean ? "Ben\xF6tigt einen Ozeanplaneten." : "") || (l >= ([
      "orbital",
      "bunker"
    ].includes(key) ? 4 : 30) ? "Maximale Geb\xE4udestufe erreicht." : "")
  };
}
function researchInfo(s, p, key) {
  const t = TECHS[key];
  if (!t) throw Error("Unbekannte Forschung.");
  const l = s.tech[key];
  return {
    cost: costAt(t, l),
    ms: Math.ceil(t.time * Math.pow(1.5, l) / Math.max(1, 1 + (p.buildings.lab - 1) * 0.15) * 1e3),
    reason: (key === "colonization" && l >= 3 && l < t.max ? need(s, p, {
      tech: [
        "ramjet",
        "impulse",
        "hyperspace"
      ][l - 3],
      level: 1
    }) : "") || (p.buildings.lab < t.lab ? `Ben\xF6tigt Forschungslabor Stufe ${t.lab} auf diesem Planeten.` : need(s, p, t.requires) || (l >= t.max ? "Maximale Forschungsstufe erreicht." : ""))
  };
}
function pay(p, c) {
  settle(p);
  for (const k of RES) if (!Number.isFinite(c[k]) || c[k] < 0 || p.resources[k] + 1e-8 < c[k]) throw Error("Nicht gen\xFCgend lokale Ressourcen.");
  for (const k of RES) p.resources[k] = Math.max(0, p.resources[k] - c[k]);
  settle(p);
}
function defenseSlots(p) {
  return Object.entries(SHIPS).reduce((a, [k, sh]) => a + (sh.slots || 0) * (p.ships[k] || 0), 0) + (SHIPS[p.shipjob?.key]?.slots || 0) * (p.shipjob?.count || 0);
}
function shipRefund(job) {
  if (!job) return {
    resources: vector([
      0,
      0,
      0
    ]),
    salvage: vector([
      0,
      0,
      0
    ]),
    legacyDefense: false
  };
  if (job.payment) return {
    resources: {
      ...job.payment.resources
    },
    salvage: {
      ...job.payment.salvage
    },
    legacyDefense: false
  };
  const gross = vector(SHIPS[job.key].cost.map((v) => v * job.count)), legacyDefense = SHIPS[job.key].category === "defense";
  return {
    resources: legacyDefense ? vector([
      0,
      0,
      gross.fuel
    ]) : gross,
    salvage: legacyDefense ? vector([
      gross.metal,
      gross.crystal,
      0
    ]) : vector([
      0,
      0,
      0
    ]),
    legacyDefense
  };
}
function shipInfo(s, p, key, count = 1) {
  const sh = SHIPS[key];
  if (!sh) throw Error("Unbekanntes Schiff.");
  const gross = vector(sh.cost.map((v) => v * count)), salvage = vector(RES.map((k) => sh.category === "defense" ? Math.min(gross[k], p.defenseSalvage?.[k] || 0) : 0));
  return {
    cost: vector(RES.map((k) => gross[k] - salvage[k])),
    salvage,
    ms: sh.time * count * 1e3,
    reason: sh.slots && defenseSlots(p) + sh.slots * count > (p.buildings.orbital || 0) * 4 ? "Nicht gen\xFCgend freie Pl\xE4tze auf der Orbitalplattform." : p.buildings.shipyard < (sh.shipyard || 1) ? `Ben\xF6tigt Schiffswerft Stufe ${sh.shipyard || 1}.` : s.tech[sh.tech] < (sh.techLevel || 1) ? `Ben\xF6tigt ${TECHS[sh.tech].name} Stufe ${sh.techLevel || 1}.` : (s.tech[sh.engine || "drive"] || 0) < (sh.engineLevel || 0) ? `Ben\xF6tigt ${TECHS[sh.engine].name} Stufe ${sh.engineLevel}.` : ""
  };
}
function cargoCapacity(s, n = 1, ship = "transport") {
  return Math.floor((SHIPS[ship]?.cargo || 0) * (1 + s.tech.logistics * 0.15)) * n;
}
function flightInfo(s, from, to, n = 1, probe = false, ship = "transport") {
  const def = SHIPS[probe ? "probe" : ship];
  if (!def) throw Error("Unbekanntes Schiff.");
  const remote = (from.system || "tutorial") !== (to.system || "tutorial");
  const engine = shipFlightEngine(s, probe ? "probe" : ship, remote);
  const anchor = s.galaxy || {
    x: 500,
    y: 960
  };
  const a = from.system ? from : anchor, b = to.system ? to : anchor;
  const dist = remote ? Math.max(1, Math.hypot(a.x - b.x, a.y - b.y) / 40) : Math.max(1, Math.abs((from.distance || 0) - (to.distance || 0)));
  return {
    ms: Math.ceil((10 + dist * 8) * 1e3 / ((1 + (s.tech[engine] || 0) * 0.12 + (probe ? s.tech.scout * 0.1 : 0)) * def.speed)),
    fuel: Math.ceil(def.fuel * 2 * dist * n / (1 + (s.tech[engine] || 0) * 0.12))
  };
}
function legInfo(s, from, to, n = 1, ship = "transport") {
  const f = flightInfo(s, from, to, n, ship === "probe", ship);
  return {
    ...f,
    fuel: Math.ceil(f.fuel / 2)
  };
}
function routeLegInfo(s, from, to, n = 1, ship = "transport") {
  const f = legInfo(s, from, to, n, ship);
  return {
    ms: Math.ceil(f.ms * ROUTE_ECONOMY.time),
    fuel: Math.ceil(f.fuel * ROUTE_ECONOMY.fuel)
  };
}
function fleetManifest(m) {
  return m.fleet || {
    [m.ship]: m.count
  };
}
function checkedFleet(fleet) {
  if (!fleet || typeof fleet !== "object" || Array.isArray(fleet) || !Object.keys(fleet).length || Object.entries(fleet).some(([k, n]) => !isFreighter(k) || !Number.isInteger(n) || n < 1 || n > 100) || Object.values(fleet).reduce((a, b) => a + b, 0) > 100) throw Error("W\xE4hle 1\u2013100 Frachter insgesamt.");
  return {
    ...fleet
  };
}
function fleetCapacity(s, fleet) {
  return Object.entries(fleet).reduce((a, [k, n]) => a + cargoCapacity(s, n, k), 0);
}
function mixedRouteLeg(s, from, to, fleet) {
  let ms2 = 0, fuel = 0, slowest = "";
  for (const [ship, count] of Object.entries(checkedFleet(fleet))) {
    if ((from.system || "tutorial") !== (to.system || "tutorial") && !SHIPS[ship].engine) throw Error("Interstellare Routen ben\xF6tigen bei allen Schiffen ein fortgeschrittenes Triebwerk.");
    const f = routeLegInfo(s, from, to, count, ship);
    if (f.ms > ms2) {
      ms2 = f.ms;
      slowest = ship;
    }
    fuel += f.fuel;
  }
  return {
    ms: ms2,
    fuel,
    slowest
  };
}
function routeInfo(s, stops, count, ship = "transport") {
  const fleet = typeof count === "object" ? checkedFleet(count) : checkedFleet({
    [ship]: count
  });
  let fuel = 0, ms2 = 0, slowest = "";
  for (let i = 0; i < stops.length; i++) {
    const f = mixedRouteLeg(s, getPlanet(s, stops[i].planet), getPlanet(s, stops[(i + 1) % stops.length].planet), fleet);
    fuel += f.fuel;
    ms2 += f.ms;
    slowest = f.slowest;
  }
  return {
    fuel,
    ms: ms2,
    slowest,
    capacity: fleetCapacity(s, fleet)
  };
}
function checkedStops(s, stops, home) {
  if (!Array.isArray(stops) || stops.length < 2 || stops.length > 12 || stops[0].planet !== home) throw Error("Eine Route ben\xF6tigt 2\u201312 Stopps und beginnt am Startplaneten.");
  for (let i = 0; i < stops.length; i++) {
    getPlanet(s, stops[i].planet);
    if (stops[i].planet === stops[(i + 1) % stops.length].planet || !validOrder(stops[i].load) || !validOrder(stops[i].unload)) throw Error("Ung\xFCltiger Stopp oder Laderegel.");
  }
  return structuredClone(stops);
}
function setFleet(m, fleet) {
  m.fleet = {
    ...fleet
  };
  [m.ship, m.count] = Object.entries(fleet)[0];
}
function validOrder(order) {
  return order && RES.every((k) => order[k] === "max" || Number.isSafeInteger(order[k]) && order[k] >= 0 && order[k] <= 1e12);
}
function loadCargo(s, p, cargo, order, count, ship = "transport", fleet = null) {
  settle(p);
  let room = (fleet ? fleetCapacity(s, fleet) : cargoCapacity(s, count, ship)) - RES.reduce((a, k) => a + cargo[k], 0);
  for (const k of RES) {
    const want = order[k] === "max" ? Infinity : order[k];
    const amount = Math.min(room, want, Math.floor(Math.max(0, p.resources[k] + p.depot[k] - (p.reserves?.[k] || 0))));
    cargo[k] += amount;
    const local = Math.min(amount, p.resources[k]);
    p.resources[k] -= local;
    p.depot[k] -= amount - local;
    room -= amount;
  }
  settle(p);
}
function stopCargo(s, m, stop) {
  const p = getPlanet(s, stop.planet), out = vector(RES.map((k) => stop.unload[k] === "max" ? m.cargo[k] : Math.min(m.cargo[k], stop.unload[k])));
  for (const k of RES) m.cargo[k] -= out[k];
  deliver(p, out);
  loadCargo(s, p, m.cargo, stop.load, m.count, m.ship, fleetManifest(m));
}
function leaveRoute(s, m, index) {
  const from = m.stops[m.index].planet, to = m.stops[index].planet, f = mixedRouteLeg(s, getPlanet(s, from), getPlanet(s, to), fleetManifest(m));
  m.from = from;
  m.to = to;
  m.index = index;
  m.start = s.time;
  m.duration = f.ms;
  m.due = s.time + f.ms;
}
function parkFleet(s, m, id, title) {
  const p = getPlanet(s, id);
  deliver(p, m.cargo);
  for (const [k, n] of Object.entries(fleetManifest(m))) p.ships[k] += n;
  putHulls(p, m.hulls);
  p.shieldUntil = Math.max(p.shieldUntil || 0, m.shieldUntil || 0);
  s.missions = s.missions.filter((x) => x.id !== m.id);
  report(s, title, `${Object.entries(fleetManifest(m)).map(([k, n]) => n + " \xD7 " + SHIPS[k].name).join(", ")} im Orbit von ${p.name}. Ladung wurde eingelagert.`);
}
function routeArrival(s, m) {
  if (m.index === 0) {
    deliver(getPlanet(s, m.home), m.cargo);
    m.cargo = vector([
      0,
      0,
      0
    ]);
    m.rounds++;
    report(s, "Handelsrunde abgeschlossen", `${m.name}: Runde ${m.rounds} beendet.`);
    if (m.pending && !m.stopping) {
      const next = m.pending, p2 = getPlanet(s, m.home), old = fleetManifest(m);
      if (Object.entries(next.fleet).every(([k, n]) => p2.ships[k] + (old[k] || 0) >= n)) {
        for (const [k, n] of Object.entries(old)) p2.ships[k] += n;
        putHulls(p2, m.hulls);
        for (const [k, n] of Object.entries(next.fleet)) p2.ships[k] -= n;
        setFleet(m, next.fleet);
        m.hulls = takeHulls(p2, next.fleet);
        m.name = next.name;
        m.stops = structuredClone(next.stops);
        m.repeat = next.repeat;
        delete m.pending;
        report(s, "Routen\xE4nderung aktiviert", `${m.name}: Flotte und Stopps am Startplaneten aktualisiert.`);
      } else report(s, "Routen\xE4nderung wartet", `${m.name}: Am Startplaneten fehlen Schiffe; bisherige Route bleibt aktiv.`);
    }
    if (!m.repeat || m.stopping) {
      parkFleet(s, m, m.home, "Handelsroute beendet");
      return;
    }
    const p = getPlanet(s, m.home), f = routeInfo(s, m.stops, fleetManifest(m));
    if (p.resources.fuel - (p.reserves?.fuel || 0) < f.fuel) {
      parkFleet(s, m, m.home, "Handelsroute pausiert: Treibstoff fehlt");
      return;
    }
    pay(p, vector([
      0,
      0,
      f.fuel
    ]));
    stopCargo(s, m, m.stops[0]);
    leaveRoute(s, m, 1);
  } else {
    stopCargo(s, m, m.stops[m.index]);
    report(s, "Handelsstopp", `${m.name}: ${getPlanet(s, m.to).name} \xB7 Runde ${m.rounds + 1}.`);
    leaveRoute(s, m, (m.index + 1) % m.stops.length);
  }
}
function advance(s, now) {
  if (!Number.isFinite(now)) throw Error("Ung\xFCltige Zeit.");
  now = Math.max(now, s.time);
  let guard = 0;
  while (true) {
    const times = [];
    for (const p of s.planets) {
      if (p.build) times.push(p.build.end);
      if (p.shipjob) times.push(p.shipjob.end);
    }
    if (s.research) times.push(s.research.end);
    for (const m of s.missions) times.push(m.due);
    const next = Math.min(...times);
    if (next > now || !Number.isFinite(next)) break;
    if (++guard > 1e5) {
      for (const m of s.missions) if (m.type === "route" && !m.stopping) {
        m.stopping = true;
        report(s, "Handelsroute endet nach langer Abwesenheit", `${m.name}: Die aktuelle Runde wird noch abgeschlossen.`);
      }
      guard = 0;
    }
    produce(s, Math.max(0, next - s.time));
    s.time = Math.max(s.time, next);
    if (s.research && s.research.end <= s.time) {
      const j = s.research;
      s.tech[j.key] = j.level;
      s.research = null;
      report(s, "Forschung abgeschlossen", `${TECHS[j.key].name} erreicht Stufe ${j.level}.`);
    }
    for (const p of s.planets) {
      if (p.build && p.build.end <= s.time) {
        const j = p.build;
        p.buildings[j.key] = j.level;
        p.build = null;
        report(s, "Ausbau abgeschlossen", `${p.name}: ${BUILDINGS[j.key].name}, Stufe ${j.level}.`);
      }
      if (p.shipjob && p.shipjob.end <= s.time) {
        const j = p.shipjob;
        p.ships[j.key] += j.count;
        p.shipjob = null;
        report(s, "Schiffbau abgeschlossen", `${p.name}: ${j.count} \xD7 ${SHIPS[j.key].name}.`);
      }
    }
    for (const m of [
      ...s.missions
    ].sort((a, b) => a.id - b.id)) if (m.due <= s.time) {
      if (m.type === "route") {
        routeArrival(s, m);
      } else if (m.type === "station") {
        parkFleet(s, m, m.to, "Flotte stationiert");
      } else if (m.type === "collect" && m.phase === "outbound") {
        loadCargo(s, getPlanet(s, m.to), m.cargo, m.order, m.count, m.ship);
        m.phase = "return";
        m.due = s.time + m.duration;
        report(s, "Material abgeholt", `${getPlanet(s, m.to).name}: Ladung auf dem R\xFCckweg.`);
      } else if (m.phase === "return") {
        if (m.type === "collect") deliver(getPlanet(s, m.from), m.cargo);
        getPlanet(s, m.from).ships[m.ship] += m.count;
        putHulls(getPlanet(s, m.from), m.hulls);
        getPlanet(s, m.from).shieldUntil = Math.max(getPlanet(s, m.from).shieldUntil || 0, m.shieldUntil || 0);
        s.missions = s.missions.filter((x) => x.id !== m.id);
        report(s, "Flotte zur\xFCckgekehrt", `${SHIPS[m.ship].name}: ${m.count} zur\xFCck auf ${getPlanet(s, m.from).name}.`);
      } else if (m.type === "probe") {
        if (!s.discovered.includes(m.to)) s.discovered.push(m.to);
        const t = TARGETS.find((t2) => t2.id === m.to);
        report(s, "Sondenbericht", `${t.name} [${t.coord}] \xB7 ${t.kind}. Metall \xD7${t.mult[0]}, Kristall \xD7${t.mult[1]}, Treibstoff \xD7${t.mult[2]}. Energiebedarf \xD7${t.energy}.`);
        m.phase = "return";
        m.due = s.time + m.duration;
      } else if (m.type === "colony") {
        const t = TARGETS.find((t2) => t2.id === m.to);
        if (!s.planets.some((p) => p.id === t.id)) {
          const p = planet(t.id, t.name, t);
          p.buildings.solar = 2;
          deliver(p, m.cargo);
          s.planets.push(p);
          report(s, "Kolonie gegr\xFCndet", `${t.name} ist besiedelt. Mitgebrachte Startmaterialien stehen dort bereit. Baue zuerst lokale Minen.`);
        }
        s.missions = s.missions.filter((x) => x.id !== m.id);
      } else {
        deliver(getPlanet(s, m.to), m.cargo);
        report(s, "Transport angekommen", `${getPlanet(s, m.from).name} \u2192 ${getPlanet(s, m.to).name}: ${RES.map((k) => `${Math.round(m.cargo[k])} ${k === "metal" ? "Metall" : k === "crystal" ? "Kristall" : "Treibstoff"}`).join(", ")}. \xDCbersch\xFCsse bleiben im Lieferdepot.`);
        m.cargo = vector([
          0,
          0,
          0
        ]);
        m.phase = "return";
        m.due = s.time + m.duration;
      }
    }
  }
  produce(s, now - s.time);
  s.time = now;
  return s;
}
function act(s, action, now = Date.now()) {
  const n = structuredClone(s);
  advance(n, now);
  const p = getPlanet(n, action.planet || n.active);
  if (action.type === "build") {
    const info = buildInfo(n, p, action.key);
    if (info.reason) throw Error(info.reason);
    if (p.build) throw Error("Auf diesem Planeten l\xE4uft bereits ein Bauauftrag.");
    pay(p, info.cost);
    p.build = {
      key: action.key,
      level: p.buildings[action.key] + 1,
      start: n.time,
      end: n.time + info.ms
    };
  } else if (action.type === "research") {
    const info = researchInfo(n, p, action.key);
    if (info.reason) throw Error(info.reason);
    if (n.research) throw Error("Es l\xE4uft bereits eine imperiumsweite Forschung.");
    pay(p, info.cost);
    n.research = {
      key: action.key,
      level: n.tech[action.key] + 1,
      start: n.time,
      end: n.time + info.ms,
      planet: p.id
    };
  } else if (action.type === "ship") {
    const info = shipInfo(n, p, action.key, action.count);
    if (info.reason) throw Error(info.reason);
    if (p.shipjob) throw Error("Die Schiffswerft ist besch\xE4ftigt.");
    const count = action.count;
    if (!Number.isInteger(count) || count < 1 || count > 50) throw Error("Baue zwischen 1 und 50 Schiffe.");
    if (p.defenseSalvage) for (const k of RES) p.defenseSalvage[k] -= info.salvage[k];
    pay(p, info.cost);
    p.shipjob = {
      id: ++n.seq,
      key: action.key,
      count,
      start: n.time,
      end: n.time + info.ms,
      payment: {
        resources: {
          ...info.cost
        },
        salvage: {
          ...info.salvage
        }
      }
    };
  } else if (action.type === "cancel-ship") {
    const j = p.shipjob, o = action.order;
    if (!j) throw Error("Dieser Schiffsbauauftrag ist bereits abgeschlossen oder abgebrochen.");
    if (!o || [
      "key",
      "count",
      "start",
      "end"
    ].some((k) => o[k] !== j[k]) || j.id !== void 0 && o.id !== j.id) throw Error("Der Bauauftrag hat sich ge\xE4ndert. Bitte die Ansicht aktualisieren.");
    const refund = shipRefund(j);
    for (const k of RES) {
      p.depot[k] += refund.resources[k];
      p.defenseSalvage ??= vector([
        0,
        0,
        0
      ]);
      p.defenseSalvage[k] += refund.salvage[k];
    }
    settle(p);
    p.shipjob = null;
    report(n, "Schiffsbau abgebrochen", p.name + ": " + j.count + " \xD7 " + SHIPS[j.key].name + ". Rohstoffe zur\xFCckerstattet; \xDCbersch\xFCsse bleiben im Lieferdepot." + (refund.legacyDefense ? " Metall und Kristall des alten Verteidigungsauftrags bleiben als Reparaturmaterial verf\xFCgbar." : ""));
  } else if (action.type === "probe" || action.type === "colony" || action.type === "transport") {
    const ship = action.type === "probe" ? "probe" : action.type === "colony" ? "colony" : "transport";
    const count = ship === "transport" ? action.count : 1;
    if (!Number.isInteger(count) || count < 1 || count > 100) throw Error("Ung\xFCltige Flottengr\xF6\xDFe.");
    if (p.ships[ship] < count) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe.");
    let dest, cargo = vector([
      0,
      0,
      0
    ]);
    if (ship === "transport") {
      dest = getPlanet(n, action.to);
      if ((p.system || "tutorial") !== (dest.system || "tutorial")) throw Error("Interstellare Fl\xFCge ben\xF6tigen einen fortgeschrittenen Frachter.");
      if (dest.id === p.id) throw Error("W\xE4hle einen anderen Zielplaneten.");
      cargo = action.cargo;
      if (!cargo || RES.some((k) => !Number.isSafeInteger(cargo[k]) || cargo[k] < 0)) throw Error("Ladung muss aus nichtnegativen ganzen Zahlen bestehen.");
      const total = RES.reduce((sum, k) => sum + cargo[k], 0);
      if (!total) throw Error("W\xE4hle eine Ladung.");
      if (total > cargoCapacity(n, count)) throw Error("Die Ladung \xFCbersteigt den Laderaum.");
    } else {
      if (p.system) throw Error("Tutorial-Sonden und Kolonieschiffe starten im Tutorial-System. W\xE4hle dort eine Heimatwelt.");
      dest = TARGETS.find((t) => t.id === action.to);
      if (!dest) throw Error("Unbekanntes Erkundungsziel.");
      if (ship === "colony") {
        if (!n.discovered.includes(dest.id)) throw Error("Zuerst mit einer Sonde erkunden.");
        if (n.planets.some((p2) => p2.id === dest.id) || n.missions.some((m) => m.type === "colony" && m.to === dest.id)) throw Error("Planet bereits besiedelt oder reserviert.");
        if (n.planets.length - 1 + n.missions.filter((m) => m.type === "colony").length >= n.tech.colonization) throw Error("Erforsche eine weitere Kolonisierungsstufe.");
        cargo = vector([
          350,
          250,
          100
        ]);
      }
    }
    const f = flightInfo(n, p, dest, count, ship === "probe", ship);
    const cost = {
      ...cargo,
      fuel: cargo.fuel + f.fuel
    };
    pay(p, cost);
    p.ships[ship] -= count;
    const hulls = takeHulls(p, {
      [ship]: count
    });
    n.missions.push({
      id: ++n.seq,
      type: action.type,
      ship,
      count,
      hulls,
      shieldUntil: p.shieldUntil || 0,
      from: p.id,
      to: dest.id,
      cargo,
      phase: "outbound",
      start: n.time,
      duration: f.ms,
      due: n.time + f.ms
    });
  } else if (action.type === "repair") {
    const hulls = p.hulls || {}, cost = vector(RES.map((k, i) => i === 2 ? 0 : Object.entries(hulls).reduce((a, [key, list]) => a + list.reduce((v, hp) => v + SHIPS[key].cost[i] * 0.3 * (1 - hp), 0), 0)));
    for (const k of RES) cost[k] = Math.ceil(cost[k]);
    if (!Object.values(hulls).some((x) => x.length)) throw Error("Keine besch\xE4digten Einheiten.");
    pay(p, cost);
    p.hulls = {};
    report(n, "Einheiten repariert", p.name);
  } else if (action.type === "reserve") {
    if (!action.reserves || RES.some((k) => !Number.isSafeInteger(action.reserves[k]) || action.reserves[k] < 0 || action.reserves[k] > 1e12)) throw Error("Ung\xFCltige Reserve.");
    p.reserves = {
      ...action.reserves
    };
  } else if (action.type === "edit-route" || action.type === "cancel-route-edit") {
    const m = n.missions.find((m2) => m2.id === action.id && m2.type === "route");
    if (!m || m.stopping) throw Error("Diese Route l\xE4sst sich nicht mehr bearbeiten.");
    if (action.type === "cancel-route-edit") {
      delete m.pending;
    } else {
      const fleet = checkedFleet(action.fleet), stops = checkedStops(n, action.stops, m.home);
      routeInfo(n, stops, fleet);
      m.pending = {
        name: String(action.name || "Handelsroute").trim().slice(0, 40) || "Handelsroute",
        fleet,
        stops,
        repeat: !!action.repeat
      };
      report(n, "Routen\xE4nderung vorgemerkt", `${m.name}: Aktivierung bei R\xFCckkehr zum Startplaneten.`);
    }
  } else if (action.type === "stop-route") {
    const m = n.missions.find((m2) => m2.id === action.id && m2.type === "route");
    if (!m) throw Error("Route nicht gefunden.");
    m.stopping = true;
    report(n, "Route endet nach dieser Runde", m.name);
  } else if ([
    "station",
    "collect",
    "route",
    "deliver"
  ].includes(action.type)) {
    if (n.missions.length >= 100) throw Error("Zu viele Flotten unterwegs.");
    if (action.type !== "route" && action.type !== "station" && !isFreighter(action.ship || "transport")) throw Error("Liefern, Abholen und Handelsrouten ben\xF6tigen Transporter.");
    const manifest = action.type === "route" ? checkedFleet(action.fleet || {
      [action.ship || "transport"]: action.count
    }) : null;
    const ship = manifest ? Object.keys(manifest)[0] : action.ship || "transport", count = manifest ? manifest[ship] : action.count;
    if (SHIPS[ship]?.category === "defense") throw Error("Orbitale Verteidigung kann nicht verlegt werden.");
    if (!Object.hasOwn(SHIPS, ship) || !Number.isInteger(count) || count < 1 || count > 100 || p.ships[ship] < count) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe (1\u2013100 pro Flotte).");
    const cargo = vector([
      0,
      0,
      0
    ]), hulls = {};
    let m = {
      id: ++n.seq,
      type: action.type,
      ship,
      count,
      from: p.id,
      cargo,
      phase: "outbound",
      start: n.time
    };
    if (action.type === "route") {
      const stops = checkedStops(n, action.stops, p.id);
      if (!Array.isArray(stops) || stops.length < 2 || stops.length > 12 || stops[0].planet !== p.id) throw Error("Eine Route ben\xF6tigt 2\u201312 Stopps und beginnt hier.");
      for (let i = 0; i < stops.length; i++) {
        getPlanet(n, stops[i].planet);
        if (stops[i].planet === stops[(i + 1) % stops.length].planet || !validOrder(stops[i].load) || !validOrder(stops[i].unload)) throw Error("Ung\xFCltiger Stopp oder Laderegel.");
      }
      if (Object.entries(manifest).some(([k, v]) => p.ships[k] < v)) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe.");
      setFleet(m, manifest);
      const f = routeInfo(n, stops, manifest);
      if (p.resources.fuel - (p.reserves?.fuel || 0) < f.fuel) throw Error("Treibstoff reicht nicht f\xFCr die Runde einschlie\xDFlich Reserve.");
      pay(p, vector([
        0,
        0,
        f.fuel
      ]));
      Object.assign(m, {
        name: String(action.name || "Handelsroute").trim().slice(0, 40) || "Handelsroute",
        stops: structuredClone(stops),
        home: p.id,
        index: 0,
        repeat: !!action.repeat,
        stopping: false,
        rounds: 0
      });
      stopCargo(n, m, stops[0]);
      leaveRoute(n, m, 1);
    } else {
      const dest = getPlanet(n, action.to);
      if (dest.id === p.id) throw Error("W\xE4hle einen anderen Zielplaneten.");
      if ((p.system || "tutorial") !== (dest.system || "tutorial") && !canFlyInterstellar(n, ship)) throw Error(ship === "falke" ? "Interstellare Falkenfl\xFCge ben\xF6tigen Falke-Galaxieantrieb 1 und Staustrahltriebwerke 1." : "Interstellare Fl\xFCge ben\xF6tigen Staustrahl-, Impuls- oder Hyperraumtriebwerke.");
      const f = legInfo(n, p, dest, count, ship);
      const order = action.order || action.cargo || vector([
        0,
        0,
        0
      ]);
      if (!validOrder(order)) throw Error("Ladung: ganze Mengen oder Maximum w\xE4hlen.");
      if (!isFreighter(ship) && RES.some((k) => order[k] !== 0)) throw Error("Material ben\xF6tigt Transporter.");
      const fuel = f.fuel * (action.type === "station" ? 1 : 2);
      if (p.resources.fuel - (p.reserves?.fuel || 0) < fuel) throw Error("Nicht gen\xFCgend Treibstoff einschlie\xDFlich Reserve.");
      pay(p, vector([
        0,
        0,
        fuel
      ]));
      if (action.type !== "collect") {
        const exact = RES.reduce((a, k) => a + (order[k] === "max" ? 0 : order[k]), 0);
        if (exact > cargoCapacity(n, count, ship) || RES.some((k) => order[k] !== "max" && order[k] > Math.floor(Math.max(0, p.resources[k] + p.depot[k] - (p.reserves?.[k] || 0))))) throw Error("Die gew\xE4hlte Ladung passt nicht oder lokale Ressourcen fehlen.");
        loadCargo(n, p, cargo, order, count, ship);
        if (action.type === "deliver" && !RES.some((k) => cargo[k] > 0)) throw Error("W\xE4hle verf\xFCgbare Ladung.");
      } else {
        if (!RES.some((k) => order[k] === "max" || order[k] > 0)) throw Error("W\xE4hle Material zum Abholen.");
        m.order = {
          ...order
        };
      }
      Object.assign(m, {
        to: dest.id,
        duration: f.ms,
        due: n.time + f.ms
      });
    }
    for (const [k, v] of Object.entries(fleetManifest(m))) p.ships[k] -= v;
    m.hulls = takeHulls(p, fleetManifest(m));
    n.missions.push(m);
  } else throw Error("Unbekannte Aktion.");
  return n;
}

// src/storage.js
var isNum = (x, max = 1e12) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= max;
var integer = (x, max) => isNum(x, max) && Number.isInteger(x);
var text = (x, max = 100) => typeof x === "string" && x.length <= max;
function check(ok) {
  if (!ok) throw Error("Ung\xFCltiger oder inkompatibler Spielstand.");
}
function validateSave(input) {
  check(input && typeof input === "object" && input.version === 1);
  const s = structuredClone(input);
  if (s.systemName !== void 0) check(text(s.systemName, 30) && s.systemName.trim().length > 0);
  check(text(s.name, 30) && s.name.trim().length > 0 && isNum(s.time, 864e13) && isNum(s.created, 864e13) && s.created <= s.time && integer(s.seq, 1e9));
  check(Array.isArray(s.planets) && s.planets.length >= 1 && s.planets.length <= 7);
  if (s.galaxy) check(isNum(s.galaxy.x, 1200) && isNum(s.galaxy.y, 1200));
  if (s.tech) {
    for (const k of Object.keys(TECHS)) if (!Object.hasOwn(s.tech, k)) s.tech[k] = 0;
  }
  check(s.tech && Object.entries(TECHS).every(([k, t]) => integer(s.tech[k], t.max)));
  const ids = s.planets.map((p) => p.id);
  check(ids[0] === "home" && new Set(ids).size === ids.length && ids.every((id) => id === "home" || TARGETS.some((t) => t.id === id) || /^g-[a-z]+-p(?:[1-9]|10)$/.test(id)) && ids.includes(s.active));
  const cargo = (c) => c && RES.every((k) => isNum(c[k]));
  const job = (j, defs) => j === null || j && Object.hasOwn(defs, j.key) && isNum(j.start, 864e13) && isNum(j.end, 864e13) && j.start <= s.time && j.end >= s.time && j.end > j.start;
  for (const p of s.planets) {
    if (p.id.startsWith("g-")) check(typeof p.system === "string" && /^g-[a-z]+-p(?:[1-9]|10)$/.test(p.id) && isNum(p.x, 1200) && isNum(p.y, 1200) && integer(p.slot, 10) && p.slot > 0);
    check(text(p.name, 40) && text(p.coord, 30) && text(p.kind, 40) && /^#[0-9a-f]{6}$/i.test(p.color) && typeof p.ocean === "boolean" && isNum(p.energy, 10) && p.energy > 0 && isNum(p.distance, 100));
    check(Array.isArray(p.mult) && p.mult.length === 3 && p.mult.every((x) => isNum(x, 10)));
    p.reserves ??= {
      metal: 0,
      crystal: 0,
      fuel: 0
    };
    check(cargo(p.reserves) && cargo(p.resources) && cargo(p.depot));
    for (const k of [
      "orbital",
      "bunker"
    ]) if (p.buildings && !Object.hasOwn(p.buildings, k)) p.buildings[k] = 0;
    check(p.buildings && Object.keys(BUILDINGS).every((k) => integer(p.buildings[k], 30)));
    if (p.ships) {
      for (const k of Object.keys(SHIPS)) if (![
        "probe",
        "transport",
        "colony"
      ].includes(k) && !Object.hasOwn(p.ships, k)) p.ships[k] = 0;
    }
    check(p.ships && Object.keys(SHIPS).every((k) => integer(p.ships[k], 1e6)));
    check(job(p.build, BUILDINGS) && (!p.build || p.build.level === p.buildings[p.build.key] + 1));
    check(job(p.shipjob, SHIPS) && (!p.shipjob || integer(p.shipjob.count, 50) && p.shipjob.count > 0));
  }
  for (const p of s.planets) if (p.shipjob) {
    const j = p.shipjob;
    if (j.id !== void 0) check(integer(j.id, s.seq) && j.id > 0);
    if (j.payment !== void 0) check(j.payment && cargo(j.payment.resources) && cargo(j.payment.salvage) && RES.every((k) => Number.isSafeInteger(j.payment.resources[k]) && Number.isSafeInteger(j.payment.salvage[k])) && j.payment.salvage.fuel === 0 && (SHIPS[j.key].category === "defense" || RES.every((k) => j.payment.salvage[k] === 0)));
  }
  check(job(s.research, TECHS) && (!s.research || s.research.level === s.tech[s.research.key] + 1 && ids.includes(s.research.planet)));
  check(Array.isArray(s.discovered) && s.discovered.length <= 3 && new Set(s.discovered).size === s.discovered.length && s.discovered.every((id) => TARGETS.some((t) => t.id === id)));
  check(Array.isArray(s.missions) && s.missions.length <= 100);
  const fleetOK = (f) => f && typeof f === "object" && !Array.isArray(f) && Object.keys(f).length > 0 && Object.entries(f).every(([k, n]) => isFreighter(k) && integer(n, 100) && n > 0) && Object.values(f).reduce((a, b) => a + b, 0) <= 100;
  const eventIds = [];
  const order = (o) => o && RES.every((k) => o[k] === "max" || integer(o[k], 1e12));
  for (const m of s.missions) {
    check(integer(m.id, s.seq) && m.id > 0 && ids.includes(m.from) && [
      "probe",
      "colony",
      "transport",
      "deliver",
      "collect",
      "station",
      "route"
    ].includes(m.type) && Object.hasOwn(SHIPS, m.ship) && integer(m.count, 100) && m.count > 0 && cargo(m.cargo) && [
      "outbound",
      "return"
    ].includes(m.phase) && isNum(m.start, 864e13) && m.start <= s.time && isNum(m.due, 864e13) && m.due >= s.time && isNum(m.duration, 864e5) && m.duration > 0);
    if ([
      "probe",
      "colony"
    ].includes(m.type)) {
      check(m.ship === m.type && TARGETS.some((t) => t.id === m.to));
      check(m.type !== "colony" || m.phase === "outbound" && m.count === 1 && !ids.includes(m.to));
    } else {
      check(ids.includes(m.to) && m.from !== m.to);
      check(m.type === "station" || isFreighter(m.ship));
      if (m.type !== "transport") {
        const total = RES.reduce((a, k) => a + m.cargo[k], 0);
        const max = m.type === "route" && m.fleet ? Object.entries(m.fleet).reduce((a, [k, n]) => a + Math.floor((SHIPS[k]?.cargo || 0) * (1 + s.tech.logistics * 0.15)) * n, 0) : Math.floor(SHIPS[m.ship].cargo * (1 + s.tech.logistics * 0.15)) * m.count;
        check(total <= max);
      }
    }
    if (m.type === "collect") check(order(m.order));
    if (m.type === "station") check(m.phase === "outbound");
    if (m.fleet) check(m.type === "route" && fleetOK(m.fleet) && m.fleet[m.ship] === m.count);
    if (m.pending) check(m.type === "route" && fleetOK(m.pending.fleet) && text(m.pending.name, 40) && m.pending.name.trim().length > 0 && typeof m.pending.repeat === "boolean" && Array.isArray(m.pending.stops) && m.pending.stops.length >= 2 && m.pending.stops.length <= 12 && m.pending.stops[0].planet === m.home && m.pending.stops.every((stop, i) => ids.includes(stop.planet) && stop.planet !== m.pending.stops[(i + 1) % m.pending.stops.length].planet && order(stop.load) && order(stop.unload)));
    if (m.type === "route") {
      check(m.phase === "outbound" && text(m.name, 40) && typeof m.repeat === "boolean" && typeof m.stopping === "boolean" && integer(m.rounds, 1e12) && Array.isArray(m.stops) && m.stops.length >= 2 && m.stops.length <= 12 && ids.includes(m.home) && m.stops[0].planet === m.home && integer(m.index, m.stops.length - 1));
      check(m.stops.every((stop, i) => ids.includes(stop.planet) && stop.planet !== m.stops[(i + 1) % m.stops.length].planet && order(stop.load) && order(stop.unload)) && m.to === m.stops[m.index].planet && m.from === m.stops[(m.index + m.stops.length - 1) % m.stops.length].planet);
    }
    eventIds.push(m.id);
  }
  check(new Set(eventIds).size === eventIds.length);
  check(Array.isArray(s.reports) && s.reports.length <= 60 && s.reports.every((r) => integer(r.id, s.seq) && isNum(r.time, 864e13) && r.time <= s.time && text(r.title, 100) && text(r.body, 1e3)));
  const hullOK = (hulls, fleet) => hulls === void 0 || hulls && typeof hulls === "object" && !Array.isArray(hulls) && Object.entries(hulls).every(([k, hp]) => Object.hasOwn(SHIPS, k) && Array.isArray(hp) && hp.length <= (fleet[k] || 0) && hp.every((x) => typeof x === "number" && Number.isFinite(x) && x > 0 && x < 1));
  for (const p of s.planets) check(hullOK(p.hulls, p.ships));
  for (const m of s.missions) check(hullOK(m.hulls, m.fleet || {
    [m.ship]: m.count
  }));
  return s;
}

// src/galaxy.js
function galaxyDistance(start, system, slot = 1) {
  return Math.max(1, Math.hypot(start.x - system.x, start.y - system.y) / 40 + slot * 0.15);
}
function galaxyFlight(s, from, target, start, ship = "longProbe") {
  const origin = from.system ? {
    x: from.x,
    y: from.y
  } : start;
  const distance = galaxyDistance(origin, target, target.slot || 1), level = s.tech.ramjet || 0;
  return {
    distance,
    ms: Math.ceil((60 + distance * 25) / (1 + level * 0.12)) * 1e3,
    fuel: Math.ceil(distance * (ship === "longProbe" ? 6 : 18) / (1 + level * 0.12))
  };
}

// src/server-world.js
var DAY = 864e5;
var COLONY_PROTECTION = 36e5;
var ms = (v) => typeof v === "number" ? v : Date.parse(v);
var zero = () => vector([
  0,
  0,
  0
]);
function log(s, time, title, body) {
  s.reports.unshift({
    id: ++s.seq,
    time: Math.max(time, s.time),
    title,
    body: body.slice(0, 1e3)
  });
  s.reports = s.reports.slice(0, 60);
}
function subtract(p, cost) {
  settle(p);
  for (const k of RES) if (p.resources[k] < cost[k]) throw Error("Lokale Ressourcen reichen nicht.");
  for (const k of RES) p.resources[k] -= cost[k];
  settle(p);
}
function withdraw(p, cargo) {
  for (const k of RES) {
    const n = Math.min(p.resources[k], cargo[k]);
    p.resources[k] -= n;
    p.depot[k] -= cargo[k] - n;
  }
  settle(p);
}
function fleetText(fleet) {
  return Object.entries(fleet).map(([k, n]) => n + " \xD7 " + SHIPS[k].name).join(", ") || "keine";
}
function prepareWorld(snapshot) {
  const w = structuredClone(snapshot);
  w.now = ms(w.now);
  w.saves = w.saves.map((row) => ({
    ...row,
    state: validateSave(row.state)
  }));
  w.attacks ??= [];
  w.missions ??= [];
  w.surveys ??= [];
  w.planets ??= [];
  w.starts ??= [];
  w.admins ??= [];
  for (const p of w.planets) if (p.colonized_at) p.colonized_at = ms(p.colonized_at);
  for (const m of w.missions) for (const key of [
    "started_at",
    "arrival_at",
    "finish_at"
  ]) m[key] = ms(m[key]);
  return w;
}
function stateOf(w, id) {
  const row = w.saves.find((x) => x.user_id === id);
  if (!row) throw Error("Spielstand fehlt.");
  return row.state;
}
function makeColony(meta, time) {
  return {
    ...meta,
    colonizedAt: time,
    resources: vector([
      350,
      250,
      100
    ]),
    depot: zero(),
    reserves: zero(),
    buildings: {
      ...Object.fromEntries(Object.keys(BUILDINGS).map((k) => [
        k,
        0
      ])),
      solar: 2
    },
    ships: Object.fromEntries(Object.keys(SHIPS).map((k) => [
      k,
      0
    ])),
    build: null,
    shipjob: null
  };
}
function finishGalaxy(w, m, time) {
  const s = stateOf(w, m.user_id), p = getPlanet(s, m.from_id);
  if (m.kind === "scan") {
    p.ships.longProbe++;
    log(s, time, "Fernsonde zur\xFCckgekehrt", m.planet_id);
  } else {
    const target = w.planets.find((p2) => p2.id === m.planet_id);
    if (target.owner_id !== m.user_id || !target.reserved) throw Error("Koloniereservierung fehlt.");
    if (!s.planets.some((p2) => p2.id === target.id)) s.planets.push(makeColony(target.meta, time));
    target.reserved = false;
    target.colonized_at = time;
    target.protection_ended = false;
    log(s, time, "Galaxiekolonie gegr\xFCndet", target.meta.name);
  }
  m.completed = true;
}
function survey(w, m) {
  if (!w.surveys.some((q) => q.user_id === m.user_id && q.planet_id === m.planet_id)) w.surveys.push({
    user_id: m.user_id,
    planet_id: m.planet_id
  });
}
function shieldFactor(until, time) {
  return until ? Math.max(0, Math.min(1, 1 - (until - time) / 3e5)) : 1;
}
function resolveAttack(w, m, time) {
  const a = stateOf(w, m.attacker_id), target = w.planets.find((p2) => p2.id === m.to), row = w.saves.find((x) => x.user_id === m.defender_id);
  if (!target || target.owner_id !== m.defender_id || target.reserved || !row || !target.protection_ended && time < (target.colonized_at || time) + COLONY_PROTECTION) {
    m.status = "returning";
    m.survivors = {
      ...m.fleet
    };
    m.return_hulls = m.hulls;
    m.cargo = zero();
    m.resolved_at = w.now;
    m.report = {
      outcome: "cancelled",
      at: time,
      reason: "Das Ziel ist nicht mehr angreifbar."
    };
    log(a, time, "Angriff abgebrochen", m.report.reason);
    return;
  }
  const d = row.state, p = getPlanet(d, m.to), defense = {
    fleet: {
      ...p.ships
    },
    tech: {
      ...d.tech
    },
    hulls: p.hulls,
    shieldFactor: shieldFactor(p.shieldUntil, time)
  };
  const result = resolveBattle({
    ...m.combat,
    shieldFactor: shieldFactor(m.shieldUntil, time)
  }, defense, m.seed || m.id, m.ruleVersion || 1);
  const before = {
    ...p.ships
  };
  for (const key of Object.keys(SHIPS)) p.ships[key] = result.defender.fleet[key] || 0;
  p.hulls = result.defender.hulls;
  p.shieldUntil = time + 3e5;
  p.defenseSalvage ??= zero();
  for (const k of RES) p.defenseSalvage[k] += result.defenseRepair[k];
  const bunker = Math.min(2e3, capacity(p) * 0.025 * (p.buildings.bunker || 0));
  if (result.outcome === "attacker" && (!p.raidWindowStart || time - p.raidWindowStart >= DAY)) {
    p.raidWindowStart = time;
    p.raidBudget = vector(RES.map((k) => Math.floor(Math.max(0, p.resources[k] + p.depot[k] - bunker) * 0.25)));
  }
  const cap = fleetCapacity({
    tech: m.combat.tech
  }, result.attacker.fleet);
  const field = vector(RES.map((k) => (target.debris?.[k] || 0) + result.debris[k]));
  const cargo = loadPlunder(p.resources, p.depot, bunker, cap, field, result.outcome === "attacker", p.raidBudget || zero());
  withdraw(p, cargo.loot);
  if (p.raidBudget) for (const k of RES) p.raidBudget[k] -= cargo.loot[k];
  target.debris ??= zero();
  for (const k of RES) target.debris[k] = field[k] - cargo.salvage[k];
  m.status = Object.keys(result.attacker.fleet).length ? "returning" : "returned";
  m.resolved_at = w.now;
  m.survivors = result.attacker.fleet;
  m.return_hulls = result.attacker.hulls;
  m.cargo = cargo.cargo;
  m.shieldUntil = time + 3e5;
  if (result.trace) result.trace.participants = {
    attacker: a.name,
    defender: d.name
  };
  m.report = {
    at: time,
    outcome: result.outcome,
    ruleVersion: m.ruleVersion || 1,
    traceAvailable: !!result.trace,
    ...result.trace ? {
      trace: result.trace
    } : {},
    rounds: result.rounds,
    attackerBefore: m.fleet,
    attackerAfter: m.survivors,
    defenderBefore: before,
    defenderAfter: {
      ...p.ships
    },
    loot: cargo.loot,
    salvage: cargo.salvage,
    debrisLeft: {
      ...target.debris
    },
    defenseRepair: result.defenseRepair
  };
  const outcome = result.outcome === "attacker" ? "Angreifer gewinnt" : result.outcome === "defender" ? "Verteidiger gewinnt" : "Unentschieden";
  const body = outcome + " \xB7 " + target.meta.name + " \xB7 " + result.rounds.length + " Runden. Angreifer \xFCbrig: " + fleetText(m.survivors) + ". Beute M/K/T: " + RES.map((k) => cargo.loot[k]).join("/") + ". Tr\xFCmmer geborgen M/K: " + cargo.salvage.metal + "/" + cargo.salvage.crystal + ".";
  log(a, time, "PvP-Kampfbericht", body);
  log(d, time, "PvP-Kampfbericht", body);
}
function returnAttack(w, m, time) {
  const s = stateOf(w, m.attacker_id), p = getPlanet(s, m.from);
  for (const [k, n] of Object.entries(m.survivors || {})) p.ships[k] += n;
  putHulls(p, m.return_hulls);
  p.shieldUntil = Math.max(p.shieldUntil || 0, m.shieldUntil || 0);
  for (const k of RES) p.depot[k] += m.cargo?.[k] || 0;
  settle(p);
  log(s, time, "Angriffsflotte zur\xFCckgekehrt", fleetText(m.survivors || {}) + " \xB7 Ladung wurde eingelagert.");
  m.status = "returned";
}
function advanceWorld(w) {
  let guard = 0;
  while (true) {
    const events = [];
    for (const m of w.missions) if (!m.completed) {
      if (m.kind === "scan" && !w.surveys.some((q) => q.user_id === m.user_id && q.planet_id === m.planet_id)) events.push({
        time: m.arrival_at,
        id: m.id,
        kind: "survey",
        mission: m,
        order: 0
      });
      events.push({
        time: m.finish_at,
        id: m.id,
        kind: "galaxy",
        mission: m,
        order: 1
      });
    }
    for (const m of w.attacks) if (m.status === "outbound") events.push({
      time: m.arrival_at,
      id: m.id,
      kind: "battle",
      mission: m,
      order: 2
    });
    else if (m.status === "returning") events.push({
      time: m.return_at,
      id: m.id,
      kind: "return",
      mission: m,
      order: 3
    });
    events.sort((a, b) => a.time - b.time || a.order - b.order || a.id.localeCompare(b.id));
    const e = events[0];
    if (!e || e.time > w.now) break;
    if (++guard > 1e4) throw Error("Zu viele f\xE4llige Ereignisse.");
    for (const row of w.saves) advance(row.state, e.time);
    if (e.kind === "survey") survey(w, e.mission);
    if (e.kind === "galaxy") finishGalaxy(w, e.mission, e.time);
    if (e.kind === "battle") resolveAttack(w, e.mission, e.time);
    if (e.kind === "return") returnAttack(w, e.mission, e.time);
  }
  for (const row of w.saves) advance(row.state, w.now);
  return w;
}
function launchGalaxy(w, uid, action, id) {
  const s = stateOf(w, uid), p = getPlanet(s, action.from), target = w.planets.find((p2) => p2.id === action.to), kind = action.kind;
  if (![
    "scan",
    "colony"
  ].includes(kind) || !target) throw Error("Unbekannte Galaxiemission.");
  if (s.tech.ramjet < 1) throw Error("Staustrahltriebwerke Stufe 1 fehlen.");
  if (w.missions.filter((m) => m.user_id === uid && !m.completed).length >= 100) throw Error("Zu viele Galaxiemissionen.");
  const ship = kind === "scan" ? "longProbe" : "starColony";
  if (!p.ships[ship]) throw Error("Das passende Schiff fehlt.");
  if (kind === "scan" && w.missions.some((m) => m.user_id === uid && m.planet_id === target.id && m.kind === kind && !m.completed)) throw Error("Eine Fernsonde ist bereits unterwegs.");
  if (kind === "colony") {
    if (!w.surveys.some((q) => q.user_id === uid && q.planet_id === target.id)) throw Error("Untersuche den Planeten zuerst.");
    if (target.owner_id) throw Error("Dieser Planet ist bereits besiedelt oder reserviert.");
    if (w.planets.filter((p2) => p2.owner_id === uid).length >= Math.max(0, s.tech.colonization - 3)) throw Error("Kein freier Galaxie-Kolonieplatz.");
  }
  const f = galaxyFlight(s, p, target.meta, s.galaxy, ship);
  subtract(p, vector([
    kind === "colony" ? 350 : 0,
    kind === "colony" ? 250 : 0,
    f.fuel + (kind === "colony" ? 100 : 0)
  ]));
  p.ships[ship]--;
  if (kind === "colony") {
    target.owner_id = uid;
    target.reserved = true;
  }
  w.missions.push({
    id,
    user_id: uid,
    kind,
    from_id: p.id,
    planet_id: target.id,
    started_at: w.now,
    arrival_at: w.now + f.ms,
    finish_at: w.now + f.ms * (kind === "scan" ? 2 : 1),
    completed: false
  });
}
function launchAttack(w, uid, action, id) {
  if (!w.settings.enabled) throw Error("PvP ist momentan pausiert.");
  const s = stateOf(w, uid), from = getPlanet(s, action.from), target = w.planets.find((p) => p.id === action.to), origin = w.planets.find((p) => p.id === from.id);
  if (!target || !target.owner_id || target.owner_id === uid || target.reserved) throw Error("W\xE4hle eine fremde besiedelte gemeinsame Kolonie als Ziel.");
  const colonies = w.planets.filter((p) => p.owner_id === uid && !p.reserved && s.planets.some((q) => q.id === p.id && q.system));
  if (from.system) {
    if (!origin || origin.owner_id !== uid || origin.reserved) throw Error("W\xE4hle eine eigene besiedelte gemeinsame Kolonie als Start.");
  } else if (!colonies.length) throw Error("F\xFCr Angriffe aus dem Heimatsystem ben\xF6tigst du mindestens eine eigene besiedelte Galaxiekolonie.");
  if (!target.protection_ended && w.now < (target.colonized_at || w.now) + COLONY_PROTECTION) throw Error("Diese Kolonie hat noch 1 Stunde Gr\xFCndungsschutz.");
  if (w.attacks.some((m) => m.attacker_id === uid && m.status !== "returned")) throw Error("Du hast bereits eine Angriffsflotte unterwegs.");
  if (w.attacks.filter((m) => m.attacker_id === uid && m.defender_id === target.owner_id && m.started_at > w.now - DAY).length >= 2) throw Error("Maximal zwei Angriffe auf denselben Commander innerhalb von 24 Stunden.");
  const fleet = attackFleet(action.fleet);
  for (const [k, n] of Object.entries(fleet)) if ((from.ships[k] || 0) < n) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe.");
  const f = attackFlight(s, from, target.meta, fleet), defender = stateOf(w, target.owner_id), fraction = warningFraction(defender.tech.scout || 0);
  subtract(from, vector([
    0,
    0,
    f.fuel
  ]));
  const hulls = takeHulls(from, fleet);
  for (const [k, n] of Object.entries(fleet)) from.ships[k] -= n;
  if (origin) origin.protection_ended = true;
  else for (const p of colonies) p.protection_ended = true;
  w.attacks.push({
    id,
    attacker_id: uid,
    defender_id: target.owner_id,
    from: from.id,
    to: target.id,
    fleet,
    hulls,
    ruleVersion: COMBAT_RULE_VERSION,
    combat: {
      fleet,
      tech: {
        ...s.tech
      },
      hulls
    },
    shieldUntil: from.shieldUntil || 0,
    started_at: w.now,
    warning_at: w.now + Math.ceil(f.ms * fraction),
    arrival_at: w.now + f.ms,
    return_at: w.now + 2 * f.ms,
    status: "outbound",
    fuel: f.fuel,
    slowest: f.slowest
  });
}
function assertFleetLimits(w) {
  for (const row of w.saves) {
    const counts = Object.fromEntries(row.state.planets.map((p) => [
      p.id,
      Object.values(p.ships).reduce((a, b) => a + b, 0) + (p.shipjob?.count || 0)
    ]));
    const add = (id, fleet) => {
      if (Object.hasOwn(counts, id)) counts[id] += Object.values(fleet).reduce((a, b) => a + b, 0);
    };
    for (const m of row.state.missions) if (m.type !== "colony") {
      let fleet = m.fleet || {
        [m.ship]: m.count
      };
      add(m.type === "station" ? m.to : m.type === "route" ? m.home : m.from, fleet);
    }
    for (const m of w.missions) if (m.user_id === row.user_id && m.kind === "scan" && !m.completed) add(m.from_id, {
      longProbe: 1
    });
    for (const m of w.attacks) if (m.attacker_id === row.user_id && m.status !== "returned") add(m.from, m.status === "outbound" ? m.fleet : m.survivors);
    if (Object.values(counts).some((n) => n > 5e3)) throw Error("Maximal 5000 Einheiten einschlie\xDFlich Bauauftr\xE4gen und gebundener R\xFCckflotten je Planet.");
  }
}
function processWorld(snapshot, uid, request) {
  const w = advanceWorld(prepareWorld(snapshot)), type = request.type, action = request.action || {};
  if (!w.saves.some((r) => r.user_id === uid)) {
    if (type !== "new") return w;
    const name = String(request.name || "Commander").trim().slice(0, 30) || "Commander";
    w.saves.push({
      user_id: uid,
      revision: 0,
      state: newGame(name, w.now)
    });
  }
  const s = stateOf(w, uid), start = w.starts.find((x) => x.user_id === uid);
  if (start) s.galaxy = {
    x: start.x,
    y: start.y
  };
  if (type === "command") {
    if (![
      "build",
      "research",
      "ship",
      "probe",
      "colony",
      "transport",
      "reserve",
      "edit-route",
      "cancel-route-edit",
      "stop-route",
      "station",
      "collect",
      "route",
      "deliver",
      "repair",
      "cancel-ship"
    ].includes(action.type)) throw Error("Unbekannte Spielaktion.");
    if (action.type === "ship" && Object.values(getPlanet(s, action.planet || s.active).ships).reduce((a, b) => a + b, 0) + action.count > 5e3) throw Error("Vorerst maximal 5000 Einheiten je Planet.");
    const updated = act(s, action, w.now);
    w.saves.find((r) => r.user_id === uid).state = updated;
  } else if (type === "galaxy") launchGalaxy(w, uid, action, request.eventId || request.requestId);
  else if (type === "attack") {
    launchAttack(w, uid, action, request.eventId || request.requestId);
    w.attacks[w.attacks.length - 1].seed = request.combatSeed || request.requestId;
  } else if (type === "set-pvp") {
    if (!w.admins.includes(uid)) throw Error("Nur Administratoren d\xFCrfen PvP umschalten.");
    if (typeof request.enabled !== "boolean") throw Error("Ung\xFCltiger PvP-Status.");
    w.settings.enabled = request.enabled;
  } else if (type === "rename") {
    const name = String(request.name || "").trim();
    if (!name || name.length > 30) throw Error("Name muss 1\u201330 Zeichen lang sein.");
    s.systemName = name;
  } else if (![
    "new",
    "sync"
  ].includes(type)) throw Error("Unbekannte Anfrage.");
  assertFleetLimits(w);
  for (const row of w.saves) row.state = validateSave(row.state);
  return w;
}
function projectPvP(w, uid) {
  return {
    enabled: w.settings.enabled,
    isAdmin: w.admins.includes(uid),
    serverNow: w.now,
    features: {
      cancelShip: true,
      combatRules: COMBAT_RULE_VERSION,
      combatTrace: true
    },
    homeAttacks: true,
    protectionMs: COLONY_PROTECTION,
    colonies: w.planets.filter((p) => p.owner_id && !p.reserved).map((p) => ({
      id: p.id,
      protectedUntil: p.protection_ended ? 0 : (p.colonized_at || w.now) + COLONY_PROTECTION
    })),
    outgoing: w.attacks.filter((m) => m.attacker_id === uid && m.status !== "returned").map((m) => ({
      id: m.id,
      from: m.from,
      to: m.to,
      fleet: m.status === "outbound" ? m.fleet : m.survivors,
      status: m.status,
      arrival: m.arrival_at,
      returnAt: m.return_at
    })),
    incoming: w.attacks.filter((m) => m.defender_id === uid && m.status === "outbound" && m.warning_at <= w.now).map((m) => ({
      id: m.id,
      to: m.to,
      commander: w.saves.find((r) => r.user_id === m.attacker_id)?.state.name || "Commander",
      arrival: m.arrival_at
    })),
    reports: w.attacks.filter((m) => (m.attacker_id === uid || m.defender_id === uid) && m.report).sort((a, b) => b.arrival_at - a.arrival_at).slice(0, 30).map((m) => ({
      id: m.id,
      from: m.from,
      to: m.to,
      returnAt: m.return_at,
      ...Object.fromEntries(Object.entries(m.report).filter(([key]) => key !== "trace"))
    }))
  };
}

// src/server-service.js
var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var value = (result) => {
  if (result.error) {
    const e = Error(result.error.message);
    e.status = 503;
    throw e;
  }
  return result.data;
};
async function missionId(uid, requestId) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(uid.toLowerCase() + ":" + requestId.toLowerCase()))).slice(0, 16);
  bytes[6] = bytes[6] & 15 | 80;
  bytes[8] = bytes[8] & 63 | 128;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
}
async function runServerCommand(db, uid, input) {
  if (!uuid.test(uid) || !input || typeof input !== "object") throw Error("Ung\xFCltige Anfrage.");
  const mutating = input.type !== "sync";
  if (mutating && !uuid.test(input.requestId)) throw Error("Eine eindeutige Auftrags-ID fehlt.");
  const requestId = mutating ? input.requestId : null;
  const eventId = mutating ? await missionId(uid, requestId) : null, combatSeed = crypto.randomUUID();
  for (let retry = 0; retry < 5; retry++) {
    const snapshot = value(await db.rpc("imperium_pvp_snapshot", {
      p_uid: uid,
      p_request_id: requestId
    }));
    if (snapshot.receipt && JSON.stringify(snapshot.receipt) !== JSON.stringify(input)) {
      const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [
        k,
        canonical(v[k])
      ])) : v;
      if (JSON.stringify(canonical(snapshot.receipt)) !== JSON.stringify(canonical(input))) throw Error("Diese Auftrags-ID wurde bereits anders verwendet.");
    }
    const w = processWorld(snapshot, uid, snapshot.receipt ? {
      type: "sync"
    } : {
      ...input,
      eventId,
      combatSeed
    });
    const ok = value(await db.rpc("imperium_pvp_commit", {
      p_world: w,
      p_expected: snapshot.settings.epoch,
      p_uid: uid,
      p_request_id: requestId,
      p_payload: input
    }));
    if (!ok) continue;
    const row = value(await db.from("game_saves").select("state,revision").eq("user_id", uid).maybeSingle());
    return {
      state: row?.state || null,
      revision: row?.revision || 0,
      pvp: projectPvP(w, uid)
    };
  }
  throw Error("Mehrere gleichzeitige Aktionen. Bitte erneut versuchen.");
}

// supabase/functions/game-command/index.ts
var headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {
    headers
  });
  if (req.method !== "POST") return new Response(JSON.stringify({
    error: "Nur POST erlaubt."
  }), {
    status: 405,
    headers
  });
  try {
    const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return new Response(JSON.stringify({
      error: "Bitte anmelden."
    }), {
      status: 401,
      headers
    });
    const db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return new Response(JSON.stringify({
      error: "Anmeldung abgelaufen."
    }), {
      status: 401,
      headers
    });
    const raw = await req.text();
    if (raw.length > 32e3) return new Response(JSON.stringify({
      error: "Anfrage zu gro\xDF."
    }), {
      status: 413,
      headers
    });
    const result = await runServerCommand(db, data.user.id, JSON.parse(raw));
    return new Response(JSON.stringify(result), {
      headers
    });
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 400;
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Serverfehler."
    }), {
      status,
      headers
    });
  }
});
