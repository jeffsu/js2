JS2.Lexer = (function () {
  var SSTRING_REGEX = /^'[^\\']*(?:\\.[^\\']*)*'/s;
  var DSTRING_REGEX = /^"[^\\"]*(?:\\.[^\\']*)*"/s;
  var ISTRING_REGEX = /^(%\{)[^\\"]*(?:\\.[^\\']*)*(#\{|})/s;
  var REGEX_REGEX   = /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/s;

  function istring(str) {
    var ret = [];
    var m = ISTRING_REGEX.exec(str);
    if (m[2] == '#{') {
    }
  }

  var TOKENS = [ 
    [ 'SPACE', "\\s+" ],
    [ 'REGEX', "\\/", function(str) { var m = REGEX_REGEX.exec(str); if (m) return m[0] } ],
    [ 'CLASS', "class" ],
    [ 'SHORT_FUNCT', "->" ],
    [ 'FOREACH', "foreach" ],
    [ 'CURRY', "curry" ],
    [ 'IDENT', "[\\w$]+" ],
    [ 'HERE_DOC', "<<[A-Z_]+" ],
    [ 'DSTRING', '"', function(str) { var m = DSTRING_REGEX.exec(str); if (m) return m[0]; } ],
    [ 'SSTRING', "'", function(str) { var m = SSTRING_REGEX.exec(str); if (m) return m[0]; } ],
    [ 'ISTRING', "%{", istring,
    [ 'OPERATOR', "." ]
  ];

  var IDS = {};
  var REGEX_TOKENS = [];
  for (var i=0,token; token=TOKENS[i++];) {
    IDS[token[0]] = i;
    REGEX_TOKENS.push("(" + token[1] + ")");
  }

  var PRIMARY_REGEX = new RegExp("^(" + REGEX_TOKENS.join('|') + ")");

  var Tokens = JS2.Class.extend({
    initialize: function() {
      this.tokens = [];
      this.curlyCount = 0;
      this.braceCount = 0;
    },

    peek: function() {
      return this.tokens[0];
    },

    shift: function() {
      var item = this.tokens.shift(item);
      if (item[0] == '{') {
        this.curlyCount++;
      } else if (item[0] == '}') {
        this.curlyCount--;
      } else if (item[0] == '(') {
        this.braceCount++;
      } else if (item[0] == ')') {
        this.braceCount--;
      }
      return item;
    },

    push: function(item) {
      this.tokens.push(item);
    },

    pop: function() {
      return this.tokens.pop();
    },

    freeze: function(obj) {
      obj.curlyCount = this.curlyCount;
      obj.braceCount = this.braceCount;
    },

    isBalancedCurly: function(obj) {
      return obj.curlyCount == this.curlyCount;
    },

    isBalancedBrace: function(obj) {
      return obj.braceCount == this.braceCount;
    },

    empty: function() {
      return this.tokens.length <= 0;
    }

  });

  var Lexer = JS2.Class.extend({
    tokenize: function(str, parser) {
      var m, res, type, tokens = new Tokens();
      while (str.length > 0) {
        m    = PRIMARY_REGEX.exec(str);
        res  = null;
        type = null;

        for (var i=0,token;token=TOKENS[i++];) {
          if (m[0] == m[i+1]) {
            res  = token[2] ? token[2](str,parser) : m[0];
            type = i;
            if (res) break;
          }
        }

        if (res) {
          tokens.push([ res, type ]); 
          str = str.substr(res.length);
        } else {
          return [];
        }
      }

      return tokens;
    }
  });

  Lexer.IDS = IDS;

  return Lexer;
})();

