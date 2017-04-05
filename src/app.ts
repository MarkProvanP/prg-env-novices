import * as ast from "./ast"
import * as render from "./render/render"
import * as vm from "./machine/index"
import * as pegjs from "pegjs"

export class App {
    ast: ast.ASTNode
    machine: vm.Machine

    astChanges: ast.ASTChange[] = []
    undoneChanges: ast.ASTChange[] = []

    selectedASTNode: ast.ASTNode
    
    mousedOverASTNodes: ast.ASTNode[] = []
    private _mousedOverNodesBuilder: ast.ASTNode[]

    selectedLabel: string

    grammar: any

    constructor(
        public languageDefinition: ast.LanguageDefinition
    ) {
        this.grammar = languageDefinition.getGrammar()
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

    addNewChange(change: ast.ASTChange) {
        this.astChanges.push(change)
        this.applyChange(change)
    }

    applyChange(change: ast.ASTChange) {
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

    editorUndo() {
        let lastChange = this.astChanges.pop()
        let reversed = lastChange.reverse()
        this.applyChange(reversed)
        this.undoneChanges.push(lastChange)
    }

    editorRedo() {
        let lastUndoneChange = this.undoneChanges.pop()
        this.astChanges.push(lastUndoneChange)
        this.applyChange(lastUndoneChange)
    }

    canUndo() {
        return !!this.astChanges.length
    }

    canRedo() {
        return !!this.undoneChanges.length
    }

    replaceElement(node: ast.ASTNode, element: string, replacement: ast.ASTNode) {
        let change = new ast.ReplaceChange(node, element, replacement)
        this.addNewChange(change)
    }

    deleteFromArray(node: ast.ASTNode, array: string, index: number) {
        let change = new ast.DeleteFromArrayChange(node, array, index)
        this.addNewChange(change)
    }

    insertIntoArray(node: ast.ASTNode, array: string, index: number, insert: ast.ASTNode) {
        let change = new ast.InsertIntoArrayChange(node, array, index, insert)
        this.addNewChange(change)
    }

    replaceElementInArray(node: ast.ASTNode, array: string, index: number, insert: ast.ASTNode) {
        let change = new ast.ReplaceInArrayChange(node, array, index, insert)
        this.addNewChange(change)
    }
}