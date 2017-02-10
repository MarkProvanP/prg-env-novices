import * as pegjs from "pegjs"

const EXPRESSION_GRAMMAR = require("./expression.peg")
const PROGRAM_GRAMMAR = require("./program.peg")

const HEADER =
`{
  var fun = window.superDuperSecretWindowScopeThatNoOneShouldKnowAbout.fun
}

`

const EXPRESSION = HEADER + EXPRESSION_GRAMMAR
const PROGRAM = HEADER + PROGRAM_GRAMMAR + EXPRESSION_GRAMMAR

export default {
    Expression: pegjs.generate(EXPRESSION),
    Program: pegjs.generate(PROGRAM)
}