"use strict";
var lang_1 = require("./lang");
var inputDiv = document.getElementById("inputDiv");
var text = "";
var cursorPosition = 0;
var isCursorActive = false;
var cursorDiv = document.getElementById("cursorDiv");
inputDiv.onclick = function () {
    toggleCursorActive();
};
function lexText() {
    console.log(lang_1.lex(text));
}
window.onkeyup = function (event) {
    if (isCursorActive) {
        if (event.key.length === 1) {
            insertText(event.key, cursorPosition);
        }
        else {
            if (event.key === "ArrowLeft") {
                cursorLeft();
            }
            else if (event.key === "ArrowRight") {
                cursorRight();
            }
            else if (event.key === "Backspace") {
                deleteText(cursorPosition - 1, cursorPosition);
            }
            else {
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
function insertText(content, position) {
    var beforeCursorString = text.substring(0, cursorPosition);
    var afterCursorString = text.substring(cursorPosition, text.length);
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
    var beforeString = text.substring(0, from);
    var afterString = text.substring(to, text.length);
    text = beforeString + afterString;
    cursorPosition = from;
}
function renderText() {
    inputDiv.innerHTML = "";
    var beforeCursorString = text.substring(0, cursorPosition);
    var afterCursorString = text.substring(cursorPosition, text.length);
    var beforeCursorNodes = stringToDom(beforeCursorString);
    var afterCursorNodes = stringToDom(afterCursorString);
    beforeCursorNodes.forEach(function (node) {
        inputDiv.appendChild(node);
    });
    inputDiv.appendChild(cursorDiv);
    afterCursorNodes.forEach(function (node) {
        inputDiv.appendChild(node);
    });
}
function stringToDom(s) {
    return s.split(" ").map(function (word) {
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
    }
    else {
        cursorDiv.classList.remove("blinking");
    }
}
