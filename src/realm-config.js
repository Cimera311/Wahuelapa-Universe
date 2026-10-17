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
    titan:Object.freeze({falke:.85,waechter:.40,donner:.50,flak:.60,laser:.40,rail:.20}),
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
