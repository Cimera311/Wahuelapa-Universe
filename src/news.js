export const GAME_NEWS=[
 {date:'11.10.2026',title:'Deine gesamte Flotte im Überblick',status:'Flottenübersicht 0.5.3',items:[
 'Die Gesamtübersicht lässt sich zwischen Nach Schiff und Nach Planet umschalten. So siehst du die Orbitbestände aller eigenen Planeten und wo deine Schiffe liegen.',
 'Kategorien für Transport, Kampf, Sonden & Kolonie und Verteidigung helfen beim Filtern. Am Desktop stehen die Karten nebeneinander, mobil lassen sich ihre Details aufklappen.',
 'Unterwegs nutzt das vertraute Handelsrouten-Design mit passenden Informationen zum jeweiligen Auftrag. Handelsrouten lassen sich auch hier bearbeiten, pausieren und beenden.',
 'Galaxieflüge, eigene Angriffe und Partnerflotten sind ebenfalls sichtbar. Fliegende und beim Partner stationierte Schiffe werden getrennt vom Orbitbestand deiner Planeten angezeigt.'
 ]},
 {date:'11.10.2026',title:'Kompakte Werft mit direktem Schiffbau',status:'Werft-Update 0.5.2',items:[
 'Bild, Schiffname, Ressourcen als Symbol und Menge, Bauzeit, Mengenwahl und Bauen bleiben auch eingeklappt sichtbar – mobil und am Desktop.',
 'Beschreibung, Laderaum, Tempo, Verbrauch und Voraussetzungen lassen sich je Schiff aufklappen.',
 'Kosten und Bauzeit reagieren auf die gewählte Anzahl. Die Ressourcen- und Orbitalplatzprüfung berücksichtigt die gesamte Bestellung.'
 ]},
 {date:'11.10.2026',title:'Flottenversand bei unterschiedlichen Serverständen',status:'Korrektur 0.5.1',items:[
 'Liefern, Abholen und Stationieren mit einem Schiffstyp senden wieder beide unterstützten Anfrageformate. Damit funktionieren diese Aufträge auch während eines noch ausstehenden Backend-Updates.',
 'Gemischte Flotten prüfen vor dem Versand die Serverunterstützung. Ein veralteter Server führt zu einem klaren Hinweis statt einer irreführenden Schiffsfehlermeldung.',
 'Übersteigt eine gespeicherte Auswahl den aktuellen Schiffsbestand, zeigt das Formular gewählte und verfügbare Anzahl an.'
 ]},
 {date:'11.10.2026',title:'Dein Imperium auf einen Blick',status:'Übersicht-Update 0.5',items:[
 'Kompakte Übersicht für Browser und Mobilgerät: kleinere Planetenansicht und aufgeräumte Bauaufträge mit aufklappbaren Details.',
 'Produktion pro Stunde zwischen dem gesamten Imperium und der aktiven Welt umschalten. Die tatsächliche Förderleistung berücksichtigt planetare Faktoren und Strommangel.',
 'Jede Planetenkarte zeigt Produktion, Rohstoff- und Energiefaktoren, die drei Förderstufen sowie die Werftstufe.',
 'Ein abgeschlossenes Tutorial lässt sich ausblenden und über Spielstand & Hilfe wieder anzeigen. Die Anzeigeeinstellung wird je Spielstand und Konto in diesem Browser gespeichert.'
 ]},
 {date:'11.10.2026',title:'Flottenplanung, Routenpause und Forschung',status:'Flotten-Update 0.4',items:[
 'Einheitliche Schiffsauswahl für Angriffe, Transporte, Partnerflotten und Handelsrouten: ausgewählt / verfügbar, grüne Bestandszahl und Alle-Schaltfläche.',
 'Rohstoffmengen beginnen bei 0. Schnellwahl: 0, +5 % des ausgewählten Flottenladeraums und MAX.',
 'Handelsrouten: Entladen, Beladen oder beides am selben Stopp. Eine Pause greift nach der Runde am Startplaneten; die Schiffe bleiben gebunden. Fortsetzen und Bearbeiten bleiben möglich.',
 'Partner direkt aus der Galaxiekarte beliefern oder verteidigen. Handelsrouten bleiben ausschließlich zwischen eigenen Planeten.',
 'Militärtechnik bis Stufe 10: ein Angriffsplatz ab Stufe 1, zwei ab Stufe 5, vier ab Stufe 10. Hin- und Rückflug belegen den Platz. Das bisherige Zweierlimit pro Gegner und Tag entfällt; das 24-Stunden-Beutebudget je Zielkolonie bleibt.',
 'Alle vier Triebwerksforschungen bis Stufe 10. Je Stufe +5 % Antriebsleistung nur für die zugehörigen Schiffstypen; das langsamste Schiff bestimmt die Flottenzeit. Grundflugzeiten sind abgestimmt, Verbrauchsbonus bleibt separat. Laufende Flüge behalten ihre Termine.'
 ]},
 {date:'10.–11.10.2026',title:'Partnerhandel und gemeinsame Verteidigung',status:'Veröffentlicht',items:[
 'Partnerschaften mit Einladung, Zustimmung und getrennten Liefer- und Verteidigungsrechten.',
 'Direkter Ressourcentausch mit verbindlicher Gegenleistung und Lieferung durch eigene Frachter.',
 'Eigene Kriegsschiffe beim Partner stationieren und mitverteidigen; Forschung, Schäden und Verluste bleiben beim Besitzer.',
 'Werftausbau beschleunigt neue Schiffs- und Verteidigungsaufträge. Die Werft benötigt dauerhaft Energie; planetare Faktoren und Strommangel wirken auf die Produktion.',
 'Gemeinsame Flugzeitregeln für Galaxieflüge und ausführlichere Kampfberichte. Ein Fehler beim Absenden der Partnerformulare wurde behoben.'
 ]}
];
export function newsView(){return '<div class="page-heading"><span class="eyebrow">WAHUELAPA UNIVERSE</span><h1>News & Patchnotes</h1><p>Was sich im Universum verändert.</p></div>'+GAME_NEWS.map(n=>'<article class="panel news-entry"><small>'+n.date+' · <span class="news-status">'+n.status+'</span></small><h2>'+n.title+'</h2><ul>'+n.items.map(item=>'<li>'+item+'</li>').join('')+'</ul></article>').join('');}
