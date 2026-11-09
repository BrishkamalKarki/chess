export async function getChessPieces(){
  const pathToPieces = '../assets/images/pieces'
  const piecesFileName = ['bB', 'bK', 'bN', 'bP', 'bQ', 'bR', 'wB', 'wK', 'wN', 'wP', 'wQ', 'wR'];

  const chessPieces = {};
  await Promise.all(piecesFileName.map(async (name)=>{
    const img = new Image();
    img.src = `${pathToPieces}/${name}.png`;
    await img.decode();
    chessPieces[name] = img; 
  }))
  
  return chessPieces;
};

