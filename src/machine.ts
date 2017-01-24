"use strict"

import * as lang from "./lang";

export type StackElement = any;

export class EnvElement {
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

export class EnvChange {
  constructor(
    public key: string,
    public before: any,
    public after: any,
    public envNo: number
  ) {}
}

export class Machine {
  public stack = [];
  public envStack = []

  public instructionPointer = 0;
  public labelMap = {};

  public changeHistory: MachineChange[] = [];

  constructor(public instructions: Instruction[]) {
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
  public stackPushed: StackElement[]
  public stackPopped: StackElement[]
  public envPushed: EnvElement[]
  public envPopped: EnvElement[]
  public envChanged: EnvChange
  public ipChange: number = 1

  withStackPushed(elements: StackElement[]) {
    this.stackPushed = elements;
    return this;
  }

  withStackPopped(elements: StackElement[]) {
    this.stackPopped = elements;
    return this;
  }

  withEnvPushed(elements: EnvElement[]) {
    this.envPushed = elements;
    return this;
  }

  withEnvPopped(elements: EnvElement[]) {
    this.envPopped = elements;
    return this;
  }

  withEnvChanged(change: EnvChange) {
    this.envChanged = change;
    return this;
  }

  withIpChange(change: number) {
    this.ipChange = change;
    return this;
  }
}

export class MachineFunction {
  constructor(
    public name: string,
    public arity: number,
    private code
  ) {}

  apply(fThis, fArgs) {
    return this.code.apply(fThis, fArgs)
  }
}

export let builtInFunctions = {
  '+': new MachineFunction('add', 2, (a, b) => a + b),
  '-': new MachineFunction('subtract', 2, (a, b) => a - b),
  '*': new MachineFunction('multiply', 2, (a, b) => a * b),
  '/': new MachineFunction('divide', 2, (a, b) => a / b),
  '!': new MachineFunction('not', 1, (a) => !a)
}

export abstract class Instruction {
  abstract machineChange(machine: Machine): MachineChange;
}

export class Push extends Instruction {
  constructor(public val: StackElement) {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withStackPushed([this.val])
  }
}

export class Pop extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withStackPopped([machine.peek()])
  }
}

export class Dup extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withStackPushed(machine.peek())
  }
}

export class NewEnv extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withEnvPushed([new EnvElement()])
  }
}

export class PopEnv extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withEnvPopped([machine.peekEnv()])
  }
}

export class CallFunction extends Instruction {
  constructor(private func: MachineFunction) {
    super()
  }

  machineChange(machine: Machine) {
    let arity = this.func.arity;
    let args = machine.peek(arity);
    let poppedArray = [this.func].concat(args)
    let pushedArray = [this.func.apply(null, args)]
    console.log('arity', arity, 'args', args, 'popped', poppedArray, 'pushed', pushedArray);
    return new MachineChange()
    .withStackPushed(pushedArray)
    .withStackPopped(poppedArray)
  }
}

export class IfGoto extends Instruction {
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
      return new MachineChange()
      .withStackPopped([stackTop])
      .withIpChange(change)
    } else {
      return new MachineChange()
      .withStackPopped([stackTop])
    }
  }
}

export class Label extends Instruction {
  constructor(public label) {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange();
  }
}

export class Set extends Instruction {
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
    return new MachineChange()
    .withStackPopped([value])
    .withEnvChanged(envChanged)
  }
}

export class Get extends Instruction {
  constructor(public key) {
    super();
  }

  machineChange(machine: Machine) {
    let index = machine.getIndexOfEnvWithKey(this.key);
    let env = machine.envStack[index];
    let pushed = env.get(this.key);
    return new MachineChange()
    .withStackPushed([pushed])
  }
}

export class ASTBegin extends Instruction {
  constructor(public ast) {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange();
  }
}

export class ASTEnd extends Instruction {
  constructor(public ast) {
    super();
  }

  machineChange(machine: Machine) {
    return new MachineChange();
  }
}


export function generateInstructions(ast) {
  let instructions = []
  instructions.push(new NewEnv());
  callCodegen(ast, instructions);
  return instructions;
}


function callCodegen(thing, instructions) {
  if (Array.isArray(thing)) {
    thing.forEach(thing => callCodegen(thing, instructions))
  } else if (thing.constructor.name == 'Statements') {
    thing.statements.forEach(statement => callCodegen(statement, instructions))
  } else {
    codegens[thing.constructor.name](thing, instructions)
  }
  return instructions;
}

let codegens = {
  Integer: function(i, instructions) {
    instructions.push(new ASTBegin(i))
    instructions.push(new Push(i.value))
    instructions.push(new ASTEnd(i));
  },
  BinaryExpression: function(e, instructions) {
    instructions.push(new ASTBegin(e));
    callCodegen(e.left, instructions);
    callCodegen(e.right, instructions);
    instructions.push(new CallFunction(builtInFunctions[e.op]))
    instructions.push(new ASTEnd(e));
  },
  AssignmentStatement: function(s, instructions) {
    instructions.push(new ASTBegin(s));
    callCodegen(s.expression, instructions);
    instructions.push(new Set(s.ident.name));
    instructions.push(new ASTEnd(s));
  },
  WhileStatement: function(s, instructions) {
    instructions.push(new ASTBegin(s));
    let whileBeginLabel = "whileBegin";
    let whileEndLabel = "whileEnd";
    instructions.push(new Label(whileBeginLabel))
    callCodegen(s.condition, instructions);
    instructions.push(new CallFunction(builtInFunctions['!']))
    instructions.push(new IfGoto(whileEndLabel))
    callCodegen(s.statements, instructions);
    instructions.push(new Push(1))
    instructions.push(new IfGoto(whileBeginLabel));
    instructions.push(new Label(whileEndLabel))
    instructions.push(new ASTEnd(s));
  }
}