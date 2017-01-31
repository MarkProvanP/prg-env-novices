import React from "react";
import ReactDOM from "react-dom";

import * as lang from "./lang";

import {
    NoState,
    ASTComponentProps,
    ASTNodeComponent,
    ASTNodeComponentState,
    ASTWrapperComponent,
    ASTWrapperComponentState,
    ButtonComponent,
    ButtonComponentProps,
    KeywordComponent,
    KeywordComponentProps,
    SyntaxComponent,
    SyntaxComponentProps
} from "../render/render-ast";


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

interface MethodWrapperComponentProps extends ASTComponentProps {
    method: lang.Method,
    onMethodDelete: () => void,
    onMethodEdit: (replacement: lang.Method) => void
}

class MethodWrapperComponent extends ASTWrapperComponent<MethodWrapperComponentProps, lang.Method> {
    isEmptyAST() {
        return false
    }

    getASTNode() {
        return this.props.method
    }

    getASTType() {
        return lang.Method
    }

    deleteAST() {
        this.props.onMethodDelete()
    }

    editAST(replacement: lang.Method) {
        this.props.onMethodEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return lang.getMatchingMethodTypes(input)
    }
}

export interface IntegerComponentProps extends ASTComponentProps {
    integer: lang.Integer
}

export class IntegerComponent extends ASTNodeComponent<IntegerComponentProps, ASTNodeComponentState> {
    constructor(props) {
        super(props)
        this.state = {
            hovering: true
        }
    }
    getASTNode() {
        return this.props.integer;
    }
    
    getInnerElement() {
        return <div className='ast-row'>
            {this.props.integer.value}
        </div>
    }
}

export interface ValueExpressionComponentProps extends ASTComponentProps {
    value: lang.ValueExpression
}
export class ValueExpressionComponent extends ASTNodeComponent<ValueExpressionComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.value;
    }
    
    getInnerElement() {
        return <div className='ast-row'>
            {this.props.value.ident.render(this.props)}
        </div>
    }
}

export interface BinaryExpressionComponentProps extends ASTComponentProps {
    binaryExpression: lang.BinaryExpression
}
export class BinaryExpressionComponent extends ASTNodeComponent<BinaryExpressionComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.binaryExpression
    }
    
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

    getInnerElement() {
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

export interface EmptyExpressionProps extends ASTComponentProps {
    emptyExpression: lang.EmptyExpression
}

export class EmptyExpressionComponent extends ASTNodeComponent<EmptyExpressionProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.emptyExpression
    }
    
    getInnerElement() {
        return <div className='ast-row'>EMPTY_EXPRESSION</div>
    }
}

export interface AssignmentStatementComponentProps extends ASTComponentProps {
    assignmentStatement: lang.AssignmentStatement
}
export class AssignmentStatementComponent extends ASTNodeComponent<AssignmentStatementComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.assignmentStatement
    }
    
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
    getInnerElement() {
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

export interface WhileStatementComponentProps extends ASTComponentProps {
    whileStatement: lang.WhileStatement
}
export class WhileStatementComponent extends ASTNodeComponent<WhileStatementComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.whileStatement
    }
    
    removeCondition() {
        let newEmptyExpression = new lang.EmptyExpression()
        this.props.app.replaceElement(this.props.whileStatement, "condition", newEmptyExpression)
    }
    editCondition(replacement) {
        this.props.app.replaceElement(this.props.whileStatement, "condition", replacement)
    }

    getInnerElement() {
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
                {this.props.whileStatement.statements.render(this.props)}
            </div>
            <div className='ast-row'>
                <SyntaxComponent syntax='}' />
            </div>
        </div>
    }
}

export interface ProgramComponentProps extends ASTComponentProps {
    program: lang.Program
}

