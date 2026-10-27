import {readFileSync} from 'node:fs';
export function summarize(records){
 const groups={};
 const percentiles=values=>{values.sort((a,b)=>a-b);return Object.fromEntries([50,95,99].map(p=>['p'+p,values.length?values[Math.ceil(values.length*p/100)-1]:null]));};
 for(const record of records){
  if(record.kind!=='game_command_metrics'||record.schema!==1)continue;
  const key=(record.snapshotMode||'legacy')+'/'+record.type+'/'+record.action;
  (groups[key]??=[]).push(record);
 }
 return Object.fromEntries(Object.entries(groups).map(([key,rows])=>{
  const timings={};for(const name of new Set(rows.flatMap(r=>Object.keys(r.ms))))timings[name]=percentiles(rows.map(r=>r.ms[name]||0));
  const retries={};for(const r of rows)retries[r.retries]=(retries[r.retries]||0)+1;
  return [key,{requests:rows.length,errors:rows.filter(r=>r.status>=400).length,errorRate:rows.filter(r=>r.status>=400).length/rows.length,totalMs:percentiles(rows.map(r=>r.totalMs)),phaseMs:timings,snapshotBytes:percentiles(rows.flatMap(r=>r.attempts.map(a=>a.snapshotBytes))),responseBytes:percentiles(rows.map(r=>r.responseBytes)),retries}];
 }));
}
export function parseMetrics(text){return text.split(/\r?\n/).flatMap(line=>{
 // Accept JSONL and the local console prefix. Ignore unrelated output.
 const start=line.indexOf('{"kind":"game_command_metrics"');if(start<0)return [];
 try{const r=JSON.parse(line.slice(start));return r.kind==='game_command_metrics'&&r.schema===1?[r]:[];}catch{return [];}
});}
if(process.argv[1]?.endsWith('summarize-command-metrics.mjs')){
 if(!process.argv[2])throw Error('Usage: node scripts/summarize-command-metrics.mjs <local-log-file>');
 console.log(JSON.stringify(summarize(parseMetrics(readFileSync(process.argv[2],'utf8'))),null,2));
}
