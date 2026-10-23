import {SHIPS} from './config.js';

const uiArtRoot='./assets/pvp-resource-v1/';
export const RESOURCE_ART=Object.fromEntries(['metal','crystal','fuel','energy'].map(k=>[k,uiArtRoot+'resources/'+k+'-128.webp']));
export const ACTION_ART=Object.fromEntries(['attack','protection','repair','debris','pvpPause','cancelShip'].map(k=>[k,uiArtRoot+'actions/'+k+'-128.webp']));
const uiPicture=(src,cls)=>src?'<img class="'+cls+'" src="'+src+'" alt="" aria-hidden="true" width="32" height="32" decoding="async">':'';
export function resourceIcon(key){return uiPicture(RESOURCE_ART[key],'resource-art');}
export function actionIcon(key){return uiPicture(ACTION_ART[key],'action-art');}
const V3_SHIP_KEYS=new Set(['falke','waechter','donner','titan','kurier','transport','karawane','atlas','arche','spyProbe','probe','longProbe','colony','starColony']);
export function unitArtPath(key){const sh=SHIPS[key];if(!sh)return '';return V3_SHIP_KEYS.has(key)?'./assets/ship-icons-v3/'+key+'.webp':sh.asset?.replace('.webp','-128.webp')||'./assets/'+(sh.image||key)+'.webp';}
export function unitIcon(key){return uiPicture(unitArtPath(key),'unit-art');}
