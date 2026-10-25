// Haupt-Realm: zentral anpassbare Balance-Werte.
// Energieexponenten sind pro Planetentyp und Kraftwerk getrennt konfigurierbar.
// fuelPower ist fuer ein kuenftiges Treibstoffkraftwerk reserviert (noch ohne Effekt).
export const REALM_CONFIG = Object.freeze({
  galaxyFlightTimeFactor: 3,
  // Rapid Fire v6 rules; the active combat engine is selected by the administrator.
  combat: Object.freeze({
    rapidFire: Object.freeze({
      enabled: true,
      maxExtraSalvos: 3,
      allowInOrbitalOpening: false,
      // Chance per additional salvo, 0..1. All other attacker->target pairs: 0.
      chances: Object.freeze({
        waechter: Object.freeze({falke: 0.20}),
        donner: Object.freeze({flak: 0.15,laser: 0.15}),
        titan: Object.freeze({falke: 0.10})
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
export function powerExponent(kind, plant) {
  return (REALM_CONFIG.powerExponents[kind] || REALM_CONFIG.powerExponents.default)[plant]
    ?? REALM_CONFIG.powerExponents.default[plant];
}

// Realm-specific overrides can be provided by each realm's server configuration.
// Deep merge only the Rapid Fire fields; never share mutable maps across realms.
export function combatConfigForRealm(overrides={}){
 const base=REALM_CONFIG.combat.rapidFire,patch=overrides.combat?.rapidFire||{};
 const chances=patch.replaceChances?{}:Object.fromEntries(Object.entries(base.chances).map(([ship,pairs])=>[ship,{...pairs}]));
 for(const [ship,pairs] of Object.entries(patch.chances||{}))chances[ship]={...(chances[ship]||{}),...pairs};
 const settings={enabled:patch.enabled??base.enabled,maxExtraSalvos:patch.maxExtraSalvos??base.maxExtraSalvos,
  allowInOrbitalOpening:patch.allowInOrbitalOpening??base.allowInOrbitalOpening,chances};
 if(typeof settings.enabled!=='boolean'||typeof settings.allowInOrbitalOpening!=='boolean'||
 !Number.isSafeInteger(settings.maxExtraSalvos)||settings.maxExtraSalvos<0||settings.maxExtraSalvos>10)
  throw Error('Ungültige Realm Rapid-Fire-Einstellungen.');
 for(const pairs of Object.values(chances))for(const chance of Object.values(pairs))
  if(typeof chance!=='number'||!Number.isFinite(chance)||chance<0||chance>1)throw Error('Ungültige Rapid-Fire-Chance.');
 return {rapidFire:settings};
}

// Add an entry for each realm when multi-realm support is enabled.
// "main" uses the defaults above. "test" is an example of a separate balance profile.
export const REALM_COMBAT_OVERRIDES=Object.freeze({
 main: Object.freeze({}),
 test: Object.freeze({combat: Object.freeze({rapidFire: Object.freeze({
  maxExtraSalvos: 2,
  chances: Object.freeze({titan:Object.freeze({falke:0.15})})
 })})}),
 test2: Object.freeze({combat: Object.freeze({rapidFire: Object.freeze({
  maxExtraSalvos: 1,
  chances: Object.freeze({
   waechter: Object.freeze({falke:1}),
   donner: Object.freeze({flak:1,laser:1}),
   titan: Object.freeze({falke:1})
  })
 })})}),
 // Test4: Rollenbasierte Rapid-Fire-Matrix, ohne klassische Schadensboni.
 test4: Object.freeze({combat: Object.freeze({
  rapidFire:Object.freeze({
   enabled:true,maxExtraSalvos:3,allowInOrbitalOpening:true,
   replaceChances:true,
   chances:Object.freeze({
    falke:Object.freeze({donner:.20,titan:.40}),
    waechter:Object.freeze({falke:.75,flak:.25}),
    donner:Object.freeze({waechter:.25,flak:.85,laser:.75,rail:.60,plasma:.40}),
    titan:Object.freeze({waechter:.40,donner:.50,flak:.60,laser:.40,rail:.20}),
    flak:Object.freeze({falke:.80,waechter:.20}),
    laser:Object.freeze({falke:.40,waechter:.60}),
    rail:Object.freeze({donner:.60,titan:.40}),
    plasma:Object.freeze({donner:.40,titan:.60})
   })
  })
 })})
});
export function combatConfigForRealmId(realmId='main'){
 if(!Object.hasOwn(REALM_COMBAT_OVERRIDES,realmId))throw Error('Unbekanntes Realm: '+realmId);
 return combatConfigForRealm(REALM_COMBAT_OVERRIDES[realmId]);
}

// REALM-INVENTAR — Stand 2026-10-25. NUR DOKUMENTATION, keine aktiven Overrides.
// Jede ID verweist auf REALM-CANDIDATE[ID] in der Originaldatei.
// Nicht einfach auskommentieren: zuerst Verbraucher, Validierung, SQL und UI verdrahten.
// Tabellenwerte sind ein Snapshot; die Originaldatei bleibt bis zur Migration maßgeblich.
// Legacy-Grenzen und Validierungsobergrenzen sind Kompatibilitätsregeln, keine freien Balance-Regler.
// Bereits aktiv: galaxyFlightTimeFactor, powerExponents und Combat-Overrides oben.
// Piraten haben bereits eigene Defaults + Live-Admin-Konfiguration in pirate_world.
// Vorschlag für die spätere gemeinsame Struktur:
// pendingRealmConfig: {
//   // [buildings] src/config.js
//   buildings: {
//     "metal": {"cost":[80,35,0],"time":8},
//     "crystal": {"cost":[65,60,0],"time":9},
//     "fuel": {"cost":[90,50,0],"time":10},
//     "solar": {"cost":[75,40,0],"time":8},
//     "warehouse": {"cost":[120,60,0],"time":10},
//     "lab": {"cost":[150,100,0],"time":12},
//     "shipyard": {"cost":[200,100,0],"time":12,"requires":{"building":"lab","level":1}},
//     "robotics": {"cost":[400,300,60],"time":20,"requires":{"tech":"engineering","level":1}},
//     "repairDock": {"cost":[1200,800,300],"time":60,"requires":{"building":"shipyard","level":2}},
//     "orbital": {"cost":[200,100,0],"time":60,"requires":{"tech":"military","level":1}},
//     "bunker": {"cost":[450,300,80],"time":45,"requires":{"tech":"military","level":1}},
//     "tidal": {"cost":[700,450,80],"time":30,"requires":{"tech":"energy","level":3},"ocean":true},
//   },
//   // [research] src/config.js
//   research: {
//     "scout": {"cost":[100,100,30],"time":10,"lab":1,"max":100},
//     "logistics": {"cost":[150,120,40],"time":12,"lab":1,"max":5,"requires":{"tech":"scout","level":1}},
//     "colonization": {"cost":[350,250,100],"time":16,"lab":2,"max":8,"requires":{"tech":"scout","level":1}},
//     "drive": {"cost":[200,150,80],"time":14,"lab":2,"max":10,"requires":{"tech":"logistics","level":1}},
//     "ramjet": {"cost":[600,450,200],"time":24,"lab":3,"max":10,"requires":{"tech":"drive","level":3}},
//     "impulse": {"cost":[1800,1400,650],"time":40,"lab":4,"max":10,"requires":{"tech":"ramjet","level":3}},
//     "hyperspace": {"cost":[5500,4200,2000],"time":65,"lab":5,"max":10,"requires":{"tech":"impulse","level":3}},
//     "engineering": {"cost":[250,200,40],"time":16,"lab":2,"max":5},
//     "military": {"cost":[300,220,80],"time":18,"lab":2,"max":10,"requires":{"tech":"engineering","level":1}},
//     "weapons": {"cost":[400,300,100],"time":60,"lab":3,"max":5,"requires":{"tech":"military","level":1}},
//     "shields": {"cost":[350,450,100],"time":60,"lab":3,"max":5,"requires":{"tech":"military","level":1}},
//     "armor": {"cost":[500,250,100],"time":60,"lab":3,"max":5,"requires":{"tech":"military","level":1}},
//     "assaultDrive": {"cost":[600,400,200],"time":60,"lab":3,"max":1,"requires":{"tech":"ramjet","level":1}},
//     "energy": {"cost":[200,180,50],"time":15,"lab":2,"max":5},
//   },
//   // [ships] src/config.js
//   ships: {
//     "spyProbe": {"category":"civil","cost":[150,120,40],"time":8,"tech":"scout","techLevel":1,"shipyard":1,"cargo":0,"speed":2,"fuel":2},
//     "probe": {"category":"civil","cost":[90,60,20],"time":5,"tech":"scout","cargo":0,"speed":1,"fuel":1.5},
//     "transport": {"category":"freighter","cost":[180,100,40],"time":8,"tech":"logistics","cargo":1000,"speed":1,"fuel":4},
//     "longProbe": {"category":"civil","cost":[280,200,80],"time":10,"tech":"scout","techLevel":2,"shipyard":2,"engine":"ramjet","engineLevel":1,"cargo":0,"speed":1,"fuel":3},
//     "starColony": {"category":"civil","cost":[1200,850,400],"time":30,"tech":"colonization","techLevel":4,"shipyard":3,"engine":"ramjet","engineLevel":1,"cargo":0,"speed":1,"fuel":18},
//     "colony": {"category":"civil","cost":[500,300,100],"time":12,"tech":"colonization","cargo":0,"speed":1,"fuel":4},
//     "kurier": {"category":"freighter","tier":1,"cost":[140,80,30],"time":6,"tech":"logistics","techLevel":1,"shipyard":1,"cargo":750,"speed":1.35,"fuel":3},
//     "karawane": {"category":"freighter","tier":2,"cost":[800,450,180],"time":20,"tech":"logistics","techLevel":2,"shipyard":2,"engine":"ramjet","engineLevel":2,"cargo":5000,"speed":0.9,"fuel":12},
//     "atlas": {"category":"freighter","tier":3,"cost":[2400,1400,600],"time":45,"tech":"logistics","techLevel":3,"shipyard":4,"engine":"impulse","engineLevel":2,"cargo":16000,"speed":0.7,"fuel":28},
//     "arche": {"category":"freighter","tier":4,"cost":[7600,4400,2000],"time":90,"tech":"logistics","techLevel":5,"shipyard":6,"engine":"hyperspace","engineLevel":2,"cargo":50000,"speed":0.55,"fuel":70},
//     "falke": {"category":"military","tier":1,"cost":[240,150,60],"time":60,"tech":"military","techLevel":1,"shipyard":1,"cargo":0,"speed":1.5,"fuel":6},
//     "waechter": {"category":"military","tier":2,"cost":[900,600,220],"time":180,"tech":"military","techLevel":2,"shipyard":2,"engine":"ramjet","engineLevel":1,"cargo":0,"speed":1.1,"fuel":16},
//     "donner": {"category":"military","tier":3,"cost":[3000,1800,700],"time":480,"tech":"military","techLevel":3,"shipyard":4,"engine":"impulse","engineLevel":1,"cargo":0,"speed":0.85,"fuel":40},
//     "flak": {"category":"defense","cost":[240,150,60],"time":60,"tech":"military","techLevel":1,"shipyard":1,"slots":1,"cargo":0,"speed":0,"fuel":0},
//     "laser": {"category":"defense","cost":[900,600,220],"time":180,"tech":"military","techLevel":2,"shipyard":2,"slots":1,"cargo":0,"speed":0,"fuel":0},
//     "rail": {"category":"defense","cost":[3000,1800,700],"time":480,"tech":"military","techLevel":3,"shipyard":4,"slots":1,"cargo":0,"speed":0,"fuel":0},
//     "plasma": {"category":"defense","cost":[9500,6500,2500],"time":1200,"tech":"military","techLevel":4,"shipyard":6,"slots":1,"cargo":0,"speed":0,"fuel":0},
//     "titan": {"category":"military","tier":4,"cost":[9500,6500,2500],"time":1200,"tech":"military","techLevel":4,"shipyard":6,"engine":"hyperspace","engineLevel":1,"cargo":0,"speed":0.6,"fuel":100},
//   },
//   // [tutorialPlanets] src/config.js
//   tutorialPlanets: [{"id":"ferrum","coord":"1:2:7","kind":"Gesteinsplanet","specialty":"Metall","distance":2,"mult":[1.8,0.75,0.65],"ocean":false,"energy":1},{"id":"nereus","coord":"1:3:7","kind":"Eisplanet","specialty":"Treibstoff","distance":3,"mult":[0.7,1,1.9],"ocean":false,"energy":1.2},{"id":"thalassa","coord":"1:4:5","kind":"Ozeanplanet","specialty":"Kristall","distance":4,"mult":[0.85,1.6,1.1],"ocean":true,"energy":1}],
//   // [costGrowth] src/config.js
//   costGrowth: {
//     "base": 1.6,
//     "militaryExtraBase": 1.5,
//     "militaryExtraAfterIndex": 4,
//     "colonizationLevel7": [1000000,1000000,1000000],
//     "colonizationLevel8": [1500000,1500000,1500000],
//   },
//   // [routeEconomy] src/config.js
//   routeEconomy: {
//     "time": 1,
//     "fuel": 0.75,
//   },
//   // [attackSlots] src/config.js
//   attackSlots: {
//     "1": 1,
//     "5": 2,
//     "10": 4,
//   },
//   // [newGame] src/engine.js
//   newGame: {
//     "resources": [3000,2200,1000],
//     "buildings": {"metal":1,"crystal":1,"fuel":1,"solar":3},
//   },
//   // [warehouse] src/engine.js
//   warehouse: {
//     "base": 4000,
//     "growth": 1.7,
//   },
//   // [yardTime] src/engine.js
//   yardTime: {
//     "perLevel": 0.92,
//     "startsAfterLevel": 1,
//   },
//   // [energyDemand] src/engine.js
//   energyDemand: {
//     "minePerLevel": [15,18,20],
//     "yardBase": 10,
//     "yardExponent": 1.5,
//   },
//   // [production] src/engine.js
//   production: {
//     "perHourBase": [300,220,140],
//     "mineGrowth": 1.12,
//     "solarBase": 45,
//     "tidalBase": 180,
//     "energyResearchBonus": 0.1,
//   },
//   // [queues] src/engine.js
//   queues: {
//     "ship": 20,
//     "orbital": 20,
//     "legacyPaidOrders": 50,
//   },
//   // [demolition] src/engine.js
//   demolition: {
//     "refund": 0.2,
//     "time": 0.25,
//   },
//   // [buildingTime] src/engine.js
//   buildingTime: {
//     "growth": 1.35,
//     "engineeringFactor": 0.95,
//     "roboticsFactor": 0.92,
//   },
//   // [buildingCaps] src/engine.js
//   buildingCaps: {
//     "default": 30,
//     "bunker": 4,
//   },
//   // [researchTime] src/engine.js
//   researchTime: {
//     "growth": 1.5,
//     "militaryExtraGrowth": 1.5,
//     "militaryExtraAfterIndex": 4,
//     "labBonus": 0.15,
//   },
//   // [scrapping] src/engine.js
//   scrapping: {
//     "refundPercent": 30,
//   },
//   // [cargoBonus] src/engine.js
//   cargoBonus: {
//     "perLogisticsLevel": 0.15,
//   },
//   // [tutorialFlight] src/engine.js
//   tutorialFlight: {
//     "baseSeconds": 10,
//     "distanceSeconds": 8,
//     "probeScoutBonus": 0.1,
//   },
//   // [routeStops] src/engine.js
//   routeStops: {
//     "min": 2,
//     "max": 12,
//   },
//   // [engineBonuses] src/flight.js
//   engineBonuses: {
//     "speed": 0.05,
//     "fuel": 0.12,
//     "baseScale": 0.78125,
//   },
//   // [distance] src/flight.js
//   distance: {
//     "minimum": 1,
//     "slotFactor": 0.15,
//     "coordinateDivisor": 40,
//   },
//   // [flightBase] src/flight.js
//   flightBase: {
//     "minimumMs": 60000,
//     "baseSeconds": 120,
//     "distanceSeconds": 45,
//   },
//   // [combatStats] src/combat.js
//   combatStats: {
//     "spyProbe": {"hp":30,"shield":0,"attack":0,"shots":1},
//     "probe": {"hp":30,"shield":0,"attack":0,"shots":1},
//     "longProbe": {"hp":60,"shield":10,"attack":0,"shots":1},
//     "colony": {"hp":250,"shield":30,"attack":0,"shots":1},
//     "starColony": {"hp":500,"shield":80,"attack":0,"shots":1},
//     "transport": {"hp":100,"shield":20,"attack":0,"shots":1},
//     "kurier": {"hp":80,"shield":10,"attack":0,"shots":1},
//     "karawane": {"hp":450,"shield":80,"attack":0,"shots":1},
//     "atlas": {"hp":1400,"shield":200,"attack":0,"shots":1},
//     "arche": {"hp":4000,"shield":600,"attack":0,"shots":1},
//     "falke": {"hp":160,"shield":40,"attack":30,"shots":1,"bonus":{"donner":0.25,"titan":0.25}},
//     "waechter": {"hp":650,"shield":180,"attack":100,"shots":2,"bonus":{"falke":0.5}},
//     "donner": {"hp":2000,"shield":400,"attack":350,"shots":2,"bonus":{"flak":0.5,"laser":0.5,"rail":0.5,"plasma":0.5}},
//     "titan": {"hp":6500,"shield":1400,"attack":1100,"shots":4,"bonus":{"waechter":0.25,"donner":0.25}},
//     "flak": {"hp":180,"shield":30,"attack":35,"shots":2,"bonus":{"falke":0.75}},
//     "laser": {"hp":600,"shield":150,"attack":100,"shots":2},
//     "rail": {"hp":1600,"shield":300,"attack":300,"shots":1,"bonus":{"donner":0.25,"titan":0.25}},
//     "plasma": {"hp":4500,"shield":800,"attack":800,"shots":2,"bonus":{"titan":0.25}},
//   },
//   // [combatResearch] src/combat.js
//   combatResearch: {
//     "armor": 0.08,
//     "shields": 0.08,
//     "weapons": 0.08,
//   },
//   // [sensorWarning] src/combat.js
//   sensorWarning: {
//     "base": 0.9,
//     "levelOffset": 1,
//   },
//   // [legacyCombat] src/combat.js
//   legacyCombat: {
//     "maxRounds": 6,
//     "debrisMetalCrystal": 0.3,
//   },
//   // [combatRoundsDebris] src/combat-hybrid.js
//   combatRoundsDebris: {
//     "maxRounds": 6,
//     "orbitalOpeningRound": 0,
//     "debrisMetalCrystal": 0.3,
//   },
//   // [repairRates] src/repair.js
//   repairRates: {
//     "damagedShip": 0.3,
//     "disabledOrbital": 0.7,
//     "fuel": 0,
//   },
//   // [repairQueue] src/repair.js
//   repairQueue: 20,
//   // [repairTime] src/repair.js
//   repairTime: {
//     "levelFactor": 0.92,
//     "orbitalTimeFactor": 1,
//     "damagedShipTimeFactor": 0.3,
//     "maxUnits": 100000,
//   },
//   // [colonyProtection] src/server-world.js
//   colonyProtection: {
//     "ms": 3600000,
//   },
//   // [colonyStart] src/server-world.js
//   colonyStart: {
//     "resources": [350,250,100],
//     "solar": 2,
//   },
//   // [shieldRecovery] src/server-world.js
//   shieldRecovery: {
//     "ms": 300000,
//   },
//   // [bunker] src/server-world.js
//   bunker: {
//     "perLevelCapacityRate": 0.025,
//     "maxPerResource": 2000,
//   },
//   // [galaxyMissionLimits] src/server-world.js
//   galaxyMissionLimits: {
//     "active": 100,
//     "coloniesResearchOffset": 3,
//     "ramjetRequired": 1,
//   },
//   // [tradeExpiry] src/social-world.js
//   tradeExpiry: {
//     "ms": 3600000,
//   },
//   // [pirates] src/pirates-config.js
//   pirates: {
//     "enabled": true,
//     "strengthFactor": 1,
//     "resourceFactor": 1,
//     "flightTimeFactor": 1,
//     "fuelFactor": 1,
//     "cooldownMinutes": 60,
//     "debrisRate": 0.3,
//     "debrisLifetimeHours": 24,
//     "maxMissions": 20,
//     "stations": {"smugglers":{"enabled":true,"cooldownMinutes":60,"sensor":1,"fleet":{"falke":3},"resources":{"metal":2400,"crystal":1600,"fuel":400},"tech":{"weapons":0,"armor":0,"shields":0}},"outpost":{"enabled":true,"cooldownMinutes":60,"sensor":3,"fleet":{"falke":12,"waechter":2,"flak":2},"resources":{"metal":9000,"crystal":6000,"fuel":1800},"tech":{"weapons":1,"armor":1,"shields":1}},"harbor":{"enabled":true,"cooldownMinutes":60,"sensor":5,"fleet":{"falke":30,"waechter":10,"donner":2,"laser":4},"resources":{"metal":28000,"crystal":22000,"fuel":6000},"tech":{"weapons":2,"armor":2,"shields":2}},"fortress":{"enabled":true,"cooldownMinutes":360,"sensor":7,"fleet":{"falke":60,"waechter":25,"donner":10,"titan":2,"rail":6},"resources":{"metal":85000,"crystal":65000,"fuel":16000},"tech":{"weapons":3,"armor":3,"shields":3}},"headquarters":{"enabled":true,"cooldownMinutes":360,"sensor":10,"fleet":{"falke":120,"waechter":60,"donner":30,"titan":12,"plasma":10},"resources":{"metal":240000,"crystal":180000,"fuel":45000},"tech":{"weapons":5,"armor":5,"shields":5}}},
//   },
//   // [pirateValidation] src/pirates-config.js
//   pirateValidation: {
//     "factors": [0.1,20],
//     "cooldownMinutes": [1,1440],
//     "debrisLifetimeHours": [1,168],
//     "maxMissions": [1,50],
//     "sensor": [0,100],
//     "tech": [0,5],
//     "maxFleetAfterFactor": 100000,
//   },
//   // [galaxyLayout] src/galaxy.js
//   galaxyLayout: [{"id":"helion","name":"Helion","x":520,"y":400},{"id":"orion","name":"Orion","x":380,"y":250},{"id":"cetus","name":"Cetus","x":220,"y":450},{"id":"aster","name":"Aster","x":600,"y":180},{"id":"lysara","name":"Lysara","x":750,"y":300},{"id":"vela","name":"Vela","x":850,"y":180},{"id":"umbra","name":"Umbra","x":760,"y":650},{"id":"nyx","name":"Nyx","x":520,"y":720},{"id":"solace","name":"Solace","x":870,"y":730},{"id":"nova","name":"Nova","x":330,"y":700}],
//   // [saveCompatibility] src/storage.js
//   saveCompatibility: {
//     "maxPlanets": 9,
//     "maxBuildingLevel": 30,
//     "maxRepairQueue": 20,
//     "planetSlotMax": 10,
//   },
//   // [galaxyGeneration] supabase/galaxy.sql
//   galaxyGeneration: {
//     "planetsPerSystem": [3,10],
//     "planetKinds": 4,
//     "resourceMultiplier": {"min":0.6,"span":1.5},
//     "energyMultiplier": {"min":0.8,"span":0.5},
//   },
//   // [galaxyStartPositions] supabase/galaxy.sql
//   galaxyStartPositions: {
//     "center": [500,500],
//     "radius": 460,
//   },
// }
// Betriebsparameter separat halten: sync-policy.js (30/15 s), server-service.js
// (5 Versuche), server-world.js (10.000 globale Events), engine.js (100.000 lokale
// Events), reports.sql (50 pro Seite), pvp.sql (30 Tage Snapshot-Historie).
// Keine frei änderbaren Realm-Regeln: Schema-/Engine-Versionen, UUIDs, RNG-Konstanten,
// Rundungspräzision, Zeitumrechnung, Sicherheitsprüfungen und historische Refunds.
