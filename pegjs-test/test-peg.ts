"use strict"

import * as peg from "pegjs";
import * as fs from "fs";

import * as lang from "./peg-lang";

const GRAMMAR_FILE = process.argv[2]
const INPUT_FILE = process.argv[3]
console.log(`Grammar file is: ${GRAMMAR_FILE}`)
let grammarString = fs.readFileSync(GRAMMAR_FILE, "utf8");

let parser = peg.generate(grammarString, {trace: true});

let input = fs.readFileSync(INPUT_FILE, "utf8").trim();
console.log("Input", input)
let r = parser.parse(input);

console.log(r);
let instructions = lang.generateInstructions(r);

let machine = new lang.Machine(instructions);

console.log('Built machine');
console.log(machine);

//machine.execute();
