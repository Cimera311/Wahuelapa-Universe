// Haupt-Realm: zentral anpassbare Balance-Werte.
// Energieexponenten sind pro Planetentyp und Kraftwerk getrennt konfigurierbar.
// fuelPower ist fuer ein kuenftiges Treibstoffkraftwerk reserviert (noch ohne Effekt).
export const REALM_CONFIG = Object.freeze({
  galaxyFlightTimeFactor: 3,
  // Rapid Fire is experimental v6 only; editing this does not enable it live.
  combat: Object.freeze({
    shotMechanics: Object.freeze({}),
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
 const chances=Object.fromEntries(Object.entries(base.chances).map(([ship,pairs])=>[ship,{...pairs}]));
 for(const [ship,pairs] of Object.entries(patch.chances||{}))chances[ship]={...(chances[ship]||{}),...pairs};
 const settings={enabled:patch.enabled??base.enabled,maxExtraSalvos:patch.maxExtraSalvos??base.maxExtraSalvos,
  allowInOrbitalOpening:patch.allowInOrbitalOpening??base.allowInOrbitalOpening,chances};
 if(typeof settings.enabled!=='boolean'||typeof settings.allowInOrbitalOpening!=='boolean'||
 !Number.isSafeInteger(settings.maxExtraSalvos)||settings.maxExtraSalvos<0||settings.maxExtraSalvos>10)
  throw Error('Ungültige Realm Rapid-Fire-Einstellungen.');
 for(const pairs of Object.values(chances))for(const chance of Object.values(pairs))
  if(typeof chance!=='number'||!Number.isFinite(chance)||chance<0||chance>1)throw Error('Ungültige Rapid-Fire-Chance.');
 const baseShots=REALM_CONFIG.combat.shotMechanics||{},patchShots=overrides.combat?.shotMechanics||{};
 const shotMechanics=Object.fromEntries(Object.entries(baseShots).map(([ship,pairs])=>[ship,{...pairs}]));
 for(const [ship,pairs] of Object.entries(patchShots))shotMechanics[ship]={...(shotMechanics[ship]||{}),...pairs};
 for(const pairs of Object.values(shotMechanics))for(const rule of Object.values(pairs)){
  if(!['locked','distinct'].includes(rule.targeting))throw Error('Ungültige Zielverteilung.');
  if(rule.shots!==undefined&&(!Number.isSafeInteger(rule.shots)||rule.shots<1||rule.shots>12))throw Error('Ungültige Schusszahl.');
  if(rule.damagePerShot!==undefined&&(!Number.isFinite(rule.damagePerShot)||rule.damagePerShot<=0))throw Error('Ungültiger Trefferschaden.');
 }
 return {rapidFire:settings,shotMechanics};
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
 test3: Object.freeze({combat: Object.freeze({
  rapidFire: Object.freeze({enabled:false}),
  shotMechanics: Object.freeze({
   falke: Object.freeze({titan:Object.freeze({shots:4,damagePerShot:15,targeting:'locked'})}),
   titan: Object.freeze({falke:Object.freeze({shots:4,targeting:'distinct'}),titan:Object.freeze({shots:4,targeting:'locked'})}),
   waechter: Object.freeze({falke:Object.freeze({shots:2,targeting:'distinct'})})
  })
 })})
});
export function combatConfigForRealmId(realmId='main'){
 if(!Object.hasOwn(REALM_COMBAT_OVERRIDES,realmId))throw Error('Unbekanntes Realm: '+realmId);
 return combatConfigForRealm(REALM_COMBAT_OVERRIDES[realmId]);
}
