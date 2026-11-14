import GameState from './gameState.js'
import {getChessPieces} from './resourceLoader.js'
import socket from '../socket/socket.js';
import {getGameVars} from './gameVars.js'
import {validateMoveAt, checkCastleUtils, isPromoted, getPoint, checkCheckMate, checkStaleMate} from '../engine/movesValidator.js'
import navigateTo, {pagesRoutes} from '../utils/navigator.js'

const canvas = document.getElementById("chessBoard");
const ctx = canvas.getContext('2d');
// default canvas width and height is 300 and 150 which is way smaller than the px height of the viewport canvas set in css property
// thus it stretches the small rectangular board, pxCanvas is calculated so that the box sides donot overlap into a same pixel to remove blending
// by making the pixel int, devicePixelRatio is physical pixel / css pixel ratio
const pxCanvas = Math.floor((canvas.clientWidth * (window.devicePixelRatio || 1) / 8)) * 8;
canvas.height = pxCanvas;
canvas.width = pxCanvas;


let mouseClicked = false;
let mouseCoord = []; // keeping track of mouse coord
let clickedSrc = null;
let clickedDes = null;
let animationOn = false;
const gameVars = await getGameVars();
const {gameMode, playedAs, timerOn, botDiff, gameTime, roomCreateId, roomJoinId, userId, timeOutOpp, timeOutMine, room} = gameVars;
let turn = 'white';
console.log(gameMode, playedAs, timerOn, botDiff, gameTime, roomCreateId || roomJoinId, userId, room)


let whiteMin, blackMin, whiteSec, blackSec, whiteTimeOut = false, blackTimeOut = false, st = false, sT;
socket.on('start time', (serverTime)=>{
  sT = serverTime;
  st = true;
});

if (room != null){
  whiteMin = room.gameTime - 1;
  whiteSec = 60;
  if (room.timerOn){
    setInterval(()=>{
      if (!whiteTimeOut && room.turn == 'white' && st){
        whiteSec -= 1;
        if (whiteSec == 0){
          if (whiteMin == 0) whiteTimeOut = true;
          else{
            whiteMin -= 1;
            whiteSec = 59;
          }
        }
      }
      if (playedAs == 'white')
        document.getElementById("youTime").textContent = `${whiteMin}:${whiteSec}`;
      else
        document.getElementById("oppTime").textContent = `${whiteMin}:${whiteSec}`;
    }, 1000);
  }

  blackMin = room.gameTime - 1;
  blackSec = 60;
  if (room.timerOn){
    setInterval(()=>{
      if (!blackTimeOut && room.turn == 'black' && st){
        blackSec -= 1;
        if (blackSec == 0){
          if (blackMin == 0) blackTimeOut = true;
          else{
            blackMin -= 1;
            blackSec = 59;
          }
        }
      }
      if (playedAs == 'black')
        document.getElementById("youTime").textContent = `${blackMin}:${blackSec}`;
      else
        document.getElementById("oppTime").textContent = `${blackMin}:${blackSec}`;
    }, 1000);
  }
}

class ChessBoard{
  constructor(){
    this.whiteHex = '#77b8b2';
    this.blackHex = '#1e5754';
  }

