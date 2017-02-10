import React from "react";
import ReactDOM from "react-dom";

import * as fun from "./fun";

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

class ExpressionWrapperComponent extends ASTWrapperComponent<ASTWrapperComponentProps<fun.Expression>, fun.Expression> {
    isEmptyAST() {
        return this.props.node instanceof fun.EmptyExpression
    }

    getASTType() {
        return fun.Expression
    }

    deleteAST() {
        this.props.onNodeDelete()
    }

    editAST(replacement: fun.Expression) {
        this.props.onNodeEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return this.props.app.parseExpression(input).concat(fun.getMatchingExpressionTypes(input))
    }
}

class IdentWrapperComponent extends ASTWrapperComponent<ASTWrapperComponentProps<fun.Ident>, fun.Ident> {
    isEmptyAST() {
        return this.props.node instanceof fun.EmptyIdent;
    }

    getASTType() {
        return fun.Ident
    }

    deleteAST() {
        this.props.onNodeDelete()
    }

    editAST(replacement: fun.Ident) {
        this.props.onNodeEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return fun.getMatchingIdentTypes(input)
    }
}

class FunctionWrapperComponent extends ASTWrapperComponent<ASTWrapperComponentProps<fun.Function>, fun.Function> {
    isEmptyAST() {
        return false
    }

    getASTType() {
        return fun.Function
    }

    deleteAST() {
        this.props.onNodeDelete()
    }

    editAST(replacement: fun.Function) {
        this.props.onNodeEdit(replacement)
    }

    getMatchingASTTypes(input: string) {
        return fun.getMatchingFunctionTypes(input)
    }
}

export interface IntegerComponentProps extends ASTComponentProps {
    integer: fun.Integer
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
    value: fun.ValueExpression
}
export class ValueExpressionComponent extends ASTNodeComponent<ValueExpressionComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.value;
    }

    onIdentDelete() {
        let newEmptyIdent = new fun.EmptyIdent()
        this.props.app.replaceElement(this.props.value, "ident", newEmptyIdent)
    }

    onIdentEdit(replacement: fun.Ident) {
        this.props.app.replaceElement(this.props.value, "ident", replacement)
    }
    
    getInnerElement() {
        return <div className='ast-row'>
            <IdentWrapperComponent {...this.props} node={this.props.value.ident} onNodeEdit={this.onIdentEdit.bind(this)} onNodeDelete={this.onIdentDelete.bind(this)}/>
        </div>
    }
}

export interface BinaryExpressionComponentProps extends ASTComponentProps {
    binaryExpression: fun.BinaryExpression
}
export class BinaryExpressionComponent extends ASTNodeComponent<BinaryExpressionComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.binaryExpression
    }
    
    private removeExpression(expressionName) {
        return () => {
            let newEmptyExpression = new fun.EmptyExpression()
            this.props.app.replaceElement(this.props.binaryExpression, expressionName, newEmptyExpression)
        }
    }

    private editExpression(expressionName) {
        return (replacement: fun.Expression) => {
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
            <SelectionComponent value={this.props.binaryExpression.op} values={fun.BinaryExpression.OP_LIST} onChange={this.changeOp.bind(this)} />
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
    emptyExpression: fun.EmptyExpression
}

export class EmptyExpressionComponent extends ASTNodeComponent<EmptyExpressionProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.emptyExpression
    }
    
    getInnerElement() {
        return <div className='ast-row'>EMPTY_EXPRESSION</div>
    }
}

export interface ProgramComponentProps extends ASTComponentProps {
    program: fun.Program
}

export class ProgramComponent extends ASTNodeComponent<ProgramComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.program
    }
    
    getInnerElement() {
        return <VerticalListComponent {...this.props}
        node={this.props.program}
        arrayName='methods'
        type={fun.Function}
        wrapperType={FunctionWrapperComponent}
        />
    }
}

export interface IdentComponentProps extends ASTComponentProps {
    ident: fun.ConcreteIdent
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
    emptyIdent: fun.EmptyIdent
}

export class EmptyIdentComponent extends ASTNodeComponent<EmptyIdentComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.emptyIdent
    }
    
    getInnerElement() {
        return <div className='ast-row'>EMPTY_IDENT</div>
    }
}

export interface FunctionComponentProps extends ASTComponentProps {
    function: fun.Function
}

