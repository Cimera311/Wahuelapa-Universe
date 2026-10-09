export const RES = ['metal','crystal','fuel'];
export const LABEL = {metal:'Metall',crystal:'Kristall',fuel:'Treibstoff'};
export const ICON = {metal:'◈',crystal:'◆',fuel:'▰'};
export const BUILDINGS = {
 metal:{name:'Metallmine',icon:'⛏',cost:[80,35,0],time:8,description:'Fördert Metall für Gebäude und Schiffe.'},
 crystal:{name:'Kristallmine',icon:'◆',cost:[65,60,0],time:9,description:'Kristalle für Forschung und Elektronik.'},
 fuel:{name:'Treibstoffanlage',icon:'▰',cost:[90,50,0],time:10,description:'Versorgt deine Flotten mit Treibstoff.'},
 solar:{name:'Solarkraftwerk',icon:'☀',cost:[75,40,0],time:8,description:'Liefert 45 Energie je Stufe.'},
 warehouse:{name:'Lagerkomplex',icon:'▤',cost:[120,60,0],time:10,description:'Erweitert alle lokalen Ressourcenlager.'},
 lab:{name:'Forschungslabor',icon:'⚗',cost:[150,100,0],time:12,description:'Schaltet imperiumsweite Forschung frei.'},
 shipyard:{name:'Schiffswerft',icon:'⚒',cost:[200,100,0],time:12,description:'Baut Sonden, Frachter, Kolonieschiffe und Kriegsschiffe.',requires:{building:'lab',level:1}},
 robotics:{name:'Arbeitsroboter',icon:'⚙',cost:[400,300,60],time:20,description:'Verkürzen neue Bauaufträge um 8 % je Stufe.',requires:{tech:'engineering',level:1}},
 orbital:{asset:'./assets/pvp-resource-v1/buildings/orbital.webp',name:'Orbitalplattform',icon:'◎',cost:[600,400,120],time:60,description:'Je Stufe vier Plätze für orbitale Verteidigung; maximal Stufe 4.',requires:{tech:'military',level:1}},
 bunker:{asset:'./assets/pvp-resource-v1/buildings/bunker.webp',name:'Ressourcenbunker',icon:'▣',cost:[450,300,80],time:45,description:'Je Stufe schützt er 2,5 % der Lagerkapazität, insgesamt maximal 2000 je Rohstoff.',requires:{tech:'military',level:1}},
 tidal:{name:'Gezeitenkraftwerk',icon:'≈',cost:[700,450,80],time:30,description:'Liefert 180 Energie je Stufe auf Ozeanwelten.',requires:{tech:'energy',level:3},ocean:true}
};
export const TECHS = {
 scout:{name:'Sensortechnik',description:'Stufe 1: Sonden. Weitere Stufen: kürzere Sondenflüge und frühere PvP-Warnungen (90 % bis 10 % der Flugzeit).',cost:[100,100,30],time:10,lab:1,max:5},
 logistics:{name:'Transporttechnik',description:'Frachter freischalten; je Stufe +15 % Laderaum.',cost:[150,120,40],time:12,lab:1,max:5,requires:{tech:'scout',level:1}},
 colonization:{name:'Kolonisierung',description:'Stufen 1–3: die drei Tutorial-Kolonien. Stufen 4–6: Plätze für die künftige gemeinsame Galaxie.',cost:[350,250,100],time:16,lab:2,max:6,requires:{tech:'scout',level:1}},
 drive:{name:'Verbrennungstriebwerke',description:'Für Sonden, Kolonieschiffe, kleine Transporter, Kurier und Falke: je Stufe +12 % Antriebsleistung; kürzere Flüge und weniger Verbrauch. Stufe 3 ermöglicht Staustrahlforschung.',cost:[200,150,80],time:14,lab:2,max:5,requires:{tech:'logistics',level:1}},
 ramjet:{name:'Staustrahltriebwerke',description:'Stufe 1: Wächter; Stufe 2: Karawane. Je Stufe +12 % Leistung und weniger Verbrauch nur für diese Schiffe. Stufe 1 bereitet Flüge in die künftige gemeinsame Galaxie vor; Stufe 3 ermöglicht Impulstriebwerke.',cost:[600,450,200],time:24,lab:3,max:5,requires:{tech:'drive',level:3}},
 impulse:{name:'Impulstriebwerke',description:'Stufe 1: Donner; Stufe 2: Atlas. Je Stufe +12 % Leistung und weniger Verbrauch nur für diese Schiffe. Stufe 3 ermöglicht Hyperraumtriebwerke.',cost:[1800,1400,650],time:40,lab:4,max:5,requires:{tech:'ramjet',level:3}},
 hyperspace:{name:'Hyperraumtriebwerke',description:'Stufe 1: Titan; Stufe 2: Arche. Je Stufe +12 % Leistung und weniger Verbrauch nur für diese Schiffe.',cost:[5500,4200,2000],time:65,lab:5,max:5,requires:{tech:'impulse',level:3}},
 engineering:{name:'Bautechnik',description:'Je Stufe 5 % kürzere neue Bauaufträge; Arbeitsroboter.',cost:[250,200,40],time:16,lab:2,max:5},
 military:{name:'Militärtechnik',description:'Schaltet Falke, Wächter, Donner und Titan frei. Schaltet die vier Kriegsschiffklassen und orbitale Verteidigung frei.',cost:[300,220,80],time:18,lab:2,max:4,requires:{tech:'engineering',level:1}},
 weapons:{asset:'./assets/pvp-resource-v1/research/weapons.webp',name:'Waffentechnik',description:'Je Stufe +8 % Angriffsschaden.',cost:[400,300,100],time:60,lab:3,max:5,requires:{tech:'military',level:1}},
 shields:{asset:'./assets/pvp-resource-v1/research/shields.webp',name:'Schildtechnik',description:'Je Stufe +8 % Schildstärke.',cost:[350,450,100],time:60,lab:3,max:5,requires:{tech:'military',level:1}},
 armor:{asset:'./assets/pvp-resource-v1/research/armor.webp',name:'Panzerung',description:'Je Stufe +8 % Hüllenpunkte.',cost:[500,250,100],time:60,lab:3,max:5,requires:{tech:'military',level:1}},
 assaultDrive:{asset:'./assets/pvp-resource-v1/research/assaultDrive.webp',name:'Falke-Galaxieantrieb',description:'Rüstet Falken für interstellare Angriffe mit Staustrahlantrieb aus.',cost:[600,400,200],time:60,lab:3,max:1,requires:{tech:'ramjet',level:1}},
 energy:{name:'Energietechnik',description:'Je Stufe +10 % Energie; Stufe 3: Gezeitenkraftwerk.',cost:[200,180,50],time:15,lab:2,max:5}
};
export const SHIPS = {
 probe:{name:'Erkundungssonde',icon:'⌁',category:'civil',role:'Erkundet unbekannte Welten.',cost:[90,60,20],time:5,tech:'scout',cargo:0,speed:1,fuel:1.5},
 transport:{name:'Kleiner Transporter',icon:'➤',category:'freighter',role:'Bewährter Allrounder für deine ersten Kolonien.',cost:[180,100,40],time:8,tech:'logistics',cargo:1000,speed:1,fuel:4},
 longProbe:{name:'Fernsonde',icon:'⌁',category:'civil',image:'probe',role:'Untersucht Planeten in der gemeinsamen Galaxie.',cost:[280,200,80],time:10,tech:'scout',techLevel:2,shipyard:2,engine:'ramjet',engineLevel:1,cargo:0,speed:1,fuel:3},
 starColony:{name:'Interstellares Kolonieschiff',icon:'✦',category:'civil',image:'colony',role:'Besiedelt eine erkundete Galaxiewelt und wird dabei verbraucht.',cost:[1200,850,400],time:30,tech:'colonization',techLevel:4,shipyard:3,engine:'ramjet',engineLevel:1,cargo:0,speed:1,fuel:18},
 colony:{name:'Kolonieschiff',icon:'✦',category:'civil',role:'Gründet eine Kolonie und wird dabei verbraucht.',cost:[500,300,100],time:12,tech:'colonization',cargo:0,speed:1,fuel:4},
 kurier:{name:'Kurier',icon:'➤',category:'freighter',tier:1,role:'Leichter Frachter für schnelle kleine Lieferungen.',cost:[140,80,30],time:6,tech:'logistics',techLevel:1,shipyard:1,cargo:750,speed:1.35,fuel:3},
 karawane:{name:'Karawane',icon:'➤',category:'freighter',tier:2,role:'Modulfrachter für regelmäßige Handelsrouten.',cost:[800,450,180],time:20,tech:'logistics',techLevel:2,shipyard:2,engine:'ramjet',engineLevel:2,cargo:5000,speed:.9,fuel:12},
 atlas:{name:'Atlas',icon:'➤',category:'freighter',tier:3,role:'Schwerlastfrachter für den Ausbau ganzer Kolonien.',cost:[2400,1400,600],time:45,tech:'logistics',techLevel:3,shipyard:4,engine:'impulse',engineLevel:2,cargo:16000,speed:.7,fuel:28},
 arche:{name:'Arche',icon:'➤',category:'freighter',tier:4,role:'Megafrachter für große Sammellieferungen.',cost:[7600,4400,2000],time:90,tech:'logistics',techLevel:5,shipyard:6,engine:'hyperspace',engineLevel:2,cargo:50000,speed:.55,fuel:70},
 falke:{name:'Falke',icon:'✧',category:'military',tier:1,role:'Abfangjäger für schnelle Verlegungen.',cost:[240,150,60],time:60,tech:'military',techLevel:1,shipyard:1,cargo:0,speed:1.5,fuel:6},
 waechter:{name:'Wächter',icon:'✧',category:'military',tier:2,role:'Eskortfregatte als Grundlage für späteren Geleitschutz.',cost:[900,600,220],time:180,tech:'military',techLevel:2,shipyard:2,engine:'ramjet',engineLevel:1,cargo:0,speed:1.1,fuel:16},
 donner:{name:'Donner',icon:'✧',category:'military',tier:3,role:'Angriffskreuzer für die spätere Kampfflotte.',cost:[3000,1800,700],time:480,tech:'military',techLevel:3,shipyard:4,engine:'impulse',engineLevel:1,cargo:0,speed:.85,fuel:40},
 flak:{asset:'./assets/pvp-resource-v1/defense/flak.webp',name:'Orbitalflak',icon:'✣',category:'defense',role:'Abwehr gegen Falken.',cost:[160,80,20],time:60,tech:'military',techLevel:1,shipyard:2,slots:1,cargo:0,speed:0,fuel:0},
 laser:{asset:'./assets/pvp-resource-v1/defense/laser.webp',name:'Laserbatterie',icon:'⊕',category:'defense',role:'Universelle orbitale Abwehr.',cost:[450,300,70],time:180,tech:'military',techLevel:2,shipyard:3,slots:2,cargo:0,speed:0,fuel:0},
 rail:{asset:'./assets/pvp-resource-v1/defense/rail.webp',name:'Railgun',icon:'⌖',category:'defense',role:'Abwehr gegen schwere Kriegsschiffe.',cost:[1400,1000,280],time:480,tech:'military',techLevel:3,shipyard:4,slots:3,cargo:0,speed:0,fuel:0},
 plasma:{asset:'./assets/pvp-resource-v1/defense/plasma.webp',name:'Plasmageschütz',icon:'✺',category:'defense',role:'Schwere Abwehr gegen Titanen.',cost:[4000,2800,900],time:1200,tech:'military',techLevel:4,shipyard:6,slots:4,cargo:0,speed:0,fuel:0},
 titan:{name:'Titan',icon:'✧',category:'military',tier:4,role:'Schlachtschiff als Kern einer schweren Flotte.',cost:[9500,6500,2500],time:1200,tech:'military',techLevel:4,shipyard:6,engine:'hyperspace',engineLevel:1,cargo:0,speed:.6,fuel:100}
};
export function isFreighter(key){return SHIPS[key]?.category==='freighter';}
export const TARGETS = [
 {id:'ferrum',name:'Ferrum',coord:'1:2:7',kind:'Gesteinsplanet',specialty:'Metall',distance:2,mult:[1.8,0.75,0.65],color:'#ba7047',ocean:false,energy:1},
 {id:'nereus',name:'Nereus',coord:'1:3:7',kind:'Eisplanet',specialty:'Treibstoff',distance:3,mult:[0.7,1,1.9],color:'#80cbe3',ocean:false,energy:1.2},
 {id:'thalassa',name:'Thalassa',coord:'1:4:5',kind:'Ozeanplanet',specialty:'Kristall',distance:4,mult:[0.85,1.6,1.1],color:'#3c92c9',ocean:true,energy:1}
];
export function vector(values){return Object.fromEntries(RES.map((k,i)=>[k,values[i]]));}
export function costAt(item,level){return vector(item.cost.map(v=>Math.ceil(v*Math.pow(1.6,level))));}
export const ROUTE_ECONOMY={time:1.25,fuel:.75};

// Cosmetic selection only: preserve tutorial art and keep shared planet variants stable across accounts.
export function planetImagePath(p){
 const families={home:'continental',ferrum:'rock',nereus:'ice',thalassa:'ocean'};
 const base=Object.hasOwn(families,p.image||p.id)?(p.image||p.id):'home';
 if(!/^g-[a-z]+-p(?:[1-9]|10)$/.test(p.id||''))return `./assets/${base}.webp`;
 let hash=2166136261;
 for(const c of 'planet-art-v2:'+p.id)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const variant=hash%4;
 return variant?`./assets/planets-v2/${families[base]}-v${variant}.webp`:`./assets/${base}.webp`;
}
