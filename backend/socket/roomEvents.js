import {rooms, roomService} from "../utils/rooms.js";

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
          if (rooms.get(id).players != 2)
            rooms.delete(id);
        }, 60000*5) // created room will be alive only for 5 mins
      }
      return callback(resp);
    }
  })

  socket.on('room join id', (id, gameMode, callback)=>{
    if (rooms.has(id)){ 
      if (rooms.get(id).players == 2){
        return callback(
          {
            success: false,
            message: 'ROOM FULL'
          }
        )
      }
      if (!rooms.get(id).roomReady){
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
        rooms.get(id).player2 = resp.userId;
        rooms.get(id).players = 2
        rooms.get(id).gameOn = true;
      }
      return callback(resp);
    }
    else{
      return callback(
        { 
          success: false,
          message: 'ID DONOT EXISTS'
        }
      )
    }
  })
};