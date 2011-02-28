var FS = require('fs');
JS2.FS = {
  read: function(file) {
    return FS.readFileSync(file, 'utf8');
  },
  
  getFiles: function(dir, ext) {
    var all = FS.readdirSync(dir);
    var extRegex = new RegExp("\\\\." + ext + "$");
    for (var i=0; i<all.length; i++) {
      var file = dir + '/' + all[i];
      if (file.match(/^\./)) continue;

      if (FS.statSync(file).isDirectory()) {
        var more = this.getFiles(file, ext);
        for (var j=0; j<more.length; j++) {
          all.push(more[j]);
        }
      } else if (file.match(extRegex)) {
        all.push(file);
      }
    }
    return all;
  },

  write: function(file, data) {
    return FS.writeFileSync(file, data);
  },

  mtime: function(file) {
    try {
      var stat = FS.statSync(file);
      return stat.isFile() ? stat.mtime : 0;
    } catch (e)  {
      return 0;
    }
  }
};

