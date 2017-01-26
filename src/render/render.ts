import * as renderast from "./render-ast.tsx";
import * as rendermachine from "./render-machine.tsx";
import { App } from "../app"

export function renderApp(app: App) {
    renderast.renderAST(app)
    rendermachine.renderMachine(app)
}