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
        case "Method": return <MethodComponent {...props} method={astNode as lang.Method} />
        default: return <UnspecifiedComponent {...props} node={astNode} />
    }
}

interface ExpressionWrapperComponentProps extends ASTComponentProps {
    expression: lang.Expression,
    onExpressionDelete: () => void,
    onExpressionEdit: (replacement: lang.Expression) => void
}

interface ASTWrapperComponentState<T extends lang.ASTNode> {
    matchingASTTypes: T[],
    highlightedASTIndex: number,
    emptyASTInput: string,
}


abstract class ASTWrapperComponent<P extends ASTComponentProps, T extends lang.ASTNode> extends React.Component<P, ASTWrapperComponentState<T>> {
    constructor(props: ExpressionWrapperComponentProps) {
        super(props)
        this.state = {
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
            let selected = this.state.matchingASTTypes[index];
            this.editAST(selected)
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

    private emptyASTOnChange(e) {
        const newInputValue = e.nativeEvent.srcElement.value
        const types = this.getMatchingASTTypes(newInputValue)

        this.setState(prevState => ({
            emptyASTInput: newInputValue,
            matchingASTTypes: types
        }))
    }

    emptyASTElement() {
        const possibleTypesElements = this.state.matchingASTTypes.map((statement, index) => {
            let classes = classNames('possibility', (this.state.highlightedASTIndex == index) ? 'highlighted' : '')
            return <div key={index} className={classes}>
                <ASTNodeComponent {...this.props} node={statement} />
            </div>
        })
        return <div className={classNames('empty-ast')}>
            <input type='text' onInput={this.emptyASTOnChange.bind(this)}/>
            <div className='possibilities'>
                {possibleTypesElements}
            </div>
        </div>
    }

    abstract deleteAST();
    abstract editAST(replacement: T);
    editASTButton(e) {
        this.editAST(this.getASTNode())
    }
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
            <div className='title'>Expression</div>
            {this.getASTContent()}
        </div>
    }
}

class ExpressionWrapperComponent extends ASTWrapperComponent<ExpressionWrapperComponentProps, lang.Expression> {
    isEmptyAST() {
        return this.props.expression instanceof lang.EmptyExpression
    }
    
    getASTNode() {
        return this.props.expression
    }

    deleteAST() {
        this.props.onExpressionDelete()
    }

    editAST(replacement: lang.Expression) {
        this.props.onExpressionEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return lang.getMatchingExpressionTypes(input)
    }
}

interface IdentWrapperComponentProps extends ASTComponentProps {
    ident: lang.AbstractIdent,
    onIdentDelete: () => void
}

class IdentWrapperComponent extends React.Component<IdentWrapperComponentProps, NoState> {
    render() {
        return <div className={classNames('ast-wrapper', 'ident-wrapper', 'ast-row')}>
            <ASTNodeComponent {...this.props} node={this.props.ident}/>
            <ButtonComponent name='element-delete' text='-' onClick={this.props.onIdentDelete} />
        </div>
    }
}

interface StatementWrapperComponentProps extends ASTComponentProps {
    statement: lang.Statement,
    onStatementDelete: () => void,
    onStatementEdit: (replacement: lang.Statement) => void
}

interface StatementWrapperComponentState {
    matchingStatementTypes: lang.Statement[],
    highlightedStatementIndex: number,
    emptyStatementInput: string,
}

class StatementWrapperComponent extends React.Component<StatementWrapperComponentProps, StatementWrapperComponentState> {
    constructor(props: StatementWrapperComponentProps) {
        super(props)
        this.state = {
            matchingStatementTypes: [],
            highlightedStatementIndex: 0,
            emptyStatementInput: ""
        }
    }

    isEmptyStatement() {
        return this.props.statement instanceof lang.EmptyStatement
    }

