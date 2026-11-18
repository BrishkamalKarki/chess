#include <iostream>
#include <cstdint>
#include <cstdlib>
#include <vector>   
#include <emscripten.h>
#include <cstdio>
#include <limits>
#include <algorithm>
#include <utility>
#include <bit>
#include <random>

#define EXTERN extern "C" 

using namespace std;

struct gameState{
  uint64_t bitBoards[2][6];
  int color;
  int depth;
  int turn;
  int epSquare = -1;
  int castlingRights = 0;
};

struct Move{
  int from;
  int to;
  int promotion;
  int srcPiece;
  int targetPiece;
  int epCapture = -1;
  int castle = 0;
  int prevEpSquare = -1;
  int prevCastlingRights = 0;
};

gameState gs;
int bestMove;
constexpr int WK = 1; // white side king castle
constexpr int WQ = 2; // white side queen castle
constexpr int BK = 4;
constexpr int BQ = 8;

int whatIsAt(int pos){
  if (pos < 0 || pos >= 64) return 0;
  // for white pieces // 0 * 10 + num
  if ((gs.bitBoards[0][0] >> pos) & 1ULL) return 1;
  if ((gs.bitBoards[0][1] >> pos) & 1ULL) return 2;
  if ((gs.bitBoards[0][2] >> pos) & 1ULL) return 3;
  if ((gs.bitBoards[0][3] >> pos) & 1ULL) return 4;
  if ((gs.bitBoards[0][4] >> pos) & 1ULL) return 5;
  if ((gs.bitBoards[0][5] >> pos) & 1ULL) return 6;
  // for black pieces // 1 * 10 + num
  if ((gs.bitBoards[1][0] >> pos) & 1ULL) return 11;
  if ((gs.bitBoards[1][1] >> pos) & 1ULL) return 12;
  if ((gs.bitBoards[1][2] >> pos) & 1ULL) return 13;
  if ((gs.bitBoards[1][3] >> pos) & 1ULL) return 14;
  if ((gs.bitBoards[1][4] >> pos) & 1ULL) return 15;
  if ((gs.bitBoards[1][5] >> pos) & 1ULL) return 16;
  
  return 0;
}

inline vector<int> getPos(uint64_t bB){
  vector<int> pos;
  for (int i = 0; i <= 63; i++){
    if ((bB >> i) & 1ULL) pos.push_back(i);
  }
  return pos;
}

inline void forEachBit(uint64_t bB, auto callback){ // faster version of getPos
  while(bB){
    int pos = std::countr_zero(bB); // gives postion of the first 1 from the rightside
    callback(pos); // for each 1's position calls the passed lambda
    bB &= bB - 1; // removing rightmost set bit
  }
}

