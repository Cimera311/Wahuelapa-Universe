# WaHueLaPa Universe – Übergabe fertiger Updates

Diese Projektkonvention wurde von Sebastian am 14. Oktober 2026 festgelegt.

Sobald ein Pull Request vollständig vorbereitet, geprüft und zum Mergen bereit ist, gemeinsam liefern:

1. Den konkreten PR-Link und den Stand der Tests und GitHub-Checks.
2. Einen fertigen deutschen News-Entwurf für die Spieler zum betreffenden Update. Klare, freundliche Sprache, passende Emojis, konkrete Änderungen und Bedienwege. Keine unbestätigte Live-Freischaltung behaupten.
3. Falls erforderlich, die vollständige neue Game-command mit Versionsnummer und direktem TXT-Link. Bestehende Supabase-Funktion `swift-handler` und Auth-Einstellungen beibehalten; erklären, dass `index.ts` vollständig ersetzt und die Funktion deployed wird.
4. Falls erforderlich, die passende vollständige SQL-Datei mit direktem Link zum Supabase SQL Editor. Zweck und Reihenfolge erklären. Keine unnötigen alten SQL-Dateien erneut ausführen lassen.
5. Eine kurze Aktivierungsreihenfolge: PR mergen, erforderliche SQL ausführen, erforderliche Game-command deployen, Spiel aktualisieren. Wenn keine Game-command oder keine SQL nötig ist, dies ausdrücklich sagen.

Sebastian prüft und mergt den PR selbst. News zunächst vorbereiten; nur nach ausdrücklichem Auftrag veröffentlichen oder als Veröffentlichungs-PR bereitstellen. Erforderliche Dateien und Entwürfe ohne erneute Nachfrage vollständig vorbereiten.
