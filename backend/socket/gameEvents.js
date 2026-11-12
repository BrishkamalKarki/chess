import navigateTo from "../../frontend/js/utils/navigator.js";
import { checkMate } from "../chess/engine/analyseBoard.js";
import { checkCheckMate, checkStaleMate, validateMoveAt } from "../chess/engine/movesValidator.js";
import { updateBitAfterMove } from "../chess/engine/updateState.js";
import { stateToRoom } from "../utils/games.js";
import {rooms, roomService} from "../utils/rooms.js";
import { gameState } from "./configEvents.js";

function getCp(org){return org};

export function registerGameEvents(io, socket){
  socket.on('apply move', (roomId, userId, src, des, callback)=>{ 
    console.log('emit emmited apply move from ', roomId, userId, src, des);
    const validMoves = validateMoveAt(src, stateToRoom[`${roomId}`].gameState, rooms.get(roomId), des);
    
    if (validMoves.includes(des)){
      if (checkStaleMate(gameState, rooms.get(roomId))){
        io.sockets.in(roomId).emit('stalemate');
      }
      updateBitAfterMove(src, des, stateToRoom[`${roomId}`].gameState);
      console.log('apply move immited from the  server');
      io.sockets.in(roomId).emit('apply move', src, des);
      callback(
        {
          success: true
        }
      )
      if (((getCp(stateToRoom[`${roomId}`].gameState.WHITE_KING) >> BigInt(des)) & 1n) && des - src == 2){
        stateToRoom[`${roomId}`].gameState.justCastled = false;
        stateToRoom[`${roomId}`].gameState.whiteCastled = true;
        if (des == 2){
          updateBitAfterMove(0, 3, stateToRoom[`${roomId}`].gameState);
          io.sockets.in(roomId).emit('castle', {
            src: 0, des: 3
          })
        }
        else{
          updateBitAfterMove(7, 5, stateToRoom[`${roomId}`].gameState);
          io.sockets.in(roomId).emit('castle', {
            src: 7, des: 5
          })
        }
      }
      else if (((getCp(stateToRoom[`${roomId}`].gameState.BLACK_KING) >> BigInt(des)) & 1n) && des - src == 2){
        stateToRoom[`${roomId}`].gameState.justCastled = false;
        stateToRoom[`${roomId}`].gameState.blackCastled = true;
        if (des == 58){
          updateBitAfterMove(56, 59, stateToRoom[`${roomId}`].gameState);
          io.sockets.in(roomId).emit('castle', {
            src: 56, des: 59
          })
        }
        else{
          updateBitAfterMove(63, 61, stateToRoom[`${roomId}`].gameState);
          io.sockets.in(roomId).emit('castle', {
            src: 63, des: 61
          })
        }
      }
      
      if (checkStaleMate(gameState, rooms.get(roomId))){
        io.sockets.in(roomId).emit('stalemate');
      }
      
      const isCheckMate = checkCheckMate(gameState, rooms.get(roomId));
      if (isCheckMate[0]){
        io.sockets.in(roomId).emit('checkmate', isCheckMate[1]);
      } 
      rooms.get(roomId).turn = rooms.get(roomId).turn == 'white' ? 'black' : 'white';
      console.log('now the turn is ', rooms.get(roomId).turn)
    }
    else{
      return callback(
        {
          success: false
        }
      )
    }
  })

  socket.on('resignation', (color, id)=>{
    if (rooms.get(id).gameOn){
      rooms.get(id).winner = color == 'white'?'black' : color;
      rooms.get(id).gameOn = false;
      io.sockets.in(id).emit('resign from server', color, true);
    }
    else{
      rooms.get(id).gameOn = false;
      io.sockets.in(id).emit('resign from server', color, false);
    }
  })

  socket.on('draw', (color, id)=>{
    if (!rooms.get(id).gameOn) return;
    socket.to(id).emit('draw', color);
  })

  socket.on('accept draw', (color, id)=>{
    rooms.get(id).gameOn = false;
      console.log('draw event')

    io.sockets.in(id).emit('draw accpt from server', color);
  })

  socket.on('reject draw', (color, id)=>{
    socket.emit('draw rjct from server');
  })
};