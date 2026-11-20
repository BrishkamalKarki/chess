import { checkCastleUtils, checkCheckMate, checkStaleMate, isPromoted, validateMoveAt } from "../chess/engine/movesValidator.js";
import { updateBitAfterMove } from "../chess/engine/updateState.js";
import { stateToRoom } from "../utils/games.js";
import {destroyRoom, rooms} from "../utils/rooms.js";

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

function getCastlingRights(gs){
  return (!gs.whiteKMoved && !gs.whiteKRookMoved ? 1 : 0) | (!gs.whiteKMoved && !gs.whiteQRookMoved ? 2 : 0) |
    (!gs.blackKMoved && !gs.blackKRookMoved ? 4 : 0) | (!gs.blackKMoved && !gs.blackQRookMoved ? 8 : 0);
}

function getPositionKey(gs, side, capturedColor = '', capturedSquare = -1){
  const ep = gs.twoSqPawn.length ? gs.twoSqPawn[0] : -1;
  const whitePawns = capturedColor === 'white' ? gs.WHITE_PAWNS & ~(1n << BigInt(capturedSquare)) : gs.WHITE_PAWNS;
  const blackPawns = capturedColor === 'black' ? gs.BLACK_PAWNS & ~(1n << BigInt(capturedSquare)) : gs.BLACK_PAWNS;
  return `${gs.WHITE_KING}|${gs.WHITE_QUEEN}|${gs.WHITE_BISHOPS}|${gs.WHITE_KNIGHTS}|${gs.WHITE_ROOKS}|${whitePawns}|` +
    `${gs.BLACK_KING}|${gs.BLACK_QUEEN}|${gs.BLACK_BISHOPS}|${gs.BLACK_KNIGHTS}|${gs.BLACK_ROOKS}|${blackPawns}|` +
    `${side}|${getCastlingRights(gs)}|${ep}`;
}

function recordThreefold(gs, side, capturedColor = '', capturedSquare = -1){
  const key = getPositionKey(gs, side, capturedColor, capturedSquare);
  gs.positionHistory.push(key);
  return gs.positionHistory.reduce((count, item)=> count + (item === key ? 1 : 0), 0) >= 3;
}

function endThreefold(io, roomId){
  io.sockets.in(roomId).emit('threefold repetition');
  destroyRoom(io, roomId);
}

