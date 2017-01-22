"use strict"

import * as peg from "pegjs";
import * as fs from "fs";

import * as lang from "./peg-lang";

const GRAMMAR_FILE = process.argv[2]
console.log(`Grammar file is: ${GRAMMAR_FILE}`)
let grammarString = fs.readFileSync(GRAMMAR_FILE, "utf8");

let parser = peg.generate(grammarString);

let r = parser.parse("while(1)do {  x  = 1+2}x=4");

console.log(r);
let instructions = lang.generateInstructions(r);

let machine = new lang.Machine(instructions);

console.log('Built machine');
console.log(machine);

//machine.execute();
