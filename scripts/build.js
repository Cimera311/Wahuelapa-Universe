import {newsView} from '../src/news.js';
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
// A deterministic dependency-free static build. Source remains modular for tests.
const files=['config','realm-config','rapid-fire-ui','flight','galaxy','combat','repair','engine','storage','cloud-config','cloud','sync-policy','ui-assets','reports-ui','combat-summary','combat-ui','flight-ui','fleet-controls','news','pvp-ui','social-ui','fleet-overview','repair-ui','scrap-ui','fleet-navigation','community','pirates-config','pirates-ui','app'];
const js=files.map(f=>readFileSync(`src/${f}.js`,'utf8').replaceAll('\r\n','\n').replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
const css=readFileSync('src/style.css','utf8').replaceAll('\r\n','\n').replaceAll("url('../assets/","url('./assets/");
let html=readFileSync('index.html','utf8').replaceAll('\r\n','\n').replace(/<link rel="stylesheet" href="\.\/src\/style\.css(?:\?[^"]*)?">/,`<style>${css}</style>`).replace(/<script type="module" src="\.\/src\/app\.js(?:\?[^"]*)?"><\/script>/,`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
mkdirSync('dist',{recursive:true});cpSync('assets','dist/assets',{recursive:true});writeFileSync('dist/index.html',html);writeFileSync('START_HERE.html',html);writeFileSync('dist/.nojekyll','');console.log('Built dist/index.html, assets and START_HERE.html');

const news=`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>News & Patchnotes · WaHueLaPa Universe</title><style>${css}</style></head><body><main class="public-news"><a href="./index.html">← Zum Spiel</a>${newsView()}</main></body></html>`;writeFileSync('dist/news.html',news);writeFileSync('news.html',news);
