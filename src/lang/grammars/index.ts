import * as pegjs from "pegjs"

const EXPRESSION_GRAMMAR = require("./expression.peg")
const STATEMENT_GRAMMAR = require("./statement.peg")
const PROGRAM_GRAMMAR = require("./program.peg")

const HEADER =
`{
  var lang = window.superDuperSecretWindowScopeThatNoOneShouldKnowAbout.lang
}

`

const EXPRESSION = HEADER + EXPRESSION_GRAMMAR
const STATEMENT = HEADER + STATEMENT_GRAMMAR + EXPRESSION_GRAMMAR
const PROGRAM = HEADER + PROGRAM_GRAMMAR + STATEMENT_GRAMMAR + EXPRESSION_GRAMMAR

export default {
    Expression: pegjs.generate(EXPRESSION),
    Statement: pegjs.generate(STATEMENT),
    Program: pegjs.generate(PROGRAM)
}