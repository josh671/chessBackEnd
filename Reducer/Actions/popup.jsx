const {actionTypes} = require('./actionTypes.jsx');

 const openPromotion = ({rank, file, x, y}) => {
    return {
        type: actionTypes.PROMOTION_OPEN,
        payload: {rank, file, x, y}
    }
}

 const closePopup = () => {
    return {
        type: actionTypes.PROMOTION_CLOSE,
    }
} 

module.exports = {
    openPromotion,
    closePopup
}