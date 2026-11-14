import navigateTo, {pagesRoutes} from '../utils/navigator.js'
import socket from '../socket/socket.js'

let roomCreateId, roomJoinId, userId;
if (sessionStorage.getItem('gameMode') == 'multiPlayer'){
  roomCreateId = sessionStorage.getItem('roomCreateId');
  sessionStorage.removeItem('roomCreateId');
  roomJoinId = sessionStorage.getItem('roomJoinId');
  sessionStorage.removeItem('roomJoinId');
  userId = sessionStorage.getItem('userId');
  sessionStorage.removeItem('userId');
}

let gameMode;
document.getElementById("play")?.addEventListener('click', async ()=>{
  gameMode = sessionStorage.getItem('gameMode');
  const playedAs = document.getElementById("playAs").value;
  const botDiff = document.getElementById("botDiff")?.value;
  let timerOn, gameTime;
  if (gameMode == 'multiPlayer')
    timerOn = document.getElementById("timer").checked;
  if (gameMode == 'multiPlayer')
    gameTime = document.getElementById("timeValue").textContent;
  if (botDiff != undefined)
  sessionStorage.setItem('botDiff', `${botDiff}`);
  sessionStorage.setItem('gameTime', `${gameTime}`);
  sessionStorage.setItem('timerOn', `${timerOn}`);
  sessionStorage.setItem('playedAs', `${playedAs}`);
  console.log(gameMode)
  if (gameMode == 'multiPlayer'){
    const responce = await socket.timeout(5000).emitWithAck('save settings', roomCreateId || roomJoinId, userId, timerOn, playedAs, gameTime);
      if (responce.success){
        sessionStorage.setItem('roomCreateId', roomCreateId);
        sessionStorage.setItem('roomJoinId', roomJoinId);
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('room', responce.room);
        navigateTo(pagesRoutes.arena);
      }else{
        console.log(responce.message);
      }
    }
    else{
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

  if (sessionStorage.getItem('gameMode') != 'multiPlayer'){
    const stepperEl = document.getElementById('stepper');
    stepperEl.remove();
  }