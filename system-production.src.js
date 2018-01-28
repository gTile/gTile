/*
 * SystemJS v0.21.0 Production
 */
/*
MIT License
-----------

Copyright (C) 2013-2016 Guy Bedford

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var System = (function () {
'use strict';

/*
 * Environment
 */
var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
var isWindows = typeof process !== 'undefined' && typeof process.platform === 'string' && process.platform.match(/^win/);
var setGlobal = true;

var envGlobal = typeof self !== 'undefined' ? self : null;
envGlobal = envGlobal || (typeof window !== 'undefined' && window);
envGlobal = envGlobal || (typeof global !== 'undefined' && global);
/*
 * Simple Symbol() shim
 */
var hasSymbol = typeof Symbol !== 'undefined';
function createSymbol (name) {
  return hasSymbol ? Symbol() : '@@' + name;
}





/*
 * Environment baseURI
 */
var baseURI = '/';

// environent baseURI detection
if (typeof document != 'undefined' && document.getElementsByTagName) {
  baseURI = document.baseURI;

  if (!baseURI) {
    var bases = document.getElementsByTagName('base');
    baseURI = bases[0] && bases[0].href || window.location.href;
  }
}
else if (typeof location != 'undefined') {
  baseURI = location.href;
}

// sanitize out the hash and querystring
if (baseURI) {
  baseURI = baseURI.split('#')[0].split('?')[0];
  var slashIndex = baseURI.lastIndexOf('/');
  if (slashIndex !== -1)
    baseURI = baseURI.substr(0, slashIndex + 1);
}
else if (typeof process !== 'undefined' && process.cwd) {
  baseURI = 'file://' + (isWindows ? '/' : '') + process.cwd();
  if (isWindows)
    baseURI = baseURI.replace(/\\/g, '/');
}
else {
  throw new TypeError('No environment baseURI');
}

// ensure baseURI has trailing "/"
if (baseURI[baseURI.length - 1] !== '/')
  baseURI += '/';

/*
 * LoaderError with chaining for loader stacks
 */
var errArgs = new Error(0, '_').fileName == '_';
function LoaderError__Check_error_message_for_loader_stack (childErr, newMessage) {
  // Convert file:/// URLs to paths in Node
  if (!isBrowser)
    newMessage = newMessage.replace(isWindows ? /file:\/\/\//g : /file:\/\//g, '');

  var message = (childErr.message || childErr) + '\n  ' + newMessage;

  var err;
  if (errArgs && childErr.fileName)
    err = new Error(message, childErr.fileName, childErr.lineNumber);
  else
    err = new Error(message);


  var stack = childErr.originalErr ? childErr.originalErr.stack : childErr.stack;

  if (isNode)
    // node doesn't show the message otherwise
    err.stack = message + '\n  ' + stack;
  else
    err.stack = stack;

  err.originalErr = childErr.originalErr || childErr;

  return err;
}

/*
 * Optimized URL normalization assuming a syntax-valid URL parent
 */
function throwResolveError (relUrl, parentUrl) {
  throw new RangeError('Unable to resolve "' + relUrl + '" to ' + parentUrl);
}
function resolveIfNotPlain (relUrl, parentUrl) {
  relUrl = relUrl.trim();
  var parentProtocol = parentUrl && parentUrl.substr(0, parentUrl.indexOf(':') + 1);

  var firstChar = relUrl[0];
  var secondChar = relUrl[1];

  // protocol-relative
  if (firstChar === '/' && secondChar === '/') {
    if (!parentProtocol)
      throwResolveError(relUrl, parentUrl);
    return parentProtocol + relUrl;
  }
  // relative-url
  else if (firstChar === '.' && (secondChar === '/' || secondChar === '.' && (relUrl[2] === '/' || relUrl.length === 2 && (relUrl += '/')) ||
      relUrl.length === 1  && (relUrl += '/')) ||
      firstChar === '/') {
    var parentIsPlain = !parentProtocol || parentUrl[parentProtocol.length] !== '/';

    // read pathname from parent if a URL
    // pathname taken to be part after leading "/"
    var pathname;
    if (parentIsPlain) {
      // resolving to a plain parent -> skip standard URL prefix, and treat entire parent as pathname
      if (parentUrl === undefined)
        throwResolveError(relUrl, parentUrl);
      pathname = parentUrl;
    }
    else if (parentUrl[parentProtocol.length + 1] === '/') {
      // resolving to a :// so we need to read out the auth and host
      if (parentProtocol !== 'file:') {
        pathname = parentUrl.substr(parentProtocol.length + 2);
        pathname = pathname.substr(pathname.indexOf('/') + 1);
      }
      else {
        pathname = parentUrl.substr(8);
      }
    }
    else {
      // resolving to :/ so pathname is the /... part
      pathname = parentUrl.substr(parentProtocol.length + 1);
    }

    if (firstChar === '/') {
      if (parentIsPlain)
        throwResolveError(relUrl, parentUrl);
      else
        return parentUrl.substr(0, parentUrl.length - pathname.length - 1) + relUrl;
    }

    // join together and split for removal of .. and . segments
    // looping the string instead of anything fancy for perf reasons
    // '../../../../../z' resolved to 'x/y' is just 'z' regardless of parentIsPlain
    var segmented = pathname.substr(0, pathname.lastIndexOf('/') + 1) + relUrl;

    var output = [];
    var segmentIndex = -1;

    for (var i = 0; i < segmented.length; i++) {
      // busy reading a segment - only terminate on '/'
      if (segmentIndex !== -1) {
        if (segmented[i] === '/') {
          output.push(segmented.substring(segmentIndex, i + 1));
          segmentIndex = -1;
        }
        continue;
      }

      // new segment - check if it is relative
      if (segmented[i] === '.') {
        // ../ segment
        if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i + 2 === segmented.length)) {
          output.pop();
          i += 2;
        }
        // ./ segment
        else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
          i += 1;
        }
        else {
          // the start of a new segment as below
          segmentIndex = i;
          continue;
        }

        // this is the plain URI backtracking error (../, package:x -> error)
        if (parentIsPlain && output.length === 0)
          throwResolveError(relUrl, parentUrl);

        continue;
      }

      // it is the start of a new segment
      segmentIndex = i;
    }
    // finish reading out the last segment
    if (segmentIndex !== -1)
      output.push(segmented.substr(segmentIndex));

    return parentUrl.substr(0, parentUrl.length - pathname.length) + output.join('');
  }

  // sanitizes and verifies (by returning undefined if not a valid URL-like form)
  // Windows filepath compatibility is an added convenience here
  var protocolIndex = relUrl.indexOf(':');
  if (protocolIndex !== -1) {
    if (isNode) {
      // C:\x becomes file:///c:/x (we don't support C|\x)
      if (relUrl[1] === ':' && relUrl[2] === '\\' && relUrl[0].match(/[a-z]/i))
        return 'file:///' + relUrl.replace(/\\/g, '/');
    }
    return relUrl;
  }
}

