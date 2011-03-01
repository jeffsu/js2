var FS = require('fs');
JS2.FS = {
  find: function(path) {
    FS.realpath(path);

  },

  readdir: function(dir) {
    var files = FS.readdirSync(dir);
    var ret = [];
    for (var i=0; i<files.length; i++) {
      var f = files[i];
      if (f.match(/^\./) {
        return f.    
      }
    }
  }
}
