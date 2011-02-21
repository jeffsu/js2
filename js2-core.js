var JS2 = require('./js2-class').JS2;

var GenericContent = JS2.Class.extend({
  klass: "GenericContent",
  sanityShift: 20,
  markerTokens: {
    'class' : 'Klass',
    'foreach' : 'Foreach'
  },

  initialize: function (tokenizer) {
    this.content = [];
    this.next    = null;

    if (tokenizer) {
      this.line = tokenizer.line;
      this.tokenizer  = tokenizer;
      this.curlyCount = tokenizer.curlyCount; 
      this.braceCount = tokenizer.braceCount; 
    }
  },

  tokenString: function() {
    var ret = [];
    for (var i=0; i<this.content.length; i++) {
      var val = this.content[i];
      if (typeof val == 'string') {
        if (val.match(/^\s/)) {
          ret.push('SPACE');
        } else {
          ret.push('IDENT');
        } 
      } else {
        ret.push(val.klass);
      }
    }
    return ret.join('');
  },

  extractTokens: function(regexStr) {
    var cleaned = regexStr.replace(/(\w+)/g, "($1)")
      .replace(/([^\s]+)/g, "($1)")
      .replace(/\b([A-Z]{2,})\b/g, function (m) { return (m.indexOf('SPACE') >= 0) ? "SPACE" : "IDENT"; })
      .replace(/\b([a-z]{2,})\b/g, 'IDENT')
      .replace(/\s+/g, '');

    var regex = new RegExp("^" + cleaned + "$");
    var tokenString = this.tokenString();
    var match = tokenString.match(regex);

    if (! match) return false;
    var ret = [];
    var j=0;
    for (var i=1; i<match.length; i+=2) {
      if (match[i]) {
        ret.push(this.content[j++]);
      } else {
        ret.push('');
      }
    }

    ret.push(j);
    return ret;
  },

  pop: function() {
    this.content.pop(); 
  },

  shift: function() {
    return this.content.shift();
  },

  collapse: function() {
    var newContent = [];
    for (var i=0; i<this.content.length; i++) {
      var token = this.content[i];
      if ((typeof token != 'string') || !token.match(/^\s/)) newContent.push(token);
    }

    this.content = newContent;
  },

  shiftOff: function(str) {
    var sanity = this.sanityShift;
    while (sanity-- > 0 && this.content.length) {
      if (str == this.content.shift()) return str;
    }
  },

  push: function(token) {
    if (this.next && this.next.closed) this.next = null;

    if (this.next) {
      this.next.push(token);
      if (this.next.closed) this.next = null;
    } 

    else if (token in this.markerTokens) {
      var klass = eval(this.markerTokens[token]);
      this.newContent(klass, token);
    } 
   
    else {
      this.addContent(token);    
    }
  },

  newContent: function (klass, token) {
    var next = this.next = new klass(this.tokenizer);
    this.content.push(this.next);
    this.next.push(token);
    if (this.next.closed) this.next = null;
    return next;
  },

  addContent: function(token) {
    this.content.push(token);
  },

  toString: function() {
    var ret = [];
    for (var i=0; i<this.content.length; i++) {
      ret.push(this.content[i].toString());
    }
    return ret.join('');
  },

  curlyMatch: function() {
    return this.curlyCount-1 == this.tokenizer.curlyCount;
  },

  braceMatch: function() {
    return this.braceCount-1 == this.tokenizer.braceCount;
  }
});

var Braces = GenericContent.extend({
  klass: "Braces",
  markerTokens: {},
  addContent: function(token) {
    this.content.push(token);
    if (!this.started && token == '(') {
      this.started = true;
    } else if (this.started && token == ')' && this.braceMatch()) {
      this.closed = true;
    }
  }
});

var Block = GenericContent.extend({
  klass: "Block",
  addContent: function(token) {
    this.content.push(token);
    if (!this.started && token == '{') {
      this.started = true;
    } else if (this.started && token == '}' && this.curlyMatch()) {
      this.closed = true;
    }
  }
});

