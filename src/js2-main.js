require('./js2-class');
require('./js2-lexer');

var IDS = JS2.Lexer.IDS;
IDS['NODE'] = -1;
var KEYWORDS = { 'var': null, 'class': null, 'function': null, 'in': null };


var CHOMP_SPACE = true;
var REQUIRED    = true;

var Validator = JS2.Class.extend({
  initialize: function(content) {
    this.content = content;
  },

  validate: function(regex) {
    var str = this.getString();
    var m   = regex.exec(str);
    if (!m) return false;

    var ret = [ m ];
    var cIdx = 0;
    for (var i=1; i<=m.length; i++) {
      if (!m[i] || m[i].length == 0) {
        ret.push('');
      } else {
        ret.push(this.content[cIdx++][0]);
      }
    }

    var last = [];
    while (cIdx<this.content.length) {
      last.push(this.content[cIdx++][0].toString()); 
    }

    ret.last = last.join('');
    return ret;
  },

  getString: function() {
    var ret = [];

    for (var i=0; i<this.content.length; i++) {
      ret.push(this.getTokenString(this.content[i]));
    }

    return ret.join('');
  },

  getTokenString: function(token) {
    if (token[0] in KEYWORDS) {
      return token[0];
    } else if (token[1] == IDS.SPACE) {
      return token[0];
    } else if (token[1] == IDS.IDENT) {
      return 'I';
    } else {
      return token[0];
    }  
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
    this.tokens = tokens;
    this.handOffs = [];

    this.processTokens(tokens);
  }, 

  processTokens: function() {
    while (!this.tokens.empty() && !this.closed) {
      var token = this.tokens.peek();
      var klass = this.handOff(token);

      if (klass) {
        this.handOffs.push(this.newNode(klass, this.tokens));
      } else {
        this.content.push(token);
        this.handleToken(this.tokens.shift());
      }

      if (this.closed) break;
    }    
  },

  handleToken: function(token) {
  },

  newNode: function(klass, tokens) {
    var node = new klass(tokens); 
    this.content.push([ node, IDS.NODE ]);
    return node;
  },

  validate: function(regex) {
    return (new Validator(this.content)).validate(regex);
  },

  handOff: function(token) {
    switch (token[1]) {
      case IDS.CLASS: return Klass;
      case IDS.FOREACH: return Foreach;
      case IDS.SHORT_FUNCT: return ShortFunct;
    }
  },

  toString: function() {
    var ret = [];
    for (var i=0; i<this.content.length; i++) {
      ret.push(this.content[i][0].toString()); 
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
    var v  = this.validate(/(class)(\s+)(I)(\s*)/);
    return "var " + v[3] + "=(function() { return JS2.Class.extend(" + v.last + ")();";
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
    var v  = this.validate(/(function)(\s+)(I)(\s*)/);
    return v[1] + ':' + "function" + v.last + ',';
  }
});

var Member = Content.extend({
  name: 'Member',
  handleToken: function(token) {
    if (token[0] == ';') this.closed = true;
  },

  toString: function () {
    var v = this.validate(/(var)(\s+)(I)(\s*)=(\s*)/);
    return '"' + v[2] + '":' + v.last + ',';
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

    var v = brace.validate(/(\()(\s*)(var)(\s+)(I)(\s+)(in)(\s+)/);
    if (!v) return '';

    var holder = v[5];
    var collection = v.last.replace(/\)$/, '');

    return "(var " + iteratorName + "=0," +
            collectionName + "=" + collection + "," +
            l + "=" + collectionName + ".length," +
            holder + ";" +
            holder + '=' + collectionName + '[' + iteratorName + ']||' +
            iteratorName + '<' + l + ';' +
            iteratorName + '++)';
  }
});

var ShortFunct = Content.extend({
  name: "ShortFunct",
  handOff: function(token) {
    switch (token[0]) {
      case '(': this.hasBrace = true; return Braces;
      case '{': this.started = true; return Block;
    }
  },

  toString: function() {
    var ret = ['function']; 
    var i = 0;
    if (this.hasBrace) {
      ret.push(this.handOffs[i++].toString());
    } else {
      ret.push("($1,$2,$3)");
    }

    ret.push(this.handOffs[i].toString());
    return '';
    return ret.join('');
  }
});

console.log(Parser.parse("class Foobar { function foo () { } var bar = 'hello'; } foreach(var ele in foo){} foo %{foobar#{bar} #{foo}} yo").toString());
console.log(Parser.parse("class Foobar { }").toString());
