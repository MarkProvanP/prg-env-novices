import React from "react";
import ReactDOM from "react-dom";

import * as lang from "../lang";
import { App } from "../app";

export function renderAST(app: App) {
    ReactDOM.render(
        <ASTNodeComponent node={app.ast} app={app} />,
        document.getElementById("react-ast-div")
    )
}

interface ASTComponentProps {
    node: lang.ASTNode,
    app: App
}
interface NoState {}

class ASTNodeComponent extends React.Component<ASTComponentProps, NoState> {
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

function getComponentForNode(props: ASTComponentProps) {
    const astNode = props.node
    switch (astNode.constructor.name) {
        case "Integer": return <IntegerComponent {...props} integer={astNode as lang.Integer} />
        case "ValueExpression": return <ValueExpressionComponent {...props} value={astNode as lang.ValueExpression} />
        case "BinaryExpression": return <BinaryExpressionComponent {...props} binaryExpression={astNode as lang.BinaryExpression} />
        case "AssignmentStatement": return <AssignmentStatementComponent {...props} assignmentStatement={astNode as lang.AssignmentStatement} />
        case "WhileStatement": return <WhileStatementComponent {...props} whileStatement={astNode as lang.WhileStatement} />
        case "Statements": return <StatementsComponent {...props} statements={astNode as lang.Statements} />
        case "Ident": return <IdentComponent {...props} ident={astNode as lang.Ident} />
        case "EmptyIdent": return <EmptyIdentComponent {...props} emptyIdent={astNode as lang.EmptyIdent} />
        case "EmptyStatement": return <EmptyStatementComponent {...props} emptyStatement={astNode as lang.EmptyStatement} />
        default: return <UnspecifiedComponent {...props} node={astNode} />
    }
}

interface IntegerComponentProps extends ASTComponentProps {
    integer: lang.Integer
}

class IntegerComponent extends React.Component<IntegerComponentProps, NoState> {
    render() {
        return <div className='ast-row'>
            {this.props.integer.value}
        </div>
    }
}

interface ValueExpressionComponentProps extends ASTComponentProps {
    value: lang.ValueExpression
}
class ValueExpressionComponent extends React.Component<ValueExpressionComponentProps, NoState> {
    render() {
        return <div className='ast-row'>{this.props.value.ident.name}</div>
    }
}

interface BinaryExpressionComponentProps extends ASTComponentProps {
    binaryExpression: lang.BinaryExpression
}
class BinaryExpressionComponent extends React.Component<BinaryExpressionComponentProps, NoState> {
    render() {
        return <div className='ast-row'>
            <ASTNodeComponent {...this.props} node={this.props.binaryExpression.left} />
            <div className='operator'>{this.props.binaryExpression.op}</div>
            <ASTNodeComponent {...this.props} node={this.props.binaryExpression.right} />
        </div>
    }
}

interface EmptyExpressionProps extends ASTComponentProps {
    emptyStatement: lang.EmptyExpression
}

class EmptyExpressionComponent extends React.Component<EmptyExpressionProps, NoState> {
    render() {
        return <div className='ast-row'>EMPTY_EXPRESSION</div>
    }
}

interface AssignmentStatementComponentProps extends ASTComponentProps {
    assignmentStatement: lang.AssignmentStatement
}
class AssignmentStatementComponent extends React.Component<AssignmentStatementComponentProps, NoState> {
    render() {
        return <div className='ast-row'>
            <KeywordComponent keyword='let' />
            <ASTNodeComponent {...this.props} node={this.props.assignmentStatement.ident} />
            <SyntaxComponent syntax=':=' />
            <ASTNodeComponent {...this.props} node={this.props.assignmentStatement.expression} />
        </div>
    }
}

interface WhileStatementComponentProps extends ASTComponentProps {
    whileStatement: lang.WhileStatement
}
class WhileStatementComponent extends React.Component<WhileStatementComponentProps, NoState> {
    removeCondition(e) {
        let newEmptyExpression = new lang.EmptyExpression()
        this.props.app.replaceElement(this.props.whileStatement, "condition", newEmptyExpression)
    }

    constructor(props: WhileStatementComponentProps) {
        super(props)
        this.removeCondition = this.removeCondition.bind(this)
    }
    render() {
        return <div className='ast-row'>
            <KeywordComponent keyword='while' />
            <SyntaxComponent syntax='(' />
            <ASTNodeComponent {...this.props} node={this.props.whileStatement.condition} />
            <div className='ast-button ast-element-delete' onClick={this.removeCondition}>-</div>
            <SyntaxComponent syntax=')' />
            <KeywordComponent keyword='do' />
            <SyntaxComponent syntax='{' />
            <ASTNodeComponent {...this.props} node={this.props.whileStatement.statements} />
            <SyntaxComponent syntax='}' />
        </div>
    }
}

interface KeywordComponentProps {
    keyword: string
}

let classNames = (...classes) => classes.filter(s => s).join(" ")

class KeywordComponent extends React.Component<KeywordComponentProps, NoState> {
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

interface SyntaxComponentProps {
    syntax: string
}

class SyntaxComponent extends React.Component<SyntaxComponentProps, NoState> {
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

interface StatementsComponentProps extends ASTComponentProps {
    statements: lang.Statements
}
interface StatementsComponentState {
    searchingForType: boolean,
    emptyStatementIndex: number,
    emptyStatementInput: string,
    matchingStatementTypes: any[],
    highlightedStatementIndex: number
}

class StatementsComponent extends React.Component<StatementsComponentProps, StatementsComponentState> {
    editRow(index) {
        return e => {
            console.log('Edit at index', index)
        }
    }

