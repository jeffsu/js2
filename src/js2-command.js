(function() {
  var BANNER = 
    "js2 <command> [options] <arguments>\n" +
    "Commands:\n" +
    "  * run <file>                -- Executes file\n" +
    "  * compile <inDir> [outDir]  -- Compiles a directory and puts js files into outDir.  If outDir is not specified, inDir will be used\n" + 
    "    Options:\n" +
    "      -r                      -- Traverse directories recursively\n" +
    "  * compile <file>            -- Compiles a single js2 file into js\n" +
    "  * watch <inDir> <outDir>    -- Similar to compile, but update will keep looping while watching for modifications\n" +
    "    Options:\n" +
    "      -r                      -- Traverse directories recursively\n" +
    "      -i=<seconds>            -- Interval time in seconds between loops\n";

  JS2.Command = JS2.Class.extend({
    initialize:function (argv) {
      this.argv = argv;
      var command = this.argv.shift();
      this.fs     = JS2.FS;
      this.parseOpts(argv);

      if (this[command]) {
        console.log("Running " + command + ".");
        this[command](argv);
      } else {
        this.showBanner();
      }
    },

    run: function(argv) {
      var file;
      var i = 0;
      while (file = argv[i++]) {
        eval(JS2.render(JS2.FS.read(file))); 
      }
    },

    options: {
      'r': 'recursive',
      'i': 'interval'
    },

    parseOpts: function(argv) {
      this.opts = { main: [] };
      var opts = this.opts;
      for (var i=0; i<argv.length; i++) {
        var arg = argv[i];
        if (arg.match(/^-(\w)(=(.*))?$/)) {
          opts[this.options[arg[1]]] = arg[3] || true;
        } else {
          opts.main.push(arg); 
        }
      }
    },

    compile: function() {
      var inDir = this.opts.main[0];
      if (this.fs.isFile(inDir)) {
        this.fs.write(inDir.replace(/\.js2$/, '.js'), JS2.render(JS2.FS.read(inDir))); 
      } else {
        this.getUpdater().update();
      }
    },

    getUpdater: function() {
      var inDir  = this.opts.main[0] || '.';
      var outDir = this.opts.main[1] || inDir;
      return new JS2.Updater(inDir, outDir, ('recursive' in this.opts));
    },

    watch: function() {
      var updater = this.getUpdater();
      var self = this;
      var interval = this.opts.interval || 2;
      console.log('Input Directory:' + updater.inDir + ' -> Output Directory:' + updater.outDir);
      if (updater.recursive) console.log('RECURSIVE');
      setInterval(function () { updater.update() }, interval * 1000);
    },

    showBanner:function() {
      console.log(BANNER);
    }
  });

  JS2.Updater = JS2.Class.extend({
    initialize: function (inDir, outDir, recursive) {
      this.inDir  = inDir;
      this.outDir = outDir || inDir;
      this.interval = 2;
      this.recursive = recursive;
    },

    update: function () {
      console.log('Updating...');
      var files = JS2.FS.find(this.inDir, 'js2', this.recursive);
      for(var i=0; i<files.length; i++){
        var inFile  = files[i];
        var outFile = inFile.replace(this.inDir, this.outDir).replace(/\.js2$/, '.js');
        if (JS2.FS.mtime(inFile) > JS2.FS.mtime(outFile)) {
          console.log("  `- Compiling " + inFile + " to " + outFile + "...");
          try {
            JS2.FS.write(outFile, (JS2.render(JS2.FS.read(inFile)))); 
          } catch (e) {
            console.log(e.toString());
          }
        }
      }
    }
  });
})(undefined, JS2);
