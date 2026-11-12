import { roomService } from "../../utils/rooms.js";
import { checkMate, willGetChecked } from "./analyseBoard.js";
import { updateBitAfterMove } from "./updateState.js";

let gameState, pieceToBitBoard;

function replaceBit(of, at, by){
  if (by)
    return ((of | (BigInt(1) << BigInt(at))));
  else 
    return ((of & ~(BigInt(1) << BigInt(at))));
}

let room;
function validateMoveAt(pos, gs, r, des){
  gameState = gs;
  room = r;
  pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
    'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
    'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
    'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
    'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
    'bPl': gameState.BLACK_PLACEMENTS, 'wPl': gameState.WHITE_PLACEMENTS
  }

  const piece = whatIsAt(pos);
  console.log(piece, pos, " is the piece clicked and the position where that piece is.")
  const pieceToFunc = {
    'wR': forRooks, 'wN': forKnights, 'wB': forBishops,
    'wK': forKing, 'wQ': forQueen, 'wP': forPawn,
    'bR': forRooks, 'bN': forKnights, 'bB': forBishops,
    'bK': forKing, 'bQ': forQueen, 'bP': forPawn,
  }

  const row = Math.floor(pos/8);
  const col = pos - row*8;

  if (r.turn == 'white'){
    if (kingChecked(room)) gameState.whiteChecked = true;
    if (piece[1] == 'R') gameState.whiteRookMoved = true; 
  }
  if (r.turn == 'black'){
    if (kingChecked(room)) gameState.blackChecked = true;
    if (piece[1] == 'R') gameState.blackRookMoved = true; 
  }

  console.log(kingChecked(room), ' is the king checked');
  // console.log(willGetChecked(pos, piece, pieceToBitBoard, room, des))
  // if (willGetChecked(pos, piece, pieceToBitBoard, room, des)) return [];
  const psblPaths = pieceToFunc[piece](row, col, pos, piece[0]);
  console.log(psblPaths, ' are possible Paths');

  if (psblPaths.includes(des)){ // if the move is valid
    const ifChecked = kingChecked(room); // in each's turn before each move check if king is checked
    if (ifChecked){
      const bBorg = pieceToBitBoard[piece]; // saving org board state
      const desPiece = whatIsAt(des);
      let bBorgEn;
      if (desPiece != ' ') bBorgEn = pieceToBitBoard[desPiece];
      pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], pos, 0);
      pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], des, 1);
      if (desPiece != ' ')
        pieceToBitBoard[desPiece] = replaceBit(pieceToBitBoard[desPiece], des, 0);
      const stillChecked = kingChecked(room)
      pieceToBitBoard[piece] = bBorg; // restoring after the temporary move
      if (desPiece != ' ') pieceToBitBoard[desPiece] = bBorgEn;
      if (stillChecked){
      console.log(' your king is checked')
        return [];
      }
    }

    // check if after that move is the check
    const bBorg = pieceToBitBoard[piece]; // saving org board state
    const desPiece = whatIsAt(des);
    let bBorgEn;
    if (desPiece != ' ') bBorgEn = pieceToBitBoard[desPiece]; 
    console.log( piece, desPiece);
    pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], pos, 0);
    pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], des, 1);
    if (desPiece != ' ')
      pieceToBitBoard[desPiece] = replaceBit(pieceToBitBoard[desPiece], des, 0);
    const checked = kingChecked(room);
    pieceToBitBoard[piece] = bBorg; // restoring after the temporary move
      if (desPiece != ' ') pieceToBitBoard[desPiece] = bBorgEn;
    if (checked){
      console.log(' if you move u die')
      return [];
    }
  }

  const file = {0:'a', 1:'b', 2:'c', 3:'d', 4:'e', 5:'f', 6:'g', 7:'h'};
  let moveRep;
  const desRow = Math.floor(des/8);
  const desCol = des - desRow * 8;
  if (whatIsAt(des) != ' '){
    moveRep = `${piece[0]}x${file[desCol]}${desRow+1}`;
  }
  else{
    moveRep = `${piece[0]}${file[desCol]}${desRow+1}`;
  }
  if (kingChecked(room)){
    moveRep = `${moveRep}+`;
  }

  return psblPaths;
}

