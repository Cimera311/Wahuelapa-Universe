// Haupt-Realm: zentral anpassbare Balance-Werte.
// Energieexponenten sind pro Planetentyp und Kraftwerk getrennt konfigurierbar.
// fuelPower ist fuer ein kuenftiges Treibstoffkraftwerk reserviert (noch ohne Effekt).
export const REALM_CONFIG = Object.freeze({
  galaxyFlightTimeFactor: 3,
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
