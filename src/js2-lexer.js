JS2.Lexer = (function () {
  var SSTRING_REGEX = /^'[^\\']*(?:\\.[^\\']*)*'/s;
  var DSTRING_REGEX = /^"[^\\"]*(?:\\.[^\\']*)*"/s;
  var ISTRING_REGEX_INTER = /^(%\{|})([^\\"]*(?:\\.[^\\']*)*)(#\{)/s;
  var ISTRING_REGEX_FIN   = /^(%\{|})[^\\"]*(?:\\.[^\\']*)*(})/s;
  var REGEX_REGEX   = /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/s;

  function istring(str) {
    var ret = [];
    var m = ISTRING_REGEX_INTER.exec(str);
    if (m) {
      var lexer  = new Lexer();
      var tokens = [ [ '"' + m[2] + '"', IDS.DSTRING ], [ '+(', IDS.OPERATOR ] ];
      var token  = null;
      var curlyCount = 1;
      str = str.substr(m[0].length);

      while (token = lexer.chomp(str)) {
        if (token[0] == '{') {
          curlyCount++;
        } else if (token[0] == '}') {
          curlyCount--;
        }

        if (curlyCount == 0) {
          break;          
        } else {
          tokens.push(token);
        }
        str = str.substr(token[0].length);
      }

      tokens.push([ [ ')+', IDS.OPERATOR ] ]);
      if (str.length) {
        var val = istring(str);
        var ending = val[1];
        var tail   = val[0];
        for (var i=0; i<tail.length; i++) {
          tokens.push(tail[i]);
        }
      }
      return [ tokens, ending ];
    }

    m = ISTRING_REGEX_FIN.exec(str);
    if (m) {
      var ending = str.substr(m[0].length);
      return [ [ [ m[0].replace(/"/, "\\\"").replace(/^(%\{|})/, '"').replace(/\}$/, '"'), IDS.DSTRING ] ], ending ];
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
    [ 'ISTRING', "%{", istring ],
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
    tokenize: function(str) {
      str = str || this.str;
      var m, res, type, tokens = new Tokens();
      while (str.length > 0) {
        res = this.chomp(str);
        if (!res) return [];

        if (res[1] == IDS.ISTRING) {
          var stuff = res[0];
          var stokens = stuff[0];
          var ending  = stuff[1];
          for (var i=0; i<stokens.length; i++) {
            tokens.push(stokens[i]);
          }
          str = ending;
        } else {
          tokens.push(res); 
          str = str.substr(res[0].length);
        } 
      }

      return tokens;
    },

    chomp: function(str) {
      var m = PRIMARY_REGEX.exec(str);
      var res   = null;
      var type  = null;

      for (var i=0,token;token=TOKENS[i]; i++) {
        if (m[0] == m[i+2]) {
          res  = token[2] ? token[2](str) : m[0];
          type = i;
          if (res) break;
        }
      }
      return res ? [ res, type ] : null;
    }
  });

  Lexer.IDS = IDS;

  var l = new Lexer();
  console.log(l.tokenize("begin %{hell#{o}world} end"));
  return Lexer;
})();

