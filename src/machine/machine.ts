import * as ast from "../ast";

import { Instruction } from "./instructions"
import { MachineChange } from "./changes"

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


export type StackElement = any;


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
