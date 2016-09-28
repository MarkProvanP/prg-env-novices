(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var RootASTNode = (function () {
    function RootASTNode(child) {
        this.child = child;
        this.child.setParent(this);
    }
    RootASTNode.prototype.replaceASTNode = function (original, replacement) {
        if (this.child === original) {
            this.child = replacement;
            this.child.setParent(this);
        }
    };
    RootASTNode.prototype.toDOM = function (astNodeDivMap) {
        var rootDiv = document.createElement("div");
        rootDiv.appendChild(this.child.toDOM(astNodeDivMap));
        return rootDiv;
    };
    RootASTNode.prototype.getFirstEmpty = function () {
        return this.child.getFirstEmpty();
    };
    return RootASTNode;
}());
exports.RootASTNode = RootASTNode;
var ASTNode = (function () {
    function ASTNode() {
    }
    return ASTNode;
}());
exports.ASTNode = ASTNode;
var Expression = (function (_super) {
    __extends(Expression, _super);
    function Expression() {
        _super.apply(this, arguments);
    }
    Expression.parse = function (p) {
        return Expression.fraserHanson(1, p);
    };
    ;
    Expression.fraserHanson = function (k, p) {
        var i;
        var left;
        var operator;
        var right;
        left = PrimaryExpression.parse(p);
        if (p.hasAnotherToken()) {
            for (i = p.getToken().getPrecedence(); i >= k; i--) {
                while (p.hasAnotherToken() && p.getToken().getPrecedence() === i) {
                    operator = p.getToken().operator;
                    p.advanceToken();
                    right = Expression.fraserHanson(i + 1, p);
                    left = new BinaryExpression(left, right, operator);
                }
            }
        }
        return left;
    };
    return Expression;
}(ASTNode));
exports.Expression = Expression;
var BinaryExpression = (function (_super) {
    __extends(BinaryExpression, _super);
    function BinaryExpression(leftExpr, rightExpr, operator) {
        _super.call(this);
        this.leftExpr = leftExpr;
        this.rightExpr = rightExpr;
        this.operator = operator;
    }
    BinaryExpression.prototype.setParent = function (parent) {
        this.parent = parent;
        this.leftExpr.setParent(this);
        this.rightExpr.setParent(this);
    };
    BinaryExpression.prototype.replaceASTNode = function (original, replacement) {
        if (original === this.leftExpr) {
            this.leftExpr = replacement;
            this.leftExpr.setParent(this);
        }
        else if (original === this.rightExpr) {
            this.rightExpr = replacement;
            this.rightExpr.setParent(this);
        }
    };
    BinaryExpression.prototype.toString = function () {
        return "("
            + this.leftExpr.toString()
            + Operator[this.operator]
            + this.rightExpr.toString()
            + ")";
    };
    BinaryExpression.prototype.getText = function () {
        return this.leftExpr.getText()
            + operatorToChar(this.operator)
            + this.rightExpr.getText();
    };
    BinaryExpression.prototype.getFirstEmpty = function () {
        if (this.leftExpr instanceof EmptyExpression) {
            return this.leftExpr;
        }
        var l = this.leftExpr.getFirstEmpty();
        if (l) {
            return l;
        }
        if (this.rightExpr instanceof EmptyExpression) {
            return this.rightExpr;
        }
        var r = this.rightExpr.getFirstEmpty();
        if (r) {
            return r;
        }
        ;
        return null;
    };
    BinaryExpression.prototype.toDOM = function (astNodeDivMap) {
        var rootElement = document.createElement("div");
        rootElement.classList.add("binaryExprDiv");
        var leftElementDiv = this.leftExpr.toDOM(astNodeDivMap);
        var rightElementDiv = this.rightExpr.toDOM(astNodeDivMap);
        var operatorDiv = document.createElement("div");
        operatorDiv.classList.add("operatorDiv");
        operatorDiv.textContent = operatorToChar(this.operator);
        rootElement.appendChild(leftElementDiv);
        rootElement.appendChild(operatorDiv);
        rootElement.appendChild(rightElementDiv);
        astNodeDivMap.addDivNode(rootElement, this);
        return rootElement;
    };
    return BinaryExpression;
}(Expression));
exports.BinaryExpression = BinaryExpression;
var PrimaryExpression = (function (_super) {
    __extends(PrimaryExpression, _super);
    function PrimaryExpression(value) {
        _super.call(this);
        this.value = value;
    }
    PrimaryExpression.prototype.setParent = function (parent) {
        this.parent = parent;
    };
    PrimaryExpression.parse = function (p) {
        var staticPrimaryExpression;
        if (p.getToken() instanceof NumToken) {
            staticPrimaryExpression = new PrimaryExpression(p.getToken().value);
            p.advanceToken();
        }
        else {
            staticPrimaryExpression = new EmptyExpression();
            p.advanceToken();
        }
        return staticPrimaryExpression;
    };
    PrimaryExpression.prototype.toString = function () {
        return String(this.value);
    };
    PrimaryExpression.prototype.getText = function () {
        return String(this.value);
    };
    PrimaryExpression.prototype.getFirstEmpty = function () { return null; };
    PrimaryExpression.prototype.toDOM = function (astNodeDivMap) {
        var primaryExprDiv = document.createElement("div");
        primaryExprDiv.classList.add("primaryExprDiv");
        primaryExprDiv.textContent = String(this.value);
        astNodeDivMap.addDivNode(primaryExprDiv, this);
        return primaryExprDiv;
    };
    return PrimaryExpression;
}(Expression));
exports.PrimaryExpression = PrimaryExpression;
var EmptyExpression = (function (_super) {
    __extends(EmptyExpression, _super);
    function EmptyExpression() {
        _super.apply(this, arguments);
    }
    EmptyExpression.prototype.toString = function () {
        return "_";
    };
    EmptyExpression.prototype.setParent = function (parent) {
        this.parent = parent;
    };
    EmptyExpression.prototype.toDOM = function (astNodeDivMap) {
        var emptyExprDiv = document.createElement("div");
        emptyExprDiv.classList.add("emptyExprDiv");
        emptyExprDiv.textContent = '_';
        astNodeDivMap.addDivNode(emptyExprDiv, this);
        return emptyExprDiv;
    };
    EmptyExpression.prototype.getFirstEmpty = function () { return this; };
    ;
    EmptyExpression.prototype.getText = function () { return ""; };
    return EmptyExpression;
}(Expression));
exports.EmptyExpression = EmptyExpression;
(function (Operator) {
    Operator[Operator["Add"] = 0] = "Add";
    Operator[Operator["Subtract"] = 1] = "Subtract";
    Operator[Operator["Multiply"] = 2] = "Multiply";
    Operator[Operator["Divide"] = 3] = "Divide";
})(exports.Operator || (exports.Operator = {}));
var Operator = exports.Operator;
function charToOperator(c) {
    switch (c) {
        case "+": return Operator.Add;
        case "-": return Operator.Subtract;
        case "*": return Operator.Multiply;
        case "/": return Operator.Divide;
    }
}
function operatorToChar(o) {
    switch (o) {
        case Operator.Add: return "+";
        case Operator.Subtract: return "-";
        case Operator.Multiply: return "*";
        case Operator.Divide: return "/";
    }
}
var Token = (function () {
    function Token() {
    }
    Token.prototype.getPrecedence = function () {
        return 0;
    };
    return Token;
}());
exports.Token = Token;
var OperatorToken = (function (_super) {
    __extends(OperatorToken, _super);
    function OperatorToken(operator) {
        _super.call(this);
        this.operator = operator;
    }
    OperatorToken.prototype.getPrecedence = function () {
        switch (this.operator) {
            case Operator.Add:
            case Operator.Subtract:
                return 3;
            case Operator.Multiply:
            case Operator.Divide:
                return 4;
        }
    };
    OperatorToken.prototype.toString = function () {
        return Operator[this.operator];
    };
    return OperatorToken;
}(Token));
exports.OperatorToken = OperatorToken;
var NumToken = (function (_super) {
    __extends(NumToken, _super);
    function NumToken(value) {
        _super.call(this);
        this.value = value;
    }
    NumToken.prototype.toString = function () {
        return String(this.value);
    };
    return NumToken;
}(Token));
exports.NumToken = NumToken;
function lex(s) {
    var tokens = [];
    for (var i = 0; i < s.length; i++) {
        var t = null;
        var c = s[i];
        if (!isNaN(parseInt(c))) {
            t = new NumToken(parseInt(c));
        }
        else {
            t = new OperatorToken(charToOperator(c));
        }
        tokens.push(t);
    }
    return tokens;
}
exports.lex = lex;
var Parser = (function () {
    function Parser(tokenList) {
        this.tokenPosition = 0;
        this.tokenList = tokenList;
    }
    Parser.prototype.getToken = function () {
        return this.tokenList[this.tokenPosition];
    };
    Parser.prototype.advanceToken = function () {
        this.tokenPosition++;
    };
    Parser.prototype.hasAnotherToken = function () {
        return this.tokenList.length > this.tokenPosition;
    };
    return Parser;
}());
exports.Parser = Parser;

},{}],2:[function(require,module,exports){
"use strict";
var lang = require("./lang");
var lexedDiv = document.getElementById("lexedDiv");
var inputDiv = document.getElementById("inputDiv");
var parsedDiv = document.getElementById("parsedDiv");
var astDiv = document.getElementById("astDiv");
var astCursorDiv = document.createElement("div");
astCursorDiv.id = "astCursorDiv";
var text = "";
var cursorPosition = 0;
var rootASTNode;
var expr;
var isCursorActive = false;
var cursorDiv = document.getElementById("cursorDiv");
var selectedASTNode;
var theDivASTNodeMap;
inputDiv.onclick = function () {
    toggleCursorActive();
};
function lexText() {
    console.log(lang.lex(text));
}
exports.lexText = lexText;
var ASTNodeDivMap = (function () {
    function ASTNodeDivMap() {
        this.divToASTNode = new WeakMap();
        this.astNodeToDiv = new WeakMap();
    }
    ASTNodeDivMap.prototype.addNodeDiv = function (node, div) {
        this.divToASTNode.set(div, node);
        this.astNodeToDiv.set(node, div);
    };
    ASTNodeDivMap.prototype.addDivNode = function (div, node) {
        this.addNodeDiv(node, div);
    };
    ASTNodeDivMap.prototype.removeASTNode = function (node) {
        var div = this.astNodeToDiv.get(node);
        this.astNodeToDiv.delete(node);
        this.divToASTNode.delete(div);
    };
    ASTNodeDivMap.prototype.getDiv = function (node) {
        return this.astNodeToDiv.get(node);
    };
    ASTNodeDivMap.prototype.getASTNode = function (div) {
        return this.divToASTNode.get(div);
    };
    return ASTNodeDivMap;
}());
exports.ASTNodeDivMap = ASTNodeDivMap;
astDiv.onkeydown = function (event) {
    if (selectedASTNode) {
        var parent_1 = selectedASTNode.parent;
        if (selectedASTNode instanceof lang.EmptyExpression) {
            if (event.key.length === 1) {
                var input = event.key;
                var tokens = lang.lex(input);
                var p = new lang.Parser(tokens);
                var newExpr = lang.Expression.parse(p);
                parent_1.replaceASTNode(selectedASTNode, newExpr);
            }
        }
        else {
            if (event.key.length === 1) {
                var input = selectedASTNode.getText() + event.key;
                var tokens = lang.lex(input);
                var p = new lang.Parser(tokens);
                var newExpr = lang.Expression.parse(p);
                parent_1.replaceASTNode(selectedASTNode, newExpr);
                var firstEmptyExpr = parent_1.getFirstEmpty();
                console.log(firstEmptyExpr);
                makeNodeSelected(firstEmptyExpr);
            }
            else {
                if (event.key === "Backspace") {
                    if (parent_1) {
                        var newEmpty = new lang.EmptyExpression();
                        parent_1.replaceASTNode(selectedASTNode, newEmpty);
                        makeNodeSelected(newEmpty);
                    }
                }
            }
        }
    }
    renderAST();
};
inputDiv.onkeyup = function (event) {
    if (isCursorActive) {
        if (event.key.length === 1) {
            insertText(event.key, cursorPosition);
        }
        else {
            if (event.key === "ArrowLeft") {
                cursorLeft();
            }
            else if (event.key === "ArrowRight") {
                cursorRight();
            }
            else if (event.key === "Backspace") {
                deleteText(cursorPosition - 1, cursorPosition);
            }
            else {
                console.log(event.key);
            }
        }
        renderText();
        renderAST();
    }
};
function cursorLeft() {
    if (cursorPosition > 0) {
        cursorPosition--;
    }
}
function cursorRight() {
    if (cursorPosition < text.length) {
        cursorPosition++;
    }
}
function insertText(content, position) {
    var beforeCursorString = text.substring(0, cursorPosition);
    var afterCursorString = text.substring(cursorPosition, text.length);
    text = beforeCursorString + content + afterCursorString;
    cursorPosition++;
}
function deleteText(from, to) {
    if (from < 0) {
        from = 0;
    }
    if (to > text.length) {
        to = text.length;
    }
    var beforeString = text.substring(0, from);
    var afterString = text.substring(to, text.length);
    text = beforeString + afterString;
    cursorPosition = from;
}
function astNodeDivOnclick(event) {
    event.stopPropagation();
    var selectedDiv = event.target;
    var found = theDivASTNodeMap.getASTNode(selectedDiv);
    makeNodeSelected(found);
    renderAST();
}
function makeNodeSelected(node) {
    selectedASTNode = node;
}
function applySelectedStylingToNode(node) {
    var nodeDiv = theDivASTNodeMap.getDiv(node);
    nodeDiv.classList.add('selectedASTNode');
    nodeDiv.appendChild(astCursorDiv);
}
function renderText() {
    inputDiv.innerHTML = "";
    var beforeCursorString = text.substring(0, cursorPosition);
    var afterCursorString = text.substring(cursorPosition, text.length);
    var beforeCursorNodes = stringToDom(beforeCursorString);
    var afterCursorNodes = stringToDom(afterCursorString);
    beforeCursorNodes.forEach(function (node) {
        inputDiv.appendChild(node);
    });
    inputDiv.appendChild(cursorDiv);
    afterCursorNodes.forEach(function (node) {
        inputDiv.appendChild(node);
    });
    lexAndParse();
}
exports.renderText = renderText;
function lexAndParse() {
    var lexed = lang.lex(text);
    lexedDiv.textContent = lexed.toString();
    var parser = new lang.Parser(lexed);
    expr = lang.Expression.parse(parser);
    rootASTNode = new lang.RootASTNode(expr);
    parsedDiv.textContent = expr.toString();
}
function renderAST() {
    theDivASTNodeMap = new ASTNodeDivMap();
    astDiv.innerHTML = "";
    astDiv.appendChild(rootASTNode.toDOM(theDivASTNodeMap));
    astDiv.onclick = astNodeDivOnclick;
    if (selectedASTNode) {
        applySelectedStylingToNode(selectedASTNode);
    }
}
exports.renderAST = renderAST;
function stringToDom(s) {
    return s.split(" ").map(function (word) {
        var node = document.createElement("div");
        node.textContent = word;
        node.classList.add("wordDiv");
        return node;
    });
}
function toggleCursorActive() {
    isCursorActive = !isCursorActive;
    if (isCursorActive) {
        cursorDiv.classList.add("blinking");
    }
    else {
        cursorDiv.classList.remove("blinking");
    }
}

},{"./lang":1}]},{},[2]);
