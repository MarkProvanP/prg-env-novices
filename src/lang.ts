export abstract class ASTNode {
  parent: ASTNode;

  constructor(parent: ASTNode) {
    this.parent = parent;
  }

  abstract toDOM(astNodeDivMap: WeakMap<HTMLElement, ASTNode>) : HTMLElement;
}

export abstract class Expression extends ASTNode {
  static parse(p: Parser, parent: ASTNode) : Expression {
    return Expression.fraserHanson(1, p, parent);
  };

  constructor(parent: ASTNode) {
    super(parent);
  }

  abstract toDOM(astNodeDivMap : WeakMap<HTMLElement, ASTNode>) : HTMLElement;

  static fraserHanson(k: number, p: Parser, parent: ASTNode) : Expression {
    let i : number;
    let left : Expression;
    let operator : Operator;
    let right: Expression;
    left = PrimaryExpression.parse(p, parent);
   
    if (p.hasAnotherToken()) {
      for (i = p.getToken().getPrecedence(); i >= k; i--) {
        while (p.hasAnotherToken() && p.getToken().getPrecedence() === i) {
          operator = (<OperatorToken> p.getToken()).operator;
          p.advanceToken();
          right = Expression.fraserHanson(i + 1, p, parent);
          left = new BinaryExpression(parent, left, right, operator);
        }
      }
    }
    return left;
  }
}

export class BinaryExpression extends Expression {
  leftExpr : Expression;
  rightExpr : Expression;
  operator: Operator;

  constructor(parent: ASTNode, leftExpr: Expression, rightExpr: Expression, operator: Operator) {
    super(parent);
    this.leftExpr = leftExpr;
    this.rightExpr = rightExpr;
    this.operator = operator;
  }

  toString() : string {
    return "("
      + this.leftExpr.toString()
      + Operator[this.operator]
      + this.rightExpr.toString()
      + ")";
  }

  toDOM(astNodeDivMap : WeakMap<HTMLElement, ASTNode>) : HTMLElement {
    let rootElement : HTMLElement = document.createElement("div");
    rootElement.classList.add("binaryExprDiv"); 
    
    let leftElementDiv : HTMLElement = this.leftExpr.toDOM(astNodeDivMap);
    let rightElementDiv : HTMLElement = this.rightExpr.toDOM(astNodeDivMap);

    let operatorDiv : HTMLElement = document.createElement("div");
    operatorDiv.classList.add("operatorDiv");
    operatorDiv.textContent = operatorToChar(this.operator);

    rootElement.appendChild(leftElementDiv);
    rootElement.appendChild(operatorDiv);
    rootElement.appendChild(rightElementDiv);

    astNodeDivMap.set(rootElement, this);

    return rootElement;
  }
}

export class PrimaryExpression extends Expression {
  value: number;

  constructor(parent: ASTNode, value: number) {
    super(parent);
    this.value = value;
  }

  static parse(p: Parser, parent: ASTNode) : Expression {
    let staticPrimaryExpression : Expression;
    if (p.getToken() instanceof NumToken) {
      staticPrimaryExpression = new PrimaryExpression(parent, (<NumToken> p.getToken()).value);
      p.advanceToken();
    } else {
      staticPrimaryExpression = new EmptyExpression(parent);
      p.advanceToken();
    }
    return staticPrimaryExpression;
  }

  toString() : string {
    return String(this.value);
  }

  toDOM(astNodeDivMap : WeakMap<HTMLElement, ASTNode>) : HTMLElement {
    let primaryExprDiv : HTMLElement = document.createElement("div");
    primaryExprDiv.classList.add("primaryExprDiv");
    primaryExprDiv.textContent = String(this.value);

    astNodeDivMap.set(primaryExprDiv, this);
    
    return primaryExprDiv;
  }
}

export class EmptyExpression extends Expression {
  toString() : string {
    return "_";
  }

  constructor(parent: ASTNode) {
    super(parent);
  }

  toDOM(astNodeDivMap : WeakMap<HTMLElement, ASTNode>) : HTMLElement {
    let emptyExprDiv : HTMLElement = document.createElement("div");
    emptyExprDiv.classList.add("emptyExprDiv");
    emptyExprDiv.textContent = '_';

    astNodeDivMap.set(emptyExprDiv, this);

    return emptyExprDiv;
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

function operatorToChar(o : Operator) {
  switch (o) {
    case Operator.Add: return "+";
    case Operator.Subtract: return "-";
    case Operator.Multiply: return "*";
    case Operator.Divide: return "/";
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
    return String(this.value);
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

  hasAnotherToken() {
    return this.tokenList.length > this.tokenPosition;
  }
}
