// Public navigation only. Planet properties and ownership are supplied by the server after surveying.
export const GALAXY_SYSTEMS=[
 {id:'helion',name:'Helion',x:520,y:400},{id:'orion',name:'Orion',x:380,y:250},
 {id:'cetus',name:'Cetus',x:220,y:450},{id:'aster',name:'Aster',x:600,y:180},
 {id:'lysara',name:'Lysara',x:750,y:300},{id:'vela',name:'Vela',x:850,y:180},
 {id:'umbra',name:'Umbra',x:760,y:650},{id:'nyx',name:'Nyx',x:520,y:720},
 {id:'solace',name:'Solace',x:870,y:730},{id:'nova',name:'Nova',x:330,y:700}
];
export function galaxyDistance(start,system,slot=1){return Math.max(1,Math.hypot(start.x-system.x,start.y-system.y)/40+slot*.15);}
export function galaxyFlight(s,from,target,start,ship='longProbe'){
 const origin=from.system?{x:from.x,y:from.y}:start;
 const distance=galaxyDistance(origin,target,target.slot||1),level=s.tech.ramjet||0;
 return {distance,ms:Math.ceil((60+distance*25)/(1+level*.12))*1000,fuel:Math.ceil(distance*(ship==='longProbe'?6:18)/(1+level*.12))};
}
export function validateGalaxy(data){
 if(!data||!Array.isArray(data.systems)||data.systems.length!==10||!Array.isArray(data.planets)||!Array.isArray(data.missions)||!data.start)throw Error('Ungültige Galaxie-Antwort.');
 const finite=n=>typeof n==='number'&&Number.isFinite(n),ids=new Set();
 for(const sys of data.systems){if(!GALAXY_SYSTEMS.some(s=>s.id===sys.id)||ids.has(sys.id)||!finite(sys.x)||!finite(sys.y)||!Number.isInteger(sys.planetCount)||sys.planetCount<3||sys.planetCount>10)throw Error('Ungültige Systemdaten.');ids.add(sys.id);}
 if(!finite(data.start.x)||!finite(data.start.y)||data.planets.length>100||data.missions.length>100)throw Error('Ungültige Galaxiedaten.');
 for(const p of data.planets){if(!ids.has(p.system)||!/^g-[a-z]+-p(?:[1-9]|10)$/.test(p.id)||!Number.isInteger(p.slot)||p.slot<1||p.slot>10||typeof p.surveyed!=='boolean')throw Error('Ungültige Planetendaten.');if(!p.surveyed&&Object.keys(p).some(k=>!['id','system','slot','surveyed'].includes(k)))throw Error('Nicht freigegebene Untersuchungsdaten.');if(p.surveyed&&(typeof p.name!=='string'||p.name.length>40||!Array.isArray(p.mult)||p.mult.length!==3||p.mult.some(n=>!finite(n)||n<0||n>10)||!['home','ferrum','nereus','thalassa'].includes(p.image)||!['mine','foreign','free'].includes(p.owner)||typeof p.reserved!=='boolean'||!finite(p.energy)||p.energy<=0))throw Error('Ungültige Untersuchungsdaten.');}
 if(!finite(data.serverNow)||data.missions.some(m=>!['scan','colony'].includes(m.kind)||typeof m.id!=='string'||typeof m.to!=='string'||!ids.has(m.system)||!finite(m.due)||!finite(m.arrival)||!finite(m.start)||m.start>m.arrival||m.arrival>m.due))throw Error('Ungültige Galaxieflüge.');
 return data;
}
