import { ASTNodeDivMap } from "../script";

import { Token, NumToken, StringToken, IdentToken, AssignToken, DoToken, WhileToken, LParenToken, RParenToken, LBraceToken, RBraceToken, OperatorToken, Operator, OperatorUtils, Lexer } from "./lex";

export class Environment {
  mapping = {}
  setValue(ident: string, value) {
    console.log('mapping', ident, 'to value', value);
    this.mapping[ident] = value;
  }

  getValue(ident: string) {
    return this.mapping[ident];
  }

  constructor(mapping?) {
    if (mapping) {
      this.mapping = mapping;
    } else {
      this.mapping = {};
    }
  }

  makeClone() {
    let copiedMapping = {};
    for (let key in this.mapping) {
      if (this.mapping[key].makeClone) {
        copiedMapping[key] = this.mapping[key].makeClone();
      } else {
        copiedMapping[key] = JSON.parse(JSON.stringify(this.mapping[key]));
      }
    }
    return new Environment(copiedMapping);
  }
}

export type EvaluateResult = [ASTNode, Environment];

export type ExecuteResult = [ASTNode, Environment];

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

  replaceASTNode(original: ASTNode, replacement: ASTNode): void {
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

  makeClone(): RootASTNode {
    return new RootASTNode(this.child.makeClone());
  }

  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    return this.child.oneStepExecute(environment, astNodeDivMap);
  }
}
export abstract class ASTNode {
  parent: ParentASTNode;

  abstract setParent(parent: ParentASTNode);

  toDOM(astNodeDivMap: ASTNodeDivMap) : ASTElement {
    let rootElement = document.createElement("div") as ASTElement;
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

  abstract oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult;
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
  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    console.trace("this shouldn't ever be called!");
    return [this, environment];
  }
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
    if (limiter) limiter.incScore();
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
    if (limiter) limiter.incScore();
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
    let index = this.statements.indexOf(<Statement> original);
    if (index > -1) {
      this.statements[index] = <Statement> replacement;
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

  executeStatementNo = 0;
  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    let statementToExecute = this.statements[this.executeStatementNo];
    let resultAfterExecuting = statementToExecute.oneStepExecute(environment, astNodeDivMap);
    let newStatement = <Statement> resultAfterExecuting[0];
    let newEnvironment = resultAfterExecuting[1];
    console.log('environment now', newEnvironment);
    this.statements[this.executeStatementNo] = <Statement> newStatement;
    if (newStatement.hasExecuted()) {
      this.executeStatementNo++;
    }
    return [this, newEnvironment];
  }
}

export abstract class Statement extends ASTNode {
  abstract evaluate(environment: Environment): EvaluateResult;
  abstract makeClone(): Statement;
  abstract hasExecuted(): boolean;
  static parse(p: Parser): Statement {
    let tokenPosition = p.getTokenPosition();
    let possibilities = [];

    try {
      return DoWhileStatement.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        possibilities.push(e.possibility);
      }
    }
    p.setTokenPosition(tokenPosition);

    try {
      return AssignmentStatement.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        possibilities.push(e.possibility);
      }
    }
    p.setTokenPosition(tokenPosition);

    console.log('possibilities for statement are', possibilities);

    return UndefinedStatement.parse(p);
  }

  makeExecuting(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('executing');
    let contentElement = rootElement.contentElement
  }
}

window.STATEMENT = Statement;

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
    if (limiter) limiter.incScore();
    limiter.stop();
    return this.makeClone();
  }

  evaluate(environment: Environment): EvaluateResult {
    return [this.makeClone(), environment];
  }

}

export class DoWhileStatement extends Statement {
  executed: boolean = false;
  constructor(public statements: Statements, public condition: Expression) {
    super();
  }

  replaceASTNode(original: ASTNode, replacement: ASTNode) {
    if (this.statements == original) {
      if (replacement instanceof Statements) {
        this.statements = <Statements> replacement;
        this.statements.setParent(this);
      } else {
        console.error("can't replace with non-statements", replacement, original);
        throw new Error("");
      }
    } else if (this.condition == original) {
      if (replacement instanceof Expression) {
        this.condition = <Expression> replacement;
        this.condition.setParent(this);
      } else {
        console.error("can't replace with non-expression", replacement, original);
        throw new Error("");
      }
    }
  }

  static parse(p: Parser): DoWhileStatement {
    let statements: Statements = new Statements([]);
    let condition: Expression = new EmptyExpression();

    if (p.getToken() instanceof DoToken) {
      p.advanceToken();
    } else {
      throw new ParseError('expected DoToken', new DoWhileStatement(statements, condition), []);
    }

    if (p.getToken() instanceof LParenToken) {
      p.advanceToken();
    } else {
      throw new ParseError('expected LParenToken', new DoWhileStatement(statements, condition), []);
    }

    try {
      statements = Statements.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        throw new ParseError('error parsing statements of DoWhileStatement', null, e.buildTrace());
      } else {
        throw e;
      }
    }

