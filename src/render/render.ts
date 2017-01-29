import * as renderast from "./render-ast";
import * as rendermachine from "./render-machine";
import { App } from "../app"

export function renderApp(app: App) {
    renderast.renderAST(app)
    rendermachine.renderMachine(app)
}
