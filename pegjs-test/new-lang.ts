export class Integer {
  constructor(
    public value
  ) {}
}

export class BinaryExpression {
  constructor(
    public left,
    public right,
    public op
  ) {}
}

export class AssignmentStatement {
  constructor(
    public ident,
    public expression
  ) {}
}

export class WhileStatement {
  constructor(
    public condition,
    public statements
  ) {}
}

export class Ident {
  constructor(
    public name
  ) {}
}