    if (p.getToken() instanceof RParenToken) {
      p.advanceToken();
    } else {
      throw new ParseError('expected RParenToken', new DoWhileStatement(statements, condition), []);
    }

    if (p.getToken() instanceof WhileToken) {
      p.advanceToken();
    } else {
      throw new ParseError('expected DoToken', new DoWhileStatement(statements, condition), []);
    }

    if (p.getToken() instanceof LBraceToken) {
      p.advanceToken();
    } else {
      throw new ParseError('expected LBraceToken', new DoWhileStatement(statements, condition), []);
    }

    try {
      condition = Expression.parse(p);
    } catch (e) {
      if (e instanceof ParseError) {
        throw new ParseError('error parsing statements of DoWhileStatement', null, e.buildTrace());
      } else {
        throw e;
      }
    }

    if (p.getToken() instanceof RBraceToken) {
      p.advanceToken();
    } else {
      throw new ParseError('expected RBraceToken', new DoWhileStatement(statements, condition), []);
    }

    return new DoWhileStatement(statements, condition);
  }

  toDOM(astNodeDivMap: ASTNodeDivMap) {
    let rootElement: ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add("do-while-statement");
    let contentElement = rootElement.contentElement;

    let doDiv = document.createElement("div");
    doDiv.classList.add("do-div");
    doDiv.textContent = "do";
    contentElement.appendChild(doDiv);

    let statementsDiv = this.statements.toDOM(astNodeDivMap);
    contentElement.appendChild(statementsDiv);

    let whileDiv = document.createElement("div");
    whileDiv.classList.add("while-div");
    whileDiv.textContent = "while";
    contentElement.appendChild(whileDiv);

    let conditionDiv = this.condition.toDOM(astNodeDivMap);
    contentElement.appendChild(conditionDiv);

    return rootElement;
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
    this.statements.setParent(this);
    this.condition.setParent(this);
  }

  getText() {
    return `do{${this.statements.getText()}}while(${this.condition.getText()})`;
  }

  getFirstEmpty(): EmptyASTNode {
    return this.statements.getFirstEmpty() || this.condition.getFirstEmpty();
  }

  makeClone() {
    let statementsClone = this.statements.makeClone();
    let conditionClone = this.condition.makeClone();
    return new DoWhileStatement(statementsClone, conditionClone);
  }

  makeSelected(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluateExpressions(environment, limiter) {
    throw new Error("you can't evaluate a DoWhileStatement!");
  }

  evaluate(environment: Environment): EvaluateResult {
    throw new Error("you can't evaluate a DoWhileStatement!");
  }

  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    this.makeExecuting(astNodeDivMap);
    let newStatement = this;
    let executeResult = this.statements.oneStepExecute(environment, astNodeDivMap);
    let newStatements = executeResult[0];
    let newEnvironment = executeResult[1];
    newStatement.statements = <Statements> newStatements;
    return [newStatement, newEnvironment];
  }

  hasExecuted() {
    return this.executed;
  }
}

export class AssignmentStatement extends Statement implements ParentASTNode {
  ident: AbstractIdent;
  expression: Expression;

  executed: boolean = false;

  constructor(ident: AbstractIdent, expression: Expression) {
    super();
    this.ident = ident;
    this.expression = expression;
  }

