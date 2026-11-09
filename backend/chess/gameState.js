import { registerRoomEvents } from "../socket/roomEvents.js";

  class GameState{
    constructor(id){
      this.id = id;
      this.FULL_BOARD = (1n << 64n) - 1n;

      this.BLACK_SQS = 0b1010101001010101101010100101010110101010010101011010101001010101n; // starting from 1-rank a-file
      this.BLACK_PAWNS = 0b0000000011111111000000000000000000000000000000000000000000000000n;
      this.BLACK_ROOKS = 0b1000000100000000000000000000000000000000000000000000000000000000n;
      this.BLACK_KNIGHTS = 0b0100001000000000000000000000000000000000000000000000000000000000n;
      this.BLACK_BISHOPS = 0b0010010000000000000000000000000000000000000000000000000000000000n;
      this.BLACK_QUEEN = 1n << 59n;
      this.BLACK_KING = this.BLACK_QUEEN << 1n;
      this.BLACK_PLACEMENTS = this.BLACK_BISHOPS | this.BLACK_KING | this.BLACK_KNIGHTS | this.BLACK_PAWNS | this.BLACK_QUEEN | this.BLACK_ROOKS;
      this.BLACK_BB = [this.BLACK_KING, this.BLACK_PAWNS, this.BLACK_ROOKS, this.BLACK_KNIGHTS, this.BLACK_BISHOPS, this.BLACK_QUEEN]
      
      this.WHITE_SQS = this.FULL_BOARD ^ this.BLACK_SQS; // starting from 1-rank a-file
      this.WHITE_PAWNS = this.BLACK_PAWNS >> 40n;
      this.WHITE_ROOKS = this.BLACK_ROOKS >> 56n;
      this.WHITE_KNIGHTS = this.BLACK_KNIGHTS >> 56n;
      this.WHITE_BISHOPS = this.BLACK_BISHOPS >> 56n;
      this.WHITE_QUEEN = this.BLACK_QUEEN >> 56n;
      this.WHITE_KING = this.BLACK_KING >> 56n;
      this.WHITE_PLACEMENTS = this.BLACK_PLACEMENTS >> 48n;

      this.WHITE_BB = [this.WHITE_KING, this.WHITE_PAWNS, this.WHITE_ROOKS, this.WHITE_KNIGHTS, this.WHITE_BISHOPS, this.WHITE_QUEEN]

      this.CLICKED = 0b0n;
      this.BLACK_WHITE = this.BLACK_PLACEMENTS | this.WHITE_PLACEMENTS;

      this.turn = 'white';
      this.timeOutWhite = false;
      this.timeOutBlack = false;
    }
  }

  export default GameState;