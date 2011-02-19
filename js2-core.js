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
  addContent: function(token) {
    if (token == '{') {
      this.block = this.newContent(Block, token);
    } else {
      this.content.push(token);
    } 

    if (this.block && this.block.closed) this.closed = true;
  },

  toString: function() {
    this.shiftOff('function');
    var space = this.shift();
    var name  = this.shift();

    return space + '"' + name + '":function' + this.super() + ',';
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
    this.counter++;

    this.braces.collapse();
    this.braces.shift();
    this.braces.pop();

    var holder = this.braces.shift();
    var temp   = this.braces.shift();
    var iterator = null;

    if (temp == ':') {
      iterator = this.braces.shift();
    } else {
      iterator = '_it' + this.counter;
    }

    this.braces.shift();

    var len = '_len' + this.counter;
    var rest = this.braces.content.join('');
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
    this.js2_tokenizer = require('./js2-tokenizer').parser;
    this.reset();
    this.js2_tokenizer.yy = this;
  },

  reset: function () {
    this.braceCount = 0;
    this.curlyCount = 0;
    this.line = 0;
    this.root = new GenericContent(this);
  },

  parse: function(str) {
    this.js2_tokenizer.parse(str);
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


var test1 = "class FooBar {\n" +
"  var foo = 'hello';\n " +
"  function foobar() {\n " +
"    console('hi');\n " +
"    foreach (var i in j) {\n " +
"    }\n " +
"  }\n " +
"}";
var test2 = "foreach (var k in x) { foreach (var i in j) { hello } }";
var root = Parser.parse(test1);
console.log(root.toString());

