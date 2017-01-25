import React from "react";
import ReactDOM from "react-dom";

import * as vm from "../machine";

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
        return <div className='vm-state'>
            <h2>Machine State</h2>
            <div className='ip'>
            IP: {this.props.machine.instructionPointer}
            Count: {this.props.machine.instructionCount}
            </div>
            <VMInstructionsComponent machine={this.props.machine} />
            <VMStackComponent machine={this.props.machine} />
            <VMEnvComponent machine={this.props.machine} />
        </div>;
    }
}

export class VMInstructionsComponent extends React.Component<VMStateProps, VMStateState> {
    render() {
        const instructions = this.props.machine.instructions;
        const instructionComponents = instructions.map((instruction, index) => {
            return <InstructionComponent key={index} instruction={instruction} index={index} currentIp={this.props.machine.instructionPointer} />
        })
        return <div className='instructions'>
            <h3>Instructions</h3>
            {instructionComponents}
        </div>
    }
}

interface InstructionProps {
    index: number,
    instruction: vm.Instruction,
    currentIp: number
}
interface InstructionState {}

export class InstructionComponent extends React.Component<InstructionProps, InstructionState> {
    render() {
        return <div className={'instruction ' + ((this.props.currentIp == this.props.index) ? 'current-ip' : '')}>
            <div className='index'>{this.props.index}</div>
            <div className='opcode'>{this.props.instruction.constructor.name}</div>
            {getComponentForInstruction(this.props.instruction)}
        </div>
    }
}

function getComponentForInstruction(instruction: vm.Instruction) {
    if (instruction instanceof vm.Push) {
        return <div className='args machine-push-val'>{instruction.val}</div>
    } else if (instruction instanceof vm.CallFunction) {
        return <div className='args machine-call-function'>{instruction.func.name}</div>
    } else if (instruction instanceof vm.IfGoto) {
        return <div className='args machine-if-goto'>{instruction.label}</div>
    } else if (instruction instanceof vm.Label) {
        return <div className='args machine-label'>{instruction.label}</div>
    } else if (instruction instanceof vm.Set) {
        return <div className='args machine-set'>{instruction.key}</div>
    } else if (instruction instanceof vm.Get) {
        return <div className='args machine-get'>{instruction.key}</div>
    } else if (instruction instanceof vm.ASTBegin) {
        return <div className='args machine-ast-begin'>{instruction.ast.constructor.name}</div>
    } else if (instruction instanceof vm.ASTEnd) {
        return <div className='args machine-ast-end'>{instruction.ast.constructor.name}</div>
    }
}

export class VMStackComponent extends React.Component<VMStateProps, VMStateState> {
    render() {
        const stackElements = this.props.machine.stack;
        const stackComponents = stackElements.map((element, index) => {
            return <StackElementComponent key={index} element={element} />
        })
        return <div className='stack'>
            <h3>Stack</h3>
            {stackComponents}
        </div>
    }
}

interface StackElementProps {
    element: vm.StackElement
}
interface StackElementState {}

export class StackElementComponent extends React.Component<StackElementProps, StackElementState> {
    render() {
        return <div className='element'>
            {this.props.element}
        </div>
    }
}

export class VMEnvComponent extends React.Component<VMStateProps, VMStateState> {
    render() {
        const stackElements = this.props.machine.envStack;
        const stackComponents = stackElements.map((element, index) => {
            return <EnvElementComponent key={index} element={element} />
        })
        return <div className='env'>
            <h3>Environment</h3>
            {stackComponents}
        </div>
    }
}

interface EnvElementProps {
    element: vm.EnvElement
}
interface EnvElementState {}

export class EnvElementComponent extends React.Component<EnvElementProps, EnvElementState> {
    render() {
        return <div className='element'>
            {JSON.stringify(this.props.element)}
        </div>
    }
}