import * as lang from "./new-lang";

function nodeClassName(node: lang.ASTNode) {
  return node.constructor.name;
}

export class ASTNodeDivMap {
  private divToASTNode : WeakMap<HTMLElement, lang.ASTNode>;
  private astNodeToDiv : WeakMap<lang.ASTNode, HTMLElement>;

  constructor() {
    this.divToASTNode = new WeakMap<HTMLElement, lang.ASTNode>();
    this.astNodeToDiv = new WeakMap<lang.ASTNode, HTMLElement>();
  }

  addNodeDiv(node: lang.ASTNode, div: HTMLElement) {
    this.divToASTNode.set(div, node);
    this.astNodeToDiv.set(node, div);
  }

  addDivNode(div: HTMLElement, node: lang.ASTNode) {
    this.addNodeDiv(node, div);
  }

  removeASTNode(node: lang.ASTNode) {
    let div = this.astNodeToDiv.get(node);
    this.astNodeToDiv.delete(node);
    this.divToASTNode.delete(div);
  }

  getDiv(node: lang.ASTNode) {
    return this.astNodeToDiv.get(node);
  }

  getASTNode(div: HTMLElement) {
    return this.divToASTNode.get(div); 
  }
}

export class Renderer {
  astNodeDivMap: ASTNodeDivMap

  renderNode(node: lang.ASTNode) {

  }

  createCommonNode(node: lang.ASTNode) {
    let rootElement = document.createElement("div");
    rootElement.classList.add('ast-node');
    rootElement.classList.add(nodeClassName(node))
    this.astNodeDivMap.addDivNode(rootElement, this);

    let titleElement = document.createElement("div");
    titleElement.textContent = nodeClassName(node);
    titleElement.classList.add('title');
    rootElement.appendChild(titleElement);

    let contentElement = document.createElement("div");
    contentElement.classList.add('content');
    rootElement.appendChild(contentElement);

    return rootElement;
  }

  setTextContent(text) {

  }
}
