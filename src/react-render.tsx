import React from "react";
import ReactDOM from "react-dom";

import * as vm from "./machine";

export function renderMachine(machine: vm.Machine) {
    ReactDOM.render(
        <VMStateComponent machine={machine} />,
        document.getElementById('react-vm-div')
    )

    console.log("React Render!");
}

interface VMStateProps {
    machine: vm.Machine
}

interface VMStateState {

}

export class VMStateComponent extends React.Component<VMStateProps, VMStateState> {
    render() {
        return <div>IP: {this.props.machine.instructionPointer}</div>;
    }
}