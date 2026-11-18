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
};

struct Move{
  int from;
  int to;
  int promotion;
  int srcPiece;
  int targetPiece;
};

gameState gs;
int bestMove;

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

inline void forPawnAttacks(int n, vector<int>& attackSq){
  vector<int> pawnShift = {7, 9}; // attack, attack, single step, double step
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;

    for (int& pS: pawnShift){
      int des = pos+(gs.turn == 0? 1:-1)*pS;
      if (des < 0 || des > 63) continue;
      if (pS == 7 || pS  == 9){ // for diagonal check
        if (gs.turn == 0){
          if (pS == 7 && col == 0) continue;
          if (pS == 9 && col == 7) continue;
        } 
        else{
          if (pS == 7 && col == 7) continue;
          if (pS == 9 && col == 0) continue;
        }
        attackSq.push_back(des);
      }
    }
  });
}

inline void forKnightAttack(int n, vector<int>& attackSq){
  vector<pair<int, int>> knightShift = {{ 2,  1}, { 2, -1}, {-2,  1}, {-2, -1}, { 1,  2}, { 1, -2}, {-1,  2}, {-1, -2}};
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;
    
    for (auto& [kRS, kCS]: knightShift){
      int newRow = row + kRS;
      int newCol = col + kCS;
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) continue;
      
      int des = newRow * 8 + newCol;
      if (des < 0 || des > 63) continue;
      attackSq.push_back(des);
    }
  });
}

inline void forRookAttack(int n, vector<int>& attackSq){
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;
    vector<int> loopMax = {7-row, row, 7-col, col};
    vector<int> step = {8, -8, 1, -1};
    for (int j = 0; j <= 3; j++){
      for (int i = 1; i <= loopMax[j]; i++){
        int des = pos + step[j] * i;
        int tar = whatIsAt(des);
        attackSq.push_back(des);
        if (tar != 0) break;
      }
    } 
  });
}

inline void forBishopAttack(int n, vector<int>& attackSq){
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
        attackSq.push_back(des);
        if (tar != 0) break;
      }
    } 
  });
}

inline void forQueenAttacks(int n, vector<int>& attackSq){
  forRookAttack(n, attackSq);
  forBishopAttack(n, attackSq);
}

inline void forKingAttacks(int n, vector<int>& attackSq){
  vector<int> kingShift = {1, -1, 7, -7, 8, -8, 9, -9}; // attack, attack, single step, double step
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;
    
    for (int& pS: kingShift){
      int des = pos+pS;
      if (des < 0 || des > 63) continue;
      int newRow = des/8;
      int newCol = des%8;
      if (newRow != row && abs(row-newRow) != 1) continue;
      if (newCol != col && abs(col-newCol) != 1) continue;

      attackSq.push_back(des);
    }
  });
}

inline bool kingChecked(){
  int kingColor = 1 - gs.turn;
  vector<int> enemyAttackSq;
  int kingSq = -1;
  forEachBit(gs.bitBoards[kingColor][0], [&](int pos){
    kingSq = pos;
  });
  if (kingSq == -1) return 1;
  forPawnAttacks(5, enemyAttackSq);
  forKnightAttack(3, enemyAttackSq);
  forRookAttack(4, enemyAttackSq);
  forBishopAttack(2, enemyAttackSq);
  forQueenAttacks(1, enemyAttackSq);
  forKingAttacks(0, enemyAttackSq);
  return find(enemyAttackSq.begin(), enemyAttackSq.end(), kingSq) != enemyAttackSq.end();
}

inline void makeMove(Move& move){
  int sClr = move.srcPiece/10;
  int sPis = move.srcPiece%10 - 1;
  int tClr = move.targetPiece/10;
  int tPis = move.targetPiece%10 - 1;
  gs.bitBoards[sClr][sPis] = gs.bitBoards[sClr][sPis] & ~(1ULL << move.from);
  gs.bitBoards[sClr][sPis] = gs.bitBoards[sClr][sPis] | (1ULL << move.to);
  if (move.targetPiece != 0){
    gs.bitBoards[tClr][tPis] = gs.bitBoards[tClr][tPis] & ~(1ULL << move.to);
  }
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
  gs.turn = gs.turn == 0? 1: 0;
}

