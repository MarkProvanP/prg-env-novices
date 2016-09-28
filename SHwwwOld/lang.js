"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Expression = (function () {
    function Expression() {
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
        left = Expression.parse(p);
        for (i = p.getToken().getPrecedence(); i >= k; i--) {
            while (p.getToken().getPrecedence() === i) {
                operator = p.getToken().operator;
                p.advanceToken();
                right = Expression.fraserHanson(i + 1, p);
                left = new BinaryExpression(left, right, operator);
            }
        }
        return left;
    };
    return Expression;
}());
exports.Expression = Expression;
var BinaryExpression = (function (_super) {
    __extends(BinaryExpression, _super);
    function BinaryExpression(leftExpr, rightExpr, operator) {
        _super.call(this);
        this.leftExpr = leftExpr;
        this.rightExpr = rightExpr;
        this.operator = operator;
    }
    return BinaryExpression;
}(Expression));
exports.BinaryExpression = BinaryExpression;
var PrimaryExpression = (function (_super) {
    __extends(PrimaryExpression, _super);
    function PrimaryExpression(value) {
        _super.call(this);
        this.value = value;
    }
    return PrimaryExpression;
}(Expression));
exports.PrimaryExpression = PrimaryExpression;
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
    return OperatorToken;
}(Token));
exports.OperatorToken = OperatorToken;
var NumToken = (function (_super) {
    __extends(NumToken, _super);
    function NumToken(value) {
        _super.call(this);
        this.value = value;
    }
    return NumToken;
}(Token));
exports.NumToken = NumToken;
function lex(s) {
    var tokens = [];
    for (var i = 0; i < s.length; i++) {
        var t = null;
        var c = s[i];
        if (parseInt(c) !== NaN) {
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
    return Parser;
}());
exports.Parser = Parser;
