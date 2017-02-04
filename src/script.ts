require("./styles.scss");
import * as lang from "./lang/lang";
import * as vm from "./machine";
import * as pegjs from "pegjs"
import { App } from "./app";

let grammar = require("./lang/grammar.peg");

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;

window['superDuperSecretWindowScopeThatNoOneShouldKnowAbout'] = {lang}
let parser = pegjs.generate(grammar, {trace: false})
let app = new App();

parseButton.onclick = (event) => {
    let input = langInput.value;
    let parsed = parser.parse(input);
    
    let astRoot = parsed[1];

    let machine = new vm.Machine(astRoot);
    app.setup(astRoot, machine)
    app.renderApp();
}