export class ProgramComponent extends ASTNodeComponent<ProgramComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.program
    }
    
    editRow(index) {
        return replacement => {
            console.log('Edit at index', index)
            this.props.app.replaceElementInArray(this.getASTNode(), "methods", index, replacement)
        }
    }

    deleteRow(index) {
        return () => {
            console.log('Delete at index', index)
            this.props.app.deleteFromArray(this.getASTNode(), "methods", index)
        }
    }

    insertRow(index) {
        return e => {
            console.log('Insert at index', index, this);
            let newASTNode = new lang.Method();
            this.props.app.insertIntoArray(this.getASTNode(), "methods", index, newASTNode)
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

    getInnerElement() {
        const methods = this.props.program.methods;
        const methodsList = methods.map((method, index) => {
            return <div key={(index * 2) + 1} className='ast-list-row'>
                <div className='ast-list-row-index'>{index}</div>
                <div className='ast-list-row-content'>
                    <MethodWrapperComponent {...this.props} method={method} onMethodDelete={this.deleteRow(index)} onMethodEdit={this.editRow(index)}/>
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

export interface StatementsComponentProps extends ASTComponentProps {
    statements: lang.Statements
}

export class StatementsComponent extends ASTNodeComponent<StatementsComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.statements
    }
    
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

    getInnerElement() {
        const statements = this.props.statements.statements;
        const statementsList = statements.map((statement, index) => {
            return <div key={(index * 2) + 1} className='ast-list-row'>
                <div className='ast-list-row-index'>{index}</div>
                <div className='ast-list-row-content'>
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
        return <div className='ast-list'>
            {elementsList}
        </div>
    }
}

export interface IdentComponentProps extends ASTComponentProps {
    ident: lang.ConcreteIdent
}

export class IdentComponent extends ASTNodeComponent<IdentComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.ident
    }
    
    getInnerElement() {
        return <div className='ast-row'>{this.props.ident.name}</div>
    }
}

export interface EmptyIdentComponentProps extends ASTComponentProps {
    emptyIdent: lang.EmptyIdent
}

export class EmptyIdentComponent extends ASTNodeComponent<EmptyIdentComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.emptyIdent
    }
    
    getInnerElement() {
        return <div className='ast-row'>EMPTY_IDENT</div>
    }
}

export interface EmptyStatementProps extends ASTComponentProps {
    emptyStatement: lang.EmptyStatement
}

export class EmptyStatementComponent extends ASTNodeComponent<EmptyStatementProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.emptyStatement
    }
    
    getInnerElement() {
        return <div className='ast-row'>EMPTY_STATEMENT</div>
    }
}

export interface MethodComponentProps extends ASTComponentProps {
    method: lang.Method
}

export class MethodComponent extends ASTNodeComponent<MethodComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.method
    }
    
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
    getInnerElement() {
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
                {this.props.method.statements.render(this.props)}
            </div>
        </div>
    }
}

export interface MethodCallStatementProps extends ASTComponentProps {
    methodCallStatement: lang.MethodCallStatement
}

export class MethodCallStatementComponent extends ASTNodeComponent<MethodCallStatementProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.methodCallStatement
    }

    removeIdent() {
        let newEmptyIdent = new lang.EmptyIdent()
        this.props.app.replaceElement(this.props.methodCallStatement, "ident", newEmptyIdent)
    }
    editIdent(replacement) {
        this.props.app.replaceElement(this.props.methodCallStatement, "ident", replacement)
    }
    deleteArg(index) {
        return () => {
            this.props.app.deleteFromArray(this.props.methodCallStatement, "args", index)
        }
    }
    editArg(index) {
        return (replacement) => {
            this.props.app.replaceElementInArray(this.props.methodCallStatement, "args", index, replacement)
        }
    }
    insertArg(index) {
        return () => {
            let newArg = new lang.EmptyIdent()
            this.props.app.insertIntoArray(this.props.methodCallStatement, "args", index, newArg)
        }
    }

    getInnerElement() {
        const argElements = []
        this.props.methodCallStatement.args.forEach((expression, index) => {
            argElements.push(<ButtonComponent key={index * 3} name='add' text='+' onClick={this.insertArg(index).bind(this)}/>)
            argElements.push(
                <ExpressionWrapperComponent key={index * 3 + 1}
                {...this.props} expression={expression}
                onExpressionDelete={this.deleteArg(index).bind(this)}
                onExpressionEdit={this.editArg(index).bind(this)}
                />
                )
            if (index != this.props.methodCallStatement.args.length - 1) {
                argElements.push(<SyntaxComponent key={index * 3 + 2} syntax=',' />)
            }
        })
        argElements.push(
            <ButtonComponent key={argElements.length} name='add' text='+'
            onClick={this.insertArg(this.props.methodCallStatement.args.length).bind(this)}
            />
        )
        return <div className='ast-row'>
            <KeywordComponent keyword='call' />
            <IdentWrapperComponent {...this.props}
            ident={this.props.methodCallStatement.ident}
            onIdentDelete={this.removeIdent.bind(this)}
            onIdentEdit={this.editIdent.bind(this)}
            />
            <SyntaxComponent syntax='(' />
            {argElements}
            <SyntaxComponent syntax=')' />
        </div>
    }
}