"use strict"

import * as ast from "./ast";

export type StackElement = any;

export class GlobalEnvChange {
  constructor(
    public key: string,
    public before: any,
    public after: any
  ) {}

  reverse() {
    return new GlobalEnvChange(this.key, this.after, this.before)
  }
}

export class StackFrameChange {
  constructor(
    public key: string,
    public before: any,
    public after: any,
    public frameNo: number
  ) {}

  reverse() {
    return new StackFrameChange(this.key, this.after, this.before, this.frameNo)
  }
}

export class InstructionRange {
    constructor(
      public start: number,
      public end: number
    ) {}

    withinRange(index: number) {
      if (this.end == null) return false;
      return index >= this.start && index < this.end;
    }
}

export class Environment {
  private mapping = {};

  public keys() {
    return Object.keys(this.mapping)
  }

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

export class StackFrame {
  stack: StackElement = []
  public stackEnvironment: Environment = new Environment()
  public returnAddress: number

  push(element: StackElement) {
    this.stack.push(element)
  }

  pop(): StackElement {
    return this.stack.pop()
  }

  peek(n?: number) {
    if (typeof(n) == 'number') {
      return this.stack.slice(0, n)
    }
    return this.stack[this.stack.length - 1];
  }  
}

export class Stack {
  stackFrames: StackFrame[] = []

  getElements() {
    return this.stackFrames.map(frame => frame.stack).reduce((l, r) => l.concat(r), [])
  }

  getFrames() {
    return this.stackFrames
  }

  getFrame(index: number) {
    return this.stackFrames[index]
  }

  pushStackFrame(stackFrame: StackFrame) {
    this.stackFrames.push(stackFrame)
  }

  popStackFrame() {
    return this.stackFrames.pop()
  }

  getTopStackFrame() {
    return this.stackFrames[this.getTopStackFrameIndex()]
  }

  getTopStackFrameIndex() {
    return this.stackFrames.length - 1
  }

  push(element: StackElement) {
    this.getTopStackFrame().push(element)
  }

  pop() {
    return this.getTopStackFrame().pop()
  }

  peek(n?: number) {
    return this.getTopStackFrame().peek(n)
  }
}

export class Machine {
  public instructions: Instruction[] = []

  public stack = new Stack()
  public globalEnvironment = new Environment()

  public instructionPointer = 0;
  public labelToIndexMap = {};
  public indexToLabelsMap = {};

  public changeHistory: MachineChange[] = [];

  public astInstructionRangeMap = new WeakMap<ast.ASTNode, InstructionRange>();
  public activeASTNodesAtIndices = []
  private currentlyActiveASTNodes = []

  constructor(ast: ast.ASTNode) {
    this.setAST(ast);
  }

  setAST(ast: ast.ASTNode) {
    this.instructions = [];
    this.labelToIndexMap = {}
    ast.codegen(this)
    this.indexToLabelsMap = this.getLabelIndices();
  }

  addInstruction(instruction: Instruction) {
    let index = this.instructions.length
    this.instructions.push(instruction)
    this.activeASTNodesAtIndices.push(this.currentlyActiveASTNodes.slice(0))
  }

  beginASTRange(ast: ast.ASTNode) {
    let index = this.instructions.length;
    this.astInstructionRangeMap.set(ast, new InstructionRange(index, null));
    this.currentlyActiveASTNodes.push(ast)
  }

  endASTRange(ast: ast.ASTNode) {
    let index = this.instructions.length;
    let range = this.astInstructionRangeMap.get(ast);
    range.end = index;
    this.currentlyActiveASTNodes.pop()
  }

  addLabel(label: string) {
    this.labelToIndexMap[label] = this.instructions.length;
  }

  getLabelIndices() {
    let indexToLabelMap = {}
    Object.keys(this.labelToIndexMap).forEach(label => {
      let index = this.labelToIndexMap[label];
      if (!indexToLabelMap[index]) {
        indexToLabelMap[index] = []
      }
      indexToLabelMap[index].push(label)
    })
    return indexToLabelMap
  }

