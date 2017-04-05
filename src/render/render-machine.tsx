import React from "react";
import ReactDOM from "react-dom";

import * as vm from "../machine/index";
import { App } from "../app";
import { ASTNode } from "../ast"
import { EditorButtonComponent } from "./render-ast"

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
    onForwardButtonClick() {
        this.props.app.forward()   
    }

    isForwardButtonDisabled() {
        return !this.props.app.machine.canContinue()
    }

    onBackwardButtonClick() {
        this.props.app.backward()
    }

    isBackButtonDisabled() {
        return !this.props.app.machine.canReverse()
    }

    constructor(props) {
        super(props)
        this.onBackwardButtonClick = this.onBackwardButtonClick.bind(this)
        this.onForwardButtonClick = this.onForwardButtonClick.bind(this)
        this.isForwardButtonDisabled = this.isForwardButtonDisabled.bind(this)
        this.isBackButtonDisabled = this.isBackButtonDisabled.bind(this)
    }

    render() {
        return <div className='vm-state'>
            <div className='ui-toolbar machine-toolbar'>
                <EditorButtonComponent disabled={this.isBackButtonDisabled()} name='vm-step-back' text='Backward' onClick={this.onBackwardButtonClick} />
                <div className='info-num'>
                    <div className='info-label'>IP</div>
                    <div className='info-value'>{this.props.app.machine.instructionPointer}</div>
                </div>
                <div className='info-num'>
                    <div className='info-label'>Count</div>
                    <div className='info-value'>{this.props.app.machine.instructionCount}</div>
                </div>
                <EditorButtonComponent disabled={this.isForwardButtonDisabled()} name='vm-step-forward' text='Forward' onClick={this.onForwardButtonClick} />
            </div>
            <div className='vm-content'>
                <div className='flex-surround'>
                    <div className='expand'>
                        <VMInstructionsComponent app={this.props.app}/>
                    </div>
                    <div className='expand vert-fill'>
                        <VMStackComponent app={this.props.app} />
                        <VMGlobalEnvComponent app={this.props.app} />
                    </div>
                </div>
                <VMConsoleComponent app={this.props.app}/>
            </div>
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
        const instructionComponents = []
        let key = 0;
        instructions.forEach((instruction, index) => {
            let globalLabelsAtIndex = this.props.app.machine.indexToGlobalLabelsMap[index]
            if (globalLabelsAtIndex) {
                instructionComponents.push(<div className='global-label' key={key}>{globalLabelsAtIndex}</div>)
                key++
            }
            let instructionComponent = <InstructionComponent
            key={key}
            instruction={instruction}
            index={index}
            currentIp={this.props.app.machine.instructionPointer}
            insideRange={instructionRange ? instructionRange.withinRange(index) : false}
            app={this.props.app}
            />
            instructionComponents.push(instructionComponent)
            key++
        })
        return <div className='instructions ui-component'>
            <div className='ui-component-title'>
                Instructions
            </div>
            <div className='ui-component-content'>
                {instructionComponents}
            </div>
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
            this.getLabels().includes(this.props.app.selectedLabel) ? 'selected-label' : '',
            this.props.app.languageDefinition.getName()
        )
    }

    private getLabels() {
        return this.props.app.machine.indexToLabelsMap[this.props.index] || []
    }


    getActiveASTNodesAtIndex(index: number) {
        const nodes = this.props.app.machine.activeASTNodesAtIndices[index];
        return nodes.map((node, index) => {
            return <TinyASTLinkComponent key={index} app={this.props.app} node={node}/>
        })
    }

    render() {
        const labelElements = this.getLabels().map((label, index) => {
            if (label instanceof vm.Label) {
                return <div key={index} className='local-label label'>
                    <TinyASTLinkComponent app={this.props.app} node={label.ownerNode}/>
                    {label.name}
                </div>
            } else {
                return <div key={index} className='global-label label'>{label}</div>
            }
        })
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
    } else if (instruction instanceof vm.MethodCall) {
        return <div className='args machine-method-call'>{instruction.name}</div>
    }
}

