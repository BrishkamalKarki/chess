import navigateTo, {pagesRoutes} from '../utils/navigator.js'

document.getElementById("play")?.addEventListener('click', ()=>{
  const gameMode = sessionStorage.getItem('gameMode');
  if (gameMode === 'singlePlayer'){
    const playedAs = document.getElementById("playAs").value;
    sessionStorage.setItem('playedAs', `${playedAs}`);
    const botDiff = document.getElementById("botDiff").value;
    sessionStorage.setItem('botDiff', `${botDiff}`);
    const timerOn = document.getElementById("timer").checked;
    sessionStorage.setItem('timerOn', `${timerOn}`);
    const gameTime = document.getElementById("timeValue").textContent;
    sessionStorage.setItem('gameTime', `${gameTime}`);
    navigateTo(pagesRoutes.arena);
  }
});

document.getElementById("dec")?.addEventListener('click', ()=>{
  let gameTime = Number(document.getElementById("timeValue").textContent);
  if (gameTime >= 2)
  document.getElementById("timeValue").textContent = `${gameTime-1}`;
});

document.getElementById("inc")?.addEventListener('click', ()=>{
  let gameTime = Number(document.getElementById("timeValue").textContent);
  document.getElementById("timeValue").textContent = `${gameTime+1}`;
});