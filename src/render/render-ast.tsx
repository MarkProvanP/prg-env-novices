import React from "react";
import ReactDOM from "react-dom";
import * as ast from "../ast";
import { App } from "../app";

import { getComponentForNode } from "./render-lang";

export function renderAST(app: App) {
    ReactDOM.render(
        <ASTNodeComponent node={app.ast} app={app} />,
        document.getElementById("react-ast-div")
    )
}

export interface ASTComponentProps {
    node: ast.ASTNode,
    app: App
}
export interface NoState {}

export class ASTNodeComponent extends React.Component<ASTComponentProps, NoState> {
    onClick(e) {
        let selectedBefore = this.props.app.selectedASTNode == this.props.node
        this.props.app.selectASTNode(selectedBefore ? null : this.props.node);
        e.stopPropagation();
        return null;
    }

    getClassName() {
        let selected = this.props.app.selectedASTNode == this.props.node
        return [
            'ast-node',
            this.props.node.constructor.name,
            selected ? 'clicked' : ''
        ].filter(s => s).join(" ");
    }

    constructor(props) {
        super(props);
        this.state = {
            clicked: false
        }
        this.onClick = this.onClick.bind(this);
    }

    render() {
        const astNode = this.props.node;
        const innerElement = getComponentForNode(this.props);
        return <div className={this.getClassName()} onClick={this.onClick}>
            <div className='title'>{astNode.constructor.name}</div>
            <div className='content'>
                {innerElement}
            </div>
        </div>
    }
}

export interface ASTWrapperComponentState<T extends ast.ASTNode> {
    showingSuggestions: boolean,
    matchingASTTypes: T[],
    highlightedASTIndex: number,
    emptyASTInput: string,
}

export abstract class ASTWrapperComponent<P extends ASTComponentProps, T extends ast.ASTNode> extends React.Component<P, ASTWrapperComponentState<T>> {
    constructor(props: ASTComponentProps) {
        super(props)
        this.state = {
            showingSuggestions: false,
            matchingASTTypes: [],
            highlightedASTIndex: 0,
            emptyASTInput: ""
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
                <ASTNodeComponent {...this.props} node={ast} />
            </div>
        })
        let possibilitiesElement = this.state.showingSuggestions
        ?   <div className='possibilities'>
                <div className='title'>Possibilities</div>
                {possibleTypesElements}
            </div>
        : undefined
        return <div className={classNames('empty-ast')}>
            <input type='text'
            placeholder={this.getASTType().name}
            onInput={this.textOnInput.bind(this)}
            onClick={this.textOnClick.bind(this)}
            onBlur={this.textOnBlur.bind(this)}
            />
            {possibilitiesElement}
        </div>
    }

    abstract deleteAST();
    abstract editAST(replacement: T);
    editASTButton(e) {
        this.editAST(this.getASTNode())
    }
    abstract getASTType();
    abstract getASTNode();
    abstract getMatchingASTTypes(input: string)

    existentASTElement() {
        return <div className={classNames('ast-row')}>
            <ASTNodeComponent {...this.props} node={this.getASTNode()} />
            <ButtonComponent name='element-delete' text='-' onClick={this.deleteAST.bind(this)} />
            <ButtonComponent name='row-edit' text='Edit' onClick={this.editASTButton.bind(this)} />
        </div>
    }

    getASTContent() {
        return this.isEmptyAST() ? this.emptyASTElement() : this.existentASTElement()
    }

    render() {
        return <div className={classNames('ast-wrapper', this.constructor.name)} onKeyDown={this.onKeyDown.bind(this)}>
            <div className='title'>{this.getASTType().name}</div>
            {this.getASTContent()}
        </div>
    }
}

export interface KeywordComponentProps {
    keyword: string
}

let classNames = (...classes) => classes.filter(s => s).join(" ")

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
    onClick: (e) => void
}

export class ButtonComponent extends React.Component<ButtonComponentProps, NoState> {
    getClassName() {
        return classNames(
            'ast-button',
            this.props.name
        )
    }

    render() {
        return <div className={this.getClassName()} onClick={this.props.onClick} >{this.props.text}</div>
    }
}