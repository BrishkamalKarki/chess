import { gameVars } from "../chessBoard/board.js";

const dynamicEl= document.querySelector('.dynamic');
if (gameVars.playedAs == 'white'){
  document.querySelector('#dynamicYou').style.background = '#77b8b2';
  document.querySelector('#dynamicOpp').style.background = '#1e5754';
}
else{
  document.querySelector('#dynamicYou').style.background = '#1e5754';
  document.querySelector('#dynamicOpp').style.background = '#77b8b2';
}

if (gameVars.gameMode == 'singlePlayer'){
  let min = gameVars.gameTime - 1;
  let sec = 60;
  if (gameVars.timerOn == 'true'){
    setInterval(()=>{
      if (!gameVars.timeOutMine){
        console.log(min, sec, gameVars.timeOutMine)
        sec -= 1;
        if (sec == 0){
          if (min == 0) gameVars.timeOutMine = true;
          min -= 1;
          sec = 59;
        }
        document.getElementById("youTime").textContent = `${min}:${sec}`
      }
      else{
        document.getElementById("youTime").textContent = '00:00'
      }}, 1000);
  }
 

  let botMin = gameVars.gameTime - 1;
  let botSec = 60;
  if (gameVars.timerOn == 'true'){
    setInterval(()=>{
      if (!gameVars.timeOutOpp){
        botSec -= 1;
        if (botSec == 0){
          if (botMin == 0) gameVars.timeOutOpp = true;
          botMin -= 1;
          botSec = 59;
        }
      }
      else{
        document.getElementById("youTime").textContent = '00:00'
      }}, 1000);
  }
}

