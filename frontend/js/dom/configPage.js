// contains dom for the initial 3 config files
import navigateTo, {pagesRoutes} from '../utils/navigator.js';
// import path from 'node:path';

document.getElementById("singleP")?.addEventListener('click', ()=>{
  navigateTo(pagesRoutes.gameConfig);
}); 

document.getElementById("multiP")?.addEventListener('click', ()=>{
  navigateTo(pagesRoutes.msPL);
});

document.getElementById("createRoom")?.addEventListener('click', ()=>{
  navigateTo(pagesRoutes.gameConfig);
});

document.getElementById("play")?.addEventListener('click', ()=>{
  navigateTo(pagesRoutes.arena);
});