bool isSquareAttacked(int square, int attackerColor){ // reverse checking from the destination to the src if src has enemy piece or not 
  int row = square / 8;
  int col = square % 8;

  // pawn attacks
  uint64_t pawns = gs.bitBoards[attackerColor][5];
  int direction = (attackerColor == 0)? 1: -1;
  for (int dc: {-1, 1}){
    int newRow = row - direction;
    int newCol = col - dc;
    if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) continue;
    int pos = newRow * 8 + newCol;
    if (pawns & (1ULL << pos)) return true;
  }

  // knight attacks
  int knightOffsets[8][2] = {{-2,-1}, {-2,1}, {-1,-2}, {-1,2}, {1,-2}, {1,2}, {2,-1}, {2,1}};
  uint64_t knights = gs.bitBoards[attackerColor][3];
  for (auto& offset: knightOffsets){
      int newRow = row + offset[0];
      int newCol = col + offset[1];
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) continue;
      int pos = newRow * 8 + newCol;
      if (knights & (1ULL << pos)) return true;
  }

  // rook and queen attacks
  int straight[4][2] = {{-1,0}, {1,0}, {0,-1}, {0,1}};
  uint64_t rooksQueens = gs.bitBoards[attackerColor][4] | gs.bitBoards[attackerColor][1]; // making newbitboard for combined rook and queen
  for (auto& dir: straight){ // looping over all east west north south
    int newRow = row + dir[0];
    int newCol = col + dir[1];
    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8){ // for eaach step
      int pos = newRow * 8 + newCol;
      uint64_t posBb = 1ULL << pos; // bitboard with src pos as 1 bit
      if (rooksQueens & posBb) return true; // if src has queen or rooks
      if (whatIsAt(pos) != 0) break; // if enemy or own piece then stop , empty if continue
      newRow += dir[0];
      newCol += dir[1];
    }
  }

  // bishops and queen attacks
  int diagonal[4][2] = {{-1,-1}, {-1,1}, {1,-1}, {1,1}};
  uint64_t bishopsQueens = gs.bitBoards[attackerColor][2] | gs.bitBoards[attackerColor][1];
  for (auto& dir: diagonal){
      int newRow = row + dir[0];
      int newCol = col + dir[1];
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8){
        int pos = newRow * 8 + newCol;
        uint64_t mask = 1ULL << pos;
        if (bishopsQueens & mask) return true;
        if (whatIsAt(pos) != 0) break;
        newRow += dir[0];
        newCol += dir[1];
      }
  }

  // king attacks
  uint64_t enemyKing = gs.bitBoards[attackerColor][0];
  for (int dr = -1; dr <= 1; dr++){
    for (int dc = -1; dc <= 1; dc++){
      if (dr == 0 && dc == 0) continue;
      int newRow = row + dr;
      int newCol = col + dc;
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) continue;
      int pos = newRow * 8 + newCol;
      if (enemyKing & (1ULL << pos)) return true;
    }
  }

  return false;
}

inline void makeMove(Move& move){
  int sClr = move.srcPiece/10; // src piece color
  int sPis = move.srcPiece%10 - 1; // src piece 0 1 2 3 4 5
  int tClr = move.targetPiece/10;
  int tPis = move.targetPiece%10 - 1;
  gs.bitBoards[sClr][sPis] = gs.bitBoards[sClr][sPis] & ~(1ULL << move.from); // replacing with 0 at src
  gs.bitBoards[sClr][sPis] = gs.bitBoards[sClr][sPis] | (1ULL << move.to); // replacing with 1 at des
  if (move.targetPiece != 0){
    gs.bitBoards[tClr][tPis] = gs.bitBoards[tClr][tPis] & ~(1ULL << move.to);
  }
  if (move.promotion != 0){
    gs.bitBoards[sClr][sPis] = gs.bitBoards[sClr][sPis] & ~(1ULL << move.to); // replacing the des pawn with 0
    gs.bitBoards[sClr][move.promotion] = gs.bitBoards[sClr][move.promotion] | (1ULL << move.to); // replacing the des pawn with 0
  }

  // enpassant work
  move.prevEpSquare = gs.epSquare; // saving the passed enpassant capturable square
  gs.epSquare = -1; // enpassant is only capturable one time
  if (move.epCapture != -1){ // captured enemy piece
    gs.bitBoards[1-sClr][5] = gs.bitBoards[1-sClr][5] & ~(1ULL << move.epCapture);
  }
  if (sPis == 5 && std::abs(move.to - move.from) == 16){
    gs.epSquare = move.to; // if double pawn then set epSquare
  }

  // castling
  move.prevCastlingRights = gs.castlingRights;
  if (move.castle == 1){// king side
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] & ~(1ULL << (sClr == 0? 7: 63));
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] | (1ULL << (sClr == 0? 7-2: 63-2));
  }
  else if (move.castle == 2){// queen side
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] & ~(1ULL << (sClr == 0? 0: 56));
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] | (1ULL << (sClr == 0? 3: 59));
  }

  if (sPis == 0){ // if king is moved
    gs.castlingRights = gs.castlingRights & (sClr == 0? ~(WK|WQ): ~(BK|BQ));
  } // 1|2 01|10 11 => ...1111100 and  4|8 0100|1000 1100 => ...11110011

  if (sPis == 4){ // if rook moved then not giving respective side rights
    if (move.from == 0) gs.castlingRights &= ~WQ;
    if (move.from == 7) gs.castlingRights &= ~WK;
    if (move.from == 56) gs.castlingRights &= ~BQ;
    if (move.from == 63) gs.castlingRights &= ~BK;
  }

  // if anything moves to rook position take the right
  if (move.to == 0) gs.castlingRights &= ~WQ;
  if (move.to == 7) gs.castlingRights &= ~WK;
  if (move.to == 56) gs.castlingRights &= ~BQ;
  if (move.to == 63) gs.castlingRights &= ~BK;

  gs.turn = gs.turn == 0? 1: 0;
}

