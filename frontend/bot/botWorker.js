import Module from './bot.js';
import createBot from './bot.js';

const bot = await createBot({
  locateFile: () => '/bot/bot.wasm'
}) 

self.onmessage = (event) => {
  const {bitBoards, color, depth, requestId} = event.data;
  try{
    const bestMove = bot._getBestMove(...bitBoards, color, depth);
    self.postMessage({requestId, bestMove});
  }
  catch (error){
    self.postMessage({
      requestId,
      error: error.message
    });
  }
}