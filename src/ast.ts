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