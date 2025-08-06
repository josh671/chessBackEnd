const {copyPosition} = require('../Board/helper.jsx'); 


function movePiece ({position,piece,rank,file,x,y}){
    
    const newPosition = copyPosition(position)
    
    if(piece.endsWith('k') && Math.abs(y - file) > 1){ // Castles
        if (y === 2){ // Castles Long
            newPosition[rank][0] = ''
            newPosition[rank][3] = piece.startsWith('w') ? 'wr' : 'br'
        }
        if (y === 6){ // Castles Short
            newPosition[rank][7] = ''
            newPosition[rank][5] = piece.startsWith('w') ? 'wr' : 'br'
        }
    }
    
    newPosition[rank][file] = ''
    newPosition[x][y] = piece
   
    return newPosition
}

function movePawn({position, piece, rank, file,x, y }){
    const newPosition = copyPosition(position); 
    if(!newPosition[x][y] && x !== rank && y !== file){
        newPosition[rank][y] = '';   
    }
    newPosition[rank][file] = ''; 
    newPosition[x][y] = piece; 

    return newPosition; 
}

module.exports = {
    movePiece,
    movePawn
}