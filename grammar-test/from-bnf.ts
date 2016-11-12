import * as fs from "fs"
import * as prettybnf from "prettybnf";

let grammarString = fs.readFileSync('grammar-cut.txt', 'utf8');
let ast = prettybnf.parse(grammarString);
console.log(ast);

let classes = [];

ast.productions.forEach(production => {
  let lhs = production.lhs;
  let rhs = production.rhs;
  
  let lhsName = lhs.text;

  let funcBody = `
  var tokenPosition = p.getTokenPosition()
`

  rhs.forEach(possibility => {
    console.log('possibility', possibility);

    funcBody += '//BEGIN POSSIBILITY'

    let terms = possibility.terms;
    terms.forEach(term => {
      let name = term.text;
      if (term.type == 'nonterminal') {
      funcBody += `
  try {
    return ${name}.parse(p);
  } catch (e) {
    console.error('${name} parse attempt failed')
  }
  p.setTokenPosition(tokenPosition);
`
      } else if (term.type == 'terminal') {
        let tokenName = name + "Token";
        funcBody += `
  if (p.getToken() instanceof ${tokenName}) {
    p.advanceToken()
  } else {
    throw new ParseError('Expected ${tokenName} when parsing ${lhsName}')
  }
`
      }
    })

    funcBody += "//END POSSIBILITY"
    funcBody += '\n'
  })

  let newClass = {
    name: lhs.text,
    parseFunc: new Function('p', funcBody)
  }

  classes.push(newClass);
})

classes.forEach(c => {
  console.log(c.name, c.parseFunc);
})
