require("./styles.scss");
import * as lang from "./lang";
import * as render from "./render";
import * as vm from "./machine";
import * as pegjs from "pegjs"

let grammar = require("./grammar/generated.peg");

let langInput: HTMLTextAreaElement = document.getElementById("lang-input") as HTMLTextAreaElement;
let parseButton: HTMLButtonElement = document.getElementById("parse-button") as HTMLButtonElement;
let astDiv = document.getElementById("ast-div")
let vmDiv = document.getElementById("vm-div")

let parser = pegjs.generate(grammar, {trace: true})
console.log(`Generated parser!`)

parseButton.onclick = (event) => {
    let input = langInput.value;
    let parsed = parser.parse(input);

    console.log(parsed);

    let renderer = new render.Renderer();

    let astRoot = parsed[1];

    let rootASTElement = astRoot.render(renderer);
    astDiv.appendChild(rootASTElement);

    let instructions = vm.generateInstructions(astRoot);
    let machine = new vm.Machine(instructions);

    vmDiv.appendChild(render.renderMachine(machine));

    console.log(vm);
}