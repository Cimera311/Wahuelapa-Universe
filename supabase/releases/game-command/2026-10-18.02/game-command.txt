// @ts-nocheck — Generated dashboard bundle; edit source modules instead.

// supabase/functions/game-command/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

// src/config.js
var RES = ["metal", "crystal", "fuel"];
var BUILDINGS = {
  metal: { name: "Metallmine", icon: "\u26CF", cost: [80, 35, 0], time: 8, description: "F\xF6rdert Metall f\xFCr Geb\xE4ude und Schiffe." },
  crystal: { name: "Kristallmine", icon: "\u25C6", cost: [65, 60, 0], time: 9, description: "Kristalle f\xFCr Forschung und Elektronik." },
  fuel: { name: "Treibstoffanlage", icon: "\u25B0", cost: [90, 50, 0], time: 10, description: "Versorgt deine Flotten mit Treibstoff." },
  solar: { name: "Solarkraftwerk", icon: "\u2600", cost: [75, 40, 0], time: 8, description: "Liefert 45 \xD7 Stufe^Realm-Faktor Energie." },
  warehouse: { name: "Lagerkomplex", icon: "\u25A4", cost: [120, 60, 0], time: 10, description: "Erweitert alle lokalen Ressourcenlager." },
  lab: { name: "Forschungslabor", icon: "\u2697", cost: [150, 100, 0], time: 12, description: "Schaltet imperiumsweite Forschung frei." },
  shipyard: { name: "Schiffswerft", icon: "\u2692", cost: [200, 100, 0], time: 12, description: "Ab Stufe 2 verk\xFCrzt jede weitere Stufe die Bauzeit neuer Auftr\xE4ge um 8 % gegen\xFCber der vorherigen Stufe. Verbraucht dauerhaft Strom; Strommangel bremst den Schiffbau.", requires: { building: "lab", level: 1 } },
  robotics: { name: "Arbeitsroboter", icon: "\u2699", cost: [400, 300, 60], time: 20, description: "Verk\xFCrzen neue Bauauftr\xE4ge um 8 % je Stufe.", requires: { tech: "engineering", level: 1 } },
  repairDock: { asset: "./assets/pvp-resource-v1/actions/repair.webp", name: "Reparaturdock", icon: "\u2692", cost: [1200, 800, 300], time: 60, description: "Repariert besch\xE4digte Einheiten im Orbit. Eigene Warteschlange; jede weitere Stufe verk\xFCrzt neue Reparaturen um 8 %. Verbraucht Energie.", requires: { building: "shipyard", level: 2 } },
  orbital: { asset: "./assets/pvp-resource-v1/buildings/orbital.webp", name: "Orbitalwerft", icon: "\u25CE", cost: [200, 100, 0], time: 60, description: "Produziert Orbitalgesch\xFCtze. Ausbaukosten wie bei der Schiffswerft: Metall und Kristall, kein Treibstoff. Verbraucht dauerhaft Energie. Jede Ausbaustufe verk\xFCrzt die Bauzeit und erm\xF6glicht einen zus\xE4tzlichen Auftragsplatz (maximal 20).", requires: { tech: "military", level: 1 } },
  bunker: { asset: "./assets/pvp-resource-v1/buildings/bunker.webp", name: "Ressourcenbunker", icon: "\u25A3", cost: [450, 300, 80], time: 45, description: "Je Stufe sch\xFCtzt er 2,5 % der Lagerkapazit\xE4t, insgesamt maximal 2000 je Rohstoff.", requires: { tech: "military", level: 1 } },
  tidal: { name: "Gezeitenkraftwerk", icon: "\u2248", cost: [700, 450, 80], time: 30, description: "Liefert 180 \xD7 Stufe^Realm-Faktor Energie auf Ozeanwelten.", requires: { tech: "energy", level: 3 }, ocean: true }
};
var TECHS = {
  scout: { name: "Sensortechnik", description: "Stufe 1: Sonden. Weitere Stufen: k\xFCrzere Sondenfl\xFCge und fr\xFChere PvP-Warnungen. Je Stufe sinkt die Zeit bis zur Erkennung um weitere 10 % (abnehmender absoluter Effekt).", cost: [100, 100, 30], time: 10, lab: 1, max: 100 },
  logistics: { name: "Transporttechnik", description: "Frachter freischalten; je Stufe +15 % Laderaum.", cost: [150, 120, 40], time: 12, lab: 1, max: 5, requires: { tech: "scout", level: 1 } },
  colonization: { name: "Kolonisierung", description: "Stufen 1\u20133: die drei Tutorial-Kolonien. Stufen 4\u20136: Pl\xE4tze f\xFCr die k\xFCnftige gemeinsame Galaxie.", cost: [350, 250, 100], time: 16, lab: 2, max: 6, requires: { tech: "scout", level: 1 } },
  drive: { name: "Verbrennungstriebwerke", description: "F\xFCr Sonden, Kolonieschiffe, kleine Transporter, Kurier und Falke: je Stufe +5 % Antriebsleistung; separate Verbrauchsreduktion von 12 % je Stufe. Stufe 3 erm\xF6glicht Staustrahlforschung.", cost: [200, 150, 80], time: 14, lab: 2, max: 10, requires: { tech: "logistics", level: 1 } },
  ramjet: { name: "Staustrahltriebwerke", description: "Stufe 1: W\xE4chter; Stufe 2: Karawane. Je Stufe +5 % Antriebsleistung und separate Verbrauchsreduktion von 12 % je Stufe nur f\xFCr diese Schiffe. Stufe 1 bereitet Fl\xFCge in die k\xFCnftige gemeinsame Galaxie vor; Stufe 3 erm\xF6glicht Impulstriebwerke.", cost: [600, 450, 200], time: 24, lab: 3, max: 10, requires: { tech: "drive", level: 3 } },
  impulse: { name: "Impulstriebwerke", description: "Stufe 1: Donner; Stufe 2: Atlas. Je Stufe +5 % Antriebsleistung und separate Verbrauchsreduktion von 12 % je Stufe nur f\xFCr diese Schiffe. Stufe 3 erm\xF6glicht Hyperraumtriebwerke.", cost: [1800, 1400, 650], time: 40, lab: 4, max: 10, requires: { tech: "ramjet", level: 3 } },
  hyperspace: { name: "Hyperraumtriebwerke", description: "Stufe 1: Titan; Stufe 2: Arche. Je Stufe +5 % Antriebsleistung und separate Verbrauchsreduktion von 12 % je Stufe nur f\xFCr diese Schiffe.", cost: [5500, 4200, 2e3], time: 65, lab: 5, max: 10, requires: { tech: "impulse", level: 3 } },
  engineering: { name: "Bautechnik", description: "Je Stufe 5 % k\xFCrzere neue Bauauftr\xE4ge; Arbeitsroboter.", cost: [250, 200, 40], time: 16, lab: 2, max: 5 },
  military: { name: "Milit\xE4rtechnik", description: "Stufen 1\u20134 schalten Kriegsschiffe und Verteidigung frei. Angriffspl\xE4tze: Stufe 1 = 1, Stufe 5 = 2, Stufe 10 = 4 gleichzeitig. Ab Stufe 6 steigen Kosten je Stufe um Faktor 2,4.", cost: [300, 220, 80], time: 18, lab: 2, max: 10, requires: { tech: "engineering", level: 1 } },
  weapons: { asset: "./assets/pvp-resource-v1/research/weapons.webp", name: "Waffentechnik", description: "Je Stufe +8 % Angriffsschaden.", cost: [400, 300, 100], time: 60, lab: 3, max: 5, requires: { tech: "military", level: 1 } },
  shields: { asset: "./assets/pvp-resource-v1/research/shields.webp", name: "Schildtechnik", description: "Je Stufe +8 % Schildst\xE4rke.", cost: [350, 450, 100], time: 60, lab: 3, max: 5, requires: { tech: "military", level: 1 } },
  armor: { asset: "./assets/pvp-resource-v1/research/armor.webp", name: "Panzerung", description: "Je Stufe +8 % H\xFCllenpunkte.", cost: [500, 250, 100], time: 60, lab: 3, max: 5, requires: { tech: "military", level: 1 } },
  assaultDrive: { asset: "./assets/pvp-resource-v1/research/assaultDrive.webp", name: "Falke-Galaxieantrieb", description: "R\xFCstet Falken f\xFCr interstellare Angriffe und Stationierungen mit Staustrahlantrieb aus.", cost: [600, 400, 200], time: 60, lab: 3, max: 1, requires: { tech: "ramjet", level: 1 } },
  energy: { name: "Energietechnik", description: "Je Stufe +10 % Energie; Stufe 3: Gezeitenkraftwerk.", cost: [200, 180, 50], time: 15, lab: 2, max: 5 }
};
var SHIPS = {
  spyProbe: { name: "Spionagesonde", icon: "\u2301", category: "civil", image: "probe", role: "Kl\xE4rt pers\xF6nliche Piratenstationen auf. Ben\xF6tigt die passende Sensortechnik f\xFCr die Zielstufe.", cost: [150, 120, 40], time: 8, tech: "scout", techLevel: 1, shipyard: 1, cargo: 0, speed: 2, fuel: 2 },
  probe: { name: "Erkundungssonde", icon: "\u2301", category: "civil", role: "Erkundet unbekannte Welten.", cost: [90, 60, 20], time: 5, tech: "scout", cargo: 0, speed: 1, fuel: 1.5 },
  transport: { name: "Kleiner Transporter", icon: "\u27A4", category: "freighter", role: "Bew\xE4hrter Allrounder f\xFCr deine ersten Kolonien.", cost: [180, 100, 40], time: 8, tech: "logistics", cargo: 1e3, speed: 1, fuel: 4 },
  longProbe: { name: "Fernsonde", icon: "\u2301", category: "civil", image: "probe", role: "Untersucht Planeten in der gemeinsamen Galaxie.", cost: [280, 200, 80], time: 10, tech: "scout", techLevel: 2, shipyard: 2, engine: "ramjet", engineLevel: 1, cargo: 0, speed: 1, fuel: 3 },
  starColony: { name: "Interstellares Kolonieschiff", icon: "\u2726", category: "civil", image: "colony", role: "Besiedelt eine erkundete Galaxiewelt und wird dabei verbraucht.", cost: [1200, 850, 400], time: 30, tech: "colonization", techLevel: 4, shipyard: 3, engine: "ramjet", engineLevel: 1, cargo: 0, speed: 1, fuel: 18 },
  colony: { name: "Kolonieschiff", icon: "\u2726", category: "civil", role: "Gr\xFCndet eine Kolonie und wird dabei verbraucht.", cost: [500, 300, 100], time: 12, tech: "colonization", cargo: 0, speed: 1, fuel: 4 },
  kurier: { name: "Kurier", icon: "\u27A4", category: "freighter", tier: 1, role: "Leichter Frachter f\xFCr schnelle kleine Lieferungen.", cost: [140, 80, 30], time: 6, tech: "logistics", techLevel: 1, shipyard: 1, cargo: 750, speed: 1.35, fuel: 3 },
  karawane: { name: "Karawane", icon: "\u27A4", category: "freighter", tier: 2, role: "Modulfrachter f\xFCr regelm\xE4\xDFige Handelsrouten.", cost: [800, 450, 180], time: 20, tech: "logistics", techLevel: 2, shipyard: 2, engine: "ramjet", engineLevel: 2, cargo: 5e3, speed: 0.9, fuel: 12 },
  atlas: { name: "Atlas", icon: "\u27A4", category: "freighter", tier: 3, role: "Schwerlastfrachter f\xFCr den Ausbau ganzer Kolonien.", cost: [2400, 1400, 600], time: 45, tech: "logistics", techLevel: 3, shipyard: 4, engine: "impulse", engineLevel: 2, cargo: 16e3, speed: 0.7, fuel: 28 },
  arche: { name: "Arche", icon: "\u27A4", category: "freighter", tier: 4, role: "Megafrachter f\xFCr gro\xDFe Sammellieferungen.", cost: [7600, 4400, 2e3], time: 90, tech: "logistics", techLevel: 5, shipyard: 6, engine: "hyperspace", engineLevel: 2, cargo: 5e4, speed: 0.55, fuel: 70 },
  falke: { name: "Falke", icon: "\u2727", category: "military", tier: 1, role: "Abfangj\xE4ger f\xFCr schnelle Verlegungen.", cost: [240, 150, 60], time: 60, tech: "military", techLevel: 1, shipyard: 1, cargo: 0, speed: 1.5, fuel: 6 },
  waechter: { name: "W\xE4chter", icon: "\u2727", category: "military", tier: 2, role: "Eskortfregatte als Grundlage f\xFCr sp\xE4teren Geleitschutz.", cost: [900, 600, 220], time: 180, tech: "military", techLevel: 2, shipyard: 2, engine: "ramjet", engineLevel: 1, cargo: 0, speed: 1.1, fuel: 16 },
  donner: { name: "Donner", icon: "\u2727", category: "military", tier: 3, role: "Angriffskreuzer f\xFCr die sp\xE4tere Kampfflotte.", cost: [3e3, 1800, 700], time: 480, tech: "military", techLevel: 3, shipyard: 4, engine: "impulse", engineLevel: 1, cargo: 0, speed: 0.85, fuel: 40 },
  flak: { asset: "./assets/pvp-resource-v1/defense/flak.webp", name: "Flakplattform", icon: "\u2723", category: "defense", role: "Leichte Tr\xE4gerplattform mit Flakbewaffnung.", cost: [240, 150, 60], time: 60, tech: "military", techLevel: 1, shipyard: 1, slots: 1, cargo: 0, speed: 0, fuel: 0 },
  laser: { asset: "./assets/pvp-resource-v1/defense/laser.webp", name: "Laserplattform", icon: "\u2295", category: "defense", role: "Mittlere Tr\xE4gerplattform mit Lasergesch\xFCtz.", cost: [900, 600, 220], time: 180, tech: "military", techLevel: 2, shipyard: 2, slots: 1, cargo: 0, speed: 0, fuel: 0 },
  rail: { asset: "./assets/pvp-resource-v1/defense/rail.webp", name: "Railgunplattform", icon: "\u2316", category: "defense", role: "Schwere Tr\xE4gerplattform mit Railgun.", cost: [3e3, 1800, 700], time: 480, tech: "military", techLevel: 3, shipyard: 4, slots: 1, cargo: 0, speed: 0, fuel: 0 },
  plasma: { asset: "./assets/pvp-resource-v1/defense/plasma.webp", name: "Plasmaplattform", icon: "\u273A", category: "defense", role: "Gro\xDFplattform mit Plasmagesch\xFCtz.", cost: [9500, 6500, 2500], time: 1200, tech: "military", techLevel: 4, shipyard: 6, slots: 1, cargo: 0, speed: 0, fuel: 0 },
  titan: { name: "Titan", icon: "\u2727", category: "military", tier: 4, role: "Schlachtschiff als Kern einer schweren Flotte.", cost: [9500, 6500, 2500], time: 1200, tech: "military", techLevel: 4, shipyard: 6, engine: "hyperspace", engineLevel: 1, cargo: 0, speed: 0.6, fuel: 100 }
};
function isFreighter(key) {
  return SHIPS[key]?.category === "freighter";
}
var TARGETS = [
  { id: "ferrum", name: "Ferrum", coord: "1:2:7", kind: "Gesteinsplanet", specialty: "Metall", distance: 2, mult: [1.8, 0.75, 0.65], color: "#ba7047", ocean: false, energy: 1 },
  { id: "nereus", name: "Nereus", coord: "1:3:7", kind: "Eisplanet", specialty: "Treibstoff", distance: 3, mult: [0.7, 1, 1.9], color: "#80cbe3", ocean: false, energy: 1.2 },
  { id: "thalassa", name: "Thalassa", coord: "1:4:5", kind: "Ozeanplanet", specialty: "Kristall", distance: 4, mult: [0.85, 1.6, 1.1], color: "#3c92c9", ocean: true, energy: 1 }
];
function vector(values) {
  return Object.fromEntries(RES.map((k, i) => [k, values[i]]));
}
function costAt(item, level) {
  return vector(item.cost.map((v) => Math.ceil(v * Math.pow(1.6, level) * Math.pow(item === TECHS.military ? 1.5 : 1, Math.max(0, level - 4)))));
}
var ROUTE_ECONOMY = { time: 1, fuel: 0.75 };
function shipFlightEngine(s, key, remote = false) {
  return remote && key === "spyProbe" ? "ramjet" : remote && key === "falke" && (s.tech.assaultDrive || 0) >= 1 ? "ramjet" : SHIPS[key]?.engine || "drive";
}
function canFlyInterstellar(s, key) {
  const engine = shipFlightEngine(s, key, true);
  return (key === "falke" ? (s.tech.assaultDrive || 0) >= 1 : !!SHIPS[key]?.engine) && (s.tech[engine] || 0) >= 1;
}
function attackSlots(level) {
  return level >= 10 ? 4 : level >= 5 ? 2 : level >= 1 ? 1 : 0;
}

// src/realm-config.js
var REALM_CONFIG = Object.freeze({
  galaxyFlightTimeFactor: 3,
  // Rapid Fire v6 rules; the active combat engine is selected by the administrator.
  combat: Object.freeze({
    rapidFire: Object.freeze({
      enabled: true,
      maxExtraSalvos: 3,
      allowInOrbitalOpening: false,
      // Chance per additional salvo, 0..1. All other attacker->target pairs: 0.
      chances: Object.freeze({
        waechter: Object.freeze({ falke: 0.2 }),
        donner: Object.freeze({ flak: 0.15, laser: 0.15 }),
        titan: Object.freeze({ falke: 0.1 })
      })
    })
  }),
  powerExponents: Object.freeze({
    default: Object.freeze({ solar: 1.25, tidal: 1.25, fuelPower: 1.25 }),
    Heimatwelt: Object.freeze({ solar: 1.25, tidal: 1.25, fuelPower: 1.25 }),
    Gesteinsplanet: Object.freeze({ solar: 1.25, tidal: 1.25, fuelPower: 1.25 }),
    Eisplanet: Object.freeze({ solar: 1.25, tidal: 1.25, fuelPower: 1.25 }),
    Ozeanplanet: Object.freeze({ solar: 1.25, tidal: 1.25, fuelPower: 1.25 })
  })
});
function powerExponent(kind, plant) {
  return (REALM_CONFIG.powerExponents[kind] || REALM_CONFIG.powerExponents.default)[plant] ?? REALM_CONFIG.powerExponents.default[plant];
}
function combatConfigForRealm(overrides = {}) {
  const base = REALM_CONFIG.combat.rapidFire, patch = overrides.combat?.rapidFire || {};
  const chances = patch.replaceChances ? {} : Object.fromEntries(Object.entries(base.chances).map(([ship, pairs]) => [ship, { ...pairs }]));
  for (const [ship, pairs] of Object.entries(patch.chances || {})) chances[ship] = { ...chances[ship] || {}, ...pairs };
  const settings = {
    enabled: patch.enabled ?? base.enabled,
    maxExtraSalvos: patch.maxExtraSalvos ?? base.maxExtraSalvos,
    allowInOrbitalOpening: patch.allowInOrbitalOpening ?? base.allowInOrbitalOpening,
    chances
  };
  if (typeof settings.enabled !== "boolean" || typeof settings.allowInOrbitalOpening !== "boolean" || !Number.isSafeInteger(settings.maxExtraSalvos) || settings.maxExtraSalvos < 0 || settings.maxExtraSalvos > 10)
    throw Error("Ung\xFCltige Realm Rapid-Fire-Einstellungen.");
  for (const pairs of Object.values(chances)) for (const chance of Object.values(pairs))
    if (typeof chance !== "number" || !Number.isFinite(chance) || chance < 0 || chance > 1) throw Error("Ung\xFCltige Rapid-Fire-Chance.");
  return { rapidFire: settings };
}
var REALM_COMBAT_OVERRIDES = Object.freeze({
  main: Object.freeze({}),
  test: Object.freeze({ combat: Object.freeze({ rapidFire: Object.freeze({
    maxExtraSalvos: 2,
    chances: Object.freeze({ titan: Object.freeze({ falke: 0.15 }) })
  }) }) }),
  test2: Object.freeze({ combat: Object.freeze({ rapidFire: Object.freeze({
    maxExtraSalvos: 1,
    chances: Object.freeze({
      waechter: Object.freeze({ falke: 1 }),
      donner: Object.freeze({ flak: 1, laser: 1 }),
      titan: Object.freeze({ falke: 1 })
    })
  }) }) }),
  // Test4: Rollenbasierte Rapid-Fire-Matrix, ohne klassische Schadensboni.
  test4: Object.freeze({ combat: Object.freeze({
    rapidFire: Object.freeze({
      enabled: true,
      maxExtraSalvos: 3,
      allowInOrbitalOpening: true,
      replaceChances: true,
      chances: Object.freeze({
        falke: Object.freeze({ donner: 0.2, titan: 0.4 }),
        waechter: Object.freeze({ falke: 0.75, flak: 0.25 }),
        donner: Object.freeze({ waechter: 0.25, flak: 0.85, laser: 0.75, rail: 0.6, plasma: 0.4 }),
        titan: Object.freeze({ waechter: 0.4, donner: 0.5, flak: 0.6, laser: 0.4, rail: 0.2 }),
        flak: Object.freeze({ falke: 0.8, waechter: 0.2 }),
        laser: Object.freeze({ falke: 0.4, waechter: 0.6 }),
        rail: Object.freeze({ donner: 0.6, titan: 0.4 }),
        plasma: Object.freeze({ donner: 0.4, titan: 0.6 })
      })
    })
  }) })
});

// src/flight.js
var GALAXY_FLIGHT_RULE_VERSION = 4;
var ENGINE_SPEED_BONUS = 0.05;
var ENGINE_FUEL_BONUS = 0.12;
var FLIGHT_BASE_SCALE = 1.25 / 1.6;
function sharedDistance(from, to, start) {
  if (from.system && from.system === to.system) return Math.max(1, Math.abs((from.slot || from.distance || 0) - (to.slot || to.distance || 0)) * 0.15);
  const a = from.system ? from : { ...start, slot: 0 }, b = to.system ? to : { ...start, slot: 0 };
  if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) throw Error("Der pers\xF6nliche Galaxie-Startplatz fehlt. Bitte die Galaxie aktualisieren.");
  return Math.max(1, Math.hypot(a.x - b.x, a.y - b.y) / 40 + Math.abs((a.slot || 0) - (b.slot || 0)) * 0.15);
}
function sharedFlight(s, from, to, count = 1, ship = "transport", start = s.galaxy) {
  const def = SHIPS[ship];
  if (!def || def.speed <= 0) throw Error("Unbekanntes oder unbewegliches Schiff.");
  const distance = sharedDistance(from, to, start), remote = (from.system || "tutorial") !== (to.system || "tutorial");
  const engine = shipFlightEngine(s, ship, remote), factor = 1 + (s.tech[engine] || 0) * ENGINE_SPEED_BONUS, fuelFactor = 1 + (s.tech[engine] || 0) * ENGINE_FUEL_BONUS;
  return { distance, ms: Math.ceil(Math.max(6e4, Math.ceil((120 + distance * 45) * FLIGHT_BASE_SCALE * 1e3 / (def.speed * factor))) * REALM_CONFIG.galaxyFlightTimeFactor), fuel: Math.ceil(def.fuel * distance * count / fuelFactor) };
}

