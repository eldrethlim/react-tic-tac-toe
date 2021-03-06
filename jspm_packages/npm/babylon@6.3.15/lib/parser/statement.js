/* */ 
"use strict";
var _Object$create = require('babel-runtime/core-js/object/create')["default"];
var _getIterator = require('babel-runtime/core-js/get-iterator')["default"];
var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')["default"];
var _tokenizerTypes = require('../tokenizer/types');
var _index = require('./index');
var _index2 = _interopRequireDefault(_index);
var _utilWhitespace = require('../util/whitespace');
var pp = _index2["default"].prototype;
pp.parseTopLevel = function(file, program) {
  program.sourceType = this.options.sourceType;
  this.parseBlockBody(program, true, true, _tokenizerTypes.types.eof);
  file.program = this.finishNode(program, "Program");
  file.comments = this.state.comments;
  file.tokens = this.state.tokens;
  return this.finishNode(file, "File");
};
var loopLabel = {kind: "loop"},
    switchLabel = {kind: "switch"};
pp.parseDirective = function() {
  var directiveLiteral = this.startNode();
  var directive = this.startNode();
  var raw = this.input.slice(this.state.start, this.state.end);
  var val = directiveLiteral.value = raw.slice(1, -1);
  this.addExtra(directiveLiteral, "raw", raw);
  this.addExtra(directiveLiteral, "rawValue", val);
  this.next();
  directive.value = this.finishNode(directiveLiteral, "DirectiveLiteral");
  this.semicolon();
  return this.finishNode(directive, "Directive");
};
pp.parseStatement = function(declaration, topLevel) {
  if (this.match(_tokenizerTypes.types.at)) {
    this.parseDecorators(true);
  }
  var starttype = this.state.type,
      node = this.startNode();
  switch (starttype) {
    case _tokenizerTypes.types._break:
    case _tokenizerTypes.types._continue:
      return this.parseBreakContinueStatement(node, starttype.keyword);
    case _tokenizerTypes.types._debugger:
      return this.parseDebuggerStatement(node);
    case _tokenizerTypes.types._do:
      return this.parseDoStatement(node);
    case _tokenizerTypes.types._for:
      return this.parseForStatement(node);
    case _tokenizerTypes.types._function:
      if (!declaration)
        this.unexpected();
      return this.parseFunctionStatement(node);
    case _tokenizerTypes.types._class:
      if (!declaration)
        this.unexpected();
      this.takeDecorators(node);
      return this.parseClass(node, true);
    case _tokenizerTypes.types._if:
      return this.parseIfStatement(node);
    case _tokenizerTypes.types._return:
      return this.parseReturnStatement(node);
    case _tokenizerTypes.types._switch:
      return this.parseSwitchStatement(node);
    case _tokenizerTypes.types._throw:
      return this.parseThrowStatement(node);
    case _tokenizerTypes.types._try:
      return this.parseTryStatement(node);
    case _tokenizerTypes.types._let:
    case _tokenizerTypes.types._const:
      if (!declaration)
        this.unexpected();
    case _tokenizerTypes.types._var:
      return this.parseVarStatement(node, starttype);
    case _tokenizerTypes.types._while:
      return this.parseWhileStatement(node);
    case _tokenizerTypes.types._with:
      return this.parseWithStatement(node);
    case _tokenizerTypes.types.braceL:
      return this.parseBlock();
    case _tokenizerTypes.types.semi:
      return this.parseEmptyStatement(node);
    case _tokenizerTypes.types._export:
    case _tokenizerTypes.types._import:
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel) {
          this.raise(this.state.start, "'import' and 'export' may only appear at the top level");
        }
        if (!this.inModule) {
          this.raise(this.state.start, "'import' and 'export' may appear only with 'sourceType: module'");
        }
      }
      return starttype === _tokenizerTypes.types._import ? this.parseImport(node) : this.parseExport(node);
    case _tokenizerTypes.types.name:
      if (this.hasPlugin("asyncFunctions") && this.state.value === "async") {
        var state = this.state.clone();
        this.next();
        if (this.match(_tokenizerTypes.types._function) && !this.canInsertSemicolon()) {
          this.expect(_tokenizerTypes.types._function);
          return this.parseFunction(node, true, false, true);
        } else {
          this.state = state;
        }
      }
  }
  var maybeName = this.state.value;
  var expr = this.parseExpression();
  if (starttype === _tokenizerTypes.types.name && expr.type === "Identifier" && this.eat(_tokenizerTypes.types.colon)) {
    return this.parseLabeledStatement(node, maybeName, expr);
  } else {
    return this.parseExpressionStatement(node, expr);
  }
};
pp.takeDecorators = function(node) {
  if (this.state.decorators.length) {
    node.decorators = this.state.decorators;
    this.state.decorators = [];
  }
};
pp.parseDecorators = function(allowExport) {
  while (this.match(_tokenizerTypes.types.at)) {
    this.state.decorators.push(this.parseDecorator());
  }
  if (allowExport && this.match(_tokenizerTypes.types._export)) {
    return;
  }
  if (!this.match(_tokenizerTypes.types._class)) {
    this.raise(this.state.start, "Leading decorators must be attached to a class declaration");
  }
};
pp.parseDecorator = function() {
  if (!this.hasPlugin("decorators")) {
    this.unexpected();
  }
  var node = this.startNode();
  this.next();
  node.expression = this.parseMaybeAssign();
  return this.finishNode(node, "Decorator");
};
pp.parseBreakContinueStatement = function(node, keyword) {
  var isBreak = keyword === "break";
  this.next();
  if (this.isLineTerminator()) {
    node.label = null;
  } else if (!this.match(_tokenizerTypes.types.name)) {
    this.unexpected();
  } else {
    node.label = this.parseIdentifier();
    this.semicolon();
  }
  var i = undefined;
  for (i = 0; i < this.state.labels.length; ++i) {
    var lab = this.state.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop"))
        break;
      if (node.label && isBreak)
        break;
    }
  }
  if (i === this.state.labels.length)
    this.raise(node.start, "Unsyntactic " + keyword);
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};
pp.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement");
};
pp.parseDoStatement = function(node) {
  this.next();
  this.state.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  this.expect(_tokenizerTypes.types._while);
  node.test = this.parseParenExpression();
  this.eat(_tokenizerTypes.types.semi);
  return this.finishNode(node, "DoWhileStatement");
};
pp.parseForStatement = function(node) {
  this.next();
  this.state.labels.push(loopLabel);
  this.expect(_tokenizerTypes.types.parenL);
  if (this.match(_tokenizerTypes.types.semi)) {
    return this.parseFor(node, null);
  }
  if (this.match(_tokenizerTypes.types._var) || this.match(_tokenizerTypes.types._let) || this.match(_tokenizerTypes.types._const)) {
    var _init = this.startNode(),
        varKind = this.state.type;
    this.next();
    this.parseVar(_init, true, varKind);
    this.finishNode(_init, "VariableDeclaration");
    if (this.match(_tokenizerTypes.types._in) || this.isContextual("of")) {
      if (_init.declarations.length === 1 && !_init.declarations[0].init) {
        return this.parseForIn(node, _init);
      }
    }
    return this.parseFor(node, _init);
  }
  var refShorthandDefaultPos = {start: 0};
  var init = this.parseExpression(true, refShorthandDefaultPos);
  if (this.match(_tokenizerTypes.types._in) || this.isContextual("of")) {
    this.toAssignable(init);
    this.checkLVal(init);
    return this.parseForIn(node, init);
  } else if (refShorthandDefaultPos.start) {
    this.unexpected(refShorthandDefaultPos.start);
  }
  return this.parseFor(node, init);
};
pp.parseFunctionStatement = function(node) {
  this.next();
  return this.parseFunction(node, true);
};
pp.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  node.consequent = this.parseStatement(false);
  node.alternate = this.eat(_tokenizerTypes.types._else) ? this.parseStatement(false) : null;
  return this.finishNode(node, "IfStatement");
};
pp.parseReturnStatement = function(node) {
  if (!this.state.inFunction && !this.options.allowReturnOutsideFunction) {
    this.raise(this.state.start, "'return' outside of function");
  }
  this.next();
  if (this.isLineTerminator()) {
    node.argument = null;
  } else {
    node.argument = this.parseExpression();
    this.semicolon();
  }
  return this.finishNode(node, "ReturnStatement");
};
pp.parseSwitchStatement = function(node) {
  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(_tokenizerTypes.types.braceL);
  this.state.labels.push(switchLabel);
  var cur = undefined;
  for (var sawDefault = undefined; !this.match(_tokenizerTypes.types.braceR); ) {
    if (this.match(_tokenizerTypes.types._case) || this.match(_tokenizerTypes.types._default)) {
      var isCase = this.match(_tokenizerTypes.types._case);
      if (cur)
        this.finishNode(cur, "SwitchCase");
      node.cases.push(cur = this.startNode());
      cur.consequent = [];
      this.next();
      if (isCase) {
        cur.test = this.parseExpression();
      } else {
        if (sawDefault)
          this.raise(this.state.lastTokStart, "Multiple default clauses");
        sawDefault = true;
        cur.test = null;
      }
      this.expect(_tokenizerTypes.types.colon);
    } else {
      if (cur) {
        cur.consequent.push(this.parseStatement(true));
      } else {
        this.unexpected();
      }
    }
  }
  if (cur)
    this.finishNode(cur, "SwitchCase");
  this.next();
  this.state.labels.pop();
  return this.finishNode(node, "SwitchStatement");
};
pp.parseThrowStatement = function(node) {
  this.next();
  if (_utilWhitespace.lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start)))
    this.raise(this.state.lastTokEnd, "Illegal newline after throw");
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement");
};
var empty = [];
pp.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.match(_tokenizerTypes.types._catch)) {
    var clause = this.startNode();
    this.next();
    this.expect(_tokenizerTypes.types.parenL);
    clause.param = this.parseBindingAtom();
    this.checkLVal(clause.param, true, _Object$create(null));
    this.expect(_tokenizerTypes.types.parenR);
    clause.body = this.parseBlock();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.guardedHandlers = empty;
  node.finalizer = this.eat(_tokenizerTypes.types._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer) {
    this.raise(node.start, "Missing catch or finally clause");
  }
  return this.finishNode(node, "TryStatement");
};
pp.parseVarStatement = function(node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration");
};
pp.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.state.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  return this.finishNode(node, "WhileStatement");
};
pp.parseWithStatement = function(node) {
  if (this.state.strict)
    this.raise(this.state.start, "'with' in strict mode");
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement(false);
  return this.finishNode(node, "WithStatement");
};
pp.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement");
};
pp.parseLabeledStatement = function(node, maybeName, expr) {
  for (var _iterator = (this.state.labels),
      _isArray = Array.isArray(_iterator),
      _i = 0,
      _iterator = _isArray ? _iterator : _getIterator(_iterator); ; ) {
    var _ref;
    if (_isArray) {
      if (_i >= _iterator.length)
        break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done)
        break;
      _ref = _i.value;
    }
    var label = _ref;
    if (label.name === maybeName) {
      this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    }
  }
  var kind = this.state.type.isLoop ? "loop" : this.match(_tokenizerTypes.types._switch) ? "switch" : null;
  for (var i = this.state.labels.length - 1; i >= 0; i--) {
    var label = this.state.labels[i];
    if (label.statementStart === node.start) {
      label.statementStart = this.state.start;
      label.kind = kind;
    } else {
      break;
    }
  }
  this.state.labels.push({
    name: maybeName,
    kind: kind,
    statementStart: this.state.start
  });
  node.body = this.parseStatement(true);
  this.state.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement");
};
pp.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement");
};
pp.parseBlock = function(allowDirectives) {
  var node = this.startNode();
  this.expect(_tokenizerTypes.types.braceL);
  this.parseBlockBody(node, allowDirectives, false, _tokenizerTypes.types.braceR);
  return this.finishNode(node, "BlockStatement");
};
pp.parseBlockBody = function(node, allowDirectives, topLevel, end) {
  node.body = [];
  node.directives = [];
  var parsedNonDirective = false;
  var oldStrict = undefined;
  var octalPosition = undefined;
  while (!this.eat(end)) {
    if (allowDirectives && !parsedNonDirective && this.match(_tokenizerTypes.types.string)) {
      var oldState = this.state;
      var lookahead = this.lookahead();
      this.state = lookahead;
      var isDirective = this.isLineTerminator();
      this.state = oldState;
      if (isDirective) {
        if (this.state.containsOctal && !octalPosition) {
          octalPosition = this.state.octalPosition;
        }
        var stmt = this.parseDirective();
        node.directives.push(stmt);
        if (allowDirectives && stmt.value.value === "use strict") {
          oldStrict = this.state.strict;
          this.state.strict = true;
          this.setStrict(true);
          if (octalPosition) {
            this.raise(octalPosition, "Octal literal in strict mode");
          }
        }
        continue;
      }
    }
    parsedNonDirective = true;
    node.body.push(this.parseStatement(true, topLevel));
  }
  if (oldStrict === false) {
    this.setStrict(false);
  }
};
pp.parseFor = function(node, init) {
  node.init = init;
  this.expect(_tokenizerTypes.types.semi);
  node.test = this.match(_tokenizerTypes.types.semi) ? null : this.parseExpression();
  this.expect(_tokenizerTypes.types.semi);
  node.update = this.match(_tokenizerTypes.types.parenR) ? null : this.parseExpression();
  this.expect(_tokenizerTypes.types.parenR);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  return this.finishNode(node, "ForStatement");
};
pp.parseForIn = function(node, init) {
  var type = this.match(_tokenizerTypes.types._in) ? "ForInStatement" : "ForOfStatement";
  this.next();
  node.left = init;
  node.right = this.parseExpression();
  this.expect(_tokenizerTypes.types.parenR);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  return this.finishNode(node, type);
};
pp.parseVar = function(node, isFor, kind) {
  node.declarations = [];
  node.kind = kind.keyword;
  for (; ; ) {
    var decl = this.startNode();
    this.parseVarHead(decl);
    if (this.eat(_tokenizerTypes.types.eq)) {
      decl.init = this.parseMaybeAssign(isFor);
    } else if (kind === _tokenizerTypes.types._const && !(this.match(_tokenizerTypes.types._in) || this.isContextual("of"))) {
      this.unexpected();
    } else if (decl.id.type !== "Identifier" && !(isFor && (this.match(_tokenizerTypes.types._in) || this.isContextual("of")))) {
      this.raise(this.state.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
    if (!this.eat(_tokenizerTypes.types.comma))
      break;
  }
  return node;
};
pp.parseVarHead = function(decl) {
  decl.id = this.parseBindingAtom();
  this.checkLVal(decl.id, true);
};
pp.parseFunction = function(node, isStatement, allowExpressionBody, isAsync, optionalId) {
  var oldInMethod = this.state.inMethod;
  this.state.inMethod = false;
  this.initFunction(node, isAsync);
  if (this.match(_tokenizerTypes.types.star)) {
    if (node.async && !this.hasPlugin("asyncGenerators")) {
      this.unexpected();
    } else {
      node.generator = true;
      this.next();
    }
  }
  if (isStatement && !optionalId && !this.match(_tokenizerTypes.types.name) && !this.match(_tokenizerTypes.types._yield)) {
    this.unexpected();
  }
  if (this.match(_tokenizerTypes.types.name) || this.match(_tokenizerTypes.types._yield)) {
    node.id = this.parseBindingIdentifier();
  }
  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);
  this.state.inMethod = oldInMethod;
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
};
pp.parseFunctionParams = function(node) {
  this.expect(_tokenizerTypes.types.parenL);
  node.params = this.parseBindingList(_tokenizerTypes.types.parenR, false, this.hasPlugin("trailingFunctionCommas"));
};
pp.parseClass = function(node, isStatement, optionalId) {
  this.next();
  this.parseClassId(node, isStatement, optionalId);
  this.parseClassSuper(node);
  this.parseClassBody(node);
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};
pp.isClassProperty = function() {
  return this.match(_tokenizerTypes.types.eq) || this.isLineTerminator();
};
pp.parseClassBody = function(node) {
  var oldStrict = this.state.strict;
  this.state.strict = true;
  var hadConstructorCall = false;
  var hadConstructor = false;
  var decorators = [];
  var classBody = this.startNode();
  classBody.body = [];
  this.expect(_tokenizerTypes.types.braceL);
  while (!this.eat(_tokenizerTypes.types.braceR)) {
    if (this.eat(_tokenizerTypes.types.semi)) {
      continue;
    }
    if (this.match(_tokenizerTypes.types.at)) {
      decorators.push(this.parseDecorator());
      continue;
    }
    var method = this.startNode();
    if (decorators.length) {
      method.decorators = decorators;
      decorators = [];
    }
    var isConstructorCall = false;
    var isMaybeStatic = this.match(_tokenizerTypes.types.name) && this.state.value === "static";
    var isGenerator = this.eat(_tokenizerTypes.types.star);
    var isGetSet = false;
    var isAsync = false;
    this.parsePropertyName(method);
    method["static"] = isMaybeStatic && !this.match(_tokenizerTypes.types.parenL);
    if (method["static"]) {
      if (isGenerator)
        this.unexpected();
      isGenerator = this.eat(_tokenizerTypes.types.star);
      this.parsePropertyName(method);
    }
    if (!isGenerator && method.key.type === "Identifier" && !method.computed) {
      if (this.isClassProperty()) {
        classBody.body.push(this.parseClassProperty(method));
        continue;
      }
      if (this.hasPlugin("classConstructorCall") && method.key.name === "call" && this.match(_tokenizerTypes.types.name) && this.state.value === "constructor") {
        isConstructorCall = true;
        this.parsePropertyName(method);
      }
    }
    var isAsyncMethod = this.hasPlugin("asyncFunctions") && !this.match(_tokenizerTypes.types.parenL) && !method.computed && method.key.type === "Identifier" && method.key.name === "async";
    if (isAsyncMethod) {
      if (this.hasPlugin("asyncGenerators") && this.eat(_tokenizerTypes.types.star))
        isGenerator = true;
      isAsync = true;
      this.parsePropertyName(method);
    }
    method.kind = "method";
    if (!method.computed) {
      var key = method.key;
      if (!isAsync && !isGenerator && key.type === "Identifier" && !this.match(_tokenizerTypes.types.parenL) && (key.name === "get" || key.name === "set")) {
        isGetSet = true;
        method.kind = key.name;
        key = this.parsePropertyName(method);
      }
      var isConstructor = !isConstructorCall && !method["static"] && (key.type === "Identifier" && key.name === "constructor" || key.type === "StringLiteral" && key.value === "constructor");
      if (isConstructor) {
        if (hadConstructor)
          this.raise(key.start, "Duplicate constructor in the same class");
        if (isGetSet)
          this.raise(key.start, "Constructor can't have get/set modifier");
        if (isGenerator)
          this.raise(key.start, "Constructor can't be a generator");
        if (isAsync)
          this.raise(key.start, "Constructor can't be an async function");
        method.kind = "constructor";
        hadConstructor = true;
      }
      var isStaticPrototype = method["static"] && (key.type === "Identifier" && key.name === "prototype" || key.type === "StringLiteral" && key.value === "prototype");
      if (isStaticPrototype) {
        this.raise(key.start, "Classes may not have static property named prototype");
      }
    }
    if (isConstructorCall) {
      if (hadConstructorCall)
        this.raise(method.start, "Duplicate constructor call in the same class");
      method.kind = "constructorCall";
      hadConstructorCall = true;
    }
    if ((method.kind === "constructor" || method.kind === "constructorCall") && method.decorators) {
      this.raise(method.start, "You can't attach decorators to a class constructor");
    }
    this.parseClassMethod(classBody, method, isGenerator, isAsync);
    if (isGetSet) {
      var paramCount = method.kind === "get" ? 0 : 1;
      if (method.params.length !== paramCount) {
        var start = method.start;
        if (method.kind === "get") {
          this.raise(start, "getter should have no params");
        } else {
          this.raise(start, "setter should have exactly one param");
        }
      }
    }
  }
  if (decorators.length) {
    this.raise(this.state.start, "You have trailing decorators with no method");
  }
  node.body = this.finishNode(classBody, "ClassBody");
  this.state.strict = oldStrict;
};
pp.parseClassProperty = function(node) {
  if (this.match(_tokenizerTypes.types.eq)) {
    if (!this.hasPlugin("classProperties"))
      this.unexpected();
    this.next();
    node.value = this.parseMaybeAssign();
  } else {
    node.value = null;
  }
  this.semicolon();
  return this.finishNode(node, "ClassProperty");
};
pp.parseClassMethod = function(classBody, method, isGenerator, isAsync) {
  this.parseMethod(method, isGenerator, isAsync);
  classBody.body.push(this.finishNode(method, "ClassMethod"));
};
pp.parseClassId = function(node, isStatement, optionalId) {
  if (this.match(_tokenizerTypes.types.name)) {
    node.id = this.parseIdentifier();
  } else {
    if (optionalId || !isStatement) {
      node.id = null;
    } else {
      this.unexpected();
    }
  }
};
pp.parseClassSuper = function(node) {
  node.superClass = this.eat(_tokenizerTypes.types._extends) ? this.parseExprSubscripts() : null;
};
pp.parseExport = function(node) {
  this.next();
  if (this.match(_tokenizerTypes.types.star)) {
    var specifier = this.startNode();
    this.next();
    if (this.hasPlugin("exportExtensions") && this.eatContextual("as")) {
      specifier.exported = this.parseIdentifier();
      node.specifiers = [this.finishNode(specifier, "ExportNamespaceSpecifier")];
      this.parseExportSpecifiersMaybe(node);
      this.parseExportFrom(node, true);
    } else {
      this.parseExportFrom(node, true);
      return this.finishNode(node, "ExportAllDeclaration");
    }
  } else if (this.hasPlugin("exportExtensions") && this.isExportDefaultSpecifier()) {
    var specifier = this.startNode();
    specifier.exported = this.parseIdentifier(true);
    node.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
    if (this.match(_tokenizerTypes.types.comma) && this.lookahead().type === _tokenizerTypes.types.star) {
      this.expect(_tokenizerTypes.types.comma);
      var _specifier = this.startNode();
      this.expect(_tokenizerTypes.types.star);
      this.expectContextual("as");
      _specifier.exported = this.parseIdentifier();
      node.specifiers.push(this.finishNode(_specifier, "ExportNamespaceSpecifier"));
    } else {
      this.parseExportSpecifiersMaybe(node);
    }
    this.parseExportFrom(node, true);
  } else if (this.eat(_tokenizerTypes.types._default)) {
    var expr = this.startNode();
    var needsSemi = false;
    if (this.eat(_tokenizerTypes.types._function)) {
      expr = this.parseFunction(expr, true, false, false, true);
    } else if (this.match(_tokenizerTypes.types._class)) {
      expr = this.parseClass(expr, true, true);
    } else {
      needsSemi = true;
      expr = this.parseMaybeAssign();
    }
    node.declaration = expr;
    if (needsSemi)
      this.semicolon();
    this.checkExport(node);
    return this.finishNode(node, "ExportDefaultDeclaration");
  } else if (this.state.type.keyword || this.shouldParseExportDeclaration()) {
    node.specifiers = [];
    node.source = null;
    node.declaration = this.parseExportDeclaration(node);
  } else {
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers();
    this.parseExportFrom(node);
  }
  this.checkExport(node);
  return this.finishNode(node, "ExportNamedDeclaration");
};
pp.parseExportDeclaration = function() {
  return this.parseStatement(true);
};
pp.isExportDefaultSpecifier = function() {
  if (this.match(_tokenizerTypes.types.name)) {
    return this.state.value !== "type" && this.state.value !== "async";
  }
  if (!this.match(_tokenizerTypes.types._default)) {
    return false;
  }
  var lookahead = this.lookahead();
  return lookahead.type === _tokenizerTypes.types.comma || lookahead.type === _tokenizerTypes.types.name && lookahead.value === "from";
};
pp.parseExportSpecifiersMaybe = function(node) {
  if (this.eat(_tokenizerTypes.types.comma)) {
    node.specifiers = node.specifiers.concat(this.parseExportSpecifiers());
  }
};
pp.parseExportFrom = function(node, expect) {
  if (this.eatContextual("from")) {
    node.source = this.match(_tokenizerTypes.types.string) ? this.parseExprAtom() : this.unexpected();
    this.checkExport(node);
  } else {
    if (expect) {
      this.unexpected();
    } else {
      node.source = null;
    }
  }
  this.semicolon();
};
pp.shouldParseExportDeclaration = function() {
  return this.hasPlugin("asyncFunctions") && this.isContextual("async");
};
pp.checkExport = function(node) {
  if (this.state.decorators.length) {
    var isClass = node.declaration && (node.declaration.type === "ClassDeclaration" || node.declaration.type === "ClassExpression");
    if (!node.declaration || !isClass) {
      this.raise(node.start, "You can only use decorators on an export when exporting a class");
    }
    this.takeDecorators(node.declaration);
  }
};
pp.parseExportSpecifiers = function() {
  var nodes = [];
  var first = true;
  var needsFrom = undefined;
  this.expect(_tokenizerTypes.types.braceL);
  while (!this.eat(_tokenizerTypes.types.braceR)) {
    if (first) {
      first = false;
    } else {
      this.expect(_tokenizerTypes.types.comma);
      if (this.eat(_tokenizerTypes.types.braceR))
        break;
    }
    var isDefault = this.match(_tokenizerTypes.types._default);
    if (isDefault && !needsFrom)
      needsFrom = true;
    var node = this.startNode();
    node.local = this.parseIdentifier(isDefault);
    node.exported = this.eatContextual("as") ? this.parseIdentifier(true) : node.local.__clone();
    nodes.push(this.finishNode(node, "ExportSpecifier"));
  }
  if (needsFrom && !this.isContextual("from")) {
    this.unexpected();
  }
  return nodes;
};
pp.parseImport = function(node) {
  this.next();
  if (this.match(_tokenizerTypes.types.string)) {
    node.specifiers = [];
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = [];
    this.parseImportSpecifiers(node);
    this.expectContextual("from");
    node.source = this.match(_tokenizerTypes.types.string) ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration");
};
pp.parseImportSpecifiers = function(node) {
  var first = true;
  if (this.match(_tokenizerTypes.types.name)) {
    var startPos = this.state.start,
        startLoc = this.state.startLoc;
    node.specifiers.push(this.parseImportSpecifierDefault(this.parseIdentifier(), startPos, startLoc));
    if (!this.eat(_tokenizerTypes.types.comma))
      return;
  }
  if (this.match(_tokenizerTypes.types.star)) {
    var specifier = this.startNode();
    this.next();
    this.expectContextual("as");
    specifier.local = this.parseIdentifier();
    this.checkLVal(specifier.local, true);
    node.specifiers.push(this.finishNode(specifier, "ImportNamespaceSpecifier"));
    return;
  }
  this.expect(_tokenizerTypes.types.braceL);
  while (!this.eat(_tokenizerTypes.types.braceR)) {
    if (first) {
      first = false;
    } else {
      this.expect(_tokenizerTypes.types.comma);
      if (this.eat(_tokenizerTypes.types.braceR))
        break;
    }
    var specifier = this.startNode();
    specifier.imported = this.parseIdentifier(true);
    specifier.local = this.eatContextual("as") ? this.parseIdentifier() : specifier.imported.__clone();
    this.checkLVal(specifier.local, true);
    node.specifiers.push(this.finishNode(specifier, "ImportSpecifier"));
  }
};
pp.parseImportSpecifierDefault = function(id, startPos, startLoc) {
  var node = this.startNodeAt(startPos, startLoc);
  node.local = id;
  this.checkLVal(node.local, true);
  return this.finishNode(node, "ImportDefaultSpecifier");
};