function kingChecked(room){
  let p1, p2;
  if (room.turn == 'white'){
    p1 = 'w';
    p2 = 'b';
  }
  else{
    p1 = 'b';
    p2 = 'w';
  }

  let enemyAttacks = [];
  const kingPos = getPos(pieceToBitBoard[`${p1}K`]); // getting kings pos
  const enemyRooks = getPos(pieceToBitBoard[`${p2}R`]);
  const enemyBishops = getPos(pieceToBitBoard[`${p2}B`]);
  const enemyQueen = getPos(pieceToBitBoard[`${p2}Q`]);
  const enemyPawn = getPos(pieceToBitBoard[`${p2}P`]);
  const enemyKnight = getPos(pieceToBitBoard[`${p2}N`]);
  for (const pos of enemyRooks){
    let row = Math.floor(pos/8);
    let col = pos - row * 8;
    const attacks = forRooks(row, col, pos, p2);
    for (const atck of attacks){
      enemyAttacks.push(atck);
    }
  }
  for (const pos of enemyBishops){
    let row = Math.floor(pos/8);
    let col = pos - row *  8;
    const attacks = forBishops(row, col, pos, p2);
    for (const atck of attacks){
      enemyAttacks.push(atck);
    }
  }
  for (const pos of enemyQueen){
    let row = Math.floor(pos/8);
    let col = pos - row *  8;
    const attacks = forQueen(row, col, pos, p2);
    for (const atck of attacks){
      enemyAttacks.push(atck);
    }
  }
  for (const pos of enemyKnight){
    let row = Math.floor(pos/8);
    let col = pos - row *  8;
    const attacks = forKnights(row, col, pos, p2);
    for (const atck of attacks){
      enemyAttacks.push(atck);
    }
  }
  for (const pos of enemyPawn){
    let row = Math.floor(pos/8);
    let col = pos - row *  8;
    const attacks = forPawn(row, col, pos, p2);
    for (const atck of attacks){
      enemyAttacks.push(atck);
    }
  }
  console.log(enemyAttacks, room.turn)
  if (enemyAttacks.includes(kingPos[0])) return true;
  return false;
}

function checkStaleMate(gameState ,room){
  pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
    'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
    'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
    'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
    'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
    'bPl': gameState.BLACK_PLACEMENTS, 'wPl': gameState.WHITE_PLACEMENTS
  }

  const isCheck = kingChecked(room);
  const allPiecesMoves = getAllMoves(room.turn);
  if (!isCheck && allPiecesMoves.length == 0)
    return true;
}

function checkCheckMate(gameState, room){
  pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
    'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
    'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
    'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
    'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
    'bPl': gameState.BLACK_PLACEMENTS, 'wPl': gameState.WHITE_PLACEMENTS
  }

  const isCheck = kingChecked(room);
  if (!isCheck) return false;

  const turn = room.turn == 'white' ? 'w' : 'b';
  const kingPos = getPos(pieceToBitBoard[`${turn}K`]); // king of the  of the current turn
  let row = Math.floor(kingPos[0]/8);
  let col = kingPos[0] - row * 8;
  const kingMoves = forKing(row, col, kingPos[0], turn);
  if (kingMoves.length != 0) return [false, turn];

  // if any piece can black the check
  const allPiecesMoves = getAllMoves(room.turn);
  if (allPiecesMoves.length == 0) return [true, turn];
  
  const p = room.turn == 'white' ? 'w' : 'b';
  const ttlPieces = [`${piece}P`, `${piece}R`, `${piece}N`, `${piece}B`, `${piece}Q`, `${piece}K`]
  for (const pc of ttlPieces){
    const posAll = getPos(pieceToBitBoard[pc]);
    for (const pos in posAll){
      const bBorg = pieceToBitBoard[pc]; // saving org board state
      const desPiece = whatIsAt(des);
      let bBorgEn;
      if (desPiece != ' ') bBorgEn = pieceToBitBoard[desPiece];
      pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], pos, 0);
      pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], des, 1);
      if (desPiece != ' ')
        pieceToBitBoard[desPiece] = replaceBit(pieceToBitBoard[desPiece], des, 0);

      const stillChecked = kingChecked(room)
      if (!stillChecked) return [false, turn];
      pieceToBitBoard[piece] = bBorg; // restoring after the temporary move
      if (desPiece != ' ') pieceToBitBoard[desPiece] = bBorgEn;
    }
  }

  return [true, turn];
}

function getPos(bB){
  let pos = [];
  for (let i = 0; i <= 63; i++){
    if ((bB >> BigInt(i)) & 1n) pos.push(i);
  }
  return pos;
}

