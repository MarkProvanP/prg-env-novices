import React from "react";
import ReactDOM from "react-dom";

import * as lang from "../lang";

import {
    NoState,
    ASTComponentProps,
    ASTNodeComponent,
    ASTWrapperComponent,
    ASTWrapperComponentState,
    ButtonComponent,
    ButtonComponentProps,
    KeywordComponent,
    KeywordComponentProps,
    SyntaxComponent,
    SyntaxComponentProps
} from "./render-ast";

export function getComponentForNode(props: ASTComponentProps) {
    const astNode = props.node
    switch (astNode.constructor.name) {
        case "Integer": return <IntegerComponent {...props} integer={astNode as lang.Integer} />
        case "ValueExpression": return <ValueExpressionComponent {...props} value={astNode as lang.ValueExpression} />
        case "BinaryExpression": return <BinaryExpressionComponent {...props} binaryExpression={astNode as lang.BinaryExpression} />
        case "AssignmentStatement": return <AssignmentStatementComponent {...props} assignmentStatement={astNode as lang.AssignmentStatement} />
        case "WhileStatement": return <WhileStatementComponent {...props} whileStatement={astNode as lang.WhileStatement} />
        case "Statements": return <StatementsComponent {...props} statements={astNode as lang.Statements} />
        case "ConcreteIdent": return <IdentComponent {...props} ident={astNode as lang.ConcreteIdent} />
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

class ExpressionWrapperComponent extends ASTWrapperComponent<ExpressionWrapperComponentProps, lang.Expression> {
    isEmptyAST() {
        return this.props.expression instanceof lang.EmptyExpression
    }
    
    getASTNode() {
        return this.props.expression
    }

    getASTType() {
        return lang.Expression
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

interface StatementWrapperComponentProps extends ASTComponentProps {
    statement: lang.Statement,
    onStatementDelete: () => void,
    onStatementEdit: (replacement: lang.Statement) => void
}

class StatementWrapperComponent extends ASTWrapperComponent<StatementWrapperComponentProps, lang.Statement> {
    isEmptyAST() {
        return this.props.statement instanceof lang.EmptyStatement
    }

    getASTNode() {
        return this.props.statement
    }

    getASTType() {
        return lang.Statement
    }

    deleteAST() {
        this.props.onStatementDelete()
    }

    editAST(replacement: lang.Statement) {
        this.props.onStatementEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return lang.getMatchingStatementTypes(input)
    }
}

interface IdentWrapperComponentProps extends ASTComponentProps {
    ident: lang.Ident,
    onIdentDelete: () => void,
    onIdentEdit: (replacement: lang.Ident) => void
}

class IdentWrapperComponent extends ASTWrapperComponent<IdentWrapperComponentProps, lang.Ident> {
    isEmptyAST() {
        return this.props.ident instanceof lang.EmptyIdent;
    }

    getASTNode() {
        return this.props.ident
    }

    getASTType() {
        return lang.Ident
    }

    deleteAST() {
        this.props.onIdentDelete()
    }

    editAST(replacement: lang.Ident) {
        this.props.onIdentEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return lang.getMatchingIdentTypes(input)
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
    editIdent(replacement) {
        this.props.app.replaceElement(this.props.assignmentStatement, "ident", replacement)
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
            <IdentWrapperComponent {...this.props}
            ident={this.props.assignmentStatement.ident}
            onIdentDelete={this.removeIdent.bind(this)}
            onIdentEdit={this.editIdent.bind(this)}
            />
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
    ident: lang.ConcreteIdent
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

interface MethodComponentProps extends ASTComponentProps {
    method: lang.Method
}

class MethodComponent extends React.Component<MethodComponentProps, NoState> {
    removeIdent() {
        let newEmptyIdent = new lang.EmptyIdent()
        this.props.app.replaceElement(this.props.method, "name", newEmptyIdent)
    }
    editIdent(replacement) {
        this.props.app.replaceElement(this.props.method, "name", replacement)
    }
    deleteArg(index) {
        return () => {
            this.props.app.deleteFromArray(this.props.method, "args", index)
        }
    }
    editArg(index) {
        return (replacement) => {
            this.props.app.replaceElementInArray(this.props.method, "args", index, replacement)
        }
    }
    insertArg(index) {
        return () => {
            console.log('insert at index', index)
            let newArg = new lang.EmptyIdent()
            this.props.app.insertIntoArray(this.props.method, "args", index, newArg)
        }
    }
    render() {
        const argElements = []
        this.props.method.args.forEach((ident, index) => {
            argElements.push(<ButtonComponent key={index * 3} name='add' text='+' onClick={this.insertArg(index).bind(this)}/>)
            argElements.push(
                <IdentWrapperComponent key={index * 3 + 1}
                {...this.props} ident={ident}
                onIdentDelete={this.deleteArg(index).bind(this)}
                onIdentEdit={this.editArg(index).bind(this)}
                />
                )
            if (index != this.props.method.args.length - 1) {
                argElements.push(<SyntaxComponent key={index * 3 + 2} syntax=',' />)
            }
        })
        argElements.push(<ButtonComponent key={argElements.length} name='add' text='+' onClick={this.insertArg(this.props.method.args.length).bind(this)}/>)
        return <div>
            <div className='ast-row'>
                <KeywordComponent keyword='method'/>
                <IdentWrapperComponent
                {...this.props} ident={this.props.method.name}
                onIdentDelete={this.removeIdent.bind(this)}
                onIdentEdit={this.editIdent.bind(this)}
                />
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