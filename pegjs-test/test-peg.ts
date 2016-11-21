"use strict"

let peg = require("pegjs")
let fs = require("fs")

let grammarString = fs.readFileSync("pegjs-grammar.txt", "utf8");

let parser = peg.generate(grammarString);

let r = parser.parse("while(1)do {  x  = 1+2}x=4");

let numTabs = 0;

let tabs = () => new Array(numTabs).map(() => '\t').join("")
let incTabs = () => numTabs++;
let decTabs = () => numTabs--;

function operation(op) {
  console.log(tabs(), op)
}


function marker(label, thing) {
  console.log(tabs(), label, thing.constructor.name);
}

function callCodegen(thing) {
  if (Array.isArray(thing)) {
    thing.forEach(thing => callCodegen(thing))
  } else {
    incTabs();
    marker('BEGIN', thing)
    codegens[thing.constructor.name](thing)
    marker('END', thing)
    decTabs();
  }
}

class StackElement {

}

class EnvElement {
  mapping: {};

  public get(key: string) {
    return this.mapping[key];
  }

  public set(key: string, value: any) {
    this.mapping[key] = value;
  }

  hasKey(key: string) {
    return this.mapping.hasOwnProperty(key);
  }
}

class EnvChange {
  constructor(public key: string, before: any, after: any, envNo: number) {}
}

class Machine {
  public stack = [];
  public envStack = []

  public instructionPointer = 0;
  public labelMap = {};

  constructor(private instructions: Instruction[]) {
    this.instructions.forEach((instruction, index) => {
      if (instruction instanceof Label) {
        let labelInstruction = <Label> instruction;
        this.labelMap[labelInstruction.label] = index;
      }
    })
  }

  peek(n?: number) {
    if (typeof(n) == 'number') {
      return this.stack.slice(0, n)
    }
    return this.stack[this.stack.length - 1];
  }

  peekEnv() {
    return this.envStack[this.envStack.length - 1];
  }

  static isTruthy(val) {
    return !!val;
  }

  getIndexOfEnvWithKey(key: string) {
    for (let i = 0; i < this.envStack.length; i++) {
      let env = this.envStack[i];
      if (env.hasKey(key)) {
        return i;
      }
    }
  }
}

class MachineChange {
  constructor(
    private stackPushed: StackElement[],
    private stackPopped: StackElement[],
    private envPushed: EnvElement[],
    private envPopped: EnvElement[],
    private envChanged: EnvChange,
    private ipChange: number
  ) {

  }

  static create({stackPushed = undefined, stackPopped = undefined, envPushed = undefined, envPopped = undefined, envChanged = undefined, ipChange = undefined}) {
    return new MachineChange(stackPushed, stackPopped, envPushed, envPopped, envChanged, ipChange);
  }
}

class MachineFunction {
  constructor(
    public name: string,
    public arity: number,
    private code
  ) {}

  apply(fThis, fArgs) {
    return this.code.apply(fThis, fArgs)
  }
}

let builtInFunctions = {
  '+': new MachineFunction('add', 2, (a, b) => a + b),
  '-': new MachineFunction('subtract', 2, (a, b) => a - b),
  '*': new MachineFunction('multiply', 2, (a, b) => a * b),
  '/': new MachineFunction('divide', 2, (a, b) => a / b),
  '!': new MachineFunction('not', 1, (a) => !a)
}

abstract class Instruction {
  abstract machineChange(machine: Machine): MachineChange;
}

class Push extends Instruction {
  constructor(public val: StackElement) {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({stackPushed: this.val, ipChange: 1})
  }
}

class Pop extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({stackPopped: machine.peek(), ipChange: 1})
  }
}

class Dup extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({stackPushed: machine.peek(), ipChange: 1})
  }
}

class NewEnv extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({envPushed: new EnvElement(), ipChange: 1})
  }
}

class PopEnv extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({envPopped: machine.peekEnv(), ipChange: 1})
  }
}

class CallFunction extends Instruction {
  constructor(private func: MachineFunction) {
    super()
  }

  machineChange(machine: Machine) {
    let arity = this.func.arity;
    let args = machine.peek(arity);
    let popped = [this.func].concat(args)
    let pushed = [this.func.apply(null, args)]
    return MachineChange.create({stackPushed: pushed, stackPopped: popped, ipChange: 1})
  }
}

class IfGoto extends Instruction {
  constructor(public label) {
    super();
  }

  machineChange(machine: Machine) {
    let stackTop = machine.peek();
    let isTruthy = Machine.isTruthy(stackTop);
    if (isTruthy) {
      let originalIP = machine.instructionPointer;
      let newIP = machine.labelMap[this.label];
      let change = newIP - originalIP;
      return MachineChange.create({stackPopped: stackTop, ipChange: change})
    } else {
      return MachineChange.create({stackPopped: stackTop, ipChange: 1})
    }
  }
}

class Label extends Instruction {
  constructor(public label) {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({ipChange: 1})
  }
}

class Set extends Instruction {
  constructor(public key) {
    super();
  }

  machineChange(machine: Machine) {
    let index = machine.getIndexOfEnvWithKey(this.key);
    let env = machine.envStack[index];
    let before = env.get(this.key);
    let value = machine.peek();
    let envChanged = new EnvChange(this.key, before, value, index);
    return MachineChange.create({stackPopped: value, envChanged: envChanged, ipChange: 1})
  }
}

class Get extends Instruction {
  constructor(public key) {
    super();
  }

  machineChange(machine: Machine) {
    let index = machine.getIndexOfEnvWithKey(this.key);
    let env = machine.envStack[index];
    let pushed = env.get(this.key);
    return MachineChange.create({stackPushed: pushed, ipChange: 1})
  }
}

let codegens = {
  Integer: function(i) {
    operation("push " + i.value);
    addInstruction(new Push(i.value))
  },
  BinaryExpression: function(e) {
    callCodegen(e.left);
    callCodegen(e.right);
    operation(e.op);
    addInstruction(new CallFunction(builtInFunctions[e.op]))
  },
  AssignmentStatement: function(s) {
    callCodegen(s.expression);
    operation('set ' + s.ident.name);
    addInstruction(new Set(s.ident.name));
  },
  WhileStatement: function(s) {
    let whileBeginLabel = "whileBegin";
    let whileEndLabel = "whileEnd";
    operation('LABEL begin')
    addInstruction(new Label(whileBeginLabel))
    callCodegen(s.condition);
    operation('if not goto end');
    addInstruction(new CallFunction(builtInFunctions['!']))
    addInstruction(new IfGoto(whileEndLabel))
    s.statements.forEach((statement) => callCodegen(statement));
    operation('goto begin')
    addInstruction(new Push(1))
    addInstruction(new IfGoto(whileBeginLabel));
    operation('LABEL end');
    addInstruction(new Label(whileEndLabel))
  }
}

let instructions = []

function addInstruction(instruction: Instruction) {
  instructions.push(instruction);
}

callCodegen(r);

let machine = new Machine(instructions);

console.log(machine);
