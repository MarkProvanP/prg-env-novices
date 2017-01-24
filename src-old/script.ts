require("./styles.scss");
import * as lang from "./lang";

let astDiv : HTMLElement = document.getElementById("astDiv");
let astCursorDiv : HTMLElement = document.createElement("div");
astCursorDiv.id = "astCursorDiv";
let evalDiv: HTMLElement = document.getElementById("evalDiv");
let errorDiv: HTMLElement = document.getElementById("errorDiv");

let empty = new Array(new lang.UndefinedStatement(""));
let initialStatements = new lang.Statements(empty);
let rootASTNode : lang.RootASTNode = new lang.RootASTNode(initialStatements);
let expr : lang.ASTNode; 
let isCursorActive : boolean = false;

let executeButton = document.getElementById("executeButton");
let stepButton = document.getElementById("stepButton");
let execASTDiv = document.getElementById("execASTDiv");
let execEnvDiv = document.getElementById("execEnvDiv");
let execEnvTable = <HTMLTableElement> document.getElementById("execEnvTable");

let selectedASTNode : lang.ASTNode;

let theDivASTNodeMap : ASTNodeDivMap;

export class ASTNodeDivMap {
  private divToASTNode : WeakMap<lang.ASTElement, lang.ASTNode>;
  private astNodeToDiv : WeakMap<lang.ASTNode, lang.ASTElement>;

  constructor() {
    this.divToASTNode = new WeakMap<lang.ASTElement, lang.ASTNode>();
    this.astNodeToDiv = new WeakMap<lang.ASTNode, lang.ASTElement>();
  }

  addNodeDiv(node: lang.ASTNode, div: lang.ASTElement) {
    this.divToASTNode.set(div, node);
    this.astNodeToDiv.set(node, div);
  }

