"use strict"

import * as peg from "pegjs";
import * as fs from "fs";

import * as lang from "./peg-lang";

let grammarString = fs.readFileSync("pegjs-grammar.txt", "utf8");

let parser = peg.generate(grammarString);

let r = parser.parse("while(1)do {  x  = 1+2}x=4");

let instructions = lang.generateInstructions(r);

let machine = new lang.Machine(instructions);

console.log('Built machine');
console.log(machine);

machine.execute();
