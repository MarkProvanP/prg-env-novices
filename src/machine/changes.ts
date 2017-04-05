import { Machine, StackElement, StackFrame } from "./machine"

export class MachineChange {
    constructor(
        public changes: MachineComponentChange[] = [],
        public ipChange: number = 1
    ) {}

    withStackPushed(elements: StackElement[]) {
        this.changes.push(new StackPushChange(elements))
        return this;
    }

    withStackPopped(elements: StackElement[]) {
        this.changes.push(new StackPopChange(elements))
        return this;
    }

    withStackFramePushed(frame: StackFrame) {
        this.changes.push(new StackFramePushChange(frame))
        return this;
    }

    withStackFramePopped(frame: StackFrame) {
        this.changes.push(new StackFramePopChange(frame))
        return this;
    }

    withStackFrameChanged(
        key: string,
        before: any,
        after: any,
        frameNo: number
    ) {
        this.changes.push(new StackFrameChange(key, before, after, frameNo))
        return this
    }

    withStackFrameEnvChanged(
        key: string,
        before: any,
        after: any,
        frameNo: number
    ) {
        this.changes.push(new StackFrameEnvChange(key, before, after, frameNo))
        return this
    }

    withGlobalEnvChanged(
        key: string,
        before: any,
        after: any,
        frameNo: number
    ) {
        this.changes.push(new GlobalEnvChange(key, before, after))
        return this;
    }

    withConsoleChanged(
        added: string,
        removed: string
    ) {
        this.changes.push(new ConsoleChange(added, removed))
        return this
    }

    withIpChange(change: number) {
        this.ipChange = change;
        return this;
    }

    reverse() {
        let reversedChanges = this.changes.map(change => change.reverse())
        return new MachineChange(reversedChanges.reverse(), -this.ipChange)
    }
}

export abstract class MachineComponentChange {
    abstract apply(machine: Machine)
    abstract reverse(): MachineComponentChange
}

export class StackPushChange extends MachineComponentChange {
    constructor(public pushed: StackElement[] = []) {
        super()
    }

    apply(machine: Machine) {
        this.pushed.forEach(element => machine.stack.push(element))
    }

    reverse() {
        return new StackPopChange(this.pushed)
    }
}

export class StackPopChange extends MachineComponentChange {
    constructor(public popped: StackElement[] = []) {
        super()
    }

    apply(machine: Machine) {
        this.popped.forEach(element => machine.stack.pop())
    }

    reverse() {
        return new StackPushChange(this.popped)
    }
}

export class StackFramePushChange extends MachineComponentChange {
    constructor(public pushed: StackFrame) {
        super()
    }

    apply(machine: Machine) {
        machine.stack.pushStackFrame(this.pushed)
    }

    reverse() {
        return new StackFramePopChange(this.pushed)
    }
}

export class StackFramePopChange extends MachineComponentChange {
    constructor(public popped: StackFrame) {
        super()
    }

    apply(machine: Machine) {
        machine.stack.popStackFrame()
    }

    reverse() {
        return new StackFramePushChange(this.popped)
    }
}

export class GlobalEnvChange extends MachineComponentChange {
  constructor(
    public key: string,
    public before: any,
    public after: any
  ) {
      super()
  }

  apply(machine: Machine) {
      machine.globalEnvironment.set(this.key, this.after)
  }

  reverse() {
    return new GlobalEnvChange(this.key, this.after, this.before)
  }
}

export class StackFrameEnvChange extends MachineComponentChange {
  constructor(
    public key: string,
    public before: any,
    public after: any,
    public frameNo: number
  ) {
      super()
  }

  apply(machine: Machine) {
      machine.stack.getFrame(this.frameNo).stackEnvironment.set(this.key, this.after)
  }

  reverse() {
    return new StackFrameEnvChange(this.key, this.after, this.before, this.frameNo)
  }
}

export class StackFrameChange extends MachineComponentChange {
  constructor(
    public key: string,
    public before: any,
    public after: any,
    public frameNo: number
  ) {
      super()
  }

  apply(machine: Machine) {
      machine.stack.getFrame(this.frameNo)[this.key] = this.after
  }

  reverse() {
    return new StackFrameChange(this.key, this.after, this.before, this.frameNo)
  }
}

export class ConsoleChange extends MachineComponentChange {
    constructor(
        public inserted: string,
        public deleted: string
    ) {
        super()
        this.inserted = String(inserted)
        this.deleted = String(deleted)
    }

    apply(machine: Machine) {
        if (this.deleted) {
            machine.textConsole.removeText(this.deleted.length)
        }
        if (this.inserted) {
            machine.textConsole.addText(this.inserted)
        }
    }

    reverse() {
        return new ConsoleChange(this.deleted, this.inserted)
    }
}