#!/bin/bash

emcc ./frontend/bot/main.cpp \
  -O3 \
  -o ./frontend/bot/bot.js \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_getBestMove"]' \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'

# file to be compiled, aggressive optimization level, output file name, configure to make wasm file i.e 1 and 0 to not create
# ccall to call the function immedietly and cwrap to make reusable wrapper