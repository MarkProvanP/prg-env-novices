import * as lang from "./lang";

let lexedDiv : HTMLElement = document.getElementById("lexedDiv");
let inputDiv : HTMLElement = document.getElementById("inputDiv");
let parsedDiv : HTMLElement = document.getElementById("parsedDiv");
let astDiv : HTMLElement = document.getElementById("astDiv");

let text : string = "";
let cursorPosition : number = 0;
let expr : lang.ASTNode; 
let isCursorActive : boolean = false;
var cursorDiv = document.getElementById("cursorDiv");

let selectedASTNode : lang.ASTNode;

let astNodeDivMap : WeakMap<HTMLElement, lang.ASTNode>;

inputDiv.onclick = function() {
  toggleCursorActive();
};

export function lexText() {
  console.log(lang.lex(text));
}

function selectExpr(expr : lang.ASTNode) : void {
  selectedASTNode = expr;
}

astDiv.onkeydown = function(event: KeyboardEvent) {
  if (selectedASTNode) {
    if (event.key === "Backspace") {
      console.log('delete this');
      let parent : lang.ParentASTNode = selectedASTNode.parent
      if (parent) {
        console.log('parent is', parent);
        console.log('node is', selectedASTNode);
        parent.deleteChild(selectedASTNode);
        selectedASTNode = null;
        renderAST();
      }
    }
  }
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
  console.log(event);
  console.log(expr);
  event.stopPropagation();
  var existing = document.querySelector('.selectedASTNode')
  if (existing) {
    existing.classList.remove('selectedASTNode');
  }
  selectedASTNode = astNodeDivMap.get(event.target);
  event.target.classList.add('selectedASTNode');
  console.log('parent', selectedASTNode.parent);
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

  let lexed : lang.Token[] = lang.lex(text);
  lexedDiv.textContent = lexed.toString();

  let parser : lang.Parser = new lang.Parser(lexed);
  expr = lang.Expression.parse(parser);
  expr.setParent(null);
  parsedDiv.textContent = expr.toString();
}

export function renderAST() {
  astNodeDivMap = new WeakMap<HTMLElement, lang.ASTNode>();
  astDiv.innerHTML = "";
  astDiv.appendChild(expr.toDOM(astNodeDivMap));
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
