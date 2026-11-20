# Chess (https://chess.brishkamalkarki.com.np/)

A browser-based chess game with two modes:

- **Single player** against a C++ chess engine compiled to WebAssembly.
- **Multiplayer** over Socket.IO with room codes, optional clocks, draw offers, and resignation.

The board is rendered on an HTML canvas, and the game logic uses 64-bit bitboards.

## Features

- Legal move validation, including checks and pins
- Castling, en passant, and pawn promotion
- Checkmate, stalemate, threefold repetition, and insufficient-material detection
- Draw offers, resignation, and player-leave handling
- Bot search using negamax alpha-beta pruning, move ordering, quiescence search, and iterative deepening
- Multiplayer rooms with four-digit numeric room IDs
- Optional multiplayer 

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js
- **Chess engine:** JavaScript bitboards for game state and bot engine written in C++
- **Bot build:** Emscripten / WebAssembly

## Instructions

To play locally run all commands from the project root:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:8000
```


### How to Play

### Single Player
---
1. Open the home page.
2. Select **Single Player**.
3. Choose your side.
4. Start the game.

### Multiplayer
---
1. Select **Multiplayer**.
2. Create a room with a four-digit numeric ID, or join an existing room.
3. The host selects the playing color and optional game time.
4. Share the room ID with the second player.
5. The game starts when both players have joined.

## Project Structure

```text
./backend

      ./chess
      
            ./engine
              movesValidator.js
              updateState.js

            gameState.js
            timer.js
      
      ./socket
        configEvents.js
        gameEvents.js
        roomEvents.js
        socket.js
      
      ./utils
        games.js
        getMimeTypes.js
        rooms.js

      server.js

./frontend

      ./bot
        bot.js
        bot.wasm
        botWorker.js
        main.cpp

      ./js
          
            ./chessBoard
              board.js
              gameState.js
              gameVars.js
              resourceLoader.js

            ./dom
              arena.js
              index.js
              multiplayer.js
              setting.js
              winner.js

            ./engine
              movesValidator.js

            ./socket
              socket.js

            ./utils
              navigator.js

      ./pages
        404.html
        arena.html
        mPgameConfig.html
        msPL.html
        sPgameConfig.html
        winner.html

      ./styles
        404.css
        arena.css
        gameConfig.css
        index.css
        msPL.css
        winner.css

      ./assets

            ./images
              bg.jpg
              bg1.jpg

                  ./pieces
                    bB.png
                    bK.png
                    bN.png
                    bP.png
                    bQ.png
                    bR.png
                    LICENSE
                    README.md
                    wB.png
                    wK.png
                    wN.png
                    wP.png
                    wQ.png
                    wR.png

      index.html

.gitignore
package.json
package-lock.json
readme.md
wasmComp.sh
        
      

  


```

## Board Representation

- Squares are numbered `0..63` from `a1` to `h8`:
- JavaScript uses `BigInt` bitboards.
- The C++ bot uses `uint64_t` bitboards.

## Bot Build

To rebuild the WebAssembly bot after editing `frontend/bot/main.cpp`:

```bash
./wasmComp.sh
```

The script sources `~/emsdk/emsdk_env.sh`, so Emscripten must be installed there.

## Bot Techniques

- NegaMax with alpha bets prunning
- Transposition Table
- Iterative Deepening
- Quiescence Search

#### Bot Stat
(65K - 82K) NPS