var resolvedPromise$1 = Promise.resolve();

/*
 * Simple Array values shim
 */
function arrayValues (arr) {
  if (arr.values)
    return arr.values();

  if (typeof Symbol === 'undefined' || !Symbol.iterator)
    throw new Error('Symbol.iterator not supported in this browser');

  var iterable = {};
  iterable[Symbol.iterator] = function () {
    var keys = Object.keys(arr);
    var keyIndex = 0;
    return {
      next: function () {
        if (keyIndex < keys.length)
          return {
            value: arr[keys[keyIndex++]],
            done: false
          };
        else
          return {
            value: undefined,
            done: true
          };
      }
    };
  };
  return iterable;
}

/*
 * 3. Reflect.Loader
 *
 * We skip the entire native internal pipeline, just providing the bare API
 */
// 3.1.1
function Loader () {
  this.registry = new Registry();
}
// 3.3.1
Loader.prototype.constructor = Loader;

function ensureInstantiated (module) {
  if (!(module instanceof ModuleNamespace))
    throw new TypeError('Module instantiation did not return a valid namespace object.');
  return module;
}

// 3.3.2
Loader.prototype.import = function (key, parent) {
  if (typeof key !== 'string')
    throw new TypeError('Loader import method must be passed a module key string');
  // custom resolveInstantiate combined hook for better perf
  var loader = this;
  return resolvedPromise$1
  .then(function () {
    return loader[RESOLVE_INSTANTIATE](key, parent);
  })
  .then(ensureInstantiated)
  //.then(Module.evaluate)
  .catch(function (err) {
    throw LoaderError__Check_error_message_for_loader_stack(err, 'Loading ' + key + (parent ? ' from ' + parent : ''));
  });
};
// 3.3.3
var RESOLVE = Loader.resolve = createSymbol('resolve');

/*
 * Combined resolve / instantiate hook
 *
 * Not in current reduced spec, but necessary to separate RESOLVE from RESOLVE + INSTANTIATE as described
 * in the spec notes of this repo to ensure that loader.resolve doesn't instantiate when not wanted.
 *
 * We implement RESOLVE_INSTANTIATE as a single hook instead of a separate INSTANTIATE in order to avoid
 * the need for double registry lookups as a performance optimization.
 */
var RESOLVE_INSTANTIATE = Loader.resolveInstantiate = createSymbol('resolveInstantiate');

// default resolveInstantiate is just to call resolve and then get from the registry
// this provides compatibility for the resolveInstantiate optimization
Loader.prototype[RESOLVE_INSTANTIATE] = function (key, parent) {
  var loader = this;
  return loader.resolve(key, parent)
  .then(function (resolved) {
    return loader.registry.get(resolved);
  });
};

function ensureResolution (resolvedKey) {
  if (resolvedKey === undefined)
    throw new RangeError('No resolution found.');
  return resolvedKey;
}

Loader.prototype.resolve = function (key, parent) {
  var loader = this;
  return resolvedPromise$1
  .then(function() {
    return loader[RESOLVE](key, parent);
  })
  .then(ensureResolution)
  .catch(function (err) {
    throw LoaderError__Check_error_message_for_loader_stack(err, 'Resolving ' + key + (parent ? ' to ' + parent : ''));
  });
};

// 3.3.4 (import without evaluate)
// this is not documented because the use of deferred evaluation as in Module.evaluate is not
// documented, as it is not considered a stable feature to be encouraged
// Loader.prototype.load may well be deprecated if this stays disabled
/* Loader.prototype.load = function (key, parent) {
  return Promise.resolve(this[RESOLVE_INSTANTIATE](key, parent || this.key))
  .catch(function (err) {
    throw addToError(err, 'Loading ' + key + (parent ? ' from ' + parent : ''));
  });
}; */

/*
 * 4. Registry
 *
 * Instead of structuring through a Map, just use a dictionary object
 * We throw for construction attempts so this doesn't affect the public API
 *
 * Registry has been adjusted to use Namespace objects over ModuleStatus objects
 * as part of simplifying loader API implementation
 */
var iteratorSupport = typeof Symbol !== 'undefined' && Symbol.iterator;
var REGISTRY = createSymbol('registry');
function Registry() {
  this[REGISTRY] = {};
}
// 4.4.1
if (iteratorSupport) {
  // 4.4.2
  Registry.prototype[Symbol.iterator] = function () {
    return this.entries()[Symbol.iterator]();
  };

  // 4.4.3
  Registry.prototype.entries = function () {
    var registry = this[REGISTRY];
    return arrayValues(Object.keys(registry).map(function (key) {
      return [key, registry[key]];
    }));
  };
}

// 4.4.4
Registry.prototype.keys = function () {
  return arrayValues(Object.keys(this[REGISTRY]));
};
// 4.4.5
Registry.prototype.values = function () {
  var registry = this[REGISTRY];
  return arrayValues(Object.keys(registry).map(function (key) {
    return registry[key];
  }));
};
// 4.4.6
Registry.prototype.get = function (key) {
  return this[REGISTRY][key];
};
// 4.4.7
Registry.prototype.set = function (key, namespace) {
  if (!(namespace instanceof ModuleNamespace))
    throw new Error('Registry must be set with an instance of Module Namespace');
  this[REGISTRY][key] = namespace;
  return this;
};
// 4.4.8
Registry.prototype.has = function (key) {
  return Object.hasOwnProperty.call(this[REGISTRY], key);
};
// 4.4.9
Registry.prototype.delete = function (key) {
  if (Object.hasOwnProperty.call(this[REGISTRY], key)) {
    delete this[REGISTRY][key];
    return true;
  }
  return false;
};

/*
 * Simple ModuleNamespace Exotic object based on a baseObject
 * We export this for allowing a fast-path for module namespace creation over Module descriptors
 */
// var EVALUATE = createSymbol('evaluate');
var BASE_OBJECT = createSymbol('baseObject');

// 8.3.1 Reflect.Module
/*
 * Best-effort simplified non-spec implementation based on
 * a baseObject referenced via getters.
 *
 * Allows:
 *
 *   loader.registry.set('x', new Module({ default: 'x' }));
 *
 * Optional evaluation function provides experimental Module.evaluate
 * support for non-executed modules in registry.
 */
function ModuleNamespace (baseObject/*, evaluate*/) {
  Object.defineProperty(this, BASE_OBJECT, {
    value: baseObject
  });

  // evaluate defers namespace population
  /* if (evaluate) {
    Object.defineProperty(this, EVALUATE, {
      value: evaluate,
      configurable: true,
      writable: true
    });
  }
  else { */
    Object.keys(baseObject).forEach(extendNamespace, this);
  //}
}
// 8.4.2
ModuleNamespace.prototype = Object.create(null);

