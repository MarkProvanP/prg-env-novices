import { StackElement, StackFrame } from "./machine"

export class MachineChange {
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