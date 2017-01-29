import * as vm from "./machine"
import * as render from "./render/render-ast"

export abstract class ASTNode {
  abstract codegen(machine: vm.Machine)
  abstract render(props: render.ASTComponentProps)
}