import {rooms} from "../utils/rooms.js";

export class Timer{
  constructor(id, gameState, io){
    this.gameState = gameState;
    this.wS = false;
    this.bS = false;
    this.io = io;
    this.room = rooms.get(id);
    this.gameTime = this.room.gameTime;
    this.timerOn = this.room.timerOn;
     this.whiteInterval = null;
    this.blackInterval = null;
  }

  startTimer(){
    this.stopTimer();
    this.whiteMin = this.gameTime - 1;
    this.whiteSec = 59;

    this.blackMin = this.gameTime - 1;
    this.blackSec = 59;

    if (this.timerOn){
       this.whiteInterval = setInterval(()=>{
        if (this.room.turn == 'white'){
          if (!this.gameState.timeOutWhite){
            this.whiteSec -= 1;
            if (this.whiteSec % 5 == 0){
              this.io.sockets.in(this.room.id).emit('sync time', this.getTime());
            }
            if (this.whiteSec == -1){
              if (this.whiteMin == 0){
                this.whiteSec = 0;
                this.gameState.timeOutWhite = true;
                this.io.sockets.in(this.room.id).emit('timeOut', 'black');
              }
              this.whiteMin -= 1;
              this.whiteSec = 59;
            }
          }
          else if (this.gameState.timeOutWhite && !this.wS){
            this.io.sockets.in(this.room.id).emit('timeOut', 'white');
            this.wS = true;
          }
        }
      }, 1000);
    }

    if (this.timerOn){
       this.blackInterval = setInterval(()=>{
        if (this.room.turn == 'black'){
          if (!this.gameState.timeOutBlack){
            this.blackSec -= 1;
            if (this.blackSec % 5 == 0){
              this.io.sockets.in(this.room.id).emit('sync time', this.getTime());
            }
            if (this.blackSec == -1){
              if (this.blackMin == 0){
                this.blackSec = 0;
                this.gameState.timeOutBlack = true;
              }
              this.blackMin -= 1;
              this.blackSec = 59;
            }
          }
          else if (this.gameState.timeOutBlack && !this.bS){
            this.io.sockets.in(this.room.id).emit('timeOut', 'black');
            this.bS = true;
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

  stopTimer(){
    if (this.whiteInterval) clearInterval(this.whiteInterval);
    if (this.blackInterval) clearInterval(this.blackInterval);
    this.whiteInterval = null;
    this.blackInterval = null;
  }
}