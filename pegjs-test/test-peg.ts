"use strict"

let peg = require("pegjs")
let fs = require("fs")

let grammarString = fs.readFileSync("pegjs-grammar.txt", "utf8");

let parser = peg.generate(grammarString);

let r = parser.parse("while(1)do {  x  = 1+2}x=4");

let numTabs = 0;

let tabs = () => new Array(numTabs).map(() => '\t').join("")
let incTabs = () => numTabs++;
let decTabs = () => numTabs--;

function operation(op) {
  console.log(tabs(), op)
}


function marker(label, thing) {
  console.log(tabs(), label, thing.constructor.name);
}

function callCodegen(thing) {
  if (Array.isArray(thing)) {
    thing.forEach(thing => callCodegen(thing))
  } else {
    incTabs();
    marker('BEGIN', thing)
    codegens[thing.constructor.name](thing)
    marker('END', thing)
    decTabs();
  }
}

class Machine {
  stack = [];
  env = {};

  instructionPointer = 0;
  labelMap = {};

  constructor(private instructions: Instruction[]) {
    this.instructions.forEach((instruction, index) => {
      if (instruction instanceof LabelInstruction) {
        this.labelMap[instruction.label] = index;
      }
    })
  }
}

abstract class Instruction {

}

class PushInstruction extends Instruction {
  constructor(public val) {
    super()
  }
}

class BinOpInstruction extends Instruction {
  constructor(public op) {
    super()
  }
}

class IfGotoInstruction extends Instruction {
  constructor(public label) {
    super();
  }
}

class LabelInstruction extends Instruction {
  constructor(public label) {
    super()
  }
}

class UnOpInstruction extends Instruction {
  constructor(public op) {
    super()
  }
}

class SetInstruction extends Instruction {
  constructor(public key) {
    super();
    console.log(key);
  }
}

class GetInstruction extends Instruction {
  constructor(public key) {
    super();
  }
}

let codegens = {
  Integer: function(i) {
    operation("push " + i.value);
    addInstruction(new PushInstruction(i.value))
  },
  BinaryExpression: function(e) {
    callCodegen(e.left);
    callCodegen(e.right);
    operation(e.op);
    addInstruction(new BinOpInstruction(e.op));
  },
  AssignmentStatement: function(s) {
    callCodegen(s.expression);
    operation('set ' + s.ident.name);
    addInstruction(new SetInstruction(s.ident.name));
  },
  WhileStatement: function(s) {
    let whileBeginLabel = "whileBegin";
    let whileEndLabel = "whileEnd";
    operation('LABEL begin')
    addInstruction(new LabelInstruction(whileBeginLabel))
    callCodegen(s.condition);
    operation('if not goto end');
    addInstruction(new UnOpInstruction("!"));
    addInstruction(new IfGotoInstruction(whileEndLabel))
    s.statements.forEach((statement) => callCodegen(statement));
    operation('goto begin')
    addInstruction(new PushInstruction(1))
    addInstruction(new IfGotoInstruction(whileBeginLabel));
    operation('LABEL end');
    addInstruction(new LabelInstruction(whileEndLabel))
  }
}

let instructions = []

function addInstruction(instruction: Instruction) {
  instructions.push(instruction);
}

callCodegen(r);

let machine = new Machine(instructions);

console.log(machine);
