import { populate } from "dotenv";
import {rooms, roomService} from "../utils/rooms.js";

export function registerSettingEvents(io, socket){
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
    console.log(roomId, userId)
    let room = rooms.get(roomId);
    if (rooms.has(roomId)){
      let playedAs;
      if (room.player1 == userId)
        playedAs = room.player1PlayedAs;
      else
        playedAs = room.player2PlayedAs;

      return callback({
        success: true,
        message: 'SUCCEFULLY PASSED GAME SETTINGS',
        timerOn: room.timerOn,
        gameTime: room.gameTime,
        playedAs: playedAs
      })
    }
    else{
      return callback({
        success: false,
        message: 'NO SUCH ROOM EXISTS'
      })
    }
  });
};