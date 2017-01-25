import React from "react";
import ReactDOM from "react-dom";

import * as lang from "../lang";

let selectFunction;
export function renderAST(ast: lang.ASTNode, selectASTNode) {
    ReactDOM.render(
        <ASTNodeComponent node={ast} />,
        document.getElementById("react-ast-div")
    )
    selectFunction = selectASTNode;
}

interface ASTComponentProps {
    node: lang.ASTNode
}
interface NoState {}

interface ASTNodeComponentState {
    clicked: boolean;
}

class ASTNodeComponent extends React.Component<ASTComponentProps, ASTNodeComponentState> {
    onClick(e) {
        selectFunction(!this.state.clicked ? this.props.node : null);
        this.setState(prevState => ({
            clicked: !prevState.clicked
        }))
        e.stopPropagation();
        return null;
    }

    getClassName() {
        return [
            'ast-node',
            this.props.node.constructor.name,
            this.state.clicked ? 'clicked' : ''
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
        const innerElement = getComponentForNode(astNode);
        return <div className={this.getClassName()} onClick={this.onClick}>
            <div className='title'>{astNode.constructor.name}</div>
            <div className='content'>
                {innerElement}
            </div>
        </div>
    }
}

function getComponentForNode(astNode: lang.ASTNode) {
    switch (astNode.constructor.name) {
        case "Integer": return <IntegerComponent integer={astNode as lang.Integer} />
        case "ValueExpression": return <ValueExpressionComponent value={astNode as lang.ValueExpression} />
        case "BinaryExpression": return <BinaryExpressionComponent binaryExpression={astNode as lang.BinaryExpression} />
        case "AssignmentStatement": return <AssignmentStatementComponent assignmentStatement={astNode as lang.AssignmentStatement} />
        case "WhileStatement": return <WhileStatementComponent whileStatement={astNode as lang.WhileStatement} />
        case "Statements": return <StatementsComponent statements={astNode as lang.Statements} />
        case "Ident": return <IdentComponent ident={astNode as lang.Ident} />
        default: return <UnspecifiedComponent node={astNode} />
    }
}

interface IntegerComponentProps {
    integer: lang.Integer
}

class IntegerComponent extends React.Component<IntegerComponentProps, NoState> {
    render() {
        return <div className='ast-row'>
            {this.props.integer.value}
        </div>
    }
}

interface ValueExpressionComponentProps {
    value: lang.ValueExpression
}
class ValueExpressionComponent extends React.Component<ValueExpressionComponentProps, NoState> {
    render() {
        return <div className='ast-row'>{this.props.value.ident}</div>
    }
}

interface BinaryExpressionComponentProps {
    binaryExpression: lang.BinaryExpression
}
class BinaryExpressionComponent extends React.Component<BinaryExpressionComponentProps, NoState> {
    render() {
        return <div className='ast-row'>
            <ASTNodeComponent node={this.props.binaryExpression.left} />
            <div className='operator'>{this.props.binaryExpression.op}</div>
            <ASTNodeComponent node={this.props.binaryExpression.right} />
        </div>
    }
}

interface AssignmentStatementComponentProps {
    assignmentStatement: lang.AssignmentStatement
}
class AssignmentStatementComponent extends React.Component<AssignmentStatementComponentProps, NoState> {
    render() {
        return <div className='ast-row'>
            <ASTNodeComponent node={this.props.assignmentStatement.ident} />
            <div className='assign'>=</div>
            <ASTNodeComponent node={this.props.assignmentStatement.expression} />
        </div>
    }
}

interface WhileStatementComponentProps {
    whileStatement: lang.WhileStatement
}
class WhileStatementComponent extends React.Component<WhileStatementComponentProps, NoState> {
    render() {
        return <div className='ast-row'>
            <div className='while'>while</div>
            <div className='leftparen'>(</div>
            <ASTNodeComponent node={this.props.whileStatement.condition} />
            <div className='rightparen'>)</div>
            <div className='do'>do</div>
            <div className='leftbrace'>&#123;</div>
            <ASTNodeComponent node={this.props.whileStatement.statements} />
            <div className='rightbrace'>&#125;</div>
        </div>
    }
}

interface StatementsComponentProps {
    statements: lang.Statements
}
class StatementsComponent extends React.Component<StatementsComponentProps, NoState> {
    editRow(e) {
        console.log('Edit!')
    }

    deleteRow(e) {
        console.log('Delete!')
    }

    insertRow(index) {
        return function(e) {
            console.log('Insert at index', index);
        }
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
                    <ASTNodeComponent node={statement} />
                </div>
                <div className='ast-statements-list-row-buttons'>
                    <div className='ast-button ast-row-delete' onClick={this.deleteRow}>-</div>
                    <div className='ast-button ast-row-edit' onClick={this.editRow}>Edit</div>
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

interface IdentComponentProps {
    ident: lang.Ident
}

class IdentComponent extends React.Component<IdentComponentProps, NoState> {
    render() {
        return <div className='ast-row'>{this.props.ident.name}</div>
    }
}

class UnspecifiedComponent extends React.Component<ASTComponentProps, NoState> {
    render() {
        return <div className='ast-row'>{this.props.node.constructor.name}</div>
    }
}