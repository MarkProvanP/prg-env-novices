require("./styles.scss");
import * as lang from "./lang";
import * as render from "./render";
import * as machine from "./machine";
import * as pegjs from "pegjs"

let grammar = require("./grammar/generated.peg");

let langInput = document.getElementById("lang-input")
let parseButton = document.getElementById("parse-button")
let outputDiv = document.getElementById("output-div")

let parser = pegjs.generate(grammar, {trace: true})
console.log(`Generated parser!`)

parseButton.onclick = (event) => {
    let input = langInput.value;
    let parsed = parser.parse(input);

    console.log(parsed);

    let renderer = new render.Renderer();

    let root = parsed[0].render(renderer);

    outputDiv.appendChild(root);
}