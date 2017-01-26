"use strict"

import * as peg from "pegjs";
import * as fs from "fs";

import * as machine from "./machine";

const GRAMMAR_FILE = process.argv[2]
const INPUT_FILE = process.argv[3]

if (!GRAMMAR_FILE || !INPUT_FILE) {
  console.error("usage: node test-peg GRAMMAR_FILE INPUT_FILE")
  process.exit(1);
}
console.log(`Grammar file is: ${GRAMMAR_FILE}`)
let grammarString = fs.readFileSync(GRAMMAR_FILE, "utf8");

let parser = peg.generate(grammarString, {trace: true});

let input = fs.readFileSync(INPUT_FILE, "utf8").trim();
console.log("Input", input)
try {
  let r = parser.parse(input);
  let m = new machine.Machine(r);

  console.log('Built machine');
  console.log(m);

  //machine.execute();
} catch (err) {
  console.error(err)
}
