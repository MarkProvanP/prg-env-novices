"use strict"

let peg = require("pegjs")
let fs = require("fs")

let grammarString = fs.readFileSync("pegjs-grammar.txt", "utf8");

let parser = peg.generate(grammarString);

let r = parser.parse("do{x=1+2}while(1)x=4")

console.log(r)
