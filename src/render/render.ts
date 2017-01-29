//import * as renderlang from "./render-lang"
/*
For reasons beyond explanation, it is necessary to import render-lang before render-ast
for the render-ast exports to be defined in render-lang. Then you have to use the renderlang
module, so that it is forced to be imported. JS/TS Dev in 2017!
*/
//console.log("Don't delete this console.log!", renderlang);
import * as renderast from "./render-ast";
import * as rendermachine from "./render-machine";
import { App } from "../app"

export function renderApp(app: App) {
    renderast.renderAST(app)
    rendermachine.renderMachine(app)
}