import * as ast from "./ast"
import * as render from "./render/render"
import * as vm from "./machine"

export class App {
    ast: ast.ASTNode
    machine: vm.Machine

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

    replaceElement(node: ast.ASTNode, element: string, replacement: ast.ASTNode) {
        node[element] = replacement
        this.changeAST();
        this.renderApp();
    }

    deleteFromArray(node: ast.ASTNode, array: string, index: number) {
        node[array].splice(index, 1)
        this.changeAST()
        this.renderApp();
    }

    insertIntoArray(node: ast.ASTNode, array: string, index: number, insert: ast.ASTNode) {
        node[array].splice(index, 0, insert)
        this.changeAST()
        this.renderApp();
    }

    replaceElementInArray(node: ast.ASTNode, array: string, index: number, insert: ast.ASTNode) {
        node[array][index] = insert;
        this.changeAST()
        this.renderApp()
    }
}