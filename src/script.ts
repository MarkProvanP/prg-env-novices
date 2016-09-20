import * as lang from "./lang";

let lexedDiv : HTMLElement = document.getElementById("lexedDiv");
let inputDiv : HTMLElement = document.getElementById("inputDiv");
let parsedDiv : HTMLElement = document.getElementById("parsedDiv");
let astDiv : HTMLElement = document.getElementById("astDiv");
let astCursorDiv : HTMLElement = document.createElement("div");
astCursorDiv.id = "astCursorDiv";

let text : string = "";
let cursorPosition : number = 0;
let rootASTNode : lang.RootASTNode;
let expr : lang.ASTNode; 
let isCursorActive : boolean = false;
var cursorDiv = document.getElementById("cursorDiv");

let selectedASTNode : lang.ASTNode;

let theDivASTNodeMap : ASTNodeDivMap;

inputDiv.onclick = function() {
  toggleCursorActive();
};

export function lexText() {
  console.log(lang.lex(text));
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
      }
    } else {
      if (event.key.length === 1) {
        let input = selectedASTNode.getText() + event.key;
        let tokens = lang.lex(input);
        let p = new lang.Parser(tokens);
        let newExpr = lang.Expression.parse(p);
        parent.replaceASTNode(selectedASTNode, newExpr);
        let firstEmptyExpr = parent.getFirstEmpty();
        console.log(firstEmptyExpr);
        selectASTNode(firstEmptyExpr);
      } else {
        if (event.key === "Backspace") {
          if (parent) {
            let newEmpty = new lang.EmptyExpression();
            parent.replaceASTNode(selectedASTNode, newEmpty);
            selectedASTNode = newEmpty;
          }
        }
      }
    }
  }
  renderAST();
}

inputDiv.onkeyup = function(event : KeyboardEvent) {
  if (isCursorActive) {
    if (event.key.length === 1) {
      insertText(event.key, cursorPosition);
    } else {
      if (event.key === "ArrowLeft") {
        cursorLeft();
      } else if (event.key === "ArrowRight") {
        cursorRight();
      } else if (event.key === "Backspace") {
        deleteText(cursorPosition - 1, cursorPosition);
      } else {
        console.log(event.key);
      }
    }
    renderText();
    renderAST();
  }
};

function cursorLeft() {
  if (cursorPosition > 0) {
    cursorPosition--;
  }
}

function cursorRight() {
  if (cursorPosition < text.length) {
    cursorPosition++;
  }
}

function insertText(content: string, position : number) {
  let beforeCursorString : string = text.substring(0, cursorPosition);
  let afterCursorString : string = text.substring(cursorPosition, text.length);
  text = beforeCursorString + content + afterCursorString;
  cursorPosition++;
}

function deleteText(from: number, to: number) {
  if (from < 0) {
    from = 0;
  }
  if (to > text.length) {
    to = text.length;
  }
  let beforeString : string = text.substring(0, from);
  let afterString : string = text.substring(to, text.length);
  text = beforeString + afterString;
  cursorPosition = from;
}

function astNodeDivOnclick(event: MouseEvent) {
  event.stopPropagation();
  let selectedDiv = <HTMLElement> event.target;
  let found  = theDivASTNodeMap.getASTNode(selectedDiv);
  selectASTNode(found);
}

function selectASTNode(node : lang.ASTNode) : void {
  if (selectedASTNode) {
    deselectASTNode(selectedASTNode);
  }
  selectedASTNode = node;
  let nodeDiv = theDivASTNodeMap.getDiv(node);
  nodeDiv.classList.add('selectedASTNode');
  nodeDiv.appendChild(astCursorDiv);
}

function deselectASTNode(node: lang.ASTNode) {
  let nodeDiv = theDivASTNodeMap.getDiv(node);
  if (nodeDiv) {
    nodeDiv.classList.remove('selectedASTNode');
  }
}

export function renderText() {
  inputDiv.innerHTML = "";
  let beforeCursorString : string = text.substring(0, cursorPosition);
  let afterCursorString : string = text.substring(cursorPosition, text.length);
  let beforeCursorNodes : Node[] = stringToDom(beforeCursorString);
  let afterCursorNodes : Node[] = stringToDom(afterCursorString);
  beforeCursorNodes.forEach((node: Node) => {
    inputDiv.appendChild(node);
  });

  inputDiv.appendChild(cursorDiv);

  afterCursorNodes.forEach((node: Node) => {
    inputDiv.appendChild(node);
  });

  lexAndParse();
}

function lexAndParse() {
  let lexed : lang.Token[] = lang.lex(text);
  lexedDiv.textContent = lexed.toString();

  let parser : lang.Parser = new lang.Parser(lexed);
  expr = lang.Expression.parse(parser);
  rootASTNode = new lang.RootASTNode(expr);
  parsedDiv.textContent = expr.toString();
}

export function renderAST() {
  theDivASTNodeMap = new ASTNodeDivMap();
  astDiv.innerHTML = "";
  astDiv.appendChild(rootASTNode.toDOM(theDivASTNodeMap));
  astDiv.onclick = astNodeDivOnclick;
}

function stringToDom(s: string) : Node[] {
  return s.split(" ").map((word : string) => {
    var node = document.createElement("div");
    node.textContent = word;
    node.classList.add("wordDiv");
    return node;
  });
}

function toggleCursorActive() {
  isCursorActive = !isCursorActive;
  if (isCursorActive) {
    cursorDiv.classList.add("blinking");
  } else {
    cursorDiv.classList.remove("blinking");
  }
}
