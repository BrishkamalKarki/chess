import socket from '../socket/socket.js';

let playedAs, gameMode, timerOn, botDiff, gameTime, roomCreateId, roomJoinId, userId;

export async function getGameVars(){
  if (sessionStorage.getItem('gameMode') == 'singlePlayer'){
    gameMode = sessionStorage.getItem('gameMode');
    playedAs = sessionStorage.getItem('playedAs');
    timerOn = sessionStorage.getItem('timerOn');
    botDiff = sessionStorage.getItem('botDiff');
    gameTime = sessionStorage.getItem('gameTime');

    sessionStorage.removeItem('playedAs');
    sessionStorage.removeItem('timerOn');
    sessionStorage.removeItem('botDiff');
    sessionStorage.removeItem('gameTime');
  }
  else{
    gameMode = 'multiPlayer';
    roomCreateId = sessionStorage.getItem('roomCreateId');
    roomJoinId = sessionStorage.getItem('roomJoinId');
    userId = sessionStorage.getItem('userId');
    sessionStorage.removeItem('roomCreateId');
    sessionStorage.removeItem('roomJoinId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('playedAs');
    sessionStorage.removeItem('timerOn');
    sessionStorage.removeItem('gameTime');
    const responce = await socket.timeout(5000).emitWithAck('get settings', roomCreateId || roomJoinId, userId);
    if (responce.success){
      gameTime = responce.gameTime;
      timerOn = responce.timerOn;
      playedAs = responce.playedAs;
      console.log(responce.message);
    }
    else{
      console.log(responce.message);
    }
  };

  return{
    gameMode: gameMode,
    playedAs: playedAs,
    timerOn: timerOn,
    botDiff: botDiff,
    gameTime: gameTime,
    roomCreateId: roomCreateId,
    roomJoinId: roomJoinId,
    userId: userId
  }
}