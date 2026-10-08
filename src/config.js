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
 shipyard:{name:'Schiffswerft',icon:'⚒',cost:[200,100,0],time:12,description:'Baut Sonden, Frachter und Kolonieschiffe.',requires:{building:'lab',level:1}},
 robotics:{name:'Arbeitsroboter',icon:'⚙',cost:[400,300,60],time:20,description:'Verkürzen neue Bauaufträge um 8 % je Stufe.',requires:{tech:'engineering',level:1}},
 tidal:{name:'Gezeitenkraftwerk',icon:'≈',cost:[700,450,80],time:30,description:'Liefert 180 Energie je Stufe auf Ozeanwelten.',requires:{tech:'energy',level:3},ocean:true}
};
export const TECHS = {
 scout:{name:'Sensortechnik',description:'Stufe 1: Sonden. Weitere Stufen: kürzere Sondenflüge.',cost:[100,100,30],time:10,lab:1,max:5},
 logistics:{name:'Transporttechnik',description:'Frachter freischalten; je Stufe +15 % Laderaum.',cost:[150,120,40],time:12,lab:1,max:5,requires:{tech:'scout',level:1}},
 colonization:{name:'Kolonisierung',description:'Jede Stufe erlaubt eine weitere Kolonie (max. 2).',cost:[350,250,100],time:16,lab:2,max:2,requires:{tech:'scout',level:1}},
 drive:{name:'Antriebstechnik',description:'Je Stufe kürzere Flüge und geringere Flugkosten.',cost:[200,150,80],time:14,lab:2,max:5,requires:{tech:'logistics',level:1}},
 engineering:{name:'Bautechnik',description:'Je Stufe 5 % kürzere neue Bauaufträge; Arbeitsroboter.',cost:[250,200,40],time:16,lab:2,max:5},
 energy:{name:'Energietechnik',description:'Je Stufe +10 % Energie; Stufe 3: Gezeitenkraftwerk.',cost:[200,180,50],time:15,lab:2,max:5}
};
export const SHIPS = {
 probe:{name:'Erkundungssonde',icon:'⌁',cost:[90,60,20],time:5,tech:'scout'},
 transport:{name:'Kleiner Transporter',icon:'➤',cost:[180,100,40],time:8,tech:'logistics'},
 colony:{name:'Kolonieschiff',icon:'✦',cost:[500,300,100],time:12,tech:'colonization'}
};
export const TARGETS = [
 {id:'ferrum',name:'Ferrum',coord:'1:2:7',kind:'Gesteinsplanet',specialty:'Metall',distance:2,mult:[1.8,0.75,0.65],color:'#ba7047',ocean:false,energy:1},
 {id:'nereus',name:'Nereus',coord:'1:3:7',kind:'Eisplanet',specialty:'Treibstoff',distance:3,mult:[0.7,1,1.9],color:'#80cbe3',ocean:false,energy:1.2},
 {id:'thalassa',name:'Thalassa',coord:'1:4:5',kind:'Ozeanplanet',specialty:'Kristall',distance:4,mult:[0.85,1.6,1.1],color:'#3c92c9',ocean:true,energy:1}
];
export function vector(values){return Object.fromEntries(RES.map((k,i)=>[k,values[i]]));}
export function costAt(item,level){return vector(item.cost.map(v=>Math.ceil(v*Math.pow(1.6,level))));}
