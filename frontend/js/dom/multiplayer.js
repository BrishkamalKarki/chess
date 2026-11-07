import socket from '../socket/socket.js'
import navigateTo, {pagesRoutes} from '../utils/navigator.js'

document.getElementById("createRoom")?.addEventListener('click', ()=>{
  const id = document.getElementById('roomIdMaker').value;
  sessionStorage.setItem('roomCreateId', ``);
  if (!id){
    document.getElementById('roomIdMaker').value = "";
    roomIdMaker.placeholder = 'FIELD EMPTY!';
    return;
  }
  if (Number.isNaN(Number(id))){
    console.log(id);
    document.getElementById('roomIdMaker').value = "";
    roomIdMaker.placeholder = 'ONLY NUMBERS ALLOWED';
    return;
  }
  if (!Number.isNaN(Number(id))){
    document.getElementById('roomIdMaker').value = "";
    if (!(Number(id) >= 1000 && Number(id) <= 9999)){
      roomIdMaker.placeholder = 'ONLY 4 DIGITS ALLOWED';
      return;
    }
  
    document.getElementById('roomIdMaker').value = "";
    roomIdMaker.placeholder = '';
    sessionStorage.setItem('roomCreateId', `${id}`);

    socket.emit('room create id', id);
    navigateTo(pagesRoutes.mPgameConfig);
  }
});

document.getElementById("joinRoom")?.addEventListener('click', ()=>{
  const id = document.getElementById('roomIdHolder').value;
  
  sessionStorage.setItem('roomJoinId', ``);
  if (!id){
    document.getElementById('roomIdHolder').value = "";
    roomIdHolder.placeholder = 'FIELD EMPTY!';
    return;
  }
  if (Number.isNaN(Number(id))){
    console.log(id);
    document.getElementById('roomIdHolder').value = "";
    roomIdHolder.placeholder = 'ONLY NUMBERS ALLOWED';
    return;
  }
  if (!Number.isNaN(Number(id))){
    if (!(Number(id) >= 1000 && Number(id) <= 9999)){
      document.getElementById('roomIdHolder').value = "";
      roomIdHolder.placeholder = 'ONLY 4 DIGITS ALLOWED';
      return;
    }
  
  document.getElementById('roomIdHolder').value = "";
  roomIdHolder.placeholder = '';
  sessionStorage.setItem('roomJoinId', `${id}`);
  socket.emit('room create id', id);
  navigateTo(pagesRoutes.mPgameConfig);
  }
});