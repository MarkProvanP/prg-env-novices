import React from "react";
import ReactDOM from "react-dom";
import * as ast from "../ast";
import { App } from "../app";

let classNames = (...classes) => classes.filter(s => s).join(" ")

export function renderAST(app: App) {
    ReactDOM.render(
        <WholeASTComponent node={app.ast} app={app} />,
        document.getElementById("react-ast-div")
    )
}

interface WholeASTProps {
    node: ast.ASTNode,
    app: App
}

interface WholeASTState {

}

export class WholeASTComponent extends React.Component<WholeASTProps, WholeASTState> {
    onMouseOver(e) {
        this.props.app.stopMouseOverASTNode();
    }
    render() {
        const rootNode = this.props.node;
        return <div className={classNames('whole-ast', this.props.app.languageDefinition.getName())} onMouseOver={this.onMouseOver.bind(this)}>
            {rootNode.render(this.props)}
        </div>
    }
}

export interface ASTComponentProps {
    node: ast.ASTNode,
    app: App
}
export interface ASTNodeComponentState {
    hovering: boolean
}
export interface NoState {}

export abstract class ASTNodeComponent<P extends ASTComponentProps, S extends ASTNodeComponentState> extends React.Component<P, S> {
    onClick(e) {
        const astNode = this.getASTNode()
        let selectedBefore = this.props.app.selectedASTNode == astNode
        this.props.app.selectASTNode(selectedBefore ? null : astNode);
        e.stopPropagation();
        return null;
    }

    getClassName() {
        const astNode = this.getASTNode()
        let selected = this.props.app.selectedASTNode == astNode
        if (this.props.app.mousedOverASTNodes) {
            var mouseOverIndex = this.props.app.mousedOverASTNodes.indexOf(astNode)
        }
        const executing = this.props.app.machine.getExecutingASTNode() == astNode
        return [
            'ast-node',
            astNode.constructor.name,
            selected ? 'clicked' : 'not-clicked',
            mouseOverIndex != -1 ? 'hovering' : 'not-hovering',
            mouseOverIndex != -1 ? `hovering-${mouseOverIndex}` : '',
            executing ? 'executing' : ''
        ].filter(s => s).join(" ");
    }

    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    abstract getASTNode()
    abstract getInnerElement()

    onMouseOver(e) {
        this.props.app.mouseOverASTNode(this.getASTNode())
    }

    render() {
        if (!this.getInnerElement) {
            debugger;
        }
        const astNode = this.getASTNode();
        return <div className={this.getClassName()} onClick={this.onClick} onMouseOver={this.onMouseOver.bind(this)}>
            <div className='title'>{astNode.constructor.name}</div>
            <div className='content'>
                {this.getInnerElement()}
            </div>
        </div>
    }
}

export interface ASTWrapperComponentProps<T extends ast.ASTNode> extends ASTComponentProps {
    node: T,
    onNodeDelete: () => void,
    onNodeEdit: (replacement: T) => void,
    required? : boolean
}

export interface ASTWrapperComponentState<T extends ast.ASTNode> {
    showingSuggestions: boolean,
    matchingASTTypes: T[],
    highlightedASTIndex: number,
    emptyASTInput: string,
    mousedOver: boolean
}

export abstract class ASTWrapperComponent<P extends ASTWrapperComponentProps<T>, T extends ast.ASTNode> extends React.Component<P, ASTWrapperComponentState<T>> {
    constructor(props: ASTWrapperComponentProps<T>) {
        super(props)
        this.state = {
            showingSuggestions: false,
            matchingASTTypes: [],
            highlightedASTIndex: 0,
            emptyASTInput: "",
            mousedOver: false
        }
    }
    
    abstract isEmptyAST()

