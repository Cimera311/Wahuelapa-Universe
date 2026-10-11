const communityEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const communityStatuses={open:'Offen',planned:'Geplant',done:'Umgesetzt'};
export function communityRows(items,kind,isAdmin=false){
 return items.filter(p=>!p.deleted).sort((a,b)=>kind==='chat'?a.id-b.id:b.id-a.id).map(p=>{
  const date=new Date(p.createdAt),time=Number.isFinite(date.getTime())?date.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
  return `<article class="community-entry ${p.mine?'is-mine':''}" data-community-id="${p.id}"><div class="community-meta"><strong>${communityEscape(p.commander)}</strong><time datetime="${communityEscape(p.createdAt)}">${time}</time>${p.mine||isAdmin?`<button type="button" class="plain community-remove" data-community-op="delete" data-id="${p.id}">Ausblenden</button>`:''}</div>${kind==='wish'?`<h2>${communityEscape(p.title)}</h2><span class="community-status status-${p.status}">${communityStatuses[p.status]||'Offen'}</span>`:''}<p class="community-body">${communityEscape(p.body)}</p>${kind==='wish'?`<div class="community-wish-actions"><button type="button" data-community-op="vote" data-id="${p.id}" data-vote="${!p.voted}" aria-pressed="${p.voted}">♡ ${p.votes} · ${p.voted?'Unterstützt':'Unterstützen'}</button>${isAdmin?`<label>Status <select data-community-status="${p.id}">${Object.entries(communityStatuses).map(([key,label])=>`<option value="${key}" ${p.status===key?'selected':''}>${label}</option>`).join('')}</select></label>`:''}</div>`:''}</article>`;
 }).join('')||`<p class="community-empty muted">${kind==='chat'?'Noch keine Nachrichten. Starte das Gespräch!':'Noch keine Wünsche. Teile deine erste Idee!'}</p>`;
}

