const {copyPosition} = require('../Board/helper.jsx'); 


function movePiece ({position,piece,rank,file,x,y}){
    
    if (x < 0 || x > 7 || y < 0 || y > 7 || rank < 0 || rank > 7 || file < 0 || file > 7) {
        console.error('Invalid coordinates:', { x, y, rank, file });
        return position;
    }
    
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
    //console.log('move pawn', position, piece, rank, file, x , y); 
    
    if (x < 0 || x > 7 || y < 0 || y > 7 || rank < 0 || rank > 7 || file < 0 || file > 7) {
        console.error('Invalid pawn move coordinates:', { x, y, rank, file });
        return position;
    }
    
    const newPosition = copyPosition(position); 
    //console.log('newPosition', newPosition[x][y]); 
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