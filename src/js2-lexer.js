var tokenizer = {
  order: [ 'getString', 'getRegex', 'getIdent', 'getSpecials', 'getHereDoc', 'getOp' ],
  SSTRING: /^'[^\\']*(?:\\.[^\\']*)*'/s,
  DSTRING: /^"[^\\"]*(?:\\.[^\\']*)*"/s,
  REGEX:   /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/s,

  getSpace: function (str) {
    var m = str.match(/^\s+/s);
    if (m) return m[0];
  },

  getHereDoc: function(str) {
    var m = str.match(/<<([A-Z]+)/);
    if (m) return m[0];
  }, 

  getString: function(str) {
    m = str.match(this.SSTRING);
    if (m) return m[0];

    m = str.match(this.DSTRING);
    if (m) return m[0];
  },

  getRegex: function(str) {
    if (str.charAt(0) != '/') return;
    var m = str.match(this.REGEX);
    if (m) return m[0];
  },

  getIdent: function(str) {
    var m = str.match(/^[\w$]+/);
    if (m) return m[0];
  },

  getSpecials: function(str) {
    var m = str.match(/^(=|-)>/);
    if (m) return m[0];
  },

  getOp: function(str) {
    var m = str.match(/^[^\w]/);
    if (m) return m[0];
  },

  tokenize: function(str, parser) {
    var n      = this.order.length;
    var tokens = [];

    while (str.length > 0) {
      var found = false;
      for (var i=0; i<n; i++) {
        var res = this[this.order[i]](str, parser);
        if (res) {
          found = true;
          parser.append(res);
          str = str.substr(res.length);
          break;
        }
      }

    }
  }
};

exports.tokenizer = tokenizer;