if (typeof Symbol !== 'undefined' && Symbol.toStringTag)
  Object.defineProperty(ModuleNamespace.prototype, Symbol.toStringTag, {
    value: 'Module'
  });

function extendNamespace (key) {
  Object.defineProperty(this, key, {
    enumerable: true,
    get: function () {
      return this[BASE_OBJECT][key];
    }
  });
}

/* function doEvaluate (evaluate, context) {
  try {
    evaluate.call(context);
  }
  catch (e) {
    return e;
  }
}

// 8.4.1 Module.evaluate... not documented or used because this is potentially unstable
Module.evaluate = function (ns) {
  var evaluate = ns[EVALUATE];
  if (evaluate) {
    ns[EVALUATE] = undefined;
    var err = doEvaluate(evaluate);
    if (err) {
      // cache the error
      ns[EVALUATE] = function () {
        throw err;
      };
      throw err;
    }
    Object.keys(ns[BASE_OBJECT]).forEach(extendNamespace, ns);
  }
  // make chainable
  return ns;
}; */

/*
 * Register Loader
 *
 * Builds directly on top of loader polyfill to provide:
 * - loader.register support
 * - hookable higher-level resolve
 * - instantiate hook returning a ModuleNamespace or undefined for es module loading
 * - loader error behaviour as in HTML and loader specs, caching load and eval errors separately
 * - build tracing support by providing a .trace=true and .loads object format
 */

var REGISTER_INTERNAL = createSymbol('register-internal');

function RegisterLoader$1 () {
  Loader.call(this);

  var registryDelete = this.registry.delete;
  this.registry.delete = function (key) {
    var deleted = registryDelete.call(this, key);

    // also delete from register registry if linked
    if (records.hasOwnProperty(key) && !records[key].linkRecord) {
      delete records[key];
      deleted = true;
    }

    return deleted;
  };

  var records = {};

  this[REGISTER_INTERNAL] = {
    // last anonymous System.register call
    lastRegister: undefined,
    // in-flight es module load records
    records: records
  };

  // tracing
  this.trace = false;
}

RegisterLoader$1.prototype = Object.create(Loader.prototype);
RegisterLoader$1.prototype.constructor = RegisterLoader$1;

var INSTANTIATE = RegisterLoader$1.instantiate = createSymbol('instantiate');

// default normalize is the WhatWG style normalizer
RegisterLoader$1.prototype[RegisterLoader$1.resolve = Loader.resolve] = function (key, parentKey) {
  return resolveIfNotPlain(key, parentKey || baseURI);
};

RegisterLoader$1.prototype[INSTANTIATE] = function (key, processAnonRegister) {};

// once evaluated, the linkRecord is set to undefined leaving just the other load record properties
// this allows tracking new binding listeners for es modules through importerSetters
// for dynamic modules, the load record is removed entirely.
function createLoadRecord (state, key, registration) {
  return state.records[key] = {
    key: key,

    // defined System.register cache
    registration: registration,

    // module namespace object
    module: undefined,

    // es-only
    // this sticks around so new module loads can listen to binding changes
    // for already-loaded modules by adding themselves to their importerSetters
    importerSetters: undefined,

    loadError: undefined,
    evalError: undefined,

    // in-flight linking record
    linkRecord: {
      // promise for instantiated
      instantiatePromise: undefined,
      dependencies: undefined,
      execute: undefined,
      executingRequire: false,

      // underlying module object bindings
      moduleObj: undefined,

      // es only, also indicates if es or not
      setters: undefined,

      // promise for instantiated dependencies (dependencyInstantiations populated)
      depsInstantiatePromise: undefined,
      // will be the array of dependency load record or a module namespace
      dependencyInstantiations: undefined,

      // NB optimization and way of ensuring module objects in setters
      // indicates setters which should run pre-execution of that dependency
      // setters is then just for completely executed module objects
      // alternatively we just pass the partially filled module objects as
      // arguments into the execute function
      // hoisted: undefined
    }
  };
}

RegisterLoader$1.prototype[Loader.resolveInstantiate] = function (key, parentKey) {
  var loader = this;
  var state = this[REGISTER_INTERNAL];
  var registry = this.registry[REGISTRY];

  return resolveInstantiate(loader, key, parentKey, registry, state)
  .then(function (instantiated) {
    if (instantiated instanceof ModuleNamespace)
      return instantiated;

    // resolveInstantiate always returns a load record with a link record and no module value
    var link = instantiated.linkRecord;

    // if already beaten to done, return
    if (!link) {
      if (instantiated.module)
        return instantiated.module;
      throw instantiated.evalError;
    }

    return deepInstantiateDeps(loader, instantiated, link, registry, state)
    .then(function () {
      return ensureEvaluate(loader, instantiated, link, registry, state, undefined);
    });
  });
};

function resolveInstantiate (loader, key, parentKey, registry, state) {
  // normalization shortpath for already-normalized key
  // could add a plain name filter, but doesn't yet seem necessary for perf
  var module = registry[key];
  if (module)
    return Promise.resolve(module);

  var load = state.records[key];

  // already linked but not in main registry is ignored
  if (load && !load.module) {
    if (load.loadError)
      return Promise.reject(load.loadError);
    return instantiate(loader, load, load.linkRecord, registry, state);
  }

  return loader.resolve(key, parentKey)
  .then(function (resolvedKey) {
    // main loader registry always takes preference
    module = registry[resolvedKey];
    if (module)
      return module;

    load = state.records[resolvedKey];

    // already has a module value but not already in the registry (load.module)
    // means it was removed by registry.delete, so we should
    // disgard the current load record creating a new one over it
    // but keep any existing registration
    if (!load || load.module)
      load = createLoadRecord(state, resolvedKey, load && load.registration);

    if (load.loadError)
      return Promise.reject(load.loadError);

    var link = load.linkRecord;
    if (!link)
      return load;

    return instantiate(loader, load, link, registry, state);
  });
}

function createProcessAnonRegister (loader, load, state) {
  return function () {
    var lastRegister = state.lastRegister;

    if (!lastRegister)
      return !!load.registration;

    state.lastRegister = undefined;
    load.registration = lastRegister;

    return true;
  };
}