// src/pirates-config.js
var PIRATE_STATION_META = Object.freeze([
  { id: "smugglers", name: "Schmugglernest", tier: 1, type: "Leichter Au\xDFenposten", description: "Ein Versteck zwischen alten Containern und Antrieben." },
  { id: "outpost", name: "Piratenposten", tier: 2, type: "Bewaffneter St\xFCtzpunkt", description: "Ein Umschlagplatz mit eigenen Patrouillen." },
  { id: "harbor", name: "Raubritterhafen", tier: 3, type: "Befestigter Raumhafen", description: "Hier sammeln sich die Freibeuter des Sektors." },
  { id: "fortress", name: "Freibeuterfestung", tier: 4, type: "Schwere Festung", description: "Bewaffnete Dockringe sichern die erbeuteten Vorr\xE4te." },
  { id: "headquarters", name: "Piratenhauptquartier", tier: 5, type: "Zentrum der Piratenflotte", description: "Von hier aus werden die gro\xDFen Raubz\xFCge koordiniert." }
]);
var PIRATE_REALM_DEFAULTS = Object.freeze({
  enabled: true,
  strengthFactor: 1,
  resourceFactor: 1,
  flightTimeFactor: 1,
  fuelFactor: 1,
  cooldownMinutes: 60,
  debrisRate: 0.3,
  debrisLifetimeHours: 24,
  maxMissions: 20,
  stations: {
    smugglers: { enabled: true, sensor: 1, fleet: { falke: 3 }, resources: { metal: 2400, crystal: 1600, fuel: 400 }, tech: { weapons: 0, armor: 0, shields: 0 } },
    outpost: { enabled: true, sensor: 3, fleet: { falke: 12, waechter: 2, flak: 2 }, resources: { metal: 9e3, crystal: 6e3, fuel: 1800 }, tech: { weapons: 1, armor: 1, shields: 1 } },
    harbor: { enabled: true, sensor: 5, fleet: { falke: 30, waechter: 10, donner: 2, laser: 4 }, resources: { metal: 28e3, crystal: 22e3, fuel: 6e3 }, tech: { weapons: 2, armor: 2, shields: 2 } },
    fortress: { enabled: true, sensor: 7, fleet: { falke: 60, waechter: 25, donner: 10, titan: 2, rail: 6 }, resources: { metal: 85e3, crystal: 65e3, fuel: 16e3 }, tech: { weapons: 3, armor: 3, shields: 3 } },
    headquarters: { enabled: true, sensor: 10, fleet: { falke: 120, waechter: 60, donner: 30, titan: 12, plasma: 10 }, resources: { metal: 24e4, crystal: 18e4, fuel: 45e3 }, tech: { weapons: 5, armor: 5, shields: 5 } }
  }
});
function pirateConfig(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Ung\xFCltige Piratenkonfiguration.");
  const c = structuredClone(PIRATE_REALM_DEFAULTS), keys = Object.keys(c);
  if (Object.keys(input).some((k) => !keys.includes(k))) throw Error("Unbekannter Piratenfaktor.");
  for (const k of keys) if (k !== "stations" && input[k] !== void 0) c[k] = input[k];
  for (const k of ["strengthFactor", "resourceFactor", "flightTimeFactor", "fuelFactor"]) if (!Number.isFinite(c[k]) || c[k] < 0.1 || c[k] > 20) throw Error("Piratenfaktoren m\xFCssen zwischen 0,1 und 20 liegen.");
  for (const [k, min, max] of [["cooldownMinutes", 1, 1440], ["debrisLifetimeHours", 1, 168], ["maxMissions", 1, 50]]) if (!Number.isSafeInteger(c[k]) || c[k] < min || c[k] > max) throw Error("Ung\xFCltiger Piratenwert: " + k);
  if (typeof c.enabled !== "boolean" || !Number.isFinite(c.debrisRate) || c.debrisRate < 0 || c.debrisRate > 1) throw Error("Ung\xFCltige Aktivierung oder Tr\xFCmmerquote.");
  if (input.stations !== void 0 && (!input.stations || typeof input.stations !== "object" || Array.isArray(input.stations) || Object.keys(input.stations).some((id) => !Object.hasOwn(c.stations, id)))) throw Error("Unbekannte Piratenstation.");
  for (const meta of PIRATE_STATION_META) {
    const patch = input.stations?.[meta.id] || {}, b = c.stations[meta.id];
    if (Object.keys(patch).some((k) => !["enabled", "sensor", "fleet", "resources", "tech"].includes(k))) throw Error("Unbekannter Stationswert.");
    Object.assign(b, structuredClone(patch));
    if (typeof b.enabled !== "boolean" || !Number.isSafeInteger(b.sensor) || b.sensor < 0 || b.sensor > 100) throw Error("Ung\xFCltige Sensoranforderung.");
    if (!b.fleet || Array.isArray(b.fleet) || !Object.keys(b.fleet).length || Object.entries(b.fleet).some(([k, n]) => !["military", "defense"].includes(SHIPS[k]?.category) || !Number.isSafeInteger(n) || n < 1 || n > 1e4) || Object.values(b.fleet).reduce((a, n) => a + n, 0) * c.strengthFactor > 1e5) throw Error("Ung\xFCltige Piratenbesatzung.");
    if (!b.resources || Object.keys(b.resources).some((k) => !RES.includes(k)) || RES.some((k) => !Number.isSafeInteger(b.resources[k]) || b.resources[k] < 0 || b.resources[k] > 1e8)) throw Error("Ung\xFCltiges Piratendepot.");
    if (!b.tech || Object.keys(b.tech).some((k) => !["weapons", "armor", "shields"].includes(k)) || ["weapons", "armor", "shields"].some((k) => !Number.isSafeInteger(b.tech[k]) || b.tech[k] < 0 || b.tech[k] > 5)) throw Error("Ung\xFCltige Piratenforschung.");
  }
  return c;
}
function pirateFlight(s, from, station, fleet, c) {
  const target = { system: "tutorial", slot: 5 + station.tier, x: s.galaxy?.x || 0, y: s.galaxy?.y || 0 };
  const origin = from.system ? from : { ...from, system: "tutorial", slot: from.distance || 0, x: target.x, y: target.y };
  let ms2 = 0, fuel = 0, slowest = "";
  for (const [k, n] of Object.entries(fleet)) {
    if (origin.system !== "tutorial" && !canFlyInterstellar(s, k)) throw Error("F\xFCr " + SHIPS[k].name + " fehlt der Galaxieantrieb. Starte alternativ aus deinem Sonnensystem.");
    const f = sharedFlight(s, origin, target, n, k);
    if (f.ms > ms2) {
      ms2 = f.ms;
      slowest = k;
    }
    fuel += 2 * f.fuel;
  }
  return { ms: Math.max(1e3, Math.ceil(ms2 * c.flightTimeFactor)), fuel: Math.ceil(fuel * c.fuelFactor), slowest };
}

// src/repair.js
var REPAIR_RATE = 0.3;
var ORBITAL_RESTORE_RATE = 0.7;
function repairAvailable(p, key) {
  return (p.disabledDefenses?.[key] || 0) + (p.hulls?.[key] || []).length;
}
function recordDisabledDefenses(p, before, after) {
  p.disabledDefenses ??= {};
  for (const [key, sh] of Object.entries(SHIPS)) if (sh.category === "defense") {
    const lost = Math.max(0, (before[key] || 0) - (after[key] || 0));
    if (lost) p.disabledDefenses[key] = (p.disabledDefenses[key] || 0) + lost;
  }
}
function repairOrders(p) {
  return p.repairQueue || [];
}
function repairQuote(p, key, count = 1, ratio = 1) {
  if (!SHIPS[key]) throw Error("Unbekannte Einheit.");
  const hulls = [...p.hulls?.[key] || []].sort((a, b) => a - b), disabled = p.disabledDefenses?.[key] || 0;
  if (!Number.isSafeInteger(count) || count < 1 || count > repairAvailable(p, key) || count > 1e5) throw Error("W\xE4hle eine g\xFCltige Anzahl besch\xE4digter Einheiten.");
  const restore = disabled > 0;
  if (restore && count > (p.disabledDefenses?.[key] || 0)) throw Error("Defekte und teilbesch\xE4digte Gesch\xFCtze bitte getrennt reparieren.");
  const selected = restore ? Array(count).fill(0) : hulls.slice(0, count), damage = selected.reduce((n, h) => n + 1 - h, 0), factor = restore ? Math.pow(0.92, Math.max(0, (p.buildings.orbital || 0) - 1) + (p.buildings.robotics || 0)) : Math.pow(0.92, Math.max(0, (p.buildings.repairDock || 0) - 1));
  const work = Math.max(1, SHIPS[key].time * 1e3 * (restore ? 1 : REPAIR_RATE) * damage * factor);
  return { restore, hulls: selected, count, cost: vector(SHIPS[key].cost.map((c, i) => i === 2 ? 0 : Math.ceil(c * (restore ? ORBITAL_RESTORE_RATE : REPAIR_RATE) * damage))), work, factor, ms: ratio > 0 ? Math.ceil(work / ratio) : null, hull: 1 - damage / count };
}
function repairMaterials(j) {
  if (j.restore) return vector([0, 0, 0]);
  return vector(RES.map((k, i) => i === 2 ? 0 : Math.max(0, Math.ceil(j.entries.reduce((n, e) => n + Math.max(0, SHIPS[j.key].cost[i] * REPAIR_RATE * (1 - e.hp) - e.credit[k]), 0) - 1e-7))));
}
function repairRefund(j) {
  return vector(RES.map((k) => Math.floor(j.entries.reduce((n, e) => n + e.credit[k], 0) + 1e-7)));
}
function reserveRepair(p, key, quote, id, time) {
  if (quote.restore) {
    p.disabledDefenses[key] -= quote.count;
  }
  const remaining = [...p.hulls?.[key] || []].sort((a, b) => a - b).slice(quote.restore ? 0 : quote.count);
  p.hulls ??= {};
  if (remaining.length) p.hulls[key] = remaining;
  else delete p.hulls[key];
  if (!quote.restore) p.ships[key] -= quote.count;
  const entries = quote.hulls.map((hp) => ({ hp, initialHp: hp, workRemaining: Math.max(1, SHIPS[key].time * 1e3 * (quote.restore ? 1 : REPAIR_RATE) * (1 - hp) * quote.factor), credit: vector(SHIPS[key].cost.map((c, i) => i === 2 ? 0 : c * (quote.restore ? ORBITAL_RESTORE_RATE : REPAIR_RATE) * (1 - hp))) }));
  for (const k of RES) entries[0].credit[k] += quote.cost[k] - entries.reduce((n, e) => n + e.credit[k], 0);
  const job = { ...quote.restore ? { restore: true } : {}, id, key, start: time, count: quote.count, completed: 0, lost: 0, factor: quote.factor, entries };
  (p.repairQueue ??= []).push(job);
  return job;
}
function payRepairMaterials(j, cost) {
  for (const [i, k] of RES.entries()) {
    if (i === 2) continue;
    let left = cost[k];
    for (const e of j.entries) {
      const need2 = Math.max(0, SHIPS[j.key].cost[i] * REPAIR_RATE * (1 - e.hp) - e.credit[k]), amount = Math.min(need2, left);
      e.credit[k] += amount;
      left -= amount;
    }
    if (left > 0 && j.entries.length) j.entries[0].credit[k] += left;
  }
}
function releaseRepair(p, j) {
  p.hulls ??= {};
  for (const e of j.entries) {
    if (j.restore) {
      p.disabledDefenses ??= {};
      p.disabledDefenses[j.key] = (p.disabledDefenses[j.key] || 0) + 1;
      continue;
    }
    p.ships[j.key]++;
    if (e.hp < 1) (p.hulls[j.key] ??= []).push(e.hp);
  }
  p.repairQueue = repairOrders(p).filter((q) => q.id !== j.id);
}
function forecastRepair(p, time, ratio) {
  let wait = 0, blocked = false;
  for (const j of repairOrders(p)) {
    j.materials = repairMaterials(j);
    blocked ||= RES.some((k) => j.materials[k] > 0);
    j.paused = blocked || ratio === 0;
    wait += j.entries.reduce((n, e) => n + e.workRemaining, 0);
    j.end = time + Math.max(1, Math.ceil(wait / (ratio || 1)));
  }
  const active = repairOrders(p)[0];
  return active && !active.paused ? time + Math.max(0, Math.ceil(active.entries[0].workRemaining / ratio)) : Infinity;
}
function produceRepair(p, elapsed, ratio) {
  const j = repairOrders(p)[0];
  if (!j || j.paused || !j.entries.length) return;
  const e = j.entries[0], work = Math.min(e.workRemaining, elapsed * ratio), fraction = e.workRemaining ? work / e.workRemaining : 1;
  e.hp = Math.min(1, e.hp + (1 - e.hp) * fraction);
  for (const k of RES) e.credit[k] *= 1 - fraction;
  e.workRemaining = Math.max(0, e.workRemaining - work);
  if (e.workRemaining < 1e-6) {
    e.workRemaining = 0;
    e.hp = 1;
  }
}
function finishRepair(p, notify) {
  const j = repairOrders(p)[0];
  if (!j || j.entries[0]?.workRemaining > 1e-6) return 0;
  let finished = 0;
  while (j.entries[0]?.workRemaining <= 1e-6) {
    j.entries.shift();
    j.completed++;
    finished++;
    p.ships[j.key]++;
  }
  if (!j.entries.length) {
    p.repairQueue.shift();
    notify?.("Reparatur abgeschlossen", `${p.name}: ${j.completed} \xD7 ${SHIPS[j.key].name} wieder einsatzbereit.`);
  }
  return finished;
}
function repairDefense(p, owner, commander, tech, shieldFactor2) {
  return repairOrders(p).filter((j) => !j.restore).map((j) => ({ id: "repair:" + j.id, owner, commander: commander + " \xB7 Reparaturdock", fleet: { [j.key]: j.entries.length }, hulls: { [j.key]: j.entries.map((e) => e.hp) }, tech, shieldFactor: shieldFactor2 }));
}
function reconcileRepairBattle(p, result2) {
  for (const j of [...repairOrders(p)].filter((j2) => !j2.restore)) {
    const finals = result2.trace?.final?.filter((u) => u.groupId === "repair:" + j.id) || result2.defenderGroups?.find((g) => g.id === "repair:" + j.id)?.repairUnits || [];
    if (finals.length !== j.entries.length) throw Error("Reparaturdock: Kampfzuordnung fehlt.");
    j.entries = j.entries.flatMap((e, i) => {
      const u = finals[i];
      if (u.hp <= 1e-8) {
        if (SHIPS[j.key].category === "defense") {
          p.disabledDefenses ??= {};
          p.disabledDefenses[j.key] = (p.disabledDefenses[j.key] || 0) + 1;
        }
        j.lost++;
        return [];
      }
      e.hp = Math.min(1, u.hp / u.maxHp);
      e.initialHp = e.hp;
      e.workRemaining = Math.max(1, SHIPS[j.key].time * 1e3 * REPAIR_RATE * (1 - e.hp) * j.factor);
      return [e];
    });
    if (!j.entries.length) p.repairQueue = p.repairQueue.filter((q) => q.id !== j.id);
  }
}

// src/combat.js
var COMBAT = {
  spyProbe: { hp: 30, shield: 0, attack: 0, shots: 1 },
  probe: { hp: 30, shield: 0, attack: 0, shots: 1 },
  longProbe: { hp: 60, shield: 10, attack: 0, shots: 1 },
  colony: { hp: 250, shield: 30, attack: 0, shots: 1 },
  starColony: { hp: 500, shield: 80, attack: 0, shots: 1 },
  transport: { hp: 100, shield: 20, attack: 0, shots: 1 },
  kurier: { hp: 80, shield: 10, attack: 0, shots: 1 },
  karawane: { hp: 450, shield: 80, attack: 0, shots: 1 },
  atlas: { hp: 1400, shield: 200, attack: 0, shots: 1 },
  arche: { hp: 4e3, shield: 600, attack: 0, shots: 1 },
  falke: { hp: 160, shield: 40, attack: 30, shots: 1, bonus: { donner: 0.25, titan: 0.25 } },
  waechter: { hp: 650, shield: 180, attack: 100, shots: 2, bonus: { falke: 0.5 } },
  donner: { hp: 2e3, shield: 400, attack: 350, shots: 2, bonus: { flak: 0.5, laser: 0.5, rail: 0.5, plasma: 0.5 } },
  titan: { hp: 6500, shield: 1400, attack: 1100, shots: 4, bonus: { waechter: 0.25, donner: 0.25 } },
  flak: { hp: 180, shield: 30, attack: 35, shots: 2, bonus: { falke: 0.75 } },
  laser: { hp: 600, shield: 150, attack: 100, shots: 2 },
  rail: { hp: 1600, shield: 300, attack: 300, shots: 1, bonus: { donner: 0.25, titan: 0.25 } },
  plasma: { hp: 4500, shield: 800, attack: 800, shots: 2, bonus: { titan: 0.25 } }
};
function combatStats(key, tech = {}) {
  const c = COMBAT[key];
  if (!c) throw Error("Unbekannte Kampfeinheit.");
  return { ...c, hp: c.hp * (1 + 0.08 * (tech.armor || 0)), shield: c.shield * (1 + 0.08 * (tech.shields || 0)), attack: c.attack * (1 + 0.08 * (tech.weapons || 0)) };
}
function attackFleet(fleet) {
  if (!fleet || typeof fleet !== "object" || Array.isArray(fleet)) throw Error("Ung\xFCltige Angriffsflotte.");
  const entries = Object.entries(fleet);
  if (!entries.length || entries.some(([k, n]) => !["military", "freighter"].includes(SHIPS[k]?.category) || !Number.isSafeInteger(n) || n < 1) || !entries.some(([k]) => SHIPS[k].category === "military")) throw Error("W\xE4hle mindestens ein Kriegsschiff und verf\xFCgbare Schiffe in ganzen Zahlen.");
  return { ...fleet };
}
function attackFlight(s, from, to, fleet) {
  attackFleet(fleet);
  if (!to.system) throw Error("Angriffsziele m\xFCssen fremde gemeinsame Kolonien sein.");
  const origin = from.system ? from : { ...s.galaxy, slot: 0 };
  if (![origin.x, origin.y, origin.slot, to.x, to.y, to.slot].every(Number.isFinite)) throw Error("Der pers\xF6nliche Galaxie-Startplatz fehlt. Bitte die Galaxie aktualisieren.");
  if (!from.system && (s.tech.ramjet || 0) < 1) throw Error("F\xFCr Angriffe aus dem Heimatsystem fehlen Staustrahltriebwerke Stufe 1.");
  const dist = sharedDistance(from, to, s.galaxy);
  let ms2 = 0, fuel = 0, slowest = "";
  for (const [key, count] of Object.entries(fleet)) {
    const remote = from.system !== to.system;
    const engine = shipFlightEngine(s, key, remote);
    if (remote && !canFlyInterstellar(s, key)) throw Error(key === "falke" ? "F\xFCr interstellare Fl\xFCge fehlt ein geeigneter Antrieb: Falke-Galaxieantrieb 1 und Staustrahltriebwerke 1 erforderlich." : "F\xFCr interstellare Fl\xFCge fehlt ein geeigneter Antrieb.");
    if (remote && (s.tech[engine] || 0) < 1) throw Error("F\xFCr interstellare Fl\xFCge fehlt die passende Triebwerksforschung.");
    const f = sharedFlight(s, from, to, count, key);
    if (f.ms > ms2) {
      ms2 = f.ms;
      slowest = key;
    }
    fuel += f.fuel * 2;
  }
  return { distance: dist, ms: ms2, fuel, slowest };
}
function warningFraction(sensorLevel) {
  return Math.pow(0.9, Math.max(0, sensorLevel) + 1);
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
  for (const [k, hp] of Object.entries(hulls)) if (hp.length) p.hulls[k] = [...p.hulls[k] || [], ...hp];
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
    if (!Number.isSafeInteger(n) || n < 0) throw Error("Ung\xFCltiger Flottenbestand.");
    const z = combatStats(key, tech);
    z.shield *= shieldFactor2;
    for (let i = 0; i < n; i++) out.push({ key, ...z, maxHp: z.hp, hp: z.hp * (hulls?.[key]?.[i] ?? 1) });
  }
  return out;
}
function combatSide(side) {
  if (!side.groups) return units(side.fleet, side.tech, side.hulls, side.shieldFactor);
  return side.groups.flatMap((g) => units(g.fleet, g.tech, g.hulls, g.shieldFactor).map((u) => ({ ...u, groupId: g.id, owner: g.owner, commander: g.commander, maxShield: combatStats(u.key, g.tech).shield })));
}
function combatGroups(side, list) {
  return side.groups ? { defenderGroups: side.groups.map((g) => ({ id: g.id, owner: g.owner, ...survivors(list.filter((u) => u.groupId === g.id)), ...g.id?.startsWith("repair:") ? { repairUnits: list.filter((u) => u.groupId === g.id).map((u) => ({ hp: Math.max(0, u.hp), maxHp: u.maxHp })) } : {} })) } : {};
}
function survivors(list) {
  const fleet = {}, hulls = {};
  for (const u of list) if (u.hp > 1e-8) {
    fleet[u.key] = (fleet[u.key] || 0) + 1;
    if (u.hp < u.maxHp - 1e-8) (hulls[u.key] ??= []).push(u.hp / u.maxHp);
  }
  return { fleet, hulls };
}
function resolveBattleLegacy(attacker, defender, seed) {
  const a = combatSide(attacker), d = combatSide(defender), random = rng(seed), rounds = [];
  for (let i = 1; i <= 6; i++) {
    let fire2 = function(shooters, targets) {
      for (const u of shooters) if (u.attack) for (let shot = 0; shot < u.shots; shot++) {
        const target = targets[Math.floor(random() * targets.length)], hit = u.attack / u.shots * (1 + (u.bonus?.[target.key] || 0));
        damage.set(target, (damage.get(target) || 0) + hit);
      }
    };
    const aa2 = a.filter((u) => u.hp > 1e-8), dd2 = d.filter((u) => u.hp > 1e-8);
    if (!aa2.length || !dd2.length) break;
    const damage = /* @__PURE__ */ new Map();
    fire2(aa2, dd2);
    fire2(dd2, aa2);
    for (const [u, hit] of damage) {
      const shield = Math.min(u.shield, hit);
      u.shield -= shield;
      u.hp -= hit - shield;
    }
    rounds.push({ round: i, attacker: a.filter((u) => u.hp > 1e-8).length, defender: d.filter((u) => u.hp > 1e-8).length });
  }
  const aa = survivors(a), dd = survivors(d), ac = Object.values(aa.fleet).reduce((a2, b) => a2 + b, 0), dc = Object.values(dd.fleet).reduce((a2, b) => a2 + b, 0);
  const debris = vector([0, 0, 0]), defenseRepair = vector([0, 0, 0]);
  for (const u of [...a, ...d]) if (u.hp <= 1e-8) {
    const sh = SHIPS[u.key], out = debris, rate = 0.3;
    out.metal += sh.cost[0] * rate;
    out.crystal += sh.cost[1] * rate;
  }
  for (const k of RES) {
    debris[k] = Math.floor(debris[k]);
    defenseRepair[k] = Math.floor(defenseRepair[k]);
  }
  return { outcome: ac && !dc ? "attacker" : dc && !ac ? "defender" : "draw", attacker: aa, defender: dd, debris, defenseRepair, rounds, ...combatGroups(defender, d) };
}
var COMBAT_RULE_VERSION = 3;
function resolveBattle(attacker, defender, seed, version = COMBAT_RULE_VERSION) {
  if (version === 1) return resolveBattleLegacy(attacker, defender, seed);
  if (version !== 2 && version !== 3) throw Error("Unbekannte Kampfregelversion.");
  const a = combatSide(attacker), d = combatSide(defender), random = rng(String(seed)), rounds = [], logs = [];
  for (const [side, list] of [["A", a], ["D", d]]) {
    const counts = {};
    for (const u of list) {
      counts[u.key] = (counts[u.key] || 0) + 1;
      u.id = side + "-" + u.key + "-" + String(counts[u.key]).padStart(3, "0");
    }
  }
  const snapshot = (u) => ({ ...u.owner ? { owner: u.owner, groupId: u.groupId, commander: u.commander } : {}, id: u.id, key: u.key, side: u.id[0] === "A" ? "attacker" : "defender", category: SHIPS[u.key].category, name: SHIPS[u.key].name, definition: { ...COMBAT[u.key], cost: [...SHIPS[u.key].cost] }, hp: Math.max(0, u.hp), maxHp: u.maxHp, shield: u.shield, maxShield: u.maxShield ?? combatStats(u.key, u.id[0] === "A" ? attacker.tech : defender.tech).shield, attack: u.attack, shots: u.shots, bonus: { ...u.bonus } });
  const initial = [...a, ...d].map(snapshot);
  const total2 = (list) => ({ count: list.filter((u) => u.hp > 1e-8).length, hp: list.reduce((n, u) => n + Math.max(0, u.hp), 0), shield: list.filter((u) => u.hp > 1e-8).reduce((n, u) => n + u.shield, 0) });
  for (let round = version === 3 ? 0 : 1; round <= 6; round++) {
    let fire2 = function(shooters, targets) {
      const military = targets.filter((t) => SHIPS[t.key].category === "military");
      const allowed = military.length ? targets.filter((t) => ["military", "defense"].includes(SHIPS[t.key].category)) : targets;
      const defense = allowed.filter((t) => SHIPS[t.key].category === "defense"), pools = /* @__PURE__ */ new Map();
      for (const u of shooters) if (u.attack) {
        if (!pools.has(u.key)) {
          const bonusTargets = allowed.filter((t) => (u.bonus?.[t.key] || 0) > 0);
          pools.set(u.key, { pool: bonusTargets.length ? bonusTargets : military.length ? military : defense.length ? defense : allowed, reason: bonusTargets.length ? "bonus" : military.length ? "military" : defense.length ? "defense" : "civil" });
        }
        const { pool, reason } = pools.get(u.key);
        for (let shot = 1; shot <= u.shots; shot++) {
          const target = pool[Math.floor(random() * pool.length)], base = u.attack / u.shots, bonus = u.bonus?.[target.key] || 0, hit = base * (1 + bonus);
          shots.push({ shooter: u.id, target: target.id, shot, base, bonus, damage: hit, reason });
          damage.set(target, (damage.get(target) || 0) + hit);
        }
      }
    };
    const aa2 = a.filter((u) => u.hp > 1e-8), dd2 = d.filter((u) => u.hp > 1e-8);
    if (!aa2.length || !dd2.length) break;
    const opening = version === 3 && round === 0, platforms = opening ? dd2.filter((u) => SHIPS[u.key].category === "defense") : [];
    if (opening && !platforms.length) continue;
    const damage = /* @__PURE__ */ new Map(), shots = [];
    if (!opening) fire2(aa2, dd2);
    fire2(opening ? platforms : dd2, aa2);
    const impacts = [];
    for (const [u, hit] of damage) {
      const hpBefore = u.hp, shieldBefore = u.shield, shieldDamage = Math.min(u.shield, hit), hullDamage = Math.min(Math.max(0, u.hp), hit - shieldDamage);
      u.shield -= shieldDamage;
      u.hp -= hit - shieldDamage;
      impacts.push({ target: u.id, damage: hit, shieldDamage, hullDamage, overkill: Math.max(0, hit - shieldDamage - hpBefore), hpBefore, shieldBefore, hpAfter: Math.max(0, u.hp), shieldAfter: u.hp > 1e-8 ? u.shield : 0, destroyed: u.hp <= 1e-8 });
    }
    const after = { attacker: total2(a), defender: total2(d) };
    rounds.push({ round, attacker: after.attacker.count, defender: after.defender.count });
    logs.push({ round, shots, impacts, after });
  }
  const aa = survivors(a), dd = survivors(d), ac = Object.values(aa.fleet).reduce((n, v) => n + v, 0), dc = Object.values(dd.fleet).reduce((n, v) => n + v, 0), outcome = ac && !dc ? "attacker" : dc && !ac ? "defender" : "draw";
  const debris = vector([0, 0, 0]), defenseRepair = vector([0, 0, 0]);
  for (const u of [...a, ...d]) if (u.hp <= 1e-8) {
    const sh = SHIPS[u.key], out = debris, rate = 0.3;
    out.metal += sh.cost[0] * rate;
    out.crystal += sh.cost[1] * rate;
  }
  for (const k of RES) {
    debris[k] = Math.floor(debris[k]);
    defenseRepair[k] = Math.floor(defenseRepair[k]);
  }
  return { outcome, attacker: aa, defender: dd, debris, defenseRepair, rounds, ...combatGroups(defender, d), trace: { ...defender.groups ? { defenderGroups: structuredClone(defender.groups) } : {}, version: 1, ruleVersion: version, seed: String(seed), tech: { attacker: { ...attacker.tech }, defender: { ...defender.tech } }, shieldFactors: { attacker: attacker.shieldFactor ?? 1, defender: defender.shieldFactor ?? 1 }, initial, final: [...a, ...d].map(snapshot), rounds: logs } };
}
function loadPlunder(stock, depot, bunker, capacity2, debris, victory) {
  const loot = vector([0, 0, 0]), salvage = vector([0, 0, 0]);
  let room = Math.max(0, capacity2);
  if (victory) for (const k of RES) {
    loot[k] = Math.min(room, Math.floor(Math.max(0, stock[k] + depot[k] - bunker) * 0.25));
    room -= loot[k];
  }
  if (victory) for (const k of RES) {
    salvage[k] = Math.min(room, debris[k]);
    room -= salvage[k];
  }
  return { loot, salvage, cargo: vector(RES.map((k) => loot[k] + salvage[k])) };
}

