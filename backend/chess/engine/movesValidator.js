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

  // if (willGetChecked(pos, piece, pieceToBitBoard, room, des)) return [];
  const psblPaths = pieceToFunc[piece](row, col, pos, piece[0]);

  // if (psblPaths.includes(des)){ // if the move is valid
  //   const ifChecked = kingChecked(room); // in each's turn before each move check if king is checked
  //   if (ifChecked){
  //     const bBorg = pieceToBitBoard[piece]; // saving org board state
  //     const desPiece = whatIsAt(des);
  //     let bBorgEn;
  //     if (desPiece != ' ') bBorgEn = pieceToBitBoard[desPiece];
  //     pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], pos, 0);
  //     pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], des, 1);
  //     if (desPiece != ' ')
  //       pieceToBitBoard[desPiece] = replaceBit(pieceToBitBoard[desPiece], des, 0);
  //     const stillChecked = kingChecked(room)
  //     pieceToBitBoard[piece] = bBorg; // restoring after the temporary move
  //     if (desPiece != ' ') pieceToBitBoard[desPiece] = bBorgEn;
  //     if (stillChecked){
  //       return [];
  //     }
  //   }

  //   // check if after that move is the check
  //   const bBorg = pieceToBitBoard[piece]; // saving org board state
  //   const desPiece = whatIsAt(des);
  //   let bBorgEn;
  //   if (desPiece != ' ') bBorgEn = pieceToBitBoard[desPiece]; 
  //   pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], pos, 0);
  //   pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], des, 1);
  //   if (desPiece != ' ')
  //     pieceToBitBoard[desPiece] = replaceBit(pieceToBitBoard[desPiece], des, 0);
  //   const checked = kingChecked(room);
  //   pieceToBitBoard[piece] = bBorg; // restoring after the temporary move
  //     if (desPiece != ' ') pieceToBitBoard[desPiece] = bBorgEn;
  //   if (checked){
  //     return [];
  //   }
  // }

  // const file = {0:'a', 1:'b', 2:'c', 3:'d', 4:'e', 5:'f', 6:'g', 7:'h'};
  // let moveRep;
  // const desRow = Math.floor(des/8);
  // const desCol = des - desRow * 8;
  // if (whatIsAt(des) != ' '){
  //   moveRep = `${piece[0]}x${file[desCol]}${desRow+1}`;
  // }
  // else{
  //   moveRep = `${piece[0]}${file[desCol]}${desRow+1}`;
  // }
  // if (kingChecked(room)){
  //   moveRep = `${moveRep}+`;
  // }

  // return psblPaths;
  const legalMoves = [];
  for (const d of psblPaths){
    const desPiece = whatIsAt(d);
    const bBorg = pieceToBitBoard[piece];
    const bBorgEn = desPiece != ' ' ? pieceToBitBoard[desPiece] : null;

    pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], pos, 0);
    pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], d, 1);
    if (desPiece != ' ')
      pieceToBitBoard[desPiece] = replaceBit(pieceToBitBoard[desPiece], d, 0);

    const leavesKingChecked = kingChecked(r);

    pieceToBitBoard[piece] = bBorg;
    if (desPiece != ' ') pieceToBitBoard[desPiece] = bBorgEn;

    if (!leavesKingChecked) legalMoves.push(d);
  }
  return legalMoves;
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
  const enemyKing = getPos(pieceToBitBoard[`${p2}K`]);
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
    const attacks = forPawnAttacks(row, col, pos, p2);
    for (const atck of attacks){
      enemyAttacks.push(atck);
    }
  }
  for (const pos of enemyKing){
    let row = Math.floor(pos/8);
    let col = pos - row * 8;
    const attacks = forKingAttacks(row, col, pos, p2);
    for (const atck of attacks){
      enemyAttacks.push(atck);
    }
  }
  if (enemyAttacks.includes(kingPos[0])) return true;
  return false;
}

function buildPieceToBitBoard(gameState){
  pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
    'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
    'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
    'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
    'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
    'bPl': gameState.BLACK_PLACEMENTS, 'wPl': gameState.WHITE_PLACEMENTS
  }

  return pieceToBitBoard;
}

