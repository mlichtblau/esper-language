const Op = require('./src/operators');
const OperatorMap = require('./src/operator-map');

const createEsperQueryForEventType = function (eventType, attributes = ['*'], filters = { }) {
  const attributesString = attributes.join(", ");
  const esperQuery = `SELECT ${ attributesString } FROM ${ eventType }`;
  const filterString = filterQuery(filters);
  const isFilter = filterString && filterString.length > 0;
  return isFilter ? esperQuery + `(${ filterString })` : esperQuery;
};

const filterQuery = function(filters, options, binding) {
  binding = binding || 'AND';
  if (binding[0] !== ' ') binding = ` ${binding} `;

  let res = Object.entries(filters)
    .map(([key, value]) => filterItemQuery(key, value))
    .filter(item => item && item.length)
    .join(binding);
  return res;
};

const filterItemQuery = function(key, value, options = {}) {
  if (value === undefined) {
    throw new Error(`Filter parameter "${ key }" is undefined`);
  }

  const isObject = typeof value === 'object';
  const isArray = !isObject && Array.isArray(value);

  if (key === undefined && isArray) {
    key = Op.and;
  }

  if (key === Op.or || key === Op.and) {
    return _whereGroupBind(key, value, options);
  }

  if (value[Op.or]) {
    console.log(value[Op.or]);
    return _whereBind(OperatorMap[Op.or], key, value[Op.or], options);
  }

  if (value[Op.and]) {
    return _whereBind(OperatorMap[Op.and], key, value[Op.and], options);
  }

  let joined = _joinKeyValue(key, value, OperatorMap[Op.eq]);
  return joined;
};

const _whereBind = function (binding, key, value, options) {
  if (typeof value === 'object' && !Array.isArray(value)) {
    console.log(Object.entries(value)[0][1]);
    value = Object.entries(value).map(([key2, value]) => filterItemQuery(key, { [key2]: value }, options));
  } else {
    value = value.map(item => filterItemQuery(key, item, options));
  }

  value = value.filter(item => item && item.length);

  return value.length ? `(${value.join(binding)})` : undefined;
};

const _whereGroupBind = function (key, value, options) {
  const binding = key === Op.or ? OperatorMap[Op.or] : OperatorMap[Op.and];

  if (Array.isArray(value)) {
    value = value.map(item => {
      let itemQuery = filterQuery(item, options, OperatorMap[Op.and]);
      return `(${ itemQuery })`;
    }).filter(item => item && item.length);

    value = value.length && value.join(binding);
  } else {
    value = filterQuery(value, options, binding);
  }
  return value ? `(${value})` : undefined;
};

const _joinKeyValue = function(key, value, comparator) {
  if (!key) {
    return value;
  }
  if (comparator === undefined) {
    throw new Error(`${key} and ${value} has no comparator`);
  }
  return [key, `"${value}"`].join(` ${comparator} `);
};

module.exports = {
  createEsperQueryForEventType,
  Op
};