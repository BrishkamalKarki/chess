import { checkCheck } from "./analyseBoard.js";

let gameState, pieceToBitBoard;

function validateMoveAt(pos, gs){
  gameState = gs;
  pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
    'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
    'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
    'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
    'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
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
  const psblPaths = pieceToFunc[piece](row, col, pos, piece[0]);
  const checkSqs = checkCheck(pos, psblPaths, piece, gs);
  console.log(psblPaths, ' are possible Paths');
  return psblPaths;
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
    if (row == 1) possibleSqs.push(pos+16);
    if (row < 7){
      if (col < 7)
        if (whatIsAt(pos+9)[0] != ' ' && whatIsAt(pos+9)[0] != src) possibleSqs.push(pos+9);
      if (col > 0)
        if (whatIsAt(pos+7)[0] != ' ' && whatIsAt(pos+7)[0] != src) possibleSqs.push(pos+7);
    }
  }
  else{
    posNew = pos - 8;
    rowNew = row - 1;
    if (row == 6) possibleSqs.push(pos-16);
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
  console.log(row, col, src)
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
  console.log(row, col, src)
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

export {validateMoveAt};