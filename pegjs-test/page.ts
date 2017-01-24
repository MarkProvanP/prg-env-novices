import * as peg from "pegjs";

import * as virtmachine from "./machine";

let input = document.getElementById("ast-input");

let buildButton = document.getElementById("build-button");

buildButton.onclick = (event) => {
  let parser = peg.generate(grammarString);
  let code = input.value;
  let ast = parser.parse(code);
  let instructions = virtmachine.generateInstructions(ast);
  let machine = new virtmachine.Machine(instructions);
}

let grammarString = `
{
  function Integer(i) {
    this.value = i;
  }

  function BinaryExpression(l, r, o) {
    this.left = l;
    this.right = r;
    this.op = o;
  }

  function AssignmentStatement(i, e) {
    this.ident = i;
    this.expression = e;
  }

  function WhileStatement(c, s) {
    this.condition = c;
    this.statements = s;
  }

  function Ident(n) {
    this.name = n;
  }
}

start
  = statements

statements
  = statement *

statement
  = assignmentStatement
  / whileStatement

assignmentStatement
  = i:ident w "=" w e:expression { return new AssignmentStatement(i, e); }

whileStatement
  = "while" w "(" w c:expression w ")" w "do" w "{" w s:statements w "}" w { return new WhileStatement(c, s); }

expression
  = additive
  / multiplicative

additive
  = left:multiplicative "+" right:additive { return new BinaryExpression(left, right, "+"); }
  / multiplicative

multiplicative
  = left:primary "*" right:multiplicative { return new BinaryExpression(left, right, "*"); }
  / primary

primary
  = integer
  / "(" additive:additive ")" { return additive; }

integer "integer"
  = digits:[0-9]+ { return new Integer(parseInt(digits.join(""), 10)); }

ident
  = name:[a-z]* { return new Ident(name.join("")) }

w
  = [ \t\n\r]*
`