function instantiate (loader, load, link, registry, state) {
  return link.instantiatePromise || (link.instantiatePromise =
  // if there is already an existing registration, skip running instantiate
  (load.registration ? Promise.resolve() : Promise.resolve().then(function () {
    state.lastRegister = undefined;
    return loader[INSTANTIATE](load.key, loader[INSTANTIATE].length > 1 && createProcessAnonRegister(loader, load, state));
  }))
  .then(function (instantiation) {
    // direct module return from instantiate -> we're done
    if (instantiation !== undefined) {
      if (!(instantiation instanceof ModuleNamespace))
        throw new TypeError('Instantiate did not return a valid Module object.');

      delete state.records[load.key];
      if (loader.trace)
        traceLoad(loader, load, link);
      return registry[load.key] = instantiation;
    }

    // run the cached loader.register declaration if there is one
    var registration = load.registration;
    // clear to allow new registrations for future loads (combined with registry delete)
    load.registration = undefined;
    if (!registration)
      throw new TypeError('Module instantiation did not call an anonymous or correctly named System.register.');

    link.dependencies = registration[0];

    load.importerSetters = [];

    link.moduleObj = {};

    // process System.registerDynamic declaration
    if (registration[2]) {
      link.moduleObj.default = link.moduleObj.__useDefault = {};
      link.executingRequire = registration[1];
      link.execute = registration[2];
    }

    // process System.register declaration
    else {
      registerDeclarative(loader, load, link, registration[1]);
    }

    return load;
  })
  .catch(function (err) {
    load.linkRecord = undefined;
    throw load.loadError = load.loadError || LoaderError__Check_error_message_for_loader_stack(err, 'Instantiating ' + load.key);
  }));
}

// like resolveInstantiate, but returning load records for linking
function resolveInstantiateDep (loader, key, parentKey, registry, state, traceDepMap) {
  // normalization shortpaths for already-normalized key
  // DISABLED to prioritise consistent resolver calls
  // could add a plain name filter, but doesn't yet seem necessary for perf
  /* var load = state.records[key];
  var module = registry[key];

  if (module) {
    if (traceDepMap)
      traceDepMap[key] = key;

    // registry authority check in case module was deleted or replaced in main registry
    if (load && load.module && load.module === module)
      return load;
    else
      return module;
  }

  // already linked but not in main registry is ignored
  if (load && !load.module) {
    if (traceDepMap)
      traceDepMap[key] = key;
    return instantiate(loader, load, load.linkRecord, registry, state);
  } */
  return loader.resolve(key, parentKey)
  .then(function (resolvedKey) {
    if (traceDepMap)
      traceDepMap[key] = resolvedKey;

    // normalization shortpaths for already-normalized key
    var load = state.records[resolvedKey];
    var module = registry[resolvedKey];

    // main loader registry always takes preference
    if (module && (!load || load.module && module !== load.module))
      return module;

    if (load && load.loadError)
      throw load.loadError;

    // already has a module value but not already in the registry (load.module)
    // means it was removed by registry.delete, so we should
    // disgard the current load record creating a new one over it
    // but keep any existing registration
    if (!load || !module && load.module)
      load = createLoadRecord(state, resolvedKey, load && load.registration);

    var link = load.linkRecord;
    if (!link)
      return load;

    return instantiate(loader, load, link, registry, state);
  });
}

function traceLoad (loader, load, link) {
  loader.loads = loader.loads || {};
  loader.loads[load.key] = {
    key: load.key,
    deps: link.dependencies,
    dynamicDeps: [],
    depMap: link.depMap || {}
  };
}

/*
 * Convert a CJS module.exports into a valid object for new Module:
 *
 *   new Module(getEsModule(module.exports))
 *
 * Sets the default value to the module, while also reading off named exports carefully.
 */
function registerDeclarative (loader, load, link, declare) {
  var moduleObj = link.moduleObj;
  var importerSetters = load.importerSetters;

  var definedExports = false;

  // closure especially not based on link to allow link record disposal
  var declared = declare.call(envGlobal, function (name, value) {
    if (typeof name === 'object') {
      var changed = false;
      for (var p in name) {
        value = name[p];
        if (p !== '__useDefault' && (!(p in moduleObj) || moduleObj[p] !== value)) {
          changed = true;
          moduleObj[p] = value;
        }
      }
      if (changed === false)
        return value;
    }
    else {
      if ((definedExports || name in moduleObj) && moduleObj[name] === value)
        return value;
      moduleObj[name] = value;
    }

    for (var i = 0; i < importerSetters.length; i++)
      importerSetters[i](moduleObj);

    return value;
  }, new ContextualLoader(loader, load.key));

  link.setters = declared.setters;
  link.execute = declared.execute;
  if (declared.exports) {
    link.moduleObj = moduleObj = declared.exports;
    definedExports = true;
  }
}

function instantiateDeps (loader, load, link, registry, state) {
  if (link.depsInstantiatePromise)
    return link.depsInstantiatePromise;

  var depsInstantiatePromises = Array(link.dependencies.length);

  for (var i = 0; i < link.dependencies.length; i++)
    depsInstantiatePromises[i] = resolveInstantiateDep(loader, link.dependencies[i], load.key, registry, state, loader.trace && link.depMap || (link.depMap = {}));

  var depsInstantiatePromise = Promise.all(depsInstantiatePromises)
  .then(function (dependencyInstantiations) {
    link.dependencyInstantiations = dependencyInstantiations;

    // run setters to set up bindings to instantiated dependencies
    if (link.setters) {
      for (var i = 0; i < dependencyInstantiations.length; i++) {
        var setter = link.setters[i];
        if (setter) {
          var instantiation = dependencyInstantiations[i];

          if (instantiation instanceof ModuleNamespace) {
            setter(instantiation);
          }
          else {
            if (instantiation.loadError)
              throw instantiation.loadError;
            setter(instantiation.module || instantiation.linkRecord.moduleObj);
            // this applies to both es and dynamic registrations
            if (instantiation.importerSetters)
              instantiation.importerSetters.push(setter);
          }
        }
      }
    }

    return load;
  });

  if (loader.trace)
    depsInstantiatePromise = depsInstantiatePromise.then(function () {
      traceLoad(loader, load, link);
      return load;
    });

  depsInstantiatePromise = depsInstantiatePromise.catch(function (err) {
    // throw up the instantiateDeps stack
    link.depsInstantiatePromise = undefined;
    throw LoaderError__Check_error_message_for_loader_stack(err, 'Loading ' + load.key);
  });

  depsInstantiatePromise.catch(function () {});

  return link.depsInstantiatePromise = depsInstantiatePromise;
}

function deepInstantiateDeps (loader, load, link, registry, state) {
  return new Promise(function (resolve, reject) {
    var seen = [];
    var loadCnt = 0;
    function queueLoad (load) {
      var link = load.linkRecord;
      if (!link)
        return;

      if (seen.indexOf(load) !== -1)
        return;
      seen.push(load);

      loadCnt++;
      instantiateDeps(loader, load, link, registry, state)
      .then(processLoad, reject);
    }
    function processLoad (load) {
      loadCnt--;
      var link = load.linkRecord;
      if (link) {
        for (var i = 0; i < link.dependencies.length; i++) {
          var depLoad = link.dependencyInstantiations[i];
          if (!(depLoad instanceof ModuleNamespace))
            queueLoad(depLoad);
        }
      }
      if (loadCnt === 0)
        resolve();
    }
    queueLoad(load);
  });
}

