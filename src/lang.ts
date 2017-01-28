import * as vm from "./machine"

export enum Operator {
  Add,
  Subtract,
  Multiply,
  Divide
}

export class OperatorUtils {
  static fromChar(c: string) {
    switch (c) {
      case "+": return Operator.Add;
      case "-": return Operator.Subtract;
      case "*": return Operator.Multiply;
      case "/": return Operator.Divide;
    }
  }

  static toChar(o : Operator) {
    switch (o) {
      case Operator.Add: return "+";
      case Operator.Subtract: return "-";
      case Operator.Multiply: return "*";
      case Operator.Divide: return "/";
    }
  }

  static toFunc(o: Operator): (l: any, r: any) => any {
    switch (o) {
      case Operator.Add: return (l, r) => l + r;
      case Operator.Subtract: return (l, r) => l - r;
      case Operator.Multiply: return (l, r) => l * r;
      case Operator.Divide: return (l, r) => l / r;
    }
  }
}

export abstract class ASTNode {
  abstract codegen(machine: vm.Machine)

  fixPrototype(langModule) {
    let className = this.constructor.name
    this.__proto__ = langModule[className].prototype
  }
}

export abstract class Expression extends ASTNode {
  
}

export class Integer extends Expression {
  constructor(
    public value: number = 0
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    machine.addInstruction(new vm.Push(this.value))
    machine.endASTRange(this)
  }
}

export class ValueExpression extends Expression {
  constructor(
    public ident: Ident = new EmptyIdent()
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    if (this.ident instanceof ConcreteIdent) {
      machine.addInstruction(new vm.Get(this.ident.name))
    }
    machine.endASTRange(this)
  }

  fixPrototype(langModule) {
    super.fixPrototype(langModule)
    this.ident.fixPrototype(langModule)
  }
}

export class BinaryExpression extends Expression {
  constructor(
    public left: Expression = new EmptyExpression(),
    public right: Expression = new EmptyExpression(),
    public op
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    this.left.codegen(machine)
    this.right.codegen(machine)
    machine.addInstruction(new vm.CallFunction(vm.builtInFunctions[this.op]))
    machine.endASTRange(this)
  }

  fixPrototype(langModule) {
    super.fixPrototype(langModule)
    this.left.fixPrototype(langModule)
    this.right.fixPrototype(langModule)
  }
}

export class EmptyExpression extends Expression {
  constructor(

  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    
    machine.endASTRange(this)
  }
}

export class Statements extends ASTNode {
  constructor(
    public statements: Statement[]
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    this.statements.forEach(statement => statement.codegen(machine))
    machine.endASTRange(this)
  }

  fixPrototype(langModule) {
    super.fixPrototype(langModule)
    this.statements.forEach(statement => statement.fixPrototype(langModule))
  }
}

export abstract class Statement extends ASTNode {

}

export class AssignmentStatement extends Statement {
  constructor(
    public ident: Ident = new EmptyIdent(),
    public expression: Expression = new EmptyExpression()
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    this.expression.codegen(machine)
    if (this.ident instanceof ConcreteIdent) {
      machine.addInstruction(new vm.Set(this.ident.name))
    }
    machine.endASTRange(this)
  }

  fixPrototype(langModule) {
    super.fixPrototype(langModule)
    this.ident.fixPrototype(langModule)
    this.expression.fixPrototype(langModule)
  }
}

export class WhileStatement extends Statement {
  constructor(
    public condition = new EmptyExpression(),
    public statements = new Statements([])
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    let whileBeginLabel = "whileBegin";
    let whileEndLabel = "whileEnd";
    machine.addLabel(whileBeginLabel)
    this.condition.codegen(machine)
    machine.addInstruction(new vm.CallFunction(vm.builtInFunctions['!']))
    machine.addInstruction(new vm.IfGoto(whileEndLabel))
    this.statements.codegen(machine)
    machine.addInstruction(new vm.Push(1))
    machine.addInstruction(new vm.IfGoto(whileBeginLabel))
    machine.addLabel(whileEndLabel);
    machine.endASTRange(this)
  }

  fixPrototype(langModule) {
    super.fixPrototype(langModule)
    this.condition.fixPrototype(langModule)
    this.statements.fixPrototype(langModule)
  }
}

export class EmptyStatement extends Statement {
  constructor(

  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    
    machine.endASTRange(this)
  }
}

export abstract class Ident extends ASTNode {}

export class EmptyIdent extends Ident {
  constructor() {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    
    machine.endASTRange(this)
  }
}

export class ConcreteIdent extends Ident {
  constructor(
    public name: string
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    
    machine.endASTRange(this)
  }
}

export function getMatchingStatementTypes(input: string) {
  return [AssignmentStatement, WhileStatement]
  .filter(statementType => statementType.name.indexOf(input) != -1)
  .map(statementType => new statementType())
}

export function getMatchingExpressionTypes(input: string) {
  return [BinaryExpression, ValueExpression, Integer]
  .filter(expressionType => expressionType.name.indexOf(input) != -1)
  .map(expressionType => new expressionType())
}

export function getMatchingIdentTypes(input: string) {
  return [new ConcreteIdent(input)]
}

export class Method extends ASTNode {
  constructor(
    public name: ConcreteIdent,
    public args: ConcreteIdent[],
    public statements: Statements
  ) {
    super()
  }

  codegen(machine: vm.Machine) {
    machine.beginASTRange(this)
    this.statements.codegen(machine)
    machine.endASTRange(this)
  }

  fixPrototype(langModule) {
    super.fixPrototype(langModule)
    this.name.fixPrototype(langModule)
    this.args.forEach(arg => arg.fixPrototype(langModule))
    this.statements.fixPrototype(langModule)
  }
}