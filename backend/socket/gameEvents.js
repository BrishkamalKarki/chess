import navigateTo from "../../frontend/js/utils/navigator.js";
import { checkMate } from "../chess/engine/analyseBoard.js";
import { checkCastleUtils, checkCheckMate, checkStaleMate, isPromoted, validateMoveAt } from "../chess/engine/movesValidator.js";
import { updateBitAfterMove } from "../chess/engine/updateState.js";
import { stateToRoom } from "../utils/games.js";
import {rooms, roomService} from "../utils/rooms.js";
import { gameState } from "./configEvents.js";

function getCp(org){return org};
function isPiece(of, at){
  return ((of >> BigInt(at)) & 1n);
} 

function replaceBit(of, at, by){
  if (by) 
    return ((of | (BigInt(1) << BigInt(at))));
  else 
    return ((of & ~(BigInt(1) << BigInt(at))));
}

export function registerGameEvents(io, socket){
  socket.on('apply move', (roomId, userId, src, des, callback)=>{
    console.log('emit emmited apply move from ', roomId, userId, src, des); 
    const validMoves = validateMoveAt(src, stateToRoom[`${roomId}`].gameState, rooms.get(roomId), des);
    
    if (validMoves.includes(des)){
      const gs = stateToRoom[`${roomId}`].gameState;
      const movingWhitePawn = isPiece(gs.WHITE_PAWNS, src) == 1n;
      const movingBlackPawn = isPiece(gs.BLACK_PAWNS, src) == 1n;
      const enPawn = gs.twoSqPawn.length ? gs.twoSqPawn[0] : -1;
      const enRow = enPawn != -1 ? Math.floor(enPawn / 8) : -1;
      const enemyPawnBoard = movingWhitePawn ? gs.BLACK_PAWNS : gs.WHITE_PAWNS;

      const isEnPassant = enPawn != -1 && (movingWhitePawn || movingBlackPawn) && des == (movingWhitePawn ? enPawn + 8 : enPawn - 8) &&
        isPiece(gs.BLACK_WHITE, des) == 0n && Math.floor(src / 8) == enRow && Math.abs((src % 8) - (enPawn % 8)) == 1 && isPiece(enemyPawnBoard, enPawn) == 1n;
      const isTwoSquarePawn = (movingWhitePawn || movingBlackPawn) && Math.abs(des - src) == 16;

      gs.twoSqPawn.length = 0;
      if (isTwoSquarePawn) gs.twoSqPawn.push(des);

      updateBitAfterMove(src, des, stateToRoom[`${roomId}`].gameState);

      if (gs.moves.length >= 6) {gs.moves.pop(); gs.moves.pop();};
      gs.moves.push([src, des]);
      if (gs.moves.length == 6){
        const m = gs.moves;
        if ((m[0][0] == m[2][1] && m[2][1] == m[4][0]) && (m[0][1] == m[2][0] && m[2][0] == m[4][1])){
          if ((m[1][0] == m[3][1] && m[3][1] == m[5][0]) && (m[1][1] == m[3][0] && m[3][0] == m[5][1]))
            io.sockets.in(roomId).emit('threefold repetition');
        }
      }
      
      console.log('apply move immited from the  server');
      io.sockets.in(roomId).emit('apply move', src, des);
      callback(
        {
          success: true
        }
      )

      if (((getCp(stateToRoom[`${roomId}`].gameState.WHITE_KING) >> BigInt(des)) & 1n) && Math.abs(des - src) == 2 && rooms.get(roomId).turn == 'white' && !stateToRoom[`${roomId}`].gameState.whiteCastled && !stateToRoom[`${roomId}`].gameState.whiteKMoved){ 
        console.log('karna raj kakri')
        stateToRoom[`${roomId}`].gameState.justCastled = false;
        stateToRoom[`${roomId}`].gameState.whiteCastled = true;
        console.log(des, ' is the clicked des ')
        if (des == 2 && !stateToRoom[`${roomId}`].gameState.whiteQRookMoved){
          console.log('white queen side move')
          if (isPiece(stateToRoom[`${roomId}`].gameState.WHITE_ROOKS, 0)) updateBitAfterMove(0, 3, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.whiteQRookMoved = true;
          console.log(' white side moved king queen')
        }
        else if (!stateToRoom[`${roomId}`].gameState.whiteKRookMoved && des == 6){
          console.log('white king side move')
          if (isPiece(stateToRoom[`${roomId}`].gameState.WHITE_ROOKS, 7)) updateBitAfterMove(7, 5, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.whiteKRookMoved = true;
        }
      }
      else if (((getCp(stateToRoom[`${roomId}`].gameState.BLACK_KING) >> BigInt(des)) & 1n) && Math.abs(des - src) == 2 && rooms.get(roomId).turn == 'black' && !stateToRoom[`${roomId}`].gameState.blackCastled && !stateToRoom[`${roomId}`].gameState.blackKMoved){
        stateToRoom[`${roomId}`].gameState.justCastled = false;
        stateToRoom[`${roomId}`].gameState.blackCastled = true;
        if (des == 58 && !stateToRoom[`${roomId}`].gameState.blackQRookMoved){
          console.log('black queen side move')
          if (isPiece(stateToRoom[`${roomId}`].gameState.BLACK_ROOKS, 56)) updateBitAfterMove(56, 59, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.blackQRookMoved = true;
        }
        else if (!stateToRoom[`${roomId}`].gameState.blackKRookMoved && des == 62){
          console.log('black king side move')
          if (isPiece(stateToRoom[`${roomId}`].gameState.BLACK_ROOKS, 63)) updateBitAfterMove(63, 61, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.blackKRookMoved = true;
        }
      }
      
      if (isPromoted(src, des, stateToRoom[`${roomId}`].gameState)){
        socket.emit('promote', rooms.get(roomId).turn, des);
      }
      checkCastleUtils(rooms.get(roomId).turn, src, des);
      
      rooms.get(roomId).turn = rooms.get(roomId).turn == 'white' ? 'black' : 'white';
      console.log('now the turn is ', rooms.get(roomId).turn)
      
      if (checkStaleMate(stateToRoom[roomId].gameState, rooms.get(roomId))){
        io.sockets.in(roomId).emit('stalemate', rooms.get(roomId).turn);
      }
     
      const isCheckMate = checkCheckMate(stateToRoom[roomId].gameState, rooms.get(roomId));
      console.log('  this is the check mate  ,  ', isCheckMate); 
      if (isCheckMate){
        io.sockets.in(roomId).emit('checkmate', rooms.get(roomId).turn);
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

  socket.on('promote option', (roomId, color, promoDes, piece)=>{
    if (color == 'white'){
      if (piece == 'B')
        stateToRoom[`${roomId}`].gameState.WHITE_BISHOPS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.WHITE_BISHOPS), promoDes, 1);
      else if (piece == 'R')
        stateToRoom[`${roomId}`].gameState.WHITE_ROOKS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.WHITE_ROOKS), promoDes, 1);
      else if (piece == 'Q')
        stateToRoom[`${roomId}`].gameState.WHITE_QUEEN = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.WHITE_QUEEN), promoDes, 1);
      else if (piece == 'N')
        stateToRoom[`${roomId}`].gameState.WHITE_KNIGHTS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.WHITE_KNIGHTS), promoDes, 1);
      stateToRoom[`${roomId}`].gameState.WHITE_PAWNS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.WHITE_PAWNS), promoDes, 0);
    }
    else if (color == 'black'){
      if (piece == 'B')
        stateToRoom[`${roomId}`].gameState.BLACK_BISHOPS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.BLACK_BISHOPS), promoDes, 1);
      else if (piece == 'R')
        stateToRoom[`${roomId}`].gameState.BLACK_ROOKS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.BLACK_ROOKS), promoDes, 1);
      else if (piece == 'Q')
        stateToRoom[`${roomId}`].gameState.BLACK_QUEEN = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.BLACK_QUEEN), promoDes, 1);
      else if (piece == 'N')
        stateToRoom[`${roomId}`].gameState.BLACK_KNIGHTS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.BLACK_KNIGHTS), promoDes, 1);
      stateToRoom[`${roomId}`].gameState.BLACK_PAWNS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.BLACK_PAWNS), promoDes, 0);
    }

    io.sockets.in(roomId).emit('promote for opp', color, promoDes, piece);
    stateToRoom[`${roomId}`].gameState.BLACK_PLACEMENTS = stateToRoom[`${roomId}`].gameState.BLACK_BISHOPS | stateToRoom[`${roomId}`].gameState.BLACK_KING | stateToRoom[`${roomId}`].gameState.BLACK_KNIGHTS | stateToRoom[`${roomId}`].gameState.BLACK_PAWNS | stateToRoom[`${roomId}`].gameState.BLACK_QUEEN | stateToRoom[`${roomId}`].gameState.BLACK_ROOKS;
    stateToRoom[`${roomId}`].gameState.WHITE_PLACEMENTS = stateToRoom[`${roomId}`].gameState.WHITE_BISHOPS | stateToRoom[`${roomId}`].gameState.WHITE_KING | stateToRoom[`${roomId}`].gameState.WHITE_KNIGHTS | stateToRoom[`${roomId}`].gameState.WHITE_PAWNS | stateToRoom[`${roomId}`].gameState.WHITE_QUEEN | stateToRoom[`${roomId}`].gameState.WHITE_ROOKS;
    stateToRoom[`${roomId}`].gameState.BLACK_WHITE = stateToRoom[`${roomId}`].gameState.WHITE_PLACEMENTS | stateToRoom[`${roomId}`].gameState.BLACK_PLACEMENTS;
  })

  socket.on('i am out', (color, roomId)=>{
    rooms.get(roomId).gameOn = false;
    rooms.get(roomId).winner = color == 'white'? 'black': 'white';
    io.sockets.in(roomId).emit('player left', color == 'white'? 'black': 'white');
  })

  socket.on('insuffMats', (roomId)=>{
    io.sockets.in(roomId).emit('insuffMats');
  });

  socket.on('en passant', (color, roomId, enPawnDes)=>{
    if (color == 'white'){
      stateToRoom[`${roomId}`].gameState.WHITE_PAWNS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.WHITE_PAWNS), enPawnDes, 0);
      console.log(' white en passant')
    }
    else if (color == 'black'){
      stateToRoom[`${roomId}`].gameState.BLACK_PAWNS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.BLACK_PAWNS), enPawnDes, 0);
      console.log(' black en passant')
    }
    stateToRoom[`${roomId}`].gameState.BLACK_PLACEMENTS = stateToRoom[`${roomId}`].gameState.BLACK_BISHOPS | stateToRoom[`${roomId}`].gameState.BLACK_KING | stateToRoom[`${roomId}`].gameState.BLACK_KNIGHTS | stateToRoom[`${roomId}`].gameState.BLACK_PAWNS | stateToRoom[`${roomId}`].gameState.BLACK_QUEEN | stateToRoom[`${roomId}`].gameState.BLACK_ROOKS;
    stateToRoom[`${roomId}`].gameState.WHITE_PLACEMENTS = stateToRoom[`${roomId}`].gameState.WHITE_BISHOPS | stateToRoom[`${roomId}`].gameState.WHITE_KING | stateToRoom[`${roomId}`].gameState.WHITE_KNIGHTS | stateToRoom[`${roomId}`].gameState.WHITE_PAWNS | stateToRoom[`${roomId}`].gameState.WHITE_QUEEN | stateToRoom[`${roomId}`].gameState.WHITE_ROOKS;
    stateToRoom[`${roomId}`].gameState.BLACK_WHITE = stateToRoom[`${roomId}`].gameState.WHITE_PLACEMENTS | stateToRoom[`${roomId}`].gameState.BLACK_PLACEMENTS;
  })
};