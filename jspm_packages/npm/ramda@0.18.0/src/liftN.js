/* */ 
var _curry2 = require('./internal/_curry2');
var _reduce = require('./internal/_reduce');
var _slice = require('./internal/_slice');
var ap = require('./ap');
var curryN = require('./curryN');
var map = require('./map');
module.exports = _curry2(function liftN(arity, fn) {
  var lifted = curryN(arity, fn);
  return curryN(arity, function() {
    return _reduce(ap, map(lifted, arguments[0]), _slice(arguments, 1));
  });
});
