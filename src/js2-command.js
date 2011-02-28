(function() {
  JS2.Command = JS2.Class.extend({
    initialize:function (argv) {
      this.argv = argv;
      var command = this.argv.shift();
      if (this[command]) {
        this[command](argv);
      } else {
        this.showBanner();
      }
    },

    run: function(argv) {
      var file;
      var i = 0;
      while (file = argv[i++]) {
        console.log(file, JS2.FS.read(file));
        eval(JS2.render(JS2.FS.read(file))); 
      }
    },

    compile: function(argv) {
      var updater = new JS2.Updater(argv[0], argv[1]);
      updater.update();
    },

    watch: function(argv) {
      var updater = new Updater(argv[0], argv[1]);
      var self = this;
      setInterval(this.interval * 1000, function () { self.update() });
    },

    showBanner:function() {
      console.log("js2 <command>");
    }
  });

  JS2.Updater = JS2.Class.extend({
    initialize: function (inDir, outDir) {
      this.inDir  = inDir;
      this.outDir = outDir || inDir;
      this.interval = 2;
    },

    update: function () {
      var files = JS2.FS.getFiles(this.inDir, 'js2');
      for(var i=0; i<files.length; i++){
        var inFile  = files[i];
        var outFile = inFile.replace(this.inDir, this.outDir).replace(/\.js2$/, '.js');
        if (JS2.FS.mtime(inFile) > JS2.FS.mtime(outFile)) {
          JS2.FS.write(outFile, (JS2.render(JS2.FS.read(inFile)))); 
        }
      }
    }
  });
})(undefined, JS2);
