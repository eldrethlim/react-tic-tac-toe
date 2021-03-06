/* */ 
"use strict";

var _getIterator = require("babel-runtime/core-js/get-iterator")["default"];

var _Object$create = require("babel-runtime/core-js/object/create")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

exports.__esModule = true;

var _babelTemplate = require("babel-template");

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _babelHelperExplodeClass = require("babel-helper-explode-class");

var _babelHelperExplodeClass2 = _interopRequireDefault(_babelHelperExplodeClass);

var buildClassDecorator = _babelTemplate2["default"]("\n  CLASS_REF = DECORATOR(CLASS_REF) || CLASS_REF;\n");

exports["default"] = function (_ref5) {
  var t = _ref5.types;

  function cleanDecorators(decorators) {
    return decorators.reverse().map(function (dec) {
      return dec.expression;
    });
  }

  function transformClass(path, ref, state) {
    var nodes = [];

    state;

    var classDecorators = path.node.decorators;
    if (classDecorators) {
      path.node.decorators = null;
      classDecorators = cleanDecorators(classDecorators);

      for (var _iterator = classDecorators, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var decorator = _ref;

        nodes.push(buildClassDecorator({
          CLASS_REF: ref,
          DECORATOR: decorator
        }));
      }
    }

    var map = _Object$create(null);

    for (var _iterator2 = path.get("body.body"), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var method = _ref2;

      var decorators = method.node.decorators;
      if (!decorators) continue;

      var alias = t.toKeyAlias(method.node);
      map[alias] = map[alias] || [];
      map[alias].push(method.node);

      method.remove();
    }

    for (var alias in map) {
      var items = map[alias];

      items;
    }

    return nodes;
  }

  function hasDecorators(path) {
    if (path.isClass()) {
      if (path.node.decorators) return true;

      for (var _iterator3 = (path.node.body.body /*: Array<Object>*/), _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _getIterator(_iterator3);;) {
        var _ref3;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref3 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref3 = _i3.value;
        }

        var method = _ref3;

        if (method.decorators) {
          return true;
        }
      }
    } else if (path.isObjectExpression()) {
      for (var _iterator4 = (path.node.properties /*: Array<Object>*/), _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _getIterator(_iterator4);;) {
        var _ref4;

        if (_isArray4) {
          if (_i4 >= _iterator4.length) break;
          _ref4 = _iterator4[_i4++];
        } else {
          _i4 = _iterator4.next();
          if (_i4.done) break;
          _ref4 = _i4.value;
        }

        var prop = _ref4;

        if (prop.decorators) {
          return true;
        }
      }
    }

    return false;
  }

  function doError(path) {
    throw path.buildCodeFrameError("Decorators are not supported yet in 6.x pending proposal update.");
  }

  return {
    inherits: require("babel-plugin-syntax-decorators"),

    visitor: {
      ClassExpression: function ClassExpression(path) {
        if (!hasDecorators(path)) return;
        doError(path);

        _babelHelperExplodeClass2["default"](path);

        var ref = path.scope.generateDeclaredUidIdentifier("ref");
        var nodes = [];

        nodes.push(t.assignmentExpression("=", ref, path.node));

        nodes = nodes.concat(transformClass(path, ref, this));

        nodes.push(ref);

        path.replaceWith(t.sequenceExpression(nodes));
      },

      ClassDeclaration: function ClassDeclaration(path) {
        if (!hasDecorators(path)) return;
        doError(path);
        _babelHelperExplodeClass2["default"](path);

        var ref = path.node.id;
        var nodes = [];

        nodes = nodes.concat(transformClass(path, ref, this).map(function (expr) {
          return t.expressionStatement(expr);
        }));
        nodes.push(t.expressionStatement(ref));

        path.insertAfter(nodes);
      },

      ObjectExpression: function ObjectExpression(path) {
        if (!hasDecorators(path)) return;
        doError(path);
      }
    }
  };
};

module.exports = exports["default"];