// src/engine.js
function planet(id, name, meta = {}) {
  return { id, name, coord: meta.coord || "1:1:4", kind: meta.kind || "Heimatwelt", mult: meta.mult || [1, 1, 1], color: meta.color || "#53add3", ocean: meta.ocean ?? true, energy: meta.energy || 1, distance: meta.distance || 0, reserves: vector([0, 0, 0]), resources: vector([0, 0, 0]), depot: vector([0, 0, 0]), buildings: Object.fromEntries(Object.keys(BUILDINGS).map((k) => [k, 0])), ships: Object.fromEntries(Object.keys(SHIPS).map((k) => [k, 0])), build: null, shipjob: null, orbitaljob: null, orbitalqueue: [] };
}
function newGame(name = "Commander", now = Date.now()) {
  const home = planet("home", "Aurelia");
  home.resources = vector([3e3, 2200, 1e3]);
  Object.assign(home.buildings, { metal: 1, crystal: 1, fuel: 1, solar: 3 });
  return { version: 1, name: name.trim().slice(0, 30) || "Commander", time: now, created: now, seq: 0, active: "home", planets: [home], tech: Object.fromEntries(Object.keys(TECHS).map((k) => [k, 0])), research: null, discovered: [], missions: [], reports: [] };
}
function getPlanet(s, id) {
  const p = s.planets.find((p2) => p2.id === id);
  if (!p) throw Error("Planet nicht gefunden.");
  return p;
}
function capacity(p) {
  return 4e3 * Math.pow(1.7, p.buildings.warehouse);
}
function shipyardTimeFactor(level) {
  return Math.pow(0.92, Math.max(0, level - 1));
}
function energyDemand(p) {
  const consumers = { metal: p.buildings.metal * 15, crystal: p.buildings.crystal * 18, fuel: p.buildings.fuel * 20, shipyard: Math.ceil(10 * Math.pow(p.buildings.shipyard, 1.5)), orbital: Math.ceil(10 * Math.pow(p.buildings.orbital || 0, 1.5)), repairDock: Math.ceil(10 * Math.pow(p.buildings.repairDock || 0, 1.5)) };
  return Object.fromEntries(Object.entries(consumers).map(([key, value2]) => [key, value2 * p.energy]));
}
function stats(s, p) {
  const supply = (45 * Math.pow(p.buildings.solar || 0, powerExponent(p.kind, "solar")) + 180 * Math.pow(p.buildings.tidal || 0, powerExponent(p.kind, "tidal"))) * (1 + s.tech.energy * 0.1);
  const consumers = energyDemand(p), demand = Object.values(consumers).reduce((a, b) => a + b, 0);
  const ratio = demand ? Math.min(1, supply / demand) : 1;
  const rates = vector(RES.map((k, i) => p.buildings[k] ? [300, 220, 140][i] * p.buildings[k] * Math.pow(1.12, p.buildings[k] - 1) * p.mult[i] * ratio : 0));
  return { supply, demand, consumers, ratio, rates, cap: capacity(p) };
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
function unloadCargo(p, cargo, order = null) {
  settle(p);
  const cap = capacity(p), out = vector([0, 0, 0]);
  for (const k of RES) {
    const wanted = !order || order[k] === "max" ? cargo[k] : Math.min(cargo[k], order[k]);
    out[k] = Math.min(wanted, Math.floor(Math.max(0, cap - p.resources[k])));
    p.resources[k] += out[k];
    cargo[k] -= out[k];
  }
  return out;
}
function cargoPresent(cargo) {
  return RES.some((k) => cargo[k] > 0);
}
function nextCargoSpaceEvent(s, p) {
  return Math.min(p.build?.key === "warehouse" ? p.build.end : Infinity, ...s.missions.filter((m) => !m.paused && !m.awaitingUnload).map((m) => m.due));
}
function waitingCargo(s) {
  for (const m of [...s.missions]) if (m.paused && m.type === "route") {
    const out = unloadCargo(getPlanet(s, m.home), m.cargo);
    if (cargoPresent(out)) routeActivity(s, m, m.home, out, vector([0, 0, 0]), "unload");
  } else if (m.awaitingUnload) {
    const p = getPlanet(s, m.awaitingUnload), out = unloadCargo(p, m.cargo);
    if (m.type === "route" && cargoPresent(out)) routeActivity(s, m, p.id, out, vector([0, 0, 0]), "unload");
    m.due = s.time;
    if (!cargoPresent(m.cargo)) parkFleet(s, m, p.id, m.finishTitle || "Flotte entladen");
  }
}
function forecastShipJobs(s) {
  for (const p of s.planets) for (const kind of ["ship", "orbital"]) {
    const j = p[kind + "job"];
    if (!j) continue;
    if (j.workRemaining === void 0) {
      j.orderEnd = j.end;
      j.workTotal = j.end - j.start;
      j.workRemaining = Math.max(0, j.end - s.time);
    }
    const ratio = stats(s, p).ratio;
    j.paused = ratio === 0 && j.workRemaining > 0;
    j.end = s.time + Math.max(1, Math.ceil(j.workRemaining / (ratio || 1)));
    let work = j.workRemaining;
    for (const queued of p[kind === "ship" ? "shipqueue" : "orbitalqueue"] || []) {
      work += queued.workTotal;
      queued.paused = ratio === 0;
      queued.end = s.time + Math.max(1, Math.ceil(work / (ratio || 1)));
    }
  }
}
var SHIP_QUEUE_LIMIT = 20;
var SHIP_QUEUE_LEGACY_LIMIT = 50;
function shipQueueCapacity(p) {
  return Math.min(SHIP_QUEUE_LIMIT, Math.max(0, p.buildings.shipyard));
}
function shipQueueFullReason(p) {
  return shipOrders(p).length >= shipQueueCapacity(p) ? shipQueueCapacity(p) < SHIP_QUEUE_LIMIT ? `Alle Auftragspl\xE4tze belegt. Mehr Pl\xE4tze ab Werftstufe ${shipQueueCapacity(p) + 1}.` : `Alle ${SHIP_QUEUE_LIMIT} Auftragspl\xE4tze belegt. Maximale Warteschlangengr\xF6\xDFe erreicht.` : "";
}
function shipOrders(p) {
  return [p.shipjob, ...p.shipqueue || []].filter(Boolean);
}
function orbitalOrders(p) {
  return [p.orbitaljob, ...p.orbitalqueue || []].filter(Boolean);
}
function orbitalQueueCapacity(p) {
  return Math.min(SHIP_QUEUE_LIMIT, Math.max(0, p.buildings.orbital || 0));
}
function orbitalQueueFullReason(p) {
  const cap = orbitalQueueCapacity(p);
  return orbitalOrders(p).length >= cap ? `Alle ${cap} Auftragspl\xE4tze der Orbitalwerft belegt.` : "";
}
function nextShipOrder(p) {
  p.shipjob = (p.shipqueue || []).shift() || null;
}
function nextOrbitalOrder(p) {
  p.orbitaljob = (p.orbitalqueue || []).shift() || null;
}
function produce(s, ms2) {
  for (const p of s.planets) {
    settle(p);
    const z = stats(s, p);
    produceRepair(p, ms2, z.ratio);
    for (const k of RES) p.resources[k] = Math.min(z.cap, p.resources[k] + z.rates[k] * ms2 / 36e5);
    for (const kind of ["ship", "orbital"]) if (p[kind + "job"]) p[kind + "job"].workRemaining = Math.max(0, p[kind + "job"].workRemaining - ms2 * z.ratio);
  }
}
function report(s, title, body) {
  s.reports.unshift({ id: ++s.seq, time: s.time, title, body });
  s.reports = s.reports.slice(0, 60);
}
function need(s, p, req) {
  if (!req) return "";
  if (req.tech && s.tech[req.tech] < req.level) return `Ben\xF6tigt ${TECHS[req.tech].name} Stufe ${req.level}.`;
  if (req.building && p.buildings[req.building] < req.level) return `Ben\xF6tigt ${BUILDINGS[req.building].name} Stufe ${req.level}.`;
  return "";
}
var DEMOLITION_REFUND = 0.2;
var DEMOLITION_TIME = 0.25;
function buildingLevelCost(key, index) {
  const b = BUILDINGS[key];
  if (!b) throw Error("Unbekanntes Geb\xE4ude.");
  return costAt(b, index);
}
function buildingLevelTime(s, p, key, index) {
  const b = BUILDINGS[key];
  if (!b) throw Error("Unbekanntes Geb\xE4ude.");
  return Math.ceil(b.time * Math.pow(1.35, index) * Math.pow(0.95, s.tech.engineering) * Math.pow(0.92, p.buildings.robotics) * 1e3);
}
function buildInfo(s, p, key) {
  const b = BUILDINGS[key];
  if (!b) throw Error("Unbekanntes Geb\xE4ude.");
  const l = p.buildings[key], cost = buildingLevelCost(key, l);
  return { cost, ms: buildingLevelTime(s, p, key, l), reason: (key === "repairDock" && s.tech.engineering < 1 ? "Ben\xF6tigt Bautechnik Stufe 1." : "") || need(s, p, b.requires) || (b.ocean && !p.ocean ? "Ben\xF6tigt einen Ozeanplaneten." : "") || (l >= (key === "bunker" ? 4 : 30) ? "Maximale Geb\xE4udestufe erreicht." : "") };
}
function demolishInfo(s, p, key) {
  if (!Object.hasOwn(BUILDINGS, key)) throw Error("Unbekanntes Geb\xE4ude.");
  const level = p.buildings[key] || 0;
  if (level < 1) return { reason: "Keine Geb\xE4udestufe vorhanden." };
  const target = level - 1, historical = p.buildHistory?.[key]?.[level];
  const originalCost = historical?.cost || buildingLevelCost(key, target);
  const originalMs = historical?.ms || buildingLevelTime(s, p, key, target);
  const refund = vector(RES.map((k) => Math.floor(originalCost[k] * DEMOLITION_REFUND)));
  const ms2 = Math.max(1, Math.ceil(originalMs * DEMOLITION_TIME));
  let reason = p.build ? "Auf diesem Planeten l\xE4uft bereits ein Bauauftrag." : "";
  if (!reason && key === "lab" && target === 0 && p.buildings.shipyard > 0) reason = "Die Schiffswerft ben\xF6tigt Forschungslabor Stufe 1.";
  if (!reason && key === "lab" && s.research?.planet === p.id && target < TECHS[s.research.key].lab) reason = "Eine laufende Forschung ben\xF6tigt dieses Labor.";
  if (!reason && key === "shipyard" && target < 2 && p.buildings.repairDock > 0) reason = "Das Reparaturdock ben\xF6tigt Schiffswerft Stufe 2.";
  if (!reason && key === "shipyard" && [p.shipjob, ...p.shipqueue || []].filter(Boolean).some((j) => target < (SHIPS[j.key]?.shipyard || 1))) reason = "Laufende Schiffsbauauftr\xE4ge ben\xF6tigen diese Werftstufe.";
  if (!reason && key === "orbital" && [p.orbitaljob, ...p.orbitalqueue || []].filter(Boolean).some((j) => target < (SHIPS[j.key]?.shipyard || 1))) reason = "Laufende Plattformauftr\xE4ge ben\xF6tigen diese Orbitalwerftstufe.";
  if (!reason && key === "repairDock" && target === 0 && (p.repairQueue || []).length) reason = "Im Reparaturdock befinden sich noch Einheiten.";
  return { key, level, target, originalCost, originalMs, refund, ms: ms2, reason };
}
function researchInfo(s, p, key) {
  const t = TECHS[key];
  if (!t) throw Error("Unbekannte Forschung.");
  const l = s.tech[key];
  return { cost: costAt(t, l), ms: Math.ceil(t.time * Math.pow(1.5, l) * Math.pow(key === "military" ? 1.5 : 1, Math.max(0, l - 4)) / Math.max(1, 1 + (p.buildings.lab - 1) * 0.15) * 1e3), reason: (key === "colonization" && l >= 3 && l < t.max ? need(s, p, { tech: ["ramjet", "impulse", "hyperspace"][l - 3], level: 1 }) : "") || (p.buildings.lab < t.lab ? `Ben\xF6tigt Forschungslabor Stufe ${t.lab} auf diesem Planeten.` : need(s, p, t.requires) || (l >= t.max ? "Maximale Forschungsstufe erreicht." : "")) };
}
function pay(p, c) {
  settle(p);
  for (const k of RES) if (!Number.isFinite(c[k]) || c[k] < 0 || p.resources[k] + 1e-8 < c[k]) throw Error("Nicht gen\xFCgend lokale Ressourcen.");
  for (const k of RES) p.resources[k] = Math.max(0, p.resources[k] - c[k]);
  settle(p);
}
function shipRefund(job) {
  if (!job) return { resources: vector([0, 0, 0]), salvage: vector([0, 0, 0]), legacyDefense: false };
  if (job.payment) return { resources: { ...job.payment.resources }, salvage: { ...job.payment.salvage }, legacyDefense: false };
  const legacyDefense = SHIPS[job.key].category === "defense", legacyCosts = { flak: [160, 80, 20], laser: [450, 300, 70], rail: [1400, 1e3, 280], plasma: [4e3, 2800, 900] }, cost = legacyDefense ? legacyCosts[job.key] : SHIPS[job.key].cost, gross = vector(cost.map((v) => v * job.count));
  return { resources: legacyDefense ? vector([0, 0, gross.fuel]) : gross, salvage: legacyDefense ? vector([gross.metal, gross.crystal, 0]) : vector([0, 0, 0]), legacyDefense };
}
function shipInfo(s, p, key, count = 1) {
  const sh = SHIPS[key];
  if (!sh) throw Error("Unbekanntes Schiff.");
  const defense = sh.category === "defense", yard = defense ? p.buildings.orbital || 0 : p.buildings.shipyard, gross = vector(sh.cost.map((v) => v * count));
  return { cost: gross, salvage: vector([0, 0, 0]), ms: Math.ceil(sh.time * count * 1e3 * shipyardTimeFactor(yard) * (defense ? Math.pow(0.92, p.buildings.robotics || 0) : 1)), ratio: stats(s, p).ratio, reason: yard < (sh.shipyard || 1) ? `Ben\xF6tigt ${defense ? "Orbitalwerft" : "Schiffswerft"} Stufe ${sh.shipyard || 1}.` : s.tech[sh.tech] < (sh.techLevel || 1) ? `Ben\xF6tigt ${TECHS[sh.tech].name} Stufe ${sh.techLevel || 1}.` : (s.tech[sh.engine || "drive"] || 0) < (sh.engineLevel || 0) ? `Ben\xF6tigt ${TECHS[sh.engine].name} Stufe ${sh.engineLevel}.` : "" };
}
function cargoCapacity(s, n = 1, ship = "transport") {
  return Math.floor((SHIPS[ship]?.cargo || 0) * (1 + s.tech.logistics * 0.15)) * n;
}
function flightInfo(s, from, to, n = 1, probe = false, ship = "transport") {
  if (from.system || to.system) {
    const f = sharedFlight(s, from, to, n, probe ? "probe" : ship);
    return { ...f, fuel: f.fuel * 2 };
  }
  const def = SHIPS[probe ? "probe" : ship];
  if (!def) throw Error("Unbekanntes Schiff.");
  const remote = (from.system || "tutorial") !== (to.system || "tutorial");
  const engine = shipFlightEngine(s, probe ? "probe" : ship, remote);
  const anchor = s.galaxy || { x: 500, y: 960 };
  const a = from.system ? from : anchor, b = to.system ? to : anchor;
  const dist = remote ? Math.max(1, Math.hypot(a.x - b.x, a.y - b.y) / 40) : Math.max(1, Math.abs((from.distance || 0) - (to.distance || 0)));
  return { ms: Math.ceil((10 + dist * 8) * FLIGHT_BASE_SCALE * 1e3 / ((1 + (s.tech[engine] || 0) * ENGINE_SPEED_BONUS + (probe ? s.tech.scout * 0.1 : 0)) * def.speed)), fuel: Math.ceil(def.fuel * 2 * dist * n / (1 + (s.tech[engine] || 0) * 0.12)) };
}
function legInfo(s, from, to, n = 1, ship = "transport") {
  const f = flightInfo(s, from, to, n, ship === "probe", ship);
  return { ...f, fuel: Math.ceil(f.fuel / 2) };
}
function routeLegInfo(s, from, to, n = 1, ship = "transport") {
  const f = legInfo(s, from, to, n, ship);
  return { ms: Math.ceil(f.ms * ROUTE_ECONOMY.time), fuel: Math.ceil(f.fuel * ROUTE_ECONOMY.fuel) };
}
function fleetManifest(m) {
  return m.fleet || { [m.ship]: m.count };
}
function checkedFleet(fleet) {
  if (!fleet || typeof fleet !== "object" || Array.isArray(fleet) || !Object.keys(fleet).length || Object.entries(fleet).some(([k, n]) => !isFreighter(k) || !Number.isSafeInteger(n) || n < 1)) throw Error("W\xE4hle verf\xFCgbare Frachter in positiven ganzen Zahlen.");
  return { ...fleet };
}
function missionFleet(fleet, military = false) {
  if (!fleet || typeof fleet !== "object" || Array.isArray(fleet) || !Object.keys(fleet).length || Object.entries(fleet).some(([k, n]) => !(isFreighter(k) || military && ["military", "civil"].includes(SHIPS[k]?.category)) || !Number.isSafeInteger(n) || n < 1)) throw Error("W\xE4hle verf\xFCgbare Schiffe in positiven ganzen Zahlen.");
  return { ...fleet };
}
function fleetLegInfo(s, from, to, fleet) {
  let ms2 = 0, fuel = 0, slowest = "";
  for (const [k, n] of Object.entries(missionFleet(fleet, true))) {
    if ((from.system || "tutorial") !== (to.system || "tutorial") && !canFlyInterstellar(s, k)) throw Error("F\xFCr " + SHIPS[k].name + " fehlt der Galaxieantrieb.");
    const f = legInfo(s, from, to, n, k);
    if (f.ms > ms2) {
      ms2 = f.ms;
      slowest = k;
    }
    fuel += f.fuel;
  }
  return { ms: ms2, fuel, slowest, capacity: fleetCapacity(s, fleet) };
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
  return { ms: ms2, fuel, slowest };
}
function routeInfo(s, stops, count, ship = "transport") {
  const fleet = typeof count === "object" ? checkedFleet(count) : checkedFleet({ [ship]: count });
  let fuel = 0, ms2 = 0, slowest = "";
  for (let i = 0; i < stops.length; i++) {
    const f = mixedRouteLeg(s, getPlanet(s, stops[i].planet), getPlanet(s, stops[(i + 1) % stops.length].planet), fleet);
    fuel += f.fuel;
    ms2 += f.ms;
    slowest = f.slowest;
  }
  return { fuel, ms: ms2, slowest, capacity: fleetCapacity(s, fleet) };
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
  m.fleet = { ...fleet };
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
function routeStats(s, m) {
  return m.stats ??= { since: s.time, roundsAtStart: m.rounds, stops: 0, loaded: vector([0, 0, 0]), delivered: vector([0, 0, 0]), fuelPaid: 0, last: null };
}
var routeSum = (a, b) => Math.min(Number.MAX_SAFE_INTEGER, a + b);
function routeActivity(s, m, planet2, delivered, loaded, kind = "stop", visit = false) {
  const z = routeStats(s, m), previous = z.last;
  for (const k of RES) {
    z.delivered[k] = routeSum(z.delivered[k], delivered[k]);
    z.loaded[k] = routeSum(z.loaded[k], loaded[k]);
  }
  if (visit) z.stops = routeSum(z.stops, 1);
  const same = previous?.at === s.time && previous.planet === planet2;
  z.last = { at: s.time, planet: planet2, kind: kind === "stop" && same && previous.kind === "round" ? "round" : kind, delivered: vector(RES.map((k) => delivered[k] + (same ? previous.delivered[k] : 0))), loaded: vector(RES.map((k) => loaded[k] + (same ? previous.loaded[k] : 0))) };
  s.seq++;
}
function stopCargo(s, m, stop, kind = "stop", visit = true) {
  const p = getPlanet(s, stop.planet), out = unloadCargo(p, m.cargo, stop.unload), before = { ...m.cargo };
  loadCargo(s, p, m.cargo, stop.load, m.count, m.ship, fleetManifest(m));
  routeActivity(s, m, p.id, out, vector(RES.map((k) => m.cargo[k] - before[k])), kind, visit);
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
  const p = getPlanet(s, id), out = unloadCargo(p, m.cargo);
  if (m.type === "route" && cargoPresent(out)) routeActivity(s, m, id, out, vector([0, 0, 0]), "unload");
  if (cargoPresent(m.cargo)) {
    if (!m.awaitingUnload) report(s, "Flotte wartet auf Lagerplatz", `${p.name}: Restladung bleibt im Frachter. Schiffe bleiben gebunden.`);
    m.awaitingUnload = id;
    m.finishTitle = title;
    m.due = s.time;
    return;
  }
  for (const [k, n] of Object.entries(fleetManifest(m))) p.ships[k] += n;
  putHulls(p, m.hulls);
  p.shieldUntil = Math.max(p.shieldUntil || 0, m.shieldUntil || 0);
  s.missions = s.missions.filter((x) => x.id !== m.id);
  const summary = m.type === "route" && m.stats ? ` ${m.rounds} Runden insgesamt. Seit Statistikbeginn (${new Date(m.stats.since).toISOString()}) geliefert M/K/T: ${RES.map((k) => Math.floor(m.stats.delivered[k])).join("/")}; geladen M/K/T: ${RES.map((k) => Math.floor(m.stats.loaded[k])).join("/")}; ${m.stats.stops} Stopps; Treibstoff bezahlt: ${m.stats.fuelPaid}.` : "";
  report(s, title, `${Object.entries(fleetManifest(m)).map(([k, n]) => n + " \xD7 " + SHIPS[k].name).join(", ")} im Orbit von ${p.name}. Ladung wurde eingelagert.${summary}`);
}
function applyRouteEdit(s, m) {
  if (!m.pending) return;
  const next = m.pending, p = getPlanet(s, m.home), old = fleetManifest(m);
  if (RES.reduce((a, k) => a + m.cargo[k], 0) > fleetCapacity(s, next.fleet)) return false;
  if (Object.entries(next.fleet).some(([k, n]) => p.ships[k] + (old[k] || 0) < n)) return false;
  for (const [k, n] of Object.entries(old)) p.ships[k] += n;
  putHulls(p, m.hulls);
  for (const [k, n] of Object.entries(next.fleet)) p.ships[k] -= n;
  setFleet(m, next.fleet);
  m.hulls = takeHulls(p, next.fleet);
  m.name = next.name;
  m.stops = structuredClone(next.stops);
  m.repeat = next.repeat;
  if (m.paused) {
    m.index = 0;
    m.to = m.home;
    m.from = m.stops.at(-1).planet;
  }
  delete m.pending;
  report(s, "Routen\xE4nderung aktiviert", `${m.name}: Flotte und Stopps am Startplaneten aktualisiert.`);
  return true;
}
function pauseRoute(s, m, reason = "Manuell pausiert") {
  m.paused = true;
  m.pauseRequested = false;
  m.pauseReason = reason;
  report(s, "Handelsroute pausiert", `${m.name}: ${reason}. Schiffe bleiben an die Route gebunden.`);
}
function resumeRoute(s, m, continuing = false) {
  const p = getPlanet(s, m.home), f = routeInfo(s, m.stops, fleetManifest(m));
  if (p.resources.fuel - (p.reserves?.fuel || 0) < f.fuel) throw Error("Treibstoff reicht nicht f\xFCr die Runde einschlie\xDFlich Reserve.");
  pay(p, vector([0, 0, f.fuel]));
  const z = routeStats(s, m);
  z.fuelPaid = routeSum(z.fuelPaid, f.fuel);
  m.paused = false;
  m.pauseRequested = false;
  delete m.pauseReason;
  stopCargo(s, m, m.stops[0], continuing ? "round" : "resumed", false);
  leaveRoute(s, m, 1);
}
function routeArrival(s, m) {
  if (m.index === 0) {
    const out = unloadCargo(getPlanet(s, m.home), m.cargo);
    routeActivity(s, m, m.home, out, vector([0, 0, 0]), "round", true);
    m.rounds++;
    if (m.pending && !m.stopping && applyRouteEdit(s, m) === false) report(s, "Routen\xE4nderung wartet", `${m.name}: Am Startplaneten fehlen Schiffe; bisherige Route bleibt aktiv.`);
    if (m.stopping) {
      parkFleet(s, m, m.home, "Handelsroute beendet");
      return;
    }
    if (m.pauseRequested) {
      pauseRoute(s, m);
      return;
    }
    if (!m.repeat) {
      parkFleet(s, m, m.home, "Handelsroute beendet");
      return;
    }
    const p = getPlanet(s, m.home), f = routeInfo(s, m.stops, fleetManifest(m));
    if (p.resources.fuel - (p.reserves?.fuel || 0) < f.fuel) {
      pauseRoute(s, m, "Treibstoff fehlt");
      return;
    }
    resumeRoute(s, m, true);
  } else {
    stopCargo(s, m, m.stops[m.index]);
    leaveRoute(s, m, (m.index + 1) % m.stops.length);
  }
}
function advance(s, now, collectDebris) {
  if (!Number.isFinite(now)) throw Error("Ung\xFCltige Zeit.");
  if (!collectDebris) now = Math.min(now, ...s.missions.filter((m) => m.type === "salvage" && m.phase === "outbound").map((m) => m.due - 1));
  now = Math.max(now, s.time);
  for (const m of s.missions) if (m.type === "route") routeStats(s, m);
  waitingCargo(s);
  let guard = 0;
  while (true) {
    forecastShipJobs(s);
    const times = [];
    for (const p of s.planets) {
      times.push(forecastRepair(p, s.time, stats(s, p).ratio));
      if (p.build) times.push(p.build.end);
      for (const kind of ["ship", "orbital"]) if (p[kind + "job"] && !p[kind + "job"].paused) times.push(p[kind + "job"].workRemaining === 0 ? s.time : p[kind + "job"].end);
    }
    if (s.research) times.push(s.research.end);
    for (const m of s.missions) if (!m.paused && !m.awaitingUnload) times.push(m.due);
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
      s.seq += finishRepair(p, (title, body) => report(s, title, body));
      if (p.build && p.build.end <= s.time) {
        const j = p.build;
        p.buildings[j.key] = j.level;
        p.build = null;
        if (j.kind === "demolish") {
          const cap = capacity(p);
          for (const k of RES) {
            const excess = Math.max(0, p.resources[k] - cap);
            p.resources[k] -= excess;
            p.depot[k] += excess;
          }
          if (p.buildHistory?.[j.key]) delete p.buildHistory[j.key][j.level + 1];
          deliver(p, j.refund);
          report(s, "R\xFCckbau abgeschlossen", `${p.name}: ${BUILDINGS[j.key].name} auf Stufe ${j.level} zur\xFCckgebaut. 20 % Material erstattet.`);
        } else {
          if (j.paid && j.originalMs) {
            p.buildHistory ??= {};
            p.buildHistory[j.key] ??= {};
            p.buildHistory[j.key][j.level] = { cost: j.paid, ms: j.originalMs };
          }
          report(s, "Ausbau abgeschlossen", `${p.name}: ${BUILDINGS[j.key].name}, Stufe ${j.level}.`);
        }
      }
      if (p.shipjob && p.shipjob.workRemaining === 0) {
        const j = p.shipjob;
        p.ships[j.key] += j.count;
        nextShipOrder(p);
        report(s, "Schiffbau abgeschlossen", `${p.name}: ${j.count} \xD7 ${SHIPS[j.key].name}.`);
      }
      if (p.orbitaljob && p.orbitaljob.workRemaining === 0) {
        const j = p.orbitaljob;
        p.ships[j.key] += j.count;
        nextOrbitalOrder(p);
        report(s, "Orbitalplattform fertiggestellt", `${p.name}: ${j.count} \xD7 ${SHIPS[j.key].name}.`);
      }
    }
    for (const m of [...s.missions].sort((a, b) => a.id - b.id)) if (!m.paused && !m.awaitingUnload && m.due <= s.time) {
      if (m.type === "route") {
        routeArrival(s, m);
      } else if (m.type === "station") {
        parkFleet(s, m, m.to, "Flotte stationiert");
      } else if (m.type === "salvage" && m.phase === "outbound") {
        if (!collectDebris) throw Error("Tr\xFCmmerbergung ben\xF6tigt den Spielserver.");
        collectDebris(s, m);
        m.phase = "return";
        m.due = s.time + m.duration;
        report(s, "Tr\xFCmmer geborgen", `${getPlanet(s, m.to).name}: ${Math.floor(m.cargo.metal)} Metall und ${Math.floor(m.cargo.crystal)} Kristall auf dem R\xFCckweg.`);
      } else if (m.type === "collect" && m.phase === "outbound") {
        loadCargo(s, getPlanet(s, m.to), m.cargo, m.order, m.count, m.ship, m.fleet);
        m.phase = "return";
        m.due = s.time + m.duration;
        report(s, "Material abgeholt", `${getPlanet(s, m.to).name}: Ladung auf dem R\xFCckweg.`);
      } else if (m.phase === "return") {
        parkFleet(s, m, m.from, "Flotte zur\xFCckgekehrt");
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
        const out = unloadCargo(getPlanet(s, m.to), m.cargo);
        report(s, "Transport angekommen", `${getPlanet(s, m.from).name} \u2192 ${getPlanet(s, m.to).name}: ${RES.map((k) => `${Math.round(out[k])} ${k === "metal" ? "Metall" : k === "crystal" ? "Kristall" : "Treibstoff"}`).join(", ")} abgeladen.${cargoPresent(m.cargo) ? " Restladung kehrt im Frachter zur\xFCck." : ""}`);
        m.phase = "return";
        m.due = s.time + m.duration;
      }
    }
    waitingCargo(s);
  }
  produce(s, now - s.time);
  s.time = now;
  waitingCargo(s);
  for (const m of s.missions) if (m.paused || m.awaitingUnload) m.due = now;
  forecastShipJobs(s);
  for (const p of s.planets) forecastRepair(p, s.time, stats(s, p).ratio);
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
    p.build = { key: action.key, level: p.buildings[action.key] + 1, start: n.time, end: n.time + info.ms, paid: info.cost, originalMs: info.ms };
  } else if (action.type === "demolish") {
    const info = demolishInfo(n, p, action.key);
    if (info.reason) throw Error(info.reason);
    if (!Number.isSafeInteger(info.ms) || n.time + info.ms > 864e13) throw Error("R\xFCckbaudauer ung\xFCltig.");
    p.build = { kind: "demolish", key: action.key, level: info.target, start: n.time, end: n.time + info.ms, refund: info.refund, originalMs: info.originalMs };
  } else if (action.type === "research") {
    const info = researchInfo(n, p, action.key);
    if (info.reason) throw Error(info.reason);
    if (n.research) throw Error("Es l\xE4uft bereits eine imperiumsweite Forschung.");
    pay(p, info.cost);
    n.research = { key: action.key, level: n.tech[action.key] + 1, start: n.time, end: n.time + info.ms, planet: p.id };
  } else if (action.type === "ship") {
    const count = action.count;
    if (!Number.isSafeInteger(count) || count < 1) throw Error("W\xE4hle eine positive ganze Anzahl Schiffe.");
    const info = shipInfo(n, p, action.key, count);
    if (info.reason) throw Error(info.reason);
    const defense = SHIPS[action.key]?.category === "defense", full = defense ? orbitalQueueFullReason(p) : shipQueueFullReason(p);
    if (full) throw Error(full);
    if (!Number.isSafeInteger(info.ms) || n.time + info.ms > 864e13 || RES.some((k) => !Number.isSafeInteger(info.cost[k]) || info.cost[k] > 1e12)) throw Error("Dieser Bauauftrag ist zu gro\xDF.");
    if (p.defenseSalvage) for (const k of RES) p.defenseSalvage[k] -= info.salvage[k];
    pay(p, info.cost);
    const job = { id: ++n.seq, key: action.key, count, start: n.time, end: n.time + info.ms, workTotal: info.ms, workRemaining: info.ms, payment: { resources: { ...info.cost }, salvage: { ...info.salvage } } };
    if (defense) {
      if (p.orbitaljob) {
        p.orbitalqueue ??= [];
        p.orbitalqueue.push(job);
      } else p.orbitaljob = job;
    } else if (p.shipjob) {
      p.shipqueue ??= [];
      p.shipqueue.push(job);
    } else p.shipjob = job;
  } else if (action.type === "cancel-ship") {
    const o = action.order, j = o?.id !== void 0 ? [...shipOrders(p), ...orbitalOrders(p)].find((j2) => j2.id === o.id) : p.shipjob;
    if (!j) throw Error("Dieser Schiffsbauauftrag ist bereits abgeschlossen oder abgebrochen. Der Bauauftrag hat sich ge\xE4ndert. Bitte die Ansicht aktualisieren.");
    if (!o || ["key", "count", "start"].some((k) => o[k] !== j[k]) || (j.id !== void 0 ? o.id !== j.id : o.end !== (j.orderEnd ?? j.end))) throw Error("Der Bauauftrag hat sich ge\xE4ndert. Bitte die Ansicht aktualisieren.");
    const refund = shipRefund(j);
    for (const k of RES) {
      p.depot[k] += refund.resources[k];
      p.defenseSalvage ??= vector([0, 0, 0]);
      p.defenseSalvage[k] += refund.salvage[k];
    }
    settle(p);
    if (j === p.shipjob) nextShipOrder(p);
    else if (j === p.orbitaljob) nextOrbitalOrder(p);
    else if ((p.orbitalqueue || []).includes(j)) p.orbitalqueue = p.orbitalqueue.filter((q) => q !== j);
    else p.shipqueue = p.shipqueue.filter((q) => q !== j);
    report(n, "Schiffsbau abgebrochen", p.name + ": " + j.count + " \xD7 " + SHIPS[j.key].name + ". Rohstoffe zur\xFCckerstattet; \xDCbersch\xFCsse bleiben im Lieferdepot." + (refund.legacyDefense ? " Metall und Kristall des alten Verteidigungsauftrags bleiben als Reparaturmaterial verf\xFCgbar." : ""));
  } else if (action.type === "probe" || action.type === "colony" || action.type === "transport") {
    const ship = action.type === "probe" ? "probe" : action.type === "colony" ? "colony" : "transport";
    const count = ship === "transport" ? action.count : 1;
    if (!Number.isSafeInteger(count) || count < 1) throw Error("Ung\xFCltige Flottengr\xF6\xDFe.");
    if (p.ships[ship] < count) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe.");
    let dest, cargo = vector([0, 0, 0]);
    if (ship === "transport") {
      dest = getPlanet(n, action.to);
      if ((p.system || "tutorial") !== (dest.system || "tutorial")) throw Error("Interstellare Fl\xFCge ben\xF6tigen einen fortgeschrittenen Frachter.");
      if (dest.id === p.id) throw Error("W\xE4hle einen anderen Zielplaneten.");
      cargo = action.cargo;
      if (!cargo || RES.some((k) => !Number.isSafeInteger(cargo[k]) || cargo[k] < 0)) throw Error("Ladung muss aus nichtnegativen ganzen Zahlen bestehen.");
      const total2 = RES.reduce((sum, k) => sum + cargo[k], 0);
      if (!total2) throw Error("W\xE4hle eine Ladung.");
      if (total2 > cargoCapacity(n, count)) throw Error("Die Ladung \xFCbersteigt den Laderaum.");
    } else {
      if (p.system) throw Error("Tutorial-Sonden und Kolonieschiffe starten im Tutorial-System. W\xE4hle dort eine Heimatwelt.");
      dest = TARGETS.find((t) => t.id === action.to);
      if (!dest) throw Error("Unbekanntes Erkundungsziel.");
      if (ship === "colony") {
        if (!n.discovered.includes(dest.id)) throw Error("Zuerst mit einer Sonde erkunden.");
        if (n.planets.some((p2) => p2.id === dest.id) || n.missions.some((m) => m.type === "colony" && m.to === dest.id)) throw Error("Planet bereits besiedelt oder reserviert.");
        if (n.planets.length - 1 + n.missions.filter((m) => m.type === "colony").length >= n.tech.colonization) throw Error("Erforsche eine weitere Kolonisierungsstufe.");
        cargo = vector([350, 250, 100]);
      }
    }
    const f = flightInfo(n, p, dest, count, ship === "probe", ship);
    const cost = { ...cargo, fuel: cargo.fuel + f.fuel };
    pay(p, cost);
    p.ships[ship] -= count;
    const hulls = takeHulls(p, { [ship]: count });
    n.missions.push({ id: ++n.seq, type: action.type, ship, count, hulls, shieldUntil: p.shieldUntil || 0, from: p.id, to: dest.id, cargo, phase: "outbound", start: n.time, duration: f.ms, due: n.time + f.ms });
  } else if (action.type === "repair") {
    if (!(p.buildings.repairDock >= 1)) throw Error("Baue zuerst ein Reparaturdock auf diesem Planeten.");
    if (repairOrders(p).length >= 20) throw Error("Alle 20 Reparaturauftr\xE4ge sind belegt.");
    const q = repairQuote(p, action.key, action.count, stats(n, p).ratio);
    if (q.count > 1e5) throw Error("Maximal 100.000 Einheiten je Auftrag.");
    pay(p, q.cost);
    reserveRepair(p, action.key, q, ++n.seq, n.time);
    report(n, "Reparatur eingereiht", `${p.name}: ${q.count} \xD7 ${SHIPS[action.key].name}.`);
  } else if (["cancel-repair", "resume-repair"].includes(action.type)) {
    const j = repairOrders(p).find((j2) => j2.id === action.id);
    if (!j) throw Error("Der Reparaturauftrag hat sich ge\xE4ndert.");
    if (action.type === "cancel-repair") {
      const refund = repairRefund(j);
      for (const k of RES) p.depot[k] += refund[k];
      releaseRepair(p, j);
      settle(p);
      report(n, "Reparatur abgebrochen", p.name + ": ungenutztes Material erstattet; Schiffe freigegeben.");
    } else {
      const cost = repairMaterials(j);
      if (!RES.some((k) => cost[k] > 0)) throw Error("Kein Zusatzmaterial erforderlich.");
      pay(p, cost);
      payRepairMaterials(j, cost);
      report(n, "Reparatur fortgesetzt", p.name + ": zus\xE4tzliches Kampfmaterial bereitgestellt.");
    }
  } else if (action.type === "reserve") {
    if (!action.reserves || RES.some((k) => !Number.isSafeInteger(action.reserves[k]) || action.reserves[k] < 0 || action.reserves[k] > 1e12)) throw Error("Ung\xFCltige Reserve.");
    p.reserves = { ...action.reserves };
  } else if (action.type === "edit-route" || action.type === "cancel-route-edit") {
    const m = n.missions.find((m2) => m2.id === action.id && m2.type === "route");
    if (!m || m.stopping || m.awaitingUnload) throw Error("Diese Route l\xE4sst sich nicht mehr bearbeiten.");
    if (action.type === "cancel-route-edit") {
      delete m.pending;
    } else {
      const fleet = checkedFleet(action.fleet), stops = checkedStops(n, action.stops, m.home);
      routeInfo(n, stops, fleet);
      m.pending = { name: String(action.name || "Handelsroute").trim().slice(0, 40) || "Handelsroute", fleet, stops, repeat: !!action.repeat };
      if (m.paused) {
        if (applyRouteEdit(n, m) === false) throw Error("F\xFCr die \xC4nderung fehlen Schiffe oder die Restladung passt nicht in die neue Flotte.");
      } else report(n, "Routen\xE4nderung vorgemerkt", `${m.name}: Aktivierung bei R\xFCckkehr zum Startplaneten.`);
    }
  } else if (["pause-route", "resume-route", "cancel-route-pause"].includes(action.type)) {
    const m = n.missions.find((m2) => m2.id === action.id && m2.type === "route");
    if (!m || m.stopping) throw Error("Route nicht verf\xFCgbar.");
    if (action.type === "pause-route") {
      if (m.paused) throw Error("Route ist bereits pausiert.");
      m.pauseRequested = true;
      report(n, "Routenpause vorgemerkt", `${m.name}: Pause nach R\xFCckkehr zum Startplaneten.`);
    } else if (action.type === "cancel-route-pause") {
      if (m.paused) throw Error("Route ist bereits pausiert.");
      m.pauseRequested = false;
    } else {
      if (!m.paused) throw Error("Route ist nicht pausiert.");
      resumeRoute(n, m);
      report(n, "Route fortgesetzt", m.name);
    }
  } else if (action.type === "stop-route") {
    const m = n.missions.find((m2) => m2.id === action.id && m2.type === "route");
    if (!m) throw Error("Route nicht gefunden.");
    if (m.paused) parkFleet(n, m, m.home, "Handelsroute beendet");
    else {
      m.stopping = true;
      report(n, "Route endet nach dieser Runde", m.name);
    }
  } else if (["station", "collect", "salvage", "route", "deliver"].includes(action.type)) {
    if (n.missions.length >= 100) throw Error("Zu viele Flotten unterwegs.");
    if (!action.fleet && action.type !== "route" && action.type !== "station" && !isFreighter(action.ship || "transport")) throw Error("Liefern, Abholen und Handelsrouten ben\xF6tigen Transporter.");
    const manifest = action.type === "route" ? checkedFleet(action.fleet || { [action.ship || "transport"]: action.count }) : action.fleet ? missionFleet(action.fleet, action.type === "station") : null;
    const ship = manifest ? Object.keys(manifest)[0] : action.ship || "transport", count = manifest ? manifest[ship] : action.count;
    if (SHIPS[ship]?.category === "defense") throw Error("Orbitale Verteidigung kann nicht verlegt werden.");
    if (!Object.hasOwn(SHIPS, ship) || !Number.isSafeInteger(count) || count < 1 || p.ships[ship] < count) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe oder ung\xFCltige Anzahl.");
    const cargo = vector([0, 0, 0]), hulls = {};
    let m = { id: ++n.seq, type: action.type, ship, count, from: p.id, cargo, phase: "outbound", start: n.time };
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
      pay(p, vector([0, 0, f.fuel]));
      Object.assign(m, { name: String(action.name || "Handelsroute").trim().slice(0, 40) || "Handelsroute", stops: structuredClone(stops), home: p.id, index: 0, repeat: !!action.repeat, stopping: false, rounds: 0 });
      routeStats(n, m).fuelPaid = f.fuel;
      stopCargo(n, m, stops[0], "started", false);
      leaveRoute(n, m, 1);
    } else {
      if (manifest) {
        if (Object.entries(manifest).some(([k, v]) => p.ships[k] < v)) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe.");
        setFleet(m, manifest);
      }
      const dest = getPlanet(n, action.to);
      if (dest.id === p.id) throw Error("W\xE4hle einen anderen Zielplaneten.");
      if ((p.system || "tutorial") !== (dest.system || "tutorial") && !canFlyInterstellar(n, ship)) throw Error(ship === "falke" ? "Interstellare Falkenfl\xFCge ben\xF6tigen Falke-Galaxieantrieb 1 und Staustrahltriebwerke 1." : "Interstellare Fl\xFCge ben\xF6tigen Staustrahl-, Impuls- oder Hyperraumtriebwerke.");
      const f = manifest ? fleetLegInfo(n, p, dest, manifest) : legInfo(n, p, dest, count, ship);
      const order = action.order || action.cargo || vector([0, 0, 0]);
      if (!validOrder(order)) throw Error("Ladung: ganze Mengen oder Maximum w\xE4hlen.");
      if (!(manifest ? Object.keys(manifest).some(isFreighter) : isFreighter(ship)) && RES.some((k) => order[k] !== 0)) throw Error("Material ben\xF6tigt Transporter.");
      const fuel = f.fuel * (action.type === "station" ? 1 : 2);
      if (p.resources.fuel - (p.reserves?.fuel || 0) < fuel) throw Error("Nicht gen\xFCgend Treibstoff einschlie\xDFlich Reserve.");
      pay(p, vector([0, 0, fuel]));
      if (action.type === "salvage") {
        if (!dest.system) throw Error("Tr\xFCmmer liegen an einer gemeinsamen Galaxiekolonie.");
      } else if (action.type !== "collect") {
        const exact = RES.reduce((a, k) => a + (order[k] === "max" ? 0 : order[k]), 0);
        if (exact > (manifest ? fleetCapacity(n, manifest) : cargoCapacity(n, count, ship)) || RES.some((k) => order[k] !== "max" && order[k] > Math.floor(Math.max(0, p.resources[k] + p.depot[k] - (p.reserves?.[k] || 0))))) throw Error("Die gew\xE4hlte Ladung passt nicht oder lokale Ressourcen fehlen.");
        loadCargo(n, p, cargo, order, count, ship, manifest);
        if (action.type === "deliver" && !RES.some((k) => cargo[k] > 0)) throw Error("W\xE4hle verf\xFCgbare Ladung.");
      } else {
        if (!RES.some((k) => order[k] === "max" || order[k] > 0)) throw Error("W\xE4hle Material zum Abholen.");
        m.order = { ...order };
      }
      Object.assign(m, { to: dest.id, duration: f.ms, due: n.time + f.ms });
    }
    for (const [k, v] of Object.entries(fleetManifest(m))) p.ships[k] -= v;
    m.hulls = takeHulls(p, fleetManifest(m));
    n.missions.push(m);
  } else throw Error("Unbekannte Aktion.");
  waitingCargo(n);
  forecastShipJobs(n);
  for (const q of n.planets) forecastRepair(q, n.time, stats(n, q).ratio);
  return n;
}

