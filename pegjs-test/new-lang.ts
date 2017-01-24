import { Renderer } from "./render";

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

  abstract render(renderer: Renderer);
}

export abstract class Expression extends ASTNode {
  
}

export class Integer extends Expression {
  constructor(
    public value
  ) {
    super()
  }

  render(renderer: Renderer) {
    return renderer.createIntegerElement(this);
  }
}

export class BinaryExpression extends Expression {
  constructor(
    public left,
    public right,
    public op
  ) {
    super()
  }

  render(renderer: Renderer) {
    return renderer.createBinaryExpressionElement(this);
  }
}

export class Statements extends ASTNode {
  constructor(
    public statements: Statement[]
  ) {
    super()
  }

  render(renderer: Renderer) {
    return renderer.createStatementsElement(this);
  }
}

export abstract class Statement extends ASTNode {

}

export class AssignmentStatement extends Statement {
  constructor(
    public ident,
    public expression
  ) {
    super()
  }

  render(renderer: Renderer) {
      return renderer.createAssignmentStatementElement(this);
  }
}

export class WhileStatement extends Statement {
  constructor(
    public condition,
    public statements
  ) {
    super()
  }

  render(renderer: Renderer) {
    return renderer.createWhileStatementElement(this);
  }
}

export class Ident extends ASTNode {
  constructor(
    public name
  ) {
    super()
  }

  render(renderer: Renderer) {
    return renderer.createIdentElement(this);
  }
}
