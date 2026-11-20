
// navigates to next page

export const pagesRoutes = { // path are relative to this location
  home: new URL('../../index.html', import.meta.url),
  sPgameConfig: new URL('../../pages/sPgameConfig.html', import.meta.url),
  mPgameConfig: new URL('../../pages/mPgameConfig.html', import.meta.url),
  msPL: new URL('../../pages/msPL.html', import.meta.url),
  arena: new URL('../../pages/arena.html', import.meta.url),
  winner: new URL('../../pages/winner.html', import.meta.url)
}

export default function navigateTo(path){ 
  try{
    window.location.href = `${path}`;
  }
  catch(err){
    if (err.code === 'ENOENT'){
      return;
    }
    return;
  }
};