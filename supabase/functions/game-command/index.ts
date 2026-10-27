import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import {runServerCommand} from '../../../src/server-service.js';
import {createCommandMetrics,measure,measureAsync} from '../../../src/server-metrics.js';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 const metrics=createCommandMetrics({rate:Deno.env.get('GAME_COMMAND_METRICS_RATE')||0});
 let status=500;
 const respond=(body,code=200)=>{status=code;const text=measure(metrics,'serialization',()=>JSON.stringify(body));metrics?.response(text);return new Response(text,{status:code,headers});};
 try{
  if(req.method!=='POST')return respond({error:'Nur POST erlaubt.'},405);
  const token=req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)return respond({error:'Bitte anmelden.'},401);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await measureAsync(metrics,'auth',()=>db.auth.getUser(token));
  if(error||!data.user)return respond({error:'Anmeldung abgelaufen.'},401);
  const raw=await req.text();if(raw.length>32000)return respond({error:'Anfrage zu groß.'},413);
  const result=await runServerCommand(db,data.user.id,JSON.parse(raw),metrics,{snapshot:Deno.env.get('GAME_COMMAND_SNAPSHOT')});
  return respond(result);
 }catch(error){
  if(error?.code==='WORLD_SAVE_INVALID'){
   const diagnostic={code:error.code,phase:error.phase,rule:error.rule};
   console.error('world_save_validation_failed',JSON.stringify(diagnostic));
   return respond({error:error.message,...diagnostic},503);
  }
  const code=error instanceof Error&&'status' in error?Number(error.status):400;
  return respond({error:error instanceof Error?error.message:'Serverfehler.'},code);
 }finally{metrics?.finish(status);}
});