function hasAnyLegalMove(gs, roomState){
  gameState = gs;
  room = roomState;
  pieceToBitBoard = buildPieceToBitBoard(gs);

  const color = roomState.turn;
  const pieceColor = color == 'white' ? 'w' : 'b';
  const pieceToFunc = {
    'wR': forRooks, 'wN': forKnights, 'wB': forBishops,
    'wK': forKing, 'wQ': forQueen, 'wP': forPawn,
    'bR': forRooks, 'bN': forKnights, 'bB': forBishops,
    'bK': forKing, 'bQ': forQueen, 'bP': forPawn,
  };

  for (const kind of ['P', 'R', 'N', 'B', 'Q', 'K']){
    const piece = pieceColor + kind;
    const positions = getPos(pieceToBitBoard[piece]);

    for (const pos of positions){
      const row = Math.floor(pos/8);
      const col = pos - row * 8;
      const moves = pieceToFunc[piece](row, col, pos, pieceColor);

      for (const des of moves){
        const captured = whatIsAt(des);
        const originalPieceBoard = pieceToBitBoard[piece];
        const originalCapturedBoard = captured != ' ' ? pieceToBitBoard[captured] : null;

        pieceToBitBoard[piece] = replaceBit(originalPieceBoard, pos, 0);
        pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], des, 1);
        if (captured != ' ')
          pieceToBitBoard[captured] = replaceBit(pieceToBitBoard[captured], des, 0);

        const checked = kingChecked(roomState);

        pieceToBitBoard[piece] = originalPieceBoard;
        if (captured != ' ')
          pieceToBitBoard[captured] = originalCapturedBoard;

        if (!checked) return true;
      }
    }
  }

  return false;
}

function checkStaleMate(gs, roomState){
  gameState = gs;
  room = roomState;
  pieceToBitBoard = buildPieceToBitBoard(gs);
  if (kingChecked(roomState)) return false;
  return !hasAnyLegalMove(gs, roomState);
}

function checkCheckMate(gs, roomState){
  gameState = gs;
  room = roomState;
  pieceToBitBoard = buildPieceToBitBoard(gs);
  if (!kingChecked(roomState)) return false;
  return !hasAnyLegalMove(gs, roomState);
}

function getPos(bB){
  let pos = [];
  for (let i = 0; i <= 63; i++){
    if ((bB >> BigInt(i)) & 1n) pos.push(i);
  }
  return pos;
}

function getAllMoves(turn, castle = false, attacksOnly = false){
  const piece = turn == 'white' ? 'w' : 'b';

  let ttlPieces = [`${piece}P`, `${piece}R`, `${piece}N`, `${piece}B`, `${piece}Q`]
  if (!castle || attacksOnly)
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
    const move = (attacksOnly && p[1] == 'P') ? forPawnAttacks(row, col, pos, piece) : (attacksOnly && p[1] == 'K') ? forKingAttacks(row, col, pos, piece) : pieceToFunc[p](row, col, pos, piece);
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

  // en passant
  if (gameState.twoSqPawn.length != 0){
    const enPawn = gameState.twoSqPawn[0];
    const enRow = Math.floor(enPawn / 8);
    const enCol = enPawn - enRow * 8;
    const enPiece = whatIsAt(enPawn);
    const target = src == 'w' ? enPawn + 8 : enPawn - 8;

    if (enRow == row && Math.abs(enCol - col) == 1 && enPiece[1] == 'P' && enPiece[0] != src && whatIsAt(target) == ' '){
      possibleSqs.push(target);
    }
  }

  if (rowNew >= 0 && rowNew <= 7){
    const tar = whatIsAt(posNew)[0];
    if (tar == ' ') possibleSqs.push(posNew);
  }
  return possibleSqs;
}

function forPawnAttacks(row, col, pos, src){
  let possibleSqs = [];
  if (src == 'w' && row < 7){
    if (col < 7) possibleSqs.push(pos+9);
    if (col > 0) possibleSqs.push(pos+7);
  }
  else if (src == 'b' && row > 0){
    if (col < 7) possibleSqs.push(pos-7);
    if (col > 0) possibleSqs.push(pos-9);
  }
  return possibleSqs;
}