inline void unMakeMove(Move& move){
  int sClr = move.srcPiece/10;
  int sPis = move.srcPiece%10 - 1;
  int tClr = move.targetPiece/10;
  int tPis = move.targetPiece%10 - 1;
  gs.bitBoards[sClr][sPis] = gs.bitBoards[sClr][sPis] | (1ULL << move.from);
  gs.bitBoards[sClr][sPis] = gs.bitBoards[sClr][sPis] & ~(1ULL << move.to);
  if (move.targetPiece != 0){
    gs.bitBoards[tClr][tPis] = gs.bitBoards[tClr][tPis] | (1ULL << move.to);
  }
  if (move.promotion != 0){
    gs.bitBoards[sClr][move.promotion] = gs.bitBoards[sClr][move.promotion] & ~(1ULL << move.to); 
  }

  // enpassant work
  gs.epSquare = move.prevEpSquare; // restoring enpassant capturable square
  if (move.epCapture != -1){ 
    gs.bitBoards[1-sClr][5] = gs.bitBoards[1-sClr][5] | (1ULL << move.epCapture); // restoring captured piece
  }

  // castling
  gs.castlingRights = move.prevCastlingRights; // restoring
  if (move.castle == 1){// king side
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] | (1ULL << (sClr == 0? 7: 63));
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] & ~(1ULL << (sClr == 0? 7-2: 63-2));
  }
  else if (move.castle == 2){// queen side
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] | (1ULL << (sClr == 0? 0: 56));
    gs.bitBoards[sClr][4] = gs.bitBoards[sClr][4] & ~(1ULL << (sClr == 0? 3: 59));
  }

  gs.turn = gs.turn == 0? 1: 0;
}

bool isKingInCheck(int kingColor){
  int kingSq = -1;
  forEachBit(gs.bitBoards[kingColor][0], [&](int pos){
    kingSq = pos;
  });
  if (kingSq == -1) return true;
  return isSquareAttacked(kingSq, 1 - kingColor);
}

inline void simulateMoves(vector<Move>& moves){
  vector<Move> legalMoves;
  for (auto& mv: moves){
    makeMove(mv);
    bool illegal = isKingInCheck(1 - gs.turn);
    unMakeMove(mv);
    if (!illegal) legalMoves.push_back(mv);
  }
  moves = std::move(legalMoves);
}