function getAllMoves(turn, castle = false){
  const piece = turn == 'white' ? 'w' : 'b';

  let ttlPieces = [`${piece}P`, `${piece}R`, `${piece}N`, `${piece}B`, `${piece}Q`]
  if (!castle)
    ttlPieces = [...ttlPieces, `${piece}K`];
  let ttlPos = [];
  for (const tp of ttlPieces){
    const indvPos = getPos(pieceToBitBoard[tp]);
    ttlPos = [...ttlPos, ...indvPos];
  }

  const pieceToFunc = {
    'wR': forRooks, 'wN': forKnights, 'wB': forBishops,
    'wK': forKing, 'wQ': forQueen, 'wP': forPawn,
    'bR': forRooks, 'bN': forKnights, 'bB': forBishops,
    'bK': forKing, 'bQ': forQueen, 'bP': forPawn,
  }

  let moves = []; 
  for (const pos of ttlPos){
    const row = Math.floor(pos/8);
    const col = pos - row * 8;
    const p = whatIsAt(pos);
    const move = pieceToFunc[p](row, col, pos, piece);
    moves = [...moves, ...move];
  }

  return moves;
}

function getCp(cp){
  return cp;
}

function whatIsAt(pos){
  if ((getCp(pieceToBitBoard['wR']) >> BigInt(pos)) & 1n) return 'wR';
  else if ((getCp(pieceToBitBoard['wN']) >> BigInt(pos)) & 1n) return 'wN';
  else if ((getCp(pieceToBitBoard['wB']) >> BigInt(pos)) & 1n) return 'wB';
  else if ((getCp(pieceToBitBoard['wK']) >> BigInt(pos)) & 1n) return 'wK';
  else if ((getCp(pieceToBitBoard['wQ']) >> BigInt(pos)) & 1n) return 'wQ';
  else if ((getCp(pieceToBitBoard['wP']) >> BigInt(pos)) & 1n) return 'wP';
  else if ((getCp(pieceToBitBoard['bR']) >> BigInt(pos)) & 1n) return 'bR';
  else if ((getCp(pieceToBitBoard['bN']) >> BigInt(pos)) & 1n) return 'bN';
  else if ((getCp(pieceToBitBoard['bB']) >> BigInt(pos)) & 1n) return 'bB';
  else if ((getCp(pieceToBitBoard['bK']) >> BigInt(pos)) & 1n) return 'bK';
  else if ((getCp(pieceToBitBoard['bQ']) >> BigInt(pos)) & 1n) return 'bQ';
  else if ((getCp(pieceToBitBoard['bP']) >> BigInt(pos)) & 1n) return 'bP';
  return ' ';
}

// finding the valid squares to go

function forPawn(row, col, pos, src){
  let possibleSqs = [];
  let posNew, rowNew;
  if (src == 'w'){
    posNew = pos + 8;
    rowNew = row + 1;
    if (row == 1 && whatIsAt(pos+8) == ' ' && whatIsAt(pos+16) == ' ') possibleSqs.push(pos+16);
    if (row < 7){ // for eating
      if (col < 7)
        if (whatIsAt(pos+9)[0] != ' ' && whatIsAt(pos+9)[0] != src) possibleSqs.push(pos+9);
      if (col > 0)
        if (whatIsAt(pos+7)[0] != ' ' && whatIsAt(pos+7)[0] != src) possibleSqs.push(pos+7);
    }
  }
  else{
    posNew = pos - 8;
    rowNew = row - 1;
    if (row == 6 && whatIsAt(pos-8) == ' ' && whatIsAt(pos-16) == ' ') possibleSqs.push(pos-16);
    if (row > 0){
      if (col < 7)
        if (whatIsAt(pos-7)[0] != ' ' && whatIsAt(pos-7)[0] != src) possibleSqs.push(pos-7);
      if (col > 0)
        if (whatIsAt(pos-9)[0] != ' ' && whatIsAt(pos-9)[0] != src) possibleSqs.push(pos-9);
    }
  }

  if (rowNew >= 0 && rowNew <= 7){
    const tar = whatIsAt(posNew)[0];
    if (tar == ' ') possibleSqs.push(posNew);
  }
  return possibleSqs;
}

