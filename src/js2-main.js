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

  next: function(chompSpace, n) {
    n = n || 1;

    var ret;
    while (n-- > 0) {
      ret = this.tokens[this.idx++];
      if (chompSpace) {
        var peek = this.peek(); 
        while (peek = this.peek() && peek[1] == IDS.SPACE && this.idx++) { }
      }
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
      case '{': this.started = true; return KlassBlock;
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

var KlassBlock = Block.extend({
  name: 'KlassBlock',
  handOff: function(token) {
    switch (token[0]) {
      case 'var': return Member;
      case 'function': return Method;
    }
  },

  handleToken: function(token) {
    if (this.tokens.isBalancedCurly(this) && token[0] == '}') {
      this.closed = true;
    }
  },

  toString: function() {
    var str = this.super();
    return str.replace(/,(\s+\})$/, "$1");
  } 
});

var Method = Content.extend({
  name: 'Method',
  handOff: function(token) {
    if (this.started) this.closed = true;
    if (token[0] == '(') {
      return Braces;
    } else if (token[0] == '{') {
      this.started = true;
      return Block;
    }
  },

  toString: function () {
    var it = this.it;
    var name = it.next(CHOMP_SPACE, 2)[0];
    return name + ':' + "function" + this.handOffs[0].toString() + this.handOffs[1].toString() + ',';
  }
});

var Member = Content.extend({
  name: 'Member',
  handleToken: function(token) {
    if (token[0] == ';') this.closed = true;
  },

  toString: function () {
    var it = this.it;
    var name = it.next(CHOMP_SPACE, 2)[0];
    var token;
    var tokens = []
    it.next(CHOMP_SPACE);
    while (token = it.next()) {
      tokens.push(token[0]);
    }
    return '"' + name + '":' + tokens.join('') + ',';
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
  cache: { count: 1 },
  name: 'Foreach',
  handOff: function(token) {
    if (this.started) this.closed = true;
    switch (token[0]) {
      case '(': return Braces;
      case '{': this.started = true; return Block;
    }
  },

  toString: function() {
    var brace = this.getBrace(this.handOffs[0]);
    return "for" + brace + this.handOffs[1].toString();
  },

  getBrace: function(brace) {
    var n = this.cache.count++;
    var iteratorName   = "_i" + n;
    var collectionName = "_c" + n;
    var l = "_l" + n;

    var holder = brace.it.next(CHOMP_SPACE, 3)[0];
    brace.it.next(CHOMP_SPACE, 1);

    var temp = [];
    for (var ele; ele=brace.it.next(); temp.push(ele[0])) {};
    temp.pop();
    var collection = temp.join('');

    return "(var " + iteratorName + "=0," +
            collectionName + "=" + collection + "," +
            l + "=" + collectionName + ".length," +
            holder + ";" +
            holder + '=' + collectionName + '[' + iteratorName + ']||' +
            iteratorName + '<' + l + ';' +
            iteratorName + '++)';
  }
});


console.log(Parser.parse("class Foobar { function hello() { } var foo='bar' } foreach(var ele in foo){} foo %{foobar#{bar} #{foo}} \"").toString());