  replaceASTNode(original: ASTNode, replacement: ASTNode) {
    if (this.ident === original) {
      if (replacement instanceof AbstractIdent) {
        this.ident = <AbstractIdent> replacement;
        this.ident.setParent(this);
      } else {
        console.error("can't replace with non-ident", replacement, original);
        throw new Error("can't replace with non-ident" + replacement + original);
      }
    } else if (this.expression === original) {
      if (replacement instanceof Expression) {
        this.expression = <Expression> replacement;
        this.expression.setParent(this);
      } else {
        console.error("can't replace with non-expression", replacement, original);
        throw new Error("can't replace with non-expression" + replacement + original);
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
    if (limiter) limiter.incScore();
    let ident = this.ident.evaluateExpressions(environment, limiter);
    let expression = this.expression.evaluateExpressions(environment, limiter);
    return new AssignmentStatement(ident, expression);
  }

  evaluate(environment: Environment): EvaluateResult {
    let newStatement = this.makeClone();
    let newEnvironment = environment.makeClone();
    let evaluatedResult = this.expression.evaluate(environment);
    newEnvironment.setValue((<Ident> this.ident).ident, evaluatedResult);

    return [newStatement, newEnvironment];
  }

  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    this.makeExecuting(astNodeDivMap);
    let newStatement = this;
    let executeResult = this.expression.oneStepExecute(environment, astNodeDivMap);
    let newExpression = executeResult[0];
    let newEnvironment = executeResult[1];
    if (newExpression instanceof LiteralExpression ) {
      newEnvironment.setValue(this.ident.ident, newExpression.evaluate(environment));
      this.executed = true;
    }
    newStatement.expression = <Expression> newExpression;
    return [newStatement, newEnvironment];
  }

  hasExecuted() {
    return this.executed;
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

  toDOM(astNodeDivMap : ASTNodeDivMap) : ASTElement {
    return super.toDOM(astNodeDivMap);
  }

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

  makeEvaluating(astNodeDivMap: ASTNodeDivMap): void {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('evaluating');
    let contentElement = rootElement.contentElement
  }
}

export class BinaryExpression extends Expression implements ParentASTNode, ASTNode {
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
    
    if (typeof this.leftExpr.toDOM != "function") {
      debugger;
    }
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
    if (limiter) limiter.incScore();
    let left = this.leftExpr.makeClone().evaluateExpressions(environment, limiter);
    let right = this.rightExpr.makeClone().evaluateExpressions(environment, limiter);
    if (limiter.ok()) {
      limiter.dec();
      return new EvaluatedValue(this.evaluate(environment));
    } else {
      return new BinaryExpression(left, right, this.operator);
    }
  }

  makeClone(): Expression {
    let left = this.leftExpr.makeClone();
    let right = this.rightExpr.makeClone();
    return new BinaryExpression(left, right, this.operator);
  }

  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    if (this.leftExpr instanceof LiteralExpression) {
      // Left cannot be evaluated any more
    } else {
      let leftEvalResult = this.leftExpr.oneStepExecute(environment, astNodeDivMap)
      this.leftExpr = <Expression> leftEvalResult[0];
      let newEnvironment = leftEvalResult[1];
      return [<BinaryExpression> this, newEnvironment];
    }
    if (this.rightExpr instanceof LiteralExpression) {
      // Right cannot be evaluated any more
    } else {
      let rightEvalResult = this.rightExpr.oneStepExecute(environment, astNodeDivMap);
      this.rightExpr = <Expression> rightEvalResult[0];
      let newEnvironment = rightEvalResult[1];
      return [<BinaryExpression> this, newEnvironment];
    }
    this.makeEvaluating(astNodeDivMap);
    let evaluatedExpression = this.evaluate(environment);
    let newExpression = new EvaluatedValue(evaluatedExpression);
    return [newExpression, environment];
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

  static create(value): PrimaryExpression {
    if (typeof value == 'number') {
      return new NumberLiteral(value);
    } else if (typeof value == 'string') {
      return new StringLiteral(value);
    }
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
    if (limiter) limiter.incScore();
    return new IdentExpression(this.ident);
  }

  makeClone(): IdentExpression {
    return new IdentExpression(this.ident);
  }

  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    this.makeEvaluating(astNodeDivMap);
    let value = this.evaluate(environment);
    let newExpression = new EvaluatedValue(value);
    return [newExpression, environment];
  }
}

export abstract class LiteralExpression extends PrimaryExpression{
  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    console.trace("this shouldn't ever be called!");
    return [this, environment];
  }
}

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
    if (limiter) limiter.incScore();
    return new NumberLiteral(this.value);
  }

  makeClone(): NumberLiteral {
    return new NumberLiteral(this.value);
  }

}

export class StringLiteral extends LiteralExpression {
  value: string;

  constructor(value: string) {
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
    if (limiter) limiter.incScore();
    return new StringLiteral(this.value);
  }

  makeClone(): StringLiteral {
    return new StringLiteral(this.value);
  }
}

export class EmptyExpression extends Expression {
  constructor(public text?: string) {
    super();
    if (!text) {
      this.text = "";
    }
  }

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
    if (limiter) limiter.incScore();
    limiter.stop();
    return this.makeClone();
  }

  makeClone(): EmptyExpression {
    return new EmptyExpression(this.text);
  }

  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    return [<EmptyExpression> this, environment];
  }
}

export class EvaluatedValue extends LiteralExpression {
  constructor(public value: any) {
    super();
  }

  toString(): string {
    return String(this.value);
  }

  setParent(parent: ParentASTNode) {
    this.parent = parent;
  }

  toDOM(astNodeDivMap: ASTNodeDivMap): ASTElement {
    let rootElement: ASTElement = super.toDOM(astNodeDivMap);
    rootElement.classList.add('evaluated-value');
    let contentElement = rootElement.contentElement;

    let exprValueDiv = document.createElement("div");
    exprValueDiv.textContent = String(this.value);
    exprValueDiv.classList.add('evaluated-value-text');
    contentElement.appendChild(exprValueDiv);

    return rootElement;
  }

  getFirstEmpty() { return null; }

  getText() { return String(this.value); }

  makeSelected(astNodeDivMap: ASTNodeDivMap) {
    let rootElement = astNodeDivMap.getDiv(this);  
    rootElement.classList.add('selected');
    let contentElement = rootElement.contentElement
    contentElement.appendChild(astNodeDivMap.getCursorDiv());
  }

  evaluate(environment: Environment) {
    return this.value;
  }

  evaluateExpressions(environment, limiter): EvaluatedValue {
    if (limiter) limiter.incScore();
    limiter.stop();
    return this.makeClone();
  }

  makeClone(): EvaluatedValue {
    return new EvaluatedValue(this.value);
  }

  oneStepExecute(environment: Environment, astNodeDivMap: ASTNodeDivMap): ExecuteResult {
    return [<EvaluatedValue> this, environment];
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

window.PARSER = Parser;
