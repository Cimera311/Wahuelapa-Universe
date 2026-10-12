// Haupt-Realm: leicht selbst anpassbare Spielregeln.
// Der Flugfaktor gilt nur fuer NEU gestartete Fluege in/zwischen Galaxiesystemen.
// Private Tutorial-Fluege bleiben unveraendert. Nach einer Aenderung Frontend
// neu bauen UND die Supabase Edge Function (swift-handler) neu deployen.
export const REALM_CONFIG = Object.freeze({
  galaxyFlightTimeFactor: 3, // 1 = bisherige Zeit, 2 = doppelt, 3 = dreifach
});
