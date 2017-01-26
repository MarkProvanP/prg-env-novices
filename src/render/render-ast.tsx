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
            <div className='keyword let'>let</div>
            <ASTNodeComponent {...this.props} node={this.props.assignmentStatement.ident} />
            <div className='syntax assign'>:=</div>
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
            <div className='keyword while'>while</div>
            <div className='syntax leftparen'>(</div>
            <ASTNodeComponent {...this.props} node={this.props.whileStatement.condition} />
            <div className='ast-button ast-element-delete' onClick={this.removeCondition}>-</div>
            <div className='syntax rightparen'>)</div>
            <div className='keyword do'>do</div>
            <div className='syntax leftbrace'>&#123;</div>
            <ASTNodeComponent {...this.props} node={this.props.whileStatement.statements} />
            <div className='syntax rightbrace'>&#125;</div>
        </div>
    }
}

interface StatementsComponentProps extends ASTComponentProps {
    statements: lang.Statements
}
class StatementsComponent extends React.Component<StatementsComponentProps, NoState> {
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
        return function(e) {
            console.log('Insert at index', index, this);
            let newASTNode = new lang.EmptyStatement();
            this.props.app.insertIntoArray(this.props.statements, "statements", index, newASTNode)
        }.bind(this)
    }

    constructor(props: StatementsComponentProps) {
        super(props)
        this.editRow = this.editRow.bind(this)
        this.deleteRow = this.deleteRow.bind(this)
        this.insertRow = this.insertRow.bind(this)
    }

    private createPlusButton(index) {
        return <div className='ast-button ast-row-insert' key={index * 2} onClick={this.insertRow(index)}>+</div>
    }

    render() {
        const statements = this.props.statements.statements;
        const statementsList = statements.map((statement, index) => {
            return <div key={(index * 2) + 1} className='ast-statements-list-row'>
                <div className='ast-statements-list-row-index'>{index}</div>
                <div className='ast-statements-list-row-content'>
                    <ASTNodeComponent {...this.props} node={statement}  />
                </div>
                <div className='ast-statements-list-row-buttons'>
                    <div className='ast-button ast-row-delete' onClick={this.deleteRow(index)}>-</div>
                    <div className='ast-button ast-row-edit' onClick={this.editRow(index)}>Edit</div>
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