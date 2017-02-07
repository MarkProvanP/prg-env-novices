require("./styles.scss");
import * as lang from "./lang/lang";
import * as vm from "./machine/index";
import * as pegjs from "pegjs"
import { App } from "./app";

import grammar from "./lang/grammars/index"

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;

window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {lang}
let parser = grammar.Program
let app = new App(grammar);

parseButton.onclick = (event) => {
    let input = langInput.value;
    let parsed = parser.parse(input);
    
    let astRoot = parsed[1];

    let machine = new vm.Machine(astRoot);
    app.setup(astRoot, machine)
    app.renderApp();
}