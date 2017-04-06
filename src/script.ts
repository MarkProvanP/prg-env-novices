require("./styles.scss");

import * as vm from "./machine/index";
import * as pegjs from "pegjs"
import { App } from "./app";

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let funButton: HTMLButtonElement = document.getElementById("fun-button") as HTMLButtonElement
let langButton: HTMLButtonElement = document.getElementById("lang-button") as HTMLButtonElement

import * as lang from "./lang/lang";
import * as fun from "./fun/fun"

let grammar
let parser
let app
let languageDefinition 

function selectLang() {
    if (languageDefinition) {
        languageDefinition.shutdown();
    }
    languageDefinition = lang.getLanguageDefinition()

    window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {lang}

    languageDefinition.initialise()

    grammar = languageDefinition.getGrammar()
    parser = grammar.Program
    app = new App(languageDefinition);

    console.log("Selected lang")
}

function selectFun() {
    if (languageDefinition) {
        languageDefinition.shutdown();
    }
    languageDefinition = fun.getLanguageDefinition()

    window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {fun}

    languageDefinition.initialise()

    grammar = languageDefinition.getGrammar()
    parser = grammar.Program
    app = new App(languageDefinition);

    console.log("Selected fun")
}

function begin() {
    let input = langInput.value;
    let parsed = parser.parse(input);
    
    let astRoot = parsed[1];
    let machine = new vm.Machine(astRoot, languageDefinition);

    app.setup(astRoot, machine)
    app.renderApp();
}

funButton.onclick = (event) => {
    langInput.value = funTest
    selectFun()
    begin()
}

langButton.onclick = (event) => {
    langInput.value = langTest
    selectLang()
    begin()
}

let langTest = `
method main () {
    let x := 3
    while (x) do { let x := x - 1}
    let y := 4
    let result := call multiply(10, y)
    call println(result)
}

method multiply (x, y) {
    return x * y
}
`

let funTest = `function main() := trace(fact(3), trace(fib(5)))
function fib(num) := if num + 1 then 1 else fib(num - 2) + fib(num - 1)
function fact(num) := if num + 1 then 1 else num * fact(num - 1)
`
