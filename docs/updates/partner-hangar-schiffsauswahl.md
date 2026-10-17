# Neue Schiffskarten für Partnerflotten

Partnerlieferungen, Unterstützungsflotten und direkte Tauschangebote verwenden jetzt die gemeinsamen Hangar-Karten. Slider, genaue Zahleneingabe und „Keine“ / „Alle“ bleiben synchron. Lieferungen und Tausch zeigen verfügbare Frachter, Unterstützung zeigt verfügbare Kriegsschiffe. Die Zusammenfassung zeigt Schiffstypen, Gesamtzahl und Laderaum; die Flugvorschau nennt Start, Ziel, Flugzeit, Treibstoff und das langsamste Schiff.

Die Auswahl gilt im Partnerbereich und bei Partneraufträgen unter Handel → Aufträge. Ziel, Schiffsmengen, Ladung und Gegenleistung bleiben pro Startplanet und Auftragsart nach einer Aktualisierung erhalten. Eine inzwischen zu große gespeicherte Flotte bleibt als ungültige Auswahl erkennbar und blockiert den Start.

Zielauswahl und Startprüfung verwenden dieselben gerichteten Partnerfreigaben: erhaltene Lieferfreigabe für Lieferungen, erhaltene Verteidigungsfreigabe für Unterstützung und beidseitige Lieferfreigaben für Tausch. Wird die Freigabe bei einem noch geöffneten Formular entzogen, verhindert die Client-Prüfung einen Start; der Server bleibt verbindlich. Zustimmen, Reservieren, Rückrufen und Zurückschicken funktionieren unverändert.

## Vorschau

Browser-Aufnahmen mit Beispielbeständen:

- `docs/previews/partner-deliver-mobile.png` / `partner-deliver-desktop.png`
- `docs/previews/partner-support-mobile.png` / `partner-support-desktop.png`

## News-Entwurf · noch nicht veröffentlicht

**🤝 Neuer Hangar für eure Partnerflotten!**

🛸 Auch Partnerlieferungen, Unterstützungsflotten und direkte Tauschangebote nutzen jetzt die neuen Schiffskarten – im Partnerbereich und bei den Partneraufträgen.

🎚️ Stellt eure Flotte mit Slider, genauer Zahleneingabe oder „Keine“ / „Alle“ zusammen. Angezeigt werden nur verfügbare Schiffe, die zum Auftrag passen. Eure Übersicht zeigt sofort Schiffe und Laderaum.

🧭 Start, Ziel, Flugzeit und Treibstoff stehen in der Flugvorschau. Eure Partnerfreigaben und die Regeln für Unterstützung und Tausch bleiben bestehen. ❤️

## Aktivierung

PR prüfen und mergen → Pages-Deployment abwarten → Spiel neu laden. Keine neue Game-command und keine SQL erforderlich. Den News-Entwurf bei gewünschter Veröffentlichung separat übernehmen.
