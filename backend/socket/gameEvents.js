import { checkMate } from "../chess/engine/analyseBoard.js";
import { validateMoveAt } from "../chess/engine/movesValidator.js";
import { updateBitAfterMove } from "../chess/engine/updateState.js";
import { stateToRoom } from "../utils/games.js";
import {rooms, roomService} from "../utils/rooms.js";
import { gameState } from "./configEvents.js";

export function registerGameEvents(io, socket){
  socket.on('apply move', (roomId, userId, src, des, callback)=>{ 
    console.log('emit emmited apply move from ', roomId, userId, src, des);
    const validMoves = validateMoveAt(src, stateToRoom[`${roomId}`].gameState, rooms.get(roomId), des);
    if (validMoves.includes(des)){
      updateBitAfterMove(src, des, stateToRoom[`${roomId}`].gameState);
      console.log('apply move immited from the  server');
      io.sockets.in(roomId).emit('apply move', src, des);
      rooms.get(roomId).turn = rooms.get(roomId).turn == 'white' ? 'black' : 'white';
      console.log('now the turn is ', rooms.get(roomId).turn)
      callback(
        {
          success: true
        }
      )

      const checkMatePiece = checkMate();
      if (checkMatePiece != ' '){
        rooms.get(roomId).winner = checkMatePiece;
        // io.sockets.in(roomId).emit('checkmated', checkMatePiece);
      }
    }
    else{
      return callback(
        {
          success: false
        }
      )
    }
  })
};