function forKingAttacks(row, col, pos, src){
  let step = [[1, 0], [-1, 0], [0, 1], [0, -1], [1,1], [1,-1], [-1, 1], [-1, -1]];
  let possibleSqs = [];
  for (let i = 0; i <= 7; i++){
    const rowNew = row + step[i][0]; const colNew = col + step[i][1];
    if (rowNew >= 0 && rowNew <= 7 && colNew >= 0 && colNew <= 7)
      possibleSqs.push(rowNew * 8 + colNew);
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
  if (src == 'w' && !gameState.whiteCastled && !kingChecked(room) && !gameState.whiteKMoved){
    let moves = getAllMoves('black', true, true);
    if (whatIsAt(1) == ' ' && whatIsAt(2) == ' ' && whatIsAt(3) == ' ' && whatIsAt(0) == 'wR' && !gameState.whiteQRookMoved){ // queen side castling
      if (!moves.includes(2) && !moves.includes(3)){
        possibleSqs.push(2);
        gameState.castleType = 'Q';
      }
    }
    if (whatIsAt(5) == ' ' && whatIsAt(6) == ' ' && whatIsAt(7) == 'wR' && !gameState.whiteKRookMoved){ // king side castling
      if (!moves.includes(5) && !moves.includes(6)){
        gameState.castleType = 'K';
        possibleSqs.push(6);
      }
    }
  }
  else if (src == 'b' && !gameState.blackCastled && !kingChecked(room) && !gameState.blackKMoved){
    let moves = getAllMoves('white', true, true);
    if (whatIsAt(57) == ' ' && whatIsAt(58) == ' ' && whatIsAt(59) == ' ' && whatIsAt(56) == 'bR' && !gameState.blackQRookMoved){ // queen side castling
      if (!moves.includes(58) && !moves.includes(59)){
        gameState.castleType = 'Q';
        possibleSqs.push(58);
      }
    }
    if (whatIsAt(61) == ' ' && whatIsAt(62) == ' ' && whatIsAt(63) == 'bR' && !gameState.blackKRookMoved){ // king side castling
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
        if (oppn >= 1) neg = false;
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

function checkCastleUtils(turn, src, des = src){
  const piece = whatIsAt(des);
  if (whatIsAt(0) != 'wR') gameState.whiteQRookMoved = true; 
  if (whatIsAt(7) != 'wR') gameState.whiteKRookMoved = true; 
  if (whatIsAt(56) != 'bR') gameState.blackQRookMoved = true; 
  if (whatIsAt(63) != 'bR') gameState.blackKRookMoved = true;
  if (turn == 'white'){
    if (piece[1] == 'R' && !gameState.whiteQRookMoved && src == 0) gameState.whiteQRookMoved = true; 
    if (piece[1] == 'R' && !gameState.whiteKRookMoved && src == 7) gameState.whiteKRookMoved = true; 
    if (piece[1] == 'K' && !gameState.whiteKMoved) gameState.whiteKMoved = true;
  }
  if (turn == 'black'){
    if (piece[1] == 'R' && !gameState.blackQRookMoved && src == 56) gameState.blackQRookMoved = true; 
    if (piece[1] == 'R' && !gameState.blackKRookMoved && src == 63) gameState.blackKRookMoved = true; 
    if (piece[1] == 'K' && !gameState.blackKMoved) gameState.blackKMoved = true;
  }
}

function isPromoted(src, des, gs){
  gameState = gs;
  pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
    'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
    'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
    'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
    'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
    'bPl': gameState.BLACK_PLACEMENTS, 'wPl': gameState.WHITE_PLACEMENTS
  }
  const piece = whatIsAt(des);
  if (piece[1] == 'P'){
    const row = Math.floor(des/8);
    if (row == 7 && piece[0] == 'w') return true;
    if (row == 0 && piece[0] == 'b') return true;
  }
  return false;
}

function getPoint(des){
  const piece = whatIsAt(des);
  if (piece == ' ') return 0;
  const pieceTopoints = {'P': 1, 'R': 5, 'B': 3, 'N': 3, 'Q': 8};
  return pieceTopoints[piece[1]];
}

export {validateMoveAt, checkCheckMate, checkStaleMate, checkCastleUtils, isPromoted, getPoint};