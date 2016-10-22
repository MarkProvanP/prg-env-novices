import { ASTNodeDivMap } from "../script";

import { Token, NumToken, StringToken, IdentToken, AssignToken, OperatorToken, Operator, OperatorUtils, Lexer } from "./lex";

export class Environment {
  mapping = {}
  setValue(ident, value) {
    this.mapping[ident] = value;
  }

  getValue(ident) {
    return this.mapping[value];
  }
}

export class ASTElement extends HTMLElement {
  contentElement: HTMLElement;
}

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
    rootDiv.classList.add('ast-root');
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

  toDOM(astNodeDivMap: ASTNodeDivMap) : ASTElement {
    let rootElement = document.createElement("div");
    rootElement.classList.add('ast-node');
    astNodeDivMap.addDivNode(rootElement, this);

    let titleElement = document.createElement("div");
    titleElement.textContent = this.constructor.name;
    titleElement.classList.add('title');
    rootElement.appendChild(titleElement);

    let contentElement = document.createElement("div");
    contentElement.classList.add('content');
    rootElement.appendChild(contentElement);
    rootElement.contentElement = contentElement;

    return rootElement;
  }
  
  abstract getText(): string;

  abstract getFirstEmpty(): EmptyASTNode;

  abstract makeSelected(astNodeDivMap: ASTNodeDivMap): void;

  abstract makeClone(): ASTNode;

  abstract evaluateExpressions(environemnt, limiter);
}

export class ParseError extends Error {
  constructor(message, public possibility: ASTNode, public trace: ParseError[]) {
    super(message);
  }

  buildTrace(): ParseError[] {
    return new Array(<ParseError>this).concat(this.trace);
  }
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

  toDOM(astNodeDivMap: ASTNodeDivMap): ASTElement {
    let rootElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("ident");
    let contentElement = rootElement.contentElement;
    contentElement.textContent = this.ident;
    return rootElement;
  }

  getText() {
    return this.ident;
  }

