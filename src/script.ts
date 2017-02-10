require("./styles.scss");

import * as vm from "./machine/index";
import * as pegjs from "pegjs"
import { App } from "./app";

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;
let loadFunTestButton: HTMLButtonElement = document.getElementById("load-fun-test-button") as HTMLButtonElement
let loadLangTestButton: HTMLButtonElement = document.getElementById("load-lang-test-button") as HTMLButtonElement
let languageIndicator = document.getElementById("language-indicator")

import * as lang from "./lang/lang";
import * as fun from "./fun/fun"

let grammar
let parser
let app

function selectLang() {
    let languageDefinition = lang.getLanguageDefinition()

    window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {lang}

    languageDefinition.initialise()

    grammar = languageDefinition.getGrammar()
    parser = grammar.Program
    app = new App(languageDefinition);

    languageIndicator.textContent = "Selected Language: lang"
    console.log("Selected lang")
}

function selectFun() {
    let languageDefinition = fun.getLanguageDefinition()

    window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {fun}

    languageDefinition.initialise()

    grammar = languageDefinition.getGrammar()
    parser = grammar.Program
    app = new App(languageDefinition);

    languageIndicator.textContent = "Selected Language: fun"
    console.log("Selected fun")
}

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
    selectFun()
}

loadLangTestButton.onclick = (event) => {
    langInput.value = langTest
    selectLang()
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
function fib(num) := if test then 1 else fib(num - 2) + fib(num - 1)
function fact(num) := if test then 0 else num * fact(num - 1)
`