// src/combat-hybrid.js
function seeded(seed) {
  let x = 2166136261;
  for (const c of String(seed)) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}
function cohorts(side, label) {
  const groups = side.groups || [{ id: label, owner: side.owner, commander: side.commander, ...side }];
  return groups.flatMap((g) => Object.entries(g.fleet || {}).filter(([, n]) => n > 0).map(([key, n]) => {
    if (!Number.isSafeInteger(n) || n < 0 || !COMBAT[key]) throw Error("Ung\xFCltiger Flottenbestand.");
    const stat = combatStats(key, g.tech || {});
    const hulls = g.hulls?.[key] || [];
    const hp = new Float64Array(n), shield = new Float64Array(n), indices = new Uint32Array(n);
    const factor = g.shieldFactor ?? 1;
    for (let i = 0; i < n; i++) {
      hp[i] = stat.hp * (hulls[i] ?? 1);
      shield[i] = stat.shield * factor;
      indices[i] = i;
    }
    return { id: g.id, key, owner: g.owner, commander: g.commander, stat, count: n, hp, shield, indices, damage: /* @__PURE__ */ new Map(), maxShield: stat.shield * factor };
  }));
}
function sampled(pool, random) {
  let total2 = 0;
  for (const g of pool) total2 += g.count;
  if (!total2) return null;
  let offset = Math.floor(random() * total2);
  for (const g of pool) {
    if (offset < g.count) return [g, g.indices[offset]];
    offset -= g.count;
  }
  return null;
}
function candidates(shooter, enemies) {
  const active = enemies.filter((g) => g.count);
  const military = active.filter((g) => SHIPS[g.key].category === "military");
  const allowed = military.length ? active.filter((g) => ["military", "defense"].includes(SHIPS[g.key].category)) : active;
  const bonus = allowed.filter((g) => (shooter.stat.bonus?.[g.key] || 0) > 0);
  if (bonus.length) return bonus;
  if (military.length) return military;
  const defense = allowed.filter((g) => SHIPS[g.key].category === "defense");
  return defense.length ? defense : allowed;
}
function fire(shooters, enemies, random, summary) {
  for (const s of shooters) {
    if (!s.count || !s.stat.attack) continue;
    const pool = candidates(s, enemies);
    if (!pool.length) continue;
    const shots = s.stat.shots;
    for (let i = 0; i < s.count * shots; i++) {
      const picked = sampled(pool, random);
      if (!picked) break;
      const [target, index] = picked, bonus = s.stat.bonus?.[target.key] || 0;
      const hit = s.stat.attack / shots * (1 + bonus);
      target.damage.set(index, (target.damage.get(index) || 0) + hit);
      const k = s.key + ":" + target.key;
      const item = summary[k] ??= { shooter: s.key, target: target.key, shots: 0, damage: 0 };
      item.shots++;
      item.damage += hit;
    }
  }
}
function fireLocked(shooters, enemies, random, summary) {
  for (const s of shooters) {
    if (!s.count || !s.stat.attack) continue;
    const pool = candidates(s, enemies);
    if (!pool.length) continue;
    const shots = s.stat.shots;
    for (let unit = 0; unit < s.count; unit++) {
      const picked = sampled(pool, random);
      if (!picked) break;
      const [target, index] = picked, bonus = s.stat.bonus?.[target.key] || 0;
      const hit = s.stat.attack / shots * (1 + bonus);
      target.damage.set(index, (target.damage.get(index) || 0) + hit * shots);
      const k = s.key + ":" + target.key;
      const item = summary[k] ??= { shooter: s.key, target: target.key, shots: 0, damage: 0 };
      item.shots += shots;
      item.damage += hit * shots;
    }
  }
}
function rapidCandidates(shooter, enemies, rapid) {
  const active = enemies.filter((g) => g.count);
  const combatants = active.filter((g) => ["military", "defense"].includes(SHIPS[g.key].category));
  const eligible = combatants.length ? combatants : active;
  const preferred = rapid.enabled ? eligible.filter((g) => (rapid.chances[shooter.key]?.[g.key] ?? 0) > 0) : [];
  return preferred.length ? preferred : eligible;
}
function fireRapid(shooters, enemies, random, summary, rapid) {
  for (const s of shooters) {
    if (!s.count || !s.stat.attack) continue;
    const pool = rapidCandidates(s, enemies, rapid);
    if (!pool.length) continue;
    for (let unit = 0; unit < s.count; unit++) {
      let picked = sampled(pool, random), extra = 0;
      while (picked) {
        const [target, index] = picked;
        const damage = s.stat.attack;
        target.damage.set(index, (target.damage.get(index) || 0) + damage);
        const k = s.key + ":" + target.key;
        const item = summary[k] ??= { shooter: s.key, target: target.key, shots: 0, damage: 0, rapidFireShots: 0, rapidFireDamage: 0, extraSalvos: 0 };
        item.shots += s.stat.shots;
        item.damage += damage;
        if (extra) {
          item.rapidFireShots += s.stat.shots;
          item.rapidFireDamage += damage;
          item.extraSalvos++;
        }
        if (!rapid.enabled || extra >= rapid.maxExtraSalvos) break;
        const chance = rapid.chances[s.key]?.[target.key] ?? 0;
        if (!chance || random() >= chance) break;
        extra++;
        picked = sampled(pool, random);
      }
    }
  }
}
function applyDamage(groups) {
  const impacts = [];
  for (const g of groups) {
    let killed = 0, shieldDamage = 0, hullDamage = 0, overkill = 0;
    for (const [i, hit] of g.damage) {
      const absorbed = Math.min(g.shield[i], hit), hull = Math.min(Math.max(0, g.hp[i]), hit - absorbed);
      g.shield[i] -= absorbed;
      g.hp[i] -= hit - absorbed;
      shieldDamage += absorbed;
      hullDamage += hull;
      overkill += Math.max(0, hit - absorbed - hull);
      if (g.hp[i] <= 1e-8) killed++;
    }
    if (killed) {
      let next = 0;
      for (let j = 0; j < g.count; j++) {
        const i = g.indices[j];
        if (g.hp[i] > 1e-8) g.indices[next++] = i;
      }
      g.count = next;
    }
    if (g.damage.size) impacts.push({ key: g.key, groupId: g.id, hitUnits: g.damage.size, destroyed: killed, shieldDamage, hullDamage, overkill });
    g.damage.clear();
  }
  return impacts;
}
function result(groups) {
  const fleet = {}, hulls = {};
  for (const g of groups) for (let j = 0; j < g.count; j++) {
    const i = g.indices[j];
    fleet[g.key] = (fleet[g.key] || 0) + 1;
    if (g.hp[i] < g.stat.hp - 1e-8) (hulls[g.key] ??= []).push(g.hp[i] / g.stat.hp);
  }
  return { fleet, hulls };
}
function total(groups) {
  return groups.reduce((n, g) => n + g.count, 0);
}
function groupSummary(groups, side) {
  return groups.map((g) => ({ side, key: g.key, groupId: g.id, ...g.owner ? { owner: g.owner } : {}, count: g.count }));
}
function resolveBattleHybrid(attacker, defender, seed, experimentalVersion = 4, realmOverrides = {}) {
  if (![4, 5, 6].includes(experimentalVersion)) throw Error("Unknown hybrid rules version");
  const combatSettings = experimentalVersion === 6 ? combatConfigForRealm(realmOverrides) : null;
  const rapid = combatSettings?.rapidFire;
  const fireRound = experimentalVersion === 5 ? fireLocked : experimentalVersion === 6 ? (shooters, enemies, random2, summary) => fireRapid(shooters, enemies, random2, summary, rapid) : fire;
  const a = cohorts(attacker, "attacker"), d = cohorts(defender, "host"), random = seeded(seed), rounds = [], aggregates = [];
  const initialGroups = [...groupSummary(a, "attacker"), ...groupSummary(d, "defender")];
  for (let round = 0; round <= 6; round++) {
    if (!total(a) || !total(d)) break;
    const opening = round === 0;
    const platforms = opening ? d.filter((g) => SHIPS[g.key].category === "defense") : [];
    if (opening && !platforms.length) continue;
    const shots = {};
    if (!opening) fireRound(a, d, random, shots);
    if (opening && experimentalVersion === 6 && !rapid.allowInOrbitalOpening) fireRapid(platforms, a, random, shots, { ...rapid, enabled: false });
    else fireRound(opening ? platforms : d, a, random, shots);
    const impacts = applyDamage([...a, ...d]);
    rounds.push({ round, attacker: total(a), defender: total(d) });
    aggregates.push({ round, shots: Object.values(shots), impacts, after: { attacker: { count: total(a) }, defender: { count: total(d) } } });
  }
  const attackerAfter = result(a), defenderAfter = result(d);
  const debris = vector([0, 0, 0]), defenseRepair = vector([0, 0, 0]);
  for (const g of [...a, ...d]) {
    const losses = g.hp.length - g.count, ship = SHIPS[g.key];
    debris.metal += losses * ship.cost[0] * 0.3;
    debris.crystal += losses * ship.cost[1] * 0.3;
  }
  for (const k of RES) {
    debris[k] = Math.floor(debris[k]);
    defenseRepair[k] = Math.floor(defenseRepair[k]);
  }
  const ac = total(a), dc = total(d);
  const grouped = {};
  if (defender.groups) grouped.defenderGroups = defender.groups.map((group) => {
    const subset = d.filter((g) => g.id === group.id);
    const out = result(subset);
    if (group.id?.startsWith("repair:")) {
      out.repairUnits = subset.flatMap((g) => Array.from({ length: g.hp.length }, (_, i) => ({
        hp: Math.max(0, g.hp[i]),
        maxHp: g.stat.hp
      })));
    }
    return { id: group.id, owner: group.owner, ...out };
  });
  return {
    outcome: ac && !dc ? "attacker" : dc && !ac ? "defender" : "draw",
    attacker: attackerAfter,
    defender: defenderAfter,
    debris,
    defenseRepair,
    rounds,
    ...grouped,
    // v4 traces intentionally aggregate; v3's per-unit report reader must not consume these.
    trace: {
      version: 2,
      ruleVersion: experimentalVersion,
      seed: String(seed),
      initialGroups,
      finalGroups: [...groupSummary(a, "attacker"), ...groupSummary(d, "defender")],
      tech: { attacker: { ...attacker.tech }, defender: { ...defender.tech } },
      shieldFactors: { attacker: attacker.shieldFactor ?? 1, defender: defender.shieldFactor ?? 1 },
      ...experimentalVersion === 6 ? { rapidFireRules: rapid } : {},
      rounds: aggregates
    }
  };
}

