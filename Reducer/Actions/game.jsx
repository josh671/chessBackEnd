const  { initGameState } = require("../../Constants.js");
const actionTypes = require("./actionTypes.jsx");

 const updateCastling = (direction) => {
    return {
        type: actionTypes.CAN_CASTLE,
        payload: direction,
    }
}

 const detectStalemate = () => {
    return {
        type: actionTypes.STALEMATE,
        
    }
}

 const detectCheckMate = (winner) => {
    return {
        type: actionTypes.WIN,
        payload: winner,
        
    }
}

 const setupNewGame = () => {
    return {
        type: actionTypes.NEW_GAME,
        payload : initGameState
    }
}

 const detectInsufficientMaterial = () => {
    return {
        type : actionTypes.INSUFFICIENT_MATERIAL,
        
    }


} 

module.exports={
    updateCastling,
    detectStalemate,
   detectCheckMate ,
   setupNewGame ,
   detectInsufficientMaterial 
}