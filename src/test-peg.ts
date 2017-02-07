import * as peg from "pegjs";
import * as fs from "fs";
import * as vm from "./machine/index";

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
  let parsed = parser.parse(input)[1];
  console.log("Parsed", parsed)
  let m = new vm.Machine(parsed);

  console.log('Built machine');
  console.log(m);

  //machine.execute();
} catch (err) {
  console.error(err)
}
