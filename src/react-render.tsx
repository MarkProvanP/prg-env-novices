import React from "react";
import ReactDOM from "react-dom";

export function run() {
    ReactDOM.render(
        <h1>Hello, World!</h1>,
        document.getElementById('root')
    )

    console.log("React Render!");
}

