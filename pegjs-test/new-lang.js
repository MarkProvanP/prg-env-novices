"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ASTNode = (function () {
    function ASTNode() {
    }
    return ASTNode;
}());
exports.ASTNode = ASTNode;
var Integer = (function (_super) {
    __extends(Integer, _super);
    function Integer(value) {
        _super.call(this);
        this.value = value;
    }
    return Integer;
}(ASTNode));
exports.Integer = Integer;
var BinaryExpression = (function (_super) {
    __extends(BinaryExpression, _super);
    function BinaryExpression(left, right, op) {
        _super.call(this);
        this.left = left;
        this.right = right;
        this.op = op;
    }
    return BinaryExpression;
}(ASTNode));
exports.BinaryExpression = BinaryExpression;
var AssignmentStatement = (function (_super) {
    __extends(AssignmentStatement, _super);
    function AssignmentStatement(ident, expression) {
        _super.call(this);
        this.ident = ident;
        this.expression = expression;
    }
    return AssignmentStatement;
}(ASTNode));
exports.AssignmentStatement = AssignmentStatement;
var WhileStatement = (function (_super) {
    __extends(WhileStatement, _super);
    function WhileStatement(condition, statements) {
        _super.call(this);
        this.condition = condition;
        this.statements = statements;
    }
    return WhileStatement;
}(ASTNode));
exports.WhileStatement = WhileStatement;
var Ident = (function (_super) {
    __extends(Ident, _super);
    function Ident(name) {
        _super.call(this);
        this.name = name;
    }
    return Ident;
}(ASTNode));
exports.Ident = Ident;