export class FunctionComponent extends ASTNodeComponent<FunctionComponentProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.function
    }
    
    removeIdent() {
        let newEmptyIdent = new fun.EmptyIdent()
        this.props.app.replaceElement(this.props.function, "name", newEmptyIdent)
    }
    editIdent(replacement) {
        this.props.app.replaceElement(this.props.function, "name", replacement)
    }
    deleteArg(index) {
        return () => {
            this.props.app.deleteFromArray(this.props.function, "args", index)
        }
    }
    editArg(index) {
        return (replacement) => {
            this.props.app.replaceElementInArray(this.props.function, "args", index, replacement)
        }
    }
    insertArg(index) {
        return () => {
            console.log('insert at index', index)
            let newArg = new fun.EmptyIdent()
            this.props.app.insertIntoArray(this.props.function, "args", index, newArg)
        }
    }
    getInnerElement() {
        const argElements = []
        this.props.function.args.forEach((ident, index) => {
            argElements.push(<ButtonComponent key={index * 3} name='add' text='+' onClick={this.insertArg(index).bind(this)}/>)
            argElements.push(
                <IdentWrapperComponent key={index * 3 + 1} {...this.props}
                node={ident}
                onNodeDelete={this.deleteArg(index).bind(this)}
                onNodeEdit={this.editArg(index).bind(this)}
                />
                )
            if (index != this.props.function.args.length - 1) {
                argElements.push(<SyntaxComponent key={index * 3 + 2} syntax=',' />)
            }
        })
        argElements.push(<ButtonComponent key={argElements.length} name='add' text='+' onClick={this.insertArg(this.props.function.args.length).bind(this)}/>)
        return <div>
            <div className='ast-row'>
                <KeywordComponent keyword='function'/>
                <IdentWrapperComponent {...this.props}
                node={this.props.function.name}
                onNodeDelete={this.removeIdent.bind(this)}
                onNodeEdit={this.editIdent.bind(this)}
                />
                <SyntaxComponent syntax='(' />
                {argElements}
                <SyntaxComponent syntax=')' />
                <SyntaxComponent syntax=':=' />
            </div>
            <div className='ast-row'>
                {this.props.function.expression.render(this.props)}
            </div>
        </div>
    }
}

export interface FunctionCallExpressionProps extends ASTComponentProps {
    functionCallExpression: fun.FunctionCallExpression
}

export class FunctionCallExpressionComponent extends ASTNodeComponent<FunctionCallExpressionProps, ASTNodeComponentState> {
    getASTNode() {
        return this.props.functionCallExpression
    }

    removeIdent() {
        let newEmptyIdent = new fun.EmptyIdent()
        this.props.app.replaceElement(this.props.functionCallExpression, "ident", newEmptyIdent)
    }
    editIdent(replacement) {
        this.props.app.replaceElement(this.props.functionCallExpression, "ident", replacement)
    }
    deleteArg(index) {
        return () => {
            this.props.app.deleteFromArray(this.props.functionCallExpression, "args", index)
        }
    }
    editArg(index) {
        return (replacement) => {
            this.props.app.replaceElementInArray(this.props.functionCallExpression, "args", index, replacement)
        }
    }
    insertArg(index) {
        return () => {
            let newArg = new fun.EmptyIdent()
            this.props.app.insertIntoArray(this.props.functionCallExpression, "args", index, newArg)
        }
    }

    getInnerElement() {
        const argElements = []
        this.props.functionCallExpression.args.forEach((expression, index) => {
            argElements.push(<ButtonComponent key={index * 3} name='add' text='+' onClick={this.insertArg(index).bind(this)}/>)
            argElements.push(
                <ExpressionWrapperComponent key={index * 3 + 1} {...this.props}
                node={expression}
                onNodeDelete={this.deleteArg(index).bind(this)}
                onNodeEdit={this.editArg(index).bind(this)}
                />
                )
            if (index != this.props.functionCallExpression.args.length - 1) {
                argElements.push(<SyntaxComponent key={index * 3 + 2} syntax=',' />)
            }
        })
        argElements.push(
            <ButtonComponent key={argElements.length} name='add' text='+'
            onClick={this.insertArg(this.props.functionCallExpression.args.length).bind(this)}
            />
        )
        return <div className='ast-row'>
            <IdentWrapperComponent {...this.props}
            node={this.props.functionCallExpression.ident}
            onNodeDelete={this.removeIdent.bind(this)}
            onNodeEdit={this.editIdent.bind(this)}
            />
            <SyntaxComponent syntax='(' />
            {argElements}
            <SyntaxComponent syntax=')' />
        </div>
    }
}