  getMesurements(){ 
    const boardSize = canvas.height;
    this.sqSize = boardSize/8;
    this.iniSqCord = this.sqSize/2; // 1st square center (x=y)
    this.sqCtrCoords = []; // storing the center coordinates of squares
    this.sqStCords = []; // storing the top left coordinates of squares
    for (let row = 0; row < 8; row++){
      for (let col = 0; col < 8; col++){
        this.sqCtrCoords.push([col*this.sqSize + this.iniSqCord, row*this.sqSize + this.iniSqCord]);
        this.sqStCords.push([col*this.sqSize, row*this.sqSize]);
      }
    }

    this.ranksCoords = {}; // storing the coords to write the ranks (1, 2, 3, ....)
    for (let rank = 1; rank <= 8; rank++){
      this.ranksCoords[`${playedAs == 'white'? (9-rank): rank}`] = [5, 5 + (rank-1) * this.sqSize];
    }

    this.filesCoords = {}; // storing the coords to write the files (a, b, c, ....)
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let file = 1; file <= 8; file++){
      this.filesCoords[`${playedAs == 'white'? files[file-1]: files[9-file-1]}`] = [file * this.sqSize - 15,(8*this.sqSize) - 5];
    }
  };
  
  draw(){
    // drawing the squares first
    let sqClrHex =  this.whiteHex; // top left square is white
    let coord = 0;
    for (const coords of this.sqStCords){
      ctx.fillStyle = `${sqClrHex}`;
      ctx.fillRect(coords[0], coords[1], this.sqSize, this.sqSize);
      sqClrHex = sqClrHex == `${this.blackHex}` ? this.whiteHex : this.blackHex;
      coord++;
      if (coord%8 == 0){
        sqClrHex = sqClrHex == `${this.blackHex}` ? this.whiteHex : this.blackHex; // toggling the color again on each new ranks
      }
    }

    // drawing the ranks
    ctx.font = "bold 18px serif";
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';
    for (const [key, values] of Object.entries(this.ranksCoords)){
      ctx.fillText(key, values[0], values[1]);
    }

    //drawing the files
    ctx.textBaseline = 'bottom';
    for (const [key, values] of Object.entries(this.filesCoords)){
      ctx.fillText(key, values[0], values[1]);
    }
  };
};

class ChessPieces{
  constructor(board){  
    this.board = board;
    this.chessPieces = pieceImg;
    this.updatePieceToBB();

    this.squares = []; // storing the rects info of each square - along with their number starting 0 for rank-1 file-a

    this.sqStCordsCp = this.board.sqStCords; 
    let sqNo = 0;
    if (playedAs == 'white'){
      for (let row = 7; row >= 0; row--){
        for (let col = 0; col <= 7; col++){
          const sq = new Square(this.sqStCordsCp[row*8+col][0], this.sqStCordsCp[row*8+col][1], board.sqSize, board.sqSize, sqNo++, row*8+col);
          this.squares.push(sq);
        }
      }
    }
    else{
      for (let row = 0; row <= 7; row++){
        for (let col = 7; col >= 0; col--){
          const sq = new Square(this.sqStCordsCp[row*8+col][0], this.sqStCordsCp[row*8+col][1], board.sqSize, board.sqSize, sqNo++, row*8+col);
          this.squares.push(sq); 
        }
      }
    }
    if (playedAs == 'white') this.squares.reverse();
  }
  updatePieceToBB(){
    this.pieceToBitBoard = { // mapping the pieces names with their respective bitmaps to finish the work in only single loop while drawing
      'wR': gameState.WHITE_ROOKS, 'wN': gameState.WHITE_KNIGHTS, 'wB': gameState.WHITE_BISHOPS,
      'wK': gameState.WHITE_KING, 'wQ': gameState.WHITE_QUEEN, 'wP': gameState.WHITE_PAWNS,
      'bR': gameState.BLACK_ROOKS, 'bN': gameState.BLACK_KNIGHTS, 'bB': gameState.BLACK_BISHOPS,
      'bK': gameState.BLACK_KING, 'bQ': gameState.BLACK_QUEEN, 'bP': gameState.BLACK_PAWNS,
    }
  }

  getIndex(i){
    let row = Math.floor(i/8);
    let col = i - row * 8;
    if (playedAs == 'black') return (row*8+(7-col));
    else return ((7-row)*8+col);
  }

  drawAllPieces(){
    let mvImg = null; // image moving
    for (const [key, value] of Object.entries(this.chessPieces)){
      let bitBoardCpy = this.pieceToBitBoard[key];
      for (let i = 0; i < 64; i++){
        if (!((bitBoardCpy >> BigInt(i)) & 1n)) continue;
        // shifting the bitboard with 0 - 63 and checking if 0th bit after shifiting is 1, if 1 then there is piece
        if ((bitBoardCpy >> BigInt(i)) & 1n){ 
          if (srcX !== null){ // for moving the piece
            let x = board.sqStCords[this.getIndex(i)][0];
            let y = board.sqStCords[this.getIndex(i)][1];
            if (x == srcX && y == srcY){
              mvImg = value;
              continue;
            }
          }
          ctx.drawImage(value, board.sqStCords[this.getIndex(i)][0], board.sqStCords[this.getIndex(i)][1], canvas.width/8, canvas.width/8);
        }
      }
    }
    if (mvImg) ctx.drawImage(mvImg, mX, mY, canvas.width/8, canvas.width/8);
  }

