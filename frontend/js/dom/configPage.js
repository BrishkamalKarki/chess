// contains dom for the initial 3 config files
import navigateTo, {pagesRoutes} from '../utils/navigator.js';
// import path from 'node:path';

let gameMode;

document.getElementById("singleP")?.addEventListener('click', ()=>{
  sessionStorage.setItem('gameMode', 'singlePlayer');
  navigateTo(pagesRoutes.sPgameConfig);
}); 

document.getElementById("multiP")?.addEventListener('click', ()=>{
  sessionStorage.setItem('gameMode', 'multiPlayer');
  navigateTo(pagesRoutes.msPL);
});

document.getElementById("createRoom")?.addEventListener('click', ()=>{
  const gameMode = sessionStorage.getItem('gameMode');
  if (gameMode === 'multiPlayer'){
    const id = document.getElementById('roomIdMaker').value;
    sessionStorage.setItem('roomCreateId', ``);
    if (!id){
      document.getElementById('roomIdMaker').value = "";
      roomIdMaker.placeholder = 'FIELD EMPTY!';
      return;
    }
    if (Number.isNaN(Number(id))){
      console.log(id);
      document.getElementById('roomIdMaker').value = "";
      roomIdMaker.placeholder = 'ONLY NUMBERS ALLOWED';
      return;
    }
    if (!Number.isNaN(Number(id))){
      document.getElementById('roomIdMaker').value = "";
      if (!(Number(id) >= 1000 && Number(id) <= 9999)){
        roomIdMaker.placeholder = 'ONLY 4 DIGITS ALLOWED';
        return;
      }
    }
    document.getElementById('roomIdMaker').value = "";
    roomIdMaker.placeholder = '';
    sessionStorage.setItem('roomCreateId', `${id}`);
    navigateTo(pagesRoutes.mPgameConfig);
  }
});

document.getElementById("joinRoom")?.addEventListener('click', ()=>{
  const gameMode = sessionStorage.getItem('gameMode');
  if (gameMode === 'multiPlayer'){
    const id = document.getElementById('roomIdHolder').value;
    
    sessionStorage.setItem('roomJoinId', ``);
    if (!id){
      document.getElementById('roomIdHolder').value = "";
      roomIdHolder.placeholder = 'FIELD EMPTY!';
      return;
    }
    if (Number.isNaN(Number(id))){
      console.log(id);
      document.getElementById('roomIdHolder').value = "";
      roomIdHolder.placeholder = 'ONLY NUMBERS ALLOWED';
      return;
    }
    if (!Number.isNaN(Number(id))){
      if (!(Number(id) >= 1000 && Number(id) <= 9999)){
        document.getElementById('roomIdHolder').value = "";
        roomIdHolder.placeholder = 'ONLY 4 DIGITS ALLOWED';
        return;
      }
    }
    document.getElementById('roomIdHolder').value = "";
    roomIdHolder.placeholder = '';
    sessionStorage.setItem('roomJoinId', `${id}`);
    navigateTo(pagesRoutes.mPgameConfig);
  }
});

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