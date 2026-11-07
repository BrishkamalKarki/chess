const gameMode = sessionStorage.getItem('gameMode');
const playedAs = sessionStorage.getItem('playedAs');
const timerOn = sessionStorage.getItem('timerOn');
const botDiff = sessionStorage.getItem('botDiff');
const gameTime = sessionStorage.getItem('gameTime');

export default {
  gameMode: gameMode,
  playedAs: playedAs,
  timerOn: timerOn,
  botDiff: botDiff,
  gameTime: gameTime
}