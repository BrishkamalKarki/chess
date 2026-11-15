import {rooms} from "../utils/rooms.js";

export class Timer{
  constructor(gameState, socket, io){
    this.gameState = gameState;
    this.room = rooms.get(gameState.id);
    this.gameState = gameState;
    this.gameTime = this.room.gameTime;
    this.timerOn = this.room.timerOn;
  }

  startTimer(){
    this.whiteMin = this.gameTime - 1;
    this.whiteSec = 59;

    this.blackMin = this.gameTime - 1;
    this.blackSec = 59;

    if (this.timerOn == 'true'){
      setInterval(()=>{
        if (this.gameState.turn == 'white'){
          if (!this.gameState.timeOutWhite){
            this.whiteSec -= 1;
            if (this.whiteSec == -1){
              this.whiteMin -= 1;
              if (this.whiteMin == 0){
                this.whiteSec = 0;
                this.gameState.timeOutWhite = true;
                this.io.sockets.in(this.room.id).emit('timeOut', 'black');
              }
              this.whiteSec = 59;
            }
          }
        }
      }, 1000);
    }

    if (this.timerOn == 'true'){
      setInterval(()=>{
        if (this.gameState.turn == 'black'){
          if (!this.gameState.timeOutBlack){
            this.blackSec -= 1;
            if (this.blackSec == -1){
              this.blackMin -= 1;
              if (this.blackMin == 0){
                this.blackSec = 0;
                this.gameState.timeOutBlack = true;
                this.io.sockets.in(this.room.id).emit('timeOut', 'white');
              } 
              this.blackSec = 59;
            }
          }
        }
      }, 1000);
    }
  }

  getTime(){
    return {
      'white': {min: this.whiteMin, sec: this.whiteSec},
      'black': {min: this.blackMin, sec: this.blackSec}
    }
  }
}