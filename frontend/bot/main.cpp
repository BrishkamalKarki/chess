#include <iostream>
#include <cstdint>
#include <emscripten.h>

#define EXTERN extern "C" 

using namespace std;

EXTERN // to prevent name mangling
EMSCRIPTEN_KEEPALIVE // when compiled to wasm to prevent striping the function since it is not called
// int getBestMove(uint64_t wP, uint64_t wB, uint64_t wN, uint64_t wR, uint64_t wQ, uint64_t wK,
//       uint64_t bP, uint64_t bB, uint64_t bN, uint64_t bR, uint64_t bQ, uint64_t bK,){
int getBestMove(){
  return 234;
}

