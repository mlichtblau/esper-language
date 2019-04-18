const Op = require('./operators');

const OperatorMap = {
  [Op.eq]: '=',
  [Op.ne]: '!=',
  [Op.gte]: '>=',
  [Op.gt]: '>',
  [Op.lte]: '<=',
  [Op.lt]: '<',
  [Op.and]: ' AND ',
  [Op.or]: ' OR ',
};

module.exports = OperatorMap;