  static isTruthy(val: StackElement) {
    console.log('isTruthy?', val);
    return !!val;
  }

  applyMachineChange(machineChange: MachineChange) {
    machineChange.stackFramePushed.forEach(pushed => {
      this.stack.pushStackFrame(pushed)
    })
    machineChange.stackFramePopped.forEach(poppped => {
      this.stack.popStackFrame()
    })
    machineChange.stackPopped.forEach(popped => {
      console.log('popping from stack', popped);
      this.stack.pop();
    })
    machineChange.stackPushed.forEach(pushed => {
      console.log('pushing onto stack', pushed);
      this.stack.push(pushed);
    })

    if (machineChange.stackFrameChanged) {
      let stackFrameChanged = machineChange.stackFrameChanged
      let changedFrame = this.stack.getFrame(stackFrameChanged.frameNo)
      let key = stackFrameChanged.key
      changedFrame[key] = stackFrameChanged.after
    }
    machineChange.stackFrameEnvChanged.forEach(changed => {
      let changedStackFrame = this.stack.getFrame(changed.frameNo)
      changedStackFrame.stackEnvironment.set(changed.key, changed.after)
    })
    machineChange.globalEnvChanged.forEach(changed => {
      let key = changed.key
      let newValue = changed.after
      this.globalEnvironment.set(key, newValue)
    })
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

  canContinue() {
    return this.instructionPointer < this.instructions.length - 1
  }

  canReverse() {
    return this.changeHistory.length
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

  oneStepBackward() {
    let lastChange = this.changeHistory.pop();
    console.log(lastChange)
    this.applyMachineChange(lastChange.reverse());
    this.instructionCount--;
  }

  getExecutingASTNode() {
    let activeNodesAtCurrentIndex = this.activeASTNodesAtIndices[this.instructionPointer]
    if (!activeNodesAtCurrentIndex.length) {
      return
    }
    return activeNodesAtCurrentIndex[activeNodesAtCurrentIndex.length - 1]
  }
}

class MachineChange {
  public stackPushed: StackElement[] = []
  public stackPopped: StackElement[] = []
  public stackFramePushed: StackFrame[] = []
  public stackFramePopped: StackFrame[] = []
  public stackFrameChanged: StackFrameChange
  public stackFrameEnvChanged: StackFrameChange[] = []
  public globalEnvChanged: GlobalEnvChange[] = []
  public ipChange: number = 1

  withStackPushed(elements: StackElement[]) {
    this.stackPushed = elements;
    return this;
  }

  withStackPopped(elements: StackElement[]) {
    this.stackPopped = elements;
    return this;
  }

  withStackFramePushed(frames: StackFrame[]) {
    this.stackFramePushed = frames;
    return this;
  }

  withStackFramePopped(frames: StackFrame[]) {
    this.stackFramePopped = frames;
    return this;
  }

  withStackFrameChanged(change: StackFrameChange) {
    this.stackFrameChanged = change
    return this
  }

  withStackFrameEnvChanged(change: StackFrameChange[]) {
    this.stackFrameEnvChanged = change
    return this
  }

  withGlobalEnvChanged(changes: GlobalEnvChange[]) {
    this.globalEnvChanged = changes;
    return this;
  }

  withIpChange(change: number) {
    this.ipChange = change;
    return this;
  }

  reverse() {
    return new MachineChange()
    .withStackPopped(this.stackPushed)
    .withStackPushed(this.stackPopped)
    .withStackFramePopped(this.stackFramePushed)
    .withStackFramePushed(this.stackFramePopped)
    .withGlobalEnvChanged(this.globalEnvChanged.map(change => change.reverse()))
    .withIpChange(-this.ipChange)
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

export class PushStackFrame extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withStackFramePushed([new StackFrame()])
  }
}

export class PopStackFrame extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withStackFramePopped([machine.stack.getTopStackFrame()])
  }
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
    .withStackPopped([machine.stack.peek()])
  }
}

