import { ASTNodeDivMap } from "../script";

import { Token, NumToken, IdentToken, AssignToken, OperatorToken, Operator, OperatorUtils, Lexer } from "./lex";

export interface EmptyASTNode {
}

export interface ParentASTNode {
  replaceASTNode(original: ASTNode, replacement: ASTNode) : void;
  getFirstEmpty(): EmptyASTNode;
}

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

  getFirstEmpty(): EmptyASTNode {
    return this.child.getFirstEmpty();
  }
}
export abstract class ASTNode {
  parent: ParentASTNode;

  abstract setParent(parent: ParentASTNode);

  abstract toDOM(astNodeDivMap: ASTNodeDivMap) : HTMLElement;
  
  abstract getText(): string;

  abstract getFirstEmpty(): EmptyASTNode;

  abstract makeSelected(astNodeDivMap: ASTNodeDivMap): void;

  abstract makeClone(): ASTNode;

  abstract evaluateExpressions(limiter);
}

export abstract class AbstractIdent extends ASTNode {

}

export class Ident extends AbstractIdent {
  ident: string;

  constructor(ident: string) {
    super();
    this.ident = ident;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  toDOM(astNodeDivMap: ASTNodeDivMap): HTMLElement {
    let rootElement = document.createElement("div");
    rootElement.classList.add("identDiv");
    rootElement.textContent = this.ident;
    astNodeDivMap.addDivNode(rootElement, this);
    return rootElement;
  }

  getText() {
    return this.ident;
  }

  getFirstEmpty() {
    return null;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let div = astNodeDivMap.getDiv(this);
    div.classList.add('selected');
  }

  makeClone(): Ident {
    return new Ident(this.ident);
  }

  evaluateExpressions(limiter) {
    return this.makeClone();
  }

  static parse(p: Parser): AbstractIdent {
    let ident;

    if (p.getToken() instanceof IdentToken) {
      ident = (<IdentToken> p.getToken()).ident;
      p.advanceToken();
    } else {
      console.log('expected identToken');
      p.advanceToken();
      return new EmptyIdent();
    }

    return new Ident(ident);
  }
}

export class EmptyIdent extends AbstractIdent implements EmptyASTNode {
  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  toDOM(astNodeDivMap: ASTNodeDivMap) {
    let rootElement = document.createElement("div");
    rootElement.classList.add("emptyIdentDiv");
    rootElement.textContent = "ident";
    astNodeDivMap.addDivNode(rootElement, this);
    return rootElement;
  }

  getText(): string {
    return "";
  }

  makeClone(): EmptyIdent {
    return new EmptyIdent();
  }

  getFirstEmpty() { return null; }

  makeSelected(astNodeDivMap: ASTNodeDivMap) {
    let rootElement = astNodeDivMap.getDiv(this);
    rootElement.classList.add('selected');
  }

  evaluateExpressions(limiter) {
    return this.makeClone();
  }
}

export abstract class Statement extends ASTNode {
  static parse(p: Parser) {
    if (p.getToken() instanceof IdentToken) {
      return AssignmentStatement.parse(p);
    } else {
      p.advanceToken();
      return new EmptyStatement();
    }
  }
}

export class EmptyStatement extends ASTNode implements EmptyASTNode {
  toDOM(astNodeDivMap: ASTNodeDivMap): HTMLElement {
    let rootElement: HTMLElement = document.createElement("div");
    rootElement.classList.add("emptyStatementDiv");
    rootElement.textContent = "statement";

    astNodeDivMap.addDivNode(rootElement, this);

    return rootElement;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  getText() {
    return "";
  }

  getFirstEmpty(): EmptyASTNode {
    return this;
  }

  makeClone() {
    return new EmptyStatement();
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);
    rootElement.classList.add('selected');
  }

  evaluateExpressions(limiter) {
    throw new Error("can't eval empty statement");
  }
}

export class AssignmentStatement extends Statement {
  ident: AbstractIdent;
  expression: Expression;

  constructor(ident: AbstractIdent, expression: Expression) {
    super();
    this.ident = ident;
    this.expression = expression;
  }

  static parse(p: Parser): AssignmentStatement {
    let ident = Ident.parse(p);

    if (p.getToken() instanceof AssignToken) {
      p.advanceToken();
    } else {
      console.log('expected assignToken');
      p.advanceToken();
    }

    let expression = Expression.parse(p);

    return new AssignmentStatement(ident, expression);
  }

  toDOM(astNodeDivMap: ASTNodeDivMap): HTMLElement {
    let rootElement: HTMLElement = document.createElement("div");
    rootElement.classList.add("assignmentStatementDiv");

    let identDiv = this.ident.toDOM(astNodeDivMap);

    let assignDiv = document.createElement("div");
    assignDiv.classList.add("assignDiv");
    assignDiv.textContent = "=";

    let expression = this.expression.toDOM(astNodeDivMap);

    rootElement.appendChild(identDiv);
    rootElement.appendChild(assignDiv);
    rootElement.appendChild(expression);

    astNodeDivMap.addDivNode(rootElement, this);

    return rootElement;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  getText() {
    return this.ident.getText() + "=" + this.expression.getText();
  }

  getFirstEmpty(): EmptyASTNode {
    return this.expression.getFirstEmpty();
  }

  makeClone() {
    let identClone = this.ident.makeClone();
    let expressionClone = this.expression.makeClone();
    return new AssignmentStatement(identClone, expressionClone);
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);
    rootElement.classList.add('selected');
  }

  evaluateExpressions(limiter) {
    let ident = this.ident.evaluateExpressions(limiter);
    let expression = this.expression.evaluateExpressions(limiter);
    return new AssignmentStatement(ident, expression);
  }
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

  abstract makeClone(): Expression;
  abstract evaluate();
  abstract evaluateExpressions(limiter);
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

  getFirstEmpty(): EmptyASTNode {
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

  evaluateExpressions(limiter): Expression {
    let left = this.leftExpr.makeClone().evaluateExpressions(limiter);
    let right = this.rightExpr.makeClone().evaluateExpressions(limiter);
    if (limiter.ok()) {
      limiter.dec();
      return new PrimaryExpression(this.evaluate());
    } else {
      return new BinaryExpression(left, right, this.operator);
    }
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

  evaluateExpressions(limiter) {
    return new PrimaryExpression(this.value);
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

  evaluateExpressions(limiter) {
    throw new Error("can't eval empty expression!");
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
