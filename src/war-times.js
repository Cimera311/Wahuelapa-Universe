// Newspaper text is deterministic per battle: refreshing never changes a published story.
const headlines={
 loot:[
 ['Galaktischer Selbstbedienungsladen eröffnet!','{a} marschierte mit einer {af} auf {p} ein. {d} und die Verteidigung hatten dagegen wenig einzuwenden. Die Rohstoffe wechselten daraufhin unfreiwillig den Besitzer.','Eine Quittung gab es selbstverständlich nicht.'],
 ['Erst Kanonen, dann Einkaufswagen!','{a} gewann auf {p} gegen {d}. Nach dem Auftritt der {af} war von der {df} nicht mehr viel Widerstand zu erwarten.','Die örtliche Handelskammer nennt es einen sehr einseitigen Einkauf.'],
 ['Raubzug mit Abholgarantie!','Mit einer {af} machte {a} auf {p} bei {d} einen Abstecher. Die Verteidigung scheiterte, Rohstoffe wurden abtransportiert.','Der Eigentümer hat den Lieferschein bis heute nicht unterschrieben.'],
 ['Diebstahl? Nein, spontane Umverteilung!','{a} erschien mit einer {af} über {p}, besiegte {d} und transportierte Beute ab.','Das Finanzamt bittet um die korrekte Verbuchung des Überfalls.']
 ],
 empty:[
 ['Sieg errungen – Konto trotzdem leer!','{a} überwand mit einer {af} die Verteidigung von {d} auf {p}. Zum Mitnehmen gab es nichts.','Die Finanzabteilung beantragt eine vorherige Lagerkontrolle.'],
 ['Großangriff auf leere Regale!','Auf {p} setzte sich {a} mit einer {af} gegen {d} durch. Die Rohstoffsuche verlief deutlich weniger erfolgreich.','Die Expedition gilt jetzt als kostenpflichtige Besichtigung.'],
 ['Kanonen sprechen, Geldbeutel schweigt!','{a} siegte auf {p} gegen die Verteidigung von {d}. Der erhoffte Reichtum blieb aus.','Der zuständige Admiral verweist auf wertvolle Lebenserfahrung.'],
 ['Erfolgreich erobert: exakt gar nichts!','{a} schlug mit einer {af} die Verteidigung von {d} auf {p}. Beute blieb aus.','Ein Gutschein für den nächsten Überfall wurde abgelehnt.']
 ],
 defense:[
 ['Zutritt verweigert!','{a} erschien mit einer {af} über {p}. {d} begrüßte die Besucher mit einer {df} und schickte sie wieder weg.','Die Parkgebühren für feindliche Flotten wurden trotzdem berechnet.'],
 ['Großer Auftritt, kleiner Abgang!','{a} wollte mit einer {af} auf {p} Eindruck machen. {d} und die Verteidigung waren leider ein wenig schwer zu beeindrucken.','Offiziell heißt das jetzt strategische Umorientierung.'],
 ['Hier fliegt heute niemand durch!','{d} verteidigte {p} mit einer {df} gegen {a} und dessen {af}. Der Angriff scheiterte.','Die örtlichen Geschützmannschaften verlangen einen Feiertag.'],
 ['Invasion? Nicht mit uns!','{a} brachte eine {af} nach {p}. Dort hatte {d} schon seine {df} als Antwort vorbereitet.','Die diplomatischen Beziehungen gelten weiterhin als ausbaufähig.']
 ],
 wipe:[
 ['Rückflug ersatzlos gestrichen!','{a} schickte eine {af} gegen {d} auf {p}. Die {df} vernichtete alle Angreifer.','Die Fluggesellschaft bittet, von Rückerstattungsanfragen abzusehen.'],
 ['Vermisst wird eine komplette Flotte!','Auf {p} endete der Besuch von {a} bei {d} in einem Trümmerfeld. Kein Angriffsschiff überlebte.','Die Suchmeldung wurde direkt an den Schrotthändler weitergeleitet.'],
 ['Aus Raumschiffen wird Recyclingmaterial!','{d} empfing die {af} von {a} auf {p} mit einer {df}. Die Angreifer wurden vollständig zerstört.','Das Umweltamt prüft noch die Mülltrennung.'],
 ['Einbahnstraße nach {p}!','{a} wagte mit einer {af} einen Vorstoß gegen {d}. Die Verteidigung ließ niemanden zurückkehren.','Das Navi meldet: Ziel erreicht, Fahrzeug nicht gefunden.']
 ],
 draw:[
 ['Beide erklären sich zum Sieger!','{a} und {d} gerieten über {p} mit einer {af} und einer {df} aneinander. Niemand konnte sich durchsetzen.','Beide Presseabteilungen haben trotzdem schon Pokale bestellt.'],
 ['Viel Lärm, wenig Ergebnis!','Auf {p} traf die {af} von {a} auf die Verteidigung von {d}. Das Gefecht endete ohne Sieger.','Die Munitionshersteller melden einen erfolgreichen Geschäftstag.'],
 ['Patt im All!','{a} und {d} stritten auf {p} mit militärischen Argumenten. Eine Entscheidung fiel nicht.','Ein Schiedsrichter war leider nicht verfügbar.'],
 ['Galaktischer Streit endet mit Achselzucken!','{a} griff {d} auf {p} an. Beide Seiten schossen, doch niemand gewann.','Man einigte sich darauf, uneinig zu bleiben.']
 ]};
const hash=id=>[...String(id)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function warArticle(item){
 const type=item.outcome==='attacker'?(item.loot?'loot':'empty'):item.outcome==='defender'?(item.wipe?'wipe':'defense'):'draw';
 const [headline,lead,punch]=headlines[type][hash(item.id)%4];
 const data={a:item.attacker,d:item.defender,p:item.planet,af:item.attackSize,df:item.defenseSize};
 const fill=s=>s.replace(/\{(a|d|p|af|df)\}/g,(_,key)=>escapeHtml(data[key]));
 return {type,title:fill(headline),body:fill(lead)+' '+fill(punch)};
}
export function warTimesView(items){
 if(!items.length)return '<p class="war-empty">Noch keine veröffentlichten Schlachten. Die Redaktion wartet auf den ersten großen Knall.</p>';
 return items.map((item,i)=>{const a=warArticle(item),date=new Date(item.at).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'});return '<article class="war-story '+escapeHtml(a.type)+'">'+(i===0?'<span class="war-breaking">TOP-STORY</span>':'')+'<div class="war-date">'+escapeHtml(date)+'</div><h3>'+a.title+'</h3><p>'+a.body+'</p><div class="war-byline">GALAXY WAR TIMES · Garantiert unseriös</div></article>';}).join('');
}