    onKeyDown(e) {
        let event = e.nativeEvent;

        console.log('EmptyAST KeyDown', event, this);

        if (!this.isEmptyAST()) {
            console.log('not empty ast')
            return;
        }

        const isArrowUp = event.key == "ArrowUp"
        const isArrowDown = event.key == "ArrowDown"
        const isEnterKey = event.key == "Enter"

        if (!(isArrowUp || isArrowDown || isEnterKey)) {
            console.log('not right key', event.key)
            return
        }

        let index = this.state.highlightedASTIndex;

        if (isEnterKey) {
            this.pickPossibility(index)
            return
        }

        if (isArrowDown && index < this.state.matchingASTTypes.length - 1) {
            index++
        } else if (isArrowUp && index > 0) {
            index--
        }

        this.setState(prevState => ({
            highlightedASTIndex: index
        }))
    }

    private pickPossibility(index) {
        let selected = this.state.matchingASTTypes[index];
            this.editAST(selected)
    }

    private textOnInput(e) {
        const newInputValue = e.nativeEvent.srcElement.value
        const types = this.getMatchingASTTypes(newInputValue)

        this.setState(prevState => ({
            showingSuggestions: true,
            emptyASTInput: newInputValue,
            matchingASTTypes: types
        }))
    }

    private textOnClick(e) {
        this.setState(prevState => ({
            showingSuggestions: true
        }))
    }

    private textOnBlur(e) {
        this.setState(prevState => ({
            showingSuggestions: false
        }))
    }

    private possibilityOnClick(index) {
        return e => {
            console.log('Click', index);
            this.pickPossibility(index)
        }
    }

    private possibilityOnMouseOver(index) {
        return e => {
            console.log("mouseover", index);
        }
    }

    emptyASTElement() {
        const possibleTypesElements = this.state.matchingASTTypes.map((ast, index) => {
            let classes = classNames('possibility', (this.state.highlightedASTIndex == index) ? 'highlighted' : '')
            return <div key={index} className={classes} onMouseOver={this.possibilityOnMouseOver(index).bind(this)} onClick={this.possibilityOnClick.bind(this)(index)}>
                {ast.render(this.props)}
            </div>
        })
        let possibilitiesElement = this.state.showingSuggestions
        ?   <div className='possibilities'>
                <div className='title'>Possibilities</div>
                {possibleTypesElements}
            </div>
        : undefined
        return <div className={classNames('ast-wrapper-content', 'empty-ast', this.props.required ? 'required' : 'not-required')}>
            <input type='text'
            placeholder={this.getASTType().name}
            onInput={this.textOnInput.bind(this)}
            onClick={this.textOnClick.bind(this)}
            onBlur={this.textOnBlur.bind(this)}
            />
            {possibilitiesElement}
        </div>
    }

    isRequired() {
        return this.props.required !== false
    }

    abstract deleteAST();
    abstract editAST(replacement: T);
    editASTButton(e) {
        this.editAST(this.props.node)
    }
    abstract getASTType();
    abstract getMatchingASTTypes(input: string)

    existentASTElement() {
        return <div className={classNames('ast-wrapper-content', 'ast-row')}>
            {this.props.node.render(this.props)}
            <ButtonComponent name='element-delete' text='-' onClick={this.deleteAST.bind(this)} />
        </div>
    }

    getASTContent() {
        return this.isEmptyAST() ? this.emptyASTElement() : this.existentASTElement()
    }

    getClassName() {
        const astNode = this.props.node
        if (this.props.app.mousedOverASTNodes) {
            var mouseOverIndex = this.props.app.mousedOverASTNodes.indexOf(astNode)
        }
        return classNames(
            'ast-wrapper',
            this.constructor.name,
            mouseOverIndex != -1 ? 'hovering' : 'not-hovering',
            mouseOverIndex != -1 ? `hovering-${mouseOverIndex}` : ''
        )
    }

    render() {
        return <div className={this.getClassName()}
        onKeyDown={this.onKeyDown.bind(this)}
        >
            <div className='title'>{this.getASTType().name}</div>
            {this.getASTContent()}
        </div>
    }
}

export interface KeywordComponentProps {
    keyword: string
}


export class KeywordComponent extends React.Component<KeywordComponentProps, NoState> {
    getClassName() {
        return classNames(
            'keyword',
            this.props.keyword
        )
    }

    render() {
        return <div className={this.getClassName()}>{this.props.keyword}</div>
    }
}

