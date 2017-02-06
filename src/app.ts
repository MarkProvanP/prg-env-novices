import * as ast from "./ast"
import * as render from "./render/render"
import * as vm from "./machine"
import * as pegjs from "pegjs"

abstract class ASTChange {
    abstract apply()
    abstract describe()
    abstract reverse(): ASTChange
}

class ReplaceChange extends ASTChange {
    constructor(
        public node: ast.ASTNode,
        public element: string,
        public replacement: ast.ASTNode,
        public replaced: ast.ASTNode = node[element]
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

class InsertIntoArrayChange extends ASTChange {
    constructor(
        public node: ast.ASTNode,
        public array: string,
        public index: number,
        public insert: ast.ASTNode
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

class DeleteFromArrayChange extends ASTChange {
    constructor(
        public node: ast.ASTNode,
        public array: string,
        public index: number,
        public deleted: ast.ASTNode = node[array][index]
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

class ReplaceInArrayChange extends ASTChange {
    constructor(
        public node: ast.ASTNode,
        public array: string,
        public index: number,
        public insert: ast.ASTNode,
        public replaced: ast.ASTNode = node[array][index]
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

export class App {
    ast: ast.ASTNode
    machine: vm.Machine

    astChanges: ASTChange[] = []

    selectedASTNode: ast.ASTNode
    
    mousedOverASTNodes: ast.ASTNode[] = []
    private _mousedOverNodesBuilder: ast.ASTNode[]

    selectedLabel: string

    constructor(public grammar) {
        
    }

    parseExpression(input: string) {
        try {
            return [this.grammar.Expression.parse(input)]
        } catch (e) {
            return []
        }
    }

    parseStatement(input: string) {
        try {
            return [this.grammar.Statement.parse(input)]
        } catch (e) {
            return []
        }
    }

    setup(ast: ast.ASTNode, machine: vm.Machine) {
        this.ast = ast;
        this.machine = machine;
    }

    forward() {
        if (!this.machine) {
            return
        }
        this.machine.oneStepExecute();
        this.renderApp();
    }

    backward() {
        if (!this.machine) {
            return
        }
        this.machine.oneStepBackward();
        this.renderApp();
    }

    renderApp() {
        render.renderApp(this)
    }

    changeAST() {
        this.machine.setAST(this.ast)
    }

    selectASTNode(node: ast.ASTNode) {
        this.selectedASTNode = node
        this.renderApp()
    }

    stopMouseOverASTNode() {
        this.mousedOverASTNodes = this._mousedOverNodesBuilder
        this._mousedOverNodesBuilder = undefined;
        console.log("Moused over nodes", this.mousedOverASTNodes)
        this.renderApp()
    }

    mouseOverASTNode(node: ast.ASTNode) {
        if (!this._mousedOverNodesBuilder) {
            this._mousedOverNodesBuilder = []
        }
        this._mousedOverNodesBuilder.push(node);
    }

    selectLabel(label: string) {
        this.selectedLabel = label
        this.renderApp()
    }

    addNewChange(change: ASTChange) {
        this.astChanges.push(change)
        change.apply()
        this.changeAST()
        this.renderApp()
    }

    undoLastChange() {
        if (!this.astChanges.length) {
            return
        }
        let lastChange = this.astChanges[this.astChanges.length - 1]
        let reversed = lastChange.reverse()
        this.addNewChange(reversed)
    }

    replaceElement(node: ast.ASTNode, element: string, replacement: ast.ASTNode) {
        let change = new ReplaceChange(node, element, replacement)
        this.addNewChange(change)
    }

    deleteFromArray(node: ast.ASTNode, array: string, index: number) {
        let change = new DeleteFromArrayChange(node, array, index)
        this.addNewChange(change)
    }

    insertIntoArray(node: ast.ASTNode, array: string, index: number, insert: ast.ASTNode) {
        let change = new InsertIntoArrayChange(node, array, index, insert)
        this.addNewChange(change)
    }

    replaceElementInArray(node: ast.ASTNode, array: string, index: number, insert: ast.ASTNode) {
        let change = new ReplaceInArrayChange(node, array, index, insert)
        this.addNewChange(change)
    }
}