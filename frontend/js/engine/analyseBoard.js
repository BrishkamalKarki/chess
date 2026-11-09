let gameState, pieceToBitBoard;
function checkCheck(pos, possibleSqs, piece, gameState){
  pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
    'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
    'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
    'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
    'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
  }
  

  let ttlPsblMoves = [] // store possible moves of Opponent rook, bishop queen
  for (const psblSqs of possibleSqs){
    let cpBB = replaceBit(pieceToBitBoard[piece], psblSqs, 1);
    cpBB = replaceBit(cpBB, pos, 0);

  }
  
}

function replaceBit(of, at, by){
  if (by)
    return ((of | (BigInt(1) << BigInt(at))));
  else 
    return ((of & ~(BigInt(1) << BigInt(at))));
}

export {checkCheck};