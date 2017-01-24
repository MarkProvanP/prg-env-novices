import * as lang from "./new-lang";

function nodeClassName(node: lang.ASTNode) {
  return node.constructor.name;
}

export class ASTNodeDivMap {
  private divToASTNode : WeakMap<HTMLElement, lang.ASTNode>;
  private astNodeToDiv : WeakMap<lang.ASTNode, HTMLElement>;

  constructor() {
    this.divToASTNode = new WeakMap<HTMLElement, lang.ASTNode>();
    this.astNodeToDiv = new WeakMap<lang.ASTNode, HTMLElement>();
  }

  addNodeDiv(node: lang.ASTNode, div: HTMLElement) {
    this.divToASTNode.set(div, node);
    this.astNodeToDiv.set(node, div);
  }

  addDivNode(div: HTMLElement, node: lang.ASTNode) {
    this.addNodeDiv(node, div);
  }

  removeASTNode(node: lang.ASTNode) {
    let div = this.astNodeToDiv.get(node);
    this.astNodeToDiv.delete(node);
    this.divToASTNode.delete(div);
  }

  getDiv(node: lang.ASTNode) {
    return this.astNodeToDiv.get(node);
  }

  getASTNode(div: HTMLElement) {
    return this.divToASTNode.get(div); 
  }
}

export class Renderer {
  astNodeDivMap: ASTNodeDivMap

  getContentElement(element) {
    return element.getElementsByClassName("content")[0];
  }

  createCommonElement(node: lang.ASTNode) {
    let rootElement = document.createElement("div");
    rootElement.classList.add('ast-node');
    rootElement.classList.add(nodeClassName(node))
    this.astNodeDivMap.addDivNode(rootElement, node);

    let titleElement = document.createElement("div");
    titleElement.textContent = nodeClassName(node);
    titleElement.classList.add('title');
    rootElement.appendChild(titleElement);

    let contentElement = document.createElement("div");
    contentElement.classList.add('content');
    rootElement.appendChild(contentElement);

    return rootElement;
  }

  createExpressionElement(expression: lang.Expression) {

  }

  createIntegerElement(integer: lang.Integer) {
    let rootElement = this.createCommonElement(integer);
    let contentElement = this.getContentElement(rootElement);
    contentElement.textContent = String(integer.value);
    return rootElement;
  }

  createBinaryExpressionElement(binaryExpression: lang.BinaryExpression) {
    let rootElement = this.createCommonElement(binaryExpression);
    let contentElement = this.getContentElement(rootElement);
    
    let leftElementDiv = binaryExpression.left.render(this);
    contentElement.appendChild(leftElementDiv);

    let operatorDiv = document.createElement("div");
    operatorDiv.classList.add("operator");
    operatorDiv.textContent = OperatorUtils.toChar(binaryExpression.op);
    contentElement.appendChild(operatorDiv);

    let rightElementDiv = binaryExpression.right.render(this);
    contentElement.appendChild(rightElementDiv);

    return rootElement;
  }

  createAssignmentStatementElement(assignmentStatement: lang.AssignmentStatement) {
    let rootElement = this.createCommonElement(assignmentStatement);
    let contentElement = this.getContentElement(rootElement);

    let identDiv = this.createIdentElement(assignmentStatement.ident)
    contentElement.appendChild(identDiv);

    let assignDiv = document.createElement("div");
    assignDiv.classList.add("assign");
    assignDiv.textContent = "=";
    contentElement.appendChild(assignDiv);

    let expression = assignmentStatement.expression.render(this);
    contentElement.appendChild(expression);

    return rootElement;
  }

  createWhileStatementElement(whileStatement: lang.WhileStatement) {
    let rootElement = this.createCommonElement(whileStatement);
    let contentElement = this.getContentElement(rootElement);

    let doDiv = document.createElement("div");
    doDiv.classList.add("do");
    doDiv.textContent = "do";
    contentElement.appendChild(doDiv);

    let statementsDiv = whileStatement.statements.render(this)
    contentElement.appendChild(statementsDiv);

    let whileDiv = document.createElement("div");
    whileDiv.classList.add("while");
    whileDiv.textContent = "while";
    contentElement.appendChild(whileDiv);

    let conditionDiv = whileStatement.condition.render(this)
    contentElement.appendChild(conditionDiv);

    return rootElement;
  }

  createStatementsElement(statements: lang.Statements) {
    let rootElement = this.createCommonElement(statements);
    let contentElement = this.getContentElement(rootElement);

    let statementListElement = document.createElement("ol");
    contentElement.appendChild(statementListElement);

    statements.statements.forEach(statement => {
      let statementDiv = statement.render(this)
      let statementListItem = document.createElement("li");
      statementListItem.appendChild(statementDiv);
      statementListElement.appendChild(statementListItem);
    });

    return rootElement;
  }

  createIdentElement(ident: lang.Ident) {
    let rootElement = this.createCommonElement(ident);
    let contentElement = this.getContentElement(rootElement);
  }
}
