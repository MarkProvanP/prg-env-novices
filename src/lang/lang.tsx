import * as vm from "../machine"
require("./style.scss")

import React from "react";
import ReactDOM from "react-dom";

import { ASTNode } from "../ast"

import * as render from "./render-lang"

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

  render(props) {
    return <render.IntegerComponent {...props} integer={this} />
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

  render(props) {
    return <render.ValueExpressionComponent {...props} value={this} />
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

  render(props) {
    return <render.BinaryExpressionComponent {...props} binaryExpression={this} />
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

  render(props) {
    return <render.EmptyExpressionComponent {...props} emptyExpression={this} />
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

  render(props) {
    return <render.StatementsComponent {...props} statements={this} />
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

  render(props) {
    return <render.AssignmentStatementComponent {...props} assignmentStatement={this} />
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

  render(props) {
    return <render.WhileStatementComponent {...props} whileStatement={this} />
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

  render(props) {
    return <render.EmptyStatementComponent {...props} emptyStatement={this} />
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

  render(props) {
    return <render.EmptyIdentComponent {...props} emptyIdent={this} />
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

  render(props) {
    return <render.IdentComponent {...props} ident={this} />
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
    machine.addInstruction(new vm.NewEnv())
    this.statements.codegen(machine)
    machine.endASTRange(this)
  }

  render(props) {
    return <render.MethodComponent {...props} method={this} />
  }
}