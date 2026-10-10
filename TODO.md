# Projekt-TODO

Stand: 10.10.2026. Diese Punkte sind vorgemerkt und noch nicht zur Umsetzung freigegeben. Aktuelle Formeln und Werte bleiben vorerst unverändert.

- [ ] **Arbeitsroboter und Forschungslabore: Energiebedarf prüfen.** Steigenden Strombedarf für hohe Ausbaustufen untersuchen. Der planetare Energiebedarfsfaktor muss auf diese Verbraucher ebenfalls gelten. Die bisherigen Zeitformeln zunächst beibehalten; eine mögliche Verlangsamung bei Strommangel gesondert bewerten. Konkrete Verbrauchswerte erst nach einem Vergleich mit Kraftwerken und der übrigen Wirtschaft vorschlagen.
- [ ] **Gesamtes Energie-Balancing prüfen.** Verbrauch sämtlicher Energieverbraucher gegen Stromerzeugung, Energieforschung und planetare Faktoren vergleichen. Prüfen, ob Energieversorgung insgesamt anspruchsvoller werden sollte, insbesondere bei hohen Ausbaustufen und Massenproduktion. Einstieg, Tutorial und bestehende ausgebaute Planeten mit berücksichtigen. Zahlen und Auswirkungen vor einer Änderung gemeinsam abstimmen.

- [ ] **Öffentlichen Spielerhandel / Marktplatz entwerfen.** Zwei Varianten prüfen: (1) feste Tauschangebote mit automatisch abgewickelten Lieferungen; (2) Auktionshaus mit Geboten in einer vom Verkäufer festgelegten Rohstoffart, Mindestgebot und optionalem Sofortkauf. Ein echtes Bietsystem benötigt zusätzlich Auktionsende, Gebotsreservierung und Freigabe überbotener Gebote; ein Festpreis-Marktplatz ist der einfachere Einstieg. Keine neue Währung als Voraussetzung.
  - Lieferung durch den Verkäufer als gewünschte Option: Beim Einstellen Ware und ausreichende eigene Frachter reservieren; diese dürfen bis Freigabe weder stationiert, anderweitig versandt noch einer Handelsroute zugeteilt werden. Bei Verkauf automatisch starten, ohne erneute Online-Anmeldung. Normale Flugzeit, langsamstes Schiff, Triebwerke und Treibstoff gelten.
  - Vorgeschlagener Ablauf bei Rohstofftausch: Käufer hinterlegt die Gegenleistung verbindlich auf seinem Zielplaneten. Verkäufer liefert; bei Ankunft werden Ware übergeben und Gegenleistung für den Rückflug geladen. Verkäufer erhält die Zahlung bei Rückkehr. Frachterkapazität muss sowohl Angebot als auch Gegenleistung abdecken.
  - Vor Umsetzung festlegen: Liefergebiet und vorab reservierter Hin-/Rückflug-Treibstoff, Zulässigkeit der Planeten (Tutorial bleibt privat), Ablauf/Abbruch, volle Lager und Lieferdepot, Behandlung reservierter Ware/Frachter bei Angriffen, Gebühren und Grenzen gegen missbräuchliche Transfers. Reservierung darf keinen unbegrenzten sicheren Lagerplatz schaffen.
  - Ausgangspunkt OGame: direkter, vereinbarter Ressourcentausch per Frachter (Gameforge: https://gameforge.com/en-GB/games/online-strategy-with-trading.html). Unsere automatische Absicherung und Lieferung sind ein eigener Vorschlag. Beide Varianten vorerst nur TODO, noch keine Implementierungsfreigabe.



## Implementiert, gemeinsames Deployment ausstehend

- [x] Partnerschaften per Einladung und Zustimmung; getrennte Liefer- und Verteidigungsrechte je Gastgeber.
- [x] Partnerlieferungen mit eigenen Frachtern und normaler Hin-/Rückflugzeit.
- [x] Direkte Tauschgeschäfte: Gegenleistung und Lieferung werden bei Annahme gemeinsam gebunden, Frachter bringen die Zahlung zurück. Öffentlicher Markt und Auktionen bleiben offen.
- [x] Eigene Kriegsschiffe beim Partner stationieren, mitverteidigen, zurückrufen oder vom Gastgeber zurückschicken lassen. Eigentum, Forschung, Schäden, Verluste und Ranglistenpunkte bleiben dem Besitzer zugeordnet.
- [x] Flugzeiten aus #9, Werft/Energie aus #10 und Partnerschaften in einem gemeinsamen Update zusammenführen. SQL und gemeinsame TXT-Datei bereitstellen. Veröffentlichung erst nach Serverupdate.
