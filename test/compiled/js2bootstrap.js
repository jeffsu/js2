(function (scope) {
  if (scope.JS2) return;

  var JS2 = {};
  scope.JS2 = JS2;

  function noInit () { };

  var ooUtils = {
    'extends': function (par) {
      this.parent  = par;
      var newProto = par.oo('instance');
      var proto    = this.prototype;

      var members = this.oo.members;
      for (var k in proto) {
        if (proto.hasOwnProperty(k)) newProto[k] = proto[k];
      }

      this.prototype = newProto;
      this.prototype['class'] = this;
    },

    'instance': function () {
      var proto = this.prototype;

      var init = null;
      if (this.oo.members.initialize) {
        init = proto.initialize;
      }

      this.prototype.initialize = noInit;
      var ret = new this();

      if (init) {
        this.prototype.initialize = init;
        ret.initialize = init;
      } else {
        delete this.prototype['initialize'];
      }

      return ret;
    },

    'include': function (mod) {
      var hash       = mod.prototype;
      var members    = this.oo.members;
      var modMembers = mod.oo.members;

      for (var k in modMembers) {
        if (!(k in members)) {
          this.prototype[k] = hash[k];
        } 
      }
    },
 
    'member': function (name, member) {
      this.oo.members[name] = true;
      this.prototype[name]  = member;
    },

    'method': function (name, method) {
      this.oo.members[name] = true;
      this.prototype[name]  = method;
      method._name  = name;
      method._class = this;
    },

    'modularize': function () {
      this.isModule = true;
    },

    'staticMember': function (name, member) {
      this[name] = member;
    },

    'setHTMLCache': function (hash) {
      // create temp class
      var tempClass = function () {};

      // look for super htmlCache
      var par = this.parent;
      if (par) {
        var parCache = par.prototype.htmlCache;
        if (parCache) tempClass.prototype = parCache;
      }

      var htmlCache = new tempClass(); 
      for (var k in hash) htmlCache[k] = hash[k];
      this.oo('member', 'htmlCache', htmlCache);
    },

    'super': function (member) {
      return this.parent.prototype[member];
    },

    'property': function (names) {
      for (var i=0; i<names.length; i++) {
        var name = names[i];
        var getter = 'get' + name.charAt(0).toUpperCase() + name.substr(1);
        var setter = 'set' + name.charAt(0).toUpperCase() + name.substr(1);

        var members = this.oo.members;
        if (! (getter in members)) 
          this.oo('method', getter, (function (n) { return function () { return this[n] }})(name));   
        if (! (setter in members))  
          this.oo('method', setter, (function (n) { return function (val) { return this[n] = val }})(name));   
      }
    },

    'accessor': function (names) {
      for (var i=0; i<names.length; i++) {
        var name = names[i];
        if (! (name in this.oo.members)) 
          this.oo('method', name, 
            function () { 
              if (arguments.length) { return this['_' + name] = arguments[0]; } 
              else { return this['_' + name]; } 
            });
      }
    },

    'ancestors': function (names) {
      var ret = [];
      var k = this.parent;
      while (k) {
        ret.push(k);
        k = k.parent;
      }
      return ret;
    }
  };


  function createClass (name, par) {
    var K = function () { if (this.initialize) this.initialize.apply(this, arguments); };

    K.prototype['class'] = K;
    K.prototype['klass'] = K;

    K.oo = function (method, param1, param2) { 
      return ooUtils[method].apply(K, [ param1, param2 ]); 
    };

    K.oo.includes = [];
    K.oo.members  = {};
 
    return K;
  }
  
  function createNamespace (space, currentScope) {
    var currentScope = currentScope || scope;
 
    var splitted = space.split('.');
    var name = [];
    while (splitted.length) {
      var part = splitted.shift();
      name.push(part);

      if (! currentScope[part]) {
        var K = createClass();
        K.package = currentScope;
        currentScope[part] = K;
      }

      currentScope = currentScope[part];
      currentScope.className = name.join('.');
    }

    return currentScope;
  }

  JS2.OO = {};
  JS2.OO.createClass = createNamespace;
  JS2.OO.createModule = function (name) { createNamespace(name).oo('modularize') };
  JS2.OO.get = function (name, scope) { 
    scope = scope || window;
    var cur = scope;
    var names = name.split(/\./);
    while (names.length) cur = cur[names.shift()];
    return cur;
  };

  JS2.OO['super'] = function () {
    var method = arguments.callee.caller;
    var name  = method._name;
    var klass = method._class;
    var self  = arguments[0];

    var method = klass.parent.prototype[name];
    if (! method) return;

    var args = [];
    for (var i=1,len=arguments.length;i<len;i++) {
      args.push(arguments[i]);
    }
    return method.apply(self, args);
  }

})(window);


