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

export class Lexer {
  input: string;
  n: number;

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

  lex(): [Token] {
    let tokens: [Token] = <[Token]>[];
    let c = this.getChar();
    let buf = '';
    while (this.charsRemaining()) {
      if (isCharLetter(c)) {
        while (isCharLetter(c) || isCharNumber(c)) {
          buf += c;
          c = this.getChar();
        }
        tokens.push(new IdentToken(buf));
        buf = '';
      } else if (isCharNumber(c)) {
        while (isCharNumber(c)) {
          buf += c;
          c = this.getChar();
        }
        tokens.push(new NumToken(Number(buf)))
        buf = '';
      } else if (isCharOperator(c)) {
        buf += c;
        tokens.push(new OperatorToken(OperatorUtils.fromChar(buf)));
        c = this.getChar();
        buf = '';
      } else {
        throw new Error(`invalid character "${c}"`);
      }
    }
    return tokens;
  }
}

function isCharNumber(c) {
  return (c >= '0' && c <= '9')
}

function isCharLetter(c) {
  return !!c.match(/^[a-zA-Z]$/);
}

function isCharOperator(c) {
  return !!c.match(/^(\+|\-|\/|\*)$/);
}