  updateSquaresInfo(){
    for (const sq of this.squares)
      sq.updateInfo();
  }
};

class Square{
  constructor(x, y, w, h, sqNo, sqNoFromTopLeft){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.sqNo = sqNo;
    this.containsPiece = false;
    this.pieceClr = '';
    this.sqNoFromTopLeft = sqNoFromTopLeft;
  }

  contains(x, y){
    if ((x >= this.x && (x <= this.x + this.w)) && (y >= this.y && (y <= this.y + this.h)))
      return true;
    return false;
  }

  drawBorder(width, color, clearBorder, redrawBorder){
    if (redrawBorder){ // when src is reselected
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      board.draw();
      chessPieces.drawAllPieces();
    }
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.w, this.y);
    ctx.lineTo(this.x + this.w, this.y + this.h);
    ctx.lineTo(this.x, this.y + this.h);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    console.log(clickedSrc, clickedDes, ` are src and destination `);
    if (clearBorder){ // when des is selected
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      board.draw();
      chessPieces.drawAllPieces();
    }
  }

  updateInfo(){
    this.containsPiece = false;
    this.pieceClr = '';

    let blackWHiteCpy = gameState.BLACK_WHITE;
    if ((blackWHiteCpy >> BigInt(this.sqNo)) & 1n){
      this.containsPiece = true;
    }
    let blackCpy = gameState.BLACK_PLACEMENTS;
    if ((blackCpy >> BigInt(this.sqNo)) & 1n){
      this.pieceClr = 'black';
    }
    let whiteCpy = gameState.WHITE_PLACEMENTS;
    if ((whiteCpy >> BigInt(this.sqNo)) & 1n){
      this.pieceClr = 'white';
    }
  }
};

// when the user clicks a piece
let possibleSqs = [];
canvas.addEventListener('pointerdown', async (event)=>{
  if (turn != playedAs) return;
  if (animationOn) return;
  if (promoting) return;
  mouseClicked = true;
  const rect = canvas.getBoundingClientRect();
  chessPieces.updateSquaresInfo();
  for (const sq of chessPieces.squares){
    if (sq.contains((event.clientX - rect.left) * canvas.width  / rect.width, (event.clientY - rect.top)* canvas.height / rect.height)){
      if (clickedSrc != null && (playedAs != sq.pieceClr)){
          clickedDes = sq.sqNo;
          sq.drawBorder(2, 'yellow', true, false);
          break;
      }

      if (playedAs == sq.pieceClr){
        console.log(' i got in here')
        if (room != null){
          if (turn != playedAs) return;
        }
        clickedSrc = sq.sqNo;
        sq.drawBorder(2, 'yellow', false, true);
        possibleSqs = validateMoveAt(clickedSrc, gameState, turn);
        for (const sq of chessPieces.squares){  
          for (const pos of possibleSqs){
            if (sq.sqNo == pos)
              sq.drawBorder(2, 'yellow', false, false);
          }
        }
        break;
      }
    }
  }
  if (clickedDes != null && clickedSrc != null){
    if (room != null){ // if online then ask for the server for the valid moves
      const resp = await socket.timeout(2000).emitWithAck('apply move', room.id, userId, clickedSrc, clickedDes);
      if (!resp.success){
        console.log('invalid move');
        clickedDes = null;
        clickedSrc = null;
      }
    }
    else{
      console.log(gameState.whiteCastled, gameState.whiteKRookMoved, gameState.whiteQRookMoved, ' are white castled k rook and q  rook moved')
      console.log(((getCp(gameState.WHITE_KING) >> BigInt(clickedSrc)) & 1n) , Math.abs(clickedDes - clickedSrc), clickedDes, clickedSrc , turn,gameState.WHITE_KING)
      // checkCastleUtils(turn, clickedSrc);
      const point = getPoint(clickedDes);
      if (point != 0){
        document.getElementById('youPoint').textContent = Number(document.getElementById('youPoint').textContent) + point;
      }
      if (possibleSqs.includes(clickedDes)){
        movePiece();
        possibleSqs.clear();
      }
      // turn = turn == 'white' ? 'black' : 'white';
    }
  }
});

