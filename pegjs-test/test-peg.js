"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var peg = require("pegjs");
var fs = require("fs");
var grammarString = fs.readFileSync("pegjs-grammar.txt", "utf8");
var parser = peg.generate(grammarString);
var r = parser.parse("while(1)do {  x  = 1+2}x=4");
var numTabs = 0;
var tabs = function () { return new Array(numTabs).map(function () { return '\t'; }).join(""); };
var incTabs = function () { return numTabs++; };
var decTabs = function () { return numTabs--; };
function operation(op) {
    console.log(tabs(), op);
}
function marker(label, thing) {
    console.log(tabs(), label, thing.constructor.name);
}
function callCodegen(thing) {
    if (Array.isArray(thing)) {
        thing.forEach(function (thing) { return callCodegen(thing); });
    }
    else {
        incTabs();
        marker('BEGIN', thing);
        codegens[thing.constructor.name](thing);
        marker('END', thing);
        decTabs();
    }
}
var Machine = (function () {
    function Machine(instructions) {
        var _this = this;
        this.instructions = instructions;
        this.stack = [];
        this.env = {};
        this.instructionPointer = 0;
        this.labelMap = {};
        this.instructions.forEach(function (instruction, index) {
            if (instruction instanceof LabelInstruction) {
                _this.labelMap[instruction.label] = index;
            }
        });
    }
    return Machine;
}());
var Instruction = (function () {
    function Instruction() {
    }
    return Instruction;
}());
var PushInstruction = (function (_super) {
    __extends(PushInstruction, _super);
    function PushInstruction(val) {
        _super.call(this);
        this.val = val;
    }
    return PushInstruction;
}(Instruction));
var BinOpInstruction = (function (_super) {
    __extends(BinOpInstruction, _super);
    function BinOpInstruction(op) {
        _super.call(this);
        this.op = op;
    }
    return BinOpInstruction;
}(Instruction));
var IfGotoInstruction = (function (_super) {
    __extends(IfGotoInstruction, _super);
    function IfGotoInstruction(label) {
        _super.call(this);
        this.label = label;
    }
    return IfGotoInstruction;
}(Instruction));
var LabelInstruction = (function (_super) {
    __extends(LabelInstruction, _super);
    function LabelInstruction(label) {
        _super.call(this);
        this.label = label;
    }
    return LabelInstruction;
}(Instruction));
var UnOpInstruction = (function (_super) {
    __extends(UnOpInstruction, _super);
    function UnOpInstruction(op) {
        _super.call(this);
        this.op = op;
    }
    return UnOpInstruction;
}(Instruction));
var SetInstruction = (function (_super) {
    __extends(SetInstruction, _super);
    function SetInstruction(key) {
        _super.call(this);
        this.key = key;
        console.log(key);
    }
    return SetInstruction;
}(Instruction));
var GetInstruction = (function (_super) {
    __extends(GetInstruction, _super);
    function GetInstruction(key) {
        _super.call(this);
        this.key = key;
    }
    return GetInstruction;
}(Instruction));
var codegens = {
    Integer: function (i) {
        operation("push " + i.value);
        addInstruction(new PushInstruction(i.value));
    },
    BinaryExpression: function (e) {
        callCodegen(e.left);
        callCodegen(e.right);
        operation(e.op);
        addInstruction(new BinOpInstruction(e.op));
    },
    AssignmentStatement: function (s) {
        callCodegen(s.expression);
        operation('set ' + s.ident.name);
        addInstruction(new SetInstruction(s.ident.name));
    },
    WhileStatement: function (s) {
        var whileBeginLabel = "whileBegin";
        var whileEndLabel = "whileEnd";
        operation('LABEL begin');
        addInstruction(new LabelInstruction(whileBeginLabel));
        callCodegen(s.condition);
        operation('if not goto end');
        addInstruction(new UnOpInstruction("!"));
        addInstruction(new IfGotoInstruction(whileEndLabel));
        s.statements.forEach(function (statement) { return callCodegen(statement); });
        operation('goto begin');
        addInstruction(new PushInstruction(1));
        addInstruction(new IfGotoInstruction(whileBeginLabel));
        operation('LABEL end');
        addInstruction(new LabelInstruction(whileEndLabel));
    }
};
var instructions = [];
function addInstruction(instruction) {
    instructions.push(instruction);
}
callCodegen(r);
var machine = new Machine(instructions);
console.log(machine);
