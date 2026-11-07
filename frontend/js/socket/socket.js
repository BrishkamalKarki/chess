const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000, // waits to reconnect after first disconnection
  reconnectionDelayMax: 5000, // max time to wait for a connection attempt before it timesout

  timeout: 20000, // tries to reconnect within 20 sec
});

export default socket;