    deleteRow(index) {
        return e => {
            console.log('Delete at index', index)
            this.props.app.deleteFromArray(this.props.statements, "statements", index)
        }
    }

    insertRow(index) {
        return e => {
            console.log('Insert at index', index, this);
            let newASTNode = new lang.EmptyStatement();
            this.props.app.insertIntoArray(this.props.statements, "statements", index, newASTNode)
            this.setState(prevState => ({
                emptyStatementIndex: index,
                searchingForType: true
            }))
        }
    }

    constructor(props: StatementsComponentProps) {
        super(props)
        this.editRow = this.editRow.bind(this)
        this.deleteRow = this.deleteRow.bind(this)
        this.insertRow = this.insertRow.bind(this)
        this.state = {
            searchingForType: false,
            emptyStatementInput: "",
            matchingStatementTypes: [],
            highlightedStatementIndex: 0,
            emptyStatementIndex: 0
        }
    }

    onKeyDown(e) {
        let event = e.nativeEvent;

        if (!this.state.searchingForType) {
            return;
        }

        const isArrowUp = event.key == "ArrowUp"
        const isArrowDown = event.key == "ArrowDown"
        const isEnterKey = event.key == "Enter"

        if (!(isArrowUp || isArrowDown || isEnterKey)) {
            console.log('not right key', event.key)
            return
        }

        let index = this.state.highlightedStatementIndex;

        if (isEnterKey) {
            let selected = this.state.matchingStatementTypes[index];
            let emptyStatementIndex = this.state.emptyStatementIndex;
            this.props.app.replaceElementInArray(this.props.statements, "statements", emptyStatementIndex, selected)
            console.log('Replaced element')
            return
        }

        if (isArrowDown && index < this.state.matchingStatementTypes.length - 1) {
            index++
        } else if (isArrowUp && index > 0) {
            index--
        }

        this.setState(prevState => ({
            highlightedStatementIndex: index
        }))
    }

    private createPlusButton(index: number) {
        return <ButtonComponent key={index * 2} name='row-insert' text='+' onClick={this.insertRow(index)} />
    }

    private emptyStatementOnChange(e) {
        const newInputValue = e.nativeEvent.srcElement.value
        const types = lang.getMatchingStatementTypes(newInputValue)
        console.log(types)
        this.setState(prevState => ({
            searchingForType: true,
            emptyStatementInput: newInputValue,
            matchingStatementTypes: types
        }))
    }

    private createEmptyStatementElement(index) {
        const possibleTypesElements = this.state.matchingStatementTypes.map((statement, index) => {
            let classes = classNames('possibility', (this.state.highlightedStatementIndex == index) ? 'highlighted' : '')
            return <div key={index} className={classes}>
                <ASTNodeComponent {...this.props} node={statement} />
            </div>
        })
        return <div className='empty-statement'>
            <input type='text' onInput={this.emptyStatementOnChange.bind(this)}/>
            <div className='possibilities'>
                {possibleTypesElements}
            </div>
        </div>
    }

    render() {
        const statements = this.props.statements.statements;
        const statementsList = statements.map((statement, index) => {
            let contentElement = statement instanceof lang.EmptyStatement
            ? this.createEmptyStatementElement(index)
            : <ASTNodeComponent {...this.props} node={statement}  />
            return <div key={(index * 2) + 1} className='ast-statements-list-row'>
                <div className='ast-statements-list-row-index'>{index}</div>
                <div className='ast-statements-list-row-content'>
                    {contentElement}
                </div>
                <div className='ast-statements-list-row-buttons'>
                    <ButtonComponent name='row-delete' text='-' onClick={this.deleteRow(index)} />
                    <ButtonComponent name='row-edit' text='Edit' onClick={this.editRow(index)} />
                </div>
            </div>
        })
        let elementsList = []
        statementsList.forEach((statement, index) => {
            let plusButton = this.createPlusButton(index);
            elementsList.push(plusButton);
            elementsList.push(statement);
        })
        let plusButton = this.createPlusButton(statements.length);
        elementsList.push(plusButton);
        return <div className='ast-statements-list' onKeyDown={this.onKeyDown.bind(this)}>
            {elementsList}
        </div>
    }
}

interface IdentComponentProps extends ASTComponentProps {
    ident: lang.Ident
}

class IdentComponent extends React.Component<IdentComponentProps, NoState> {
    render() {
        return <div className='ast-row'>{this.props.ident.name}</div>
    }
}

interface EmptyIdentComponentProps extends ASTComponentProps {
    emptyIdent: lang.EmptyIdent
}

class EmptyIdentComponent extends React.Component<EmptyIdentComponentProps, NoState> {
    render() {
        return <div className='ast-row'>EMPTY_IDENT</div>
    }
}

interface EmptyStatementProps extends ASTComponentProps {
    emptyStatement: lang.EmptyStatement
}

class EmptyStatementComponent extends React.Component<EmptyStatementProps, NoState> {
    render() {
        return <div className='ast-row'>EMPTY_STATEMENT</div>
    }
}

class UnspecifiedComponent extends React.Component<ASTComponentProps, NoState> {
    render() {
        return <div className='ast-row'>{this.props.node.constructor.name}</div>
    }
}

interface ButtonComponentProps {
    text: string,
    name: string,
    onClick: (e) => void
}

class ButtonComponent extends React.Component<ButtonComponentProps, NoState> {
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