"use strict";
var peg = require("pegjs");
var fs = require("fs");
var lang = require("./peg-lang");
var GRAMMAR_FILE = process.argv[2];
console.log("Grammar file is: " + GRAMMAR_FILE);
var grammarString = fs.readFileSync(GRAMMAR_FILE, "utf8");
var parser = peg.generate(grammarString);
var r = parser.parse("while(1)do {  x  = 1+2}x=4");
console.log(r);
var instructions = lang.generateInstructions(r);
var machine = new lang.Machine(instructions);
console.log('Built machine');
console.log(machine);
//machine.execute();
