"use strict";
var fs = require("fs");
var prettybnf = require("prettybnf");
var grammarString = fs.readFileSync('grammar-cut.txt', 'utf8');
var ast = prettybnf.parse(grammarString);
console.log(ast);
var classes = [];
ast.productions.forEach(function (production) {
    var lhs = production.lhs;
    var rhs = production.rhs;
    var lhsName = lhs.text;
    var funcBody = "\n  var tokenPosition = p.getTokenPosition()\n  ";
    rhs.forEach(function (possibility) {
        console.log('possibility', possibility);
        funcBody += '//BEGIN POSSIBILITY';
        var terms = possibility.terms;
        terms.forEach(function (term) {
            var name = term.text;
            if (term.type == 'nonterminal') {
                funcBody += "\n  try {\n    return " + name + ".parse(p);\n  } catch (e) {\n    console.error('" + name + " parse attempt failed')\n  }\n  p.setTokenPosition(tokenPosition);\n";
            }
            else if (term.type == 'terminal') {
                var tokenName = name + "Token";
                funcBody += "\n  if (p.getToken() instanceof " + tokenName + ") {\n    p.advanceToken()\n  } else {\n    throw new ParseError('Expected " + tokenName + " when parsing " + lhsName + "')\n  }\n";
            }
        });
        funcBody += "//END POSSIBILITY";
        funcBody += '\n';
    });
    var newClass = {
        name: lhs.text,
        parseFunc: new Function('p', funcBody)
    };
    classes.push(newClass);
});
classes.forEach(function (c) {
    console.log(c.name, c.parseFunc);
});
