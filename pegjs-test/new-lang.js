"use strict";
var Integer = (function () {
    function Integer(value) {
        this.value = value;
    }
    return Integer;
}());
exports.Integer = Integer;
var BinaryExpression = (function () {
    function BinaryExpression(left, right, op) {
        this.left = left;
        this.right = right;
        this.op = op;
    }
    return BinaryExpression;
}());
exports.BinaryExpression = BinaryExpression;
var AssignmentStatement = (function () {
    function AssignmentStatement(ident, expression) {
        this.ident = ident;
        this.expression = expression;
    }
    return AssignmentStatement;
}());
exports.AssignmentStatement = AssignmentStatement;
var WhileStatement = (function () {
    function WhileStatement(condition, statements) {
        this.condition = condition;
        this.statements = statements;
    }
    return WhileStatement;
}());
exports.WhileStatement = WhileStatement;
var Ident = (function () {
    function Ident(name) {
        this.name = name;
    }
    return Ident;
}());
exports.Ident = Ident;