/*
 * System.register
 */
RegisterLoader$1.prototype.register = function (key, deps, declare) {
  var state = this[REGISTER_INTERNAL];

  // anonymous modules get stored as lastAnon
  if (declare === undefined) {
    state.lastRegister = [key, deps, undefined];
  }

  // everything else registers into the register cache
  else {
    var load = state.records[key] || createLoadRecord(state, key, undefined);
    load.registration = [deps, declare, undefined];
  }
};

RegisterLoader$1.prototype.listKeys = function () {
  const state = this[REGISTER_INTERNAL];
  const result = [];
  for (var key in state.records) {
    result.push(key);
  }
  return result;
};

/*
 * System.registerDyanmic
 */
RegisterLoader$1.prototype.registerDynamic = function (key, deps, executingRequire, execute) {
  var state = this[REGISTER_INTERNAL];

  // anonymous modules get stored as lastAnon
  if (typeof key !== 'string') {
    state.lastRegister = [key, deps, executingRequire];
  }

  // everything else registers into the register cache
  else {
    var load = state.records[key] || createLoadRecord(state, key, undefined);
    load.registration = [deps, executingRequire, execute];
  }
};

// ContextualLoader class
// backwards-compatible with previous System.register context argument by exposing .id, .key
function ContextualLoader (loader, key) {
  this.loader = loader;
  this.key = this.id = key;
  this.meta = {
    url: key
    // scriptElement: null
  };
}
/*ContextualLoader.prototype.constructor = function () {
  throw new TypeError('Cannot subclass the contextual loader only Reflect.Loader.');
};*/
ContextualLoader.prototype.import = function (key) {
  if (this.loader.trace)
    this.loader.loads[this.key].dynamicDeps.push(key);
  return this.loader.import(key, this.key);
};
/*ContextualLoader.prototype.resolve = function (key) {
  return this.loader.resolve(key, this.key);
};*/

// this is the execution function bound to the Module namespace record
function ensureEvaluate (loader, load, link, registry, state, seen) {
  if (load.module)
    return load.module;

  if (load.evalError)
    throw load.evalError;

  if (seen && seen.indexOf(load) !== -1)
    return load.linkRecord.moduleObj;

  // for ES loads we always run ensureEvaluate on top-level, so empty seen is passed regardless
  // for dynamic loads, we pass seen if also dynamic
  var err = doEvaluate(loader, load, link, registry, state, link.setters ? [] : seen || []);
  if (err)
    throw err;

  return load.module;
}

function makeDynamicRequire (loader, key, dependencies, dependencyInstantiations, registry, state, seen) {
  // we can only require from already-known dependencies
  return function (name) {
    for (var i = 0; i < dependencies.length; i++) {
      if (dependencies[i] === name) {
        var depLoad = dependencyInstantiations[i];
        var module;

        if (depLoad instanceof ModuleNamespace)
          module = depLoad;
        else
          module = ensureEvaluate(loader, depLoad, depLoad.linkRecord, registry, state, seen);

        return '__useDefault' in module ? module.__useDefault : module;
      }
    }
    throw new Error('Module ' + name + ' not declared as a System.registerDynamic dependency of ' + key);
  };
}

// ensures the given es load is evaluated
// returns the error if any
function doEvaluate (loader, load, link, registry, state, seen) {
  seen.push(load);

  var err;

  // es modules evaluate dependencies first
  // non es modules explicitly call moduleEvaluate through require
  if (link.setters) {
    var depLoad, depLink;
    for (var i = 0; i < link.dependencies.length; i++) {
      depLoad = link.dependencyInstantiations[i];

      if (depLoad instanceof ModuleNamespace)
        continue;

      // custom Module returned from instantiate
      depLink = depLoad.linkRecord;
      if (depLink && seen.indexOf(depLoad) === -1) {
        if (depLoad.evalError)
          err = depLoad.evalError;
        else
          // dynamic / declarative boundaries clear the "seen" list
          // we just let cross format circular throw as would happen in real implementations
          err = doEvaluate(loader, depLoad, depLink, registry, state, depLink.setters ? seen : []);
      }

      if (err) {
        load.linkRecord = undefined;
        load.evalError = LoaderError__Check_error_message_for_loader_stack(err, 'Evaluating ' + load.key);
        return load.evalError;
      }
    }
  }

  // link.execute won't exist for Module returns from instantiate on top-level load
  if (link.execute) {
    // ES System.register execute
    // "this" is null in ES
    if (link.setters) {
      err = declarativeExecute(link.execute);
    }
    // System.registerDynamic execute
    // "this" is "exports" in CJS
    else {
      var module = { id: load.key };
      var moduleObj = link.moduleObj;
      Object.defineProperty(module, 'exports', {
        configurable: true,
        set: function (exports) {
          moduleObj.default = moduleObj.__useDefault = exports;
        },
        get: function () {
          return moduleObj.__useDefault;
        }
      });

      var require = makeDynamicRequire(loader, load.key, link.dependencies, link.dependencyInstantiations, registry, state, seen);

      // evaluate deps first
      if (!link.executingRequire)
        for (var i = 0; i < link.dependencies.length; i++)
          require(link.dependencies[i]);

      err = dynamicExecute(link.execute, require, moduleObj.default, module);

      // pick up defineProperty calls to module.exports when we can
      if (module.exports !== moduleObj.__useDefault)
        moduleObj.default = moduleObj.__useDefault = module.exports;

      var moduleDefault = moduleObj.default;

      // __esModule flag extension support via lifting
      if (moduleDefault && moduleDefault.__esModule) {
        for (var p in moduleDefault) {
          if (Object.hasOwnProperty.call(moduleDefault, p))
            moduleObj[p] = moduleDefault[p];
        }
      }
    }
  }

  // dispose link record
  load.linkRecord = undefined;

  if (err)
    return load.evalError = LoaderError__Check_error_message_for_loader_stack(err, 'Evaluating ' + load.key);

  registry[load.key] = load.module = new ModuleNamespace(link.moduleObj);

  // if not an esm module, run importer setters and clear them
  // this allows dynamic modules to update themselves into es modules
  // as soon as execution has completed
  if (!link.setters) {
    if (load.importerSetters)
      for (var i = 0; i < load.importerSetters.length; i++)
        load.importerSetters[i](load.module);
    load.importerSetters = undefined;
  }
}

// {} is the closest we can get to call(undefined)
var nullContext = {};
if (Object.freeze)
  Object.freeze(nullContext);

