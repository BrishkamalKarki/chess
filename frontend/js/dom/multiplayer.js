import socket from '../socket/socket.js'
import navigateTo, {pagesRoutes} from '../utils/navigator.js'

document.getElementById("createRoom")?.addEventListener('click', async ()=>{
  const id = document.getElementById('roomIdMaker').value;
  if (!id){
    document.getElementById('roomIdMaker').value = "";
    roomIdMaker.placeholder = 'FIELD EMPTY';
    return;
  }
  if (Number.isNaN(Number(id))){
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

    // sending the room id through socket
    const responce = await socket.timeout(5000).emitWithAck('room create id', id, sessionStorage.getItem('gameMode'));
      if (responce.success){
        roomIdMaker.placeholder = '';
        sessionStorage.setItem('roomCreateId', id);
        sessionStorage.setItem('userId', responce.userId);
        navigateTo(pagesRoutes.mPgameConfig);
      }
      else{
        document.getElementById('roomIdMaker').value = "";
        roomIdMaker.placeholder = responce.message;
      }
    }
});

document.getElementById("joinRoom")?.addEventListener('click',async ()=>{
  const id = document.getElementById('roomIdHolder').value;
  
  if (!id){
    document.getElementById('roomIdHolder').value = "";
    roomIdHolder.placeholder = 'FIELD EMPTY';
    return;
  }
  if (Number.isNaN(Number(id))){
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
  
  // sending the room id through socket
    const responce = await socket.timeout(5000).emitWithAck('room join id', id, sessionStorage.getItem('gameMode'));
      if (responce.success){
        document.getElementById('roomIdHolder').value = "";
        roomIdHolder.placeholder = '';
        sessionStorage.setItem('roomJoinId', id);
        sessionStorage.setItem('userId', responce.userId);
        navigateTo(pagesRoutes.arena);
      }
      else{
        document.getElementById('roomIdHolder').value = "";
        roomIdHolder.placeholder = responce.message;
      }
  }
});