inline void forPawns(int n, vector<Move>& moves){
  // for pawn
  vector<int> pawnShift = {7, 8, 9}; // attack, attack, single step, double step
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;

    if (gs.epSquare != -1){ // if player has the 2 step pawn
      int dir = gs.turn == 0 ? 1 : -1;
      int epRow = gs.epSquare / 8;
      int epCol = gs.epSquare % 8;
      int target = gs.epSquare + dir * 8;
      int enemyPawn = gs.turn == 0 ? 16 : 6;

      if (target >= 0 && target < 64 && epRow == row && std::abs(epCol - col) == 1 && whatIsAt(gs.epSquare) == enemyPawn && whatIsAt(target) == 0){
        moves.push_back({pos, target, 0, whatIsAt(pos), 0, gs.epSquare});
      }
    }
    for (int& pS: pawnShift){
      int des = pos+(gs.turn == 0? 1:-1)*pS;
      if (des < 0 || des > 63) continue;
      int newRow = des/8;
      if (pS == 7 || pS  == 9){ // for diagonal check
        if (gs.turn == 0){
          if (pS == 7 && col == 0) continue;
          if (pS == 9 && col == 7) continue;
        } 
        else{
          if (pS == 7 && col == 7) continue;
          if (pS == 9 && col == 0) continue;
        }
        int tar = whatIsAt(des);
        if (!tar || gs.turn == tar / 10) continue;
        int promote = ((gs.turn == 0 && newRow == 7) || (gs.turn == 1 && newRow == 0))? 1: 0;
        if (promote ){
          moves.push_back({pos, des, 1, whatIsAt(pos), tar}); // queen
          moves.push_back({pos, des, 2, whatIsAt(pos), tar}); // bishop
          moves.push_back({pos, des, 3, whatIsAt(pos), tar}); // knight
          moves.push_back({pos, des, 4, whatIsAt(pos), tar}); // rook
        }
        else moves.push_back({pos, des, 0, whatIsAt(pos), tar});
      }
      else if (pS == 8){
        int tar = whatIsAt(des);
        int promote = ((gs.turn == 0 && newRow == 7) || (gs.turn == 1 && newRow == 0))? 1: 0;
        if (promote && !tar){
          moves.push_back({pos, des, 1, whatIsAt(pos), tar}); // queen
          moves.push_back({pos, des, 2, whatIsAt(pos), tar}); // bishop
          moves.push_back({pos, des, 3, whatIsAt(pos), tar}); // knight
          moves.push_back({pos, des, 4, whatIsAt(pos), tar}); // rook
        }
        else if (!tar) moves.push_back({pos, des, 0, whatIsAt(pos), tar}); // for 1 step
        else continue;
        int nextDes = des+(gs.turn == 0? 1:-1)*8;
        if (nextDes < 0 || nextDes > 63) continue;
        if (!whatIsAt(nextDes) && ((row == 1 && !gs.turn) || (row == 6 && gs.turn)) && !promote) moves.push_back({pos, nextDes, 0, whatIsAt(pos), tar}); // for 2 step
      }
    }
  });
}

inline void forRooks(int n, vector<Move>& moves){
  // for rook
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;
    vector<int> loopMax = {7-row, row, 7-col, col};
    vector<int> step = {8, -8, 1, -1};
    for (int j = 0; j <= 3; j++){
      for (int i = 1; i <= loopMax[j]; i++){
        int des = pos + step[j] * i;
        int tar = whatIsAt(des);
        if (tar == 0){moves.push_back({pos, des, 0, whatIsAt(pos), tar}); continue;} 
        if (gs.turn != (tar/10)){moves.push_back({pos, des, 0, whatIsAt(pos), tar}); break;}
        else break;
      }
    } 
  });
}

inline void forKnights(int n, vector<Move>& moves){
  // for knight
  vector<pair<int, int>> knightShift = {{ 2,  1}, { 2, -1}, {-2,  1}, {-2, -1}, { 1,  2}, { 1, -2}, {-1,  2}, {-1, -2}};
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;
    
    for (auto& [kRS, kCS]: knightShift){
      int newRow = row + kRS;
      int newCol = col + kCS;
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) continue;
      
      int des = newRow * 8 + newCol;
      if (des < 0 || des > 63) continue;
      int tar = whatIsAt(des);
      if (tar == 0 || (gs.turn != (tar / 10))) moves.push_back({pos, des, 0, whatIsAt(pos), tar}); // if enemy or empty square
    }
  });
}