function declarativeExecute (execute) {
  try {
    execute.call(nullContext);
  }
  catch (e) {
    return e;
  }
}

function dynamicExecute (execute, require, exports, module) {
  try {
    var output = execute.call(envGlobal, require, exports, module);
    if (output !== undefined)
      module.exports = output;
  }
  catch (e) {
    return e;
  }
}

var resolvedPromise = Promise.resolve();
function noop () {}

var emptyModule = new ModuleNamespace({});



var hasStringTag;
function isModule (m) {
  if (hasStringTag === undefined)
    hasStringTag = typeof Symbol !== 'undefined' && !!Symbol.toStringTag;
  return m instanceof ModuleNamespace || hasStringTag && Object.prototype.toString.call(m) == '[object Module]';
}

var CONFIG = createSymbol('loader-config');

var PLAIN_RESOLVE = createSymbol('plain-resolve');
var PLAIN_RESOLVE_SYNC = createSymbol('plain-resolve-sync');

var isWorker = typeof window === 'undefined' && typeof self !== 'undefined' && typeof importScripts !== 'undefined';







function extend (a, b) {
  for (var p in b) {
    if (!Object.hasOwnProperty.call(b, p))
      continue;
    a[p] = b[p];
  }
  return a;
}



// meta first-level extends where:
// array + array appends
// object + object extends
// other properties replace


var supportsPreload = false;
var supportsPrefetch = false;
if (isBrowser)
  (function () {
    var relList = document.createElement('link').relList;
    if (relList && relList.supports) {
      supportsPrefetch = true;
      try {
        supportsPreload = relList.supports('preload');
      }
      catch (e) {}
    }
  })();

function preloadScript (url) {
  // fallback to old fashioned image technique which still works in safari
  if (!supportsPreload && !supportsPrefetch) {
    var preloadImage = new Image();
    preloadImage.src = url;
    return;
  }

  var link = document.createElement('link');
  if (supportsPreload) {
    link.rel = 'preload';
    link.as = 'script';
  }
  else {
    // this works for all except Safari (detected by relList.supports lacking)
    link.rel = 'prefetch';
  }
  link.href = url;
  document.head.appendChild(link);
}

function workerImport (src, resolve, reject) {
  try {
    importScripts(src);
  }
  catch (e) {
    reject(e);
  }
  resolve();
}

if (isBrowser) {
  var onerror = window.onerror;
  window.onerror = function globalOnerror (msg, src) {
    if (onerror)
      onerror.apply(this, arguments);
  };
}

function scriptLoad (src, crossOrigin, integrity, resolve, reject) {
  // percent encode just "#" for HTTP requests
  src = src.replace(/#/g, '%23');

  // subresource integrity is not supported in web workers
  if (isWorker)
    return workerImport(src, resolve, reject);

  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.async = true;

  if (crossOrigin)
    script.crossOrigin = crossOrigin;
  if (integrity)
    script.integrity = integrity;

  script.addEventListener('load', load, false);
  script.addEventListener('error', error, false);

  script.src = src;
  document.head.appendChild(script);

  function load () {
    resolve();
    cleanup();
  }

  // note this does not catch execution errors
  function error (err) {
    cleanup();
    reject(new Error('Fetching ' + src));
  }

  function cleanup () {
    script.removeEventListener('load', load, false);
    script.removeEventListener('error', error, false);
    document.head.removeChild(script);
  }
}



// separate out paths cache as a baseURL lock process
function applyPaths (baseURL, paths, key) {
  var mapMatch = getMapMatch(paths, key);
  if (mapMatch) {
    var target = paths[mapMatch] + key.substr(mapMatch.length);

    var resolved = resolveIfNotPlain(target, baseURI);
    if (resolved !== undefined)
      return resolved;

    return baseURL + target;
  }
  else if (key.indexOf(':') !== -1) {
    return key;
  }
  else {
    return baseURL + key;
  }
}

function checkMap (p) {
  var name = this.name;
  // can add ':' here if we want paths to match the behaviour of map
  if (name.substr(0, p.length) === p && (name.length === p.length || name[p.length] === '/' || p[p.length - 1] === '/' || p[p.length - 1] === ':')) {
    var curLen = p.split('/').length;
    if (curLen > this.len) {
      this.match = p;
      this.len = curLen;
    }
  }
}

function getMapMatch (map, name) {
  if (Object.hasOwnProperty.call(map, name))
    return name;

  var bestMatch = {
    name: name,
    match: undefined,
    len: 0
  };

  Object.keys(map).forEach(checkMap, bestMatch);

  return bestMatch.match;
}

// RegEx adjusted from https://github.com/jbrantly/yabble/blob/master/lib/yabble.js#L339

function setAmdHelper (loader) {

  /*
    AMD-compatible require
    To copy RequireJS, set window.require = window.requirejs = loader.amdRequire
  */
  function require (names, callback, errback, referer) {
    // in amd, first arg can be a config object... we just ignore
    if (typeof names === 'object' && !(names instanceof Array))
      return require.apply(null, Array.prototype.splice.call(arguments, 1, arguments.length - 1));

    // amd require
    if (typeof names === 'string' && typeof callback === 'function')
      names = [names];
    if (names instanceof Array) {
      var dynamicRequires = [];
      for (var i = 0; i < names.length; i++)
        dynamicRequires.push(loader.import(names[i], referer));
      Promise.all(dynamicRequires).then(function (modules) {
        if (callback)
          callback.apply(null, modules);
      }, errback);
    }

    // commonjs require
    else if (typeof names === 'string') {
      var normalized = loader.decanonicalize(names, referer);
      var module = loader.get(normalized);
      if (!module)
        throw new Error('Module not already loaded loading "' + names + '" as ' + normalized + (referer ? ' from "' + referer + '".' : '.'));
      return '__useDefault' in module ? module.__useDefault : module;
    }

    else
      throw new TypeError('Invalid require');
  }

  function define (name, deps, factory) {
    if (typeof name !== 'string') {
      factory = deps;
      deps = name;
      name = null;
    }

    if (!(deps instanceof Array)) {
      factory = deps;
      deps = ['require', 'exports', 'module'].splice(0, factory.length);
    }

    if (typeof factory !== 'function')
      factory = (function (factory) {
        return function() { return factory; }
      })(factory);

    if (!name) {
      if (curMetaDeps) {
        deps = deps.concat(curMetaDeps);
        curMetaDeps = undefined;
      }
    }

    // remove system dependencies
    var requireIndex, exportsIndex, moduleIndex;

    if ((requireIndex = deps.indexOf('require')) !== -1) {

      deps.splice(requireIndex, 1);

      // only trace cjs requires for non-named
      // named defines assume the trace has already been done
      if (!name)
        deps = deps.concat(amdGetCJSDeps(factory.toString(), requireIndex));
    }

    if ((exportsIndex = deps.indexOf('exports')) !== -1)
      deps.splice(exportsIndex, 1);

    if ((moduleIndex = deps.indexOf('module')) !== -1)
      deps.splice(moduleIndex, 1);

    function execute (req, exports, module) {
      var depValues = [];
      for (var i = 0; i < deps.length; i++)
        depValues.push(req(deps[i]));

      module.uri = module.id;

      module.config = noop;

      // add back in system dependencies
      if (moduleIndex !== -1)
        depValues.splice(moduleIndex, 0, module);

      if (exportsIndex !== -1)
        depValues.splice(exportsIndex, 0, exports);

      if (requireIndex !== -1) {
        var contextualRequire = function (names, callback, errback) {
          if (typeof names === 'string' && typeof callback !== 'function')
            return req(names);
          return require.call(loader, names, callback, errback, module.id);
        };
        contextualRequire.toUrl = function (name) {
          return loader.normalizeSync(name, module.id);
        };
        depValues.splice(requireIndex, 0, contextualRequire);
      }

      // set global require to AMD require
      var curRequire = envGlobal.require;
      envGlobal.require = require;

      var output = factory.apply(exportsIndex === -1 ? envGlobal : exports, depValues);

      envGlobal.require = curRequire;

      if (typeof output !== 'undefined')
        module.exports = output;
    }

    // anonymous define
    if (!name) {
      loader.registerDynamic(deps, false, curEsModule ? wrapEsModuleExecute(execute) : execute);
    }
    else {
      loader.registerDynamic(name, deps, false, execute);

      // if we don't have any other defines,
      // then let this be an anonymous define
      // this is just to support single modules of the form:
      // define('jquery')
      // still loading anonymously
      // because it is done widely enough to be useful
      // as soon as there is more than one define, this gets removed though
      if (lastNamedDefine) {
        lastNamedDefine = undefined;
        multipleNamedDefines = true;
      }
      else if (!multipleNamedDefines) {
        lastNamedDefine = [deps, execute];
      }
    }
  }
  define.amd = {};

  loader.amdDefine = define;
  loader.amdRequire = require;
}

// CJS
var windowOrigin;
if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.location)
  windowOrigin = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');





