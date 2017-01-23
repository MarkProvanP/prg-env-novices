export class ASTNode {

}

export class Integer extends ASTNode {
  constructor(
    public value
  ) {
    super()
  }
}

export class BinaryExpression extends ASTNode {
  constructor(
    public left,
    public right,
    public op
  ) {
    super()
  }
}

export class AssignmentStatement extends ASTNode {
  constructor(
    public ident,
    public expression
  ) {
    super()
  }
}

export class WhileStatement extends ASTNode {
  constructor(
    public condition,
    public statements
  ) {
    super()
  }
}

export class Ident extends ASTNode {
  constructor(
    public name
  ) {
    super()
  }
}
