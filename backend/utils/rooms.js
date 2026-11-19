import { stateToRoom } from "./games.js";
import {randomUUID} from 'node:crypto';

const rooms = new Map();

function roomService(id, gameMode, create){
  if (gameMode == 'singlePlayer'){
    return {
      success: false,
      message: 'NOT A MULTIPLAYER GAME MODE'
    }
  }
  if (!id){
    return {
      success: false,
      message: 'FIELD EMPTY'
    }
  }
  else if (Number.isNaN(Number(id))){
    return {
      success: false,
      message: 'ONLY NUMBERS ALLOWED'
    }
  }
  else if (!Number.isNaN(Number(id)) && !(Number(id) >= 1000 && Number(id) <= 9999)){
    return {
      success: false,
      message: 'ONLY 4 DIGITS ALLOWED'
    }
  }
  else{
    let userId;
    while(true){
      userId = randomUUID();
      let present;
      for (const [roomId, roomInfo] of rooms){
        if (roomInfo.userId == userId) present = true;
      }
      if (!present) break;
    }
    return {
      success: true,
      userId:  userId
    }
  }
}

function destroyRoom(io, roomId){
  const key = String(roomId);
  const room = rooms.get(roomId) || rooms.get(key);
  const roomState = stateToRoom[key] || stateToRoom[roomId];
  const timer = (roomState && roomState.timer) || (room && room.timer);

  if (timer) timer.stopTimer();
  if (room) room.gameOn = false;

  rooms.delete(roomId);
  rooms.delete(key);
  delete stateToRoom[roomId];
  delete stateToRoom[key];

  if (io) io.in(key).socketsLeave(key);
}

export {rooms, roomService, destroyRoom};