var commentRegEx = /(^|[^\\])(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
// extract CJS dependencies from source text via regex static analysis
// read require('x') statements not in comments or strings


// Global
// bare minimum ignores
var ignoredGlobalProps = ['_g', 'sessionStorage', 'localStorage', 'clipboardData', 'frames', 'frameElement', 'external',
  'mozAnimationStartTime', 'webkitStorageInfo', 'webkitIndexedDB', 'mozInnerScreenY', 'mozInnerScreenX'];

function globalIterator (globalName) {
  if (ignoredGlobalProps.indexOf(globalName) !== -1)
    return;
  try {
    var value = envGlobal[globalName];
  }
  catch (e) {
    ignoredGlobalProps.push(globalName);
  }
  this(globalName, value);
}





// AMD
var cjsRequirePre = "(?:^|[^$_a-zA-Z\\xA0-\\uFFFF.])";
var cjsRequirePost = "\\s*\\(\\s*(\"([^\"]+)\"|'([^']+)')\\s*\\)";
var fnBracketRegEx = /\(([^\)]*)\)/;
var wsRegEx = /^\s+|\s+$/g;

var requireRegExs = {};

function amdGetCJSDeps(source, requireIndex) {

  // remove comments
  source = source.replace(commentRegEx, '');

  // determine the require alias
  var params = source.match(fnBracketRegEx);
  var requireAlias = (params[1].split(',')[requireIndex] || 'require').replace(wsRegEx, '');

  // find or generate the regex for this requireAlias
  var requireRegEx = requireRegExs[requireAlias] || (requireRegExs[requireAlias] = new RegExp(cjsRequirePre + requireAlias + cjsRequirePost, 'g'));

  requireRegEx.lastIndex = 0;

  var deps = [];

  var match;
  while (match = requireRegEx.exec(source))
    deps.push(match[2] || match[3]);

  return deps;
}

function wrapEsModuleExecute (execute) {
  return function (require, exports, module) {
    execute(require, exports, module);
    exports = module.exports;
    if ((typeof exports === 'object' || typeof exports === 'function') && !('__esModule' in exports))
      Object.defineProperty(module.exports, '__esModule', {
        value: true
      });
  };
}

// generate anonymous define from singular named define
var multipleNamedDefines = false;
var lastNamedDefine;
var curMetaDeps;
var curEsModule = false;

function registerLastDefine (loader) {
  if (lastNamedDefine)
    loader.registerDynamic(curMetaDeps ? lastNamedDefine[0].concat(curMetaDeps) : lastNamedDefine[0],
        false, curEsModule ? wrapEsModuleExecute(lastNamedDefine[1]) : lastNamedDefine[1]);

  // bundles are an empty module
  else if (multipleNamedDefines)
    loader.registerDynamic([], false, noop);
}

function SystemJSProductionLoader$1 () {
  RegisterLoader$1.call(this);

  // internal configuration
  this[CONFIG] = {
    baseURL: baseURI,
    paths: {},
    map: {},
    submap: {},
    depCache: {}
  };

  setAmdHelper(this);
  if (isBrowser)
    envGlobal.define = this.amdDefine;
}

SystemJSProductionLoader$1.plainResolve = PLAIN_RESOLVE;
SystemJSProductionLoader$1.plainResolveSync = PLAIN_RESOLVE_SYNC;

var systemJSPrototype = SystemJSProductionLoader$1.prototype = Object.create(RegisterLoader$1.prototype);

systemJSPrototype.constructor = SystemJSProductionLoader$1;

systemJSPrototype[SystemJSProductionLoader$1.resolve = RegisterLoader$1.resolve] = function (key, parentKey) {
  var resolved = resolveIfNotPlain(key, parentKey || baseURI);
  if (resolved !== undefined)
    return Promise.resolve(resolved);

  // plain resolution
  var loader = this;
  return resolvedPromise
  .then(function () {
    return loader[PLAIN_RESOLVE](key, parentKey);
  })
  .then(function (resolved) {
    resolved = resolved || key;
    // if in the registry then we are done
    if (loader.registry.has(resolved))
      return resolved;

    // then apply paths
    // baseURL is fallback
    var config = loader[CONFIG];
    return applyPaths(config.baseURL, config.paths, resolved);
  });
};

systemJSPrototype.newModule = function (bindings) {
  return new ModuleNamespace(bindings);
};

systemJSPrototype.isModule = isModule;