  addDivNode(div: lang.ASTElement, node: lang.ASTNode) {
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

  getASTNode(div: lang.ASTElement) {
    return this.divToASTNode.get(div); 
  }

  getCursorDiv() {
    return astCursorDiv;
  }
}

let lastRemainingInput = "";

astDiv.onkeydown = function(event: KeyboardEvent) {
  if (selectedASTNode) {
    console.log('selected', selectedASTNode);
    let parent : lang.ParentASTNode = selectedASTNode.parent
    console.log('parent', parent);
    if (event.key.length === 1) {
      console.log('last remaining input was', lastRemainingInput);
      let existingInput = selectedASTNode.getText() + lastRemainingInput;
      console.log('existing input was', existingInput);
      let input = existingInput + event.key;
      let l = new lang.Lexer(input);
      let tokens = l.lex();
      let remainingInput = l.getRemainingInput();
      console.log('new last remaining input', remainingInput);
      lastRemainingInput = remainingInput;
      let p = new lang.Parser(tokens);
      let replacement;
      console.log('input', input);
      console.log('tokens', tokens);
      if (selectedASTNode instanceof lang.EmptyExpression) {
        replacement = lang.Expression.parse(p);
      } else if (selectedASTNode instanceof lang.UndefinedStatement) {
        replacement = lang.Statement.parse(p);
      } else if (selectedASTNode instanceof lang.Expression) {
        replacement = lang.Expression.parse(p);
      } else if (selectedASTNode instanceof lang.Statement) {
        replacement = lang.Statement.parse(p);
      } else if (selectedASTNode instanceof lang.Ident) {
        replacement = lang.Ident.parse(p);
      } else if (selectedASTNode instanceof lang.Statements) {
        replacement = lang.Statements.parse(p);
      }
      console.log('replacement', replacement);
      parent.replaceASTNode(selectedASTNode, replacement);
      makeNodeSelected(replacement);
    } else if (event.key === "Backspace") {
      if (parent) {
        let input = selectedASTNode.getText().slice(0, -1);
        let l = new lang.Lexer(input);
        let tokens = l.lex();
        let p = new lang.Parser(tokens);
        let replacement;
        if (selectedASTNode instanceof lang.Expression) {
          replacement = lang.Expression.parse(p);
        } else if (selectedASTNode instanceof lang.Statement) {
          replacement = lang.Statement.parse(p);
        } else if (selectedASTNode instanceof lang.Ident) {
          replacement = lang.Ident.parse(p);
        } else if (selectedASTNode instanceof lang.Statements) {
          replacement = lang.Statements.parse(p);
        }
        parent.replaceASTNode(selectedASTNode, replacement);
        makeNodeSelected(replacement);
      }
    }
  }
  renderAST();
}

function astNodeDivOnclick(event: MouseEvent) {
  event.stopPropagation();
  let selectedDiv = <lang.ASTElement> event.target;
  let found  = theDivASTNodeMap.getASTNode(selectedDiv);
  makeNodeSelected(found);
  renderAST();
}

function makeNodeSelected(node: lang.ASTNode) : void {
  selectedASTNode = node;
}

export function renderAST() {
  theDivASTNodeMap = new ASTNodeDivMap();
  astDiv.innerHTML = "";
  let d = rootASTNode.toDOM(theDivASTNodeMap);
  astDiv.appendChild(d);
  astDiv.onclick = astNodeDivOnclick;
  if (selectedASTNode) {
    selectedASTNode.makeSelected(theDivASTNodeMap);
  }
}

export function renderASTexecute() {
  execASTDiv.innerHTML = "";
  let d = execStateAST.toDOM(execASTNodeDivMap);
  execASTDiv.appendChild(d);
}

let execStateAST;
let executeEnvironment;
let execASTNodeDivMap;
let buttonEnabled = true;

executeButton.onclick = function(event) {
  execASTNodeDivMap = new ASTNodeDivMap();
  execStateAST = rootASTNode.makeClone();
  executeEnvironment = new lang.Environment();
  renderEnvironment(executeEnvironment);
  renderASTexecute();
}

stepButton.onclick = (event) => {
  if (!buttonEnabled) return;
  let result = execStateAST.oneStepExecute(executeEnvironment, execASTNodeDivMap);
  let newAST = result[0];
  let newRootNode = new lang.RootASTNode(newAST);
  let newEnvironment = result[1];
  execStateAST = newRootNode;
  executeEnvironment = newEnvironment;
  buttonEnabled = false;
  window.setTimeout(() => {
    renderASTexecute();
    renderEnvironment(executeEnvironment);
    buttonEnabled = true;
  }, 1000);
}

function renderEnvironment(environment) {
  let tBody = execEnvTable.tBodies[0]
  while (tBody.rows.length) {
    tBody.deleteRow(0);
  }

  let mapping = environment.mapping
  for (let key in mapping) {
    let row = document.createElement("tr");
    let keyTd = document.createElement("td");
    keyTd.textContent = key;
    row.appendChild(keyTd);
    let valueTd = document.createElement("td");
    valueTd.textContent = mapping[key];
    row.appendChild(valueTd);
    tBody.appendChild(row);
  }
}

class Limiter {
  limit: number;
  score: number = 0;

  constructor(limit: number) {
    this.limit = limit;
  }

  incScore() {
    this.score++;
  }

  ok() {
    return this.limit > 0
  }

  dec() {
    this.limit--;
  }

  stop() {
    this.limit = 0;
  }
}

function renderEvalDiv() {
  evalDiv.innerHTML = "";
  let go = true;
  let limit = 1;
  let turns = 0;
  let STOP = 20;
  let lastEvalString;
  while (go) {
    if (turns > STOP) throw new Error('exceeded STOP limit in renderEvalDiv!');
    let limiter = new Limiter(limit);
    try {
      let m = new ASTNodeDivMap();
      let environment = new lang.Environment();
      let evaled = rootASTNode.child.evaluateExpressions(environment, limiter);
      let newEvalString = JSON.stringify(evaled);
      if (newEvalString == lastEvalString) {
        return;
      }
      lastEvalString = newEvalString;
      let wrapper = document.createElement("div");
      wrapper.classList.add('wrapper');
      evalDiv.appendChild(wrapper);
      wrapper.appendChild(evaled.toDOM(m));
      limit++;
    } catch (e) {
      go = false;
      evalDiv.appendChild(document.createTextNode("no more eval steps possible"));
    }
    turns++;
  }
}

renderAST();