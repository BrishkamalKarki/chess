import {rooms} from "../utils/rooms.js";
import GameState from "../chess/gameState.js";
import { Timer } from "../chess/timer.js";
import { stateToRoom } from "../utils/games.js";

let gameState, timer;
function registerSettingEvents(io, socket){
  // saving the passed variables
  socket.on('save settings', (roomId, userId, timerOn, playedAs, gameTime, callback)=>{
    const room = rooms.get(roomId);
    if (!room){
      return callback({
        success: false,
        message: 'NO SUCH ROOM EXISTS'
      })
    }
    if (room.gameOn){
      return callback({
        success: false,
        message: 'GAME IS ALREADY ON'
      })
    }
    if (room.player1 != userId){
      return callback({
        success: false,
        message: 'ONLY HOST CAN ASSIGN THE SETTINGS'
      })
    }
    room.timerOn = timerOn;
    room.gameTime = gameTime;
    room.player1PlayedAs = playedAs;
    room.player2PlayedAs = (playedAs == 'white')? 'black' : 'white';
    room.turn = 'white';
    room.player1online = true;
    room.player2online = false;
    room.player2joined = false;
    room.roomReady = true;
    room.gameOn = false;
    socket.join(roomId);
    return callback({
      success: true,
      message: 'SUCCEFULLY SAVED GAME SETTINGS'
    })
  });

  socket.on('get settings', (roomId, userId, callback)=>{
    const room = rooms.get(roomId);
    if (!room){
      return callback({
        success: false,
        message: 'NO SUCH ROOM EXISTS'
      })
    }
    let playedAs;
    if (room.player1 == userId)
      playedAs = room.player1PlayedAs;
    else
      playedAs = room.player2PlayedAs;

    let roomState = stateToRoom[`${roomId}`];
    if (room.gameOn){
      room.player2online = true;
      room.player2joined = true;
      if (!roomState){
        gameState = new GameState(roomId);
        // room.gameState = gameState;
        timer = new Timer(roomId, gameState, io);
        room.gameState = gameState;
        room.timer = timer;
        roomState = {gameState: gameState, timer: timer};
        stateToRoom[`${roomId}`] = roomState;
      }
      else{
        gameState = roomState.gameState;
        timer = roomState.timer;
      }
    }

    socket.join(roomId);
    callback({
      success: true,
      message: 'SUCCEFULLY PASSED GAME SETTINGS',
      timerOn: room.timerOn,
      gameTime: room.gameTime,
      playedAs: playedAs,
      turn: 'white',
      id: roomId
    })

    if (room.timerOn && room.gameOn && timer && !timer.whiteInterval && !timer.blackInterval){
      timer.startTimer();
      io.sockets.in(roomId).emit('start time', timer.getTime());
    }
  });
};

export {registerSettingEvents};