var Klass = GenericContent.extend({
  klass: "Klass",
  markerTokens: {},
  addContent: function(token) {
    if (token == '{') {
      var block = this.newContent(Block, token);
      block.markerTokens = {
        'var' : 'Member',
        'function' : 'Method'
      };
      this.block = block;
    } else {
      this.content.push(token);
    }
  },


  inScope: function() {
    return this.started && this.curlyCount < this.tokenizer.curlyCount;
  },

  toString: function() {
    this.collapse();
    this.shift();
    var name    = this.shift();
    var content = this.block.toString().replace(/,(\s*\}\s*)$/, '$1');

    return "var " +  name + '=JS2.Class.extend(' + content + ');';
  },

});

var Method = GenericContent.extend({ 
  klass: "Method",
  push: function(content) {
    this.super(content);
    if (this.block && this.block.closed) this.closed = true;
  },
  addContent: function(token) {
    if (token == '{') {
      this.block = this.newContent(Block, token);
    } else if (token == '(') {
      this.brace = this.newContent(Braces, token);
    } else {
      this.content.push(token);
    } 

  },

  toString: function() {
    var tokens = this.extractTokens("function SPACE name SPACE? Braces SPACE? Block");
    return tokens[2] + ':function' + tokens[4] + tokens[6];
  }  
});

var Foreach = GenericContent.extend({
  counter: 0,
  klass: "Foreach",
  markerTokens: {},
  addContent: function(token) {
    if (token == '(') {
      this.braces = this.newContent(Braces, token); 
    } 

    else if (token == '{') {
      this.curlies = this.newContent(Block, token);
    } 

    else {
      this.content.push(token);
      if (this.curlies && this.curlies.closed) this.closed = true;
    }
  },

  toString: function () {
    var tokens = this.extractTokens("foreach SPACE? Braces SPACE? Block");
    this.counter++;

    this.braces.collapse();
    var leftPart = this.braces.extractTokens("leftbrace var IDENT in IDENT+ rightbrace");

    var holder   = leftPart[2];
    var iterator = '_it' + this.counter;
    var len = '_len' + this.counter;
    var rest = leftPart[4];

    var container = '_con' + this.counter;

    var ret = "for (var " + iterator + "=0," + 
               container + "=" + rest + "," + 
               len + "=" + container + ".length," + holder + ";" + 
               holder + "=" + container + '[' + iterator + ']||' + 
               iterator + "<" + len + ";" + iterator + "++)" + 
               this.curlies.toString();
    
    this.counter--;
    return ret;
  }
});

var Member = GenericContent.extend({ 
  klass: "Member",
  addContent: function(token) {
    this.content.push(token);
    if (token == ';') {
      this.closed = true;
    }
  },

  toString: function() {
    this.collapse();
    this.shift(); 
    var name = this.shift();
    this.shift();
    this.pop();

    return '"' + name + '":' + this.super() + ',';
  }
});

var Parser = JS2.Class.extend({
  initialize: function () {
    this.js2Tokenizer = require('./js2-tokenizer').parser;
    this.reset();
    this.js2Tokenizer.yy = this;
  },

  reset: function () {
    this.braceCount = 0;
    this.curlyCount = 0;
    this.line = 0;
    this.root = new GenericContent(this);
  },

  parse: function(str) {
    this.js2Tokenizer.parse(str);
  },
  
  append: function (str) {
    if (str == "\n") this.line++;
    this.root.push(str);
  },

  toString: function () {
    return this.root.toString();
  }
});

Parser.parse = function (str) {
  var parser = new this();
  parser.parse(str);
  return parser.root;
}

Parser.parseFile = function (str) {
  var fs = require('fs'); 
  return this.parse(fs.readFileSync(str, 'utf8'));
}


console.log(Parser.parseFile("./tests/test1.js2").toString());

