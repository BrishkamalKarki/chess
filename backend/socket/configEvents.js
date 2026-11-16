import {rooms, roomService} from "../utils/rooms.js";
import GameState from "../chess/gameState.js";
import { Timer } from "../chess/timer.js";
import { stateToRoom } from "../utils/games.js";

let gameState, timer;
function registerSettingEvents(io, socket){
  // saving the passed variables
  socket.on('save settings', (roomId, userId, timerOn, playedAs, gameTime, callback)=>{
    let room = rooms.get(roomId);
    if (rooms.has(roomId)){
      if (room.player1 != userId){
        return callback({
          success: false,
          message: 'ONLY HOST CAN ASSIGN THE SETTINGS'
        })
      }
      else{
        room.timerOn = timerOn;
        room.gameTime = gameTime;
        room.player1PlayedAs = playedAs;
        room.player2PlayedAs = (playedAs == 'white')? 'black' : 'white';
        room.turn = 'white';
        room.player1online = true;
        room.player2online = false;
        room.player2joined = false;
        rooms.get(roomId).roomReady = true;
        rooms.get(roomId).gameOn = false;
        console.log(rooms)
        socket.join(roomId);
        return callback({
          success: true,
          message: 'SUCCEFULLY SAVED GAME SETTINGS'
        })
      }
    }
    else{
      return callback({
        success: false,
        message: 'NO SUCH ROOM EXISTS'
      })
    }
  });

  socket.on('get settings', (roomId, userId, callback)=>{
    let room = rooms.get(roomId);
    if (rooms.has(roomId)){
      let playedAs;
      if (room.player1 == userId)
        playedAs = room.player1PlayedAs;
      else
        playedAs = room.player2PlayedAs;

      if (room.gameOn){ 
        room.player2online = true;
        room.player2joined = true;
        gameState = new GameState(roomId);
        // room.gameState = gameState;
        timer = new Timer(roomId, gameState, io);
        room.gameState = gameState;
        room.timer = timer;
        stateToRoom[`${roomId}`] = {gameState: gameState, timer: timer};
      }
      
      console.log(rooms)
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

      if (room.timerOn && room.gameOn){
        timer.startTimer();
        console.log(' the timer event is same')
        io.sockets.in(roomId).emit('start time', timer.getTime());
      }
    }
    else{
      return callback({
        success: false,
        message: 'NO SUCH ROOM EXISTS'
      })
    }
  });
};

export {registerSettingEvents, gameState};