JS2.OO.createClass("JS2.App.Notifier");  (function (K,Package) {var self=K; var _super=JS2.OO['super']; 
  K.oo('member', 'autoInc',  1);

  K.oo('method', "initialize", function () {
    this.chains  = {};
    this.autoInc = 1;
    this.id = this['class'].prototype.autoInc;
    this['class'].prototype.autoInc++;
  });

  K.oo('method', "register", function (comp) {
    if (! comp.__notifier_ids) {
      comp.__notifier_ids = {};
    }

    if (! comp.__notifier_ids[this.id]) {
      comp.__notifier_ids[this.id] = this.autoInc;
      this.autoInc++;
    }

    for (var key in comp) {
      if (key.indexOf('e_') == 0) {
        var eventType = key.substr(2);
        if (! this.chains[eventType]) this.chains[eventType] = [];
        this.chains[eventType].push([ comp, comp[key] ]);
      }
    }

    comp.notify = (function (self) { return function () {
      self.notify.apply(self, arguments);
    }})(this);
  });

  K.oo('method', "remove", function (comp) {
    var id = comp.__notifier_id;
    for (var key in this.chains) {
      var newChain = [];
      for (var j=0,ele,j__arr=chain,j__len=j__arr.length; (ele=j__arr[j]) || j<j__len; j++){
        if (ele[0].__notifier_id[this.id] != id) {
          newChain.push(ele); 
        }
      }

      this.chains[key] = newChain;
    }
  });

  K.oo('method', "registerListener", function (listener) {
    for (var key in listener) {
      var funct = listener[key];
      if (typeof funct != 'function') continue;
      if (! this.chains[key]) this.chains[key] = [];
      this.chains[key].push([ listener, funct ]);
    }
  });

  K.oo('method', "notify", function () {
    var eventType = arguments[0];
    var args;

    // optimize for 1 argument
    if (arguments.length == 2) {
      args = [ arguments[1] ];
    } else {
      args = [];
      for (var i=1; i<=arguments.length; i++) args.push(arguments[i]);
    }

    var chain = this.chains[eventType];
    if (chain) {
      for (var i=0,pair; pair=chain[i++];) {
        pair[1].apply(pair[0], args); 
      }
    }
  });
})(JS2.App.Notifier, JS2.App);


JS2.OO.createClass("JS2.App");  (function (K,Package) {var self=K; var _super=JS2.OO['super']; 

  K.oo('method', "start", function (options) {
    // hack to get notifier
    this.getNotifier();

    this.build();
    this.notify('setOptions', options || {});
    this.notify('initHTML');
    this.notify('registerEvents');
    this.notify('finalize');
  });


  K.oo('method', "register", function (comp) {
    this.getNotifier().register(comp);
  });

  K.oo('method', "getNotifier", function () {
    if (! this._notifier) {
      this._notifier = new JS2.App.Notifier();
      this._notifier.register(this);
    }

    return this._notifier;
  });

  K.oo('method', "build", function () {
    var components = { main: this };

    var classes = [];
    var klass   = this['class'];

    while (klass) {
      classes.unshift(klass);
      klass = klass.parent;
    }

    var template = [];
    var already  = {};
    var runningIdx = 0;

    for (var i=0,c,i__arr=classes,i__len=i__arr.length; (c=i__arr[i]) || i<i__len; i++){
      var toAdd = c.prototype.getTemplate();
      for (var j=0,t,j__arr=toAdd,j__len=j__arr.length; (t=j__arr[j]) || j<j__len; j++){
        if (already[t.name] != undefined) {
          template[already[t.name]] = t;
        } else {
          already[t.name] = runningIdx;
          runningIdx += 1;
          template.push(t);
        }
      }
    }

    // instantiate all components
    components['main'] = this;
    for (var i=0,config,i__arr=template,i__len=i__arr.length; (config=i__arr[i]) || i<i__len; i++){
      if (!config['class']) alert("Invalid class defined for " + name + ':' + config['class']);
      var klass = JS2.OO.get(config['class']);

      if (klass) {
        components[config.name] = new klass();
      } else if (console) {
        console.log('class "' + config.name + '" was not found."');
      }
      this.register(components[config.name]);
    }

    for (var i=0,config,i__arr=template,i__len=i__arr.length; (config=i__arr[i]) || i<i__len; i++){
      var name = config.name;
      var comp = components[name];

      // inject set dependencies as an array
      if (config.dependencies instanceof Array) {
        for (var j=0,dep,j__arr=config.dependencies,j__len=j__arr.length; (dep=j__arr[j]) || j<j__len; j++){
          comp[dep] = components[dep];
        }
      }

      // as a hash... for use when nickname is not the dependency name
      else if (config.dependencies instanceof Object) {
        for (var key in config.dependencies) {
          comp[key] = components[config.dependencies[key]];
        }
      }
    }

    this.notify('initBaseHTML');

    // handle selectors as root elements
    for (var i=0,config,i__arr=template,i__len=i__arr.length; (config=i__arr[i]) || i<i__len; i++){
      var name = config.name;
      var comp = components[name];

      if (config.selector)       comp.$root = this.htmlSelect(this.$root, config.selector);
      if (config.globalSelector) comp.$root = this.htmlSelect(config.globalSelector);
    }
  });

  K.oo('method', "htmlSelect", function (root, text) {
    alert('html selector not implemented');
  });

  K.oo('method', "getTemplate", function () {
    return [];
  });
})(JS2.App, JS2);
JS2.OO.createClass("JS2.App.JQuery"); JS2.App.JQuery.oo('extends', JS2.App); (function (K,Package) {var self=K; var _super=JS2.OO['super']; 
  K.oo('method', "htmlSelect", function ($root, text) {
    if (text) {
      return $root.find(text);
    } else {
      return $(root);
    }
  });
})(JS2.App.JQuery, JS2.App);