  getFirstEmpty() {
    return null;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  makeClone(): Ident {
    return new Ident(this.ident);
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    return this.makeClone();
  }

  static parse(p: Parser): AbstractIdent {
    let ident;

    if (p.getToken() instanceof IdentToken) {
      ident = (<IdentToken> p.getToken()).ident;
      p.advanceToken();
    } else {
      console.log('expected identToken, got', p.getToken());
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

  toDOM(astNodeDivMap: ASTNodeDivMap): ASTElement {
    let rootElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("empty-ident");
    let contentElement = rootElement.contentElement;
    contentElement.textContent = "ident";
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
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    return this.makeClone();
  }
}

export class Statements extends ASTNode implements ParentASTNode {
  statements: Statement[];

  constructor(statements: Statement[]) {
    super();
    this.statements = statements;
    this.statements.forEach(statement => {
      statement.setParent(this)
    });
  }

  replaceASTNode(original: ASTNode, replacement: ASTNode): void {
    let index = this.statements.indexOf(original);
    if (index > -1) {
      this.statements[index] = replacement;
      replacement.setParent(this);
    }
    let lastStatement = this.statements[this.statements.length - 1];
    if (!(lastStatement instanceof UndefinedStatement)) {
      let newUndefinedStatement = new UndefinedStatement();
      newUndefinedStatement.setParent(this);
      this.statements.push(newUndefinedStatement);
    }
  }

  static parse(p: Parser) {
    let tokenPosition = p.getTokenPosition();
    let statements: Statement[] = []

    while (p.hasAnotherToken()) {
      let statement = Statement.parse(p);
      statement.setParent(this);
      statements.push(statement);
    }

    statements.push(new UndefinedStatement());

    return new Statements(statements);
  }

  setParent(parent) {
    this.parent = parent;
  }

  getText() {
    return this.statements.map(statement => statement.getText()).join('');
  }

  makeClone() {
    let statements = this.statements.map(statement => statement.makeClone());
    return new Statements(statements);
  }

  getFirstEmpty() {
    return null;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap) {
    let rootElement = astNodeDivMap.getDiv(this);
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluateExpressions(environment, limiter) {
    this.statements.forEach(statement => statement.evaluateExpressions(environment, limiter));
  }

  toDOM(astNodeDivMap: ASTNodeDivMap): ASTElement {
    let rootElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("statements");
    let contentElement = rootElement.contentElement;

    let statementListElement = document.createElement("ol");
    contentElement.appendChild(statementListElement);

    this.statements.forEach(statement => {
      let statementDiv = statement.toDOM(astNodeDivMap);
      let statementListItem = document.createElement("li");
      statementListItem.appendChild(statementDiv);
      statementListElement.appendChild(statementListItem);
    });

    return rootElement;
  }
}

export abstract class Statement extends ASTNode {
  static parse(p: Parser): Statement {
    let tokenPosition = p.getTokenPosition();
    let possibilities = [];

    try {
      return AssignmentStatement.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        possibilities.push(e.possibility);
      }
    }
    p.setTokenPosition(tokenPosition);

    try {
      return UndefinedStatement.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        possibilities.push(e.possibility);
      }
    }
    p.setTokenPosition(tokenPosition);

    console.log('possibilities for statement are', possibilities);

    return new UndefinedStatement();
  }
}

export class UndefinedStatement extends Statement implements EmptyASTNode {
  text: string;

  constructor(text?: string) {
    super();
    this.text = text || "";
  }

  static parse(p: Parser) {
    let text = p.getToken().toString();
    p.advanceToken();
    if (p.hasAnotherToken()) {
      let remaining = p.getToken().toString();
      text += remaining;
    }
    return new UndefinedStatement(text);   
  }

  toDOM(astNodeDivMap: ASTNodeDivMap): ASTElement {
    let rootElement: ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("empty-statement");
    let contentElement = rootElement.contentElement;
    contentElement.textContent = this.text || '[empty]';
    return rootElement;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  getText() {
    return this.text;
  }

  getFirstEmpty(): EmptyASTNode {
    return this;
  }

  makeClone() {
    return new UndefinedStatement(this.text);
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    limiter.stop();
    return this.makeClone();
  }

}

export class AssignmentStatement extends Statement implements ParentASTNode {
  ident: AbstractIdent;
  expression: Expression;

  constructor(ident: AbstractIdent, expression: Expression) {
    super();
    this.ident = ident;
    this.expression = expression;
  }

  replaceASTNode(original: ASTNode, replacement: ASTNode) {
    if (this.ident === original) {
      if (replacement instanceof AbstractIdent) {
        this.ident = replacement;
        this.ident.setParent(this);
      } else {
        throw new Error("can't replace with non-ident", replacement, original);
      }
    } else if (this.expression === original) {
      if (replacement instanceof Expression) {
        this.expression = <Expression> replacement;
        this.expression.setParent(this);
      } else {
        throw new Error("can't replace with non-expression", replacement, original);
      }
    }
  }

  static parse(p: Parser): AssignmentStatement {
    let ident: AbstractIdent = new EmptyIdent();
    let expression: Expression = new EmptyExpression();
    let attemptSoFar = () => new AssignmentStatement(ident, expression);
    try {
      ident = Ident.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        throw new ParseError('error parsing ident of assignmentStatement', attemptSoFar(), e.buildTrace());
      } else {
        throw e;
      }
    }

    attemptSoFar = () => new AssignmentStatement(ident, expression);
    if (p.getToken() instanceof AssignToken) {
      p.advanceToken();
    } else {
      throw new ParseError('expected AssignToken', attemptSoFar(), []);
    }

    try {
      expression = Expression.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        throw new ParseError('error parsing expression of assignmentstatement', attemptSoFar(), e.buildTrace());
      } else {
        throw e;
      }
    }

    console.log('completed parsing of assignment statement!', ident, expression);
    return new AssignmentStatement(ident, expression);
  }

  toDOM(astNodeDivMap: ASTNodeDivMap): ASTElement {
    let rootElement: ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("assignment-statement");
    let contentElement = rootElement.contentElement;

    let identDiv = this.ident.toDOM(astNodeDivMap);
    contentElement.appendChild(identDiv);

    let assignDiv = document.createElement("div");
    assignDiv.classList.add("assignDiv");
    assignDiv.textContent = "=";
    contentElement.appendChild(assignDiv);

    let expression = this.expression.toDOM(astNodeDivMap);
    contentElement.appendChild(expression);

    return rootElement;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
    this.ident.setParent(this);
    this.expression.setParent(this);
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
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    let ident = this.ident.evaluateExpressions(environment, limiter);
    let expression = this.expression.evaluateExpressions(environment, limiter);
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

  abstract toDOM(astNodeDivMap : ASTNodeDivMap) : ASTElement;

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
  abstract evaluate(environment);
  abstract evaluateExpressions(environment, limiter);
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

  toDOM(astNodeDivMap : ASTNodeDivMap) : ASTElement {
    let rootElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("binary-expression"); 
    let contentElement = rootElement.contentElement;
    
    let leftElementDiv = this.leftExpr.toDOM(astNodeDivMap);
    contentElement.appendChild(leftElementDiv);


    let operatorDiv = document.createElement("div");
    operatorDiv.classList.add("operatorDiv");
    operatorDiv.textContent = OperatorUtils.toChar(this.operator);
    contentElement.appendChild(operatorDiv);

    let rightElementDiv = this.rightExpr.toDOM(astNodeDivMap);
    contentElement.appendChild(rightElementDiv);

    return rootElement;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate(environment: Environment) {
    let left = this.leftExpr.evaluate(environment);
    let right = this.rightExpr.evaluate(environment);
    let func = OperatorUtils.toFunc(this.operator);
    return func(left, right);
  }

  evaluateExpressions(environment, limiter): Expression {
    limiter.incScore();
    let left = this.leftExpr.makeClone().evaluateExpressions(environment, limiter);
    let right = this.rightExpr.makeClone().evaluateExpressions(environment, limiter);
    if (limiter.ok()) {
      limiter.dec();
      return new PrimaryExpression(this.evaluate(environment));
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

export abstract class PrimaryExpression extends Expression {
  static parse(p: Parser): Expression {
    let initialParsePosition = p.getTokenPosition();
    try {
      let numberExpression = NumberLiteral.parse(p);
      return numberExpression;
    } catch (e) {
      console.log(`tried parsing number expression, didn't work, ${e}`);
      p.setTokenPosition(initialParsePosition);
    }
    try {
      let stringLiteral = StringLiteral.parse(p);
      return stringLiteral;
    } catch (e) {
      console.log(`tried parsing string literal, didn't work, ${e}`);
      p.setTokenPosition(initialParsePosition);
    }
    try {
      let identExpression = IdentExpression.parse(p);
      return identExpression;
    } catch (e) {
      console.log(`tried parsing ident expression, didn't work, ${e}`);
      p.setTokenPosition(initialParsePosition);
    }
    return new EmptyExpression();
  }
}

export class IdentExpression extends PrimaryExpression {
  ident: string;

  constructor(ident: string) {
    super();
    this.ident = ident;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  static parse(p: Parser) : IdentExpression {
    let staticIdentExpression : IdentExpression;
    if (p.getToken() instanceof IdentToken) {
      staticIdentExpression = new IdentExpression((<IdentToken> p.getToken()).ident);
      p.advanceToken();
    } else {
      throw Error('not valid ident expression');
    }
    return staticIdentExpression;
  }

  toString() : string {
    return String(this.ident);
  }

  getText() : string {
    return String(this.ident);
  }

  getFirstEmpty() { return null; }

  toDOM(astNodeDivMap : ASTNodeDivMap) : ASTElement {
    let rootElement : ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("primary-expression");
    let contentElement = rootElement.contentElement;
    contentElement.textContent = String(this.ident);
    return rootElement;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate(environment: Environment) {
    return environment.getValue(this.ident);
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    return new IdentExpression(this.ident);
  }

  makeClone(): IdentExpression {
    return new IdentExpression(this.ident);
  }
}

export abstract class LiteralExpression extends PrimaryExpression{}

export class NumberLiteral extends LiteralExpression {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  static parse(p: Parser) : NumberLiteral {
    let staticNumberLiteral : NumberLiteral;
    if (p.getToken() instanceof NumToken) {
      staticNumberLiteral = new NumberLiteral((<NumToken> p.getToken()).value);
      p.advanceToken();
    } else {
      throw Error('not valid number expression');
    }
    return staticNumberLiteral;
  }

  toString() : string {
    return String(this.value);
  }

  getText() : string {
    return String(this.value);
  }

  getFirstEmpty() { return null; }

  toDOM(astNodeDivMap : ASTNodeDivMap) : ASTElement {
    let rootElement : ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("primary-expression");
    let contentElement = rootElement.contentElement;
    contentElement.textContent = String(this.value);
    return rootElement;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate(environment: Environment) {
    return this.value;
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    return new NumberLiteral(this.value);
  }

  makeClone(): NumberLiteral {
    return new NumberLiteral(this.value);
  }
}

export class StringLiteral extends LiteralExpression {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  static parse(p: Parser): StringLiteral {
    let staticStringLiteral: StringLiteral;
    if (p.getToken() instanceof StringToken) {
      staticStringLiteral = new StringLiteral((<StringToken> p.getToken()).value);
      p.advanceToken();
    } else {
      throw Error('not valid string literal');
    }
    return staticStringLiteral;
  }

  toString() : string {
    return String(this.value);
  }

  getText() : string {
    return String(this.value);
  }

  getFirstEmpty() { return null; }

  toDOM(astNodeDivMap : ASTNodeDivMap) : ASTElement {
    let rootElement : ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("primary-expression");
    let contentElement = rootElement.contentElement;
    contentElement.textContent = String(this.value);
    return rootElement;
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate(environment: Environment) {
    return this.value;
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    return new StringLiteral(this.value);
  }

  makeClone(): StringLiteral {
    return new StringLiteral(this.value);
  }
}

export class EmptyExpression extends Expression {
  constructor(public text: string) {}

  toString() : string {
    return this.text;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  toDOM(astNodeDivMap : ASTNodeDivMap) : ASTElement {
    let rootElement: ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("empty-expression");
    let contentElement = rootElement.contentElement;

    let exprTextDiv = document.createElement("div");
    exprTextDiv.textContent = this.text || 'expression';
    exprTextDiv.classList.add('empty-expr-text');
    contentElement.appendChild(exprTextDiv);

    return rootElement;
  }

  getFirstEmpty() { return this; };

  getText() : string { return ""; }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate(environment: Environment) {
    return undefined;
  }

  evaluateExpressions(environment, limiter) {
    limiter.incScore();
    limiter.stop();
    return this.makeClone();
  }

  makeClone(): EmptyExpression {
    return new EmptyExpression(this.text);
  }
}

export class Parser {
  tokenList : Token[];
  tokenPosition : number = 0;

  getTokenPosition() {
    return this.tokenPosition;
  }

  setTokenPosition(tokenPosition) {
    this.tokenPosition = tokenPosition;
  }

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
