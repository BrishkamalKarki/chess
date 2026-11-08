import { registerSettingEvents } from "./configEvents.js";
import { registerRoomEvents } from "./roomEvents.js";

export function registerSocketEvents(io){

io.on('connection', async (socket) => {
  // roomEvents
  registerRoomEvents(io, socket);
  registerSettingEvents(io, socket);
});
}