export interface SyntaxComponentProps {
    syntax: string
}

export class SyntaxComponent extends React.Component<SyntaxComponentProps, NoState> {
    getClassName() {
        return classNames(
            'syntax',
            this.props.syntax
        )
    }

    render() {
        return <div className={this.getClassName()}>{this.props.syntax}</div>
    }
}

export interface ButtonComponentProps {
    text: string,
    name: string,
    cannotHide?: boolean,
    onClick: (e) => void
}

export class ButtonComponent extends React.Component<ButtonComponentProps, NoState> {
    getClassName() {
        return classNames(
            'ast-button',
            this.props.name,
            this.props.cannotHide ? 'cannot-hide' : 'can-hide'
        )
    }

    render() {
        return <div className={this.getClassName()} onClick={this.props.onClick} >{this.props.text}</div>
    }
}

export interface InputComponentProps {
    value: any,
    type: string,
    onChange: (e) => void
}

export class InputComponent extends React.Component<InputComponentProps, NoState> {
    getStyle() {
        const numChars = String(this.props.value).length;
        const buttonsWidth = 15
        const charWidth = 10
        const width = numChars * charWidth + buttonsWidth
        return {
            width: `${width}px`
        }
    }
    render() {
        return <input className='ast-input' style={this.getStyle()} type={this.props.type} value={this.props.value} onChange={this.props.onChange} />
    }
}

export interface SelectionComponentProps {
    value: any,
    values: any[],
    onChange: (e) => void
}

export class SelectionComponent extends React.Component<SelectionComponentProps, NoState> {
    render() {
        const optionElements = this.props.values.map((value, index) => (
            <option key={index} value={value}>{value}</option>
        ))
        console.log(this.props.value, this.props.values)
        return <select className='ast-select' value={this.props.value} onChange={this.props.onChange}>{optionElements}</select>
    }
}

export interface VerticalListComponentProps<P extends ASTWrapperComponentProps<S>, T extends ast.ASTNode, S extends ast.ASTNode> {
    app: App,
    node: T,
    arrayName: string,
    type: { new(): S },
    wrapperType: { new(): ASTWrapperComponent<P, S> }
}

export class VerticalListComponent<P extends ASTWrapperComponentProps<S>, T extends ast.ASTNode, S extends ast.ASTNode> extends React.Component<VerticalListComponentProps<P, T, S>, NoState> {
    editRow(index) {
        return replacement => {
            this.props.app.replaceElementInArray(this.props.node, this.props.arrayName, index, replacement)
        }
    }

    deleteRow(index) {
        return () => {
            this.props.app.deleteFromArray(this.props.node, this.props.arrayName, index)
        }
    }

    insertRow(index) {
        return e => {
            let newASTNode = new this.props.type();
            this.props.app.insertIntoArray(this.props.node, this.props.arrayName, index, newASTNode)
        }
    }

    constructor(props: VerticalListComponentProps<P, T, S>) {
        super(props)
        this.editRow = this.editRow.bind(this)
        this.deleteRow = this.deleteRow.bind(this)
        this.insertRow = this.insertRow.bind(this)
    }

    private createPlusButton(index: number) {
        return <ButtonComponent key={index * 2} name='row-insert' text='+' onClick={this.insertRow(index)} />
    }

    render() {
        const methods = this.props.node[this.props.arrayName];
        const methodsList = methods.map((method, index) => {
            return <div key={(index * 2) + 1} className='ast-list-row'>
                <div className='ast-list-row-index'>{index}</div>
                <div className='ast-list-row-content'>
                    <this.props.wrapperType {...this.props}
                    node={method}
                    onNodeDelete={this.deleteRow(index)}
                    onNodeEdit={this.editRow(index)}
                    />
                </div>
            </div>
        })
        let elementsList = []
        methodsList.forEach((method, index) => {
            let plusButton = this.createPlusButton(index);
            elementsList.push(plusButton);
            elementsList.push(method);
        })
        let plusButton = this.createPlusButton(methods.length);
        elementsList.push(plusButton);
        return <div className='ast-list'>
            {elementsList}
        </div>
    }
}