interface LabelComponentProps extends VMStateProps {
    label: vm.Label | string
}

export class LabelComponent extends React.Component<LabelComponentProps, NoState> {
    onMouseEnter(e) {
        this.props.app.selectLabel(this.props.label)
    }

    onMouseLeave(e) {
        this.props.app.selectLabel(undefined)
    }

    render() {
        const contents = this.props.label instanceof vm.Label
        ? <div className='argument-label'><TinyASTLinkComponent app={this.props.app} node={this.props.label.ownerNode}/>{this.props.label.name}</div>
        : this.props.label
        return <div className='label'
        onMouseEnter={this.onMouseEnter.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}
        >{contents}</div>
    }
}

export class VMStackComponent extends React.Component<VMStateProps, NoState> {
    render() {
        const stackFrames = this.props.app.machine.stack.getFrames()
        const frameComponents = stackFrames.map((frame, index) => {
            return <StackFrameComponent key={index} frame={frame} />
        }).reverse()
        return <div className='ui-component vm-stack-component'>
            <div className='ui-component-title'>
                Stack Frames
            </div>
            <div className='ui-component-content stack'>
                {frameComponents}
            </div>
        </div>
    }
}

interface StackFrameProps {
    frame: vm.StackFrame
}
export class StackFrameComponent extends React.Component<StackFrameProps, NoState> {
    render() {
        const stackElements = this.props.frame.stack;
        const stackComponents = stackElements.map((element, index) => {
            return <StackElementComponent key={index} element={element} />
        }).reverse()
        const returnAddress = typeof this.props.frame.returnAddress == 'number'
        ? [
            <div key={1} className='frame-divider'>Return Address</div>,
            <div key={2} className='return-address'>{this.props.frame.returnAddress}</div>
        ]
        : undefined
        return <div className='frame'>
            <div className='frame-divider'>Stack</div>
            {stackComponents}
            <div className='frame-divider'>Environment</div>
            <EnvElementComponent environment={this.props.frame.stackEnvironment}/>
            {returnAddress}
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

export class VMGlobalEnvComponent extends React.Component<VMStateProps, NoState> {
    render() {
        return <div className='ui-component vm-global-environment-component'>
            <div className='ui-component-title'>
                Global Environment
            </div>
            <div className='ui-component-content'>
                <EnvElementComponent environment={this.props.app.machine.globalEnvironment}/>
            </div>
        </div>
    }
}

interface EnvElementProps {
    environment: vm.Environment
}
interface EnvElementState {}

export class EnvElementComponent extends React.Component<EnvElementProps, EnvElementState> {
    render() {
        const keys = this.props.environment.keys()
        const mappings = keys.map((key, index) => {
            let value = this.props.environment.get(key)
            return <div className='mapping' key={index}>
                <div className='key'>{key}</div>
                <div className='arrow'>-></div>
                <div className='value'>{value}</div>
            </div>
        })
        return <div className='env'>
            {mappings}
        </div>
    }
}

class VMConsoleComponent extends React.Component<VMStateProps, NoState> {
    render() {
        return <div className='console ui-component'>
            <div className='ui-component-title'>
                Console
            </div>
            <div className='ui-component-content'>
                <pre>
                    {this.props.app.machine.textConsole.getText()}
                </pre>
            </div>
        </div>
    }
}

interface TinyASTLinkProps {
    app: App,
    node: ASTNode
}

class TinyASTLinkComponent extends React.Component<TinyASTLinkProps, NoState> {
    selectNode() {
        this.props.app.selectASTNode(this.props.node)
    }

    render() {
        const node = this.props.node
        const isSelected = this.props.app.selectedASTNode == this.props.node
        const className = classNames(
            'tiny-ast-link',
            node.constructor.name,
            isSelected ? 'selected' : ''
        )
        const shortName = node.constructor.name.split("").filter((l: string) => l.toUpperCase() == l)
        return <div className={className} onClick={this.selectNode.bind(this)}>{shortName}</div>

    }
}