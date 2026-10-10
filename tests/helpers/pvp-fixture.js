const DAY=86400000;
import {newGame} from '../../src/engine.js';
import {TECHS,SHIPS,vector} from '../../src/config.js';
export const A='00000000-0000-0000-0000-000000000001',B='00000000-0000-0000-0000-000000000002';
export const ID='10000000-0000-0000-0000-000000000001',T=1700000000000;
export function fixture(){
 const saves=[A,B].map((user_id,i)=>{
  const s=newGame(i?'Defender':'Attacker',T);s.galaxy={x:500,y:i?40:960};for(const [k,t] of Object.entries(TECHS))s.tech[k]=t.max;
  const p=structuredClone(s.planets[0]);Object.assign(p,{id:i?'g-orion-p1':'g-helion-p1',name:i?'Target':'Origin',system:i?'orion':'helion',slot:1,x:i?380:520,y:i?250:400});
  p.resources=vector([10000,10000,10000]);p.buildings.warehouse=4;p.buildings.metal=p.buildings.crystal=p.buildings.fuel=0;p.buildings.orbital=4;
  p.ships.waechter=i?0:4;p.ships.karawane=i?0:4;
  s.planets.push(p);s.active=p.id;return {user_id,revision:1,state:s};
 });
 return {now:T,settings:{enabled:true,epoch:1},admins:[A],saves,starts:[{user_id:A,x:500,y:960},{user_id:B,x:500,y:40}],surveys:[],missions:[],attacks:[],
 planets:saves.map(r=>({id:r.state.active,meta:((p)=>Object.fromEntries(['id','system','slot','x','y','name','coord','kind','image','mult','ocean','energy','color','distance'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]])))(r.state.planets[1]),owner_id:r.user_id,reserved:false,colonized_at:T-DAY-1,protection_ended:false,debris:vector([0,0,0])}))};
}
