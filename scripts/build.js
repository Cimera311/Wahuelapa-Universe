import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
// A deterministic dependency-free static build. Source remains modular for tests.
const files=['config','galaxy','combat','engine','storage','cloud-config','cloud','ui-assets','reports-ui','flight-ui','pvp-ui','app'];
const js=files.map(f=>readFileSync(`src/${f}.js`,'utf8').replaceAll('\r\n','\n').replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
const css=readFileSync('src/style.css','utf8').replaceAll('\r\n','\n').replaceAll("url('../assets/","url('./assets/");
let html=readFileSync('index.html','utf8').replaceAll('\r\n','\n').replace(/<link rel="stylesheet" href="\.\/src\/style\.css(?:\?[^"]*)?">/,`<style>${css}</style>`).replace(/<script type="module" src="\.\/src\/app\.js(?:\?[^"]*)?"><\/script>/,`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
mkdirSync('dist',{recursive:true});cpSync('assets','dist/assets',{recursive:true});writeFileSync('dist/index.html',html);writeFileSync('START_HERE.html',html);writeFileSync('dist/.nojekyll','');console.log('Built dist/index.html, assets and START_HERE.html');
