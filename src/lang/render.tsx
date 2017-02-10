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
    ASTWrapperComponentProps,
    ButtonComponent,
    ButtonComponentProps,
    KeywordComponent,
    KeywordComponentProps,
    SyntaxComponent,
    SyntaxComponentProps,
    InputComponent,
    InputComponentProps,
    SelectionComponent,
    SelectionComponentProps,
    VerticalListComponent,
    VerticalListComponentProps
} from "../render/render-ast";

class ExpressionWrapperComponent extends ASTWrapperComponent<ASTWrapperComponentProps<lang.Expression>, lang.Expression> {
    isEmptyAST() {
        return this.props.node instanceof lang.EmptyExpression
    }

    getASTType() {
        return lang.Expression
    }

    deleteAST() {
        this.props.onNodeDelete()
    }

    editAST(replacement: lang.Expression) {
        this.props.onNodeEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return this.props.app.parseExpression(input).concat(lang.getMatchingExpressionTypes(input))
    }
}

class StatementWrapperComponent extends ASTWrapperComponent<ASTWrapperComponentProps<lang.Statement>, lang.Statement> {
    isEmptyAST() {
        return this.props.node instanceof lang.EmptyStatement
    }

    getASTType() {
        return lang.Statement
    }

    deleteAST() {
        this.props.onNodeDelete()
    }

    editAST(replacement: lang.Statement) {
        this.props.onNodeEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return this.props.app.parseStatement(input).concat(lang.getMatchingStatementTypes(input))
    }
}

class IdentWrapperComponent extends ASTWrapperComponent<ASTWrapperComponentProps<lang.Ident>, lang.Ident> {
    isEmptyAST() {
        return this.props.node instanceof lang.EmptyIdent;
    }

    getASTType() {
        return lang.Ident
    }

    deleteAST() {
        this.props.onNodeDelete()
    }

    editAST(replacement: lang.Ident) {
        this.props.onNodeEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return lang.getMatchingIdentTypes(input)
    }
}

class MethodWrapperComponent extends ASTWrapperComponent<ASTWrapperComponentProps<lang.Method>, lang.Method> {
    isEmptyAST() {
        return false
    }

    getASTType() {
        return lang.Method
    }

    deleteAST() {
        this.props.onNodeDelete()
    }

    editAST(replacement: lang.Method) {
        this.props.onNodeEdit(replacement)
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

    handleChange(event) {
        this.props.app.replaceElement(this.props.integer, "value", event.target.value)
    }
    
    getInnerElement() {
        return <div className='ast-row'>
            <InputComponent type='number' value={this.props.integer.value} onChange={this.handleChange.bind(this)}/>
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

    onIdentDelete() {
        let newEmptyIdent = new lang.EmptyIdent()
        this.props.app.replaceElement(this.props.value, "ident", newEmptyIdent)
    }

    onIdentEdit(replacement: lang.Ident) {
        this.props.app.replaceElement(this.props.value, "ident", replacement)
    }
    
    getInnerElement() {
        return <div className='ast-row'>
            <IdentWrapperComponent {...this.props} node={this.props.value.ident} onNodeEdit={this.onIdentEdit.bind(this)} onNodeDelete={this.onIdentDelete.bind(this)}/>
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

    changeOp(event) {
        this.props.app.replaceElement(this.props.binaryExpression, "op", event.target.value)
    }

    getInnerElement() {
        return <div className='ast-row'>
            <SyntaxComponent syntax='('/>
            <ExpressionWrapperComponent {...this.props}
            node={this.props.binaryExpression.left}
            onNodeDelete={this.removeExpression("left").bind(this)}
            onNodeEdit={this.editExpression("left").bind(this)}
            />
            <SelectionComponent value={this.props.binaryExpression.op} values={lang.BinaryExpression.OP_LIST} onChange={this.changeOp.bind(this)} />
            <ExpressionWrapperComponent {...this.props}
            node={this.props.binaryExpression.right}
            onNodeDelete={this.removeExpression("right").bind(this)}
            onNodeEdit={this.editExpression("right").bind(this)}
            />
            <SyntaxComponent syntax=')'/>
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
            node={this.props.assignmentStatement.ident}
            onNodeDelete={this.removeIdent.bind(this)}
            onNodeEdit={this.editIdent.bind(this)}
            />
            <SyntaxComponent syntax=':=' />
            <ExpressionWrapperComponent {...this.props}
            node={this.props.assignmentStatement.expression}
            onNodeDelete={this.removeExpression.bind(this)}
            onNodeEdit={this.editExpression.bind(this)}
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
                node={this.props.whileStatement.condition}
                onNodeDelete={this.removeCondition.bind(this)}
                onNodeEdit={this.editCondition.bind(this)}
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
    
    getInnerElement() {
        return <VerticalListComponent {...this.props}
        node={this.props.program}
        arrayName='methods'
        type={lang.Method}
        wrapperType={MethodWrapperComponent}
        />
    }
}

export interface StatementsComponentProps extends ASTComponentProps {
    statements: lang.Statements
}

export class StatementsComponent extends ASTNodeComponent<StatementsComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.statements
    }

    getInnerElement() {
        return <VerticalListComponent {...this.props}
        node={this.props.statements}
        arrayName='statements'
        type={lang.Statement}
        wrapperType={StatementWrapperComponent}
        />
    }
}

export interface IdentComponentProps extends ASTComponentProps {
    ident: lang.ConcreteIdent
}

export class IdentComponent extends ASTNodeComponent<IdentComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.ident
    }

    handleChange(event) {
        this.props.app.replaceElement(this.props.ident, "name", event.target.value)
    }
    
    getInnerElement() {
        return <div className='ast-row'>
            <InputComponent type='text' value={this.props.ident.name} onChange={this.handleChange.bind(this)} />
        </div>
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
                <IdentWrapperComponent key={index * 3 + 1} {...this.props}
                node={ident}
                onNodeDelete={this.deleteArg(index).bind(this)}
                onNodeEdit={this.editArg(index).bind(this)}
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
                <IdentWrapperComponent {...this.props}
                node={this.props.method.name}
                onNodeDelete={this.removeIdent.bind(this)}
                onNodeEdit={this.editIdent.bind(this)}
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
                <ExpressionWrapperComponent key={index * 3 + 1} {...this.props}
                node={expression}
                onNodeDelete={this.deleteArg(index).bind(this)}
                onNodeEdit={this.editArg(index).bind(this)}
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
            node={this.props.methodCallStatement.ident}
            onNodeDelete={this.removeIdent.bind(this)}
            onNodeEdit={this.editIdent.bind(this)}
            />
            <SyntaxComponent syntax='(' />
            {argElements}
            <SyntaxComponent syntax=')' />
        </div>
    }
}

export interface ReturnStatementProps extends ASTComponentProps {
    returnStatement: lang.ReturnStatement
}

export class ReturnStatementComponent extends ASTNodeComponent<ReturnStatementProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.returnStatement
    }

    deleteExpression() {
        let newEmptyExpression = new lang.EmptyIdent()
        this.props.app.replaceElement(this.props.returnStatement, "expression", newEmptyExpression)
    }
    editExpression(replacement) {
        this.props.app.replaceElement(this.props.returnStatement, "expression", replacement)
    }

    getInnerElement() {
        return <div className='ast-row'>
            <KeywordComponent keyword='return' />
            <ExpressionWrapperComponent {...this.props}
            node={this.props.returnStatement.expression}
            onNodeDelete={this.deleteExpression.bind(this)}
            onNodeEdit={this.editExpression.bind(this)}
            required={false}
            />
        </div>
    }
}