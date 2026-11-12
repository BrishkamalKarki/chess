const winner = sessionStorage.getItem('turn');
const by = sessionStorage.getItem('by');
// sessionStorage.clear();

const winEl = document.getElementById('winner');
if (winner == 'white')
  winEl.style.color = '#77b8b2';
else if (winner == 'black')
  winEl.style.color = '#1e5754';
else
  winEl.style.color = 'white';
winEl.textContent = `${winner.toUpperCase()} Wins`;

const byEl = document.getElementById('by');
byEl.textContent = `BY ${by.toUpperCase()}`;
