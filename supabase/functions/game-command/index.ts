import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import {runServerCommand} from '../../../src/server-service.js';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return new Response(JSON.stringify({error:'Nur POST erlaubt.'}),{status:405,headers});
 try{
  const token=req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)return new Response(JSON.stringify({error:'Bitte anmelden.'}),{status:401,headers});
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.auth.getUser(token);
  if(error||!data.user)return new Response(JSON.stringify({error:'Anmeldung abgelaufen.'}),{status:401,headers});
  const raw=await req.text();if(raw.length>32000)return new Response(JSON.stringify({error:'Anfrage zu groß.'}),{status:413,headers});
  const result=await runServerCommand(db,data.user.id,JSON.parse(raw));
  return new Response(JSON.stringify(result),{headers});
 }catch(error){const status=error instanceof Error&&'status' in error?Number(error.status):400;return new Response(JSON.stringify({error:error instanceof Error?error.message:'Serverfehler.'}),{status,headers});}
});
