import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path, { matchesGlob } from 'node:path';
import dotenv from 'dotenv';
import {Server} from 'socket.io';

import getMimeType from './utils/getMimeType.js';

const frontendDir = "frontend"; // either path from root or relative to where node started
const baseUrl = process.env.BASE_URL;

dotenv.config();

// https for serving content
const httpServer = http.createServer(async (req, res)=>{
  try{
    const reqUrl = req.url;
    const fullUrl = new URL(reqUrl, 'http://localhost');
    const pathname = decodeURIComponent(fullUrl.pathname); // decodeURIComponent decodes spaces and symbols used in paths
  
    const reqPath = path.join(frontendDir, pathname === '/' ? '/index.html': pathname);
    
    if (!reqPath.startsWith(frontendDir + path.sep)){
      res.writeHead(403);
      return res.end('Cannot serve outside Frontend');
    }

    const file = await readFile(reqPath);
    const mimeType = getMimeType([path.extname(reqPath)]);
  
    res.writeHead(200, {'Content-Type': mimeType});
    res.end(file);
  }
  catch(err){
    if (err.code == 'ENOENT'){
      res.writeHead(404);
      const file404  = await readFile('frontend/pages/404.html');
      res.end(file404);
    }
    res.writeHead(404);
    res.end(err.message);
  }
});

const io = new Server(httpServer)

io.on('connection', async (socket) => {
  socket.on('room create id', (id)=>{
    console.log(id)
  })
});

httpServer.listen(8000, '0.0.0.0', ()=>{
  console.log('Connected on port: 8000');
}); 

export default io;