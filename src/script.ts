require("./styles.scss");

import * as vm from "./machine/index";
import * as pegjs from "pegjs"
import { App } from "./app";

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;

import * as lang from "./lang/lang";

let languageDefinition = lang.getLanguageDefinition()

window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {lang}

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