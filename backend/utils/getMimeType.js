const mimeType = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  'json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};

export default function(ext){
  return mimeType[ext];
};