inline void forBishops(int n, vector<Move>& moves){
  // for bishop
  vector<pair<int,int>> signs = {{1, 1}, {1, -1}, {-1, 1}, {-1, -1}};
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;

    for (int j = 0; j <= 3; j++){
      for (int i = 1; i <= 7; i++){
        int newRow = row + signs[j].first * i;
        int newCol = col + signs[j].second * i;
        if (newRow > 7 || newRow < 0 || newCol > 7 || newCol < 0) break;
        int des = newRow * 8 + newCol;
        int tar = whatIsAt(des);
        if (tar == 0){moves.push_back({pos, des, 0, whatIsAt(pos), tar}); continue;} 
        if (gs.turn != (tar/10)){moves.push_back({pos, des, 0, whatIsAt(pos), tar}); break;} // enemy
        else break;
      }
    } 
  });
}

inline void forQueen(int n, vector<Move>& moves){
  forRooks(n, moves);
  forBishops(n, moves);
}

inline bool canCastle(int color, int side){
  int kingPos = color == 0? 4 : 60; // white and black king position
  int enemy = 1 - color;
  if (isSquareAttacked(kingPos, enemy)) return false;
  int kingCode = color == 0? 1 : 11; 
  int rookCode = color == 0? 5 : 15;
  int rookFrom = color == 0? (side == 1? 7 : 0): (side == 1? 63 : 56); // side 1 and 2 is king and queen side

  if (whatIsAt(kingPos) != kingCode || whatIsAt(rookFrom) != rookCode) return false; // king and rook have to be in orignial position
  int whichSide = color == 0? (side == 1? WK : WQ): (side == 1? BK : BQ);
  if (!(gs.castlingRights & whichSide)) return false; // initially 1111 & 0001 or 0010 or 0100 or 1000
  // 0011 no white right if tried to access the white right 1000 or 0100 then false
  int step1 = color == 0? (side == 1? 5 : 3): (side == 1? 61 : 59); // square king passes through
  int step2 = color == 0? (side == 1? 6 : 2): (side == 1? 62 : 58); // king lands on
  if (whatIsAt(step1) != 0 || whatIsAt(step2) != 0) return false; // if both place is not empty
  if (isSquareAttacked(step1, enemy)) return false;
  if (isSquareAttacked(step2, enemy)) return false;

  if (side == 2){ // 1 extra has square in queens side 
    int bSquare = color == 0 ? 1 : 57;
    if (whatIsAt(bSquare) != 0) // has to be empty
      return false;
  }

  return true;
}

inline void forKing(int n, vector<Move>& moves){
  // for pawn
  vector<int> kingShift = {1, -1, 7, -7, 8, -8, 9, -9}; // attack, attack, single step, double step
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;
    
    int home = gs.turn == 0 ? 4 : 60;
      // castling 
      if (pos == home){
      if (canCastle(gs.turn, 1)){
        if (gs.turn == 0)
          moves.push_back({pos, 6, 0, whatIsAt(pos), 0, -1, 1});
        else
          moves.push_back({pos, 62, 0, whatIsAt(pos), 0, -1, 1});
      }
      if (canCastle(gs.turn, 2)){
        if (gs.turn == 0)
          moves.push_back({pos, 2, 0, whatIsAt(pos), 0, -1, 2});
        else
          moves.push_back({pos, 58, 0, whatIsAt(pos), 0, -1, 2});
      }
    }

    for (int& pS: kingShift){
      int des = pos+pS;
      if (des < 0 || des > 63) continue;
      int newRow = des/8;
      int newCol = des%8;
      if (newRow != row && abs(row-newRow) != 1) continue;
      if (newCol != col && abs(col-newCol) != 1) continue;

      int tar = whatIsAt(des);
      if (gs.turn == (tar/10) && tar != 0) continue;
      if (gs.turn != (tar/10) || tar == 0) moves.push_back({pos, des, 0, whatIsAt(pos), tar});
    }
  });
}

vector<Move> moveGenerator(){
  vector<Move> moves;
  forPawns(5, moves);
  forKnights(3, moves);
  forRooks(4, moves);
  forBishops(2, moves);
  forQueen(1, moves);
  forKing(0, moves);
  simulateMoves(moves);
  return moves;
}

