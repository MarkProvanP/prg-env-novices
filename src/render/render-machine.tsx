import React from "react";
import ReactDOM from "react-dom";

import * as vm from "../machine";
import * as lang from "../lang";
import { App } from "../app";

export function renderMachine(app: App) {
    ReactDOM.render(
        <VMStateComponent app={app}/>,
        document.getElementById('react-vm-div')
    )
}

interface VMStateProps {
    app: App
}

interface NoState {}

export class VMStateComponent extends React.Component<VMStateProps, NoState> {
    render() {
        return <div className='vm-state'>
            <h2>Machine State</h2>
            <div className='ip'>
            IP: {this.props.app.machine.instructionPointer}
            Count: {this.props.app.machine.instructionCount}
            </div>
            <VMInstructionsComponent app={this.props.app}/>
            <VMStackComponent app={this.props.app} />
            <VMEnvComponent app={this.props.app} />
        </div>;
    }
}

export class VMInstructionsComponent extends React.Component<VMStateProps, NoState> {
    render() {
        const instructions = this.props.app.machine.instructions;
        const instructionRange = this.props.app.machine.astInstructionRangeMap.get(this.props.app.selectedASTNode);
        const instructionComponents = instructions.map((instruction, index) => {
            return <InstructionComponent
            key={index}
            instruction={instruction}
            index={index}
            currentIp={this.props.app.machine.instructionPointer}
            insideRange={instructionRange ? instructionRange.withinRange(index) : false}
            app={this.props.app}
            />
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
    currentIp: number,
    insideRange: boolean,
    app: App
}
interface InstructionState {}

export class InstructionComponent extends React.Component<InstructionProps, InstructionState> {
    getClassName() {
        return [
            'instruction',
            (this.props.currentIp == this.props.index) ? 'current-ip' : '',
            this.props.insideRange ? 'within-range' : ''
        ].filter(s => s).join(" ")
    }

    getLabels() {
        let labels = this.props.app.machine.indexToLabelsMap[this.props.index];
        if (!labels) return;
        return labels.join(" ")
    }

    render() {
        return <div className={this.getClassName()}>
            <div className='labels'>{this.getLabels()}</div>
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
    } else if (instruction instanceof vm.Set) {
        return <div className='args machine-set'>{instruction.key}</div>
    } else if (instruction instanceof vm.Get) {
        return <div className='args machine-get'>{instruction.key}</div>
    }
}

export class VMStackComponent extends React.Component<VMStateProps, NoState> {
    render() {
        const stackElements = this.props.app.machine.stack;
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

export class VMEnvComponent extends React.Component<VMStateProps, NoState> {
    render() {
        const stackElements = this.props.app.machine.envStack;
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
        const keys = this.props.element.keys()
        const mappings = keys.map((key, index) => {
            let value = this.props.element.get(key)
            return <div className='mapping' key={index}>
                <div className='key'>{key}</div>
                <div className='arrow'>-></div>
                <div className='value'>{value}</div>
            </div>
        })
        return <div className='element'>
            {mappings}
        </div>
    }
}