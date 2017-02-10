require("./styles.scss");

import * as vm from "./machine/index";
import * as pegjs from "pegjs"
import { App } from "./app";

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;
let loadFunTestButton: HTMLButtonElement = document.getElementById("load-fun-test-button") as HTMLButtonElement
let loadLangTestButton: HTMLButtonElement = document.getElementById("load-lang-test-button") as HTMLButtonElement

import * as lang from "./lang/lang";
import * as fun from "./fun/fun"

let languageDefinition = fun.getLanguageDefinition()

window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {fun}

languageDefinition.initialise()

let grammar = languageDefinition.getGrammar()
let parser = grammar.Program
let app = new App(languageDefinition);

parseButton.onclick = (event) => {
    let input = langInput.value;
    let parsed = parser.parse(input);
    
    let astRoot = parsed[1];

    let machine = new vm.Machine(astRoot);
    app.setup(astRoot, machine)
    app.renderApp();
}

loadFunTestButton.onclick = (event) => {
    langInput.value = funTest
}

loadLangTestButton.onclick = (event) => {
    langInput.value = langTest
}

let langTest = `
method test ( derp ) {
    let x := 3
    while (x) do { let x := x - 1}
    let x := 4
    call hello(x, y)
}

method hello (x, y, z) {
    let x := 5
    return x
}`

let funTest = `
function test(n) := test(1)
function fib(num) := fib(num - 2) + fib(num - 1)
function fact(num) := num * fact(num - 1)
`