constexpr int PIECE_VALUES[6] = {0, 900, 330, 325, 500, 100}; // K Q B N R P
inline int materialAdv(){
  int score = 0;
  for (int piece = 0; piece < 6; piece++){
    int whiteCount = std::popcount(gs.bitBoards[0][piece]); // counts no of bit 1 
    int blackCount = std::popcount(gs.bitBoards[1][piece]);
    score += (whiteCount - blackCount) * PIECE_VALUES[piece]; // from white's perspective
  }
  return gs.turn == 0 ? score: -score; // if white's turn then sending from white's perspective
}

int evaluate(){
  int ttlScore = 0;
  ttlScore += materialAdv();
  return ttlScore;
}

int nodes = 0;

int moveOrderEvaluator(const Move& move){
  int score = 0;
  if (move.targetPiece != 0){
    int targetPiece = move.targetPiece%10 - 1;
    int srcPiece = move.srcPiece%10 - 1;
    score += 10000 + PIECE_VALUES[targetPiece] * 10 - PIECE_VALUES[srcPiece]; // lower the piece eats higher the piece it is good
  }

  if (move.promotion != 0){
    score += 20000 + PIECE_VALUES[move.promotion] * 10; // promotion > normal attacks
  }

  return score;
}

int negaMax(int alpha, int beta, int depth){
  vector<Move> moves = moveGenerator();

  // sorting the moves based on the good moves giving first priority
  sort(moves.begin(), moves.end(), [](Move& M1, Move& M2){
    return moveOrderEvaluator(M1) > moveOrderEvaluator(M2);
  });

  int bestScore = -numeric_limits<int>::max();
  if (moves.empty()){
    // if (kingChecked())
    //   return gs.depth - depth;
    return 0;
  }
  if (depth == 0) return evaluate();
  for (auto& move: moves){
    makeMove(move);
    int score = -negaMax(-beta, -alpha, depth - 1);
    nodes++;
    unMakeMove(move);
    if (score > bestScore){
      bestScore = score;
      if (depth == gs.depth){
        bestMove = move.from * 100 + move.to;
        bestMove = bestMove * 10 + move.promotion;
      }
    }
    alpha = max(alpha, score);
    if (alpha >= beta) break; // pruned
  }
  return bestScore;
}


EXTERN // to prevent name mangling
EMSCRIPTEN_KEEPALIVE // when compiled to wasm to prevent striping the function since it is not called
int getBestMove(uint64_t wK, uint64_t wN, uint64_t wQ, uint64_t wR, uint64_t wB, uint64_t wP,
  uint64_t bK, uint64_t bN, uint64_t bQ, uint64_t bR, uint64_t bB, uint64_t bP, int color, int depth, int epSquare, int castlingRights)
  {
    gs.bitBoards[0][0] = wK; gs.bitBoards[0][1] = wQ; gs.bitBoards[0][2] = wB; gs.bitBoards[0][3] = wN; gs.bitBoards[0][4] = wR; gs.bitBoards[0][5] = wP;
    gs.bitBoards[1][0] = bK; gs.bitBoards[1][1] = bQ; gs.bitBoards[1][2] = bB; gs.bitBoards[1][3] = bN; gs.bitBoards[1][4] = bR; gs.bitBoards[1][5] = bP;
    gs.color = color; // 0 white 1 black
    gs.turn = color;
    gs.depth = depth;
    gs.epSquare = epSquare;
    gs.castlingRights = castlingRights;

    bestMove = 0;
    nodes = 0;
    int alpaBeta = numeric_limits<int>::max();
    int score = negaMax(-alpaBeta, alpaBeta ,gs.depth); // alpha(my best) beta(opp best) depth

    printf("The best move is and node is: %d %d %d\n", bestMove/100, bestMove%100, nodes);
  return bestMove;
}