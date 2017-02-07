import { Machine, StackFrame, StackElement } from "./index"

import { MachineChange, StackFrameChange } from "./changes"

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
