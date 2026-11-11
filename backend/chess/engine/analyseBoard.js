
let pieceToBitBoard;

function willGetChecked(pos, piece, pBb, room, des){ // check if moving any piece will check the king
  pieceToBitBoard = pBb;
  
  let p1, p2;
  if (room.turn == 'white'){
    p1 = 'w';
    p2 = 'b';
  }
  else{
    p1 = 'b';
    p2 = 'w';
  }

  let orgBb = pieceToBitBoard[piece];
  console.log(piece, pos)
  pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], pos, 0);
  pieceToBitBoard[piece] = replaceBit(pieceToBitBoard[piece], des, 1);
  let placementBb;
  if (room.turn == 'white'){
    placementBb = pieceToBitBoard['wPl'];
    pieceToBitBoard['wPl'] = replaceBit(pieceToBitBoard['wPl'], pos, 0);
    pieceToBitBoard['wPl'] = replaceBit(pieceToBitBoard['wPl'], des, 1);
  }
  else{
    placementBb = pieceToBitBoard['bPl'];
    pieceToBitBoard['bPl'] = replaceBit(pieceToBitBoard['bPl'], pos, 0);
    pieceToBitBoard['bPl'] = replaceBit(pieceToBitBoard['bPl'], des, 1);
  }
  let orgOppBb = null;  let oppPiece = null;
  let pieces = [`${p2}B`, `${p2}Q`, `${p2}R`]
    for (const p of pieces)
      if (checkOpp(pieceToBitBoard[p], des)){
        orgOppBb = pieceToBitBoard[p]; 
        pieceToBitBoard[p] = replaceBit(pieceToBitBoard[p], des, 0)
        oppPiece = p; 
      }

  console.log(oppPiece)
  const kingPos = getPos(pieceToBitBoard[`${p1}K`]); // getting kings pos
  // getting long ranged attack of opponent 
  let enemyAttacks = [];
  const enemyRooks = getPos(pieceToBitBoard[`${p2}R`]);
  const enemyBishops = getPos(pieceToBitBoard[`${p2}B`]);
  const enemyQueen = getPos(pieceToBitBoard[`${p2}Q`]);
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

  pieceToBitBoard[piece] = orgBb;
  if (orgOppBb != null) pieceToBitBoard[oppPiece] = orgOppBb;
  if (room.turn == 'white'){
    pieceToBitBoard['wPl'] = placementBb;
  }
  else{
    pieceToBitBoard['bPl'] = placementBb;
  }
  console.log(" enemies attack is ", enemyAttacks, ' kings position is', kingPos[0]);
  if (enemyAttacks.includes(kingPos[0])) return true;
  return false;
}

function checkOpp(bB, des){
  return ((bB >> BigInt(des)) & 1n);
}

function getCp(cp){
  return cp;
}

function getPos(bB){
  let pos = [];
  for (let i = 0; i <= 63; i++){
    if ((bB >> BigInt(i)) & 1n) pos.push(i);
  }
  return pos;
}

function replaceBit(of, at, by){
  if (by)
    return ((of | (BigInt(1) << BigInt(at))));
  else 
    return ((of & ~(BigInt(1) << BigInt(at))));
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


function forQueen(row, col, pos, src){
  const diagPsblSqs = forBishops(row, col, pos, src);
  const hvPsblSqs = forRooks(row, col, pos, src);
  return [...diagPsblSqs, ...hvPsblSqs];
};

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

function checkMate(){
  // const bK = pieceToBitBoard['bK'];
  // const wK = pieceToBitBoard['wK'];
  // let bKP = getPos(bK);
  // let row = Math.floor(bKP/8);
  // let col = getPos(bK) - row * 8;
  // const bKPaths = forKing(row, col, bKP, 'b');
  // if (bKPaths.length == 0) return 'black';
  // let wKP = getPos(wK);
  // row = Math.floor(wKP/8);
  // col = getPos(wK) - row * 8;
  // const wKPaths = forKing(row, col, wKP, 'w');
  // if (wKPaths.length == 0) return 'white';
  // return ' ';
}

export {willGetChecked, checkMate};