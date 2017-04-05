import * as vm from "../machine/index"

import React from "react";
import ReactDOM from "react-dom";

import { ASTNode, LanguageDefinition } from "../ast"

import grammar from "./grammars/index"

export function getLanguageDefinition() {
  return definition
}

class Lang extends LanguageDefinition {
  getName() {
    return "Lang"
  }
  
  getGrammar() {
    return grammar
  }

  initialise() {
    super.initialise()
  }

  stylesheet() {
    require("./style.scss")
  }

  machineInitialise(machine: vm.Machine) {
    machine.addLabel(Method.labelName("PRINT"))
    machine.addInstruction(new vm.Get("text"))
    machine.addInstruction(new vm.ConsoleOut())
  }
}
let definition = new Lang()

import * as render from "./render"

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

export abstract class Expression extends ASTNode {}

export class Integer extends Expression {
  constructor(
    public value: number = 0
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    machine.addInstruction(new vm.Push(this.value))
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

  internalCodegen(machine: vm.Machine) {
    if (this.ident instanceof ConcreteIdent) {
      machine.addInstruction(new vm.Get(this.ident.name))
    }
  }

  render(props) {
    return <render.ValueExpressionComponent {...props} value={this} />
  }
}

export class BinaryExpression extends Expression {
  constructor(
    public left: Expression = new EmptyExpression(),
    public right: Expression = new EmptyExpression(),
    public op = "+"
  ) {
    super()
  }

  public static OP_LIST = ["+", "-", "/", "*"]

  internalCodegen(machine: vm.Machine) {
    this.left.codegen(machine)
    this.right.codegen(machine)
    machine.addInstruction(new vm.CallFunction(vm.builtInFunctions[this.op]))
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

  internalCodegen(machine: vm.Machine) {
  }

  render(props) {
    return <render.EmptyExpressionComponent {...props} emptyExpression={this} />
  }
}

export class Statements extends ASTNode {
  constructor(
    public statements: Statement[] = []
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    this.statements.forEach(statement => statement.codegen(machine))
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

  internalCodegen(machine: vm.Machine) {
    this.expression.codegen(machine)
    if (this.ident instanceof ConcreteIdent) {
      machine.addInstruction(new vm.Set(this.ident.name))
    }
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

  internalCodegen(machine: vm.Machine) {
    let whileBeginLabel = "whileBegin";
    let whileEndLabel = "whileEnd";
    machine.addLabel(whileBeginLabel)
    this.condition.codegen(machine)
    machine.addInstruction(new vm.CallFunction(vm.builtInFunctions['!']))
    machine.addInstruction(new vm.IfGoto(whileEndLabel))
    this.statements.codegen(machine)
    machine.addInstruction(new vm.Goto(whileBeginLabel))
    machine.addLabel(whileEndLabel);
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

  internalCodegen(machine: vm.Machine) {
  }

  render(props) {
    return <render.EmptyStatementComponent {...props} emptyStatement={this} />
  }
}

export abstract class Ident extends ASTNode {
  abstract getName()
}

export class EmptyIdent extends Ident {
  constructor() {
    super()
  }

  getName() {
    return "NO_NAME!"
  }

  internalCodegen(machine: vm.Machine) {
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

  getName() {
    return this.name
  }

  internalCodegen(machine: vm.Machine) {
  }

  render(props) {
    return <render.IdentComponent {...props} ident={this} />
  }
}

export function getMatchingStatementTypes(input: string) {
  return [AssignmentStatement, WhileStatement, ExpressionStatement]
  .filter(statementType => statementType.name.indexOf(input) != -1)
  .map(statementType => new statementType())
}

export function getMatchingExpressionTypes(input: string) {
  return [BinaryExpression, ValueExpression, Integer, MethodCallExpression]
  .filter(expressionType => expressionType.name.indexOf(input) != -1)
  .map(expressionType => new expressionType())
}

export function getMatchingIdentTypes(input: string) {
  return [new ConcreteIdent(input)]
}

export function getMatchingMethodTypes(input: string) {
  return [new Method()]
}

export class Method extends ASTNode {
  static labelName(methodName: string) {
    return `METHOD_${methodName}`
  }

  constructor(
    public name: Ident = new EmptyIdent(),
    public args: Ident[] = [],
    public statements: Statements = new Statements([new ReturnStatement()])
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    machine.addLabel(Method.labelName(this.name.getName()))
    machine.addInstruction(new vm.ArgsToEnv(this.args.map(arg => arg.getName())))
    this.statements.codegen(machine)
  }

  render(props) {
    return <render.MethodComponent {...props} method={this} />
  }
}

export class MethodCallExpression extends Expression {
  constructor(
    public ident: Ident = new EmptyIdent(),
    public args: Expression[] = [],
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    this.args.forEach(arg => arg.codegen(machine))
    machine.addInstruction(new vm.MethodCall(Method.labelName(this.ident.getName()), this.args.length))
  }

  render(props) {
    return <render.MethodCallExpressionComponent {...props} methodCallExpression={this} />
  }
}

export class Program extends ASTNode {
  constructor(
    public methods: Method[] = []
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    machine.addInstruction(new vm.PushStackFrame())
    this.methods.forEach(method => method.codegen(machine))
  }

  render(props) {
    return <render.ProgramComponent {...props} program={this} />
  }
}

export class ReturnStatement extends Statement {
  constructor(
    public expression: Expression = new EmptyExpression()
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    if (this.expression) {
      this.expression.codegen(machine)
    }
    machine.addInstruction(new vm.Return(!!this.expression))
  }

  render(props) {
    return <render.ReturnStatementComponent {...props} returnStatement={this} />
  }
}

export class ExpressionStatement extends Statement {
  constructor(
    public expression: Expression = new EmptyExpression()
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    this.expression.codegen(machine)
  }

  render(props) {
    return <render.ExpressionStatementComponent {...props} expressionStatement={this} />
  }
}