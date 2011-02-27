JS2.Class.extend('JS2.Lexer', {
  tokenize: function(str) {
    var tokens = new Tokens(str);
    this.consume(tokens);
  },

  consume: function(str, tokens) {
    while (!tokens.finished()) {
      
    }
  }
});


JS2.Class.extend('JS2.Tokens', {

});
