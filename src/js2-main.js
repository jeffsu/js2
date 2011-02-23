require('./js2-class');
require('./js2-lexer');

var IDS = JS2.Lexer.IDS;
IDS['NODE'] = -1;

var CHOMP_SPACE = true;
var REQUIRED    = true;

var ContentIterator = JS2.Class.extend({
  initialize: function(content) {
    this.idx = 0;
    this.tokens = content;
  },

  isa: function(type) {
    return this.peek()[1] == type ? true : this.peek()[0] == type; 
  },

  peek: function() {
    return this.tokens[this.idx] || [];
  },

  next: function(chompSpace) {
    var ret = this.tokens[this.idx++];

    if (chompSpace) {
      var peek = this.peek(); 
      while (peek = this.peek() && peek[1] == IDS.SPACE && this.idx++) { }
    }

    return ret;
  },

  nextSpace: function(req) {
    var isSpace = this.peek()[1] == IDS.SPACE;
    if (req) console.log('Space required, but does not exist.');
    return isSpace ? this.next() : '';
  }
});

var Parser = {
  parse: function (str) {
    var lexer   = new JS2.Lexer();
    var tokens  = lexer.tokenize(str);
    var root    = new Content(tokens);
    return root;
  } 
};

var Content = JS2.Class.extend({
  name: 'Content',
  initialize: function(tokens) {
    this.curlyCount = tokens.curlyCount;
    this.braceCount = tokens.braceCount;
    this.content = [];
    this.it = new ContentIterator(this.content);
    this.tokens = tokens;
    this.handOffs = [];

    this.processTokens(tokens);
  }, 

  processTokens: function() {
    while (!this.tokens.empty() && !this.closed) {
      var token = this.tokens.peek();
      var klass = this.handOff(token);
      if (this.closed) break;

      if (klass) {
        this.handOffs.push(this.newNode(klass, this.tokens));
      } else {
        this.content.push(token);
        this.handleToken(this.tokens.shift());
        if (this.closed) return;
      }
    }    
  },

  handleToken: function(token) {
  },

  newNode: function(klass, tokens) {
    var node = new klass(tokens); 
    this.content.push([ node, IDS.NODE ]);
    return node;
  },

  handOff: function(token) {
    switch (token[1]) {
      case IDS.CLASS: return Klass;
      case IDS.FOREACH: return Foreach;
    }
  },

  toString: function() {
    var ret = [];
    var token = null;
    while (token = this.it.next()) {
      ret.push(token[0].toString()); 
    }
    return ret.join('');
  }
});

var Klass = Content.extend({
  name: 'Klass',
  handOff: function(token) {
    if (this.started) this.closed = true;

    switch (token[0]) {
      case '{': this.started = true; return Block;
    }
  }, 

  toString: function() {
    var klass = this.it.next(CHOMP_SPACE);
    var name  = this.it.next();
    var space = this.it.nextSpace();
    var block = this.it.next();

    return "var " + name[0] + "=(function() { return JS2.Class.extend(" + block[0].toString() + ")();";
  }
});

var Block = Content.extend({
  name: 'Block',
  handleToken: function(token) {
    if (this.tokens.isBalancedCurly(this) && token[0] == '}') {
      this.closed = true;
    }
  } 
});

var Braces = Content.extend({
  name: 'Braces',
  handleToken: function(token) {
    if (this.tokens.isBalancedBrace(this) && token[0] == ')') {
      this.closed = true;
    }
  } 
});


var Foreach = Content.extend({
  name: 'Foreach',
  handOff: function(token) {
    if (this.started) this.closed = true;
    switch (token[0]) {
      case '(': return Braces;
      case '{': this.started = true; return Block;
    }
  },

  toString: function() {
    return "for" + this.handOffs[0].toString() + this.handOffs[1].toString();
  }
});


console.log(Parser.parse("foreach(){} foo").toString());
