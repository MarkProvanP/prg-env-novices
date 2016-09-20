export interface ParentASTNode {
  deleteChild(child: ASTNode) : void;
}

export abstract class ASTNode {
  parent: ParentASTNode;

  abstract setParent(parent: ParentASTNode);

  abstract toDOM(astNodeDivMap: WeakMap<HTMLElement, ASTNode>) : HTMLElement;
}

export abstract class Expression extends ASTNode {
  static parse(p: Parser) : Expression {
    return Expression.fraserHanson(1, p);
  };

  abstract toDOM(astNodeDivMap : WeakMap<HTMLElement, ASTNode>) : HTMLElement;

  static fraserHanson(k: number, p: Parser) : Expression {
    let i : number;
    let left : Expression;
    let operator : Operator;
    let right: Expression;
    left = PrimaryExpression.parse(p);
   
    if (p.hasAnotherToken()) {
      for (i = p.getToken().getPrecedence(); i >= k; i--) {
        while (p.hasAnotherToken() && p.getToken().getPrecedence() === i) {
          operator = (<OperatorToken> p.getToken()).operator;
          p.advanceToken();
          right = Expression.fraserHanson(i + 1, p);
          left = new BinaryExpression(left, right, operator);
        }
      }
    }
    return left;
  }
}

export class BinaryExpression extends Expression implements ParentASTNode {
  leftExpr : Expression;
  rightExpr : Expression;
  operator: Operator;

  constructor(leftExpr: Expression, rightExpr: Expression, operator: Operator) {
    super();
    this.leftExpr = leftExpr;
    this.rightExpr = rightExpr;
    this.operator = operator;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
    this.leftExpr.setParent(this);
    this.rightExpr.setParent(this);
  }

  deleteChild(child: ASTNode) {
    if (child === this.leftExpr) {
      this.leftExpr = new EmptyExpression();
      this.leftExpr.setParent(this);
    } else if (child == this.rightExpr) {
      this.rightExpr = new EmptyExpression();
      this.rightExpr.setParent(this);
    }
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

  constructor(value: number) {
    super();
    this.value = value;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  static parse(p: Parser) : Expression {
    let staticPrimaryExpression : Expression;
    if (p.getToken() instanceof NumToken) {
      staticPrimaryExpression = new PrimaryExpression((<NumToken> p.getToken()).value);
      p.advanceToken();
    } else {
      staticPrimaryExpression = new EmptyExpression();
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

  setParent(parent: ParentASTNode) {
    this.parent = parent;
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