// src/pirates-world.js
var pirateZero = () => vector([0, 0, 0]);
var pirateState = (w, uid) => w.saves.find((r) => r.user_id === uid)?.state;
var pirateOwner = (w, uid) => w.piratePlayers?.find((r) => r.user_id === uid);
function pirateLog(s, time, title, body) {
  s.reports.unshift({ id: ++s.seq, time, title, body: body.slice(0, 1e3) });
  s.reports = s.reports.slice(0, 60);
}
function spawnPirate(meta, c, time, old) {
  const b = c.stations[meta.id];
  return { id: meta.id, generation: (old?.generation || 0) + 1, sensor: b.sensor, enabled: b.enabled, tech: { ...b.tech }, fleet: Object.fromEntries(Object.entries(b.fleet).map(([k, n]) => [k, Math.max(1, Math.round(n * c.strengthFactor))])), hulls: {}, resources: vector(RES.map((k) => Math.floor(b.resources[k] * c.resourceFactor))), debris: { ...old?.debris || pirateZero() }, debrisExpiresAt: old?.debrisExpiresAt || 0, refreshAt: time + c.cooldownMinutes * 6e4, nextAttackAt: 0, scan: null, defeated: false, cooldownMs: c.cooldownMinutes * 6e4, debrisRate: c.debrisRate, debrisLifetimeMs: c.debrisLifetimeHours * 36e5 };
}
function preparePirates(w) {
  if (w.pirateVersion !== 1) return;
  w.pirateConfig = pirateConfig(w.pirateConfig || {});
  w.piratePlayers ??= [];
}
function refreshPirates(w, time) {
  if (w.pirateVersion !== 1) return;
  for (const row of w.piratePlayers) for (const meta of PIRATE_STATION_META) {
    let q = row.stations[meta.id];
    if (!q || time >= q.refreshAt && !row.missions.some((m) => m.station === meta.id && m.kind === "attack" && m.status === "outbound")) q = row.stations[meta.id] = spawnPirate(meta, w.pirateConfig, time, q);
    if (q.debrisExpiresAt && time >= q.debrisExpiresAt) {
      q.debris = pirateZero();
      q.debrisExpiresAt = 0;
    }
  }
}
function pirateReady(w, uid) {
  if (w.pirateVersion !== 1) throw Error("Piraten ben\xF6tigen zuerst die PvE-SQL und die neue Game-command.");
}
function ensurePirateOwner(w, uid) {
  let row = pirateOwner(w, uid);
  if (!row) {
    row = { user_id: uid, stations: {}, missions: [], reports: [] };
    w.piratePlayers.push(row);
  }
  refreshPirates(w, w.now);
  return row;
}
function pirateAction(w, uid, action, id, seed) {
  pirateReady(w, uid);
  const s = pirateState(w, uid);
  if (!s) throw Error("Spielstand fehlt.");
  if (action.op === "configure") {
    if (!w.admins.includes(uid)) throw Error("Nur Administratoren d\xFCrfen die Piraten-Realm-Einstellungen \xE4ndern.");
    w.pirateConfig = pirateConfig(action.config);
    return;
  }
  const row = ensurePirateOwner(w, uid);
  if (action.op === "open") return;
  const meta = PIRATE_STATION_META.find((x) => x.id === action.station), q = row.stations[action.station];
  if (!meta || !q) throw Error("Unbekannte Piratenstation.");
  if (!w.pirateConfig.enabled || !w.pirateConfig.stations[meta.id].enabled) throw Error("Diese Piratenstation ist pausiert.");
  if (!["scan", "attack", "collect", "salvage"].includes(action.op)) throw Error("Unbekannter Piratenauftrag.");
  if (row.missions.length >= w.pirateConfig.maxMissions) throw Error("Alle Piraten-Missionspl\xE4tze sind belegt.");
  const from = getPlanet(s, action.from), kind = action.op;
  let fleet;
  if (kind === "scan") {
    if ((s.tech.scout || 0) < q.sensor) throw Error("Sensortechnik " + q.sensor + " ben\xF6tigt.");
    if (row.missions.some((m) => m.station === meta.id && m.kind === "scan" && m.status === "outbound")) throw Error("Eine Spionagesonde ist bereits unterwegs.");
    fleet = { spyProbe: 1 };
  } else if (kind === "attack") {
    if (w.now < q.nextAttackAt || row.missions.some((m) => m.station === meta.id && m.kind === "attack" && m.status === "outbound")) throw Error("Diese Station hat noch Angriffs-Cooldown oder einen Angriff im Anflug.");
    const slots = attackSlots(s.tech.military || 0), used = row.missions.filter((m) => m.kind === "attack").length + w.attacks.filter((m) => m.attacker_id === uid && m.status !== "returned").length;
    if (used >= slots) throw Error("Alle Angriffspl\xE4tze sind belegt.");
    fleet = attackFleet(action.fleet);
  } else {
    fleet = action.fleet;
    if (!fleet || Array.isArray(fleet) || !Object.keys(fleet).length || Object.entries(fleet).some(([k, n]) => !isFreighter(k) || !Number.isSafeInteger(n) || n < 1)) throw Error("W\xE4hle verf\xFCgbare Frachter in ganzen Zahlen.");
    if (kind === "collect" && !q.defeated) throw Error("Das Depot ist noch von Piraten bewacht.");
    if (kind === "salvage" && !RES.some((k) => q.debris[k] > 0)) throw Error("Kein Tr\xFCmmerfeld vorhanden.");
  }
  for (const [k, n] of Object.entries(fleet)) if ((from.ships[k] || 0) < n) throw Error("Nicht gen\xFCgend verf\xFCgbare " + SHIPS[k].name + ".");
  const f = pirateFlight(s, from, meta, fleet, w.pirateConfig);
  settle(from);
  if (from.resources.fuel < f.fuel) throw Error("Nicht genug Treibstoff f\xFCr Hin- und R\xFCckflug.");
  const hulls = takeHulls(from, fleet);
  from.resources.fuel -= f.fuel;
  for (const [k, n] of Object.entries(fleet)) from.ships[k] -= n;
  const version = [3, 4, 5, 6].includes(w.settings.combat_engine) ? w.settings.combat_engine : COMBAT_RULE_VERSION;
  row.missions.push({ id, kind, station: meta.id, generation: q.generation, from: from.id, fleet: { ...fleet }, initialFleet: { ...fleet }, hulls, tech: { ...s.tech }, shieldUntil: from.shieldUntil || 0, startedAt: w.now, arrivalAt: w.now + f.ms, due: w.now + f.ms, duration: f.ms, status: "outbound", cargo: pirateZero(), fuel: f.fuel, ruleVersion: version, combatConfig: version === 6 ? structuredClone(REALM_COMBAT_OVERRIDES.test4) : {}, seed });
  pirateLog(s, w.now, "Piratenauftrag gestartet", meta.name + " \xB7 " + { scan: "Spionagesonde", attack: "Angriff", collect: "Depot abholen", salvage: "Tr\xFCmmer bergen" }[kind] + " \xB7 Start: " + from.name);
}
function pirateEvents(w) {
  if (w.pirateVersion !== 1) return [];
  return w.piratePlayers.flatMap((row) => row.missions.map((m) => ({ time: m.awaitingUnload ? nextCargoSpaceEvent(pirateState(w, row.user_id), getPlanet(pirateState(w, row.user_id), m.from)) : m.due, id: m.id, kind: "pirate", mission: m, owner: row.user_id, order: m.status === "outbound" ? 2 : 3 })).filter((e) => Number.isFinite(e.time)));
}
function takePirateCargo(stock, room) {
  const cargo = pirateZero();
  for (const k of RES) {
    const n = Math.min(Math.floor(stock[k]), room);
    stock[k] -= n;
    cargo[k] = n;
    room -= n;
  }
  return cargo;
}
function pirateReport(row, r) {
  row.reports.unshift(r);
  row.reports = row.reports.slice(0, 30);
}
function arrivePirate(w, uid, m, time) {
  const row = pirateOwner(w, uid), s = pirateState(w, uid), meta = PIRATE_STATION_META.find((x) => x.id === m.station);
  if (m.status === "returning") {
    returnPirate(w, row, m, time);
    return;
  }
  refreshPirates(w, time);
  const station = row.stations[m.station];
  if (m.kind === "scan") {
    if ((s.tech.scout || 0) >= station.sensor) {
      station.scan = { at: time, generation: station.generation, fleet: { ...station.fleet }, resources: { ...station.resources }, tech: { ...station.tech } };
      pirateLog(s, time, "Spionagebericht", meta.name + " aufgekl\xE4rt. Flotte und Depot im Piratenbereich einsehbar.");
    } else pirateLog(s, time, "Spionage gescheitert", "Die Station ben\xF6tigt inzwischen h\xF6here Sensortechnik.");
  } else if (m.kind === "attack") {
    const resolver = [4, 5, 6].includes(m.ruleVersion) ? resolveBattleHybrid : resolveBattle;
    const before = { ...station.fleet };
    const result2 = resolver({ fleet: m.fleet, tech: m.tech, hulls: m.hulls, shieldFactor: m.shieldUntil ? Math.max(0, Math.min(1, 1 - (m.shieldUntil - time) / 3e5)) : 1 }, { fleet: station.fleet, tech: station.tech, hulls: station.hulls }, m.seed || m.id, m.ruleVersion, m.combatConfig);
    const debris = pirateZero();
    for (const [side, after] of [[m.fleet, result2.attacker.fleet], [before, result2.defender.fleet]]) for (const [k, n] of Object.entries(side)) {
      const lost = n - (after[k] || 0);
      debris.metal += lost * SHIPS[k].cost[0] * station.debrisRate;
      debris.crystal += lost * SHIPS[k].cost[1] * station.debrisRate;
    }
    for (const k of RES) {
      debris[k] = Math.floor(debris[k]);
      station.debris[k] += debris[k];
    }
    if (RES.some((k) => debris[k] > 0)) station.debrisExpiresAt = time + station.debrisLifetimeMs;
    station.fleet = result2.defender.fleet;
    station.hulls = result2.defender.hulls;
    station.defeated = !Object.values(station.fleet).some((n) => n > 0);
    station.nextAttackAt = time + station.cooldownMs;
    station.refreshAt = station.nextAttackAt;
    m.fleet = result2.attacker.fleet;
    m.hulls = result2.attacker.hulls;
    m.shieldUntil = time + 3e5;
    if (result2.outcome === "attacker") m.cargo = takePirateCargo(station.resources, fleetCapacity({ tech: m.tech }, m.fleet));
    pirateReport(row, { id: m.id, station: m.station, at: time, outcome: result2.outcome, ruleVersion: m.ruleVersion, rounds: result2.rounds, attackerBefore: { ...m.initialFleet }, attackerAfter: { ...m.fleet }, defenderBefore: before, defenderAfter: { ...station.fleet }, cargo: { ...m.cargo }, debris });
    pirateLog(s, time, "PvE-Kampfbericht", meta.name + " \xB7 " + (result2.outcome === "attacker" ? "Sieg" : result2.outcome === "defender" ? "Niederlage" : "Unentschieden") + " \xB7 " + result2.rounds.length + " Runden. Details unter Galaxie \u2192 Piraten.");
    station.scan = null;
  } else if (m.kind === "salvage") m.cargo = takePirateCargo(station.debris, fleetCapacity({ tech: m.tech }, m.fleet));
  else if (station.defeated) m.cargo = takePirateCargo(station.resources, fleetCapacity({ tech: m.tech }, m.fleet));
  else pirateLog(s, time, "Piraten-Abholung abgebrochen", "Die Station wurde erneuert. Dein Frachter kehrt ohne Beute zur\xFCck.");
  if (!Object.values(m.fleet).some((n) => n > 0)) {
    row.missions = row.missions.filter((x) => x.id !== m.id);
    return;
  }
  m.status = "returning";
  m.due = time + m.duration;
}
function returnPirate(w, row, m, time) {
  const s = pirateState(w, row.user_id), p = getPlanet(s, m.from);
  unloadCargo(p, m.cargo);
  if (cargoPresent(m.cargo)) {
    m.awaitingUnload = true;
    return;
  }
  for (const [k, n] of Object.entries(m.fleet)) p.ships[k] += n;
  putHulls(p, m.hulls);
  p.shieldUntil = Math.max(p.shieldUntil || 0, m.shieldUntil || 0);
  row.missions = row.missions.filter((x) => x.id !== m.id);
  pirateLog(s, time, "Piratenflotte zur\xFCckgekehrt", PIRATE_STATION_META.find((x) => x.id === m.station).name + " \xB7 Schiffe und Ladung auf " + p.name + " eingetroffen.");
}
function settlePirates(w, time) {
  if (w.pirateVersion !== 1) return;
  for (const row of w.piratePlayers) for (const m of [...row.missions]) if (m.awaitingUnload) returnPirate(w, row, m, time);
}
function pirateFleetShadows(w) {
  if (w.pirateVersion !== 1) return;
  for (const row of w.saves) row.state.pveFleets = (pirateOwner(w, row.user_id)?.missions || []).map((m) => ({ fleet: { ...m.fleet } }));
}
function projectPirates(w, uid) {
  if (w.pirateVersion !== 1 || !pirateState(w, uid)) return null;
  const row = pirateOwner(w, uid);
  return { config: w.admins.includes(uid) ? structuredClone(w.pirateConfig) : { flightTimeFactor: w.pirateConfig.flightTimeFactor, fuelFactor: w.pirateConfig.fuelFactor }, stations: PIRATE_STATION_META.map((meta) => {
    const q = row?.stations[meta.id];
    return { ...meta, sensor: q?.sensor ?? w.pirateConfig.stations[meta.id].sensor, enabled: w.pirateConfig.enabled && w.pirateConfig.stations[meta.id].enabled, initialized: !!q, generation: q?.generation, refreshAt: q?.refreshAt || 0, nextAttackAt: q?.nextAttackAt || 0, defeated: !!q?.defeated, debris: { ...q?.debris || pirateZero() }, debrisExpiresAt: q?.debrisExpiresAt || 0, scan: q?.scan ? structuredClone(q.scan) : null };
  }), missions: structuredClone(row?.missions || []).map(({ seed, combatConfig, initialFleet, ...m }) => m), reports: structuredClone(row?.reports || []) };
}
function pirateDefense(w, uid, planet2) {
  return (pirateOwner(w, uid)?.missions || []).filter((m) => m.awaitingUnload && m.from === planet2).map((m) => ({ id: "pirate:" + m.id, owner: uid, commander: "PvE-R\xFCckkehrer", fleet: { ...m.fleet }, hulls: m.hulls, tech: m.tech }));
}
function reconcilePirateDefense(w, uid, groups, result2, time) {
  const row = pirateOwner(w, uid);
  for (const g of groups) {
    const m = row.missions.find((x) => "pirate:" + x.id === g.id), after = result2.defenderGroups.find((x) => x.id === g.id);
    m.fleet = after.fleet;
    m.hulls = after.hulls;
    m.shieldUntil = time + 3e5;
    g.fleet = after.fleet;
    let room = fleetCapacity({ tech: m.tech }, m.fleet);
    for (const k of RES) {
      m.cargo[k] = Math.min(m.cargo[k], room);
      room -= m.cargo[k];
    }
    if (!Object.keys(m.fleet).length) row.missions = row.missions.filter((x) => x.id !== m.id);
  }
}

