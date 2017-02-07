import React from "react";
import ReactDOM from "react-dom";

import * as vm from "../machine";
import { App } from "../app";

export function renderMachine(app: App) {
    ReactDOM.render(
        <VMStateComponent app={app}/>,
        document.getElementById('react-vm-div')
    )
    ReactDOM.render(
        <VMInstructionsComponent app={app}/>,
        document.getElementById('instructions-div')
    )
}

interface VMStateProps {
    app: App
}

interface NoState {}

export class VMStateComponent extends React.Component<VMStateProps, NoState> {
    onForwardButtonClick() {
        this.props.app.forward()   
    }

    onBackwardButtonClick() {
        this.props.app.backward()
    }

    constructor(props) {
        super(props)
        this.onBackwardButtonClick = this.onBackwardButtonClick.bind(this)
        this.onForwardButtonClick = this.onForwardButtonClick.bind(this)
    }

    render() {
        return <div className='vm-state'>
            <h2>Machine State</h2>
            <div className='info'>
                <span className='instruction-pointer'>IP: {this.props.app.machine.instructionPointer}</span>
                <span className='instruction-count'>Count: {this.props.app.machine.instructionCount}</span>
                <button onClick={this.onForwardButtonClick}>Forward</button>
                <button onClick={this.onBackwardButtonClick}>Backward</button>
            </div>
            <ASTChangesComponent app={this.props.app} />
            <VMStackComponent app={this.props.app} />
            <VMEnvComponent app={this.props.app} />
        </div>;
    }
}

export class ASTChangesComponent extends React.Component<VMStateProps, NoState> {
    undoChange() {
        this.props.app.undoLastChange();
    }

    render() {
        const changeElements = this.props.app.astChanges.map((change, index) => {
            const className = classNames('change', change.constructor.name)
            return <div key={index} className={className}>
                <div className='description'>{change.describe()}</div>
            </div>
        })
        return <div className='ast-changes'>
            <h3>AST Change History</h3>
            <button onClick={this.undoChange.bind(this)}>Undo Change</button>
            <div className='change-list'>{changeElements}</div>
        </div>
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

interface InstructionProps extends VMStateProps {
    index: number,
    instruction: vm.Instruction,
    currentIp: number,
    insideRange: boolean
}
interface InstructionState {}

let classNames = (...classes) => classes.filter(s => s).join(" ")

export class InstructionComponent extends React.Component<InstructionProps, InstructionState> {
    getClassName() {
        return classNames(
            'instruction',
            (this.props.currentIp == this.props.index) ? 'current-ip' : '',
            this.props.insideRange ? 'within-range' : '',
            this.getLabels().includes(this.props.app.selectedLabel) ? 'selected-label' : ''
        )
    }

    private getLabels() {
        return this.props.app.machine.indexToLabelsMap[this.props.index] || []
    }

    getActiveASTNodesAtIndex(index: number) {
        const nodes = this.props.app.machine.activeASTNodesAtIndices[index];
        let className = node => classNames('active-node', node.constructor.name)
        let selectNode = (node) => {
            return (e) => {
                this.props.app.selectASTNode(node)
            }
        }
        return nodes.map((node, index) => {
            const text = node.constructor.name.split("").filter((l: string) => l.toUpperCase() == l)
            return <div key={index} className={className(node)} onClick={selectNode(node).bind(this)}>{text}</div>
        })
    }

    render() {
        const labelElements = this.getLabels().map((label, index) => (
            <div key={index} className='label'>{label}</div>
        ))
        return <div className={this.getClassName()}>
            <div className='labels'>{labelElements}</div>
            <div className='index'>{this.props.index}</div>
            <div className='opcode'>{this.props.instruction.constructor.name}</div>
            {getComponentForInstruction.bind(this)(this.props.instruction)}
            <div className='active-ast-nodes'>
                {this.getActiveASTNodesAtIndex(this.props.index)}
            </div>
        </div>
    }
}

function getComponentForInstruction(instruction: vm.Instruction) {
    if (instruction instanceof vm.Push) {
        return <div className='args machine-push-val'>{instruction.val}</div>
    } else if (instruction instanceof vm.CallFunction) {
        return <div className='args machine-call-function'>{instruction.func.name}</div>
    } else if (instruction instanceof vm.IfGoto || instruction instanceof vm.Goto) {
        return <div className='args machine-goto'>
            <LabelComponent label={instruction.label} app={this.props.app}/>
        </div>
    } else if (instruction instanceof vm.Set) {
        return <div className='args machine-set'>{instruction.key}</div>
    } else if (instruction instanceof vm.Get) {
        return <div className='args machine-get'>{instruction.key}</div>
    }
}

interface LabelComponentProps extends VMStateProps {
    label: string
}

export class LabelComponent extends React.Component<LabelComponentProps, NoState> {
    onMouseEnter(e) {
        this.props.app.selectLabel(this.props.label)
    }

    onMouseLeave(e) {
        this.props.app.selectLabel("")
    }

    render() {
        return <div className='label'
        onMouseEnter={this.onMouseEnter.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}
        >{this.props.label}</div>
    }
}

export class VMStackComponent extends React.Component<VMStateProps, NoState> {
    render() {
        const stackElements = this.props.app.machine.stack.getElements();
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