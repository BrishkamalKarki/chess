
// navigates to next page

export const pagesRoutes = { // path are relative to this location
  sPgameConfig: new URL('../../pages/sPgameConfig.html', import.meta.url),
  mPgameConfig: new URL('../../pages/mPgameConfig.html', import.meta.url),
  msPL: new URL('../../pages/msPL.html', import.meta.url),
  arena: new URL('../../pages/arena.html', import.meta.url)
}

export default function navigateTo(path){ 
  try{
    window.location.href = `${path}`;
  }
  catch(err){
    if (err.code === 'ENOENT'){
      console.log(path, " DNE ");
      return;
    }
    console.log("Error: ", err.message);
    return;
  }
};