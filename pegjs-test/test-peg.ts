"use strict"

import * as peg from "pegjs";
import * as fs from "fs";

import * as machine from "./machine";

import { Operator } from "./new-lang";

export class OperatorUtils {
  static fromChar(c: string) {
    switch (c) {
      case "+": return Operator.Add;
      case "-": return Operator.Subtract;
      case "*": return Operator.Multiply;
      case "/": return Operator.Divide;
    }
  }

  static toChar(o : Operator) {
    switch (o) {
      case Operator.Add: return "+";
      case Operator.Subtract: return "-";
      case Operator.Multiply: return "*";
      case Operator.Divide: return "/";
    }
  }

  static toFunc(o: Operator): (l: any, r: any) => any {
    switch (o) {
      case Operator.Add: return (l, r) => l + r;
      case Operator.Subtract: return (l, r) => l - r;
      case Operator.Multiply: return (l, r) => l * r;
      case Operator.Divide: return (l, r) => l / r;
    }
  }
}

const GRAMMAR_FILE = process.argv[2]
const INPUT_FILE = process.argv[3]
console.log(`Grammar file is: ${GRAMMAR_FILE}`)
let grammarString = fs.readFileSync(GRAMMAR_FILE, "utf8");

let parser = peg.generate(grammarString, {trace: true});

let input = fs.readFileSync(INPUT_FILE, "utf8").trim();
console.log("Input", input)
try {
  let r = parser.parse(input);

  console.log(r);
  console.log(JSON.stringify(r))
  let instructions = machine.generateInstructions(r);

  let machine = new machine.Machine(instructions);

  console.log('Built machine');
  console.log(machine);

  //machine.execute();
} catch (err) {
  console.error(err)
}
