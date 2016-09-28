require ("./styles.scss");
import * as lang from "./lang";

let astDiv : HTMLElement = document.getElementById("astDiv");
let astCursorDiv : HTMLElement = document.createElement("div");
astCursorDiv.id = "astCursorDiv";

let initialEmptyExpression = new lang.EmptyExpression()
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
}

astDiv.onkeydown = function(event: KeyboardEvent) {
  if (selectedASTNode) {
    let parent : lang.ParentASTNode = selectedASTNode.parent
    if (selectedASTNode instanceof lang.EmptyExpression) {
      if (event.key.length === 1) {
        let input = event.key;
        let tokens = lang.lex(input);
        let p = new lang.Parser(tokens);
        let newExpr = lang.Expression.parse(p);
        parent.replaceASTNode(selectedASTNode, newExpr);
        makeNodeSelected(newExpr);
      }
    } else {
      if (event.key.length === 1) {
        let input = selectedASTNode.getText() + event.key;
        let tokens = lang.lex(input);
        let p = new lang.Parser(tokens);
        let newExpr = lang.Expression.parse(p);
        parent.replaceASTNode(selectedASTNode, newExpr);
        let firstEmptyExpr = parent.getFirstEmpty();
        makeNodeSelected(firstEmptyExpr);
      } else {
        if (event.key === "Backspace") {
          if (parent) {
            let newEmpty = new lang.EmptyExpression();
            parent.replaceASTNode(selectedASTNode, newEmpty);
            makeNodeSelected(newEmpty);
          }
        }
      }
    }
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

function applySelectedStylingToNode(node : lang.ASTNode) : void {
  let nodeDiv = theDivASTNodeMap.getDiv(node);
  nodeDiv.classList.add('selectedASTNode');
  nodeDiv.appendChild(astCursorDiv);
}

export function renderAST() {
  theDivASTNodeMap = new ASTNodeDivMap();
  astDiv.innerHTML = "";
  let d = rootASTNode.toDOM(theDivASTNodeMap);
  astDiv.appendChild(d);
  astDiv.onclick = astNodeDivOnclick;
  if (selectedASTNode) {
    applySelectedStylingToNode(selectedASTNode);
  }
}

renderAST();
