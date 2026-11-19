import {destroyRoom, rooms, roomService} from "../utils/rooms.js";

export function registerRoomEvents(io, socket){
  // getting a id to create a room
  socket.on('room create id', (id, gameMode, callback)=>{
    if (rooms.has(id)){  
      // adapter manages communication and room memberships of all the sockets
      return callback(
        {
          success: false,
          message: 'ID ALREADY EXISTS'
        }
      )
    }
    else{
      const resp = roomService(id, gameMode, true);
      if (resp.success){
        socket.join(id);
        rooms.set(id,
          { 
            id: id,
            player1: resp.userId,
            players: 1,
            roomReady: false
          }
        );

        setTimeout(()=>{
          const room = rooms.get(id);
          if (!room || room.players != 2)
            destroyRoom(io, id);
        }, 60000*5) // created room will be alive only for 5 mins
      }
      return callback(resp);
    }
  })

  socket.on('room join id', (id, gameMode, callback)=>{
    const room = rooms.get(id);
    if (!room){
      return callback(
        { 
          success: false,
          message: 'ID DONOT EXISTS'
        }
      )
    }
    if (room.gameOn){
      return callback(
        {
          success: false,
          message: 'GAME IS ALREADY ON'
        }
      )
    }
    if (room.players == 2){
      return callback(
        {
          success: false,
          message: 'ROOM FULL'
        }
      )
    }
    if (!room.roomReady){
      return callback(
        {
          success: false,
          message: 'ID DONOT EXISTS'
        }
      )
    }
    const resp = roomService(id, gameMode, false);
    if (resp.success){
      socket.join(id);
      room.player2 = resp.userId;
      room.players = 2
      room.gameOn = true;
    }
    return callback(resp);
  })
};