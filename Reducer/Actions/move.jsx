 
 const {actionTypes} = require("./actionTypes.jsx");

const makeNewMove = ({newPosition,newMove}) => {
    
    return {
        type: actionTypes.NEW_MOVE,
        payload: {newPosition,newMove},
    }
}
 const generateCandidateMoves = ({candidateMoves})=>{
     return {
        type: actionTypes.GENERATE_CANDIDATE_MOVES, 
        payload: {candidateMoves}
    }
}

 const clearCandidates = () =>{
    return {
        type: actionTypes.CLEAR_CANDIDATE_MOVES, 
    }
}

module.exports = {
    makeNewMove,
    generateCandidateMoves,
    clearCandidates
}