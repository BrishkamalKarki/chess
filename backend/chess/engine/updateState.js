function replaceBit(of, at, by){
  if (by)
    return ((of | (BigInt(1) << BigInt(at))));
  else 
    return ((of & ~(BigInt(1) << BigInt(at))));
}

function isPiece(of, at){
  return ((of >> BigInt(at)) & 1n);
}

function updateBitAfterMove(src, des, gameState){
  const bit = [0, 1];
  const pos = [src, des];
  if (isPiece(gameState.WHITE_PLACEMENTS, src)){
    // replacing the src bit by 0 and des by 1 on our side
    if (isPiece(gameState.WHITE_BISHOPS, src)){
      gameState.WHITE_BISHOPS = replaceBit(gameState.WHITE_BISHOPS, src, 0);
      gameState.WHITE_BISHOPS = replaceBit(gameState.WHITE_BISHOPS, des, 1);
    }
    else if (isPiece(gameState.WHITE_KING, src)){
      gameState.WHITE_KING = replaceBit(gameState.WHITE_KING, src, 0);
      gameState.WHITE_KING = replaceBit(gameState.WHITE_KING, des, 1);
    }
    else if (isPiece(gameState.WHITE_KNIGHTS, src)){
      gameState.WHITE_KNIGHTS = replaceBit(gameState.WHITE_KNIGHTS, src, 0);
      gameState.WHITE_KNIGHTS = replaceBit(gameState.WHITE_KNIGHTS, des, 1);
    }
    else if (isPiece(gameState.WHITE_PAWNS, src)){
      gameState.WHITE_PAWNS = replaceBit(gameState.WHITE_PAWNS, src, 0);
      gameState.WHITE_PAWNS = replaceBit(gameState.WHITE_PAWNS, des, 1);
    }
    else if (isPiece(gameState.WHITE_ROOKS, src)){
      gameState.WHITE_ROOKS = replaceBit(gameState.WHITE_ROOKS, src, 0);
      gameState.WHITE_ROOKS = replaceBit(gameState.WHITE_ROOKS, des, 1);
    }
    else if (isPiece(gameState.WHITE_QUEEN, src)){
      gameState.WHITE_QUEEN = replaceBit(gameState.WHITE_QUEEN, src, 0);
      gameState.WHITE_QUEEN = replaceBit(gameState.WHITE_QUEEN, des, 1);
    }
    
    gameState.WHITE_PLACEMENTS = gameState.WHITE_BISHOPS | gameState.WHITE_KING | gameState.WHITE_KNIGHTS | gameState.WHITE_PAWNS | gameState.WHITE_QUEEN | gameState.WHITE_ROOKS;

    // replacing the src bit by 0 and des by 0 on opponent side
    if (isPiece(gameState.BLACK_BISHOPS, des))
      gameState.BLACK_BISHOPS = replaceBit(gameState.BLACK_BISHOPS, des, 0);
    else if (isPiece(gameState.BLACK_KING, des))
      gameState.BLACK_KING = replaceBit(gameState.BLACK_KING, des, 0);
    else if (isPiece(gameState.BLACK_KNIGHTS, des))
      gameState.BLACK_KNIGHTS = replaceBit(gameState.BLACK_KNIGHTS, des, 0);
    else if (isPiece(gameState.BLACK_PAWNS, des))
      gameState.BLACK_PAWNS = replaceBit(gameState.BLACK_PAWNS, des, 0);
    else if (isPiece(gameState.BLACK_ROOKS, des))
      gameState.BLACK_ROOKS = replaceBit(gameState.BLACK_ROOKS, des, 0);
    else if (isPiece(gameState.BLACK_QUEEN, des))
      gameState.BLACK_QUEEN = replaceBit(gameState.BLACK_QUEEN, des, 0);
    
      gameState.BLACK_PLACEMENTS = gameState.BLACK_BISHOPS | gameState.BLACK_KING | gameState.BLACK_KNIGHTS | gameState.BLACK_PAWNS | gameState.BLACK_QUEEN | gameState.BLACK_ROOKS;
      
      gameState.BLACK_WHITE = gameState.WHITE_PLACEMENTS | gameState.BLACK_PLACEMENTS;
  }
  else if(isPiece(gameState.BLACK_PLACEMENTS, src)){
    // replacing the src bit by 0 and des by 1 on our side
    if (isPiece(gameState.BLACK_BISHOPS, src)) {
      gameState.BLACK_BISHOPS = replaceBit(gameState.BLACK_BISHOPS, src, 0);
      gameState.BLACK_BISHOPS = replaceBit(gameState.BLACK_BISHOPS, des, 1);
    }
    else if (isPiece(gameState.BLACK_KING, src)) {
      gameState.BLACK_KING = replaceBit(gameState.BLACK_KING, src, 0);
      gameState.BLACK_KING = replaceBit(gameState.BLACK_KING, des, 1);
    }
    else if (isPiece(gameState.BLACK_KNIGHTS, src)) {
      gameState.BLACK_KNIGHTS = replaceBit(gameState.BLACK_KNIGHTS, src, 0);
      gameState.BLACK_KNIGHTS = replaceBit(gameState.BLACK_KNIGHTS, des, 1);
    }
    else if (isPiece(gameState.BLACK_PAWNS, src)) {
      gameState.BLACK_PAWNS = replaceBit(gameState.BLACK_PAWNS, src, 0);
      gameState.BLACK_PAWNS = replaceBit(gameState.BLACK_PAWNS, des, 1);
    }
    else if (isPiece(gameState.BLACK_ROOKS, src)) {
      gameState.BLACK_ROOKS = replaceBit(gameState.BLACK_ROOKS, src, 0);
      gameState.BLACK_ROOKS = replaceBit(gameState.BLACK_ROOKS, des, 1);
    }
    else if (isPiece(gameState.BLACK_QUEEN, src)) {
      gameState.BLACK_QUEEN = replaceBit(gameState.BLACK_QUEEN, src, 0);
      gameState.BLACK_QUEEN = replaceBit(gameState.BLACK_QUEEN, des, 1);
    }
    
      gameState.BLACK_PLACEMENTS = gameState.BLACK_BISHOPS | gameState.BLACK_KING | gameState.BLACK_KNIGHTS | gameState.BLACK_PAWNS | gameState.BLACK_QUEEN | gameState.BLACK_ROOKS;

    if (isPiece(gameState.WHITE_BISHOPS, des))
      gameState.WHITE_BISHOPS = replaceBit(gameState.WHITE_BISHOPS, des, 0);
    else if (isPiece(gameState.WHITE_KING, des))
      gameState.WHITE_KING = replaceBit(gameState.WHITE_KING, des, 0);
    else if (isPiece(gameState.WHITE_KNIGHTS, des))
      gameState.WHITE_KNIGHTS = replaceBit(gameState.WHITE_KNIGHTS, des, 0);
    else if (isPiece(gameState.WHITE_PAWNS, des))
      gameState.WHITE_PAWNS = replaceBit(gameState.WHITE_PAWNS, des, 0);
    else if (isPiece(gameState.WHITE_ROOKS, des))
      gameState.WHITE_ROOKS = replaceBit(gameState.WHITE_ROOKS, des, 0);
    else if (isPiece(gameState.WHITE_QUEEN, des))
      gameState.WHITE_QUEEN = replaceBit(gameState.WHITE_QUEEN, des, 0);

    
      gameState.WHITE_PLACEMENTS = gameState.WHITE_BISHOPS | gameState.WHITE_KING | gameState.WHITE_KNIGHTS | gameState.WHITE_PAWNS | gameState.WHITE_QUEEN | gameState.WHITE_ROOKS;
    
      
      gameState.BLACK_WHITE = gameState.WHITE_PLACEMENTS | gameState.BLACK_PLACEMENTS;
  }
};

export {updateBitAfterMove};