import * as ast from "../ast";

import { Instruction, Terminate } from "./instructions"
import { MachineChange } from "./changes"

export class Machine {
  public instructions: Instruction[] = []
  instructionCount = 0;
  public instructionPointer = 0;

  public stack = new Stack()
  public globalEnvironment = new Environment()

  public changeHistory: MachineChange[] = [];

  public labelToIndexMap = {};
  public indexToLabelsMap = {};
  public astInstructionRangeMap = new WeakMap<ast.ASTNode, InstructionRange>();
  public activeASTNodesAtIndices = []
  private currentlyActiveASTNodes = []

  public textConsole: Console = new Console()

  constructor(ast: ast.ASTNode, private languageDefinition: ast.LanguageDefinition) {
    this.setAST(ast);
  }

  setAST(ast: ast.ASTNode) {
    this.instructions = []
    this.labelToIndexMap = {}
    this.indexToLabelsMap = {}
    this.activeASTNodesAtIndices = []
    this.currentlyActiveASTNodes = []

    ast.codegen(this)
    this.indexToLabelsMap = this.getLabelIndices() 
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
    machineChange.changes.forEach(change => change.apply(this))
    this.instructionPointer += machineChange.ipChange;
  }

  execute() {
    while (this.instructionPointer < this.instructions.length) {
      console.log(`Instruction count now: ${this.instructionCount}`)
      this.oneStepExecute();
    }
    console.log('execution complete');
  }

  canContinue() {
    return !(this.instructions[this.instructionPointer] instanceof Terminate)
  }

  canReverse() {
    return this.instructionCount
  }

  oneStepExecute() {
    let ip = this.instructionPointer;
    let instruction = this.instructions[ip];
    console.log(`IP: ${ip}, instruction:`, instruction)
    let change = instruction.machineChange(this);
    console.log('change', change);
    this.changeHistory.push(change);
    this.applyMachineChange(change);
    this.instructionCount++;
  }

  oneStepBackward() {
    let lastChange = this.changeHistory.pop();
    console.log('Original change', lastChange)
    let reversed = lastChange.reverse()
    console.log('Reversed change', reversed)
    this.applyMachineChange(reversed);
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

export class Console {
  text: string
  
  getText() {
    return this.text
  }

  addText(text: string) {
    this.text += text
  }

  removeText(chars) {
    this.text = this.text.substr(0, this.text.length - chars)
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
    if (value === undefined) {
      delete this.mapping[key]
    } else {
      this.mapping[key] = value;
    }
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

  constructor(public args: StackElement[]) {

  }

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