socket.on('castle', (resp)=>{
  if (isPiece(gameState.WHITE_ROOKS, resp.src) || isPiece(gameState.BLACK_ROOKS, resp.src)) {
    updateBitAfterMove(resp.src, resp.des);
  }
  chessPieces.updateSquaresInfo();
  chessPieces.updatePieceToBB();
  board.draw();
  chessPieces.drawAllPieces();
});

canvas.addEventListener('pointerup', (event)=>{
  mouseClicked = false;
});

canvas.addEventListener('pointermove', (event)=>{
  mouseCoord.length = 0;
  const rect = canvas.getBoundingClientRect();
  mouseCoord.push(event.clientX - rect.left);
  mouseCoord.push(event.clientY - rect.top);
});

function getCp(org){ // copy getter (for non-object)
  let cp = org;
  return cp;
}

function replaceBit(of, at, by){
  if (by)
    return ((of | (BigInt(1) << BigInt(at))));
  else 
    return ((of & ~(BigInt(1) << BigInt(at))));
}

function isPiece(of, at){
  return ((getCp(of) >> BigInt(at)) & 1n);
}

function updateBitAfterMove(src, des){
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

let promoting = false; 
function animate(timestamp){ // animating the piece move
  if (frame >= 10){
    // updating the bitboards
    updateBitAfterMove(clickedSrc, clickedDes);
    console.log('king moved from ', clickedSrc, ' ', clickedDes)
    chessPieces.updateSquaresInfo();
    chessPieces.updatePieceToBB();
    // reseting the variables
    console.log(" the tun is the turn of ", turn);
    disX = disY = mX = mY = srcX = srcY = desX = desY = null;
    frame = 0;
    // redrawing canvas
    board.draw();
    chessPieces.drawAllPieces();
    animationOn = false;
    const promoted = isPromoted(clickedSrc, clickedDes, gameState);
    if (promoted && room == null){
      promoteFunc();
    }
    else{
      if (((getCp(gameState.WHITE_KING) >> BigInt(clickedDes)) & 1n) && Math.abs(clickedDes - clickedSrc) == 2 && turn == 'white' && !gameState.whiteCastled && !gameState.whiteKMoved){ 
        console.log('karna raj akri')
        gameState.justCastled = false;
        gameState.whiteCastled = true;
        console.log(clickedDes, ' is the clicked des ')
        if (clickedDes == 2 && !gameState.whiteQRookMoved){
          console.log('white queen side move')
          if (isPiece(gameState.WHITE_ROOKS, 0)) updateBitAfterMove(0, 3);
          gameState.whiteQRookMoved = true;
        }
        else if (!gameState.whiteKRookMoved && clickedDes == 6){
          console.log('white king side move')
          if (isPiece(gameState.WHITE_ROOKS, 7)) updateBitAfterMove(7, 5);
          gameState.whiteKRookMoved = true;
        }
        chessPieces.updateSquaresInfo();
        chessPieces.updatePieceToBB();
        board.draw();
        chessPieces.drawAllPieces();
      }
      else if (((getCp(gameState.BLACK_KING) >> BigInt(clickedDes)) & 1n) && Math.abs(clickedDes - clickedSrc) == 2 && turn == 'black' && !gameState.blackCastled && !gameState.blackKMoved){
        gameState.justCastled = false;
        gameState.blackCastled = true;
        if (clickedDes == 58 && !gameState.blackQRookMoved){
          console.log('black queen side move')
          if (isPiece(gameState.BLACK_ROOKS, 56)) updateBitAfterMove(56, 59);
          gameState.blackQRookMoved = true;
        }
        else if (!gameState.blackKRookMoved && clickedDes == 62){
          console.log('black king side move')
          if (isPiece(gameState.BLACK_ROOKS, 63)) updateBitAfterMove(63, 61);
          gameState.blackKRookMoved = true;
        }
        chessPieces.updateSquaresInfo();
        chessPieces.updatePieceToBB();
        board.draw();
        chessPieces.drawAllPieces();
      }
    }
    checkCastleUtils(turn, clickedSrc, clickedDes);
    if (!promoting)
    turn = turn == 'white' ? 'black' : 'white';

    // after making the move fully and flipping hte turn
    if (checkCheckMate(gameState, turn)){
      sessionStorage.setItem('turn', turn == 'white'? 'black': 'white');
      sessionStorage.setItem('by', 'CheckMate');
      navigateTo(pagesRoutes.winner);
    }
    
    if (checkStaleMate(gameState, turn)){
      sessionStorage.setItem('turn', 'nobody');
      sessionStorage.setItem('by', 'StaleMate');
      navigateTo(pagesRoutes.winner);
    }
    clickedDes = null;
    clickedSrc = null;
    chessPieces.updateSquaresInfo();
    chessPieces.updatePieceToBB();
    return;
  }
  mX = srcX + disX * frame / 10;
  mY = srcY + disY * frame / 10;
  board.draw();
  chessPieces.drawAllPieces();
  frame++;
  requestAnimationFrame(animate);
};

let disX, disY, mX, mY;
let srcX = null, srcY = null, desX, desY, frame;
function movePiece(){ // calculating things for the animation
  animationOn = true;
  for (const sq of chessPieces.squares){
    if (clickedSrc == sq.sqNo){
      srcX = sq.x;
      srcY = sq.y;
    }
    if (clickedDes == sq.sqNo){
      desX = sq.x;
      desY = sq.y;
    }
  }
  disX = desX - srcX;
  disY = desY - srcY;
  frame = 0;
  mX = srcX;
  mY = srcY;
  animate();
}

socket.on('apply move', (src, des)=>{
  clickedDes = des;
  clickedSrc = src;
  movePiece();
})

socket.on('checkmate', (looser)=>{
  sessionStorage.setItem('turn', looser == 'white'? 'black': 'white');
  sessionStorage.setItem('by', 'CheckMate');
  navigateTo(pagesRoutes.winner);
})

socket.on('stalemate', (looser)=>{
  sessionStorage.setItem('turn', 'nobody');
  sessionStorage.setItem('by', 'StaleMate');
  navigateTo(pagesRoutes.winner);
})

document.getElementById('resign')?.addEventListener('click', ()=>{
  if (room != null)
    socket.emit('resignation', playedAs, room.id);
});

document.getElementById('draw')?.addEventListener('click', ()=>{
  if (room != null)
    socket.emit('draw', playedAs, room.id);
});

let drawShown = false;
socket.on('draw', (color)=>{
  if (document.getElementById('drawContainer')) return;
  drawShown = true;
  const drawEl = document.getElementById('gameOptions');
  const drawContainer = document.createElement('div');
  drawContainer.id = 'drawContainer';
  const p = document.createElement('p');
  p.textContent = 'OPONENT SENT DRAW REQUEST';
  Object.assign(drawContainer.style, {
    display: 'flex',
    flexDirection: 'column',
    color: '#ffb700',
  })
  const subContainer = document.createElement('div');
  subContainer.id = 'sC';
  drawContainer.style.textAlign = 'center';
  Object.assign(subContainer.style, {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    textAlign: 'center',
  })
  p.style = {
    color: 'white',
    font: '600 25px \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif',
    fontWeight: 'bold',
    fontWeight: 'bold',
  }
  const draw = document.createElement('button');
  const nope = document.createElement('button');
  draw.textContent = 'Draw',
  Object.assign(draw.style, {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #5b6a66',
    background: 'transparent',
    color: '#06b6ec',
    font: '600 30px \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color .15s, border-color .15s, background-color .15s, transform .15s'
  })
  draw.id = 'drawAccpt';
  Object.assign(nope.style, {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #5b6a66',
    background: 'transparent',
    color: '#dd00ff',
    font: '600 30px \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif',
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color .15s, border-color .15s, background-color .15s, transform .15s',
  })
  nope.id = 'drawRjct';
  nope.textContent = 'Nope',
  
  subContainer.appendChild(draw);
  subContainer.appendChild(nope);
  drawContainer.appendChild(p);
  drawContainer.appendChild(subContainer);
  drawEl.appendChild(drawContainer);
  document.getElementById('drawAccpt').addEventListener('click', ()=>{
    console.log('clicked the  draw button')
    socket.emit('accept draw', playedAs, room.id);
  })
  
  document.getElementById('drawRjct').addEventListener('click', ()=>{
    socket.emit('reject draw', playedAs, room.id);
  })
  draw.addEventListener('mouseenter', () => {
    draw.style.backgroundColor = '#5b6a66';
    draw.style.transform = 'scale(1.05)';
  });

  draw.addEventListener('mouseleave', () => {
    draw.style.backgroundColor = 'transparent';
    draw.style.transform = 'scale(1)';
  });

  nope.addEventListener('mouseenter', () => {
    nope.style.backgroundColor = '#5b6a66';
    nope.style.transform = 'scale(1.05)';
  });

  nope.addEventListener('mouseleave', () => {
    nope.style.backgroundColor = 'transparent';
    nope.style.transform = 'scale(1)';
  });
});

socket.on('draw accpt from server', ()=>{
  drawShown = false;
  const drawContainer = document.getElementById('drawContainer');
  if (drawContainer) drawContainer.remove();
  sessionStorage.setItem('turn', 'NOBODY');
  sessionStorage.setItem('by', 'Draw');
  navigateTo(pagesRoutes.winner);
})

if (room== null){
  const drawEl = document.getElementById('draw');
  drawEl.remove();
  document.getElementById('resign').addEventListener('click', ()=>{
    sessionStorage.setItem('turn', 'BOT');
    sessionStorage.setItem('by', 'resignation');
    navigateTo(pagesRoutes.winner);
  })
}

document.getElementById('backToMenu').addEventListener('click', ()=>{
  socket.emit('i am out', playedAs, room.id);
  navigateTo(pagesRoutes.home);
})

socket.on('draw rjct from server', ()=>{
  drawShown = false;
  const drawContainer = document.getElementById('drawContainer');
  if (drawContainer) drawContainer.remove();
})

socket.on('player left', (color)=>{
  if (color != playedAs) return;
  sessionStorage.setItem('turn', color);
  sessionStorage.setItem('by', 'opponent left');
  navigateTo(pagesRoutes.winner);   
})

socket.on('resign from server', (color, success)=>{
  if (success){
    sessionStorage.setItem('turn', color);
    sessionStorage.setItem('by', 'resignation');
    navigateTo(pagesRoutes.winner);
  }
});

socket.on('promote', (t, des)=>{
  clickedDes = des; 
  turn = t; 
  promoteFunc(); 
});

socket.on('promote for opp', (t, promoDes, piece)=>{
  if (playedAs == t) return;
  console.log('opp promoted the peice')
  if (t == 'white'){
    if (piece == 'B')
      gameState.WHITE_BISHOPS = replaceBit(getCp(gameState.WHITE_BISHOPS), promoDes, 1);
    else if (piece == 'R')
      gameState.WHITE_ROOKS = replaceBit(getCp(gameState.WHITE_ROOKS), promoDes, 1);
    else if (piece == 'Q')
      gameState.WHITE_QUEEN = replaceBit(getCp(gameState.WHITE_QUEEN), promoDes, 1);
    else if (piece == 'N')
      gameState.WHITE_KNIGHTS = replaceBit(getCp(gameState.WHITE_KNIGHTS), promoDes, 1);
    gameState.WHITE_PAWNS = replaceBit(getCp(gameState.WHITE_PAWNS), promoDes, 0);
  }
  else if (t == 'black'){
    if (piece == 'B')
      gameState.BLACK_BISHOPS = replaceBit(getCp(gameState.BLACK_BISHOPS), promoDes, 1);
    else if (piece == 'R')
      gameState.BLACK_ROOKS = replaceBit(getCp(gameState.BLACK_ROOKS), promoDes, 1);
    else if (piece == 'Q')
      gameState.BLACK_QUEEN = replaceBit(getCp(gameState.BLACK_QUEEN), promoDes, 1);
    else if (piece == 'N')
      gameState.BLACK_KNIGHTS = replaceBit(getCp(gameState.BLACK_KNIGHTS), promoDes, 1);
    gameState.BLACK_PAWNS = replaceBit(getCp(gameState.BLACK_PAWNS), promoDes, 0);
  }

  chessPieces.updateSquaresInfo();
  chessPieces.updatePieceToBB();
  board.draw();
  chessPieces.drawAllPieces();
});

function promoteFunc(){
  promoting = true;
  const promotionOptEl = document.getElementById('promotionOption');
  Object.assign(promotionOptEl.style,{
    display: 'flex',
    flexDirection: 'row',
    gap: '10px',
    alignItems: 'center'
  })
  
  const divEl = document.createElement('div');
  divEl.id = 'c';

  Object.assign(divEl.style,{
    display: 'flex',
    flexDirection: 'row',
    gap: '10px',
    alignItems: 'center'
  })
  const buttons = ['Q', 'R', 'B', 'N'].map(piece => {
    const button = document.createElement('button');
    button.textContent = piece;
    
    Object.assign(button.style, {
      width: '40px',
      height: '40px',
      backgroundColor: 'transparent',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '5px',
      border: '1px solid #d3b77a',
      fontWeight: 'bold'
    });

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'transparent';
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
      button.style.transform = 'scale(1)';
    });
    
    const promoDes = clickedDes;
    button.addEventListener('click', () => {
      button.style.backgroundColor = 'transparent';
      button.style.transform = 'scale(0.95)';
      console.log(" the turn is the color of ", turn);
      let clicked = button.textContent;
      if (turn == 'white'){
        if (button.textContent == 'B')
          gameState.WHITE_BISHOPS = replaceBit(getCp(gameState.WHITE_BISHOPS), promoDes, 1);
        else if (button.textContent == 'R')
          gameState.WHITE_ROOKS = replaceBit(getCp(gameState.WHITE_ROOKS), promoDes, 1);
        else if (button.textContent == 'Q')
          gameState.WHITE_QUEEN = replaceBit(getCp(gameState.WHITE_QUEEN), promoDes, 1);
        else if (button.textContent == 'N')
          gameState.WHITE_KNIGHTS = replaceBit(getCp(gameState.WHITE_KNIGHTS), promoDes, 1);
        gameState.WHITE_PAWNS = replaceBit(getCp(gameState.WHITE_PAWNS), promoDes, 0);
      }
      else if (turn == 'black'){
        if (button.textContent == 'B')
          gameState.BLACK_BISHOPS = replaceBit(getCp(gameState.BLACK_BISHOPS), promoDes, 1);
        else if (button.textContent == 'R')
          gameState.BLACK_ROOKS = replaceBit(getCp(gameState.BLACK_ROOKS), promoDes, 1);
        else if (button.textContent == 'Q')
          gameState.BLACK_QUEEN = replaceBit(getCp(gameState.BLACK_QUEEN), promoDes, 1);
        else if (button.textContent == 'N')
          gameState.BLACK_KNIGHTS = replaceBit(getCp(gameState.BLACK_KNIGHTS), promoDes, 1);
        gameState.BLACK_PAWNS = replaceBit(getCp(gameState.BLACK_PAWNS), promoDes, 0);
      }
      
      socket.emit('promote option', room.id, playedAs, promoDes, clicked);

      gameState.BLACK_PLACEMENTS = gameState.BLACK_BISHOPS | gameState.BLACK_KING | gameState.BLACK_KNIGHTS | gameState.BLACK_PAWNS | gameState.BLACK_QUEEN | gameState.BLACK_ROOKS;
      gameState.WHITE_PLACEMENTS = gameState.WHITE_BISHOPS | gameState.WHITE_KING | gameState.WHITE_KNIGHTS | gameState.WHITE_PAWNS | gameState.WHITE_QUEEN | gameState.WHITE_ROOKS;
      gameState.BLACK_WHITE = gameState.WHITE_PLACEMENTS | gameState.BLACK_PLACEMENTS;
      const c = document.getElementById('c');
      c.remove();
      console.log((getCp(gameState.WHITE_KNIGHTS) >> BigInt(promoDes)) & 1n , gameState.WHITE_KNIGHTS>>BigInt(55), turn, ' is drawn hahahahahhahahhahahhahahhahahahahahahhaha')
      
      chessPieces.updatePieceToBB();
      board.draw();
      chessPieces.drawAllPieces();

      promoting = false;
      turn = turn == 'white'? 'black': 'white';
    });
    return button;
  });
  const [Q, R, B, N] = buttons;
  divEl.append(Q, R, B, N);
  promotionOptEl.appendChild(divEl);

  if (room != null){
    chessPieces.updateSquaresInfo();
    chessPieces.updatePieceToBB();
    board.draw();
    chessPieces.drawAllPieces();
  }
}

const pieceImg = await getChessPieces();
const gameState = new GameState();
const board = new ChessBoard();
board.getMesurements();
board.draw();
const chessPieces = new ChessPieces(board);
chessPieces.drawAllPieces();

export {gameVars};