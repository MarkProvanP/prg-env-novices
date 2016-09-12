let inputDiv : HTMLElement = document.getElementById("inputDiv");

let text : string = "";
let cursorPosition : number = 0;

let isCursorActive : boolean = false;
var cursorDiv = document.getElementById("cursorDiv");

inputDiv.onclick = function() {
  toggleCursorActive();
};

window.onkeyup = function(event : KeyboardEvent) {
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

function renderText() {
  inputDiv.innerHTML = "";
  var beforeCursorString = text.substring(0, cursorPosition);
  var afterCursorString = text.substring(cursorPosition, text.length);
  var beforeCursorNodes = stringToDom(beforeCursorString);
  var afterCursorNodes = stringToDom(afterCursorString);
  beforeCursorNodes.forEach(function(node: HTMLElement) {
    inputDiv.appendChild(node);
  });

  inputDiv.appendChild(cursorDiv);

  afterCursorNodes.forEach(function(node: HTMLElement) {
    inputDiv.appendChild(node);
  });
}

function stringToDom(s: string) {
  var split = s.split(" ");
  function wordToNode(word : string) {
    var node = document.createElement("div");
    node.textContent = word;
    node.classList.add("wordDiv");
    return node;
  }
  return split.map(wordToNode);
}

function toggleCursorActive() {
  isCursorActive = !isCursorActive;
  if (isCursorActive) {
    cursorDiv.classList.add("blinking");
  } else {
    cursorDiv.classList.remove("blinking");
  }
}