export function registerGameEvents(io, socket){
  socket.on('apply move', (roomId, userId, src, des, callback)=>{
    const room = rooms.get(roomId);
    const roomState = stateToRoom[`${roomId}`];
    if (!room || !roomState || !roomState.gameState){
      if (typeof callback === 'function')
        callback({success: false, message: 'NO SUCH ROOM EXISTS'});
      return;
    }
    if (!room.gameOn){
      if (typeof callback === 'function')
        callback({success: false, message: 'GAME IS NOT ON'});
      return;
    }
    const validMoves = validateMoveAt(src, roomState.gameState, room, des);
    
    if (validMoves.includes(des)){
      const gs = stateToRoom[`${roomId}`].gameState;
      if (!gs.positionHistory) gs.positionHistory = [getPositionKey(gs, room.turn)];
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
      const promotionPending = isPromoted(src, des, gs);
      
      io.sockets.in(roomId).emit('apply move', src, des);
      callback(
        {
          success: true
        }
      )
      if (((getCp(stateToRoom[`${roomId}`].gameState.WHITE_KING) >> BigInt(des)) & 1n) && Math.abs(des - src) == 2 && rooms.get(roomId).turn == 'white' && !stateToRoom[`${roomId}`].gameState.whiteCastled && !stateToRoom[`${roomId}`].gameState.whiteKMoved){ 
        stateToRoom[`${roomId}`].gameState.justCastled = false;
        stateToRoom[`${roomId}`].gameState.whiteCastled = true;
        if (des == 2 && !stateToRoom[`${roomId}`].gameState.whiteQRookMoved){
          if (isPiece(stateToRoom[`${roomId}`].gameState.WHITE_ROOKS, 0)) updateBitAfterMove(0, 3, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.whiteQRookMoved = true;
        }
        else if (!stateToRoom[`${roomId}`].gameState.whiteKRookMoved && des == 6){
          if (isPiece(stateToRoom[`${roomId}`].gameState.WHITE_ROOKS, 7)) updateBitAfterMove(7, 5, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.whiteKRookMoved = true;
        }
      }
      else if (((getCp(stateToRoom[`${roomId}`].gameState.BLACK_KING) >> BigInt(des)) & 1n) && Math.abs(des - src) == 2 && rooms.get(roomId).turn == 'black' && !stateToRoom[`${roomId}`].gameState.blackCastled && !stateToRoom[`${roomId}`].gameState.blackKMoved){
        stateToRoom[`${roomId}`].gameState.justCastled = false;
        stateToRoom[`${roomId}`].gameState.blackCastled = true;
        if (des == 58 && !stateToRoom[`${roomId}`].gameState.blackQRookMoved){
          if (isPiece(stateToRoom[`${roomId}`].gameState.BLACK_ROOKS, 56)) updateBitAfterMove(56, 59, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.blackQRookMoved = true;
        }
        else if (!stateToRoom[`${roomId}`].gameState.blackKRookMoved && des == 62){
          if (isPiece(stateToRoom[`${roomId}`].gameState.BLACK_ROOKS, 63)) updateBitAfterMove(63, 61, stateToRoom[`${roomId}`].gameState);
          stateToRoom[`${roomId}`].gameState.blackKRookMoved = true;
        }
      }
      
      if (promotionPending){
        socket.emit('promote', rooms.get(roomId).turn, des);
      }
      checkCastleUtils(rooms.get(roomId).turn, src, des);
      
      rooms.get(roomId).turn = rooms.get(roomId).turn == 'white' ? 'black' : 'white';

      const capturedColor = movingWhitePawn ? 'black' : movingBlackPawn ? 'white' : '';
      if (!promotionPending && recordThreefold(gs, rooms.get(roomId).turn, isEnPassant ? capturedColor : '', isEnPassant ? enPawn : -1)){
        endThreefold(io, roomId);
        return;
      }

      if (checkStaleMate(roomState.gameState, room)){
        const turn = room.turn;
        io.sockets.in(roomId).emit('stalemate', turn);
        destroyRoom(io, roomId);
        return;
      }
     
      const isCheckMate = checkCheckMate(roomState.gameState, room);
      if (isCheckMate){
        const turn = room.turn;
        io.sockets.in(roomId).emit('checkmate', turn);
        destroyRoom(io, roomId);
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
    const room = rooms.get(id);
    if (!room || !room.gameOn) return;
    room.winner = color == 'white'?'black' : color;
    room.gameOn = false;
    io.sockets.in(id).emit('resign from server', color, true);
    destroyRoom(io, id);
  })

  socket.on('draw', (color, id)=>{
    const room = rooms.get(id);
    if (!room || !room.gameOn) return;
    socket.to(id).emit('draw', color);
  })

  socket.on('accept draw', (color, id)=>{
    const room = rooms.get(id);
    if (!room || !room.gameOn) return;
    room.gameOn = false;
    io.sockets.in(id).emit('draw accpt from server', color);
    destroyRoom(io, id);
  })

  socket.on('reject draw', (color, id)=>{
    const room = rooms.get(id);
    if (!room || !room.gameOn) return;
    socket.emit('draw rjct from server');
  })

  socket.on('promote option', (roomId, color, promoDes, piece)=>{
    const room = rooms.get(roomId);
    const roomState = stateToRoom[`${roomId}`];
    if (!room || !room.gameOn || !roomState || !roomState.gameState) return;
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
    if (recordThreefold(roomState.gameState, room.turn)){
      endThreefold(io, roomId);
      return;
    }
  })

  socket.on('i am out', (color, roomId)=>{
    const room = rooms.get(roomId);
    if (!room || !room.gameOn) return;
    room.gameOn = false;
    room.winner = color == 'white'? 'black': 'white';
    io.sockets.in(roomId).emit('player left', color == 'white'? 'black': 'white');
    destroyRoom(io, roomId);
  })

  socket.on('insuffMats', (roomId)=>{
    const room = rooms.get(roomId);
    if (!room || !room.gameOn) return;
    io.sockets.in(roomId).emit('insuffMats');
    destroyRoom(io, roomId);
  });

  socket.on('en passant', (color, roomId, enPawnDes)=>{
    const room = rooms.get(roomId);
    const roomState = stateToRoom[`${roomId}`];
    if (!room || !room.gameOn || !roomState || !roomState.gameState) return;
    if (color == 'white'){
      stateToRoom[`${roomId}`].gameState.WHITE_PAWNS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.WHITE_PAWNS), enPawnDes, 0);
    }
    else if (color == 'black'){
      stateToRoom[`${roomId}`].gameState.BLACK_PAWNS = replaceBit(getCp(stateToRoom[`${roomId}`].gameState.BLACK_PAWNS), enPawnDes, 0);
    }
    stateToRoom[`${roomId}`].gameState.BLACK_PLACEMENTS = stateToRoom[`${roomId}`].gameState.BLACK_BISHOPS | stateToRoom[`${roomId}`].gameState.BLACK_KING | stateToRoom[`${roomId}`].gameState.BLACK_KNIGHTS | stateToRoom[`${roomId}`].gameState.BLACK_PAWNS | stateToRoom[`${roomId}`].gameState.BLACK_QUEEN | stateToRoom[`${roomId}`].gameState.BLACK_ROOKS;
    stateToRoom[`${roomId}`].gameState.WHITE_PLACEMENTS = stateToRoom[`${roomId}`].gameState.WHITE_BISHOPS | stateToRoom[`${roomId}`].gameState.WHITE_KING | stateToRoom[`${roomId}`].gameState.WHITE_KNIGHTS | stateToRoom[`${roomId}`].gameState.WHITE_PAWNS | stateToRoom[`${roomId}`].gameState.WHITE_QUEEN | stateToRoom[`${roomId}`].gameState.WHITE_ROOKS;
    stateToRoom[`${roomId}`].gameState.BLACK_WHITE = stateToRoom[`${roomId}`].gameState.WHITE_PLACEMENTS | stateToRoom[`${roomId}`].gameState.BLACK_PLACEMENTS;
  })
};