// src/social-world.js
var socialZero = () => vector([0, 0, 0]);
var socialState = (w, uid) => {
  const s = w.saves.find((r) => r.user_id === uid)?.state;
  if (!s) throw Error("Commander nicht gefunden.");
  return s;
};
var socialLog = (s, time, title, body) => {
  s.reports.unshift({ id: ++s.seq, time: Math.max(time, s.time), title, body });
  s.reports = s.reports.slice(0, 60);
};
var socialGrant = (w, owner, friend, right) => w.partners.some((p) => p.status === "accepted" && [p.from, p.to].includes(owner) && [p.from, p.to].includes(friend) && p.grants[owner]?.[right]);
var socialCargo = (c) => {
  if (!c || typeof c !== "object" || RES.some((k) => !Number.isSafeInteger(c[k]) || c[k] < 0 || c[k] > 1e12)) throw Error("Rohstoffe m\xFCssen positive ganze Mengen sein.");
  return Object.fromEntries(RES.map((k) => [k, c[k]]));
};
var socialSum = (c) => RES.reduce((n, k) => n + c[k], 0);
function socialPay(p, c) {
  settle(p);
  if (RES.some((k) => p.resources[k] < c[k])) throw Error("Lokale Ressourcen reichen nicht.");
  for (const k of RES) p.resources[k] -= c[k];
  settle(p);
}
function socialPlanet(w, owner, id) {
  const meta = w.planets.find((p2) => p2.id === id && p2.owner_id === owner && !p2.reserved);
  const p = getPlanet(socialState(w, owner), id);
  if (!meta || !p.system) throw Error("W\xE4hle eine besiedelte gemeinsame Galaxiekolonie.");
  return p;
}
function socialOrigin(w, owner, id) {
  const p = getPlanet(socialState(w, owner), id);
  return p.system ? socialPlanet(w, owner, id) : p;
}
function socialFlight(s, from, to, fleet, kind) {
  const entries = Object.entries(fleet || {});
  if (!entries.length || entries.some(([k, n]) => !Number.isSafeInteger(n) || n < 1 || SHIPS[k]?.category !== (kind === "support" ? "military" : "freighter"))) throw Error("W\xE4hle verf\xFCgbare " + (kind === "support" ? "Kriegsschiffe" : "Frachter") + " in ganzen Zahlen.");
  let ms2 = 0, fuel = 0, slowest = "";
  for (const [key, count] of entries) {
    if ((from.ships[key] || 0) < count) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe.");
    if (from.system !== to.system && (!canFlyInterstellar(s, key) || (s.tech[shipFlightEngine(s, key, true)] || 0) < 1)) throw Error("F\xFCr interstellare Fl\xFCge fehlt ein geeigneter Antrieb.");
    const leg = sharedFlight(s, from, to, count, key);
    if (leg.ms > ms2) {
      ms2 = leg.ms;
      slowest = key;
    }
    fuel += 2 * leg.fuel;
  }
  return { ms: ms2, fuel, slowest };
}
function socialReturn(w, m) {
  if (!["outbound", "stationed"].includes(m.status)) throw Error("Diese Flotte ist bereits auf dem R\xFCckweg.");
  const duration = m.status === "outbound" ? Math.max(1, Math.min(m.duration, w.now - m.startedAt)) : m.duration;
  m.status = "returning";
  m.due = w.now + duration;
}
function socialLaunch(w, uid, a, id, kind, payment = socialZero()) {
  const s = socialState(w, uid), from = socialOrigin(w, uid, a.from), target = w.planets.find((p) => p.id === a.to && !p.reserved && p.owner_id && p.owner_id !== uid);
  if (!target) throw Error("W\xE4hle eine fremde besiedelte Galaxiekolonie.");
  const owner = target.owner_id, to = socialPlanet(w, owner, a.to);
  if (!socialGrant(w, owner, uid, kind === "support" ? "defense" : "delivery")) throw Error("Dein Partner hat dieses Recht nicht freigegeben.");
  if (w.socialMissions.filter((m2) => m2.owner === uid && !["returned", "lost"].includes(m2.status)).length >= 20) throw Error("Maximal 20 gemeinsame Flottenauftr\xE4ge.");
  const f = socialFlight(s, from, to, a.fleet, kind), cargo = kind === "support" ? socialZero() : socialCargo(a.cargo);
  const cap = fleetCapacity(s, a.fleet);
  if (socialSum(cargo) > cap || socialSum(payment) > cap) throw Error("Der Laderaum muss f\xFCr Hin- und R\xFCckladung reichen.");
  if (kind !== "support" && !socialSum(cargo)) throw Error("W\xE4hle eine positive Ladung.");
  socialPay(from, { ...cargo, fuel: cargo.fuel + f.fuel });
  const hulls = takeHulls(from, a.fleet);
  for (const [k, n] of Object.entries(a.fleet)) from.ships[k] -= n;
  const m = { id, owner: uid, host: owner, from: from.id, to: to.id, kind, status: "outbound", fleet: { ...a.fleet }, hulls, cargo, payment, shieldUntil: from.shieldUntil || 0, startedAt: w.now, due: w.now + f.ms, duration: f.ms, slowest: f.slowest };
  w.socialMissions.push(m);
  socialLog(s, w.now, "Partnerflotte gestartet", kind === "support" ? "Verteidigung unterwegs nach " + to.name : "Lieferung unterwegs nach " + to.name);
  return m;
}
function socialAction(w, uid, a, id) {
  if (w.socialVersion !== 1) throw Error("F\xFCr Partnerschaften fehlt noch die Datenbank-Erweiterung partnerships.sql.");
  const s = socialState(w, uid), op = a.op;
  if (op === "invite") {
    if (a.friend === uid) throw Error("Du kannst dich nicht selbst einladen.");
    socialState(w, a.friend);
    if (w.partners.some((p) => ["pending", "accepted"].includes(p.status) && [p.from, p.to].includes(uid) && [p.from, p.to].includes(a.friend))) throw Error("Es besteht bereits eine Einladung oder Partnerschaft.");
    if (w.partners.filter((p) => ["pending", "accepted"].includes(p.status) && [p.from, p.to].includes(uid)).length >= 20) throw Error("Maximal 20 Partnerschaften und Einladungen.");
    w.partners.push({ id, from: uid, to: a.friend, status: "pending", grants: { [uid]: { delivery: !!a.delivery, defense: !!a.defense } } });
    socialLog(s, w.now, "Partnerschaft angefragt", "Einladung gesendet.");
    socialLog(socialState(w, a.friend), w.now, "Partnerschaft eingeladen", s.name + " m\xF6chte dein Partner werden.");
    return;
  }
  if (["accept", "permissions", "end"].includes(op)) {
    const p = w.partners.find((p2) => p2.id === a.id && [p2.from, p2.to].includes(uid));
    if (!p) throw Error("Partnerschaft nicht gefunden.");
    if (op === "accept") {
      if (p.status !== "pending" || p.to !== uid) throw Error("Nur der eingeladene Commander kann zustimmen.");
      p.status = "accepted";
      p.grants[uid] = { delivery: !!a.delivery, defense: !!a.defense };
    }
    if (op === "permissions") {
      if (p.status !== "accepted") throw Error("Partnerschaft ist nicht aktiv.");
      p.grants[uid] = { delivery: !!a.delivery, defense: !!a.defense };
    }
    if (op === "end") {
      if (!["pending", "accepted"].includes(p.status)) throw Error("Partnerschaft ist bereits beendet.");
      p.status = "ended";
    }
    for (const m of w.socialMissions) if ([p.from, p.to].includes(m.owner) && [p.from, p.to].includes(m.host) && ["outbound", "stationed"].includes(m.status) && m.kind !== "trade" && !socialGrant(w, m.host, m.owner, m.kind === "support" ? "defense" : "delivery")) socialReturn(w, m);
    for (const offer of w.trades) if (offer.status === "offered" && [p.from, p.to].includes(offer.owner) && [p.from, p.to].includes(offer.buyer) && (!socialGrant(w, offer.buyer, offer.owner, "delivery") || !socialGrant(w, offer.owner, offer.buyer, "delivery"))) offer.status = "cancelled";
    return;
  }
  if (op === "recall" || op === "dismiss") {
    const m = w.socialMissions.find((m2) => m2.id === a.id && m2.kind === "support" && (op === "recall" ? m2.owner === uid : m2.host === uid));
    if (!m) throw Error("Du darfst diese Flotte nicht zur\xFCckschicken.");
    socialReturn(w, m);
    return;
  }
  if (op === "deliver" || op === "support") {
    socialLaunch(w, uid, a, id, op === "support" ? "support" : "delivery");
    return;
  }
  if (op === "trade-offer") {
    const from = socialOrigin(w, uid, a.from), target = w.planets.find((p) => p.id === a.to && !p.reserved && p.owner_id && p.owner_id !== uid);
    if (!target) throw Error("Handelspartner fehlt.");
    const to = socialPlanet(w, target.owner_id, a.to);
    if (!socialGrant(w, target.owner_id, uid, "delivery") || !socialGrant(w, uid, target.owner_id, "delivery")) throw Error("Direkter Handel ben\xF6tigt beidseitiges Lieferrecht.");
    const cargo = socialCargo(a.cargo), payment = socialCargo(a.payment);
    if (!socialSum(cargo) || !socialSum(payment)) throw Error("Angebot und Gegenleistung d\xFCrfen nicht leer sein.");
    socialFlight(s, from, to, a.fleet, "delivery");
    const cap = fleetCapacity(s, a.fleet);
    if (socialSum(cargo) > cap || socialSum(payment) > cap) throw Error("Zu wenig Laderaum.");
    if (w.trades.filter((t) => t.owner === uid && t.status === "offered").length >= 10) throw Error("Maximal 10 offene Tauschangebote.");
    w.trades.push({ id, owner: uid, buyer: target.owner_id, from: a.from, to: a.to, fleet: { ...a.fleet }, cargo, payment, status: "offered", expires: w.now + 36e5 });
    socialLog(socialState(w, target.owner_id), w.now, "Tauschangebot erhalten", s.name + " bietet einen direkten Rohstofftausch an.");
    return;
  }
  if (op === "trade-accept" || op === "trade-cancel") {
    const t = w.trades.find((t2) => t2.id === a.id);
    if (!t || t.status !== "offered" || t.expires <= w.now) throw Error("Dieses Angebot ist nicht mehr offen.");
    if (op === "trade-cancel") {
      if (![t.owner, t.buyer].includes(uid)) throw Error("Dieses Angebot geh\xF6rt dir nicht.");
      t.status = "cancelled";
      return;
    }
    if (t.buyer !== uid) throw Error("Nur der Empf\xE4nger darf das Angebot annehmen.");
    if (!socialGrant(w, t.owner, uid, "delivery")) throw Error("Lieferrecht wurde entzogen.");
    const buyer = socialPlanet(w, uid, t.to);
    socialPay(buyer, t.payment);
    const m = socialLaunch(w, t.owner, { ...t, cargo: t.cargo }, id, "trade", t.payment);
    t.status = "accepted";
    t.mission = m.id;
    return;
  }
  throw Error("Unbekannte Partneraktion.");
}
function socialEvents(w) {
  return w.socialMissions.filter((m) => ["outbound", "returning"].includes(m.status)).flatMap((m) => {
    if (!m.awaitingUnload) return [{ time: m.due, id: m.id, kind: "social", mission: m, order: m.status === "outbound" ? 1 : 3 }];
    const p = m.status === "returning" ? socialOrigin(w, m.owner, m.from) : socialPlanet(w, m.host, m.to);
    const time = nextCargoSpaceEvent(socialState(w, m.status === "returning" ? m.owner : m.host), p);
    return Number.isFinite(time) ? [{ time, id: m.id, kind: "social", mission: m, order: 1 }] : [];
  });
}
function arriveSocial(w, m, time) {
  const s = socialState(w, m.owner), from = socialOrigin(w, m.owner, m.from);
  if (m.status === "returning") {
    unloadCargo(from, m.cargo);
    if (cargoPresent(m.cargo)) {
      m.awaitingUnload = true;
      m.due = time;
      return;
    }
    delete m.awaitingUnload;
    for (const [k, n] of Object.entries(m.fleet)) from.ships[k] += n;
    putHulls(from, m.hulls);
    from.shieldUntil = Math.max(from.shieldUntil || 0, m.shieldUntil || 0);
    m.status = "returned";
    socialLog(s, time, "Partnerflotte zur\xFCckgekehrt", "Schiffe und Ladung auf " + from.name + " eingetroffen.");
    return;
  }
  const to = socialPlanet(w, m.host, m.to), host = socialState(w, m.host);
  if (m.kind === "support") {
    if (!socialGrant(w, m.host, m.owner, "defense")) {
      m.status = "returning";
      m.due = time + m.duration;
      return;
    }
    m.status = "stationed";
    socialLog(s, time, "Verteidigungsflotte stationiert", to.name + " wird von deinen Schiffen unterst\xFCtzt.");
    socialLog(host, time, "Verst\xE4rkung eingetroffen", s.name + " unterst\xFCtzt " + to.name + ".");
    return;
  }
  if (m.kind === "delivery" && !socialGrant(w, m.host, m.owner, "delivery")) {
    m.status = "returning";
    m.due = time + m.duration;
    return;
  }
  unloadCargo(to, m.cargo);
  if (m.kind === "trade" && cargoPresent(m.cargo)) {
    m.awaitingUnload = true;
    m.due = time;
    return;
  }
  delete m.awaitingUnload;
  if (m.kind === "trade") m.cargo = { ...m.payment };
  m.payment = socialZero();
  m.status = "returning";
  m.due = time + m.duration;
  socialLog(host, time, "Partnerlieferung angekommen", s.name + " hat Ressourcen auf " + to.name + " abgeladen.");
}
function settleSocialCargo(w, time) {
  for (const m of w.socialMissions) if (m.awaitingUnload && ["outbound", "returning"].includes(m.status)) arriveSocial(w, m, time);
}
function socialDefense(w, host, id, time) {
  return w.socialMissions.filter((m) => m.host === host && m.to === id && m.kind === "support" && m.status === "stationed" || m.awaitingUnload && m.status === "returning" && m.owner === host && m.from === id).map((m) => ({ id: m.id, owner: m.owner, commander: socialState(w, m.owner).name, fleet: m.fleet, tech: socialState(w, m.owner).tech, hulls: m.hulls, shieldFactor: m.shieldUntil ? Math.max(0, Math.min(1, 1 - (m.shieldUntil - time) / 3e5)) : 1 }));
}
function socialProjection(w, uid) {
  if (w.socialVersion !== 1) return null;
  const name = (id) => socialState(w, id).name;
  const planets = (id) => w.planets.filter((p) => p.owner_id === id && !p.reserved).map((p) => ({ id: p.id, name: p.meta.name, system: p.meta.system, x: p.meta.x, y: p.meta.y, slot: p.meta.slot }));
  return { players: w.saves.filter((r) => r.user_id !== uid).map((r) => ({ id: r.user_id, name: r.state.name })), partners: w.partners.filter((p) => [p.from, p.to].includes(uid) && p.status !== "ended").map((p) => {
    const friend = p.from === uid ? p.to : p.from;
    return { id: p.id, friend, name: name(friend), incoming: p.to === uid, status: p.status, granted: p.grants[uid] || {}, received: p.grants[friend] || {}, planets: p.status === "accepted" ? planets(friend) : [] };
  }), missions: w.socialMissions.filter((m) => [m.owner, m.host].includes(uid) && !["returned", "lost"].includes(m.status)).map((m) => ({ ...m, own: m.owner === uid, commander: name(m.owner), hostName: name(m.host) })), trades: w.trades.filter((t) => [t.owner, t.buyer].includes(uid) && t.status === "offered" && t.expires > w.now).map((t) => ({ ...t, own: t.owner === uid, name: name(t.owner === uid ? t.buyer : t.owner) })) };
}

