import * as ast from "./ast"
import * as render from "./render/render"
import * as vm from "./machine"

abstract class ASTChange {
    abstract apply()
}

class ReplaceChange extends ASTChange {
    public replaced: ast.ASTNode

    constructor(
        public node: ast.ASTNode,
        public element: string,
        public replacement: ast.ASTNode
    ) {
        super()
        this.replaced = node[element]
    }

    apply() {
        this.node[this.element] = this.replacement
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
}

class DeleteFromArrayChange extends ASTChange {
    public deleted: ast.ASTNode

    constructor(
        public node: ast.ASTNode,
        public array: string,
        public index: number
    ) {
        super()
        this.deleted = node[array][index]
    }

    apply() {
        this.node[this.array].splice(this.index, 1)
    }
}

class ReplaceInArrayChange extends ASTChange {
    public replaced: ast.ASTNode

    constructor(
        public node: ast.ASTNode,
        public array: string,
        public index: number,
        public insert: ast.ASTNode
    ) {
        super()
        this.replaced = node[array][index]
    }

    apply() {
        this.node[this.array][this.index] = this.insert;
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

    setup(ast: ast.ASTNode, machine: vm.Machine) {
        this.ast = ast;
        this.machine = machine;
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