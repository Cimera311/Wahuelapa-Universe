import {SHIPS} from './config.js';

const uiArtRoot='./assets/pvp-resource-v1/';
export const RESOURCE_ART=Object.fromEntries(['metal','crystal','fuel','energy'].map(k=>[k,uiArtRoot+'resources/'+k+'-128.webp']));
export const ACTION_ART=Object.fromEntries(['attack','protection','repair','debris','pvpPause','cancelShip'].map(k=>[k,uiArtRoot+'actions/'+k+'-128.webp']));
const uiPicture=(src,cls)=>src?'<img class="'+cls+'" src="'+src+'" alt="" aria-hidden="true" width="32" height="32" decoding="async">':'';
export function resourceIcon(key){return uiPicture(RESOURCE_ART[key],'resource-art');}
export function actionIcon(key){return uiPicture(ACTION_ART[key],'action-art');}
export function unitIcon(key){const sh=SHIPS[key];if(!sh)return '';return uiPicture(sh.asset?.replace('.webp','-128.webp')||'./assets/'+(sh.image||key)+'.webp','unit-art');}
