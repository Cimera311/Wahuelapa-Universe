# Handelsrouten und gemischte Flotten

Unter Flotten → Handelsrouten werden aktive Routen kompakt angezeigt. „Bearbeiten / Flotte wechseln“ öffnet deren Stopps und Flottenzusammenstellung. Die Stopps stehen am Desktop nebeneinander; auf kleinen Bildschirmen klappen sie auf.

## Eingaben
+100/+500 addieren bei jedem Klick. 0 setzt zurück. MAX ist eine dynamische Laderegel, kein eingefrorener Bestand. Nach MAX beginnt eine neue feste Menge bei 0. Mengen können direkt eingegeben werden. Erst abladen, dann einladen; bei vollem Laderaum bleibt die Ladereihenfolge Metall, Kristall, Treibstoff. Bestände sind nur aktuelle Vorschauen.

## Flotte
Eine Route hat 1–100 Frachter insgesamt, auch aus verschiedenen Klassen. Laderäume addieren sich einschließlich Transportforschung. Die langsamste erforschte Klasse bestimmt jede Flugstrecke. Verbrauch wird pro Klasse addiert, einschließlich Triebwerksforschung und des Sparflugfaktors. Der bestehende Sparflug bleibt +25 % Flugzeit und −25 % Verbrauch; Rundung erfolgt wie bisher je Klasse und Strecke.

## Vorgemerkte Änderung
Flotte, Stopps, Name und Wiederholung werden gemeinsam erst bei Rückkehr zum unveränderten Startplaneten übernommen. Vorher wird die gesamte Ladung dort abgeladen. Die bisherige Flotte und die Schiffe im Orbit zählen zur Verfügbarkeit; keine zusätzliche Flotte ist nötig, wenn nur Mengen geändert werden.
Fehlen Schiffe, bleibt die alte Route aktiv und die gesamte Änderung vorgemerkt. Sie wird bei der nächsten Rückkehr erneut geprüft. Vormerkungen reservieren keine Schiffe. „Beenden“ hat Vorrang und parkt die bisherige Flotte. Bei Treibstoffmangel endet die Route wie bisher sicher am Startplaneten.

## Kompatibilität und SQL
Alte Spielstände und Routen mit einem Schiffstyp bleiben kompatibel. Version 1 und bisherige Speicherplätze bleiben erhalten. Für korrekte Ranglistenpunkte aller gemischten Frachter einmal **supabase/mixed-routes.sql** nach galaxy.sql und player-systems.sql ausführen. Wird galaxy.sql erneut ausgeführt, die nachfolgenden Migrationen wieder ausführen. Vorgemerkte Ersatzschiffe zählen nicht doppelt in der Rangliste.

## Prüfung
Tests decken vorhandene Spielstände, getrennte Forschungsboni, Kapazität, Zeit, Verbrauch, unveränderte Flüge vor der Rückkehr, atomaren Wechsel, fehlende Schiffe, erneute Aktivierung, Verwerfen und sicheres Beenden ab. Die PostgreSQL-Prüfung vergleicht Ranglistenpunkte mit einer gleichwertigen Einzelflottenliste.
