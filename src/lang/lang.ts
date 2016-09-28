import { ASTNodeDivMap } from "../script";

import { Token, NumToken, IdentToken, OperatorToken, Operator, OperatorUtils, Lexer } from "./lex";

export class RootASTNode implements ParentASTNode {
  child: ASTNode;  

  constructor(child: ASTNode) {
    this.child = child;
    this.child.setParent(this);
  }

  replaceASTNode(original: ASTNode, replacement: ASTNode) {
    if (this.child === original) {
      this.child = replacement;
      this.child.setParent(this);
    }
  }

  toDOM(astNodeDivMap : ASTNodeDivMap) : HTMLElement {
    let rootDiv = document.createElement("div");
    rootDiv.appendChild(this.child.toDOM(astNodeDivMap));
    return rootDiv;
  }

  getFirstEmpty(): EmptyExpression {
    return this.child.getFirstEmpty();
  }
}

export interface ParentASTNode {
  replaceASTNode(original: ASTNode, replacement: ASTNode) : void;
  getFirstEmpty(): EmptyExpression;
}

export abstract class ASTNode {
  parent: ParentASTNode;

  abstract setParent(parent: ParentASTNode);

  abstract toDOM(astNodeDivMap: ASTNodeDivMap) : HTMLElement;
  
  abstract getText(): string;

  abstract getFirstEmpty(): EmptyExpression;

  abstract makeSelected(astNodeDivMap: ASTNodeDivMap): void;

  abstract makeClone(): ASTNode;
}

export abstract class Expression extends ASTNode {
  static parse(p: Parser) : Expression {
    if (p.hasAnotherToken()) {
      return Expression.fraserHanson(1, p);
    } else {
      return new EmptyExpression();
    }
  };

  abstract toDOM(astNodeDivMap : ASTNodeDivMap) : HTMLElement;

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

  abstract evaluate();
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

  replaceASTNode(original: ASTNode, replacement: ASTNode) : void {
    if (original === this.leftExpr) {
      this.leftExpr = <Expression> replacement;
      this.leftExpr.setParent(this);
    } else if (original === this.rightExpr) {
      this.rightExpr = <Expression> replacement;
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

  getText() {
    return this.leftExpr.getText()
      + OperatorUtils.toChar(this.operator)
      + this.rightExpr.getText();
  }

  getFirstEmpty(): EmptyExpression {
    if (this.leftExpr instanceof EmptyExpression) {
      return this.leftExpr;
    }
    let l = this.leftExpr.getFirstEmpty();
    if (l) { return l; }
    if (this.rightExpr instanceof EmptyExpression) {
      return this.rightExpr;
    }
    let r = this.rightExpr.getFirstEmpty();
    if (r) { return r; };
    return null;
  }

  toDOM(astNodeDivMap : ASTNodeDivMap) : HTMLElement {
    let rootElement : HTMLElement = document.createElement("div");
    rootElement.classList.add("binaryExprDiv"); 
    
    let leftElementDiv : HTMLElement = this.leftExpr.toDOM(astNodeDivMap);
    let rightElementDiv : HTMLElement = this.rightExpr.toDOM(astNodeDivMap);

    let operatorDiv : HTMLElement = document.createElement("div");
    operatorDiv.classList.add("operatorDiv");
    operatorDiv.textContent = OperatorUtils.toChar(this.operator);

    rootElement.appendChild(leftElementDiv);
    rootElement.appendChild(operatorDiv);
    rootElement.appendChild(rightElementDiv);

    astNodeDivMap.addDivNode(rootElement, this);

    return rootElement;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let div = astNodeDivMap.getDiv(this);  
    div.classList.add('selected');
    div.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate() {
    let left = this.leftExpr.evaluate();
    let right = this.rightExpr.evaluate();
    let func = OperatorUtils.toFunc(this.operator);
    return func(left, right);
  }

  makeClone(): BinaryExpression {
    let left = this.leftExpr.makeClone();
    let right = this.rightExpr.makeClone();
    return new BinaryExpression(left, right, this.operator);
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

  getText() : string {
    return String(this.value);
  }

  getFirstEmpty() { return null; }

  toDOM(astNodeDivMap : ASTNodeDivMap) : HTMLElement {
    let primaryExprDiv : HTMLElement = document.createElement("div");
    primaryExprDiv.classList.add("primaryExprDiv");
    primaryExprDiv.textContent = String(this.value);

    astNodeDivMap.addDivNode(primaryExprDiv, this);
    
    return primaryExprDiv;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let div = astNodeDivMap.getDiv(this);  
    div.classList.add('selected');
    div.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate() {
    return this.value;
  }

  makeClone(): PrimaryExpression {
    return new PrimaryExpression(this.value);
  }
}

export class EmptyExpression extends Expression {
  toString() : string {
    return "_";
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  toDOM(astNodeDivMap : ASTNodeDivMap) : HTMLElement {
    let emptyExprDiv : HTMLElement = document.createElement("div");
    emptyExprDiv.classList.add("emptyExprDiv");

    let exprTextDiv = document.createElement("div");
    exprTextDiv.textContent = 'expression';
    exprTextDiv.classList.add('empty-expr-text');
    emptyExprDiv.appendChild(exprTextDiv);

    astNodeDivMap.addDivNode(emptyExprDiv, this);

    return emptyExprDiv;
  }

  getFirstEmpty() { return this; };

  getText() : string { return ""; }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let div = astNodeDivMap.getDiv(this);  
    div.classList.add('selected');
  }

  evaluate() {
    return undefined;
  }

  makeClone(): EmptyExpression {
    return new EmptyExpression();
  }
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
