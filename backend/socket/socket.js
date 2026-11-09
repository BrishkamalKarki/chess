import { registerSettingEvents } from "./configEvents.js";
import { registerGameEvents } from "./gameEvents.js";
import { registerRoomEvents } from "./roomEvents.js";

export function registerSocketEvents(io){

io.on('connection', async (socket) => {
  // for the making and joinning of the room
  registerRoomEvents(io, socket);
  // for setting and getting settings
  registerSettingEvents(io, socket);
  // for overall game 
  registerGameEvents(io, socket);
});
}