export class Dup extends Instruction {
  constructor() {
    super()
  }

  machineChange(machine: Machine) {
    return new MachineChange()
    .withStackPushed(machine.stack.peek())
  }
}

export class CallFunction extends Instruction {
  constructor(public func: MachineFunction) {
    super()
  }

  machineChange(machine: Machine) {
    let arity = this.func.arity;
    let args = machine.stack.peek(arity);
    let poppedArray = args;
    let pushedArray = [this.func.apply(null, args)]
    console.log('arity', arity, 'args', args, 'popped', poppedArray, 'pushed', pushedArray);
    return new MachineChange()
    .withStackPushed(pushedArray)
    .withStackPopped(poppedArray)
  }
}

export class MethodCall extends Instruction {
  constructor(
    public name: string
  ) {
    super()
  }

  machineChange(machine: Machine) {
    let originalIp = machine.instructionPointer
    let newIP = machine.labelToIndexMap[this.name]
    let change = newIP - originalIp
    let currentFrameIndex = machine.stack.getTopStackFrameIndex()
    let currentFrame = machine.stack.getTopStackFrame()

    return new MachineChange()
    .withIpChange(change)
    .withStackFrameChanged(new StackFrameChange('returnAddress', currentFrame.returnAddress, originalIp, currentFrameIndex))
  }
}

export class Return extends Instruction {
  constructor(public withExpression: boolean) {
    super()
  }

  machineChange(machine: Machine) {
    let index = machine.stack.getTopStackFrameIndex()
    let currentFrame = machine.stack.getTopStackFrame()
    let lowerIndex = index - 1;
    let lowerFrame = machine.stack.getFrame(lowerIndex)
    let newIP = lowerFrame.returnAddress + 1
    let ipChange = newIP - machine.instructionPointer

    let change = new MachineChange()
    .withIpChange(ipChange)
    .withStackFramePopped([currentFrame])
    
    if (this.withExpression) {
      let stackTop = machine.stack.peek()
      change = change.withStackPushed([stackTop])
    }
    
    return change
  }
}

export class Goto extends Instruction {
  constructor(
    public label: string
  ) {
    super()
  }

  machineChange(machine: Machine) {
    let originalIP = machine.instructionPointer;
    let newIP = machine.labelToIndexMap[this.label];
    let change = newIP - originalIP;
    return new MachineChange()
    .withIpChange(change)
  }
}

export class IfGoto extends Instruction {
  constructor(public label: string) {
    super();
  }

  machineChange(machine: Machine) {
    console.log('machine.stack', machine.stack)
    let stackTop = machine.stack.peek();
    console.log('stackTop', stackTop);
    let isTruthy = Machine.isTruthy(stackTop);
    if (isTruthy) {
      let originalIP = machine.instructionPointer;
      let newIP = machine.labelToIndexMap[this.label];
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

export class Set extends Instruction {
  constructor(public key: string) {
    super();
  }

  machineChange(machine: Machine) {
    let index = machine.stack.getTopStackFrameIndex()
    console.log(`index: ${index}`)
    let env = machine.stack.getFrame(index).stackEnvironment;
    let before = env.get(this.key);
    let value = machine.stack.peek();
    let envChanged = new StackFrameChange(this.key, before, value, index);
    return new MachineChange()
    .withStackPopped([value])
    .withStackFrameEnvChanged([envChanged])
  }
}

export class Get extends Instruction {
  constructor(public key: string) {
    super();
  }

  machineChange(machine: Machine) {
    let index = machine.stack.getTopStackFrameIndex()
    let env = machine.stack.getFrame(index).stackEnvironment;
    let pushed = env.get(this.key);
    return new MachineChange()
    .withStackPushed([pushed])
  }
}
