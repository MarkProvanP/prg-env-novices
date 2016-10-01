require("./styles.scss");
import * as lang from "./lang";

let astDiv : HTMLElement = document.getElementById("astDiv");
let astCursorDiv : HTMLElement = document.createElement("div");
astCursorDiv.id = "astCursorDiv";
let evalDiv: HTMLElement = document.getElementById("evalDiv");
let errorDiv: HTMLElement = document.getElementById("errorDiv");

let initialEmptyExpression = new lang.UndefinedStatement("")
let rootASTNode : lang.RootASTNode = new lang.RootASTNode(initialEmptyExpression);
let expr : lang.ASTNode; 
let isCursorActive : boolean = false;

let selectedASTNode : lang.ASTNode;

let theDivASTNodeMap : ASTNodeDivMap;

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

  getCursorDiv() {
    return astCursorDiv;
  }
}

astDiv.onkeydown = function(event: KeyboardEvent) {
  errorDiv.textContent = "";
  try {
    if (selectedASTNode) {
      let parent : lang.ParentASTNode = selectedASTNode.parent
      if (event.key.length === 1) {
        let input = selectedASTNode.getText() + event.key;
        let l = new lang.Lexer(input);
        let tokens = l.lex();
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
          }
          parent.replaceASTNode(selectedASTNode, replacement);
          makeNodeSelected(replacement);
        }
      }
    }
  } catch (e) {
    errorDiv.textContent = e;
    console.error(e);
  }
  renderAST();
}

function astNodeDivOnclick(event: MouseEvent) {
  event.stopPropagation();
  let selectedDiv = <HTMLElement> event.target;
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
  renderEvalDiv();
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
      let evaled = rootASTNode.child.evaluateExpressions(limiter);
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
