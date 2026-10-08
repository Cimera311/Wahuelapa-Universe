import {validateGalaxy} from './galaxy.js';
import {validateSave} from './storage.js';
export class CloudConflict extends Error {constructor(){super('Ein anderes Gerät hat einen neueren Spielstand gespeichert. Exportiere bei Bedarf deinen lokalen Stand und lade dann den Cloud-Stand.');this.name='CloudConflict';}}
// Client injected for tests. Saves use a database-side atomic revision check.
export function createCloud(client,redirectUrl){
 let user=null,revision=0,loaded=false,busy=false;
 const checked=result=>{if(result.error)throw result.error;return result.data;};
 return {
  get user(){return user;},get revision(){return revision;},get loaded(){return loaded;},
  async session(){const data=checked(await client.auth.getSession());user=data.session?.user||null;loaded=false;return user;},
  async signIn(email,password){if(busy)throw Error('Speicherung läuft noch.');const data=checked(await client.auth.signInWithPassword({email,password}));user=data.user;loaded=false;return user;},
  async signUp(email,password){return checked(await client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl}}));},
  async signOut(){if(busy)throw Error('Speicherung läuft noch.');checked(await client.auth.signOut());user=null;revision=0;loaded=false;},
  async leaderboard(){if(!user)throw Error('Bitte anmelden, um die gemeinsame Rangliste zu sehen.');const result=await client.rpc('imperium_leaderboard');if(result.error){if(result.error.code==='PGRST202'||result.error.code==='42883')throw Error('Die Rangliste benötigt noch die einmalige Supabase-Erweiterung (supabase/leaderboard.sql).');throw result.error;}if(!Array.isArray(result.data))throw Error('Ungültige Ranglisten-Antwort.');return result.data;},
  async galaxyView(){if(!user)throw Error('Bitte anmelden, um die gemeinsame Galaxie zu laden.');const result=await client.rpc('imperium_galaxy_view');if(result.error){if(['PGRST202','42883','42P01'].includes(result.error.code))throw Error('Die gemeinsame Galaxie benötigt die einmalige Supabase-Erweiterung (supabase/galaxy.sql).');throw result.error;}return validateGalaxy(result.data);},
  async galaxySync(action={}){if(!user||!loaded)throw Error('Cloud-Spielstand zuerst laden.');if(busy)throw Error('Speicherung läuft noch.');busy=true;try{const result=await client.rpc('imperium_galaxy_sync',{p_expected:revision,p_kind:action.kind||null,p_from:action.from||null,p_to:action.to||null});if(result.error){if(result.error.message?.includes('SAVE_CONFLICT')){loaded=false;throw new CloudConflict();}throw result.error;}const next=Number(result.data?.revision);if(!Number.isSafeInteger(next)||next<revision||next>revision+1)throw Error('Ungültige Galaxie-Version.');const state=validateSave(result.data.state),galaxy=validateGalaxy(result.data.galaxy);revision=next;return {state,galaxy};}finally{busy=false;}},
  async load(){if(!user)throw Error('Bitte anmelden.');if(busy)throw Error('Speicherung läuft noch.');loaded=false;const row=checked(await client.from('game_saves').select('state,revision').eq('user_id',user.id).maybeSingle());const state=row?validateSave(row.state):null;revision=row?Number(row.revision):0;if(!Number.isSafeInteger(revision)||revision<0)throw Error('Ungültige Cloud-Version.');loaded=true;return state;},
  async save(state){if(!user||!loaded)throw Error('Cloud-Spielstand zuerst laden.');if(busy)throw Error('Speicherung läuft noch.');const snapshot=validateSave(state);busy=true;try{const result=await client.rpc('save_imperium',{p_state:snapshot,p_expected:revision});if(result.error){if(result.error.message?.includes('SAVE_CONFLICT')){loaded=false;throw new CloudConflict();}throw result.error;}const next=Number(result.data);if(next!==revision+1)throw Error('Cloud-Speicherung lieferte keine gültige Bestätigung.');revision=next;return next;}finally{busy=false;}}
 };
}
export async function connectCloud(config){
 if(!config.enabled)return null;
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url)||!config.publishableKey)throw Error('Cloud-Konfiguration fehlt oder ist ungültig.');
 const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm');
 return createCloud(createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}),config.redirectUrl);
}
