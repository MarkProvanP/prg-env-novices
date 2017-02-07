import * as vm from "./machine"
import * as render from "./render/render-ast"

export abstract class ASTNode {
  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    this.internalCodegen(machine)
    machine.endASTRange(this)
  }
  abstract internalCodegen(machine: vm.Machine)
  abstract render(props: render.ASTComponentProps)
}

export abstract class ASTChange {
    abstract apply()
    abstract describe()
    abstract reverse(): ASTChange
}

export class ReplaceChange extends ASTChange {
    constructor(
        public node: ASTNode,
        public element: string,
        public replacement: ASTNode,
        public replaced: ASTNode = node[element]
    ) {
        super()
    }

    apply() {
        this.node[this.element] = this.replacement
    }

    describe() {
        return `Replaced ${this.replaced} with ${this.replacement} as ${this.node.constructor.name}.${this.element}`
    }

    reverse() {
        return new ReplaceChange(this.node, this.element, this.replaced, this.replacement)
    }
}

export class InsertIntoArrayChange extends ASTChange {
    constructor(
        public node: ASTNode,
        public array: string,
        public index: number,
        public insert: ASTNode
    ) {
        super()
    }

    apply() {
        this.node[this.array].splice(this.index, 0, this.insert)
    }

    describe() {
        return `Inserted ${this.insert} into ${this.node}.${this.array} at index ${this.index}`
    }

    reverse() {
        return new DeleteFromArrayChange(this.node, this.array, this.index, this.insert)
    }
}

export class DeleteFromArrayChange extends ASTChange {
    constructor(
        public node: ASTNode,
        public array: string,
        public index: number,
        public deleted: ASTNode = node[array][index]
    ) {
        super()
    }

    apply() {
        this.node[this.array].splice(this.index, 1)
    }

    describe() {
        return `Deleted ${this.deleted} from ${this.node}.${this.array} at index ${this.index}`
    }

    reverse() {
        return new InsertIntoArrayChange(this.node, this.array, this.index, this.deleted)
    }
}

export class ReplaceInArrayChange extends ASTChange {
    constructor(
        public node: ASTNode,
        public array: string,
        public index: number,
        public insert: ASTNode,
        public replaced: ASTNode = node[array][index]
    ) {
        super()
    }

    apply() {
        this.node[this.array][this.index] = this.insert;
    }

    describe() {
        return `Replaced ${this.replaced} with ${this.insert} in ${this.node}.${this.array} at index ${this.index}`
    }

    reverse() {
        return new ReplaceInArrayChange(this.node, this.array, this.index, this.replaced, this.insert)
    }
}
