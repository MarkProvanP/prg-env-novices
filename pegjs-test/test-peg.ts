"use strict"

import * as peg from "pegjs";
import * as fs from "fs";

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

type StackElement = any;

class EnvElement {
  mapping = {};

  public get(key: string) {
    return this.mapping[key];
  }

  public set(key: string, value: any) {
    this.mapping[key] = value;
  }

  hasKey(key: string) {
    console.log(`checking if key: ${key} exists in mapping:`, this.mapping)
    return this.mapping.hasOwnProperty(key);
  }
}

class EnvChange {
  constructor(
    public key: string,
    public before: any,
    public after: any,
    public envNo: number
  ) {}
}

class Machine {
  public stack = [];
  public envStack = []

  public instructionPointer = 0;
  public labelMap = {};

  public changeHistory: MachineChange[] = [];

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

  static isTruthy(val: StackElement) {
    console.log('isTruthy?', val);
    return !!val;
  }

  getIndexOfEnvWithKey(key: string) {
    for (let i = 0; i < this.envStack.length; i++) {
      let env = this.envStack[i];
      if (env.hasKey(key)) {
        return i;
      }
    }
    // If we haven't found it yet, just use the topmost env
    return this.envStack.length - 1;
  }

  applyMachineChange(machineChange: MachineChange) {
    machineChange.stackPopped.forEach(popped => {
      console.log('popping from stack', popped);
      this.stack.pop();
    })
    machineChange.stackPushed.forEach(pushed => {
      console.log('pushing onto stack', pushed);
      this.stack.push(pushed);
    })
    machineChange.envPopped.forEach(popped => {
      console.log('popping env from stack', popped)
      this.envStack.pop();
    })
    machineChange.envPushed.forEach(pushed => {
      console.log('pushing env onto stack', pushed);
      this.envStack.push(pushed);
    })
    if (machineChange.envChanged) {
      let envChanged = machineChange.envChanged;
      let changedEnv = this.envStack[envChanged.envNo];
      let key = envChanged.key;
      changedEnv[key] = envChanged.after;
      console.log(`Setting: ${key} to val: `, envChanged.after);
    }
    console.log(`instruction pointer changing by ${machineChange.ipChange}`)
    this.instructionPointer += machineChange.ipChange;
  }

  instructionCount = 0;

  execute() {
    while (this.instructionPointer < this.instructions.length) {
      console.log(`Instruction count now: ${this.instructionCount}`)
      this.oneStepExecute();
    }
    console.log('execution complete');
  }

  oneStepExecute() {
    let ip = this.instructionPointer;
    let instruction = this.instructions[ip];
    console.log(`IP: ${ip}, instruction:`, instruction)
    let change = instruction.machineChange(this);
    this.changeHistory.push(change);
    this.applyMachineChange(change);
    this.instructionCount++;
  }
}

class MachineChange {
  constructor(
    public stackPushed: StackElement[],
    public stackPopped: StackElement[],
    public envPushed: EnvElement[],
    public envPopped: EnvElement[],
    public envChanged: EnvChange,
    public ipChange: number
  ) {

  }

  static create({stackPushed = [], stackPopped = [], envPushed = [], envPopped = [], envChanged = undefined, ipChange = 0}) {
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
    return MachineChange.create({stackPushed: [this.val], ipChange: 1})
  }
}

class Pop extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({stackPopped: [machine.peek()], ipChange: 1})
  }
}

class Dup extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({stackPushed: [machine.peek()], ipChange: 1})
  }
}

class NewEnv extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({envPushed: [new EnvElement()], ipChange: 1})
  }
}

class PopEnv extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({envPopped: [machine.peekEnv()], ipChange: 1})
  }
}

class CallFunction extends Instruction {
  constructor(private func: MachineFunction) {
    super()
  }

  machineChange(machine: Machine) {
    let arity = this.func.arity;
    let args = machine.peek(arity);
    let poppedArray = [this.func].concat(args)
    let pushedArray = [this.func.apply(null, args)]
    console.log('arity', arity, 'args', args, 'popped', poppedArray, 'pushed', pushedArray);
    return MachineChange.create({stackPushed: pushedArray, stackPopped: poppedArray, ipChange: 1})
  }
}

class IfGoto extends Instruction {
  constructor(public label) {
    super();
  }

  machineChange(machine: Machine) {
    console.log('machine.stack', machine.stack)
    let stackTop = machine.peek();
    console.log('stackTop', stackTop);
    let isTruthy = Machine.isTruthy(stackTop);
    if (isTruthy) {
      let originalIP = machine.instructionPointer;
      let newIP = machine.labelMap[this.label];
      let change = newIP - originalIP;
      return MachineChange.create({stackPopped: [stackTop], ipChange: change})
    } else {
      return MachineChange.create({stackPopped: [stackTop], ipChange: 1})
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
    console.log(`index: ${index}`)
    let env = machine.envStack[index];
    let before = env.get(this.key);
    let value = machine.peek();
    let envChanged = new EnvChange(this.key, before, value, index);
    return MachineChange.create({stackPopped: [value], envChanged: envChanged, ipChange: 1})
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
    return MachineChange.create({stackPushed: [pushed], ipChange: 1})
  }
}

class ASTBegin extends Instruction {
  constructor(public ast) {
    super()
  }

  machineChange(machine: Machine) {
    return MachineChange.create({ipChange: 1});
  }
}

class ASTEnd extends Instruction {
  constructor(public ast) {
    super();
  }

  machineChange(machine: Machine) {
    return MachineChange.create({ipChange: 1});
  }
}

let codegens = {
  Integer: function(i) {
    addInstruction(new ASTBegin(i))
    operation("push " + i.value);
    addInstruction(new Push(i.value))
    addInstruction(new ASTEnd(i));
  },
  BinaryExpression: function(e) {
    addInstruction(new ASTBegin(e));
    callCodegen(e.left);
    callCodegen(e.right);
    operation(e.op);
    addInstruction(new CallFunction(builtInFunctions[e.op]))
    addInstruction(new ASTEnd(e));
  },
  AssignmentStatement: function(s) {
    addInstruction(new ASTBegin(s));
    callCodegen(s.expression);
    operation('set ' + s.ident.name);
    addInstruction(new Set(s.ident.name));
    addInstruction(new ASTEnd(s));
  },
  WhileStatement: function(s) {
    addInstruction(new ASTBegin(s));
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
    addInstruction(new ASTEnd(s));
  }
}

let instructions = []

instructions.push(new NewEnv());

function addInstruction(instruction: Instruction) {
  instructions.push(instruction);
}

callCodegen(r);

let machine = new Machine(instructions);

console.log(machine);

machine.execute()
