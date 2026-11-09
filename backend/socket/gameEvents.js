import { validateMoveAt } from "../chess/engine/movesValidator.js";
import { updateBitAfterMove } from "../chess/engine/updateState.js";
import { stateToRoom } from "../utils/games.js";
import {rooms, roomService} from "../utils/rooms.js";
import { gameState } from "./configEvents.js";

export function registerGameEvents(io, socket){
  socket.on('apply move', (roomId, userId, src, des, callback)=>{  
    const validMoves = validateMoveAt(src, stateToRoom.roomId.gameState);
    if (validMoves.includes(des)){
      updateBitAfterMove(src, des, stateToRoom.roomId.gameState);
      io.sockets.in(roomId).emit('apply move', src, des);
      callback(
        {
          success: true
        }
      )
    }
    else{
      callback(
        {
          success: false
        }
      )
    }
  })
};