import * as vm from "../machine/index"

import React from "react"
import ReactDOM from "react-dom"

import { ASTNode, LanguageDefinition } from "../ast"

import grammar from "./grammars/index"

export function getLanguageDefinition() {
    return definition
}

class Fun extends LanguageDefinition {
    getGrammar() {
        return grammar
    }

    initialise() {
        require("./style.scss")
    }
}
let definition = new Fun()

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

export class ConditionalExpression extends Expression {
  constructor(
    public condition: Expression = new EmptyExpression(),
    public thenExpression: Expression = new EmptyExpression(),
    public elseExpression: Expression = new EmptyExpression()
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    this.condition.codegen(machine)
    machine.addInstruction(new vm.IfGoto("ConditionalFalse"))
    this.thenExpression.codegen(machine)
    machine.addInstruction(new vm.Goto("ConditionalEnd"))
    machine.addLabel("ConditionalFalse")
    this.elseExpression.codegen(machine)
    machine.addLabel("ConditionalEnd")
  }

  render(props) {
    return <render.ConditionalExpressionComponent {...props} conditionalExpression={this} />
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

export function getMatchingExpressionTypes(input: string) {
  return [BinaryExpression, ValueExpression, Integer]
  .filter(expressionType => expressionType.name.indexOf(input) != -1)
  .map(expressionType => new expressionType())
}

export function getMatchingIdentTypes(input: string) {
  return [new ConcreteIdent(input)]
}

export function getMatchingFunctionTypes(input: string) {
  return [new Function()]
}

export class Function extends ASTNode {
  static labelName(functionName: string) {
    return `FUNCTION_${functionName}`
  }

  constructor(
    public name: Ident = new EmptyIdent(),
    public args: Ident[] = [],
    public expression: Expression = new EmptyExpression()
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    machine.addLabel(Function.labelName(this.name.getName()))
    machine.addInstruction(new vm.PushStackFrame())
    this.expression.codegen(machine)
    machine.addInstruction(new vm.Return(true))
  }

  render(props) {
    return <render.FunctionComponent {...props} function={this} />
  }
}

export class FunctionCallExpression extends Expression {
  constructor(
    public ident: Ident = new EmptyIdent(),
    public args: Expression[] = [],
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    machine.addInstruction(new vm.MethodCall(Function.labelName(this.ident.getName())))
  }

  render(props) {
    return <render.FunctionCallExpressionComponent {...props} functionCallExpression={this} />
  }
}

export class Program extends ASTNode {
  constructor(
    public methods: Function[] = []
  ) {
    super()
  }

  internalCodegen(machine: vm.Machine) {
    this.methods.forEach(method => method.codegen(machine))
  }

  render(props) {
    return <render.ProgramComponent {...props} program={this} />
  }
}