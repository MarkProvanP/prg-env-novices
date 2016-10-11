export enum Operator {
  Add,
  Subtract,
  Multiply,
  Divide
}

export class OperatorUtils {
  static fromChar(c: string) {
    switch (c) {
      case "+": return Operator.Add;
      case "-": return Operator.Subtract;
      case "*": return Operator.Multiply;
      case "/": return Operator.Divide;
    }
  }

  static toChar(o : Operator) {
    switch (o) {
      case Operator.Add: return "+";
      case Operator.Subtract: return "-";
      case Operator.Multiply: return "*";
      case Operator.Divide: return "/";
    }
  }

  static toFunc(o: Operator): (l: any, r: any) => any {
    switch (o) {
      case Operator.Add: return (l, r) => l + r;
      case Operator.Subtract: return (l, r) => l - r;
      case Operator.Multiply: return (l, r) => l * r;
      case Operator.Divide: return (l, r) => l / r;
    }
  }
}

export abstract class Token {
  getPrecedence() : number {
    return 0;
  }
}

export class OperatorToken extends Token {
  operator: Operator;

  constructor(operator: Operator) {
    super();
    this.operator = operator;
  }

  getPrecedence() : number {
    switch (this.operator) {
      case Operator.Add:
      case Operator.Subtract:
        return 3;
      case Operator.Multiply:
      case Operator.Divide:
        return 4;
    }
  }

  toString() : string {
    return Operator[this.operator];
  }
}

export class NumToken extends Token {
  value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  toString(): string {
    return String(this.value);
  }
}

export class IdentToken extends Token {
  ident: string;

  constructor(ident: string) {
    super();
    this.ident = ident;
  }

  toString(): string {
    return this.ident;
  }
}

export class AssignToken extends Token {
  toString() { return '='; }
}

export class StringToken extends Token {
  value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }

  toString(): string {
    return '"' + this.value + '"';
  }
}

export class Lexer {
  input: string;
  n: number;
  remainingInput: string;

  constructor(input: string) {
    this.input = input;
    this.n = 0;
  }

  getChar() {
    return this.input[this.n++];
  }

  charsRemaining() {
    return this.n <= this.input.length;
  }

  getRemainingInput() {
    return this.remainingInput;
  }

  lex(): [Token] {
    let tokens: [Token] = <[Token]>[];
    let chars = this.input;
    let charsRemaining = () => chars.length > 0
    let regexToToken = [
      {
        regex: /^(\+|\-|\/|\*)/,
        do: (s) => new OperatorToken(OperatorUtils.fromChar(s))
      },
      {
        regex: /^(\=)/,
        do: (s) => new AssignToken()
      },
      {
        regex: /^([a-zA-Z]+)/,
        do: (s) => new IdentToken(s)
      },
      {
        regex: /^(\d)+/,
        do: (s) => new NumToken(Number(s))
      },
      {
        regex: /^\"\w*\"/,
        do: (s) => new StringToken(s)
      }
    ];
    let numberChecksSinceLastMatch = 0;
    let go = true;
    while (go && charsRemaining()) {
      regexToToken.forEach(check => {
        let regex = check.regex;
        let f = check.do;
        let match = chars.match(regex);
        if (match) {
          let found = match[0];
          let result = f(found);
          tokens.push(result);
          chars = chars.substring(found.length);
          numberChecksSinceLastMatch = 0;
        } else {
          numberChecksSinceLastMatch++;
        }
      });
      if (numberChecksSinceLastMatch >= regexToToken.length) {
        go = false;
      }
    }
    this.remainingInput = chars;
    return tokens;
  }
}
