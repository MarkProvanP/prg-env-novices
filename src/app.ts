import * as lang from "./lang"
import * as render from "./render/render"
import * as vm from "./machine"

export class App {
    ast: lang.ASTNode
    machine: vm.Machine

    selectedASTNode: lang.ASTNode

    setup(ast: lang.ASTNode, machine: vm.Machine) {
        this.ast = ast;
        this.machine = machine;
    }

    renderApp() {
        render.renderApp(this)
    }

    selectASTNode(node: lang.ASTNode) {
        this.selectedASTNode = node
        this.renderApp()
    }

    replaceElement(node: lang.ASTNode, element: string, replacement: lang.ASTNode) {
        node[element] = replacement
        this.renderApp();
    }

    deleteFromArray(node: lang.ASTNode, array: string, index: number) {
        node[array].splice(index, 1)
        this.renderApp();
    }

    insertIntoArray(node: lang.ASTNode, array: string, index: number, insert: lang.ASTNode) {
        node[array].splice(index, 0, insert)
        this.renderApp();
    }
}