require("./styles.scss");
import * as lang from "./lang";
import * as vm from "./machine";
import * as pegjs from "pegjs"
import * as reactrender from "./render/render";

let grammar = require("./grammar/generated.peg");

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;
let stepButton: HTMLButtonElement = document.getElementById("step-button") as HTMLButtonElement;

let parser = pegjs.generate(grammar, {trace: true})
console.log(`Generated parser!`)

let machine;
let astRoot;
let renderer;

parseButton.onclick = (event) => {
    let input = langInput.value;
    let parsed = parser.parse(input);
    console.log(parsed);
    astRoot = parsed[1];

    let instructions = vm.generateInstructions(astRoot);
    machine = new vm.Machine(instructions);
    renderAll();
}

stepButton.onclick = (event) => {
    if (!machine) {
        console.log('No machine yet!');
    }
    machine.oneStepExecute();
    renderAll();
}

function renderAll() {
    reactrender.renderAST(astRoot);
    reactrender.renderMachine(machine);
}