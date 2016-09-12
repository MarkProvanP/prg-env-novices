var inputDiv = document.getElementById("inputDiv");

inputDiv.onclick = function() {
  toggleCursorActive();
}

window.onkeyup = function(event) {
  if (isCursorActive) {
    if (event.key.length == 1) {
      insertText(event.key, cursorPosition);
    } else {
      if (event.key == 'ArrowLeft') {
        cursorLeft();
      } else if (event.key == 'ArrowRight') {
        cursorRight();
      } else if (event.key == 'Backspace') {
        deleteText(cursorPosition - 1, cursorPosition);
      } else {
        console.log(event.key)
      }
    }
    renderText();
  }
}

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

var text = "";
var cursorPosition = 0;

var isCursorActive = false;
var cursorDiv = document.getElementById("cursorDiv");
var textBeforeCursor = document.getElementById("textBeforeCursor");
var textAfterCursor = document.getElementById("textAfterCursor");

function insertText(content, position) {
  beforeCursorString = text.substring(0, cursorPosition);
  afterCursorString = text.substring(cursorPosition, text.length);
  text = beforeCursorString + content + afterCursorString;
  cursorPosition++;
}

function deleteText(from, to) {
  if (from < 0) {
    from = 0;
  }
  if (to > text.length) {
    to = text.length;
  }
  beforeString = text.substring(0, from);
  afterString = text.substring(to, text.length);
  text = beforeString + afterString;
  cursorPosition = from;
}

function renderText() {
  beforeCursorString = text.substring(0, cursorPosition);
  afterCursorString = text.substring(cursorPosition, text.length);
  textBeforeCursor.innerHTML = escapeString(beforeCursorString);
  textAfterCursor.innerHTML = escapeString(afterCursorString);
}

function escapeString(s) {
  var escaped = "";
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (c == ' ') {
      escaped += '&nbsp;'
    } else {
      escaped += c;
    }
  }
  return escaped;
}

function toggleCursorActive() {
  isCursorActive = !isCursorActive;
  if (isCursorActive) {
    cursorDiv.classList.add("blinking");
  } else {
    cursorDiv.classList.remove("blinking");
  }
}
