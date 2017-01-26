require("./styles.scss");
import * as lang from "./lang";
import * as vm from "./machine";
import * as pegjs from "pegjs"
import { App } from "./app";

let grammar = require("./grammar/generated.peg");

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;
let stepButton: HTMLButtonElement = document.getElementById("step-button") as HTMLButtonElement;

let parser = pegjs.generate(grammar, {trace: false})
console.log(`Generated parser!`)

let app = new App();

parseButton.onclick = (event) => {
    let input = langInput.value;
    let parsed = parser.parse(input);
    console.log(parsed);
    let astRoot = parsed[1];

    let instructions = vm.generateInstructions(astRoot);
    let machine = new vm.Machine(instructions);
    app.setup(astRoot, machine)
    app.renderApp();
}

stepButton.onclick = (event) => {
    if (!app.machine) {
        console.log('No machine yet!');
    }
    app.machine.oneStepExecute();
    app.renderApp();
}