"use strict"

let peg = require("pegjs")
let fs = require("fs")

let grammarString = fs.readFileSync("pegjs-grammar.txt", "utf8");

let parser = peg.generate(grammarString);

let r = parser.parse("while(1)do {  x  = 1+2}x=4");

console.log(r);

let numTabs = 0;

function tabs() {
  let s = "";
  for (let i = 0; i < numTabs; i++) {
    s += "\t";
  }
  return s;
}

function incTabs() {
  numTabs++;
}

function decTabs() {
  numTabs--;
}

function operation(op) {
  console.log(tabs(), op)
}


function marker(label, thing) {
  console.log(tabs(), label, thing.constructor.name);
}

function callCodegen(thing) {
  if (Array.isArray(thing)) {
    thing.forEach(callCodegen)
  } else {
    incTabs();
    marker('BEGIN', thing)
    codegens[thing.constructor.name](thing)
    marker('END', thing)
    decTabs();
  }
}

let codegens = {
  Integer: function(i) {
    operation("push " + i.value);
  },
  BinaryExpression: function(e) {
    callCodegen(e.left);
    callCodegen(e.right);
    operation(e.op);
  },
  AssignmentStatement: function(s) {
    callCodegen(s.expression);
    operation('set ' + s.ident.name);
  },
  WhileStatement: function(s) {
    operation('LABEL begin')
    callCodegen(s.condition);
    operation('if not goto end');
    s.statements.forEach(function(statement) { callCodegen(statement) });
    operation('goto begin')
    operation('LABEL end');
  }
}

callCodegen(r);
