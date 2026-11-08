import navigateTo, {pagesRoutes} from '../utils/navigator.js';

document.getElementById("singleP")?.addEventListener('click', ()=>{
  sessionStorage.setItem('gameMode', 'singlePlayer');
  navigateTo(pagesRoutes.sPgameConfig);
}); 

document.getElementById("multiP")?.addEventListener('click', ()=>{
  sessionStorage.setItem('gameMode', 'multiPlayer');
  navigateTo(pagesRoutes.msPL);
});

