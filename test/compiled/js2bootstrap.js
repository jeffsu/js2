var JS2 = {};
JS2.createClass = function (name) {
  var splitName = name.split('.');
  var namespace = window;
  while (splitName.length) {
    var subName = splitName.shift();
    if (! namespace[subName]) {
      namespace = 
        namespace[subName] = 
        function () { if (this.initialize) this.initialize.apply(this, arguments) };
    } else {
      namespace = namespace[subName];
    }
  }
}

JS2.getClass = function (name) {
  var splitName = name.split('.');
  var namespace = window;

  while (splitName.length) {
    var subName = splitName.shift();
    if (namespace[subName]) {
      namespace = namespace[subName];
    } else {
      return null;
    }
  }

  return namespace;
}

function _super () {
  var method = arguments.callee.caller._super;
  if (! method) return;
  var self = arguments[0];
  var args = [];
  for (var i=1,len=arguments.length;i<len;i++) {
    args.push(arguments[i]);
  }
  return method.apply(self, args);
}


JS2.OO.createClass("JS2.Observer");  (function (K,Package) {var self=K; var _super=JS2.OO['super']; 
  K.oo('method', "initialize", function (owner) {
    this.lookupBefore = {};
    this.lookupAfter  = {};

    this.replaced       = {};
    this.replacedValues = {};
  });

  K.oo('method', "replaceFunction", function (owner, eventName) {
    if (this.replaced[eventName]) return;

    this.replacedValues[eventName] = owner[eventName];
    this.replaced[eventName]       = true;
    owner[eventName] = this.getTrigger(eventName);
  });

  K.oo('method', "trigger", function (owner, eventName, args) {
    var beforeChain = this.lookupBefore[eventName];
    if (beforeChain) this.executeChain(beforeChain, args);

    var funct = this.replacedValues[eventName];
    if (funct) funct.apply(owner, args);

    var afterChain = this.lookupAfter[eventName];
    if (afterChain) this.executeChain(afterChain, args);
  });

  K.oo('method', "addListener", function (eventName, funct, before) {
    var lookup = before ? this.lookupBefore : this.lookupAfter;

    var chain = lookup[eventName] = lookup[eventName] || [];  
    chain.push(funct);
  });

  // private

  K.oo('method', "getTrigger", function (eventName) {
    return function () { this.__observer.trigger(this, eventName, arguments); };
  });

  K.oo('method', "executeChain", function (chain, args) {
    for (var i=0,f,i__arr=chain,i__len=i__arr.length; (f=i__arr[i]) || i<i__len; i++)if (f) f.apply(this, args);
  });
})(JS2.Observer, JS2);
JS2.OO.createClass("JS2.Observable");  (function (K,Package) {var self=K; var _super=JS2.OO['super']; 
  K.oo('method', "addListener", function (eventName, funct, before) {
    if (! this.__observer) this.__observer = new Factual.Core.Observer();

    var id = this.__observer.addListener(eventName, funct, before);
    this.__observer.replaceFunction(this, eventName);
    return id;
  });

  K.oo('method', "triggerEvent", function (eventName, args) {
    if (this.__observer) this.__observer.trigger(this, eventName, args);
  });
})(JS2.Observable, JS2);

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
  K.oo('include', JS2.Observer);

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
      klass = klass.prototype._parent;
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
      var klass = JS2.getClass(config['class']);

      components[config.name] = new klass();
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