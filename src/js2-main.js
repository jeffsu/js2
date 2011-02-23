require('./js2-class');
require('./js2-lexer');

var IDS = JS2.Lexer.IDS;

var Parser = {
  parse: function (str) {
    var lexer   = new JS2.Lexer();
    var tokens  = lexer.tokenize(str);
    var root    = new Content(tokens);
    return root;
  } 
};

var Content = JS2.Class.extend({
  initialize: function(tokens) {
    this.curlyCount = tokens.curlyCount;
    this.braceCount = tokens.braceCount;
    this.content = [];
    this.tokens = tokens;

    this.processTokens(tokens);
  }, 

  processTokens: function() {
    while (!this.tokens.empty()) {
      var token = this.tokens.peak();
      var klass = this.handOff(token);
      if (klass) {
        this.newNode(klass, this.tokens);
      } else {
        this.content.push(token[0]);
        this.handleToken(this.tokens.shift());
        if (this.closed) return;
      }
    }    
  },

  handleToken: function(token) {
  },

  newNode: function(klass, tokens) {
    return new klass(tokens); 
  },

  handOff: function(token) {
    switch (token[1]) {
      case IDS.CLASS: return Klass;
      case IDS.FOREACH: return Foreach;
    }
  },

  toString: function() {
    return this.content.join('');
  }
});

var Klass = Content.extend({
  handOff: function(token) {
    switch (token[0]) {
      case '{': return Block;
    }
  } 
});

var Block = Content.extend({
  handleToken: function(token) {
    if (this.tokens.isBalancedCurly(this) && token[0] == '}') {
      this.closed = true;
    }
  } 
});

console.log(Parser.parse("hello world /foobar/ class Foo { }").toString());
