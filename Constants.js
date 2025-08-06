const { createPosition } =require("./Board/helper.jsx");

 const Status ={
    'ongoing': 'Ongoing', 
    'promoting' : 'Promoting',
    'white' : 'White wins', 
    'black' : 'Black wins',
    'stalemate' : 'Game draws due to stalemate', 
    'insufficient' : 'Game draws due to insufficient material',

}

 const initGameState = {
    position: [createPosition()], 
    turn:'w',
    candidateMoves :  [],
    status: Status.ongoing, 
    promotionSquare: null, 
    moveList: [],
    castleDirection : {
        w : 'both', 
        b : 'both', 
    }, 
} 


module.exports={
    Status, 
    initGameState
}