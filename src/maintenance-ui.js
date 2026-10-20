// Public server status controls rendering; no gameplay is mounted before verification.
export function maintenanceBlocked(status){
 return Boolean(status.checking||status.unavailable||(status.enabled&&!status.isAdmin));
}
const maintenanceEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function maintenanceView(status){
 const checking=status.checking,unavailable=status.unavailable;
 const heading=checking?'Verbindung wird geprüft':unavailable?'Spielserver nicht erreichbar':'Wartungsarbeiten';
 const description=checking?'Wir prüfen gerade die Verfügbarkeit der Galaxie.':
  unavailable?'Der Status des Spielservers konnte nicht sicher geprüft werden. Das Spiel bleibt bis zur Verbindung gesperrt.':
  status.message||'Wir führen Wartungsarbeiten durch. Deine Spielstände bleiben erhalten.';
 const login=!checking&&!unavailable?'<details class="maintenance-admin"><summary>Administratorzugang</summary><form id="maintenance-admin-form"><label>E-Mail<input name="email" type="email" autocomplete="email" required></label><label>Passwort<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Als Administrator anmelden</button></form></details>':'';
 return `<main class="maintenance-page"><section class="maintenance-card" role="status" aria-live="polite">
 <div class="maintenance-orbit" aria-hidden="true"><span>✦</span></div>
 <div class="brand">WaHueLaPa<span>Universe</span></div>
 <p class="eyebrow">GALAXIE · SYSTEMSTATUS</p><h1>${heading}</h1>
 <p class="maintenance-description">${maintenanceEscape(description)}</p>
 <p class="maintenance-note">${checking?'Einen Moment bitte …':unavailable?'Der Verbindungsversuch kann wiederholt werden.':'Die Seite erkennt automatisch, wenn die Wartung beendet ist.'}</p>
 ${status.error?`<p class="maintenance-error" role="alert">${maintenanceEscape(status.error)}</p>`:''}
 ${unavailable?'<button type="button" data-action="maintenance-retry">Erneut verbinden</button>':''}
 ${login}</section></main>`;
}
