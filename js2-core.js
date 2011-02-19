var JS2 = require('./js2-class').JS2;

var GenericContent = JS2.Class.extend({
  klass: "GenericContent",
  sanityShift: 20,
  started: true,
  markerTokens: {
    'class' : 'Klass',
    'foreach' : 'Foreach'
  },

  initialize: function (tokenizer) {
    this.content = [];
    this.next    = null;

    if (tokenizer) {
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

    else if (token in this.markerTokens && this.started) {
      var klass = eval(this.markerTokens[token]);
      this.newContent(klass, token);
    } 

   
    else {
      this.addContent(token);    
    }
  },

  newContent: function (klass, token) {
    this.next = new klass(this.tokenizer);
    this.content.push(this.next);
    this.next.push(token);
    if (this.next.closed) this.next = null;
  },

  addContent: function(token) {
    this.content.push(token);
    if (this.curlyCount > 0 && token == '}' && this.curlyMatch()) {
      this.closed = true;
    }
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
    return this.curlyCount-1 == this.tokenizer.curlyCount;
  }


});

var Klass = GenericContent.extend({
  klass: "Klass",
  markerTokens: {},
  addContent: function(token) {
    this.content.push(token);
    if (this.inScope()) {
      if (token == 'function') {
        this.newContent(Method, this.content.pop());
      } else if (token == 'var') {
        this.newContent(Member, this.content.pop());
      }
    } else if (token == '{') {
      this.started = true;
    } else if (token == '}' && this.curlyMatch()) {
      this.closed = true;
    }
  },


  inScope: function() {
    return this.started && this.curlyCount < this.tokenizer.curlyCount;
  },

  toString: function() {
    var klass = this.content.shift();
    var uselessSpace = this.content.shift();
    var name  = this.content.shift();
    var space = this.content.shift();
    var body  = this.super().replace(/,(\s*)$/, "$1");

    return "var" + space + name + '=JS2.Class.extend(' + body + ');';
  },

});

var Method = GenericContent.extend({ 
  klass: "Method",
  addContent: function(token) {
    if (token == '{') {
      this.newContent(GenericContent, token);
    } else {
      this.content.push(token);
    } 

  },

  toString: function() {
    this.shiftOff('function');
    var space = this.shift();
    var name  = this.shift();

    return space + '"' + name + '":function' + this.super() + ',';
  }  
});

var Foreach = GenericContent.extend({
  klass: "Foreach",
  markerTokens: {},
  addContent: function(token) {
    this.content.push(token);
    if (token == '(') {
      if (!this.started) {
        this.started = true;
      }
    } else if (token == ')' && this.started && this.braceMatch()) {
      this.braceClosed = true;
    } else if (this.braceClosed && token == '{') {
      console.log('hi');
      this.addContent(GenericContent, this.content.pop());
    }

    if (this.next && this.next.closed) {
      this.closed = true;
    }
  },

  toString: function () {
    return "foreach";
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
    this.shiftOff('var'); 
    var space = this.shift();
    var name  = this.shift();
    this.shiftOff('=');
    this.pop();

    return '"' + name + '":' + this.super() + ',';
  }

});



function Tokenizer () {
  this.reset();
  this.js2_tokenizer = require('./js2-tokenizer').parser;
  this.js2_tokenizer.yy = this;
}

Tokenizer.prototype = {
  reset: function () {
    this.braceCount = 0;
    this.curlyCount = 0;
    this.root = new GenericContent(this);
  },
  parse: function(str) {
    this.js2_tokenizer.parse(str);
  },
  
  append: function (str) {
    this.root.push(str);
  },

  toString: function () {
    return this.root.toString();
  }
};


var tokenizer = new Tokenizer();
tokenizer.parse("class FooBar {\n" +
"  var foo = 'hello';\n " +
"  function foobar() {\n " +
"    console('hi');\n " +
"    foreach (var i in j) {\n " +
"    }\n " +
"  }\n " +
"}");
console.log(tokenizer.toString());
