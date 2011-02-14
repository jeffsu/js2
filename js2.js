var JS2 = require('./class').JS2;

var GenericContent = JS2.Class.extend({
  klass: "GenericContent",

  started: true,
  markerTokens: {
    'class': 'Klass'
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

  push: function(token) {
    if (this.next) {
      this.next.push(token);
      if (this.next.closed) this.next = null;
    } 
    
    else if (token in this.markerTokens && this.started) {
      var klass = eval(this.markerTokens[token]);
      this.next = new klass(this.tokenizer);
      this.content.push(this.next);
      if (this.next.closed) this.next = null;
    } else {
      this.addContent(token);    
    }
  },

  getNext: function () {

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
  }

});

var Klass = GenericContent.extend({
  markerTokens: {
    'class':    'Klass',
    'function': 'Method'
  },

  addContent: function(token) {
    this.content.push(token);
    if (this.started) {
      if (token == '}' && this.curlyCount == this.tokenizer.curlyCount) this.closed = true
    } else if (token == '{') {
      this.started = true;
    }
  },

  toString: function() {
    var space = this.content.shift();
    var name  = this.content.shift();
    var body  = this.super().replace(/,(\s*)$/, "$1");

    return "var" + space + name + '=JS2.Class.extend(' + body + ');';
  }
});

var Method = GenericContent.extend({ 
  toString: function() {
    var space = this.content.shift();
    var name  = this.content.shift();

    return space + '"' + name + '":function' + this.super() + ',';
  }  
});


function Tokenizer () {
  this.reset();
}

Tokenizer.prototype = {
  reset: function () {
    this.braceCount = 0;
    this.curlyCount = 0;

    this.root = new GenericContent(this);
  },
  
  append: function (str) {
    this.root.push(str);
  },

  toString: function () {
    return this.root.toString();
  }
};


var js2 = require('./js2').parser;
var tokenizer = new Tokenizer();
js2.yy = tokenizer;
js2.parse("class FooBar { function foobar() {}  }");
console.log(tokenizer.toString());