systemJSPrototype.resolveSync = function (key, parentKey) {
  var resolved = resolveIfNotPlain(key, parentKey || baseURI);
  if (resolved !== undefined)
    return resolved;

  // plain resolution
  resolved = this[PLAIN_RESOLVE_SYNC](key, parentKey) || key;

  if (this.registry.has(resolved))
    return resolved;

  // then apply paths
  var config = this[CONFIG];
  return applyPaths(config.baseURL, config.paths, resolved);
};

systemJSPrototype[PLAIN_RESOLVE] = systemJSPrototype[PLAIN_RESOLVE_SYNC] = plainResolve;

systemJSPrototype[SystemJSProductionLoader$1.instantiate = RegisterLoader$1.instantiate] = coreInstantiate;

systemJSPrototype.config = function (cfg) {
  var config = this[CONFIG];

  if (cfg.baseURL) {
    config.baseURL = resolveIfNotPlain(cfg.baseURL, baseURI) || resolveIfNotPlain('./' + cfg.baseURL, baseURI);
    if (config.baseURL[config.baseURL.length - 1] !== '/')
      config.baseURL += '/';
  }

  if (cfg.paths)
    extend(config.paths, cfg.paths);

  if (cfg.map) {
    var val = cfg.map;
    for (var p in val) {
      if (!Object.hasOwnProperty.call(val, p))
        continue;

      var v = val[p];

      if (typeof v === 'string') {
        config.map[p] = v;
      }

      // object submap
      else {
        // normalize parent with URL and paths only
        var resolvedParent = resolveIfNotPlain(p, baseURI) || applyPaths(config.baseURL, config.paths, p);
        extend(config.submap[resolvedParent] || (config.submap[resolvedParent] = {}), v);
      }
    }
  }

  for (var p in cfg) {
    if (!Object.hasOwnProperty.call(cfg, p))
      continue;

    var val = cfg[p];

    switch (p) {
      case 'baseURL':
      case 'paths':
      case 'map':
      break;

      case 'depCache':
        for (var p in val) {
          if (!Object.hasOwnProperty.call(val, p))
            continue;
          var resolvedParent = this.resolveSync(p, undefined);
          config.depCache[resolvedParent] = (config.depCache[resolvedParent] || []).concat(val[p]);
        }
      break;

      default:
        throw new TypeError('The SystemJS production build does not support the "' + p + '" configuration option.');
    }
  }
};

// getConfig configuration cloning
systemJSPrototype.getConfig = function (name) {
  var config = this[CONFIG];

  var map = {};
  extend(map, config.map);
  for (var p in config.submap) {
    if (!Object.hasOwnProperty.call(config.submap, p))
      continue;
    map[p] = extend({}, config.submap[p]);
  }

  var depCache = {};
  for (var p in config.depCache) {
    if (!Object.hasOwnProperty.call(config.depCache, p))
      continue;
    depCache[p] = [].concat(config.depCache[p]);
  }

  return {
    baseURL: config.baseURL,
    paths: extend({}, config.paths),
    depCache: depCache,
    map: map
  };
};

systemJSPrototype.listKeys = function () {
  return RegisterLoader$1.prototype.listKeys.call(this);
};

// ensure System.register and System.registerDynamic decanonicalize
systemJSPrototype.register = function (key, deps, declare) {
  if (typeof key === 'string')
    key = this.resolveSync(key, undefined);
  return RegisterLoader$1.prototype.register.call(this, key, deps, declare);
};

systemJSPrototype.registerDynamic = function (key, deps, executingRequire, execute) {
  if (typeof key === 'string')
    key = this.resolveSync(key, undefined);
  return RegisterLoader$1.prototype.registerDynamic.call(this, key, deps, executingRequire, execute);
};

function plainResolve (key, parentKey) {
  var config = this[CONFIG];

  // Apply contextual submap
  if (parentKey) {
    var parent = getMapMatch(config.submap, parentKey);
    var submap = config.submap[parent];
    var mapMatch = submap && getMapMatch(submap, key);

    if (mapMatch) {
      var target = submap[mapMatch] + key.substr(mapMatch.length);
      return resolveIfNotPlain(target, parent) || target;
    }
  }

  // Apply global map
  var map = config.map;
  var mapMatch = getMapMatch(map, key);

  if (mapMatch) {
    var target = map[mapMatch] + key.substr(mapMatch.length);
    return resolveIfNotPlain(target, parentKey || config.baseURL) || target;
  }
}

function doScriptLoad (loader, url, processAnonRegister) {

  // store a global snapshot in case it turns out to be global
  globalSnapshot = {};
  Object.keys(envGlobal).forEach(globalIterator, function (name, value) {
    globalSnapshot[name] = value;
  });

  return new Promise(function (resolve, reject) {
    return scriptLoad(url, 'anonymous', undefined, function () {

      // check for System.register call
      var registered = processAnonRegister();
      if (!registered) {
        // no System.register -> support named AMD as anonymous
        registerLastDefine(loader);
        registered = processAnonRegister();

        // still no registration -> attempt a global detection
        if (!registered) {
          loader.registerDynamic([], false, function () {
            return retrieveGlobal();
          });
          processAnonRegister();
        }
      }

      resolve();
    }, reject);
  });
}

var globalSnapshot;
function retrieveGlobal () {
  var globalValue = { __esModule: true };
  var singleGlobal;
  var multipleExports = false;

  Object.keys(envGlobal).forEach(globalIterator, function (name, value) {
    if (globalSnapshot[name] === value)
      return;
    if (value === undefined)
      return;

    globalValue[name] = value;

    if (singleGlobal !== undefined) {
      if (!multipleExports && singleGlobal !== value)
        multipleExports = true;
    }
    else {
      singleGlobal = value;
    }
  });

  // clear global snapshot
  globalSnapshot = undefined;

  return multipleExports ? globalValue : singleGlobal;
}

function coreInstantiate (key, processAnonRegister) {
  var config = this[CONFIG];

  var depCache = config.depCache[key];
  if (depCache) {
    for (var i = 0; i < depCache.length; i++)
      this.resolve(depCache[i], key).then(preloadScript);
  }

  return doScriptLoad(this, key, processAnonRegister);
}

SystemJSProductionLoader$1.prototype.version = "0.21.0 Production";

var System = new SystemJSProductionLoader$1();

// only set the global System on the global in browsers
if (isBrowser || isWorker || setGlobal) {
  envGlobal.SystemJS = System;
  // dont override an existing System global
  if (!envGlobal.System) {
    envGlobal.System = System;
  }
  // rather just extend or set a System.register on the existing System global
  else {
    var register = envGlobal.System.register;
    envGlobal.System.register = function () {
      if (register)
        register.apply(this, arguments);
      System.register.apply(System, arguments);
    };
  }
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = System;

  return System;
}());
//# sourceMappingURL=system-production.src.js.map
