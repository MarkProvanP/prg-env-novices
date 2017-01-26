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
}