function forKing(row, col, pos, src){
  let step = [[1, 0], [-1, 0], [0, 1], [0, -1], [1,1], [1,-1], [-1, 1], [-1, -1]];
  let possibleSqs = [];
  for (let i = 0; i <= 7; i++){
    const rowStep = step[i][0]; const colStep = step[i][1];
    const rowNew = row + rowStep; const colNew = col + colStep;
    if (rowNew >= 0 && rowNew <= 7 && colNew >= 0 && colNew <= 7){
      const newPos = rowNew * 8 + colNew;
      const tar = whatIsAt(newPos)[0];
      if (src == tar) continue;
      else if (tar != ' ' && src != tar) possibleSqs.push(newPos);
      else if (tar == ' ') possibleSqs.push(newPos);
    }
  }

  // for the castling
  if (src == 'w' && !gameState.whiteCastled && !gameState.whiteRookMoved && !kingChecked(room) && !gameState.whiteChecked){
    let moves = getAllMoves('black', true);
    if (whatIsAt(1) == ' ' && whatIsAt(2) == ' ' && whatIsAt(3) == ' '){ // queen side castling
      if (!moves.includes(1) && !moves.includes(2) && !moves.includes(3)){
        possibleSqs.push(2);
        gameState.castleType = 'Q';
      }
    }
    else if (whatIsAt(5) == ' ' && whatIsAt(6) == ' '){ // king side castling
      if (!moves.includes(5) && !moves.includes(6)){
        gameState.castleType = 'K';
        possibleSqs.push(6);
      }
    }
  }
  else if (src == 'b' && !gameState.blackCastled && !gameState.blackRookMoved && !kingChecked(room) && !gameState.blackChecked){
    let moves = getAllMoves('white');
    if (whatIsAt(57) == ' ' && whatIsAt(58) == ' ' && whatIsAt(59) == ' '){ // queen side castling
      if (!moves.includes(57) && !moves.includes(58) && !moves.includes(59)){
        gameState.castleType = 'Q';
        possibleSqs.push(58);
      }
    }
    else if (whatIsAt(61) == ' ' && whatIsAt(62) == ' '){ // king side castling
      if (!moves.includes(61) && !moves.includes(62)){
        gameState.castleType = 'K';
        possibleSqs.push(62);
      }
    }
  }
  return possibleSqs;
}

function forQueen(row, col, pos, src){
  const diagPsblSqs = forBishops(row, col, pos, src);
  const hvPsblSqs = forRooks(row, col, pos, src);
  return [...diagPsblSqs, ...hvPsblSqs];
};

function forKnights(row, col, pos, src){
  let step = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]];
  let possibleSqs = [];
  for (let i = 0; i <= 7; i++){
    const rowStep = step[i][0]; const colStep = step[i][1];
    const rowNew = row + rowStep; const colNew = col + colStep;
    if (rowNew >= 0 && rowNew <= 7 && colNew >= 0 && colNew <= 7){
      const newPos = rowNew * 8 + colNew;
      const tar = whatIsAt(newPos)[0];
      if (src == tar) continue;
      else if (tar != ' ' && src != tar) possibleSqs.push(newPos);
      else if (tar == ' ') possibleSqs.push(newPos);
    }
  }
  return possibleSqs;
}

function forBishops(row, col, pos, src){
  let possibleSqs = [];
  let loopMax = [7-row, row];
  let step = [+1, -1]
  for (let j = 0; j <= 1; j++){
    let oppn = 0; let oppp = 0; // opponent on postived and negatived side
    let neg = col > 0;
    let pog = col < 7; // - and + on column
    for (let i = 1; i <= loopMax[j]; i++){
      const posNew = pos + step[j]*8*i;
      if (neg){
        let pn = posNew - i;
        const tar = whatIsAt(pn)[0];
        if (oppn >= 1) break;
        else if (src == tar) neg = false;   // our piece
        else if (tar != ' ' && src != tar){ // opponent piece
          if (oppn >= 1){
            neg = false;
          } 
          else{
            oppn++;
            possibleSqs.push(pn);  
          }
        }
        else if (tar == ' '){
          possibleSqs.push(pn);
        } 
        const col = pn - Math.floor(pn/8) * 8;
        if (col == 0) neg = false;
      }
      if (pog){
        let pn = posNew + i;
        const tar = whatIsAt(pn)[0];
        if (oppp >= 1)
         pog = false;
        else if (src == tar) pog = false;  
        else if (tar != ' ' && src != tar){
          if (oppp >= 1){
            pog = false;
          }
          else{
            oppp++;
            possibleSqs.push(pn);  
          }
        }
        else if (tar == ' '){
          possibleSqs.push(pn);
        } 
        const col = pn - Math.floor(pn/8) * 8;
        if (col == 7) pog = false;
      }
    }
  } 
  return possibleSqs;
}

function forRooks(row, col, pos, src){
  let possibleSqs = [];
  let loopMax = [7-row, row, 7-col, col];
  let step = [8, -8, 1, -1]
  for (let j = 0; j <= 3; j++){
    let opp = 0;
    for (let i = 1; i <= loopMax[j]; i++){
      const psPos = pos + step[j] * i;
      const tar = whatIsAt(psPos)[0];
      if (opp >= 1) break;
      if (src == tar) break;
      else if (tar == ' ') possibleSqs.push(psPos);
      else if (tar != ' ' && src != tar){
        opp++;
        possibleSqs.push(psPos);  
      }
    }
  } 
  return possibleSqs;
}

export {validateMoveAt, forBishops, forKing, forPawn, forRooks, forQueen, forKnights, checkCheckMate, checkStaleMate};