inline void simulateMoves(vector<Move>& moves) {
  vector<Move> legalMoves;
  for (auto& mv : moves) {
      makeMove(mv);
      bool illegal = kingChecked();
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

    for (int& pS: pawnShift){
      int des = pos+(gs.turn == 0? 1:-1)*pS;
      if (des < 0 || des > 63) continue;
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
        if (!tar) continue;
        if (gs.turn != (tar/10) && tar != 0) moves.push_back({pos, des, 0, whatIsAt(pos), tar});
      }
      else if (pS == 8){
        int tar = whatIsAt(des);
        if (!tar) moves.push_back({pos, des, 0, whatIsAt(pos), tar}); // for 1 step
        else continue;
        int nextDes = des+(gs.turn == 0? 1:-1)*8;
        if (nextDes < 0 || nextDes > 63) continue;
        if (!whatIsAt(nextDes) && ((row == 1 && !gs.turn) || (row == 6 && gs.turn))) moves.push_back({pos, nextDes, 0, whatIsAt(pos), tar}); // for 2 step
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

inline void forKing(int n, vector<Move>& moves){
  // for pawn
  vector<int> kingShift = {1, -1, 7, -7, 8, -8, 9, -9}; // attack, attack, single step, double step
  forEachBit(gs.bitBoards[gs.turn][n], [&](int pos){
    int row = pos/8; int col = pos%8;
    
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
  // forPawns(5, moves);
  // printf("After pawns: %zu\n", moves.size());

  // forKnights(3, moves);
  // printf("After knights: %zu\n", moves.size());

  // forRooks(4, moves);
  // printf("After rooks: %zu\n", moves.size());

  // forBishops(2, moves);
  // printf("After bishops: %zu\n", moves.size());

  // forQueen(1, moves);
  // printf("After queen: %zu\n", moves.size());

  // forKing(0, moves);
  // printf("After king: %zu\n", moves.size());
  return moves;
}

inline int materialAdv(){
  constexpr int PIECE_VALUES[6] = {0, 900, 330, 320, 500, 100}; // K Q B N R P
  int score = 0;
  for (int piece = 0; piece < 6; piece++){
    int whiteCount = std::popcount(gs.bitBoards[0][piece]); // counts no of bit 1 
    int blackCount = std::popcount(gs.bitBoards[1][piece]);
    score += (whiteCount - blackCount) * PIECE_VALUES[piece]; // from white's perspective
  }
  return gs.turn == 0 ? score : -score; // if white's turn then sending from white's perspective
}

int evaluate(){
  int ttlScore = 0;
  ttlScore += materialAdv();
  return ttlScore;
}

int negaMax(int alpha, int beta, int depth){
  vector<Move> moves = moveGenerator();
  int bestScore = -numeric_limits<int>::max();
  if (moves.empty()) {
    // if (kingChecked())
    //   return gs.depth - depth;
    return 0;
  }
  if (depth == 0) return evaluate();
  for (auto& move: moves){
    makeMove(move);
    int score = -negaMax(-beta, -alpha, depth - 1);
    unMakeMove(move);
    if (score > bestScore){
      bestScore = score;
      if (depth == gs.depth) bestMove = move.from * 100 + move.to;
    }
    alpha = max(alpha, score);
    if (alpha > beta) break; // pruned
  }
  return bestScore;
}


EXTERN // to prevent name mangling
EMSCRIPTEN_KEEPALIVE // when compiled to wasm to prevent striping the function since it is not called
int getBestMove(uint64_t wK, uint64_t wN, uint64_t wQ, uint64_t wR, uint64_t wB, uint64_t wP,
  uint64_t bK, uint64_t bN, uint64_t bQ, uint64_t bR, uint64_t bB, uint64_t bP, int color, int depth)
  {
    gs.bitBoards[0][0] = wK; gs.bitBoards[0][1] = wQ; gs.bitBoards[0][2] = wB; gs.bitBoards[0][3] = wN; gs.bitBoards[0][4] = wR; gs.bitBoards[0][5] = wP;
    gs.bitBoards[1][0] = bK; gs.bitBoards[1][1] = bQ; gs.bitBoards[1][2] = bB; gs.bitBoards[1][3] = bN; gs.bitBoards[1][4] = bR; gs.bitBoards[1][5] = bP;
    gs.color = color; // 0 white 1 black
    gs.turn = color;
    gs.depth = depth;

    int alpaBeta = numeric_limits<int>::max();
    int score = negaMax(-alpaBeta, alpaBeta ,gs.depth); // alpha(my best) beta(opp best) depth

    printf("The best move is: %d %d\n", bestMove/100, bestMove%100);
  return bestMove;
}