// src/storage.js
var isNum = (x, max = 1e12) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= max;
var integer = (x, max) => isNum(x, max) && Number.isInteger(x);
var text = (x, max = 100) => typeof x === "string" && x.length <= max;
var SaveValidationError = class extends Error {
  constructor(rule) {
    super("Ung\xFCltiger oder inkompatibler Spielstand.");
    this.name = "SaveValidationError";
    this.rule = rule;
  }
};
function check(rule, ok) {
  if (!ok) throw new SaveValidationError(rule);
}
function validateSave(input) {
  check("SV001", input && typeof input === "object" && input.version === 1);
  const s = structuredClone(input);
  if (s.systemName !== void 0) check("SV002", text(s.systemName, 30) && s.systemName.trim().length > 0);
  check("SV003", text(s.name, 30) && s.name.trim().length > 0 && isNum(s.time, 864e13) && isNum(s.created, 864e13) && s.created <= s.time && integer(s.seq, 1e9));
  check("SV004", Array.isArray(s.planets) && s.planets.length >= 1 && s.planets.length <= 7);
  if (s.galaxy) check("SV005", isNum(s.galaxy.x, 1200) && isNum(s.galaxy.y, 1200));
  if (s.tech) {
    for (const k of Object.keys(TECHS)) if (!Object.hasOwn(s.tech, k)) s.tech[k] = 0;
  }
  check("SV006", s.tech && Object.entries(TECHS).every(([k, t]) => integer(s.tech[k], t.max)));
  const ids = s.planets.map((p) => p.id);
  check("SV007", ids[0] === "home" && new Set(ids).size === ids.length && ids.every((id) => id === "home" || TARGETS.some((t) => t.id === id) || /^g-[a-z]+-p(?:[1-9]|10)$/.test(id)) && ids.includes(s.active));
  const cargo = (c) => c && RES.every((k) => isNum(c[k]));
  const job = (j, defs) => j === null || j && Object.hasOwn(defs, j.key) && isNum(j.start, 864e13) && isNum(j.end, 864e13) && j.start <= s.time && j.end >= s.time && j.end > j.start;
  for (const p of s.planets) {
    if (p.id.startsWith("g-")) check("SV008", typeof p.system === "string" && /^g-[a-z]+-p(?:[1-9]|10)$/.test(p.id) && isNum(p.x, 1200) && isNum(p.y, 1200) && integer(p.slot, 10) && p.slot > 0);
    check("SV009", text(p.name, 40) && text(p.coord, 30) && text(p.kind, 40) && /^#[0-9a-f]{6}$/i.test(p.color) && typeof p.ocean === "boolean" && isNum(p.energy, 10) && p.energy > 0 && isNum(p.distance, 100));
    check("SV010", Array.isArray(p.mult) && p.mult.length === 3 && p.mult.every((x) => isNum(x, 10)));
    p.reserves ??= { metal: 0, crystal: 0, fuel: 0 };
    check("SV011", cargo(p.reserves) && cargo(p.resources) && cargo(p.depot));
    for (const k of ["orbital", "bunker", "repairDock"]) if (p.buildings && !Object.hasOwn(p.buildings, k)) p.buildings[k] = 0;
    check("SV012", p.buildings && Object.keys(BUILDINGS).every((k) => integer(p.buildings[k], 30)));
    if (p.ships) {
      for (const k of Object.keys(SHIPS)) if (!["probe", "transport", "colony"].includes(k) && !Object.hasOwn(p.ships, k)) p.ships[k] = 0;
    }
    check("SV013", p.ships && Object.keys(SHIPS).every((k) => integer(p.ships[k], Number.MAX_SAFE_INTEGER)));
    check("SV014", job(p.build, BUILDINGS) && (!p.build || (p.build.kind === "demolish" ? p.build.level === p.buildings[p.build.key] - 1 : p.build.kind === void 0 && p.build.level === p.buildings[p.build.key] + 1)));
    if (p.build) {
      const j = p.build;
      if (j.kind === "demolish") check("SV015", j.refund && RES.every((k) => integer(j.refund[k], 1e12)) && integer(j.originalMs, 864e13) && j.originalMs > 0);
      else if (j.paid !== void 0 || j.originalMs !== void 0) check("SV016", j.paid && RES.every((k) => integer(j.paid[k], 1e12)) && integer(j.originalMs, 864e13) && j.originalMs > 0);
    }
    p.buildHistory ??= {};
    check("SV017", p.buildHistory && typeof p.buildHistory === "object" && !Array.isArray(p.buildHistory) && Object.keys(p.buildHistory).every((k) => Object.hasOwn(BUILDINGS, k)));
    for (const [key, levels] of Object.entries(p.buildHistory)) {
      check("SV018", levels && typeof levels === "object" && !Array.isArray(levels) && Object.keys(levels).length <= 30);
      for (const [lvl, info] of Object.entries(levels)) check("SV019", /^(?:[1-9]|[12][0-9]|30)$/.test(lvl) && Number(lvl) <= p.buildings[key] && info && typeof info === "object" && info.cost && RES.every((k) => integer(info.cost[k], 1e12)) && integer(info.ms, 864e13) && info.ms > 0);
    }
    check("SV020", job(p.shipjob, SHIPS) && (!p.shipjob || integer(p.shipjob.count, Number.MAX_SAFE_INTEGER) && p.shipjob.count > 0));
    p.orbitaljob ??= null;
    p.orbitalqueue ??= [];
    check("SV021", job(p.orbitaljob, SHIPS) && (!p.orbitaljob || SHIPS[p.orbitaljob.key].category === "defense"));
    check("SV022", Array.isArray(p.orbitalqueue) && p.orbitalqueue.length + (p.orbitaljob ? 1 : 0) <= SHIP_QUEUE_LEGACY_LIMIT && (!p.orbitalqueue.length || p.orbitaljob));
  }
  for (const p of s.planets) {
    p.disabledDefenses ??= {};
    check("SV023", p.disabledDefenses && typeof p.disabledDefenses === "object" && !Array.isArray(p.disabledDefenses) && Object.entries(p.disabledDefenses).every(([k, n]) => SHIPS[k]?.category === "defense" && integer(n, Number.MAX_SAFE_INTEGER)));
    p.repairQueue ??= [];
    check("SV024", Array.isArray(p.repairQueue) && p.repairQueue.length <= 20 && (!p.repairQueue.length || p.buildings.repairDock >= 1));
    for (const j of p.repairQueue) {
      check("SV025", j.restore === void 0 || j.restore === true && SHIPS[j.key]?.category === "defense");
      check("SV026", integer(j.id, s.seq) && j.id > 0 && Object.hasOwn(SHIPS, j.key) && isNum(j.start, s.time) && integer(j.count, 1e5) && j.count > 0 && integer(j.completed, j.count) && integer(j.lost, j.count) && isNum(j.factor, 1) && j.factor > 0 && Array.isArray(j.entries) && j.entries.length > 0 && j.entries.length + j.completed + j.lost === j.count);
      for (const e of j.entries) check("SV027", isNum(e.hp, 1) && (j.restore || e.hp > 0) && isNum(e.initialHp, 1) && (j.restore || e.initialHp > 0) && e.initialHp <= e.hp && isNum(e.workRemaining, 864e13) && e.credit && RES.every((k) => isNum(e.credit[k])) && e.credit.fuel === 0);
    }
  }
  const shipIds = [];
  for (const p of s.planets) {
    p.shipqueue ??= [];
    check("SV028", Array.isArray(p.shipqueue) && p.shipqueue.length + (p.shipjob ? 1 : 0) <= SHIP_QUEUE_LEGACY_LIMIT && (!p.shipqueue.length || !!p.shipjob));
    for (const j of [p.shipjob, ...p.shipqueue, p.orbitaljob, ...p.orbitalqueue].filter(Boolean)) {
      check("SV029", job(j, SHIPS) && integer(j.count, Number.MAX_SAFE_INTEGER) && j.count > 0);
      if (j === p.orbitaljob || p.orbitalqueue.includes(j)) check("SV030", SHIPS[j.key].category === "defense");
      const waiting = j !== p.shipjob && j !== p.orbitaljob;
      if (j.workTotal !== void 0 || j.workRemaining !== void 0) {
        check("SV031", isNum(j.workTotal, 864e13) && j.workTotal > 0 && isNum(j.workRemaining, j.workTotal) && typeof j.paused === "boolean");
        if (j.orderEnd !== void 0) check("SV032", isNum(j.orderEnd, 864e13) && j.orderEnd > j.start);
      }
      if (waiting) check("SV033", j.workRemaining === j.workTotal && j.payment !== void 0 && j.id !== void 0);
      if (j.id !== void 0) {
        check("SV034", integer(j.id, s.seq) && j.id > 0);
        shipIds.push(j.id);
      }
      if (j.payment !== void 0) check("SV035", j.payment && cargo(j.payment.resources) && cargo(j.payment.salvage) && RES.every((k, i) => Number.isSafeInteger(j.payment.resources[k]) && Number.isSafeInteger(j.payment.salvage[k]) && (j.payment.resources[k] + j.payment.salvage[k] === SHIPS[j.key].cost[i] * j.count || { "flak": [160, 80, 20], "laser": [450, 300, 70], "rail": [1400, 1e3, 280], "plasma": [4e3, 2800, 900] }[j.key]?.[i] * j.count === j.payment.resources[k] + j.payment.salvage[k] && j !== p.orbitaljob && !p.orbitalqueue.includes(j))) && j.payment.salvage.fuel === 0 && (SHIPS[j.key].category === "defense" || RES.every((k) => j.payment.salvage[k] === 0)));
    }
  }
  check("SV036", new Set(shipIds).size === shipIds.length);
  check("SV037", job(s.research, TECHS) && (!s.research || s.research.level === s.tech[s.research.key] + 1 && ids.includes(s.research.planet)));
  check("SV038", Array.isArray(s.discovered) && s.discovered.length <= 3 && new Set(s.discovered).size === s.discovered.length && s.discovered.every((id) => TARGETS.some((t) => t.id === id)));
  if (s.pveFleets !== void 0) check("SV039", Array.isArray(s.pveFleets) && s.pveFleets.length <= 50 && s.pveFleets.every((m) => m && m.fleet && typeof m.fleet === "object" && !Array.isArray(m.fleet) && Object.entries(m.fleet).every(([k, n]) => SHIPS[k]?.speed > 0 && integer(n, Number.MAX_SAFE_INTEGER) && n > 0)));
  check("SV040", Array.isArray(s.missions) && s.missions.length <= 100);
  const fleetOK = (f, military = false) => f && typeof f === "object" && !Array.isArray(f) && Object.keys(f).length > 0 && Object.entries(f).every(([k, n]) => (isFreighter(k) || military && ["military", "civil"].includes(SHIPS[k]?.category)) && integer(n, Number.MAX_SAFE_INTEGER) && n > 0);
  const repairIds = s.planets.flatMap((p) => p.repairQueue.map((j) => j.id));
  const eventIds = [...shipIds, ...repairIds];
  const order = (o) => o && RES.every((k) => o[k] === "max" || integer(o[k], 1e12));
  for (const m of s.missions) {
    check("SV041", integer(m.id, s.seq) && m.id > 0 && ids.includes(m.from) && ["probe", "colony", "transport", "deliver", "collect", "salvage", "station", "route"].includes(m.type) && Object.hasOwn(SHIPS, m.ship) && integer(m.count, Number.MAX_SAFE_INTEGER) && m.count > 0 && cargo(m.cargo) && ["outbound", "return"].includes(m.phase) && isNum(m.start, 864e13) && m.start <= s.time && isNum(m.due, 864e13) && m.due >= s.time && isNum(m.duration, 864e5) && m.duration > 0);
    if (["probe", "colony"].includes(m.type)) {
      check("SV042", m.ship === m.type && TARGETS.some((t) => t.id === m.to));
      check("SV043", m.type !== "colony" || m.phase === "outbound" && m.count === 1 && !ids.includes(m.to));
    } else {
      check("SV044", ids.includes(m.to) && m.from !== m.to);
      check("SV045", m.type === "station" || isFreighter(m.ship));
      if (m.type !== "transport") {
        const total2 = RES.reduce((a, k) => a + m.cargo[k], 0);
        const max = m.fleet ? Object.entries(m.fleet).reduce((a, [k, n]) => a + Math.floor((SHIPS[k]?.cargo || 0) * (1 + s.tech.logistics * 0.15)) * n, 0) : Math.floor(SHIPS[m.ship].cargo * (1 + s.tech.logistics * 0.15)) * m.count;
        check("SV046", total2 <= max);
      }
    }
    if (m.awaitingUnload !== void 0) check("SV047", ids.includes(m.awaitingUnload) && m.awaitingUnload === (m.type === "station" ? m.to : m.type === "route" ? m.home : m.from) && !["probe", "colony"].includes(m.type) && RES.some((k) => m.cargo[k] > 0) && (m.type === "station" || m.type === "route" && m.index === 0 || m.phase === "return"));
    if (m.finishTitle !== void 0) check("SV048", text(m.finishTitle, 80));
    if (m.type === "collect") check("SV049", order(m.order));
    if (m.type === "salvage") check("SV050", !!s.planets.find((p) => p.id === m.to)?.system && (!m.fleet || fleetOK(m.fleet)) && (m.phase !== "outbound" || RES.every((k) => m.cargo[k] === 0)));
    if (m.type === "station") check("SV051", m.phase === "outbound");
    if (m.fleet) check("SV052", ["transport", "route", "deliver", "collect", "salvage", "station"].includes(m.type) && fleetOK(m.fleet, m.type === "station") && m.fleet[m.ship] === m.count);
    if (m.pending) check("SV053", m.type === "route" && fleetOK(m.pending.fleet) && text(m.pending.name, 40) && m.pending.name.trim().length > 0 && typeof m.pending.repeat === "boolean" && Array.isArray(m.pending.stops) && m.pending.stops.length >= 2 && m.pending.stops.length <= 12 && m.pending.stops[0].planet === m.home && m.pending.stops.every((stop, i) => ids.includes(stop.planet) && stop.planet !== m.pending.stops[(i + 1) % m.pending.stops.length].planet && order(stop.load) && order(stop.unload)));
    if (m.paused !== void 0) check("SV054", m.type === "route" && typeof m.paused === "boolean" && (!m.paused || m.index === 0));
    if (m.pauseRequested !== void 0) check("SV055", m.type === "route" && typeof m.pauseRequested === "boolean");
    if (m.type === "route") {
      check("SV056", m.phase === "outbound" && text(m.name, 40) && typeof m.repeat === "boolean" && typeof m.stopping === "boolean" && integer(m.rounds, 1e12) && Array.isArray(m.stops) && m.stops.length >= 2 && m.stops.length <= 12 && ids.includes(m.home) && m.stops[0].planet === m.home && integer(m.index, m.stops.length - 1));
      check("SV057", m.stops.every((stop, i) => ids.includes(stop.planet) && stop.planet !== m.stops[(i + 1) % m.stops.length].planet && order(stop.load) && order(stop.unload)) && m.to === m.stops[m.index].planet && m.from === m.stops[(m.index + m.stops.length - 1) % m.stops.length].planet);
    }
    if (m.stats !== void 0) {
      const z = m.stats, amounts = (v) => v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === RES.length && RES.every((k) => isNum(v[k], Number.MAX_SAFE_INTEGER));
      check("SV058", m.type === "route" && z && typeof z === "object" && !Array.isArray(z) && Object.keys(z).length === 7 && isNum(z.since, s.time) && integer(z.roundsAtStart, m.rounds) && integer(z.stops, Number.MAX_SAFE_INTEGER) && amounts(z.loaded) && amounts(z.delivered) && integer(z.fuelPaid, Number.MAX_SAFE_INTEGER));
      if (z.last !== null) {
        const a = z.last;
        check("SV059", a && typeof a === "object" && !Array.isArray(a) && Object.keys(a).length === 5 && isNum(a.at, s.time) && a.at >= z.since && ids.includes(a.planet) && ["started", "stop", "round", "unload", "resumed"].includes(a.kind) && amounts(a.loaded) && amounts(a.delivered));
      }
    }
    eventIds.push(m.id);
  }
  check("SV060", new Set(eventIds).size === eventIds.length);
  check("SV061", Array.isArray(s.reports) && s.reports.length <= 60 && s.reports.every((r) => integer(r.id, s.seq) && isNum(r.time, 864e13) && r.time <= s.time && text(r.title, 100) && text(r.body, 1e3)));
  const hullOK = (hulls, fleet) => hulls === void 0 || hulls && typeof hulls === "object" && !Array.isArray(hulls) && Object.entries(hulls).every(([k, hp]) => Object.hasOwn(SHIPS, k) && Array.isArray(hp) && hp.length <= (fleet[k] || 0) && hp.every((x) => typeof x === "number" && Number.isFinite(x) && x > 0 && x < 1));
  for (const p of s.planets) check("SV062", hullOK(p.hulls, p.ships));
  for (const m of s.missions) check("SV063", hullOK(m.hulls, m.fleet || { [m.ship]: m.count }));
  return s;
}

// src/galaxy.js
function galaxyFlight(s, from, target, start, ship = "longProbe") {
  const destination = { ...target, system: target.system || target.id || "galaxy", slot: target.slot || 1 };
  const f = sharedFlight(s, from, destination, 1, ship, start);
  return { ...f, fuel: f.fuel * (ship === "longProbe" ? 2 : 1) };
}

// src/server-world.js
var COLONY_PROTECTION = 36e5;
var ms = (v) => typeof v === "number" ? v : Date.parse(v);
var zero = () => vector([0, 0, 0]);
function log(s, time, title, body) {
  s.reports.unshift({ id: ++s.seq, time: Math.max(time, s.time), title, body: body.slice(0, 1e3) });
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
function validateWorldSave(state, phase) {
  try {
    return validateSave(state);
  } catch (error) {
    if (error instanceof SaveValidationError) {
      error.code = "WORLD_SAVE_INVALID";
      error.phase = phase;
      error.status = 503;
      error.message += " Diagnose: " + phase + "/" + error.rule + ".";
    }
    throw error;
  }
}
function prepareWorld(snapshot) {
  const w = structuredClone(snapshot);
  w.now = ms(w.now);
  w.saves = w.saves.map((row) => ({ ...row, state: validateWorldSave(row.state, "stored") }));
  w.partners = (w.partners || []).filter((p) => p.status !== "ended");
  w.socialMissions = (w.socialMissions || []).filter((m) => !["returned", "lost"].includes(m.status));
  w.trades = (w.trades || []).filter((t) => t.status === "offered" && t.expires > w.now);
  w.attacks ??= [];
  w.missions ??= [];
  w.surveys ??= [];
  w.planets ??= [];
  w.starts ??= [];
  w.admins ??= [];
  for (const p of w.planets) if (p.colonized_at) p.colonized_at = ms(p.colonized_at);
  for (const m of w.missions) for (const key of ["started_at", "arrival_at", "finish_at"]) m[key] = ms(m[key]);
  preparePirates(w);
  return w;
}
function stateOf(w, id) {
  const row = w.saves.find((x) => x.user_id === id);
  if (!row) throw Error("Spielstand fehlt.");
  return row.state;
}
function makeColony(meta, time) {
  return { ...meta, colonizedAt: time, resources: vector([350, 250, 100]), depot: zero(), reserves: zero(), buildings: { ...Object.fromEntries(Object.keys(BUILDINGS).map((k) => [k, 0])), solar: 2 }, ships: Object.fromEntries(Object.keys(SHIPS).map((k) => [k, 0])), build: null, shipjob: null };
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
  if (!w.surveys.some((q) => q.user_id === m.user_id && q.planet_id === m.planet_id)) w.surveys.push({ user_id: m.user_id, planet_id: m.planet_id });
}
function shieldFactor(until, time) {
  return until ? Math.max(0, Math.min(1, 1 - (until - time) / 3e5)) : 1;
}
function resolveAttack(w, m, time) {
  const a = stateOf(w, m.attacker_id), target = w.planets.find((p2) => p2.id === m.to), row = w.saves.find((x) => x.user_id === m.defender_id);
  if (!target || target.owner_id !== m.defender_id || target.reserved || !row || !target.protection_ended && time < (target.colonized_at || time) + COLONY_PROTECTION) {
    m.status = "returning";
    m.survivors = { ...m.fleet };
    m.return_hulls = m.hulls;
    m.cargo = zero();
    m.resolved_at = w.now;
    m.report = { outcome: "cancelled", at: time, reason: "Das Ziel ist nicht mehr angreifbar." };
    log(a, time, "Angriff abgebrochen", m.report.reason);
    return;
  }
  const d = row.state, p = getPlanet(d, m.to), defense = { fleet: { ...p.ships }, tech: { ...d.tech }, hulls: p.hulls, shieldFactor: shieldFactor(p.shieldUntil, time) };
  const pausedRoutes = d.missions.filter((r) => r.awaitingUnload === m.to || r.type === "route" && r.paused && r.home === m.to);
  const parked = pausedRoutes.map((r) => ({ id: "route:" + r.id, owner: m.defender_id, commander: d.name + " \xB7 " + (r.name || "Wartet auf Lagerplatz"), fleet: { ...r.fleet || { [r.ship]: r.count } }, hulls: r.hulls, tech: { ...d.tech }, shieldFactor: shieldFactor(r.shieldUntil, time) }));
  const dockedRaids = w.attacks.filter((r) => r.awaitingUnload && r.status === "returning" && r.attacker_id === m.defender_id && r.from === m.to);
  parked.push(...dockedRaids.map((r) => ({ id: "raid:" + r.id, owner: m.defender_id, commander: d.name + " \xB7 R\xFCckkehrende Angriffsflotte", fleet: r.survivors, hulls: r.return_hulls, tech: r.combat.tech, shieldFactor: shieldFactor(r.shieldUntil, time) })));
  const pveParked = pirateDefense(w, m.defender_id, m.to);
  parked.push(...pveParked);
  const repairs = repairDefense(p, m.defender_id, d.name, { ...d.tech }, shieldFactor(p.shieldUntil, time));
  const supporting = socialDefense(w, m.defender_id, m.to, time);
  if (supporting.length || parked.length || repairs.length) defense.groups = [{ id: "host", owner: m.defender_id, commander: d.name, ...defense }, ...parked, ...repairs, ...supporting];
  const version = m.ruleVersion || 1;
  const resolver = [4, 5, 6].includes(version) ? resolveBattleHybrid : resolveBattle;
  const result2 = [4, 5, 6].includes(version) ? resolver({ ...m.combat, shieldFactor: shieldFactor(m.shieldUntil, time) }, defense, m.seed || m.id, version, version === 6 ? m.combatConfig || REALM_COMBAT_OVERRIDES.test4 : {}) : resolver({ ...m.combat, shieldFactor: shieldFactor(m.shieldUntil, time) }, defense, m.seed || m.id, version);
  if (pveParked.length) reconcilePirateDefense(w, m.defender_id, pveParked, result2, time);
  const repairBefore = Object.fromEntries(Object.keys(SHIPS).map((k) => [k, repairs.reduce((n, g) => n + (g.fleet[k] || 0), 0)]));
  if (repairs.length) reconcileRepairBattle(p, result2);
  const repairAfter = Object.fromEntries(Object.keys(SHIPS).map((k) => [k, (p.repairQueue || []).filter((j) => j.key === k && !j.restore).reduce((n, j) => n + j.entries.length, 0)]));
  const before = { ...p.ships }, homeResult = result2.defenderGroups?.find((g) => g.id === "host") || result2.defender;
  for (const r of pausedRoutes) {
    const after = result2.defenderGroups.find((g) => g.id === "route:" + r.id);
    r.fleet = after.fleet;
    r.hulls = after.hulls;
    let room = fleetCapacity(d, r.fleet);
    for (const k of RES) {
      r.cargo[k] = Math.min(r.cargo[k], room);
      room -= r.cargo[k];
    }
    r.shieldUntil = time + 3e5;
    if (!Object.keys(r.fleet).length) {
      d.missions = d.missions.filter((x) => x.id !== r.id);
      log(d, time, "Gebundene Flotte zerst\xF6rt", r.name || "Restladung wartet auf Lagerplatz");
    } else {
      [r.ship, r.count] = Object.entries(r.fleet)[0];
    }
  }
  for (const r of dockedRaids) {
    const after = result2.defenderGroups.find((g) => g.id === "raid:" + r.id);
    r.survivors = after.fleet;
    r.return_hulls = after.hulls;
    r.shieldUntil = time + 3e5;
    let room = fleetCapacity({ tech: r.combat.tech }, r.survivors);
    for (const k of RES) {
      r.cargo[k] = Math.min(r.cargo[k], room);
      room -= r.cargo[k];
    }
    if (!Object.keys(r.survivors).length) {
      r.status = "returned";
      delete r.awaitingUnload;
    }
  }
  const hostBefore = Object.fromEntries(Object.keys(SHIPS).map((k) => [k, before[k] + repairBefore[k] + parked.reduce((n, g) => n + (g.fleet[k] || 0), 0)]));
  const hostAfter = Object.fromEntries(Object.keys(SHIPS).map((k) => [k, (homeResult.fleet[k] || 0) + repairAfter[k] + pausedRoutes.reduce((n, r) => n + (r.fleet[k] || 0), 0) + dockedRaids.reduce((n, r) => n + (r.survivors[k] || 0), 0) + pveParked.reduce((n, g) => n + (g.fleet[k] || 0), 0)]));
  const supportReports = [];
  for (const group of supporting) {
    const after = result2.defenderGroups.find((g) => g.id === group.id), mission = w.socialMissions.find((x) => x.id === group.id);
    mission.fleet = after.fleet;
    mission.hulls = after.hulls;
    let cargoRoom = fleetCapacity(stateOf(w, mission.owner), mission.fleet);
    for (const k of RES) {
      mission.cargo[k] = Math.min(mission.cargo[k], cargoRoom);
      cargoRoom -= mission.cargo[k];
    }
    mission.shieldUntil = time + 3e5;
    if (!Object.keys(after.fleet).length) {
      mission.status = "lost";
      delete mission.awaitingUnload;
    }
    supportReports.push({ owner: group.owner, commander: group.commander, before: group.fleet, after: after.fleet });
    log(stateOf(w, group.owner), time, "PvP-Kampfbericht", "Deine Unterst\xFCtzung auf " + p.name + " hat mitverteidigt. \xDCbrig: " + fleetText(after.fleet));
  }
  recordDisabledDefenses(p, before, homeResult.fleet);
  for (const key of Object.keys(SHIPS)) p.ships[key] = homeResult.fleet[key] || 0;
  p.hulls = homeResult.hulls;
  p.shieldUntil = time + 3e5;
  p.defenseSalvage ??= zero();
  for (const k of RES) p.defenseSalvage[k] += result2.defenseRepair[k];
  const bunker = Math.min(2e3, capacity(p) * 0.025 * (p.buildings.bunker || 0));
  const cap = fleetCapacity({ tech: m.combat.tech }, result2.attacker.fleet);
  const field = vector(RES.map((k) => (target.debris?.[k] || 0) + result2.debris[k]));
  const cargo = loadPlunder(p.resources, p.depot, bunker, cap, field, result2.outcome === "attacker");
  withdraw(p, cargo.loot);
  target.debris ??= zero();
  for (const k of RES) target.debris[k] = field[k] - cargo.salvage[k];
  m.status = Object.keys(result2.attacker.fleet).length ? "returning" : "returned";
  m.resolved_at = w.now;
  m.survivors = result2.attacker.fleet;
  m.return_hulls = result2.attacker.hulls;
  m.cargo = cargo.cargo;
  m.shieldUntil = time + 3e5;
  if (result2.trace) result2.trace.participants = { attacker: a.name, defender: d.name + (supporting.length ? " mit " + supporting.map((g) => g.commander).join(", ") : "") };
  m.report = { at: time, outcome: result2.outcome, ruleVersion: m.ruleVersion || 1, traceAvailable: !!result2.trace, ...result2.trace ? { trace: result2.trace } : {}, rounds: result2.rounds, attackerBefore: m.fleet, attackerAfter: m.survivors, defenderBefore: Object.fromEntries(Object.keys(SHIPS).map((k) => [k, hostBefore[k] + supporting.reduce((n, g) => n + (g.fleet[k] || 0), 0)])), defenderAfter: Object.fromEntries(Object.keys(SHIPS).map((k) => [k, result2.defender.fleet[k] || 0])), hostBefore, hostAfter, ...supporting.length ? { supporting: supportReports } : {}, loot: cargo.loot, salvage: cargo.salvage, debrisLeft: { ...target.debris }, defenseRepair: result2.defenseRepair };
  const outcome = result2.outcome === "attacker" ? "Angreifer gewinnt" : result2.outcome === "defender" ? "Verteidiger gewinnt" : "Unentschieden";
  const body = outcome + " \xB7 " + target.meta.name + " \xB7 " + result2.rounds.length + " Runden. Angreifer \xFCbrig: " + fleetText(m.survivors) + ". Beute M/K/T: " + RES.map((k) => cargo.loot[k]).join("/") + ". Tr\xFCmmer geborgen M/K: " + cargo.salvage.metal + "/" + cargo.salvage.crystal + ".";
  log(a, time, "PvP-Kampfbericht", body);
  log(d, time, "PvP-Kampfbericht", body);
}
function returnAttack(w, m, time) {
  const s = stateOf(w, m.attacker_id), p = getPlanet(s, m.from);
  unloadCargo(p, m.cargo || zero());
  if (cargoPresent(m.cargo || zero())) {
    if (!m.awaitingUnload) log(s, time, "Angriffsflotte wartet auf Lagerplatz", "Restladung bleibt an Bord; Schiffe und Angriffsplatz bleiben gebunden.");
    m.awaitingUnload = true;
    return;
  }
  delete m.awaitingUnload;
  for (const [k, n] of Object.entries(m.survivors || {})) p.ships[k] += n;
  putHulls(p, m.return_hulls);
  p.shieldUntil = Math.max(p.shieldUntil || 0, m.shieldUntil || 0);
  log(s, time, "Angriffsflotte zur\xFCckgekehrt", fleetText(m.survivors || {}) + " \xB7 Ladung wurde eingelagert.");
  m.status = "returned";
}
function settleRaidCargo(w, time) {
  for (const m of w.attacks) if (m.awaitingUnload && m.status === "returning") returnAttack(w, m, time);
}
function collectWorldDebris(w, uid, s, m) {
  const target = w.planets.find((p) => p.id === m.to);
  if (!target || target.owner_id !== uid || target.reserved) return;
  target.debris ??= zero();
  let room = fleetCapacity(s, m.fleet || { [m.ship]: m.count });
  for (const k of RES) {
    const amount = Math.min(room, Math.floor(target.debris[k] || 0));
    m.cargo[k] = amount;
    target.debris[k] -= amount;
    room -= amount;
  }
}
function advanceWorld(w) {
  let guard = 0;
  while (true) {
    const events = [...socialEvents(w), ...pirateEvents(w)];
    for (const row of w.saves) for (const m of row.state.missions) if (m.type === "salvage" && m.phase === "outbound") events.push({ time: m.due, id: row.user_id + ":" + String(m.id).padStart(12, "0"), kind: "salvage", order: -1 });
    for (const m of w.missions) if (!m.completed) {
      if (m.kind === "scan" && !w.surveys.some((q) => q.user_id === m.user_id && q.planet_id === m.planet_id)) events.push({ time: m.arrival_at, id: m.id, kind: "survey", mission: m, order: 0 });
      events.push({ time: m.finish_at, id: m.id, kind: "galaxy", mission: m, order: 1 });
    }
    for (const m of w.attacks) if (m.status === "outbound") events.push({ time: m.arrival_at, id: m.id, kind: "battle", mission: m, order: 2 });
    else if (m.status === "returning") {
      const p = getPlanet(stateOf(w, m.attacker_id), m.from);
      if (!m.awaitingUnload) events.push({ time: m.return_at, id: m.id, kind: "return", mission: m, order: 3 });
      else {
        const time = nextCargoSpaceEvent(stateOf(w, m.attacker_id), p);
        if (Number.isFinite(time)) events.push({ time, id: m.id, kind: "return", mission: m, order: 3 });
      }
    }
    events.sort((a, b) => a.time - b.time || a.order - b.order || a.id.localeCompare(b.id));
    const e = events[0];
    if (!e || e.time > w.now) break;
    if (++guard > 1e4) throw Error("Zu viele f\xE4llige Ereignisse.");
    for (const row of w.saves) advance(row.state, e.time, (s, m) => collectWorldDebris(w, row.user_id, s, m));
    refreshPirates(w, e.time);
    if (e.kind === "pirate") arrivePirate(w, e.owner, e.mission, e.time);
    if (e.kind === "survey") survey(w, e.mission);
    if (e.kind === "galaxy") finishGalaxy(w, e.mission, e.time);
    if (e.kind === "battle") resolveAttack(w, e.mission, e.time);
    if (e.kind === "social") arriveSocial(w, e.mission, e.time);
    if (e.kind === "return") returnAttack(w, e.mission, e.time);
    settleSocialCargo(w, e.time);
    settleRaidCargo(w, e.time);
    settlePirates(w, e.time);
  }
  for (const row of w.saves) advance(row.state, w.now, (s, m) => collectWorldDebris(w, row.user_id, s, m));
  settleSocialCargo(w, w.now);
  settleRaidCargo(w, w.now);
  settlePirates(w, w.now);
  refreshPirates(w, w.now);
  return w;
}
function launchGalaxy(w, uid, action, id) {
  const s = stateOf(w, uid), p = getPlanet(s, action.from), target = w.planets.find((p2) => p2.id === action.to), kind = action.kind;
  if (!["scan", "colony"].includes(kind) || !target) throw Error("Unbekannte Galaxiemission.");
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
  subtract(p, vector([kind === "colony" ? 350 : 0, kind === "colony" ? 250 : 0, f.fuel + (kind === "colony" ? 100 : 0)]));
  p.ships[ship]--;
  if (kind === "colony") {
    target.owner_id = uid;
    target.reserved = true;
  }
  w.missions.push({ id, user_id: uid, kind, from_id: p.id, planet_id: target.id, started_at: w.now, arrival_at: w.now + f.ms, finish_at: w.now + f.ms * (kind === "scan" ? 2 : 1), completed: false });
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
  const slots = attackSlots(s.tech.military || 0);
  if (w.attacks.filter((m) => m.attacker_id === uid && m.status !== "returned").length + (w.piratePlayers?.find((r) => r.user_id === uid)?.missions.filter((m) => m.kind === "attack").length || 0) >= slots) throw Error("Alle " + slots + " Angriffspl\xE4tze sind belegt. Milit\xE4rtechnik 1 / 5 / 10 erlaubt 1 / 2 / 4 gleichzeitige Angriffsflotten.");
  const fleet = attackFleet(action.fleet);
  for (const [k, n] of Object.entries(fleet)) if ((from.ships[k] || 0) < n) throw Error("Nicht gen\xFCgend verf\xFCgbare Schiffe.");
  const f = attackFlight(s, from, target.meta, fleet), defender = stateOf(w, target.owner_id), fraction = warningFraction(defender.tech.scout || 0);
  subtract(from, vector([0, 0, f.fuel]));
  const hulls = takeHulls(from, fleet);
  for (const [k, n] of Object.entries(fleet)) from.ships[k] -= n;
  if (origin) origin.protection_ended = true;
  else for (const p of colonies) p.protection_ended = true;
  w.attacks.push({ id, attacker_id: uid, defender_id: target.owner_id, from: from.id, to: target.id, fleet, hulls, ruleVersion: [3, 4, 5, 6].includes(w.settings.combat_engine) ? w.settings.combat_engine : COMBAT_RULE_VERSION, combat: { fleet, tech: { ...s.tech }, hulls }, ...w.settings.combat_engine === 6 ? { combatConfig: structuredClone(REALM_COMBAT_OVERRIDES.test4) } : {}, shieldUntil: from.shieldUntil || 0, started_at: w.now, warning_at: w.now + Math.ceil(f.ms * fraction), arrival_at: w.now + f.ms, return_at: w.now + 2 * f.ms, status: "outbound", fuel: f.fuel, slowest: f.slowest });
}
function processWorld(snapshot, uid, request) {
  const w = advanceWorld(prepareWorld(snapshot)), type = request.type, action = request.action || {};
  if (!w.saves.some((r) => r.user_id === uid)) {
    if (type !== "new") return w;
    const name = String(request.name || "Commander").trim().slice(0, 30) || "Commander";
    w.saves.push({ user_id: uid, revision: 0, state: newGame(name, w.now) });
  }
  const s = stateOf(w, uid), start = w.starts.find((x) => x.user_id === uid);
  if (start) s.galaxy = { x: start.x, y: start.y };
  if (type === "command") {
    if (!["build", "demolish", "research", "ship", "probe", "colony", "transport", "reserve", "edit-route", "cancel-route-edit", "stop-route", "pause-route", "resume-route", "cancel-route-pause", "station", "collect", "salvage", "route", "deliver", "repair", "cancel-repair", "resume-repair", "cancel-ship"].includes(action.type)) throw Error("Unbekannte Spielaktion.");
    if (action.type === "salvage") {
      const target = w.planets.find((p) => p.id === action.to);
      if (!target || target.owner_id !== uid || target.reserved) throw Error("W\xE4hle eine eigene besiedelte Galaxiekolonie mit Tr\xFCmmern.");
      if (!RES.some((k) => (target.debris?.[k] || 0) > 0)) throw Error("An diesem Planeten liegen keine Tr\xFCmmer.");
    }
    const updated = act(s, action, w.now);
    w.saves.find((r) => r.user_id === uid).state = updated;
  } else if (type === "pirate") pirateAction(w, uid, action, request.eventId || request.requestId, request.combatSeed || request.requestId);
  else if (type === "social") socialAction(w, uid, action, request.eventId || request.requestId);
  else if (type === "galaxy") launchGalaxy(w, uid, action, request.eventId || request.requestId);
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
  } else if (!["new", "sync"].includes(type)) throw Error("Unbekannte Anfrage.");
  settleSocialCargo(w, w.now);
  settleRaidCargo(w, w.now);
  settlePirates(w, w.now);
  refreshPirates(w, w.now);
  pirateFleetShadows(w);
  for (const row of w.saves) row.state = validateWorldSave(row.state, "processed");
  return w;
}
function projectPvP(w, uid) {
  return {
    enabled: w.settings.enabled,
    combatEngine: [3, 4, 5, 6].includes(w.settings.combat_engine) ? w.settings.combat_engine : COMBAT_RULE_VERSION,
    isAdmin: w.admins.includes(uid),
    serverNow: w.now,
    social: socialProjection(w, uid),
    pirates: projectPirates(w, uid),
    features: { routeStatistics: true, pirates: w.pirateVersion === 1, piratesPublic: w.pirateVersion === 1, orbitalRestoration: true, buildingDemolition: true, repairDock: true, debrisSalvage: true, shipQueue: true, partnerOrigins: true, cargoRetention: true, attackSlots: true, fleetPlanning: true, partnerships: w.socialVersion === 1, flightRules: GALAXY_FLIGHT_RULE_VERSION, routePause: true, shipyardEnergy: true, orbitalProduction: true, cancelShip: true, combatRules: [3, 4, 5, 6].includes(w.settings.combat_engine) ? w.settings.combat_engine : COMBAT_RULE_VERSION, combatTrace: true },
    attackCapacity: attackSlots(w.saves.find((r) => r.user_id === uid)?.state.tech.military || 0),
    homeAttacks: true,
    protectionMs: COLONY_PROTECTION,
    debris: w.planets.filter((p) => p.owner_id === uid && !p.reserved).map((p) => ({ planet: p.id, ...p.debris || zero() })),
    colonies: w.planets.filter((p) => p.owner_id && !p.reserved).map((p) => ({ id: p.id, protectedUntil: p.protection_ended ? 0 : (p.colonized_at || w.now) + COLONY_PROTECTION })),
    outgoing: w.attacks.filter((m) => m.attacker_id === uid && m.status !== "returned").map((m) => ({ id: m.id, from: m.from, to: m.to, fleet: m.status === "outbound" ? m.fleet : m.survivors, status: m.status, awaitingUnload: !!m.awaitingUnload, cargo: { ...m.cargo || zero() }, arrival: m.arrival_at, returnAt: m.return_at })),
    incoming: w.attacks.filter((m) => m.defender_id === uid && m.status === "outbound" && m.warning_at <= w.now).map((m) => ({ id: m.id, to: m.to, commander: w.saves.find((r) => r.user_id === m.attacker_id)?.state.name || "Commander", arrival: m.arrival_at })),
    reports: w.attacks.filter((m) => (m.attacker_id === uid || m.defender_id === uid || m.report?.supporting?.some((g) => g.owner === uid)) && m.report).sort((a, b) => b.arrival_at - a.arrival_at).slice(0, 30).map((m) => {
      const support = m.report.supporting?.filter((g) => g.owner === uid), isAttacker = m.attacker_id === uid;
      return { id: m.id, from: m.from, to: m.to, returnAt: m.return_at, ...Object.fromEntries(Object.entries(m.report).filter(([key]) => key !== "trace")), ownSide: isAttacker ? "attacker" : "defender", isSupport: !!support?.length, attackerName: stateOf(w, m.attacker_id).name, defenderName: stateOf(w, m.defender_id).name, ownBefore: support?.length ? Object.fromEntries(Object.keys(SHIPS).map((k) => [k, support.reduce((n, g) => n + (g.before[k] || 0), 0)])) : isAttacker ? m.report.attackerBefore : m.report.hostBefore || m.report.defenderBefore, ownAfter: support?.length ? Object.fromEntries(Object.keys(SHIPS).map((k) => [k, support.reduce((n, g) => n + (g.after[k] || 0), 0)])) : isAttacker ? m.report.attackerAfter : m.report.hostAfter || m.report.defenderAfter };
    })
  };
}

// src/server-service.js
var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var value = (result2) => {
  if (result2.error) {
    const e = Error(result2.error.message);
    e.status = 503;
    throw e;
  }
  return result2.data;
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
  if (input.type === "set-combat") {
    if (![3, 4, 5, 6].includes(input.engine)) throw Error("Unbekannte Kampfengine.");
    value(await db.rpc("imperium_set_combat_engine", { p_uid: uid, p_engine: input.engine }));
    return runServerCommand(db, uid, { type: "sync" });
  }
  const requestId = mutating ? input.requestId : null;
  const eventId = mutating ? await missionId(uid, requestId) : null, combatSeed = crypto.randomUUID();
  for (let retry = 0; retry < 5; retry++) {
    const snapshot = value(await db.rpc("imperium_pvp_snapshot", { p_uid: uid, p_request_id: requestId }));
    if (snapshot.receipt && JSON.stringify(snapshot.receipt) !== JSON.stringify(input)) {
      const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v;
      if (JSON.stringify(canonical(snapshot.receipt)) !== JSON.stringify(canonical(input))) throw Error("Diese Auftrags-ID wurde bereits anders verwendet.");
    }
    const w = processWorld(snapshot, uid, snapshot.receipt ? { type: "sync" } : { ...input, eventId, combatSeed });
    const ok = value(await db.rpc("imperium_pvp_commit", { p_world: w, p_expected: snapshot.settings.epoch, p_uid: uid, p_request_id: requestId, p_payload: input }));
    if (!ok) continue;
    const row = value(await db.from("game_saves").select("state,revision").eq("user_id", uid).maybeSingle());
    return { state: row?.state || null, revision: row?.revision || 0, pvp: projectPvP(w, uid) };
  }
  throw Error("Mehrere gleichzeitige Aktionen. Bitte erneut versuchen.");
}

// supabase/functions/game-command/index.ts
var headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Nur POST erlaubt." }), { status: 405, headers });
  try {
    const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return new Response(JSON.stringify({ error: "Bitte anmelden." }), { status: 401, headers });
    const db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return new Response(JSON.stringify({ error: "Anmeldung abgelaufen." }), { status: 401, headers });
    const raw = await req.text();
    if (raw.length > 32e3) return new Response(JSON.stringify({ error: "Anfrage zu gro\xDF." }), { status: 413, headers });
    const result2 = await runServerCommand(db, data.user.id, JSON.parse(raw));
    return new Response(JSON.stringify(result2), { headers });
  } catch (error) {
    if (error?.code === "WORLD_SAVE_INVALID") {
      const diagnostic = { code: error.code, phase: error.phase, rule: error.rule };
      console.error("world_save_validation_failed", JSON.stringify(diagnostic));
      return new Response(JSON.stringify({ error: error.message, ...diagnostic }), { status: 503, headers });
    }
    const status = error instanceof Error && "status" in error ? Number(error.status) : 400;
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Serverfehler." }), { status, headers });
  }
});
