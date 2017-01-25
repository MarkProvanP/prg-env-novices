import * as lang from "./lang";
import * as vm from "machine";

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

  constructor() {
    this.astNodeDivMap = new ASTNodeDivMap();
  }

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

  createIntegerElement(integer: lang.Integer) {
    let rootElement = this.createCommonElement(integer);
    let contentElement = this.getContentElement(rootElement);
    contentElement.textContent = String(integer.value);
    return rootElement;
  }

  createValueExpressionElement(value: lang.ValueExpression) {
    let rootElement = this.createCommonElement(value);
    let contentElement = this.getContentElement(rootElement);
    contentElement.textContent = value.ident.name;
    return rootElement;
  }

  createBinaryExpressionElement(binaryExpression: lang.BinaryExpression) {
    let rootElement = this.createCommonElement(binaryExpression);
    let contentElement = this.getContentElement(rootElement);
    
    let leftElementDiv = binaryExpression.left.render(this);
    contentElement.appendChild(leftElementDiv);

    let operatorDiv = document.createElement("div");
    operatorDiv.classList.add("operator");
    operatorDiv.textContent = binaryExpression.op;
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

    let whileDiv = document.createElement("div");
    whileDiv.classList.add("while");
    whileDiv.textContent = "while";
    contentElement.appendChild(whileDiv);

    let conditionDiv = whileStatement.condition.render(this)
    contentElement.appendChild(conditionDiv);

    let doDiv = document.createElement("div");
    doDiv.classList.add("do");
    doDiv.textContent = "do";
    contentElement.appendChild(doDiv);

    let statementsDiv = whileStatement.statements.render(this)
    contentElement.appendChild(statementsDiv);

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
    contentElement.textContent = ident.name;
    return rootElement;
  }
}

export function renderMachine(machine: vm.Machine) {
  let rootElement = document.createElement("div");

  let titleElement = document.createElement("div");
  titleElement.classList.add('title');
  titleElement.textContent = `Virtual Machine - IP: ${machine.instructionPointer}, Count: ${machine.instructionCount}`
  rootElement.appendChild(titleElement);

  let instructionsElement = document.createElement("div");
  instructionsElement.classList.add("instructions");
  instructionsElement.textContent = "Instructions"
  machine.instructions.forEach((instruction, index) => {
    let element = renderInstruction(instruction, index)
    if (index == machine.instructionPointer) {
      element.classList.add("current-ip");
    }
    instructionsElement.appendChild(element)

  })
  rootElement.appendChild(instructionsElement);

  let stackElement = document.createElement("div");
  stackElement.classList.add("stack");
  stackElement.textContent = "Stack";
  machine.stack.forEach((element) => {
    let e = document.createElement("div");
    e.classList.add("element");
    e.textContent = element;
    stackElement.appendChild(e);
  })
  rootElement.appendChild(stackElement);

  let envElement = document.createElement("div");
  envElement.classList.add("env");
  envElement.textContent = "Environment";
  machine.envStack.forEach((element) => {
    let e = renderEnvFrame(element);
    envElement.appendChild(e);
  })
  rootElement.appendChild(envElement);


  return rootElement;
}

function renderInstruction(instruction, index) {
  let rootElement = document.createElement("div");
  rootElement.classList.add("instruction");

  let indexElement = document.createElement("div");
  indexElement.classList.add("index")
  indexElement.textContent = index;
  rootElement.appendChild(indexElement);

  let opcodeElement = document.createElement("div");
  opcodeElement.textContent = instruction.constructor.name + JSON.stringify(instruction)
  rootElement.appendChild(opcodeElement);
  
  return rootElement;
}

function renderEnvFrame(envElement: vm.EnvElement) {
  let rootElement = document.createElement("div");
  rootElement.classList.add("env-frame");

  for (let key of envElement.keys()) {
    let value = envElement.get(key);
    let mapping = document.createElement("div");
    mapping.textContent = `${key} -> ${JSON.stringify(value)}`
    rootElement.appendChild(mapping);
  }

  return rootElement;
}