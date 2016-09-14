export abstract class Expression {
  static parse(p: Parser) : Expression {
    return Expression.fraserHanson(1, p);
  };

  static fraserHanson(k: number, p: Parser) : Expression {
    let i : number;
    let left : Expression;
    let operator : Operator;
    let right: Expression;
    left = Expression.parse(p);

    for (i = p.getToken().getPrecedence(); i >= k; i--) {
      while (p.getToken().getPrecedence() === i) {
        operator = (<OperatorToken> p.getToken()).operator;
        p.advanceToken();
        right = Expression.fraserHanson(i + 1, p);
        left = new BinaryExpression(left, right, operator);
      }
    }
    return left;
  }
}

export class BinaryExpression extends Expression {
  leftExpr : Expression;
  rightExpr : Expression;
  operator: Operator;

  constructor(leftExpr: Expression, rightExpr: Expression, operator: Operator) {
    super();
    this.leftExpr = leftExpr;
    this.rightExpr = rightExpr;
    this.operator = operator;
  }
}

export class PrimaryExpression extends Expression {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }
}


export enum Operator {
  Add,
  Subtract,
  Multiply,
  Divide
}

function charToOperator(c: string) {
  switch (c) {
    case "+": return Operator.Add;
    case "-": return Operator.Subtract;
    case "*": return Operator.Multiply;
    case "/": return Operator.Divide;
  }
}

export abstract class Token {
  getPrecedence() : number {
    return 0;
  }
}

export class OperatorToken extends Token {
  operator: Operator;

  constructor(operator: Operator) {
    super();
    this.operator = operator;
  }

  getPrecedence() : number {
    switch (this.operator) {
      case Operator.Add:
      case Operator.Subtract:
        return 3;
      case Operator.Multiply:
      case Operator.Divide:
        return 4;
    }
  }

  toString() : string {
    return Operator[this.operator];
  }
}

export class NumToken extends Token {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}

export function lex(s: string) : Token[] {
  let tokens : Token[] = [];
  for (let i = 0; i < s.length; i++) {
    let t : Token = null;
    let c = s[i];
    if (!isNaN(parseInt(c))) {
      t = new NumToken(parseInt(c));
    } else {
      t = new OperatorToken(charToOperator(c));
    }
    tokens.push(t);
  }
  return tokens;
}

export class Parser {
  tokenList : Token[];
  tokenPosition : number = 0;

  constructor(tokenList: Token[]) {
    this.tokenList = tokenList;
  }

  getToken() {
    return this.tokenList[this.tokenPosition];
  }

  advanceToken() {
    this.tokenPosition++;
  }
}
