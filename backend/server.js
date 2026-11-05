import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import { url } from 'node:inspector';
import { error } from 'node:console';

// const basefolder = path.basename(import.meta.dirname);
const frontendDir = path.resolve(import.meta.dirname, '../frontend');

const resType = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  'json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res)=>{
  try{
    const reqUrl = req.url;
    const fullUrl = new URL(reqUrl, 'http://localhost');
    const pathname = decodeURIComponent(fullUrl.pathname);
    // console.log(reqUrl, fullUrl.pathname, pathname);  
  
    const reqPath = path.join(frontendDir, pathname === '/' ? '/index.html': pathname);
    
    console.log(frontendDir);
    if (reqPath !== frontendDir && !reqPath.startsWith(frontendDir + path.sep)){
      res.writeHead(403);
      return res.end('Forbidden');
    }

    const file = await readFile(reqPath);
    const contentType = resType[path.extname(reqPath)];
  
    res.writeHead(200, {'Content-Type': contentType});
    res.end(file);

  }
  catch(err){
    res.writeHead(404);
    res.end(err.message);
  }
});

server.listen(8000, ()=>{
  console.log('Connected on port: 8000');
});