// A separate modal owns its requests and timer. Game rendering cannot erase a draft.
export function openCommunity(kind,context){
 if(!['chat','wish'].includes(kind))return;
 document.querySelector('dialog')?.remove();
 const d=document.createElement('dialog');d.className='community-dialog';d.setAttribute('aria-labelledby','community-heading');
 const wish=kind==='wish';let rows=[],admin=false,busy=false,loading=false,more=false,oldest=null,timer=null,request=null,account=context().cloud?.user?.id;
 d.innerHTML=`<form method="dialog" class="community-close"><button aria-label="Schließen">×</button></form><div class="page-heading"><span class="eyebrow">COMMUNITY</span><h1 id="community-heading">${wish?'Wünsche & Ideen':'Universum-Chat'}</h1><p>${wish?'Was wünschst du dir für WaHueLaPa? Teile deine Idee und unterstütze andere.':'Ein gemeinsamer Treffpunkt für alle Commander.'}</p></div><p class="community-identity fine"></p><div class="community-toolbar"><button type="button" data-community-refresh>Aktualisieren</button><span class="fine">${wish?'Neueste Ideen zuerst':'Aktualisiert alle 15 Sekunden'}</span></div><p class="community-error" role="status" aria-live="polite"></p><button type="button" data-community-older hidden>Ältere Beiträge laden</button><div class="community-feed" role="${wish?'region':'log'}" aria-label="${wish?'Wünsche':'Chatnachrichten'}" aria-live="${wish?'off':'polite'}" aria-relevant="additions text"><p class="muted">Beiträge werden geladen …</p></div><form class="community-compose">${wish?'<label>Titel<input name="title" minlength="3" maxlength="80" required placeholder="Deine Idee in einem Satz"></label>':''}<label>${wish?'Dein Wunsch':'Deine Nachricht'}<textarea name="body" rows="${wish?4:2}" maxlength="${wish?3000:800}" required placeholder="${wish?'Beschreibe, was dir fehlt oder was du verbessern möchtest.':'Schreib etwas an alle …'}"></textarea></label><div class="community-compose-footer"><span class="fine">${wish?'Bis 3.000 Zeichen · ein Wunsch pro Minute':'Bis 800 Zeichen · 5 Sekunden Abstand'}</span><button type="submit">${wish?'Wunsch veröffentlichen':'Senden'}</button></div></form>`;
 document.body.append(d);d.showModal();
 const feed=d.querySelector('.community-feed'),form=d.querySelector('.community-compose'),error=d.querySelector('.community-error');
 const stop=()=>{clearInterval(timer);timer=null;};d.addEventListener('close',stop);
 const live=()=>{if(!d.isConnected||!d.open){stop();return false;}if(account!==context().cloud?.user?.id){stop();feed.replaceChildren();form.hidden=true;error.textContent='Dein Konto hat sich geändert. Öffne den Bereich erneut.';return false;}return true;};
 function update(){const bottom=feed.scrollHeight-feed.scrollTop-feed.clientHeight<50,position=feed.scrollTop;const html=communityRows(rows,kind,admin);if(feed.innerHTML!==html)feed.innerHTML=html;if(kind==='chat'&&bottom)feed.scrollTop=feed.scrollHeight;else feed.scrollTop=position;d.querySelector('[data-community-older]').hidden=!more;}
 function controls(){d.querySelectorAll('[data-community-op], [data-community-status], .community-compose button, .community-compose input, .community-compose textarea').forEach(b=>b.disabled=busy);}
 async function load(older=false){
  if(!live()||loading)return;const {cloud,state}=context();
  if(!cloud?.user){form.hidden=true;feed.innerHTML='<p class="community-empty">Melde dich an, um den gemeinsamen Chat und die Wünsche zu nutzen.</p>';return;}
  d.querySelector('.community-identity').textContent='Du schreibst als '+(state?.name||'Commander');form.hidden=false;loading=true;
  try{const data=await cloud.community(kind,{before:older?oldest:null});if(!live())return;admin=data.isAdmin;rows=[...new Map([...rows,...data.items].map(p=>[p.id,p])).values()];if(older||oldest===null){more=data.hasMore;oldest=data.items.length?Math.min(...data.items.map(p=>p.id)):oldest;}error.textContent='';update();controls();}
  catch(e){if(live()){error.textContent=e.message||'Beiträge konnten nicht geladen werden.';if(!rows.length)feed.innerHTML='<p class="community-empty">Die Community ist gerade nicht erreichbar. Versuche es erneut.</p>';}}
  finally{loading=false;}
 }
 async function mutate(params){
  if(busy||!live())return false;const {cloud}=context();if(!cloud?.user)return false;busy=true;controls();error.textContent='';
  try{await cloud.community(kind,params);if(!live())return false;return true;}catch(e){if(live())error.textContent=e.message||'Beitrag konnte nicht gespeichert werden.';return false;}finally{busy=false;if(live())controls();}
 }
 form.addEventListener('submit',async e=>{e.preventDefault();const body=form.elements.body.value.trim(),title=wish?form.elements.title.value.trim():'';if(!body)return;if(!request||request.body!==body||request.title!==title)request={body,title,request:crypto.randomUUID()};if(await mutate({op:'post',...request})){form.reset();request=null;await load();form.elements.body.focus();}});
 d.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-community-refresh'))await load();if(b.hasAttribute('data-community-older'))await load(true);if(b.dataset.communityOp){const id=Number(b.dataset.id),op=b.dataset.communityOp;if(await mutate({op,id,vote:b.dataset.vote==='true'})){if(op==='delete'){rows=rows.map(p=>p.id===id?{...p,deleted:true}:p);update();}else if(op==='vote'){rows=rows.map(p=>p.id===id?{...p,voted:b.dataset.vote==='true',votes:p.votes+(b.dataset.vote==='true'?1:-1)}:p);update();}await load();}}});
 d.addEventListener('change',async e=>{const id=Number(e.target.dataset.communityStatus);if(!id)return;const status=e.target.value;if(await mutate({op:'status',id,status})){rows=rows.map(p=>p.id===id?{...p,status}:p);update();await load();}else update();});
 void load();timer=setInterval(()=>{if(live()&&!document.hidden&&!busy)void load();},15000);
 return d;
}
