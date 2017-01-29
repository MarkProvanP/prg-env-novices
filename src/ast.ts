import * as vm from "./machine"

export abstract class ASTNode {
  abstract codegen(machine: vm.Machine)
}