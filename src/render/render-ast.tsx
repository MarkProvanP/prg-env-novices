import React from "react";
import ReactDOM from "react-dom";

import * as lang from "../lang";

export function renderAST(ast: lang.ASTNode) {
    ReactDOM.render(
        <ASTNodeComponent node={ast} />,
        document.getElementById("react-ast-div")
    )
}

interface ASTComponentProps {
    node: lang.ASTNode
}
interface NoState {}

class ASTNodeComponent extends React.Component<ASTComponentProps, NoState> {
    render() {
        const astNode = this.props.node;
        const innerElement = getComponentForNode(astNode);
        return <div className={'ast-node ' + this.props.node.constructor.name}>
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
            <ASTNodeComponent node={this.props.whileStatement.condition} />
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
    render() {
        const statements = this.props.statements.statements;
        const statementsList = statements.map((statement, index) => {
            return <li key={index}><ASTNodeComponent node={statement} /></li>
        })
        return <ol>
            {statementsList}
        </ol>
    }
}

class UnspecifiedComponent extends React.Component<ASTComponentProps, NoState> {
    render() {
        return <div className='ast-row'>{this.props.node.constructor.name}</div>
    }
}