    onKeyDown(e) {
        let event = e.nativeEvent;

        if (!this.isEmptyStatement()) {
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
            this.props.onStatementEdit(selected)
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

    emptyStatementElement() {
        const possibleTypesElements = this.state.matchingStatementTypes.map((statement, index) => {
            let classes = classNames('possibility', (this.state.highlightedStatementIndex == index) ? 'highlighted' : '')
            return <div key={index} className={classes}>
                <ASTNodeComponent {...this.props} node={statement} />
            </div>
        })
        return <div className={classNames('empty-ast', 'empty-statement')}>
            <input type='text' onInput={this.emptyStatementOnChange.bind(this)}/>
            <div className='possibilities'>
                {possibleTypesElements}
            </div>
        </div>
    }


    deleteStatement(e) {
        this.props.onStatementDelete()
    }

    editExpression(e) {
        this.props.onStatementEdit(this.props.statement)
    }
    
    existentStatementElement() {
        return <div className={classNames('ast-row', 'existent-statement')}>
            <ASTNodeComponent {...this.props} node={this.props.statement} />
            <ButtonComponent name='element-delete' text='-' onClick={this.deleteStatement.bind(this)} />
            <ButtonComponent name='row-edit' text='Edit' onClick={this.editExpression.bind(this)} />
        </div>
    }

    getStatementContent() {
        return this.isEmptyStatement() ? this.emptyStatementElement() : this.existentStatementElement()
    }

    render() {
        return <div className={classNames('ast-wrapper', 'statement-wrapper')} onKeyDown={this.onKeyDown.bind(this)}>
            <div className='title'>Statement</div>
            {this.getStatementContent()}
        </div>
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
        return <div className='ast-row'>
            <ASTNodeComponent {...this.props} node={this.props.value.ident}/>
        </div>
    }
}

interface BinaryExpressionComponentProps extends ASTComponentProps {
    binaryExpression: lang.BinaryExpression
}
class BinaryExpressionComponent extends React.Component<BinaryExpressionComponentProps, NoState> {
    private removeExpression(expressionName) {
        return () => {
            let newEmptyExpression = new lang.EmptyExpression()
            this.props.app.replaceElement(this.props.binaryExpression, expressionName, newEmptyExpression)
        }
    }

    private editExpression(expressionName) {
        return (replacement: lang.Expression) => {
            this.props.app.replaceElement(this.props.binaryExpression, expressionName, replacement)
        }
    }

    render() {
        return <div className='ast-row'>
            <ExpressionWrapperComponent {...this.props}
            expression={this.props.binaryExpression.left}
            onExpressionDelete={this.removeExpression("left").bind(this)}
            onExpressionEdit={this.editExpression("left").bind(this)}
            />
            <div className='operator'>{this.props.binaryExpression.op}</div>
            <ExpressionWrapperComponent {...this.props}
            expression={this.props.binaryExpression.right}
            onExpressionDelete={this.removeExpression("right").bind(this)}
            onExpressionEdit={this.editExpression("right").bind(this)}
            />
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
    removeIdent() {
        let newEmptyIdent = new lang.EmptyIdent()
        this.props.app.replaceElement(this.props.assignmentStatement, "ident", newEmptyIdent)
    }
    removeExpression(e) {
        let newEmptyExpression = new lang.EmptyExpression()
        this.props.app.replaceElement(this.props.assignmentStatement, "expression", newEmptyExpression)
    }
    editExpression(replacement) {
        this.props.app.replaceElement(this.props.assignmentStatement, "expression", replacement)
    }
    render() {
        return <div className='ast-row'>
            <KeywordComponent keyword='let' />
            <IdentWrapperComponent {...this.props} ident={this.props.assignmentStatement.ident} onIdentDelete={this.removeIdent.bind(this)}/>
            <SyntaxComponent syntax=':=' />
            <ExpressionWrapperComponent {...this.props}
            expression={this.props.assignmentStatement.expression}
            onExpressionDelete={this.removeExpression.bind(this)}
            onExpressionEdit={this.editExpression.bind(this)}
            />
        </div>
    }
}

interface WhileStatementComponentProps extends ASTComponentProps {
    whileStatement: lang.WhileStatement
}
class WhileStatementComponent extends React.Component<WhileStatementComponentProps, NoState> {
    removeCondition() {
        let newEmptyExpression = new lang.EmptyExpression()
        this.props.app.replaceElement(this.props.whileStatement, "condition", newEmptyExpression)
    }
    editCondition(replacement) {
        this.props.app.replaceElement(this.props.whileStatement, "condition", replacement)
    }

    render() {
        return <div>
            <div className='ast-row'>
                <KeywordComponent keyword='while' />
                <SyntaxComponent syntax='(' />
                <ExpressionWrapperComponent {...this.props}
                expression={this.props.whileStatement.condition}
                onExpressionDelete={this.removeCondition.bind(this)}
                onExpressionEdit={this.editCondition.bind(this)}
                />
                <SyntaxComponent syntax=')' />
                <KeywordComponent keyword='do' />
                <SyntaxComponent syntax='{' />
            </div>
            <div className='ast-row'>
                <ASTNodeComponent {...this.props} node={this.props.whileStatement.statements} />
            </div>
            <div className='ast-row'>
                <SyntaxComponent syntax='}' />
            </div>
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

class StatementsComponent extends React.Component<StatementsComponentProps, NoState> {
    editRow(index) {
        return replacement => {
            console.log('Edit at index', index)
            this.props.app.replaceElementInArray(this.props.statements, "statements", index, replacement)
        }
    }

    deleteRow(index) {
        return () => {
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
    }

    private createPlusButton(index: number) {
        return <ButtonComponent key={index * 2} name='row-insert' text='+' onClick={this.insertRow(index)} />
    }

    render() {
        const statements = this.props.statements.statements;
        const statementsList = statements.map((statement, index) => {
            return <div key={(index * 2) + 1} className='ast-statements-list-row'>
                <div className='ast-statements-list-row-index'>{index}</div>
                <div className='ast-statements-list-row-content'>
                    <StatementWrapperComponent {...this.props} statement={statement} onStatementDelete={this.deleteRow(index)} onStatementEdit={this.editRow(index)}/>
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
        return <div className='ast-statements-list'>
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

interface MethodComponentProps extends ASTComponentProps {
    method: lang.Method
}

class MethodComponent extends React.Component<MethodComponentProps, NoState> {
    removeIdent(e) {
        let newEmptyIdent = new lang.EmptyIdent()
        this.props.app.replaceElement(this.props.method, "name", newEmptyIdent)
    }

    render() {
        const argElements = []
        this.props.method.args.forEach((ident, index) => {
            argElements.push(<ASTNodeComponent key={index} {...this.props} node={ident} />)
            if (index != this.props.method.args.length - 1) {
                argElements.push(<SyntaxComponent syntax=',' />)
            }
        })
        return <div>
            <div className='ast-row'>
                <KeywordComponent keyword='method'/>
                <IdentWrapperComponent {...this.props} ident={this.props.method.name} onIdentDelete={this.removeIdent.bind(this)}/>
                <SyntaxComponent syntax='(' />
                {argElements}
                <SyntaxComponent syntax=')' />
            </div>
            <div className='ast-row'>
                <ASTNodeComponent {...this.props} node={this.props.method.statements} />
            </div>
        </div>
    }
}