# Ressourcenbeladung, Werft und Verteidigung im Hangar-Stil

Die gemeinsamen Ressourcenfelder zeigen jetzt Karten mit Rohstoffbildern, freier Mengeneingabe, Slider und den bestehenden Schnellwahlen. Ein farbiger Frachtraumbalken zeigt die aktuell ladbare Verteilung. Wunschmengen über Bestand oder Kapazität bleiben stehen und werden ausdrücklich als aktuell nicht ladbar markiert. MAX bleibt eine dynamische Laderegel. Abholflüge berücksichtigen den Zielbestand; Routen zeigen eine Vorschau für den jeweiligen Stopp. Entladen und Partner-Gegenleistungen werden als Vorschau ohne behaupteten bekannten Bestand dargestellt.

Schiffswerft und Orbitalwerft verwenden neue Produktionskarten mit Schiff-/Geschützbild, Mengen-Slider, direkter Eingabe, Maximum und aufklappbaren Details. Der Slider reicht bis zur aktuell möglichen Menge; die freie Zahleneingabe kann darüber hinausgehen. Gesamtkosten, fehlende Rohstoffe und Gesamtbauzeit folgen der gewünschten Menge. Beispiel: 1.000 Titanen planen, obwohl die Rohstoffe nur für 500 reichen. Der Bauknopf bleibt gesperrt, bis Voraussetzungen und Material ausreichen.

Bestehende Warteschlangen, Routenregeln und Serverbefehle bleiben erhalten. Gebäude und Forschung wurden nicht geändert.

## Vorschau

| Bereich | Handy | Desktop |
| --- | --- | --- |
| Ressourcen laden | [Vorschau](../previews/cargo-hangar-mobile.png) | [Vorschau](../previews/cargo-hangar-desktop.png) |
| Schiffswerft | [Vorschau](../previews/production-hangar-mobile.png) | [Vorschau](../previews/production-hangar-desktop.png) |
| Verteidigung | [Vorschau](../previews/defense-hangar-mobile.png) | [Vorschau](../previews/defense-hangar-desktop.png) |

## News-Entwurf – noch nicht veröffentlicht

🚚🛠️ Der neue Hangar-Look zieht weiter!

Unter **Flotten → Handel → Aufträge** erwarten euch Ressourcenkarten mit Slider, direkter Mengeneingabe und einem farbigen Frachtraumbalken. Auch die Laderegeln der Handelsrouten und die Partnerlieferungen verwenden die neuen Ressourcenfelder. Ihr seht direkt, wie sich Metall, Kristall und Treibstoff den Laderaum teilen. 📦

**Schiffswerft und Orbitalwerft** bekommen passende Produktionskarten mit Mengen-Slider und Maximum-Schnellwahl. Kosten, Bauzeit und fehlende Ressourcen passen sich eurer Eingabe an. 🚀

Ihr wollt wissen, was **1.000 Titanen** kosten, habt aber gerade nur Material für 500? Einfach 1.000 eintippen! Eure Wunschmenge bleibt stehen. Der Slider zeigt das aktuell Mögliche; gebaut wird erst, wenn alles für den gesamten Auftrag reicht. 💚

## Aktivierung

Sebastian prüft und mergt den PR. Erfolgreiche GitHub-Pages-Veröffentlichung abwarten, anschließend das Spiel neu laden.

Keine SQL und keine neue Game-command erforderlich. swift-handler und Auth-Einstellungen bleiben unverändert. Dieser News-Entwurf ist noch nicht veröffentlicht.
