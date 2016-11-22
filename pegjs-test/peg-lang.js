"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var EnvElement = (function () {
    function EnvElement() {
        this.mapping = {};
    }
    EnvElement.prototype.get = function (key) {
        return this.mapping[key];
    };
    EnvElement.prototype.set = function (key, value) {
        this.mapping[key] = value;
    };
    EnvElement.prototype.hasKey = function (key) {
        console.log("checking if key: " + key + " exists in mapping:", this.mapping);
        return this.mapping.hasOwnProperty(key);
    };
    return EnvElement;
}());
exports.EnvElement = EnvElement;
var EnvChange = (function () {
    function EnvChange(key, before, after, envNo) {
        this.key = key;
        this.before = before;
        this.after = after;
        this.envNo = envNo;
    }
    return EnvChange;
}());
exports.EnvChange = EnvChange;
var Machine = (function () {
    function Machine(instructions) {
        var _this = this;
        this.instructions = instructions;
        this.stack = [];
        this.envStack = [];
        this.instructionPointer = 0;
        this.labelMap = {};
        this.changeHistory = [];
        this.instructionCount = 0;
        this.instructions.forEach(function (instruction, index) {
            if (instruction instanceof Label) {
                var labelInstruction = instruction;
                _this.labelMap[labelInstruction.label] = index;
            }
        });
    }
    Machine.prototype.peek = function (n) {
        if (typeof (n) == 'number') {
            return this.stack.slice(0, n);
        }
        return this.stack[this.stack.length - 1];
    };
    Machine.prototype.peekEnv = function () {
        return this.envStack[this.envStack.length - 1];
    };
    Machine.isTruthy = function (val) {
        console.log('isTruthy?', val);
        return !!val;
    };
    Machine.prototype.getIndexOfEnvWithKey = function (key) {
        for (var i = 0; i < this.envStack.length; i++) {
            var env = this.envStack[i];
            if (env.hasKey(key)) {
                return i;
            }
        }
        // If we haven't found it yet, just use the topmost env
        return this.envStack.length - 1;
    };
    Machine.prototype.applyMachineChange = function (machineChange) {
        var _this = this;
        machineChange.stackPopped.forEach(function (popped) {
            console.log('popping from stack', popped);
            _this.stack.pop();
        });
        machineChange.stackPushed.forEach(function (pushed) {
            console.log('pushing onto stack', pushed);
            _this.stack.push(pushed);
        });
        machineChange.envPopped.forEach(function (popped) {
            console.log('popping env from stack', popped);
            _this.envStack.pop();
        });
        machineChange.envPushed.forEach(function (pushed) {
            console.log('pushing env onto stack', pushed);
            _this.envStack.push(pushed);
        });
        if (machineChange.envChanged) {
            var envChanged = machineChange.envChanged;
            var changedEnv = this.envStack[envChanged.envNo];
            var key = envChanged.key;
            changedEnv[key] = envChanged.after;
            console.log("Setting: " + key + " to val: ", envChanged.after);
        }
        console.log("instruction pointer changing by " + machineChange.ipChange);
        this.instructionPointer += machineChange.ipChange;
    };
    Machine.prototype.execute = function () {
        while (this.instructionPointer < this.instructions.length) {
            console.log("Instruction count now: " + this.instructionCount);
            this.oneStepExecute();
        }
        console.log('execution complete');
    };
    Machine.prototype.oneStepExecute = function () {
        var ip = this.instructionPointer;
        var instruction = this.instructions[ip];
        console.log("IP: " + ip + ", instruction:", instruction);
        var change = instruction.machineChange(this);
        this.changeHistory.push(change);
        this.applyMachineChange(change);
        this.instructionCount++;
    };
    return Machine;
}());
exports.Machine = Machine;
var MachineChange = (function () {
    function MachineChange(stackPushed, stackPopped, envPushed, envPopped, envChanged, ipChange) {
        this.stackPushed = stackPushed;
        this.stackPopped = stackPopped;
        this.envPushed = envPushed;
        this.envPopped = envPopped;
        this.envChanged = envChanged;
        this.ipChange = ipChange;
    }
    MachineChange.create = function (_a) {
        var _b = _a.stackPushed, stackPushed = _b === void 0 ? [] : _b, _c = _a.stackPopped, stackPopped = _c === void 0 ? [] : _c, _d = _a.envPushed, envPushed = _d === void 0 ? [] : _d, _e = _a.envPopped, envPopped = _e === void 0 ? [] : _e, _f = _a.envChanged, envChanged = _f === void 0 ? undefined : _f, _g = _a.ipChange, ipChange = _g === void 0 ? 0 : _g;
        return new MachineChange(stackPushed, stackPopped, envPushed, envPopped, envChanged, ipChange);
    };
    return MachineChange;
}());
exports.MachineChange = MachineChange;
var MachineFunction = (function () {
    function MachineFunction(name, arity, code) {
        this.name = name;
        this.arity = arity;
        this.code = code;
    }
    MachineFunction.prototype.apply = function (fThis, fArgs) {
        return this.code.apply(fThis, fArgs);
    };
    return MachineFunction;
}());
exports.MachineFunction = MachineFunction;
exports.builtInFunctions = {
    '+': new MachineFunction('add', 2, function (a, b) { return a + b; }),
    '-': new MachineFunction('subtract', 2, function (a, b) { return a - b; }),
    '*': new MachineFunction('multiply', 2, function (a, b) { return a * b; }),
    '/': new MachineFunction('divide', 2, function (a, b) { return a / b; }),
    '!': new MachineFunction('not', 1, function (a) { return !a; })
};
var Instruction = (function () {
    function Instruction() {
    }
    return Instruction;
}());
exports.Instruction = Instruction;
var Push = (function (_super) {
    __extends(Push, _super);
    function Push(val) {
        _super.call(this);
        this.val = val;
    }
    Push.prototype.machineChange = function (machine) {
        return MachineChange.create({ stackPushed: [this.val], ipChange: 1 });
    };
    return Push;
}(Instruction));
exports.Push = Push;
var Pop = (function (_super) {
    __extends(Pop, _super);
    function Pop() {
        _super.call(this);
    }
    Pop.prototype.machineChange = function (machine) {
        return MachineChange.create({ stackPopped: [machine.peek()], ipChange: 1 });
    };
    return Pop;
}(Instruction));
exports.Pop = Pop;
var Dup = (function (_super) {
    __extends(Dup, _super);
    function Dup() {
        _super.call(this);
    }
    Dup.prototype.machineChange = function (machine) {
        return MachineChange.create({ stackPushed: [machine.peek()], ipChange: 1 });
    };
    return Dup;
}(Instruction));
exports.Dup = Dup;
var NewEnv = (function (_super) {
    __extends(NewEnv, _super);
    function NewEnv() {
        _super.call(this);
    }
    NewEnv.prototype.machineChange = function (machine) {
        return MachineChange.create({ envPushed: [new EnvElement()], ipChange: 1 });
    };
    return NewEnv;
}(Instruction));
exports.NewEnv = NewEnv;
var PopEnv = (function (_super) {
    __extends(PopEnv, _super);
    function PopEnv() {
        _super.call(this);
    }
    PopEnv.prototype.machineChange = function (machine) {
        return MachineChange.create({ envPopped: [machine.peekEnv()], ipChange: 1 });
    };
    return PopEnv;
}(Instruction));
exports.PopEnv = PopEnv;
var CallFunction = (function (_super) {
    __extends(CallFunction, _super);
    function CallFunction(func) {
        _super.call(this);
        this.func = func;
    }
    CallFunction.prototype.machineChange = function (machine) {
        var arity = this.func.arity;
        var args = machine.peek(arity);
        var poppedArray = [this.func].concat(args);
        var pushedArray = [this.func.apply(null, args)];
        console.log('arity', arity, 'args', args, 'popped', poppedArray, 'pushed', pushedArray);
        return MachineChange.create({ stackPushed: pushedArray, stackPopped: poppedArray, ipChange: 1 });
    };
    return CallFunction;
}(Instruction));
exports.CallFunction = CallFunction;
var IfGoto = (function (_super) {
    __extends(IfGoto, _super);
    function IfGoto(label) {
        _super.call(this);
        this.label = label;
    }
    IfGoto.prototype.machineChange = function (machine) {
        console.log('machine.stack', machine.stack);
        var stackTop = machine.peek();
        console.log('stackTop', stackTop);
        var isTruthy = Machine.isTruthy(stackTop);
        if (isTruthy) {
            var originalIP = machine.instructionPointer;
            var newIP = machine.labelMap[this.label];
            var change = newIP - originalIP;
            return MachineChange.create({ stackPopped: [stackTop], ipChange: change });
        }
        else {
            return MachineChange.create({ stackPopped: [stackTop], ipChange: 1 });
        }
    };
    return IfGoto;
}(Instruction));
exports.IfGoto = IfGoto;
var Label = (function (_super) {
    __extends(Label, _super);
    function Label(label) {
        _super.call(this);
        this.label = label;
    }
    Label.prototype.machineChange = function (machine) {
        return MachineChange.create({ ipChange: 1 });
    };
    return Label;
}(Instruction));
exports.Label = Label;
var Set = (function (_super) {
    __extends(Set, _super);
    function Set(key) {
        _super.call(this);
        this.key = key;
    }
    Set.prototype.machineChange = function (machine) {
        var index = machine.getIndexOfEnvWithKey(this.key);
        console.log("index: " + index);
        var env = machine.envStack[index];
        var before = env.get(this.key);
        var value = machine.peek();
        var envChanged = new EnvChange(this.key, before, value, index);
        return MachineChange.create({ stackPopped: [value], envChanged: envChanged, ipChange: 1 });
    };
    return Set;
}(Instruction));
exports.Set = Set;
var Get = (function (_super) {
    __extends(Get, _super);
    function Get(key) {
        _super.call(this);
        this.key = key;
    }
    Get.prototype.machineChange = function (machine) {
        var index = machine.getIndexOfEnvWithKey(this.key);
        var env = machine.envStack[index];
        var pushed = env.get(this.key);
        return MachineChange.create({ stackPushed: [pushed], ipChange: 1 });
    };
    return Get;
}(Instruction));
exports.Get = Get;
var ASTBegin = (function (_super) {
    __extends(ASTBegin, _super);
    function ASTBegin(ast) {
        _super.call(this);
        this.ast = ast;
    }
    ASTBegin.prototype.machineChange = function (machine) {
        return MachineChange.create({ ipChange: 1 });
    };
    return ASTBegin;
}(Instruction));
exports.ASTBegin = ASTBegin;
var ASTEnd = (function (_super) {
    __extends(ASTEnd, _super);
    function ASTEnd(ast) {
        _super.call(this);
        this.ast = ast;
    }
    ASTEnd.prototype.machineChange = function (machine) {
        return MachineChange.create({ ipChange: 1 });
    };
    return ASTEnd;
}(Instruction));
exports.ASTEnd = ASTEnd;
function generateInstructions(ast) {
    var instructions = [];
    instructions.push(new NewEnv());
    callCodegen(ast, instructions);
    return instructions;
}
exports.generateInstructions = generateInstructions;
function callCodegen(thing, instructions) {
    if (Array.isArray(thing)) {
        thing.forEach(function (thing) { return callCodegen(thing, instructions); });
    }
    else {
        codegens[thing.constructor.name](thing, instructions);
    }
    return instructions;
}
var codegens = {
    Integer: function (i, instructions) {
        instructions.push(new ASTBegin(i));
        instructions.push(new Push(i.value));
        instructions.push(new ASTEnd(i));
    },
    BinaryExpression: function (e, instructions) {
        instructions.push(new ASTBegin(e));
        callCodegen(e.left, instructions);
        callCodegen(e.right, instructions);
        instructions.push(new CallFunction(exports.builtInFunctions[e.op]));
        instructions.push(new ASTEnd(e));
    },
    AssignmentStatement: function (s, instructions) {
        instructions.push(new ASTBegin(s));
        callCodegen(s.expression, instructions);
        instructions.push(new Set(s.ident.name));
        instructions.push(new ASTEnd(s));
    },
    WhileStatement: function (s, instructions) {
        instructions.push(new ASTBegin(s));
        var whileBeginLabel = "whileBegin";
        var whileEndLabel = "whileEnd";
        instructions.push(new Label(whileBeginLabel));
        callCodegen(s.condition, instructions);
        instructions.push(new CallFunction(exports.builtInFunctions['!']));
        instructions.push(new IfGoto(whileEndLabel));
        s.statements.forEach(function (statement) { return callCodegen(statement, instructions); });
        instructions.push(new Push(1));
        instructions.push(new IfGoto(whileBeginLabel));
        instructions.push(new Label(whileEndLabel));
        instructions.push(new ASTEnd(s));
    }
};
