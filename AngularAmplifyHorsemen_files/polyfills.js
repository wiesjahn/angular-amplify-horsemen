// node_modules/zone.js/fesm2015/zone.js
(function(global) {
  const performance = global["performance"];
  function mark(name) {
    performance && performance["mark"] && performance["mark"](name);
  }
  function performanceMeasure(name, label) {
    performance && performance["measure"] && performance["measure"](name, label);
  }
  mark("Zone");
  const symbolPrefix = global["__Zone_symbol_prefix"] || "__zone_symbol__";
  function __symbol__(name) {
    return symbolPrefix + name;
  }
  const checkDuplicate = global[__symbol__("forceDuplicateZoneCheck")] === true;
  if (global["Zone"]) {
    if (checkDuplicate || typeof global["Zone"].__symbol__ !== "function") {
      throw new Error("Zone already loaded.");
    } else {
      return global["Zone"];
    }
  }
  const _Zone = class _Zone {
    static assertZonePatched() {
      if (global["Promise"] !== patches["ZoneAwarePromise"]) {
        throw new Error("Zone.js has detected that ZoneAwarePromise `(window|global).Promise` has been overwritten.\nMost likely cause is that a Promise polyfill has been loaded after Zone.js (Polyfilling Promise api is not necessary when zone.js is loaded. If you must load one, do so before loading zone.js.)");
      }
    }
    static get root() {
      let zone = _Zone.current;
      while (zone.parent) {
        zone = zone.parent;
      }
      return zone;
    }
    static get current() {
      return _currentZoneFrame.zone;
    }
    static get currentTask() {
      return _currentTask;
    }
    // tslint:disable-next-line:require-internal-with-underscore
    static __load_patch(name, fn, ignoreDuplicate = false) {
      if (patches.hasOwnProperty(name)) {
        if (!ignoreDuplicate && checkDuplicate) {
          throw Error("Already loaded patch: " + name);
        }
      } else if (!global["__Zone_disable_" + name]) {
        const perfName = "Zone:" + name;
        mark(perfName);
        patches[name] = fn(global, _Zone, _api);
        performanceMeasure(perfName, perfName);
      }
    }
    get parent() {
      return this._parent;
    }
    get name() {
      return this._name;
    }
    constructor(parent, zoneSpec) {
      this._parent = parent;
      this._name = zoneSpec ? zoneSpec.name || "unnamed" : "<root>";
      this._properties = zoneSpec && zoneSpec.properties || {};
      this._zoneDelegate = new _ZoneDelegate(this, this._parent && this._parent._zoneDelegate, zoneSpec);
    }
    get(key) {
      const zone = this.getZoneWith(key);
      if (zone)
        return zone._properties[key];
    }
    getZoneWith(key) {
      let current = this;
      while (current) {
        if (current._properties.hasOwnProperty(key)) {
          return current;
        }
        current = current._parent;
      }
      return null;
    }
    fork(zoneSpec) {
      if (!zoneSpec)
        throw new Error("ZoneSpec required!");
      return this._zoneDelegate.fork(this, zoneSpec);
    }
    wrap(callback, source) {
      if (typeof callback !== "function") {
        throw new Error("Expecting function got: " + callback);
      }
      const _callback = this._zoneDelegate.intercept(this, callback, source);
      const zone = this;
      return function() {
        return zone.runGuarded(_callback, this, arguments, source);
      };
    }
    run(callback, applyThis, applyArgs, source) {
      _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
      try {
        return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
      } finally {
        _currentZoneFrame = _currentZoneFrame.parent;
      }
    }
    runGuarded(callback, applyThis = null, applyArgs, source) {
      _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
      try {
        try {
          return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
        } catch (error) {
          if (this._zoneDelegate.handleError(this, error)) {
            throw error;
          }
        }
      } finally {
        _currentZoneFrame = _currentZoneFrame.parent;
      }
    }
    runTask(task, applyThis, applyArgs) {
      if (task.zone != this) {
        throw new Error("A task can only be run in the zone of creation! (Creation: " + (task.zone || NO_ZONE).name + "; Execution: " + this.name + ")");
      }
      if (task.state === notScheduled && (task.type === eventTask || task.type === macroTask)) {
        return;
      }
      const reEntryGuard = task.state != running;
      reEntryGuard && task._transitionTo(running, scheduled);
      task.runCount++;
      const previousTask = _currentTask;
      _currentTask = task;
      _currentZoneFrame = { parent: _currentZoneFrame, zone: this };
      try {
        if (task.type == macroTask && task.data && !task.data.isPeriodic) {
          task.cancelFn = void 0;
        }
        try {
          return this._zoneDelegate.invokeTask(this, task, applyThis, applyArgs);
        } catch (error) {
          if (this._zoneDelegate.handleError(this, error)) {
            throw error;
          }
        }
      } finally {
        if (task.state !== notScheduled && task.state !== unknown) {
          if (task.type == eventTask || task.data && task.data.isPeriodic) {
            reEntryGuard && task._transitionTo(scheduled, running);
          } else {
            task.runCount = 0;
            this._updateTaskCount(task, -1);
            reEntryGuard && task._transitionTo(notScheduled, running, notScheduled);
          }
        }
        _currentZoneFrame = _currentZoneFrame.parent;
        _currentTask = previousTask;
      }
    }
    scheduleTask(task) {
      if (task.zone && task.zone !== this) {
        let newZone = this;
        while (newZone) {
          if (newZone === task.zone) {
            throw Error(`can not reschedule task to ${this.name} which is descendants of the original zone ${task.zone.name}`);
          }
          newZone = newZone.parent;
        }
      }
      task._transitionTo(scheduling, notScheduled);
      const zoneDelegates = [];
      task._zoneDelegates = zoneDelegates;
      task._zone = this;
      try {
        task = this._zoneDelegate.scheduleTask(this, task);
      } catch (err) {
        task._transitionTo(unknown, scheduling, notScheduled);
        this._zoneDelegate.handleError(this, err);
        throw err;
      }
      if (task._zoneDelegates === zoneDelegates) {
        this._updateTaskCount(task, 1);
      }
      if (task.state == scheduling) {
        task._transitionTo(scheduled, scheduling);
      }
      return task;
    }
    scheduleMicroTask(source, callback, data, customSchedule) {
      return this.scheduleTask(new ZoneTask(microTask, source, callback, data, customSchedule, void 0));
    }
    scheduleMacroTask(source, callback, data, customSchedule, customCancel) {
      return this.scheduleTask(new ZoneTask(macroTask, source, callback, data, customSchedule, customCancel));
    }
    scheduleEventTask(source, callback, data, customSchedule, customCancel) {
      return this.scheduleTask(new ZoneTask(eventTask, source, callback, data, customSchedule, customCancel));
    }
    cancelTask(task) {
      if (task.zone != this)
        throw new Error("A task can only be cancelled in the zone of creation! (Creation: " + (task.zone || NO_ZONE).name + "; Execution: " + this.name + ")");
      if (task.state !== scheduled && task.state !== running) {
        return;
      }
      task._transitionTo(canceling, scheduled, running);
      try {
        this._zoneDelegate.cancelTask(this, task);
      } catch (err) {
        task._transitionTo(unknown, canceling);
        this._zoneDelegate.handleError(this, err);
        throw err;
      }
      this._updateTaskCount(task, -1);
      task._transitionTo(notScheduled, canceling);
      task.runCount = 0;
      return task;
    }
    _updateTaskCount(task, count) {
      const zoneDelegates = task._zoneDelegates;
      if (count == -1) {
        task._zoneDelegates = null;
      }
      for (let i = 0; i < zoneDelegates.length; i++) {
        zoneDelegates[i]._updateTaskCount(task.type, count);
      }
    }
  };
  _Zone.__symbol__ = __symbol__;
  let Zone2 = _Zone;
  const DELEGATE_ZS = {
    name: "",
    onHasTask: (delegate, _, target, hasTaskState) => delegate.hasTask(target, hasTaskState),
    onScheduleTask: (delegate, _, target, task) => delegate.scheduleTask(target, task),
    onInvokeTask: (delegate, _, target, task, applyThis, applyArgs) => delegate.invokeTask(target, task, applyThis, applyArgs),
    onCancelTask: (delegate, _, target, task) => delegate.cancelTask(target, task)
  };
  class _ZoneDelegate {
    constructor(zone, parentDelegate, zoneSpec) {
      this._taskCounts = { "microTask": 0, "macroTask": 0, "eventTask": 0 };
      this.zone = zone;
      this._parentDelegate = parentDelegate;
      this._forkZS = zoneSpec && (zoneSpec && zoneSpec.onFork ? zoneSpec : parentDelegate._forkZS);
      this._forkDlgt = zoneSpec && (zoneSpec.onFork ? parentDelegate : parentDelegate._forkDlgt);
      this._forkCurrZone = zoneSpec && (zoneSpec.onFork ? this.zone : parentDelegate._forkCurrZone);
      this._interceptZS = zoneSpec && (zoneSpec.onIntercept ? zoneSpec : parentDelegate._interceptZS);
      this._interceptDlgt = zoneSpec && (zoneSpec.onIntercept ? parentDelegate : parentDelegate._interceptDlgt);
      this._interceptCurrZone = zoneSpec && (zoneSpec.onIntercept ? this.zone : parentDelegate._interceptCurrZone);
      this._invokeZS = zoneSpec && (zoneSpec.onInvoke ? zoneSpec : parentDelegate._invokeZS);
      this._invokeDlgt = zoneSpec && (zoneSpec.onInvoke ? parentDelegate : parentDelegate._invokeDlgt);
      this._invokeCurrZone = zoneSpec && (zoneSpec.onInvoke ? this.zone : parentDelegate._invokeCurrZone);
      this._handleErrorZS = zoneSpec && (zoneSpec.onHandleError ? zoneSpec : parentDelegate._handleErrorZS);
      this._handleErrorDlgt = zoneSpec && (zoneSpec.onHandleError ? parentDelegate : parentDelegate._handleErrorDlgt);
      this._handleErrorCurrZone = zoneSpec && (zoneSpec.onHandleError ? this.zone : parentDelegate._handleErrorCurrZone);
      this._scheduleTaskZS = zoneSpec && (zoneSpec.onScheduleTask ? zoneSpec : parentDelegate._scheduleTaskZS);
      this._scheduleTaskDlgt = zoneSpec && (zoneSpec.onScheduleTask ? parentDelegate : parentDelegate._scheduleTaskDlgt);
      this._scheduleTaskCurrZone = zoneSpec && (zoneSpec.onScheduleTask ? this.zone : parentDelegate._scheduleTaskCurrZone);
      this._invokeTaskZS = zoneSpec && (zoneSpec.onInvokeTask ? zoneSpec : parentDelegate._invokeTaskZS);
      this._invokeTaskDlgt = zoneSpec && (zoneSpec.onInvokeTask ? parentDelegate : parentDelegate._invokeTaskDlgt);
      this._invokeTaskCurrZone = zoneSpec && (zoneSpec.onInvokeTask ? this.zone : parentDelegate._invokeTaskCurrZone);
      this._cancelTaskZS = zoneSpec && (zoneSpec.onCancelTask ? zoneSpec : parentDelegate._cancelTaskZS);
      this._cancelTaskDlgt = zoneSpec && (zoneSpec.onCancelTask ? parentDelegate : parentDelegate._cancelTaskDlgt);
      this._cancelTaskCurrZone = zoneSpec && (zoneSpec.onCancelTask ? this.zone : parentDelegate._cancelTaskCurrZone);
      this._hasTaskZS = null;
      this._hasTaskDlgt = null;
      this._hasTaskDlgtOwner = null;
      this._hasTaskCurrZone = null;
      const zoneSpecHasTask = zoneSpec && zoneSpec.onHasTask;
      const parentHasTask = parentDelegate && parentDelegate._hasTaskZS;
      if (zoneSpecHasTask || parentHasTask) {
        this._hasTaskZS = zoneSpecHasTask ? zoneSpec : DELEGATE_ZS;
        this._hasTaskDlgt = parentDelegate;
        this._hasTaskDlgtOwner = this;
        this._hasTaskCurrZone = zone;
        if (!zoneSpec.onScheduleTask) {
          this._scheduleTaskZS = DELEGATE_ZS;
          this._scheduleTaskDlgt = parentDelegate;
          this._scheduleTaskCurrZone = this.zone;
        }
        if (!zoneSpec.onInvokeTask) {
          this._invokeTaskZS = DELEGATE_ZS;
          this._invokeTaskDlgt = parentDelegate;
          this._invokeTaskCurrZone = this.zone;
        }
        if (!zoneSpec.onCancelTask) {
          this._cancelTaskZS = DELEGATE_ZS;
          this._cancelTaskDlgt = parentDelegate;
          this._cancelTaskCurrZone = this.zone;
        }
      }
    }
    fork(targetZone, zoneSpec) {
      return this._forkZS ? this._forkZS.onFork(this._forkDlgt, this.zone, targetZone, zoneSpec) : new Zone2(targetZone, zoneSpec);
    }
    intercept(targetZone, callback, source) {
      return this._interceptZS ? this._interceptZS.onIntercept(this._interceptDlgt, this._interceptCurrZone, targetZone, callback, source) : callback;
    }
    invoke(targetZone, callback, applyThis, applyArgs, source) {
      return this._invokeZS ? this._invokeZS.onInvoke(this._invokeDlgt, this._invokeCurrZone, targetZone, callback, applyThis, applyArgs, source) : callback.apply(applyThis, applyArgs);
    }
    handleError(targetZone, error) {
      return this._handleErrorZS ? this._handleErrorZS.onHandleError(this._handleErrorDlgt, this._handleErrorCurrZone, targetZone, error) : true;
    }
    scheduleTask(targetZone, task) {
      let returnTask = task;
      if (this._scheduleTaskZS) {
        if (this._hasTaskZS) {
          returnTask._zoneDelegates.push(this._hasTaskDlgtOwner);
        }
        returnTask = this._scheduleTaskZS.onScheduleTask(this._scheduleTaskDlgt, this._scheduleTaskCurrZone, targetZone, task);
        if (!returnTask)
          returnTask = task;
      } else {
        if (task.scheduleFn) {
          task.scheduleFn(task);
        } else if (task.type == microTask) {
          scheduleMicroTask(task);
        } else {
          throw new Error("Task is missing scheduleFn.");
        }
      }
      return returnTask;
    }
    invokeTask(targetZone, task, applyThis, applyArgs) {
      return this._invokeTaskZS ? this._invokeTaskZS.onInvokeTask(this._invokeTaskDlgt, this._invokeTaskCurrZone, targetZone, task, applyThis, applyArgs) : task.callback.apply(applyThis, applyArgs);
    }
    cancelTask(targetZone, task) {
      let value;
      if (this._cancelTaskZS) {
        value = this._cancelTaskZS.onCancelTask(this._cancelTaskDlgt, this._cancelTaskCurrZone, targetZone, task);
      } else {
        if (!task.cancelFn) {
          throw Error("Task is not cancelable");
        }
        value = task.cancelFn(task);
      }
      return value;
    }
    hasTask(targetZone, isEmpty) {
      try {
        this._hasTaskZS && this._hasTaskZS.onHasTask(this._hasTaskDlgt, this._hasTaskCurrZone, targetZone, isEmpty);
      } catch (err) {
        this.handleError(targetZone, err);
      }
    }
    // tslint:disable-next-line:require-internal-with-underscore
    _updateTaskCount(type, count) {
      const counts = this._taskCounts;
      const prev = counts[type];
      const next = counts[type] = prev + count;
      if (next < 0) {
        throw new Error("More tasks executed then were scheduled.");
      }
      if (prev == 0 || next == 0) {
        const isEmpty = {
          microTask: counts["microTask"] > 0,
          macroTask: counts["macroTask"] > 0,
          eventTask: counts["eventTask"] > 0,
          change: type
        };
        this.hasTask(this.zone, isEmpty);
      }
    }
  }
  class ZoneTask {
    constructor(type, source, callback, options, scheduleFn, cancelFn) {
      this._zone = null;
      this.runCount = 0;
      this._zoneDelegates = null;
      this._state = "notScheduled";
      this.type = type;
      this.source = source;
      this.data = options;
      this.scheduleFn = scheduleFn;
      this.cancelFn = cancelFn;
      if (!callback) {
        throw new Error("callback is not defined");
      }
      this.callback = callback;
      const self2 = this;
      if (type === eventTask && options && options.useG) {
        this.invoke = ZoneTask.invokeTask;
      } else {
        this.invoke = function() {
          return ZoneTask.invokeTask.call(global, self2, this, arguments);
        };
      }
    }
    static invokeTask(task, target, args) {
      if (!task) {
        task = this;
      }
      _numberOfNestedTaskFrames++;
      try {
        task.runCount++;
        return task.zone.runTask(task, target, args);
      } finally {
        if (_numberOfNestedTaskFrames == 1) {
          drainMicroTaskQueue();
        }
        _numberOfNestedTaskFrames--;
      }
    }
    get zone() {
      return this._zone;
    }
    get state() {
      return this._state;
    }
    cancelScheduleRequest() {
      this._transitionTo(notScheduled, scheduling);
    }
    // tslint:disable-next-line:require-internal-with-underscore
    _transitionTo(toState, fromState1, fromState2) {
      if (this._state === fromState1 || this._state === fromState2) {
        this._state = toState;
        if (toState == notScheduled) {
          this._zoneDelegates = null;
        }
      } else {
        throw new Error(`${this.type} '${this.source}': can not transition to '${toState}', expecting state '${fromState1}'${fromState2 ? " or '" + fromState2 + "'" : ""}, was '${this._state}'.`);
      }
    }
    toString() {
      if (this.data && typeof this.data.handleId !== "undefined") {
        return this.data.handleId.toString();
      } else {
        return Object.prototype.toString.call(this);
      }
    }
    // add toJSON method to prevent cyclic error when
    // call JSON.stringify(zoneTask)
    toJSON() {
      return {
        type: this.type,
        state: this.state,
        source: this.source,
        zone: this.zone.name,
        runCount: this.runCount
      };
    }
  }
  const symbolSetTimeout = __symbol__("setTimeout");
  const symbolPromise = __symbol__("Promise");
  const symbolThen = __symbol__("then");
  let _microTaskQueue = [];
  let _isDrainingMicrotaskQueue = false;
  let nativeMicroTaskQueuePromise;
  function nativeScheduleMicroTask(func) {
    if (!nativeMicroTaskQueuePromise) {
      if (global[symbolPromise]) {
        nativeMicroTaskQueuePromise = global[symbolPromise].resolve(0);
      }
    }
    if (nativeMicroTaskQueuePromise) {
      let nativeThen = nativeMicroTaskQueuePromise[symbolThen];
      if (!nativeThen) {
        nativeThen = nativeMicroTaskQueuePromise["then"];
      }
      nativeThen.call(nativeMicroTaskQueuePromise, func);
    } else {
      global[symbolSetTimeout](func, 0);
    }
  }
  function scheduleMicroTask(task) {
    if (_numberOfNestedTaskFrames === 0 && _microTaskQueue.length === 0) {
      nativeScheduleMicroTask(drainMicroTaskQueue);
    }
    task && _microTaskQueue.push(task);
  }
  function drainMicroTaskQueue() {
    if (!_isDrainingMicrotaskQueue) {
      _isDrainingMicrotaskQueue = true;
      while (_microTaskQueue.length) {
        const queue = _microTaskQueue;
        _microTaskQueue = [];
        for (let i = 0; i < queue.length; i++) {
          const task = queue[i];
          try {
            task.zone.runTask(task, null, null);
          } catch (error) {
            _api.onUnhandledError(error);
          }
        }
      }
      _api.microtaskDrainDone();
      _isDrainingMicrotaskQueue = false;
    }
  }
  const NO_ZONE = { name: "NO ZONE" };
  const notScheduled = "notScheduled", scheduling = "scheduling", scheduled = "scheduled", running = "running", canceling = "canceling", unknown = "unknown";
  const microTask = "microTask", macroTask = "macroTask", eventTask = "eventTask";
  const patches = {};
  const _api = {
    symbol: __symbol__,
    currentZoneFrame: () => _currentZoneFrame,
    onUnhandledError: noop,
    microtaskDrainDone: noop,
    scheduleMicroTask,
    showUncaughtError: () => !Zone2[__symbol__("ignoreConsoleErrorUncaughtError")],
    patchEventTarget: () => [],
    patchOnProperties: noop,
    patchMethod: () => noop,
    bindArguments: () => [],
    patchThen: () => noop,
    patchMacroTask: () => noop,
    patchEventPrototype: () => noop,
    isIEOrEdge: () => false,
    getGlobalObjects: () => void 0,
    ObjectDefineProperty: () => noop,
    ObjectGetOwnPropertyDescriptor: () => void 0,
    ObjectCreate: () => void 0,
    ArraySlice: () => [],
    patchClass: () => noop,
    wrapWithCurrentZone: () => noop,
    filterProperties: () => [],
    attachOriginToPatched: () => noop,
    _redefineProperty: () => noop,
    patchCallbacks: () => noop,
    nativeScheduleMicroTask
  };
  let _currentZoneFrame = { parent: null, zone: new Zone2(null, null) };
  let _currentTask = null;
  let _numberOfNestedTaskFrames = 0;
  function noop() {
  }
  performanceMeasure("Zone", "Zone");
  return global["Zone"] = Zone2;
})(globalThis);
var ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var ObjectDefineProperty = Object.defineProperty;
var ObjectGetPrototypeOf = Object.getPrototypeOf;
var ObjectCreate = Object.create;
var ArraySlice = Array.prototype.slice;
var ADD_EVENT_LISTENER_STR = "addEventListener";
var REMOVE_EVENT_LISTENER_STR = "removeEventListener";
var ZONE_SYMBOL_ADD_EVENT_LISTENER = Zone.__symbol__(ADD_EVENT_LISTENER_STR);
var ZONE_SYMBOL_REMOVE_EVENT_LISTENER = Zone.__symbol__(REMOVE_EVENT_LISTENER_STR);
var TRUE_STR = "true";
var FALSE_STR = "false";
var ZONE_SYMBOL_PREFIX = Zone.__symbol__("");
function wrapWithCurrentZone(callback, source) {
  return Zone.current.wrap(callback, source);
}
function scheduleMacroTaskWithCurrentZone(source, callback, data, customSchedule, customCancel) {
  return Zone.current.scheduleMacroTask(source, callback, data, customSchedule, customCancel);
}
var zoneSymbol = Zone.__symbol__;
var isWindowExists = typeof window !== "undefined";
var internalWindow = isWindowExists ? window : void 0;
var _global = isWindowExists && internalWindow || globalThis;
var REMOVE_ATTRIBUTE = "removeAttribute";
function bindArguments(args, source) {
  for (let i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === "function") {
      args[i] = wrapWithCurrentZone(args[i], source + "_" + i);
    }
  }
  return args;
}
function patchPrototype(prototype, fnNames) {
  const source = prototype.constructor["name"];
  for (let i = 0; i < fnNames.length; i++) {
    const name = fnNames[i];
    const delegate = prototype[name];
    if (delegate) {
      const prototypeDesc = ObjectGetOwnPropertyDescriptor(prototype, name);
      if (!isPropertyWritable(prototypeDesc)) {
        continue;
      }
      prototype[name] = ((delegate2) => {
        const patched = function() {
          return delegate2.apply(this, bindArguments(arguments, source + "." + name));
        };
        attachOriginToPatched(patched, delegate2);
        return patched;
      })(delegate);
    }
  }
}
function isPropertyWritable(propertyDesc) {
  if (!propertyDesc) {
    return true;
  }
  if (propertyDesc.writable === false) {
    return false;
  }
  return !(typeof propertyDesc.get === "function" && typeof propertyDesc.set === "undefined");
}
var isWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
var isNode = !("nw" in _global) && typeof _global.process !== "undefined" && {}.toString.call(_global.process) === "[object process]";
var isBrowser = !isNode && !isWebWorker && !!(isWindowExists && internalWindow["HTMLElement"]);
var isMix = typeof _global.process !== "undefined" && {}.toString.call(_global.process) === "[object process]" && !isWebWorker && !!(isWindowExists && internalWindow["HTMLElement"]);
var zoneSymbolEventNames$1 = {};
var wrapFn = function(event) {
  event = event || _global.event;
  if (!event) {
    return;
  }
  let eventNameSymbol = zoneSymbolEventNames$1[event.type];
  if (!eventNameSymbol) {
    eventNameSymbol = zoneSymbolEventNames$1[event.type] = zoneSymbol("ON_PROPERTY" + event.type);
  }
  const target = this || event.target || _global;
  const listener = target[eventNameSymbol];
  let result;
  if (isBrowser && target === internalWindow && event.type === "error") {
    const errorEvent = event;
    result = listener && listener.call(this, errorEvent.message, errorEvent.filename, errorEvent.lineno, errorEvent.colno, errorEvent.error);
    if (result === true) {
      event.preventDefault();
    }
  } else {
    result = listener && listener.apply(this, arguments);
    if (result != void 0 && !result) {
      event.preventDefault();
    }
  }
  return result;
};
function patchProperty(obj, prop, prototype) {
  let desc = ObjectGetOwnPropertyDescriptor(obj, prop);
  if (!desc && prototype) {
    const prototypeDesc = ObjectGetOwnPropertyDescriptor(prototype, prop);
    if (prototypeDesc) {
      desc = { enumerable: true, configurable: true };
    }
  }
  if (!desc || !desc.configurable) {
    return;
  }
  const onPropPatchedSymbol = zoneSymbol("on" + prop + "patched");
  if (obj.hasOwnProperty(onPropPatchedSymbol) && obj[onPropPatchedSymbol]) {
    return;
  }
  delete desc.writable;
  delete desc.value;
  const originalDescGet = desc.get;
  const originalDescSet = desc.set;
  const eventName = prop.slice(2);
  let eventNameSymbol = zoneSymbolEventNames$1[eventName];
  if (!eventNameSymbol) {
    eventNameSymbol = zoneSymbolEventNames$1[eventName] = zoneSymbol("ON_PROPERTY" + eventName);
  }
  desc.set = function(newValue) {
    let target = this;
    if (!target && obj === _global) {
      target = _global;
    }
    if (!target) {
      return;
    }
    const previousValue = target[eventNameSymbol];
    if (typeof previousValue === "function") {
      target.removeEventListener(eventName, wrapFn);
    }
    originalDescSet && originalDescSet.call(target, null);
    target[eventNameSymbol] = newValue;
    if (typeof newValue === "function") {
      target.addEventListener(eventName, wrapFn, false);
    }
  };
  desc.get = function() {
    let target = this;
    if (!target && obj === _global) {
      target = _global;
    }
    if (!target) {
      return null;
    }
    const listener = target[eventNameSymbol];
    if (listener) {
      return listener;
    } else if (originalDescGet) {
      let value = originalDescGet.call(this);
      if (value) {
        desc.set.call(this, value);
        if (typeof target[REMOVE_ATTRIBUTE] === "function") {
          target.removeAttribute(prop);
        }
        return value;
      }
    }
    return null;
  };
  ObjectDefineProperty(obj, prop, desc);
  obj[onPropPatchedSymbol] = true;
}
function patchOnProperties(obj, properties, prototype) {
  if (properties) {
    for (let i = 0; i < properties.length; i++) {
      patchProperty(obj, "on" + properties[i], prototype);
    }
  } else {
    const onProperties = [];
    for (const prop in obj) {
      if (prop.slice(0, 2) == "on") {
        onProperties.push(prop);
      }
    }
    for (let j = 0; j < onProperties.length; j++) {
      patchProperty(obj, onProperties[j], prototype);
    }
  }
}
var originalInstanceKey = zoneSymbol("originalInstance");
function patchClass(className) {
  const OriginalClass = _global[className];
  if (!OriginalClass)
    return;
  _global[zoneSymbol(className)] = OriginalClass;
  _global[className] = function() {
    const a = bindArguments(arguments, className);
    switch (a.length) {
      case 0:
        this[originalInstanceKey] = new OriginalClass();
        break;
      case 1:
        this[originalInstanceKey] = new OriginalClass(a[0]);
        break;
      case 2:
        this[originalInstanceKey] = new OriginalClass(a[0], a[1]);
        break;
      case 3:
        this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2]);
        break;
      case 4:
        this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2], a[3]);
        break;
      default:
        throw new Error("Arg list too long.");
    }
  };
  attachOriginToPatched(_global[className], OriginalClass);
  const instance = new OriginalClass(function() {
  });
  let prop;
  for (prop in instance) {
    if (className === "XMLHttpRequest" && prop === "responseBlob")
      continue;
    (function(prop2) {
      if (typeof instance[prop2] === "function") {
        _global[className].prototype[prop2] = function() {
          return this[originalInstanceKey][prop2].apply(this[originalInstanceKey], arguments);
        };
      } else {
        ObjectDefineProperty(_global[className].prototype, prop2, {
          set: function(fn) {
            if (typeof fn === "function") {
              this[originalInstanceKey][prop2] = wrapWithCurrentZone(fn, className + "." + prop2);
              attachOriginToPatched(this[originalInstanceKey][prop2], fn);
            } else {
              this[originalInstanceKey][prop2] = fn;
            }
          },
          get: function() {
            return this[originalInstanceKey][prop2];
          }
        });
      }
    })(prop);
  }
  for (prop in OriginalClass) {
    if (prop !== "prototype" && OriginalClass.hasOwnProperty(prop)) {
      _global[className][prop] = OriginalClass[prop];
    }
  }
}
function patchMethod(target, name, patchFn) {
  let proto = target;
  while (proto && !proto.hasOwnProperty(name)) {
    proto = ObjectGetPrototypeOf(proto);
  }
  if (!proto && target[name]) {
    proto = target;
  }
  const delegateName = zoneSymbol(name);
  let delegate = null;
  if (proto && (!(delegate = proto[delegateName]) || !proto.hasOwnProperty(delegateName))) {
    delegate = proto[delegateName] = proto[name];
    const desc = proto && ObjectGetOwnPropertyDescriptor(proto, name);
    if (isPropertyWritable(desc)) {
      const patchDelegate = patchFn(delegate, delegateName, name);
      proto[name] = function() {
        return patchDelegate(this, arguments);
      };
      attachOriginToPatched(proto[name], delegate);
    }
  }
  return delegate;
}
function patchMacroTask(obj, funcName, metaCreator) {
  let setNative = null;
  function scheduleTask(task) {
    const data = task.data;
    data.args[data.cbIdx] = function() {
      task.invoke.apply(this, arguments);
    };
    setNative.apply(data.target, data.args);
    return task;
  }
  setNative = patchMethod(obj, funcName, (delegate) => function(self2, args) {
    const meta = metaCreator(self2, args);
    if (meta.cbIdx >= 0 && typeof args[meta.cbIdx] === "function") {
      return scheduleMacroTaskWithCurrentZone(meta.name, args[meta.cbIdx], meta, scheduleTask);
    } else {
      return delegate.apply(self2, args);
    }
  });
}
function attachOriginToPatched(patched, original) {
  patched[zoneSymbol("OriginalDelegate")] = original;
}
var isDetectedIEOrEdge = false;
var ieOrEdge = false;
function isIE() {
  try {
    const ua = internalWindow.navigator.userAgent;
    if (ua.indexOf("MSIE ") !== -1 || ua.indexOf("Trident/") !== -1) {
      return true;
    }
  } catch (error) {
  }
  return false;
}
function isIEOrEdge() {
  if (isDetectedIEOrEdge) {
    return ieOrEdge;
  }
  isDetectedIEOrEdge = true;
  try {
    const ua = internalWindow.navigator.userAgent;
    if (ua.indexOf("MSIE ") !== -1 || ua.indexOf("Trident/") !== -1 || ua.indexOf("Edge/") !== -1) {
      ieOrEdge = true;
    }
  } catch (error) {
  }
  return ieOrEdge;
}
Zone.__load_patch("ZoneAwarePromise", (global, Zone2, api) => {
  const ObjectGetOwnPropertyDescriptor2 = Object.getOwnPropertyDescriptor;
  const ObjectDefineProperty2 = Object.defineProperty;
  function readableObjectToString(obj) {
    if (obj && obj.toString === Object.prototype.toString) {
      const className = obj.constructor && obj.constructor.name;
      return (className ? className : "") + ": " + JSON.stringify(obj);
    }
    return obj ? obj.toString() : Object.prototype.toString.call(obj);
  }
  const __symbol__ = api.symbol;
  const _uncaughtPromiseErrors = [];
  const isDisableWrappingUncaughtPromiseRejection = global[__symbol__("DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION")] !== false;
  const symbolPromise = __symbol__("Promise");
  const symbolThen = __symbol__("then");
  const creationTrace = "__creationTrace__";
  api.onUnhandledError = (e) => {
    if (api.showUncaughtError()) {
      const rejection = e && e.rejection;
      if (rejection) {
        console.error("Unhandled Promise rejection:", rejection instanceof Error ? rejection.message : rejection, "; Zone:", e.zone.name, "; Task:", e.task && e.task.source, "; Value:", rejection, rejection instanceof Error ? rejection.stack : void 0);
      } else {
        console.error(e);
      }
    }
  };
  api.microtaskDrainDone = () => {
    while (_uncaughtPromiseErrors.length) {
      const uncaughtPromiseError = _uncaughtPromiseErrors.shift();
      try {
        uncaughtPromiseError.zone.runGuarded(() => {
          if (uncaughtPromiseError.throwOriginal) {
            throw uncaughtPromiseError.rejection;
          }
          throw uncaughtPromiseError;
        });
      } catch (error) {
        handleUnhandledRejection(error);
      }
    }
  };
  const UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL = __symbol__("unhandledPromiseRejectionHandler");
  function handleUnhandledRejection(e) {
    api.onUnhandledError(e);
    try {
      const handler = Zone2[UNHANDLED_PROMISE_REJECTION_HANDLER_SYMBOL];
      if (typeof handler === "function") {
        handler.call(this, e);
      }
    } catch (err) {
    }
  }
  function isThenable(value) {
    return value && value.then;
  }
  function forwardResolution(value) {
    return value;
  }
  function forwardRejection(rejection) {
    return ZoneAwarePromise.reject(rejection);
  }
  const symbolState = __symbol__("state");
  const symbolValue = __symbol__("value");
  const symbolFinally = __symbol__("finally");
  const symbolParentPromiseValue = __symbol__("parentPromiseValue");
  const symbolParentPromiseState = __symbol__("parentPromiseState");
  const source = "Promise.then";
  const UNRESOLVED = null;
  const RESOLVED = true;
  const REJECTED = false;
  const REJECTED_NO_CATCH = 0;
  function makeResolver(promise, state) {
    return (v) => {
      try {
        resolvePromise(promise, state, v);
      } catch (err) {
        resolvePromise(promise, false, err);
      }
    };
  }
  const once = function() {
    let wasCalled = false;
    return function wrapper(wrappedFunction) {
      return function() {
        if (wasCalled) {
          return;
        }
        wasCalled = true;
        wrappedFunction.apply(null, arguments);
      };
    };
  };
  const TYPE_ERROR = "Promise resolved with itself";
  const CURRENT_TASK_TRACE_SYMBOL = __symbol__("currentTaskTrace");
  function resolvePromise(promise, state, value) {
    const onceWrapper = once();
    if (promise === value) {
      throw new TypeError(TYPE_ERROR);
    }
    if (promise[symbolState] === UNRESOLVED) {
      let then = null;
      try {
        if (typeof value === "object" || typeof value === "function") {
          then = value && value.then;
        }
      } catch (err) {
        onceWrapper(() => {
          resolvePromise(promise, false, err);
        })();
        return promise;
      }
      if (state !== REJECTED && value instanceof ZoneAwarePromise && value.hasOwnProperty(symbolState) && value.hasOwnProperty(symbolValue) && value[symbolState] !== UNRESOLVED) {
        clearRejectedNoCatch(value);
        resolvePromise(promise, value[symbolState], value[symbolValue]);
      } else if (state !== REJECTED && typeof then === "function") {
        try {
          then.call(value, onceWrapper(makeResolver(promise, state)), onceWrapper(makeResolver(promise, false)));
        } catch (err) {
          onceWrapper(() => {
            resolvePromise(promise, false, err);
          })();
        }
      } else {
        promise[symbolState] = state;
        const queue = promise[symbolValue];
        promise[symbolValue] = value;
        if (promise[symbolFinally] === symbolFinally) {
          if (state === RESOLVED) {
            promise[symbolState] = promise[symbolParentPromiseState];
            promise[symbolValue] = promise[symbolParentPromiseValue];
          }
        }
        if (state === REJECTED && value instanceof Error) {
          const trace = Zone2.currentTask && Zone2.currentTask.data && Zone2.currentTask.data[creationTrace];
          if (trace) {
            ObjectDefineProperty2(value, CURRENT_TASK_TRACE_SYMBOL, { configurable: true, enumerable: false, writable: true, value: trace });
          }
        }
        for (let i = 0; i < queue.length; ) {
          scheduleResolveOrReject(promise, queue[i++], queue[i++], queue[i++], queue[i++]);
        }
        if (queue.length == 0 && state == REJECTED) {
          promise[symbolState] = REJECTED_NO_CATCH;
          let uncaughtPromiseError = value;
          try {
            throw new Error("Uncaught (in promise): " + readableObjectToString(value) + (value && value.stack ? "\n" + value.stack : ""));
          } catch (err) {
            uncaughtPromiseError = err;
          }
          if (isDisableWrappingUncaughtPromiseRejection) {
            uncaughtPromiseError.throwOriginal = true;
          }
          uncaughtPromiseError.rejection = value;
          uncaughtPromiseError.promise = promise;
          uncaughtPromiseError.zone = Zone2.current;
          uncaughtPromiseError.task = Zone2.currentTask;
          _uncaughtPromiseErrors.push(uncaughtPromiseError);
          api.scheduleMicroTask();
        }
      }
    }
    return promise;
  }
  const REJECTION_HANDLED_HANDLER = __symbol__("rejectionHandledHandler");
  function clearRejectedNoCatch(promise) {
    if (promise[symbolState] === REJECTED_NO_CATCH) {
      try {
        const handler = Zone2[REJECTION_HANDLED_HANDLER];
        if (handler && typeof handler === "function") {
          handler.call(this, { rejection: promise[symbolValue], promise });
        }
      } catch (err) {
      }
      promise[symbolState] = REJECTED;
      for (let i = 0; i < _uncaughtPromiseErrors.length; i++) {
        if (promise === _uncaughtPromiseErrors[i].promise) {
          _uncaughtPromiseErrors.splice(i, 1);
        }
      }
    }
  }
  function scheduleResolveOrReject(promise, zone, chainPromise, onFulfilled, onRejected) {
    clearRejectedNoCatch(promise);
    const promiseState = promise[symbolState];
    const delegate = promiseState ? typeof onFulfilled === "function" ? onFulfilled : forwardResolution : typeof onRejected === "function" ? onRejected : forwardRejection;
    zone.scheduleMicroTask(source, () => {
      try {
        const parentPromiseValue = promise[symbolValue];
        const isFinallyPromise = !!chainPromise && symbolFinally === chainPromise[symbolFinally];
        if (isFinallyPromise) {
          chainPromise[symbolParentPromiseValue] = parentPromiseValue;
          chainPromise[symbolParentPromiseState] = promiseState;
        }
        const value = zone.run(delegate, void 0, isFinallyPromise && delegate !== forwardRejection && delegate !== forwardResolution ? [] : [parentPromiseValue]);
        resolvePromise(chainPromise, true, value);
      } catch (error) {
        resolvePromise(chainPromise, false, error);
      }
    }, chainPromise);
  }
  const ZONE_AWARE_PROMISE_TO_STRING = "function ZoneAwarePromise() { [native code] }";
  const noop = function() {
  };
  const AggregateError = global.AggregateError;
  class ZoneAwarePromise {
    static toString() {
      return ZONE_AWARE_PROMISE_TO_STRING;
    }
    static resolve(value) {
      return resolvePromise(new this(null), RESOLVED, value);
    }
    static reject(error) {
      return resolvePromise(new this(null), REJECTED, error);
    }
    static any(values) {
      if (!values || typeof values[Symbol.iterator] !== "function") {
        return Promise.reject(new AggregateError([], "All promises were rejected"));
      }
      const promises = [];
      let count = 0;
      try {
        for (let v of values) {
          count++;
          promises.push(ZoneAwarePromise.resolve(v));
        }
      } catch (err) {
        return Promise.reject(new AggregateError([], "All promises were rejected"));
      }
      if (count === 0) {
        return Promise.reject(new AggregateError([], "All promises were rejected"));
      }
      let finished = false;
      const errors = [];
      return new ZoneAwarePromise((resolve, reject) => {
        for (let i = 0; i < promises.length; i++) {
          promises[i].then((v) => {
            if (finished) {
              return;
            }
            finished = true;
            resolve(v);
          }, (err) => {
            errors.push(err);
            count--;
            if (count === 0) {
              finished = true;
              reject(new AggregateError(errors, "All promises were rejected"));
            }
          });
        }
      });
    }
    static race(values) {
      let resolve;
      let reject;
      let promise = new this((res, rej) => {
        resolve = res;
        reject = rej;
      });
      function onResolve(value) {
        resolve(value);
      }
      function onReject(error) {
        reject(error);
      }
      for (let value of values) {
        if (!isThenable(value)) {
          value = this.resolve(value);
        }
        value.then(onResolve, onReject);
      }
      return promise;
    }
    static all(values) {
      return ZoneAwarePromise.allWithCallback(values);
    }
    static allSettled(values) {
      const P = this && this.prototype instanceof ZoneAwarePromise ? this : ZoneAwarePromise;
      return P.allWithCallback(values, {
        thenCallback: (value) => ({ status: "fulfilled", value }),
        errorCallback: (err) => ({ status: "rejected", reason: err })
      });
    }
    static allWithCallback(values, callback) {
      let resolve;
      let reject;
      let promise = new this((res, rej) => {
        resolve = res;
        reject = rej;
      });
      let unresolvedCount = 2;
      let valueIndex = 0;
      const resolvedValues = [];
      for (let value of values) {
        if (!isThenable(value)) {
          value = this.resolve(value);
        }
        const curValueIndex = valueIndex;
        try {
          value.then((value2) => {
            resolvedValues[curValueIndex] = callback ? callback.thenCallback(value2) : value2;
            unresolvedCount--;
            if (unresolvedCount === 0) {
              resolve(resolvedValues);
            }
          }, (err) => {
            if (!callback) {
              reject(err);
            } else {
              resolvedValues[curValueIndex] = callback.errorCallback(err);
              unresolvedCount--;
              if (unresolvedCount === 0) {
                resolve(resolvedValues);
              }
            }
          });
        } catch (thenErr) {
          reject(thenErr);
        }
        unresolvedCount++;
        valueIndex++;
      }
      unresolvedCount -= 2;
      if (unresolvedCount === 0) {
        resolve(resolvedValues);
      }
      return promise;
    }
    constructor(executor) {
      const promise = this;
      if (!(promise instanceof ZoneAwarePromise)) {
        throw new Error("Must be an instanceof Promise.");
      }
      promise[symbolState] = UNRESOLVED;
      promise[symbolValue] = [];
      try {
        const onceWrapper = once();
        executor && executor(onceWrapper(makeResolver(promise, RESOLVED)), onceWrapper(makeResolver(promise, REJECTED)));
      } catch (error) {
        resolvePromise(promise, false, error);
      }
    }
    get [Symbol.toStringTag]() {
      return "Promise";
    }
    get [Symbol.species]() {
      return ZoneAwarePromise;
    }
    then(onFulfilled, onRejected) {
      let C = this.constructor?.[Symbol.species];
      if (!C || typeof C !== "function") {
        C = this.constructor || ZoneAwarePromise;
      }
      const chainPromise = new C(noop);
      const zone = Zone2.current;
      if (this[symbolState] == UNRESOLVED) {
        this[symbolValue].push(zone, chainPromise, onFulfilled, onRejected);
      } else {
        scheduleResolveOrReject(this, zone, chainPromise, onFulfilled, onRejected);
      }
      return chainPromise;
    }
    catch(onRejected) {
      return this.then(null, onRejected);
    }
    finally(onFinally) {
      let C = this.constructor?.[Symbol.species];
      if (!C || typeof C !== "function") {
        C = ZoneAwarePromise;
      }
      const chainPromise = new C(noop);
      chainPromise[symbolFinally] = symbolFinally;
      const zone = Zone2.current;
      if (this[symbolState] == UNRESOLVED) {
        this[symbolValue].push(zone, chainPromise, onFinally, onFinally);
      } else {
        scheduleResolveOrReject(this, zone, chainPromise, onFinally, onFinally);
      }
      return chainPromise;
    }
  }
  ZoneAwarePromise["resolve"] = ZoneAwarePromise.resolve;
  ZoneAwarePromise["reject"] = ZoneAwarePromise.reject;
  ZoneAwarePromise["race"] = ZoneAwarePromise.race;
  ZoneAwarePromise["all"] = ZoneAwarePromise.all;
  const NativePromise = global[symbolPromise] = global["Promise"];
  global["Promise"] = ZoneAwarePromise;
  const symbolThenPatched = __symbol__("thenPatched");
  function patchThen(Ctor) {
    const proto = Ctor.prototype;
    const prop = ObjectGetOwnPropertyDescriptor2(proto, "then");
    if (prop && (prop.writable === false || !prop.configurable)) {
      return;
    }
    const originalThen = proto.then;
    proto[symbolThen] = originalThen;
    Ctor.prototype.then = function(onResolve, onReject) {
      const wrapped = new ZoneAwarePromise((resolve, reject) => {
        originalThen.call(this, resolve, reject);
      });
      return wrapped.then(onResolve, onReject);
    };
    Ctor[symbolThenPatched] = true;
  }
  api.patchThen = patchThen;
  function zoneify(fn) {
    return function(self2, args) {
      let resultPromise = fn.apply(self2, args);
      if (resultPromise instanceof ZoneAwarePromise) {
        return resultPromise;
      }
      let ctor = resultPromise.constructor;
      if (!ctor[symbolThenPatched]) {
        patchThen(ctor);
      }
      return resultPromise;
    };
  }
  if (NativePromise) {
    patchThen(NativePromise);
    patchMethod(global, "fetch", (delegate) => zoneify(delegate));
  }
  Promise[Zone2.__symbol__("uncaughtPromiseErrors")] = _uncaughtPromiseErrors;
  return ZoneAwarePromise;
});
Zone.__load_patch("toString", (global) => {
  const originalFunctionToString = Function.prototype.toString;
  const ORIGINAL_DELEGATE_SYMBOL = zoneSymbol("OriginalDelegate");
  const PROMISE_SYMBOL = zoneSymbol("Promise");
  const ERROR_SYMBOL = zoneSymbol("Error");
  const newFunctionToString = function toString() {
    if (typeof this === "function") {
      const originalDelegate = this[ORIGINAL_DELEGATE_SYMBOL];
      if (originalDelegate) {
        if (typeof originalDelegate === "function") {
          return originalFunctionToString.call(originalDelegate);
        } else {
          return Object.prototype.toString.call(originalDelegate);
        }
      }
      if (this === Promise) {
        const nativePromise = global[PROMISE_SYMBOL];
        if (nativePromise) {
          return originalFunctionToString.call(nativePromise);
        }
      }
      if (this === Error) {
        const nativeError = global[ERROR_SYMBOL];
        if (nativeError) {
          return originalFunctionToString.call(nativeError);
        }
      }
    }
    return originalFunctionToString.call(this);
  };
  newFunctionToString[ORIGINAL_DELEGATE_SYMBOL] = originalFunctionToString;
  Function.prototype.toString = newFunctionToString;
  const originalObjectToString = Object.prototype.toString;
  const PROMISE_OBJECT_TO_STRING = "[object Promise]";
  Object.prototype.toString = function() {
    if (typeof Promise === "function" && this instanceof Promise) {
      return PROMISE_OBJECT_TO_STRING;
    }
    return originalObjectToString.call(this);
  };
});
var passiveSupported = false;
if (typeof window !== "undefined") {
  try {
    const options = Object.defineProperty({}, "passive", {
      get: function() {
        passiveSupported = true;
      }
    });
    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
  } catch (err) {
    passiveSupported = false;
  }
}
var OPTIMIZED_ZONE_EVENT_TASK_DATA = {
  useG: true
};
var zoneSymbolEventNames = {};
var globalSources = {};
var EVENT_NAME_SYMBOL_REGX = new RegExp("^" + ZONE_SYMBOL_PREFIX + "(\\w+)(true|false)$");
var IMMEDIATE_PROPAGATION_SYMBOL = zoneSymbol("propagationStopped");
function prepareEventNames(eventName, eventNameToString) {
  const falseEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + FALSE_STR;
  const trueEventName = (eventNameToString ? eventNameToString(eventName) : eventName) + TRUE_STR;
  const symbol = ZONE_SYMBOL_PREFIX + falseEventName;
  const symbolCapture = ZONE_SYMBOL_PREFIX + trueEventName;
  zoneSymbolEventNames[eventName] = {};
  zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
  zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
}
function patchEventTarget(_global2, api, apis, patchOptions) {
  const ADD_EVENT_LISTENER = patchOptions && patchOptions.add || ADD_EVENT_LISTENER_STR;
  const REMOVE_EVENT_LISTENER = patchOptions && patchOptions.rm || REMOVE_EVENT_LISTENER_STR;
  const LISTENERS_EVENT_LISTENER = patchOptions && patchOptions.listeners || "eventListeners";
  const REMOVE_ALL_LISTENERS_EVENT_LISTENER = patchOptions && patchOptions.rmAll || "removeAllListeners";
  const zoneSymbolAddEventListener = zoneSymbol(ADD_EVENT_LISTENER);
  const ADD_EVENT_LISTENER_SOURCE = "." + ADD_EVENT_LISTENER + ":";
  const PREPEND_EVENT_LISTENER = "prependListener";
  const PREPEND_EVENT_LISTENER_SOURCE = "." + PREPEND_EVENT_LISTENER + ":";
  const invokeTask = function(task, target, event) {
    if (task.isRemoved) {
      return;
    }
    const delegate = task.callback;
    if (typeof delegate === "object" && delegate.handleEvent) {
      task.callback = (event2) => delegate.handleEvent(event2);
      task.originalDelegate = delegate;
    }
    let error;
    try {
      task.invoke(task, target, [event]);
    } catch (err) {
      error = err;
    }
    const options = task.options;
    if (options && typeof options === "object" && options.once) {
      const delegate2 = task.originalDelegate ? task.originalDelegate : task.callback;
      target[REMOVE_EVENT_LISTENER].call(target, event.type, delegate2, options);
    }
    return error;
  };
  function globalCallback(context, event, isCapture) {
    event = event || _global2.event;
    if (!event) {
      return;
    }
    const target = context || event.target || _global2;
    const tasks = target[zoneSymbolEventNames[event.type][isCapture ? TRUE_STR : FALSE_STR]];
    if (tasks) {
      const errors = [];
      if (tasks.length === 1) {
        const err = invokeTask(tasks[0], target, event);
        err && errors.push(err);
      } else {
        const copyTasks = tasks.slice();
        for (let i = 0; i < copyTasks.length; i++) {
          if (event && event[IMMEDIATE_PROPAGATION_SYMBOL] === true) {
            break;
          }
          const err = invokeTask(copyTasks[i], target, event);
          err && errors.push(err);
        }
      }
      if (errors.length === 1) {
        throw errors[0];
      } else {
        for (let i = 0; i < errors.length; i++) {
          const err = errors[i];
          api.nativeScheduleMicroTask(() => {
            throw err;
          });
        }
      }
    }
  }
  const globalZoneAwareCallback = function(event) {
    return globalCallback(this, event, false);
  };
  const globalZoneAwareCaptureCallback = function(event) {
    return globalCallback(this, event, true);
  };
  function patchEventTargetMethods(obj, patchOptions2) {
    if (!obj) {
      return false;
    }
    let useGlobalCallback = true;
    if (patchOptions2 && patchOptions2.useG !== void 0) {
      useGlobalCallback = patchOptions2.useG;
    }
    const validateHandler = patchOptions2 && patchOptions2.vh;
    let checkDuplicate = true;
    if (patchOptions2 && patchOptions2.chkDup !== void 0) {
      checkDuplicate = patchOptions2.chkDup;
    }
    let returnTarget = false;
    if (patchOptions2 && patchOptions2.rt !== void 0) {
      returnTarget = patchOptions2.rt;
    }
    let proto = obj;
    while (proto && !proto.hasOwnProperty(ADD_EVENT_LISTENER)) {
      proto = ObjectGetPrototypeOf(proto);
    }
    if (!proto && obj[ADD_EVENT_LISTENER]) {
      proto = obj;
    }
    if (!proto) {
      return false;
    }
    if (proto[zoneSymbolAddEventListener]) {
      return false;
    }
    const eventNameToString = patchOptions2 && patchOptions2.eventNameToString;
    const taskData = {};
    const nativeAddEventListener = proto[zoneSymbolAddEventListener] = proto[ADD_EVENT_LISTENER];
    const nativeRemoveEventListener = proto[zoneSymbol(REMOVE_EVENT_LISTENER)] = proto[REMOVE_EVENT_LISTENER];
    const nativeListeners = proto[zoneSymbol(LISTENERS_EVENT_LISTENER)] = proto[LISTENERS_EVENT_LISTENER];
    const nativeRemoveAllListeners = proto[zoneSymbol(REMOVE_ALL_LISTENERS_EVENT_LISTENER)] = proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER];
    let nativePrependEventListener;
    if (patchOptions2 && patchOptions2.prepend) {
      nativePrependEventListener = proto[zoneSymbol(patchOptions2.prepend)] = proto[patchOptions2.prepend];
    }
    function buildEventListenerOptions(options, passive) {
      if (!passiveSupported && typeof options === "object" && options) {
        return !!options.capture;
      }
      if (!passiveSupported || !passive) {
        return options;
      }
      if (typeof options === "boolean") {
        return { capture: options, passive: true };
      }
      if (!options) {
        return { passive: true };
      }
      if (typeof options === "object" && options.passive !== false) {
        return { ...options, passive: true };
      }
      return options;
    }
    const customScheduleGlobal = function(task) {
      if (taskData.isExisting) {
        return;
      }
      return nativeAddEventListener.call(taskData.target, taskData.eventName, taskData.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, taskData.options);
    };
    const customCancelGlobal = function(task) {
      if (!task.isRemoved) {
        const symbolEventNames = zoneSymbolEventNames[task.eventName];
        let symbolEventName;
        if (symbolEventNames) {
          symbolEventName = symbolEventNames[task.capture ? TRUE_STR : FALSE_STR];
        }
        const existingTasks = symbolEventName && task.target[symbolEventName];
        if (existingTasks) {
          for (let i = 0; i < existingTasks.length; i++) {
            const existingTask = existingTasks[i];
            if (existingTask === task) {
              existingTasks.splice(i, 1);
              task.isRemoved = true;
              if (existingTasks.length === 0) {
                task.allRemoved = true;
                task.target[symbolEventName] = null;
              }
              break;
            }
          }
        }
      }
      if (!task.allRemoved) {
        return;
      }
      return nativeRemoveEventListener.call(task.target, task.eventName, task.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, task.options);
    };
    const customScheduleNonGlobal = function(task) {
      return nativeAddEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
    };
    const customSchedulePrepend = function(task) {
      return nativePrependEventListener.call(taskData.target, taskData.eventName, task.invoke, taskData.options);
    };
    const customCancelNonGlobal = function(task) {
      return nativeRemoveEventListener.call(task.target, task.eventName, task.invoke, task.options);
    };
    const customSchedule = useGlobalCallback ? customScheduleGlobal : customScheduleNonGlobal;
    const customCancel = useGlobalCallback ? customCancelGlobal : customCancelNonGlobal;
    const compareTaskCallbackVsDelegate = function(task, delegate) {
      const typeOfDelegate = typeof delegate;
      return typeOfDelegate === "function" && task.callback === delegate || typeOfDelegate === "object" && task.originalDelegate === delegate;
    };
    const compare = patchOptions2 && patchOptions2.diff ? patchOptions2.diff : compareTaskCallbackVsDelegate;
    const unpatchedEvents = Zone[zoneSymbol("UNPATCHED_EVENTS")];
    const passiveEvents = _global2[zoneSymbol("PASSIVE_EVENTS")];
    const makeAddListener = function(nativeListener, addSource, customScheduleFn, customCancelFn, returnTarget2 = false, prepend = false) {
      return function() {
        const target = this || _global2;
        let eventName = arguments[0];
        if (patchOptions2 && patchOptions2.transferEventName) {
          eventName = patchOptions2.transferEventName(eventName);
        }
        let delegate = arguments[1];
        if (!delegate) {
          return nativeListener.apply(this, arguments);
        }
        if (isNode && eventName === "uncaughtException") {
          return nativeListener.apply(this, arguments);
        }
        let isHandleEvent = false;
        if (typeof delegate !== "function") {
          if (!delegate.handleEvent) {
            return nativeListener.apply(this, arguments);
          }
          isHandleEvent = true;
        }
        if (validateHandler && !validateHandler(nativeListener, delegate, target, arguments)) {
          return;
        }
        const passive = passiveSupported && !!passiveEvents && passiveEvents.indexOf(eventName) !== -1;
        const options = buildEventListenerOptions(arguments[2], passive);
        if (unpatchedEvents) {
          for (let i = 0; i < unpatchedEvents.length; i++) {
            if (eventName === unpatchedEvents[i]) {
              if (passive) {
                return nativeListener.call(target, eventName, delegate, options);
              } else {
                return nativeListener.apply(this, arguments);
              }
            }
          }
        }
        const capture = !options ? false : typeof options === "boolean" ? true : options.capture;
        const once = options && typeof options === "object" ? options.once : false;
        const zone = Zone.current;
        let symbolEventNames = zoneSymbolEventNames[eventName];
        if (!symbolEventNames) {
          prepareEventNames(eventName, eventNameToString);
          symbolEventNames = zoneSymbolEventNames[eventName];
        }
        const symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
        let existingTasks = target[symbolEventName];
        let isExisting = false;
        if (existingTasks) {
          isExisting = true;
          if (checkDuplicate) {
            for (let i = 0; i < existingTasks.length; i++) {
              if (compare(existingTasks[i], delegate)) {
                return;
              }
            }
          }
        } else {
          existingTasks = target[symbolEventName] = [];
        }
        let source;
        const constructorName = target.constructor["name"];
        const targetSource = globalSources[constructorName];
        if (targetSource) {
          source = targetSource[eventName];
        }
        if (!source) {
          source = constructorName + addSource + (eventNameToString ? eventNameToString(eventName) : eventName);
        }
        taskData.options = options;
        if (once) {
          taskData.options.once = false;
        }
        taskData.target = target;
        taskData.capture = capture;
        taskData.eventName = eventName;
        taskData.isExisting = isExisting;
        const data = useGlobalCallback ? OPTIMIZED_ZONE_EVENT_TASK_DATA : void 0;
        if (data) {
          data.taskData = taskData;
        }
        const task = zone.scheduleEventTask(source, delegate, data, customScheduleFn, customCancelFn);
        taskData.target = null;
        if (data) {
          data.taskData = null;
        }
        if (once) {
          options.once = true;
        }
        if (!(!passiveSupported && typeof task.options === "boolean")) {
          task.options = options;
        }
        task.target = target;
        task.capture = capture;
        task.eventName = eventName;
        if (isHandleEvent) {
          task.originalDelegate = delegate;
        }
        if (!prepend) {
          existingTasks.push(task);
        } else {
          existingTasks.unshift(task);
        }
        if (returnTarget2) {
          return target;
        }
      };
    };
    proto[ADD_EVENT_LISTENER] = makeAddListener(nativeAddEventListener, ADD_EVENT_LISTENER_SOURCE, customSchedule, customCancel, returnTarget);
    if (nativePrependEventListener) {
      proto[PREPEND_EVENT_LISTENER] = makeAddListener(nativePrependEventListener, PREPEND_EVENT_LISTENER_SOURCE, customSchedulePrepend, customCancel, returnTarget, true);
    }
    proto[REMOVE_EVENT_LISTENER] = function() {
      const target = this || _global2;
      let eventName = arguments[0];
      if (patchOptions2 && patchOptions2.transferEventName) {
        eventName = patchOptions2.transferEventName(eventName);
      }
      const options = arguments[2];
      const capture = !options ? false : typeof options === "boolean" ? true : options.capture;
      const delegate = arguments[1];
      if (!delegate) {
        return nativeRemoveEventListener.apply(this, arguments);
      }
      if (validateHandler && !validateHandler(nativeRemoveEventListener, delegate, target, arguments)) {
        return;
      }
      const symbolEventNames = zoneSymbolEventNames[eventName];
      let symbolEventName;
      if (symbolEventNames) {
        symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
      }
      const existingTasks = symbolEventName && target[symbolEventName];
      if (existingTasks) {
        for (let i = 0; i < existingTasks.length; i++) {
          const existingTask = existingTasks[i];
          if (compare(existingTask, delegate)) {
            existingTasks.splice(i, 1);
            existingTask.isRemoved = true;
            if (existingTasks.length === 0) {
              existingTask.allRemoved = true;
              target[symbolEventName] = null;
              if (typeof eventName === "string") {
                const onPropertySymbol = ZONE_SYMBOL_PREFIX + "ON_PROPERTY" + eventName;
                target[onPropertySymbol] = null;
              }
            }
            existingTask.zone.cancelTask(existingTask);
            if (returnTarget) {
              return target;
            }
            return;
          }
        }
      }
      return nativeRemoveEventListener.apply(this, arguments);
    };
    proto[LISTENERS_EVENT_LISTENER] = function() {
      const target = this || _global2;
      let eventName = arguments[0];
      if (patchOptions2 && patchOptions2.transferEventName) {
        eventName = patchOptions2.transferEventName(eventName);
      }
      const listeners = [];
      const tasks = findEventTasks(target, eventNameToString ? eventNameToString(eventName) : eventName);
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
        listeners.push(delegate);
      }
      return listeners;
    };
    proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER] = function() {
      const target = this || _global2;
      let eventName = arguments[0];
      if (!eventName) {
        const keys = Object.keys(target);
        for (let i = 0; i < keys.length; i++) {
          const prop = keys[i];
          const match = EVENT_NAME_SYMBOL_REGX.exec(prop);
          let evtName = match && match[1];
          if (evtName && evtName !== "removeListener") {
            this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, evtName);
          }
        }
        this[REMOVE_ALL_LISTENERS_EVENT_LISTENER].call(this, "removeListener");
      } else {
        if (patchOptions2 && patchOptions2.transferEventName) {
          eventName = patchOptions2.transferEventName(eventName);
        }
        const symbolEventNames = zoneSymbolEventNames[eventName];
        if (symbolEventNames) {
          const symbolEventName = symbolEventNames[FALSE_STR];
          const symbolCaptureEventName = symbolEventNames[TRUE_STR];
          const tasks = target[symbolEventName];
          const captureTasks = target[symbolCaptureEventName];
          if (tasks) {
            const removeTasks = tasks.slice();
            for (let i = 0; i < removeTasks.length; i++) {
              const task = removeTasks[i];
              let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
              this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
            }
          }
          if (captureTasks) {
            const removeTasks = captureTasks.slice();
            for (let i = 0; i < removeTasks.length; i++) {
              const task = removeTasks[i];
              let delegate = task.originalDelegate ? task.originalDelegate : task.callback;
              this[REMOVE_EVENT_LISTENER].call(this, eventName, delegate, task.options);
            }
          }
        }
      }
      if (returnTarget) {
        return this;
      }
    };
    attachOriginToPatched(proto[ADD_EVENT_LISTENER], nativeAddEventListener);
    attachOriginToPatched(proto[REMOVE_EVENT_LISTENER], nativeRemoveEventListener);
    if (nativeRemoveAllListeners) {
      attachOriginToPatched(proto[REMOVE_ALL_LISTENERS_EVENT_LISTENER], nativeRemoveAllListeners);
    }
    if (nativeListeners) {
      attachOriginToPatched(proto[LISTENERS_EVENT_LISTENER], nativeListeners);
    }
    return true;
  }
  let results = [];
  for (let i = 0; i < apis.length; i++) {
    results[i] = patchEventTargetMethods(apis[i], patchOptions);
  }
  return results;
}
function findEventTasks(target, eventName) {
  if (!eventName) {
    const foundTasks = [];
    for (let prop in target) {
      const match = EVENT_NAME_SYMBOL_REGX.exec(prop);
      let evtName = match && match[1];
      if (evtName && (!eventName || evtName === eventName)) {
        const tasks = target[prop];
        if (tasks) {
          for (let i = 0; i < tasks.length; i++) {
            foundTasks.push(tasks[i]);
          }
        }
      }
    }
    return foundTasks;
  }
  let symbolEventName = zoneSymbolEventNames[eventName];
  if (!symbolEventName) {
    prepareEventNames(eventName);
    symbolEventName = zoneSymbolEventNames[eventName];
  }
  const captureFalseTasks = target[symbolEventName[FALSE_STR]];
  const captureTrueTasks = target[symbolEventName[TRUE_STR]];
  if (!captureFalseTasks) {
    return captureTrueTasks ? captureTrueTasks.slice() : [];
  } else {
    return captureTrueTasks ? captureFalseTasks.concat(captureTrueTasks) : captureFalseTasks.slice();
  }
}
function patchEventPrototype(global, api) {
  const Event = global["Event"];
  if (Event && Event.prototype) {
    api.patchMethod(Event.prototype, "stopImmediatePropagation", (delegate) => function(self2, args) {
      self2[IMMEDIATE_PROPAGATION_SYMBOL] = true;
      delegate && delegate.apply(self2, args);
    });
  }
}
function patchCallbacks(api, target, targetName, method, callbacks) {
  const symbol = Zone.__symbol__(method);
  if (target[symbol]) {
    return;
  }
  const nativeDelegate = target[symbol] = target[method];
  target[method] = function(name, opts, options) {
    if (opts && opts.prototype) {
      callbacks.forEach(function(callback) {
        const source = `${targetName}.${method}::` + callback;
        const prototype = opts.prototype;
        try {
          if (prototype.hasOwnProperty(callback)) {
            const descriptor = api.ObjectGetOwnPropertyDescriptor(prototype, callback);
            if (descriptor && descriptor.value) {
              descriptor.value = api.wrapWithCurrentZone(descriptor.value, source);
              api._redefineProperty(opts.prototype, callback, descriptor);
            } else if (prototype[callback]) {
              prototype[callback] = api.wrapWithCurrentZone(prototype[callback], source);
            }
          } else if (prototype[callback]) {
            prototype[callback] = api.wrapWithCurrentZone(prototype[callback], source);
          }
        } catch {
        }
      });
    }
    return nativeDelegate.call(target, name, opts, options);
  };
  api.attachOriginToPatched(target[method], nativeDelegate);
}
function filterProperties(target, onProperties, ignoreProperties) {
  if (!ignoreProperties || ignoreProperties.length === 0) {
    return onProperties;
  }
  const tip = ignoreProperties.filter((ip) => ip.target === target);
  if (!tip || tip.length === 0) {
    return onProperties;
  }
  const targetIgnoreProperties = tip[0].ignoreProperties;
  return onProperties.filter((op) => targetIgnoreProperties.indexOf(op) === -1);
}
function patchFilteredProperties(target, onProperties, ignoreProperties, prototype) {
  if (!target) {
    return;
  }
  const filteredProperties = filterProperties(target, onProperties, ignoreProperties);
  patchOnProperties(target, filteredProperties, prototype);
}
function getOnEventNames(target) {
  return Object.getOwnPropertyNames(target).filter((name) => name.startsWith("on") && name.length > 2).map((name) => name.substring(2));
}
function propertyDescriptorPatch(api, _global2) {
  if (isNode && !isMix) {
    return;
  }
  if (Zone[api.symbol("patchEvents")]) {
    return;
  }
  const ignoreProperties = _global2["__Zone_ignore_on_properties"];
  let patchTargets = [];
  if (isBrowser) {
    const internalWindow2 = window;
    patchTargets = patchTargets.concat([
      "Document",
      "SVGElement",
      "Element",
      "HTMLElement",
      "HTMLBodyElement",
      "HTMLMediaElement",
      "HTMLFrameSetElement",
      "HTMLFrameElement",
      "HTMLIFrameElement",
      "HTMLMarqueeElement",
      "Worker"
    ]);
    const ignoreErrorProperties = isIE() ? [{ target: internalWindow2, ignoreProperties: ["error"] }] : [];
    patchFilteredProperties(internalWindow2, getOnEventNames(internalWindow2), ignoreProperties ? ignoreProperties.concat(ignoreErrorProperties) : ignoreProperties, ObjectGetPrototypeOf(internalWindow2));
  }
  patchTargets = patchTargets.concat([
    "XMLHttpRequest",
    "XMLHttpRequestEventTarget",
    "IDBIndex",
    "IDBRequest",
    "IDBOpenDBRequest",
    "IDBDatabase",
    "IDBTransaction",
    "IDBCursor",
    "WebSocket"
  ]);
  for (let i = 0; i < patchTargets.length; i++) {
    const target = _global2[patchTargets[i]];
    target && target.prototype && patchFilteredProperties(target.prototype, getOnEventNames(target.prototype), ignoreProperties);
  }
}
Zone.__load_patch("util", (global, Zone2, api) => {
  const eventNames = getOnEventNames(global);
  api.patchOnProperties = patchOnProperties;
  api.patchMethod = patchMethod;
  api.bindArguments = bindArguments;
  api.patchMacroTask = patchMacroTask;
  const SYMBOL_BLACK_LISTED_EVENTS = Zone2.__symbol__("BLACK_LISTED_EVENTS");
  const SYMBOL_UNPATCHED_EVENTS = Zone2.__symbol__("UNPATCHED_EVENTS");
  if (global[SYMBOL_UNPATCHED_EVENTS]) {
    global[SYMBOL_BLACK_LISTED_EVENTS] = global[SYMBOL_UNPATCHED_EVENTS];
  }
  if (global[SYMBOL_BLACK_LISTED_EVENTS]) {
    Zone2[SYMBOL_BLACK_LISTED_EVENTS] = Zone2[SYMBOL_UNPATCHED_EVENTS] = global[SYMBOL_BLACK_LISTED_EVENTS];
  }
  api.patchEventPrototype = patchEventPrototype;
  api.patchEventTarget = patchEventTarget;
  api.isIEOrEdge = isIEOrEdge;
  api.ObjectDefineProperty = ObjectDefineProperty;
  api.ObjectGetOwnPropertyDescriptor = ObjectGetOwnPropertyDescriptor;
  api.ObjectCreate = ObjectCreate;
  api.ArraySlice = ArraySlice;
  api.patchClass = patchClass;
  api.wrapWithCurrentZone = wrapWithCurrentZone;
  api.filterProperties = filterProperties;
  api.attachOriginToPatched = attachOriginToPatched;
  api._redefineProperty = Object.defineProperty;
  api.patchCallbacks = patchCallbacks;
  api.getGlobalObjects = () => ({
    globalSources,
    zoneSymbolEventNames,
    eventNames,
    isBrowser,
    isMix,
    isNode,
    TRUE_STR,
    FALSE_STR,
    ZONE_SYMBOL_PREFIX,
    ADD_EVENT_LISTENER_STR,
    REMOVE_EVENT_LISTENER_STR
  });
});
function patchQueueMicrotask(global, api) {
  api.patchMethod(global, "queueMicrotask", (delegate) => {
    return function(self2, args) {
      Zone.current.scheduleMicroTask("queueMicrotask", args[0]);
    };
  });
}
var taskSymbol = zoneSymbol("zoneTask");
function patchTimer(window2, setName, cancelName, nameSuffix) {
  let setNative = null;
  let clearNative = null;
  setName += nameSuffix;
  cancelName += nameSuffix;
  const tasksByHandleId = {};
  function scheduleTask(task) {
    const data = task.data;
    data.args[0] = function() {
      return task.invoke.apply(this, arguments);
    };
    data.handleId = setNative.apply(window2, data.args);
    return task;
  }
  function clearTask(task) {
    return clearNative.call(window2, task.data.handleId);
  }
  setNative = patchMethod(window2, setName, (delegate) => function(self2, args) {
    if (typeof args[0] === "function") {
      const options = {
        isPeriodic: nameSuffix === "Interval",
        delay: nameSuffix === "Timeout" || nameSuffix === "Interval" ? args[1] || 0 : void 0,
        args
      };
      const callback = args[0];
      args[0] = function timer() {
        try {
          return callback.apply(this, arguments);
        } finally {
          if (!options.isPeriodic) {
            if (typeof options.handleId === "number") {
              delete tasksByHandleId[options.handleId];
            } else if (options.handleId) {
              options.handleId[taskSymbol] = null;
            }
          }
        }
      };
      const task = scheduleMacroTaskWithCurrentZone(setName, args[0], options, scheduleTask, clearTask);
      if (!task) {
        return task;
      }
      const handle = task.data.handleId;
      if (typeof handle === "number") {
        tasksByHandleId[handle] = task;
      } else if (handle) {
        handle[taskSymbol] = task;
      }
      if (handle && handle.ref && handle.unref && typeof handle.ref === "function" && typeof handle.unref === "function") {
        task.ref = handle.ref.bind(handle);
        task.unref = handle.unref.bind(handle);
      }
      if (typeof handle === "number" || handle) {
        return handle;
      }
      return task;
    } else {
      return delegate.apply(window2, args);
    }
  });
  clearNative = patchMethod(window2, cancelName, (delegate) => function(self2, args) {
    const id = args[0];
    let task;
    if (typeof id === "number") {
      task = tasksByHandleId[id];
    } else {
      task = id && id[taskSymbol];
      if (!task) {
        task = id;
      }
    }
    if (task && typeof task.type === "string") {
      if (task.state !== "notScheduled" && (task.cancelFn && task.data.isPeriodic || task.runCount === 0)) {
        if (typeof id === "number") {
          delete tasksByHandleId[id];
        } else if (id) {
          id[taskSymbol] = null;
        }
        task.zone.cancelTask(task);
      }
    } else {
      delegate.apply(window2, args);
    }
  });
}
function patchCustomElements(_global2, api) {
  const { isBrowser: isBrowser2, isMix: isMix2 } = api.getGlobalObjects();
  if (!isBrowser2 && !isMix2 || !_global2["customElements"] || !("customElements" in _global2)) {
    return;
  }
  const callbacks = ["connectedCallback", "disconnectedCallback", "adoptedCallback", "attributeChangedCallback"];
  api.patchCallbacks(api, _global2.customElements, "customElements", "define", callbacks);
}
function eventTargetPatch(_global2, api) {
  if (Zone[api.symbol("patchEventTarget")]) {
    return;
  }
  const { eventNames, zoneSymbolEventNames: zoneSymbolEventNames2, TRUE_STR: TRUE_STR2, FALSE_STR: FALSE_STR2, ZONE_SYMBOL_PREFIX: ZONE_SYMBOL_PREFIX2 } = api.getGlobalObjects();
  for (let i = 0; i < eventNames.length; i++) {
    const eventName = eventNames[i];
    const falseEventName = eventName + FALSE_STR2;
    const trueEventName = eventName + TRUE_STR2;
    const symbol = ZONE_SYMBOL_PREFIX2 + falseEventName;
    const symbolCapture = ZONE_SYMBOL_PREFIX2 + trueEventName;
    zoneSymbolEventNames2[eventName] = {};
    zoneSymbolEventNames2[eventName][FALSE_STR2] = symbol;
    zoneSymbolEventNames2[eventName][TRUE_STR2] = symbolCapture;
  }
  const EVENT_TARGET = _global2["EventTarget"];
  if (!EVENT_TARGET || !EVENT_TARGET.prototype) {
    return;
  }
  api.patchEventTarget(_global2, api, [EVENT_TARGET && EVENT_TARGET.prototype]);
  return true;
}
function patchEvent(global, api) {
  api.patchEventPrototype(global, api);
}
Zone.__load_patch("legacy", (global) => {
  const legacyPatch = global[Zone.__symbol__("legacyPatch")];
  if (legacyPatch) {
    legacyPatch();
  }
});
Zone.__load_patch("timers", (global) => {
  const set = "set";
  const clear = "clear";
  patchTimer(global, set, clear, "Timeout");
  patchTimer(global, set, clear, "Interval");
  patchTimer(global, set, clear, "Immediate");
});
Zone.__load_patch("requestAnimationFrame", (global) => {
  patchTimer(global, "request", "cancel", "AnimationFrame");
  patchTimer(global, "mozRequest", "mozCancel", "AnimationFrame");
  patchTimer(global, "webkitRequest", "webkitCancel", "AnimationFrame");
});
Zone.__load_patch("blocking", (global, Zone2) => {
  const blockingMethods = ["alert", "prompt", "confirm"];
  for (let i = 0; i < blockingMethods.length; i++) {
    const name = blockingMethods[i];
    patchMethod(global, name, (delegate, symbol, name2) => {
      return function(s, args) {
        return Zone2.current.run(delegate, global, args, name2);
      };
    });
  }
});
Zone.__load_patch("EventTarget", (global, Zone2, api) => {
  patchEvent(global, api);
  eventTargetPatch(global, api);
  const XMLHttpRequestEventTarget = global["XMLHttpRequestEventTarget"];
  if (XMLHttpRequestEventTarget && XMLHttpRequestEventTarget.prototype) {
    api.patchEventTarget(global, api, [XMLHttpRequestEventTarget.prototype]);
  }
});
Zone.__load_patch("MutationObserver", (global, Zone2, api) => {
  patchClass("MutationObserver");
  patchClass("WebKitMutationObserver");
});
Zone.__load_patch("IntersectionObserver", (global, Zone2, api) => {
  patchClass("IntersectionObserver");
});
Zone.__load_patch("FileReader", (global, Zone2, api) => {
  patchClass("FileReader");
});
Zone.__load_patch("on_property", (global, Zone2, api) => {
  propertyDescriptorPatch(api, global);
});
Zone.__load_patch("customElements", (global, Zone2, api) => {
  patchCustomElements(global, api);
});
Zone.__load_patch("XHR", (global, Zone2) => {
  patchXHR(global);
  const XHR_TASK = zoneSymbol("xhrTask");
  const XHR_SYNC = zoneSymbol("xhrSync");
  const XHR_LISTENER = zoneSymbol("xhrListener");
  const XHR_SCHEDULED = zoneSymbol("xhrScheduled");
  const XHR_URL = zoneSymbol("xhrURL");
  const XHR_ERROR_BEFORE_SCHEDULED = zoneSymbol("xhrErrorBeforeScheduled");
  function patchXHR(window2) {
    const XMLHttpRequest = window2["XMLHttpRequest"];
    if (!XMLHttpRequest) {
      return;
    }
    const XMLHttpRequestPrototype = XMLHttpRequest.prototype;
    function findPendingTask(target) {
      return target[XHR_TASK];
    }
    let oriAddListener = XMLHttpRequestPrototype[ZONE_SYMBOL_ADD_EVENT_LISTENER];
    let oriRemoveListener = XMLHttpRequestPrototype[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
    if (!oriAddListener) {
      const XMLHttpRequestEventTarget = window2["XMLHttpRequestEventTarget"];
      if (XMLHttpRequestEventTarget) {
        const XMLHttpRequestEventTargetPrototype = XMLHttpRequestEventTarget.prototype;
        oriAddListener = XMLHttpRequestEventTargetPrototype[ZONE_SYMBOL_ADD_EVENT_LISTENER];
        oriRemoveListener = XMLHttpRequestEventTargetPrototype[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
      }
    }
    const READY_STATE_CHANGE = "readystatechange";
    const SCHEDULED = "scheduled";
    function scheduleTask(task) {
      const data = task.data;
      const target = data.target;
      target[XHR_SCHEDULED] = false;
      target[XHR_ERROR_BEFORE_SCHEDULED] = false;
      const listener = target[XHR_LISTENER];
      if (!oriAddListener) {
        oriAddListener = target[ZONE_SYMBOL_ADD_EVENT_LISTENER];
        oriRemoveListener = target[ZONE_SYMBOL_REMOVE_EVENT_LISTENER];
      }
      if (listener) {
        oriRemoveListener.call(target, READY_STATE_CHANGE, listener);
      }
      const newListener = target[XHR_LISTENER] = () => {
        if (target.readyState === target.DONE) {
          if (!data.aborted && target[XHR_SCHEDULED] && task.state === SCHEDULED) {
            const loadTasks = target[Zone2.__symbol__("loadfalse")];
            if (target.status !== 0 && loadTasks && loadTasks.length > 0) {
              const oriInvoke = task.invoke;
              task.invoke = function() {
                const loadTasks2 = target[Zone2.__symbol__("loadfalse")];
                for (let i = 0; i < loadTasks2.length; i++) {
                  if (loadTasks2[i] === task) {
                    loadTasks2.splice(i, 1);
                  }
                }
                if (!data.aborted && task.state === SCHEDULED) {
                  oriInvoke.call(task);
                }
              };
              loadTasks.push(task);
            } else {
              task.invoke();
            }
          } else if (!data.aborted && target[XHR_SCHEDULED] === false) {
            target[XHR_ERROR_BEFORE_SCHEDULED] = true;
          }
        }
      };
      oriAddListener.call(target, READY_STATE_CHANGE, newListener);
      const storedTask = target[XHR_TASK];
      if (!storedTask) {
        target[XHR_TASK] = task;
      }
      sendNative.apply(target, data.args);
      target[XHR_SCHEDULED] = true;
      return task;
    }
    function placeholderCallback() {
    }
    function clearTask(task) {
      const data = task.data;
      data.aborted = true;
      return abortNative.apply(data.target, data.args);
    }
    const openNative = patchMethod(XMLHttpRequestPrototype, "open", () => function(self2, args) {
      self2[XHR_SYNC] = args[2] == false;
      self2[XHR_URL] = args[1];
      return openNative.apply(self2, args);
    });
    const XMLHTTPREQUEST_SOURCE = "XMLHttpRequest.send";
    const fetchTaskAborting = zoneSymbol("fetchTaskAborting");
    const fetchTaskScheduling = zoneSymbol("fetchTaskScheduling");
    const sendNative = patchMethod(XMLHttpRequestPrototype, "send", () => function(self2, args) {
      if (Zone2.current[fetchTaskScheduling] === true) {
        return sendNative.apply(self2, args);
      }
      if (self2[XHR_SYNC]) {
        return sendNative.apply(self2, args);
      } else {
        const options = { target: self2, url: self2[XHR_URL], isPeriodic: false, args, aborted: false };
        const task = scheduleMacroTaskWithCurrentZone(XMLHTTPREQUEST_SOURCE, placeholderCallback, options, scheduleTask, clearTask);
        if (self2 && self2[XHR_ERROR_BEFORE_SCHEDULED] === true && !options.aborted && task.state === SCHEDULED) {
          task.invoke();
        }
      }
    });
    const abortNative = patchMethod(XMLHttpRequestPrototype, "abort", () => function(self2, args) {
      const task = findPendingTask(self2);
      if (task && typeof task.type == "string") {
        if (task.cancelFn == null || task.data && task.data.aborted) {
          return;
        }
        task.zone.cancelTask(task);
      } else if (Zone2.current[fetchTaskAborting] === true) {
        return abortNative.apply(self2, args);
      }
    });
  }
});
Zone.__load_patch("geolocation", (global) => {
  if (global["navigator"] && global["navigator"].geolocation) {
    patchPrototype(global["navigator"].geolocation, ["getCurrentPosition", "watchPosition"]);
  }
});
Zone.__load_patch("PromiseRejectionEvent", (global, Zone2) => {
  function findPromiseRejectionHandler(evtName) {
    return function(e) {
      const eventTasks = findEventTasks(global, evtName);
      eventTasks.forEach((eventTask) => {
        const PromiseRejectionEvent = global["PromiseRejectionEvent"];
        if (PromiseRejectionEvent) {
          const evt = new PromiseRejectionEvent(evtName, { promise: e.promise, reason: e.rejection });
          eventTask.invoke(evt);
        }
      });
    };
  }
  if (global["PromiseRejectionEvent"]) {
    Zone2[zoneSymbol("unhandledPromiseRejectionHandler")] = findPromiseRejectionHandler("unhandledrejection");
    Zone2[zoneSymbol("rejectionHandledHandler")] = findPromiseRejectionHandler("rejectionhandled");
  }
});
Zone.__load_patch("queueMicrotask", (global, Zone2, api) => {
  patchQueueMicrotask(global, api);
});

// src/polyfills.ts
window.global = window;
window.process = {
  env: { DEBUG: void 0 }
};
/*! Bundled license information:

zone.js/fesm2015/zone.js:
  (**
   * @license Angular v<unknown>
   * (c) 2010-2022 Google LLC. https://angular.io/
   * License: MIT
   *)
*/


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy96b25lLmpzL2Zlc20yMDE1L3pvbmUuanMiLCJzcmMvcG9seWZpbGxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0Jztcbi8qKlxuICogQGxpY2Vuc2UgQW5ndWxhciB2PHVua25vd24+XG4gKiAoYykgMjAxMC0yMDIyIEdvb2dsZSBMTEMuIGh0dHBzOi8vYW5ndWxhci5pby9cbiAqIExpY2Vuc2U6IE1JVFxuICovXG4oKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICBjb25zdCBwZXJmb3JtYW5jZSA9IGdsb2JhbFsncGVyZm9ybWFuY2UnXTtcbiAgICBmdW5jdGlvbiBtYXJrKG5hbWUpIHtcbiAgICAgICAgcGVyZm9ybWFuY2UgJiYgcGVyZm9ybWFuY2VbJ21hcmsnXSAmJiBwZXJmb3JtYW5jZVsnbWFyayddKG5hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwZXJmb3JtYW5jZU1lYXN1cmUobmFtZSwgbGFiZWwpIHtcbiAgICAgICAgcGVyZm9ybWFuY2UgJiYgcGVyZm9ybWFuY2VbJ21lYXN1cmUnXSAmJiBwZXJmb3JtYW5jZVsnbWVhc3VyZSddKG5hbWUsIGxhYmVsKTtcbiAgICB9XG4gICAgbWFyaygnWm9uZScpO1xuICAgIC8vIEluaXRpYWxpemUgYmVmb3JlIGl0J3MgYWNjZXNzZWQgYmVsb3cuXG4gICAgLy8gX19ab25lX3N5bWJvbF9wcmVmaXggZ2xvYmFsIGNhbiBiZSB1c2VkIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IHpvbmVcbiAgICAvLyBzeW1ib2wgcHJlZml4IHdpdGggYSBjdXN0b20gb25lIGlmIG5lZWRlZC5cbiAgICBjb25zdCBzeW1ib2xQcmVmaXggPSBnbG9iYWxbJ19fWm9uZV9zeW1ib2xfcHJlZml4J10gfHwgJ19fem9uZV9zeW1ib2xfXyc7XG4gICAgZnVuY3Rpb24gX19zeW1ib2xfXyhuYW1lKSB7XG4gICAgICAgIHJldHVybiBzeW1ib2xQcmVmaXggKyBuYW1lO1xuICAgIH1cbiAgICBjb25zdCBjaGVja0R1cGxpY2F0ZSA9IGdsb2JhbFtfX3N5bWJvbF9fKCdmb3JjZUR1cGxpY2F0ZVpvbmVDaGVjaycpXSA9PT0gdHJ1ZTtcbiAgICBpZiAoZ2xvYmFsWydab25lJ10pIHtcbiAgICAgICAgLy8gaWYgZ2xvYmFsWydab25lJ10gYWxyZWFkeSBleGlzdHMgKG1heWJlIHpvbmUuanMgd2FzIGFscmVhZHkgbG9hZGVkIG9yXG4gICAgICAgIC8vIHNvbWUgb3RoZXIgbGliIGFsc28gcmVnaXN0ZXJlZCBhIGdsb2JhbCBvYmplY3QgbmFtZWQgWm9uZSksIHdlIG1heSBuZWVkXG4gICAgICAgIC8vIHRvIHRocm93IGFuIGVycm9yLCBidXQgc29tZXRpbWVzIHVzZXIgbWF5IG5vdCB3YW50IHRoaXMgZXJyb3IuXG4gICAgICAgIC8vIEZvciBleGFtcGxlLFxuICAgICAgICAvLyB3ZSBoYXZlIHR3byB3ZWIgcGFnZXMsIHBhZ2UxIGluY2x1ZGVzIHpvbmUuanMsIHBhZ2UyIGRvZXNuJ3QuXG4gICAgICAgIC8vIGFuZCB0aGUgMXN0IHRpbWUgdXNlciBsb2FkIHBhZ2UxIGFuZCBwYWdlMiwgZXZlcnl0aGluZyB3b3JrIGZpbmUsXG4gICAgICAgIC8vIGJ1dCB3aGVuIHVzZXIgbG9hZCBwYWdlMiBhZ2FpbiwgZXJyb3Igb2NjdXJzIGJlY2F1c2UgZ2xvYmFsWydab25lJ10gYWxyZWFkeSBleGlzdHMuXG4gICAgICAgIC8vIHNvIHdlIGFkZCBhIGZsYWcgdG8gbGV0IHVzZXIgY2hvb3NlIHdoZXRoZXIgdG8gdGhyb3cgdGhpcyBlcnJvciBvciBub3QuXG4gICAgICAgIC8vIEJ5IGRlZmF1bHQsIGlmIGV4aXN0aW5nIFpvbmUgaXMgZnJvbSB6b25lLmpzLCB3ZSB3aWxsIG5vdCB0aHJvdyB0aGUgZXJyb3IuXG4gICAgICAgIGlmIChjaGVja0R1cGxpY2F0ZSB8fCB0eXBlb2YgZ2xvYmFsWydab25lJ10uX19zeW1ib2xfXyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdab25lIGFscmVhZHkgbG9hZGVkLicpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbFsnWm9uZSddO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNsYXNzIFpvbmUge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cmVxdWlyZS1pbnRlcm5hbC13aXRoLXVuZGVyc2NvcmVcbiAgICAgICAgc3RhdGljIHsgdGhpcy5fX3N5bWJvbF9fID0gX19zeW1ib2xfXzsgfVxuICAgICAgICBzdGF0aWMgYXNzZXJ0Wm9uZVBhdGNoZWQoKSB7XG4gICAgICAgICAgICBpZiAoZ2xvYmFsWydQcm9taXNlJ10gIT09IHBhdGNoZXNbJ1pvbmVBd2FyZVByb21pc2UnXSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWm9uZS5qcyBoYXMgZGV0ZWN0ZWQgdGhhdCBab25lQXdhcmVQcm9taXNlIGAod2luZG93fGdsb2JhbCkuUHJvbWlzZWAgJyArXG4gICAgICAgICAgICAgICAgICAgICdoYXMgYmVlbiBvdmVyd3JpdHRlbi5cXG4nICtcbiAgICAgICAgICAgICAgICAgICAgJ01vc3QgbGlrZWx5IGNhdXNlIGlzIHRoYXQgYSBQcm9taXNlIHBvbHlmaWxsIGhhcyBiZWVuIGxvYWRlZCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2FmdGVyIFpvbmUuanMgKFBvbHlmaWxsaW5nIFByb21pc2UgYXBpIGlzIG5vdCBuZWNlc3Nhcnkgd2hlbiB6b25lLmpzIGlzIGxvYWRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdJZiB5b3UgbXVzdCBsb2FkIG9uZSwgZG8gc28gYmVmb3JlIGxvYWRpbmcgem9uZS5qcy4pJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIGdldCByb290KCkge1xuICAgICAgICAgICAgbGV0IHpvbmUgPSBab25lLmN1cnJlbnQ7XG4gICAgICAgICAgICB3aGlsZSAoem9uZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB6b25lID0gem9uZS5wYXJlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gem9uZTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgZ2V0IGN1cnJlbnQoKSB7XG4gICAgICAgICAgICByZXR1cm4gX2N1cnJlbnRab25lRnJhbWUuem9uZTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgZ2V0IGN1cnJlbnRUYXNrKCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jdXJyZW50VGFzaztcbiAgICAgICAgfVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cmVxdWlyZS1pbnRlcm5hbC13aXRoLXVuZGVyc2NvcmVcbiAgICAgICAgc3RhdGljIF9fbG9hZF9wYXRjaChuYW1lLCBmbiwgaWdub3JlRHVwbGljYXRlID0gZmFsc2UpIHtcbiAgICAgICAgICAgIGlmIChwYXRjaGVzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgLy8gYGNoZWNrRHVwbGljYXRlYCBvcHRpb24gaXMgZGVmaW5lZCBmcm9tIGdsb2JhbCB2YXJpYWJsZVxuICAgICAgICAgICAgICAgIC8vIHNvIGl0IHdvcmtzIGZvciBhbGwgbW9kdWxlcy5cbiAgICAgICAgICAgICAgICAvLyBgaWdub3JlRHVwbGljYXRlYCBjYW4gd29yayBmb3IgdGhlIHNwZWNpZmllZCBtb2R1bGVcbiAgICAgICAgICAgICAgICBpZiAoIWlnbm9yZUR1cGxpY2F0ZSAmJiBjaGVja0R1cGxpY2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignQWxyZWFkeSBsb2FkZWQgcGF0Y2g6ICcgKyBuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICghZ2xvYmFsWydfX1pvbmVfZGlzYWJsZV8nICsgbmFtZV0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJmTmFtZSA9ICdab25lOicgKyBuYW1lO1xuICAgICAgICAgICAgICAgIG1hcmsocGVyZk5hbWUpO1xuICAgICAgICAgICAgICAgIHBhdGNoZXNbbmFtZV0gPSBmbihnbG9iYWwsIFpvbmUsIF9hcGkpO1xuICAgICAgICAgICAgICAgIHBlcmZvcm1hbmNlTWVhc3VyZShwZXJmTmFtZSwgcGVyZk5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGdldCBwYXJlbnQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xuICAgICAgICB9XG4gICAgICAgIGdldCBuYW1lKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3IocGFyZW50LCB6b25lU3BlYykge1xuICAgICAgICAgICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgdGhpcy5fbmFtZSA9IHpvbmVTcGVjID8gem9uZVNwZWMubmFtZSB8fCAndW5uYW1lZCcgOiAnPHJvb3Q+JztcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXMgPSB6b25lU3BlYyAmJiB6b25lU3BlYy5wcm9wZXJ0aWVzIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy5fem9uZURlbGVnYXRlID1cbiAgICAgICAgICAgICAgICBuZXcgX1pvbmVEZWxlZ2F0ZSh0aGlzLCB0aGlzLl9wYXJlbnQgJiYgdGhpcy5fcGFyZW50Ll96b25lRGVsZWdhdGUsIHpvbmVTcGVjKTtcbiAgICAgICAgfVxuICAgICAgICBnZXQoa2V5KSB7XG4gICAgICAgICAgICBjb25zdCB6b25lID0gdGhpcy5nZXRab25lV2l0aChrZXkpO1xuICAgICAgICAgICAgaWYgKHpvbmUpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHpvbmUuX3Byb3BlcnRpZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBnZXRab25lV2l0aChrZXkpIHtcbiAgICAgICAgICAgIGxldCBjdXJyZW50ID0gdGhpcztcbiAgICAgICAgICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQuX3Byb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQuX3BhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZvcmsoem9uZVNwZWMpIHtcbiAgICAgICAgICAgIGlmICghem9uZVNwZWMpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdab25lU3BlYyByZXF1aXJlZCEnKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl96b25lRGVsZWdhdGUuZm9yayh0aGlzLCB6b25lU3BlYyk7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcChjYWxsYmFjaywgc291cmNlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RpbmcgZnVuY3Rpb24gZ290OiAnICsgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgX2NhbGxiYWNrID0gdGhpcy5fem9uZURlbGVnYXRlLmludGVyY2VwdCh0aGlzLCBjYWxsYmFjaywgc291cmNlKTtcbiAgICAgICAgICAgIGNvbnN0IHpvbmUgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gem9uZS5ydW5HdWFyZGVkKF9jYWxsYmFjaywgdGhpcywgYXJndW1lbnRzLCBzb3VyY2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBydW4oY2FsbGJhY2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzLCBzb3VyY2UpIHtcbiAgICAgICAgICAgIF9jdXJyZW50Wm9uZUZyYW1lID0geyBwYXJlbnQ6IF9jdXJyZW50Wm9uZUZyYW1lLCB6b25lOiB0aGlzIH07XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl96b25lRGVsZWdhdGUuaW52b2tlKHRoaXMsIGNhbGxiYWNrLCBhcHBseVRoaXMsIGFwcGx5QXJncywgc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIF9jdXJyZW50Wm9uZUZyYW1lID0gX2N1cnJlbnRab25lRnJhbWUucGFyZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJ1bkd1YXJkZWQoY2FsbGJhY2ssIGFwcGx5VGhpcyA9IG51bGwsIGFwcGx5QXJncywgc291cmNlKSB7XG4gICAgICAgICAgICBfY3VycmVudFpvbmVGcmFtZSA9IHsgcGFyZW50OiBfY3VycmVudFpvbmVGcmFtZSwgem9uZTogdGhpcyB9O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZURlbGVnYXRlLmludm9rZSh0aGlzLCBjYWxsYmFjaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MsIHNvdXJjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fem9uZURlbGVnYXRlLmhhbmRsZUVycm9yKHRoaXMsIGVycm9yKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBfY3VycmVudFpvbmVGcmFtZSA9IF9jdXJyZW50Wm9uZUZyYW1lLnBhcmVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBydW5UYXNrKHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKSB7XG4gICAgICAgICAgICBpZiAodGFzay56b25lICE9IHRoaXMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgdGFzayBjYW4gb25seSBiZSBydW4gaW4gdGhlIHpvbmUgb2YgY3JlYXRpb24hIChDcmVhdGlvbjogJyArXG4gICAgICAgICAgICAgICAgICAgICh0YXNrLnpvbmUgfHwgTk9fWk9ORSkubmFtZSArICc7IEV4ZWN1dGlvbjogJyArIHRoaXMubmFtZSArICcpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci96b25lLmpzL2lzc3Vlcy83NzgsIHNvbWV0aW1lcyBldmVudFRhc2tcbiAgICAgICAgICAgIC8vIHdpbGwgcnVuIGluIG5vdFNjaGVkdWxlZChjYW5jZWxlZCkgc3RhdGUsIHdlIHNob3VsZCBub3QgdHJ5IHRvXG4gICAgICAgICAgICAvLyBydW4gc3VjaCBraW5kIG9mIHRhc2sgYnV0IGp1c3QgcmV0dXJuXG4gICAgICAgICAgICBpZiAodGFzay5zdGF0ZSA9PT0gbm90U2NoZWR1bGVkICYmICh0YXNrLnR5cGUgPT09IGV2ZW50VGFzayB8fCB0YXNrLnR5cGUgPT09IG1hY3JvVGFzaykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZUVudHJ5R3VhcmQgPSB0YXNrLnN0YXRlICE9IHJ1bm5pbmc7XG4gICAgICAgICAgICByZUVudHJ5R3VhcmQgJiYgdGFzay5fdHJhbnNpdGlvblRvKHJ1bm5pbmcsIHNjaGVkdWxlZCk7XG4gICAgICAgICAgICB0YXNrLnJ1bkNvdW50Kys7XG4gICAgICAgICAgICBjb25zdCBwcmV2aW91c1Rhc2sgPSBfY3VycmVudFRhc2s7XG4gICAgICAgICAgICBfY3VycmVudFRhc2sgPSB0YXNrO1xuICAgICAgICAgICAgX2N1cnJlbnRab25lRnJhbWUgPSB7IHBhcmVudDogX2N1cnJlbnRab25lRnJhbWUsIHpvbmU6IHRoaXMgfTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2sudHlwZSA9PSBtYWNyb1Rhc2sgJiYgdGFzay5kYXRhICYmICF0YXNrLmRhdGEuaXNQZXJpb2RpYykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrLmNhbmNlbEZuID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZURlbGVnYXRlLmludm9rZVRhc2sodGhpcywgdGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3pvbmVEZWxlZ2F0ZS5oYW5kbGVFcnJvcih0aGlzLCBlcnJvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIHRhc2sncyBzdGF0ZSBpcyBub3RTY2hlZHVsZWQgb3IgdW5rbm93biwgdGhlbiBpdCBoYXMgYWxyZWFkeSBiZWVuIGNhbmNlbGxlZFxuICAgICAgICAgICAgICAgIC8vIHdlIHNob3VsZCBub3QgcmVzZXQgdGhlIHN0YXRlIHRvIHNjaGVkdWxlZFxuICAgICAgICAgICAgICAgIGlmICh0YXNrLnN0YXRlICE9PSBub3RTY2hlZHVsZWQgJiYgdGFzay5zdGF0ZSAhPT0gdW5rbm93bikge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFzay50eXBlID09IGV2ZW50VGFzayB8fCAodGFzay5kYXRhICYmIHRhc2suZGF0YS5pc1BlcmlvZGljKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVFbnRyeUd1YXJkICYmIHRhc2suX3RyYW5zaXRpb25UbyhzY2hlZHVsZWQsIHJ1bm5pbmcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFzay5ydW5Db3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVUYXNrQ291bnQodGFzaywgLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVFbnRyeUd1YXJkICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFzay5fdHJhbnNpdGlvblRvKG5vdFNjaGVkdWxlZCwgcnVubmluZywgbm90U2NoZWR1bGVkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfY3VycmVudFpvbmVGcmFtZSA9IF9jdXJyZW50Wm9uZUZyYW1lLnBhcmVudDtcbiAgICAgICAgICAgICAgICBfY3VycmVudFRhc2sgPSBwcmV2aW91c1Rhc2s7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2NoZWR1bGVUYXNrKHRhc2spIHtcbiAgICAgICAgICAgIGlmICh0YXNrLnpvbmUgJiYgdGFzay56b25lICE9PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHRhc2sgd2FzIHJlc2NoZWR1bGVkLCB0aGUgbmV3Wm9uZVxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBub3QgYmUgdGhlIGNoaWxkcmVuIG9mIHRoZSBvcmlnaW5hbCB6b25lXG4gICAgICAgICAgICAgICAgbGV0IG5ld1pvbmUgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHdoaWxlIChuZXdab25lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdab25lID09PSB0YXNrLnpvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKGBjYW4gbm90IHJlc2NoZWR1bGUgdGFzayB0byAke3RoaXMubmFtZX0gd2hpY2ggaXMgZGVzY2VuZGFudHMgb2YgdGhlIG9yaWdpbmFsIHpvbmUgJHt0YXNrLnpvbmUubmFtZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdab25lID0gbmV3Wm9uZS5wYXJlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFzay5fdHJhbnNpdGlvblRvKHNjaGVkdWxpbmcsIG5vdFNjaGVkdWxlZCk7XG4gICAgICAgICAgICBjb25zdCB6b25lRGVsZWdhdGVzID0gW107XG4gICAgICAgICAgICB0YXNrLl96b25lRGVsZWdhdGVzID0gem9uZURlbGVnYXRlcztcbiAgICAgICAgICAgIHRhc2suX3pvbmUgPSB0aGlzO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0YXNrID0gdGhpcy5fem9uZURlbGVnYXRlLnNjaGVkdWxlVGFzayh0aGlzLCB0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgc2V0IHRhc2sncyBzdGF0ZSB0byB1bmtub3duIHdoZW4gc2NoZWR1bGVUYXNrIHRocm93IGVycm9yXG4gICAgICAgICAgICAgICAgLy8gYmVjYXVzZSB0aGUgZXJyIG1heSBmcm9tIHJlc2NoZWR1bGUsIHNvIHRoZSBmcm9tU3RhdGUgbWF5YmUgbm90U2NoZWR1bGVkXG4gICAgICAgICAgICAgICAgdGFzay5fdHJhbnNpdGlvblRvKHVua25vd24sIHNjaGVkdWxpbmcsIG5vdFNjaGVkdWxlZCk7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQEppYUxpUGFzc2lvbiwgc2hvdWxkIHdlIGNoZWNrIHRoZSByZXN1bHQgZnJvbSBoYW5kbGVFcnJvcj9cbiAgICAgICAgICAgICAgICB0aGlzLl96b25lRGVsZWdhdGUuaGFuZGxlRXJyb3IodGhpcywgZXJyKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGFzay5fem9uZURlbGVnYXRlcyA9PT0gem9uZURlbGVnYXRlcykge1xuICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgdG8gY2hlY2sgYmVjYXVzZSBpbnRlcm5hbGx5IHRoZSBkZWxlZ2F0ZSBjYW4gcmVzY2hlZHVsZSB0aGUgdGFzay5cbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVUYXNrQ291bnQodGFzaywgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGFzay5zdGF0ZSA9PSBzY2hlZHVsaW5nKSB7XG4gICAgICAgICAgICAgICAgdGFzay5fdHJhbnNpdGlvblRvKHNjaGVkdWxlZCwgc2NoZWR1bGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGFzaztcbiAgICAgICAgfVxuICAgICAgICBzY2hlZHVsZU1pY3JvVGFzayhzb3VyY2UsIGNhbGxiYWNrLCBkYXRhLCBjdXN0b21TY2hlZHVsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVUYXNrKG5ldyBab25lVGFzayhtaWNyb1Rhc2ssIHNvdXJjZSwgY2FsbGJhY2ssIGRhdGEsIGN1c3RvbVNjaGVkdWxlLCB1bmRlZmluZWQpKTtcbiAgICAgICAgfVxuICAgICAgICBzY2hlZHVsZU1hY3JvVGFzayhzb3VyY2UsIGNhbGxiYWNrLCBkYXRhLCBjdXN0b21TY2hlZHVsZSwgY3VzdG9tQ2FuY2VsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZVRhc2sobmV3IFpvbmVUYXNrKG1hY3JvVGFzaywgc291cmNlLCBjYWxsYmFjaywgZGF0YSwgY3VzdG9tU2NoZWR1bGUsIGN1c3RvbUNhbmNlbCkpO1xuICAgICAgICB9XG4gICAgICAgIHNjaGVkdWxlRXZlbnRUYXNrKHNvdXJjZSwgY2FsbGJhY2ssIGRhdGEsIGN1c3RvbVNjaGVkdWxlLCBjdXN0b21DYW5jZWwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNjaGVkdWxlVGFzayhuZXcgWm9uZVRhc2soZXZlbnRUYXNrLCBzb3VyY2UsIGNhbGxiYWNrLCBkYXRhLCBjdXN0b21TY2hlZHVsZSwgY3VzdG9tQ2FuY2VsKSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FuY2VsVGFzayh0YXNrKSB7XG4gICAgICAgICAgICBpZiAodGFzay56b25lICE9IHRoaXMpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIHRhc2sgY2FuIG9ubHkgYmUgY2FuY2VsbGVkIGluIHRoZSB6b25lIG9mIGNyZWF0aW9uISAoQ3JlYXRpb246ICcgK1xuICAgICAgICAgICAgICAgICAgICAodGFzay56b25lIHx8IE5PX1pPTkUpLm5hbWUgKyAnOyBFeGVjdXRpb246ICcgKyB0aGlzLm5hbWUgKyAnKScpO1xuICAgICAgICAgICAgaWYgKHRhc2suc3RhdGUgIT09IHNjaGVkdWxlZCAmJiB0YXNrLnN0YXRlICE9PSBydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFzay5fdHJhbnNpdGlvblRvKGNhbmNlbGluZywgc2NoZWR1bGVkLCBydW5uaW5nKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fem9uZURlbGVnYXRlLmNhbmNlbFRhc2sodGhpcywgdGFzayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgZXJyb3Igb2NjdXJzIHdoZW4gY2FuY2VsVGFzaywgdHJhbnNpdCB0aGUgc3RhdGUgdG8gdW5rbm93blxuICAgICAgICAgICAgICAgIHRhc2suX3RyYW5zaXRpb25Ubyh1bmtub3duLCBjYW5jZWxpbmcpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3pvbmVEZWxlZ2F0ZS5oYW5kbGVFcnJvcih0aGlzLCBlcnIpO1xuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVRhc2tDb3VudCh0YXNrLCAtMSk7XG4gICAgICAgICAgICB0YXNrLl90cmFuc2l0aW9uVG8obm90U2NoZWR1bGVkLCBjYW5jZWxpbmcpO1xuICAgICAgICAgICAgdGFzay5ydW5Db3VudCA9IDA7XG4gICAgICAgICAgICByZXR1cm4gdGFzaztcbiAgICAgICAgfVxuICAgICAgICBfdXBkYXRlVGFza0NvdW50KHRhc2ssIGNvdW50KSB7XG4gICAgICAgICAgICBjb25zdCB6b25lRGVsZWdhdGVzID0gdGFzay5fem9uZURlbGVnYXRlcztcbiAgICAgICAgICAgIGlmIChjb3VudCA9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRhc2suX3pvbmVEZWxlZ2F0ZXMgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB6b25lRGVsZWdhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgem9uZURlbGVnYXRlc1tpXS5fdXBkYXRlVGFza0NvdW50KHRhc2sudHlwZSwgY291bnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IERFTEVHQVRFX1pTID0ge1xuICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgb25IYXNUYXNrOiAoZGVsZWdhdGUsIF8sIHRhcmdldCwgaGFzVGFza1N0YXRlKSA9PiBkZWxlZ2F0ZS5oYXNUYXNrKHRhcmdldCwgaGFzVGFza1N0YXRlKSxcbiAgICAgICAgb25TY2hlZHVsZVRhc2s6IChkZWxlZ2F0ZSwgXywgdGFyZ2V0LCB0YXNrKSA9PiBkZWxlZ2F0ZS5zY2hlZHVsZVRhc2sodGFyZ2V0LCB0YXNrKSxcbiAgICAgICAgb25JbnZva2VUYXNrOiAoZGVsZWdhdGUsIF8sIHRhcmdldCwgdGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpID0+IGRlbGVnYXRlLmludm9rZVRhc2sodGFyZ2V0LCB0YXNrLCBhcHBseVRoaXMsIGFwcGx5QXJncyksXG4gICAgICAgIG9uQ2FuY2VsVGFzazogKGRlbGVnYXRlLCBfLCB0YXJnZXQsIHRhc2spID0+IGRlbGVnYXRlLmNhbmNlbFRhc2sodGFyZ2V0LCB0YXNrKVxuICAgIH07XG4gICAgY2xhc3MgX1pvbmVEZWxlZ2F0ZSB7XG4gICAgICAgIGNvbnN0cnVjdG9yKHpvbmUsIHBhcmVudERlbGVnYXRlLCB6b25lU3BlYykge1xuICAgICAgICAgICAgdGhpcy5fdGFza0NvdW50cyA9IHsgJ21pY3JvVGFzayc6IDAsICdtYWNyb1Rhc2snOiAwLCAnZXZlbnRUYXNrJzogMCB9O1xuICAgICAgICAgICAgdGhpcy56b25lID0gem9uZTtcbiAgICAgICAgICAgIHRoaXMuX3BhcmVudERlbGVnYXRlID0gcGFyZW50RGVsZWdhdGU7XG4gICAgICAgICAgICB0aGlzLl9mb3JrWlMgPSB6b25lU3BlYyAmJiAoem9uZVNwZWMgJiYgem9uZVNwZWMub25Gb3JrID8gem9uZVNwZWMgOiBwYXJlbnREZWxlZ2F0ZS5fZm9ya1pTKTtcbiAgICAgICAgICAgIHRoaXMuX2ZvcmtEbGd0ID0gem9uZVNwZWMgJiYgKHpvbmVTcGVjLm9uRm9yayA/IHBhcmVudERlbGVnYXRlIDogcGFyZW50RGVsZWdhdGUuX2ZvcmtEbGd0KTtcbiAgICAgICAgICAgIHRoaXMuX2ZvcmtDdXJyWm9uZSA9XG4gICAgICAgICAgICAgICAgem9uZVNwZWMgJiYgKHpvbmVTcGVjLm9uRm9yayA/IHRoaXMuem9uZSA6IHBhcmVudERlbGVnYXRlLl9mb3JrQ3VyclpvbmUpO1xuICAgICAgICAgICAgdGhpcy5faW50ZXJjZXB0WlMgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkludGVyY2VwdCA/IHpvbmVTcGVjIDogcGFyZW50RGVsZWdhdGUuX2ludGVyY2VwdFpTKTtcbiAgICAgICAgICAgIHRoaXMuX2ludGVyY2VwdERsZ3QgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkludGVyY2VwdCA/IHBhcmVudERlbGVnYXRlIDogcGFyZW50RGVsZWdhdGUuX2ludGVyY2VwdERsZ3QpO1xuICAgICAgICAgICAgdGhpcy5faW50ZXJjZXB0Q3VyclpvbmUgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkludGVyY2VwdCA/IHRoaXMuem9uZSA6IHBhcmVudERlbGVnYXRlLl9pbnRlcmNlcHRDdXJyWm9uZSk7XG4gICAgICAgICAgICB0aGlzLl9pbnZva2VaUyA9IHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkludm9rZSA/IHpvbmVTcGVjIDogcGFyZW50RGVsZWdhdGUuX2ludm9rZVpTKTtcbiAgICAgICAgICAgIHRoaXMuX2ludm9rZURsZ3QgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkludm9rZSA/IHBhcmVudERlbGVnYXRlIDogcGFyZW50RGVsZWdhdGUuX2ludm9rZURsZ3QpO1xuICAgICAgICAgICAgdGhpcy5faW52b2tlQ3VyclpvbmUgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkludm9rZSA/IHRoaXMuem9uZSA6IHBhcmVudERlbGVnYXRlLl9pbnZva2VDdXJyWm9uZSk7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVFcnJvclpTID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25IYW5kbGVFcnJvciA/IHpvbmVTcGVjIDogcGFyZW50RGVsZWdhdGUuX2hhbmRsZUVycm9yWlMpO1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlRXJyb3JEbGd0ID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25IYW5kbGVFcnJvciA/IHBhcmVudERlbGVnYXRlIDogcGFyZW50RGVsZWdhdGUuX2hhbmRsZUVycm9yRGxndCk7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVFcnJvckN1cnJab25lID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25IYW5kbGVFcnJvciA/IHRoaXMuem9uZSA6IHBhcmVudERlbGVnYXRlLl9oYW5kbGVFcnJvckN1cnJab25lKTtcbiAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlVGFza1pTID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25TY2hlZHVsZVRhc2sgPyB6b25lU3BlYyA6IHBhcmVudERlbGVnYXRlLl9zY2hlZHVsZVRhc2taUyk7XG4gICAgICAgICAgICB0aGlzLl9zY2hlZHVsZVRhc2tEbGd0ID0gem9uZVNwZWMgJiZcbiAgICAgICAgICAgICAgICAoem9uZVNwZWMub25TY2hlZHVsZVRhc2sgPyBwYXJlbnREZWxlZ2F0ZSA6IHBhcmVudERlbGVnYXRlLl9zY2hlZHVsZVRhc2tEbGd0KTtcbiAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlVGFza0N1cnJab25lID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25TY2hlZHVsZVRhc2sgPyB0aGlzLnpvbmUgOiBwYXJlbnREZWxlZ2F0ZS5fc2NoZWR1bGVUYXNrQ3VyclpvbmUpO1xuICAgICAgICAgICAgdGhpcy5faW52b2tlVGFza1pTID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25JbnZva2VUYXNrID8gem9uZVNwZWMgOiBwYXJlbnREZWxlZ2F0ZS5faW52b2tlVGFza1pTKTtcbiAgICAgICAgICAgIHRoaXMuX2ludm9rZVRhc2tEbGd0ID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25JbnZva2VUYXNrID8gcGFyZW50RGVsZWdhdGUgOiBwYXJlbnREZWxlZ2F0ZS5faW52b2tlVGFza0RsZ3QpO1xuICAgICAgICAgICAgdGhpcy5faW52b2tlVGFza0N1cnJab25lID1cbiAgICAgICAgICAgICAgICB6b25lU3BlYyAmJiAoem9uZVNwZWMub25JbnZva2VUYXNrID8gdGhpcy56b25lIDogcGFyZW50RGVsZWdhdGUuX2ludm9rZVRhc2tDdXJyWm9uZSk7XG4gICAgICAgICAgICB0aGlzLl9jYW5jZWxUYXNrWlMgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkNhbmNlbFRhc2sgPyB6b25lU3BlYyA6IHBhcmVudERlbGVnYXRlLl9jYW5jZWxUYXNrWlMpO1xuICAgICAgICAgICAgdGhpcy5fY2FuY2VsVGFza0RsZ3QgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkNhbmNlbFRhc2sgPyBwYXJlbnREZWxlZ2F0ZSA6IHBhcmVudERlbGVnYXRlLl9jYW5jZWxUYXNrRGxndCk7XG4gICAgICAgICAgICB0aGlzLl9jYW5jZWxUYXNrQ3VyclpvbmUgPVxuICAgICAgICAgICAgICAgIHpvbmVTcGVjICYmICh6b25lU3BlYy5vbkNhbmNlbFRhc2sgPyB0aGlzLnpvbmUgOiBwYXJlbnREZWxlZ2F0ZS5fY2FuY2VsVGFza0N1cnJab25lKTtcbiAgICAgICAgICAgIHRoaXMuX2hhc1Rhc2taUyA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9oYXNUYXNrRGxndCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9oYXNUYXNrRGxndE93bmVyID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2hhc1Rhc2tDdXJyWm9uZSA9IG51bGw7XG4gICAgICAgICAgICBjb25zdCB6b25lU3BlY0hhc1Rhc2sgPSB6b25lU3BlYyAmJiB6b25lU3BlYy5vbkhhc1Rhc2s7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRIYXNUYXNrID0gcGFyZW50RGVsZWdhdGUgJiYgcGFyZW50RGVsZWdhdGUuX2hhc1Rhc2taUztcbiAgICAgICAgICAgIGlmICh6b25lU3BlY0hhc1Rhc2sgfHwgcGFyZW50SGFzVGFzaykge1xuICAgICAgICAgICAgICAgIC8vIElmIHdlIG5lZWQgdG8gcmVwb3J0IGhhc1Rhc2ssIHRoYW4gdGhpcyBaUyBuZWVkcyB0byBkbyByZWYgY291bnRpbmcgb24gdGFza3MuIEluIHN1Y2hcbiAgICAgICAgICAgICAgICAvLyBhIGNhc2UgYWxsIHRhc2sgcmVsYXRlZCBpbnRlcmNlcHRvcnMgbXVzdCBnbyB0aHJvdWdoIHRoaXMgWkQuIFdlIGNhbid0IHNob3J0IGNpcmN1aXQgaXQuXG4gICAgICAgICAgICAgICAgdGhpcy5faGFzVGFza1pTID0gem9uZVNwZWNIYXNUYXNrID8gem9uZVNwZWMgOiBERUxFR0FURV9aUztcbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNUYXNrRGxndCA9IHBhcmVudERlbGVnYXRlO1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhc1Rhc2tEbGd0T3duZXIgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhc1Rhc2tDdXJyWm9uZSA9IHpvbmU7XG4gICAgICAgICAgICAgICAgaWYgKCF6b25lU3BlYy5vblNjaGVkdWxlVGFzaykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY2hlZHVsZVRhc2taUyA9IERFTEVHQVRFX1pTO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY2hlZHVsZVRhc2tEbGd0ID0gcGFyZW50RGVsZWdhdGU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NjaGVkdWxlVGFza0N1cnJab25lID0gdGhpcy56b25lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXpvbmVTcGVjLm9uSW52b2tlVGFzaykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnZva2VUYXNrWlMgPSBERUxFR0FURV9aUztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW52b2tlVGFza0RsZ3QgPSBwYXJlbnREZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW52b2tlVGFza0N1cnJab25lID0gdGhpcy56b25lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXpvbmVTcGVjLm9uQ2FuY2VsVGFzaykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYW5jZWxUYXNrWlMgPSBERUxFR0FURV9aUztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FuY2VsVGFza0RsZ3QgPSBwYXJlbnREZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FuY2VsVGFza0N1cnJab25lID0gdGhpcy56b25lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3JrKHRhcmdldFpvbmUsIHpvbmVTcGVjKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZm9ya1pTID8gdGhpcy5fZm9ya1pTLm9uRm9yayh0aGlzLl9mb3JrRGxndCwgdGhpcy56b25lLCB0YXJnZXRab25lLCB6b25lU3BlYykgOlxuICAgICAgICAgICAgICAgIG5ldyBab25lKHRhcmdldFpvbmUsIHpvbmVTcGVjKTtcbiAgICAgICAgfVxuICAgICAgICBpbnRlcmNlcHQodGFyZ2V0Wm9uZSwgY2FsbGJhY2ssIHNvdXJjZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyY2VwdFpTID9cbiAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcmNlcHRaUy5vbkludGVyY2VwdCh0aGlzLl9pbnRlcmNlcHREbGd0LCB0aGlzLl9pbnRlcmNlcHRDdXJyWm9uZSwgdGFyZ2V0Wm9uZSwgY2FsbGJhY2ssIHNvdXJjZSkgOlxuICAgICAgICAgICAgICAgIGNhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICAgIGludm9rZSh0YXJnZXRab25lLCBjYWxsYmFjaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MsIHNvdXJjZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ludm9rZVpTID8gdGhpcy5faW52b2tlWlMub25JbnZva2UodGhpcy5faW52b2tlRGxndCwgdGhpcy5faW52b2tlQ3VyclpvbmUsIHRhcmdldFpvbmUsIGNhbGxiYWNrLCBhcHBseVRoaXMsIGFwcGx5QXJncywgc291cmNlKSA6XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkoYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGhhbmRsZUVycm9yKHRhcmdldFpvbmUsIGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlRXJyb3JaUyA/XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlRXJyb3JaUy5vbkhhbmRsZUVycm9yKHRoaXMuX2hhbmRsZUVycm9yRGxndCwgdGhpcy5faGFuZGxlRXJyb3JDdXJyWm9uZSwgdGFyZ2V0Wm9uZSwgZXJyb3IpIDpcbiAgICAgICAgICAgICAgICB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHNjaGVkdWxlVGFzayh0YXJnZXRab25lLCB0YXNrKSB7XG4gICAgICAgICAgICBsZXQgcmV0dXJuVGFzayA9IHRhc2s7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2NoZWR1bGVUYXNrWlMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5faGFzVGFza1pTKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblRhc2suX3pvbmVEZWxlZ2F0ZXMucHVzaCh0aGlzLl9oYXNUYXNrRGxndE93bmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY2xhbmctZm9ybWF0IG9mZlxuICAgICAgICAgICAgICAgIHJldHVyblRhc2sgPSB0aGlzLl9zY2hlZHVsZVRhc2taUy5vblNjaGVkdWxlVGFzayh0aGlzLl9zY2hlZHVsZVRhc2tEbGd0LCB0aGlzLl9zY2hlZHVsZVRhc2tDdXJyWm9uZSwgdGFyZ2V0Wm9uZSwgdGFzayk7XG4gICAgICAgICAgICAgICAgLy8gY2xhbmctZm9ybWF0IG9uXG4gICAgICAgICAgICAgICAgaWYgKCFyZXR1cm5UYXNrKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5UYXNrID0gdGFzaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0YXNrLnNjaGVkdWxlRm4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGFzay5zY2hlZHVsZUZuKHRhc2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0YXNrLnR5cGUgPT0gbWljcm9UYXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlTWljcm9UYXNrKHRhc2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUYXNrIGlzIG1pc3Npbmcgc2NoZWR1bGVGbi4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuVGFzaztcbiAgICAgICAgfVxuICAgICAgICBpbnZva2VUYXNrKHRhcmdldFpvbmUsIHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW52b2tlVGFza1pTID8gdGhpcy5faW52b2tlVGFza1pTLm9uSW52b2tlVGFzayh0aGlzLl9pbnZva2VUYXNrRGxndCwgdGhpcy5faW52b2tlVGFza0N1cnJab25lLCB0YXJnZXRab25lLCB0YXNrLCBhcHBseVRoaXMsIGFwcGx5QXJncykgOlxuICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkoYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGNhbmNlbFRhc2sodGFyZ2V0Wm9uZSwgdGFzaykge1xuICAgICAgICAgICAgbGV0IHZhbHVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NhbmNlbFRhc2taUykge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5fY2FuY2VsVGFza1pTLm9uQ2FuY2VsVGFzayh0aGlzLl9jYW5jZWxUYXNrRGxndCwgdGhpcy5fY2FuY2VsVGFza0N1cnJab25lLCB0YXJnZXRab25lLCB0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghdGFzay5jYW5jZWxGbikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVGFzayBpcyBub3QgY2FuY2VsYWJsZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRhc2suY2FuY2VsRm4odGFzayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaGFzVGFzayh0YXJnZXRab25lLCBpc0VtcHR5KSB7XG4gICAgICAgICAgICAvLyBoYXNUYXNrIHNob3VsZCBub3QgdGhyb3cgZXJyb3Igc28gb3RoZXIgWm9uZURlbGVnYXRlXG4gICAgICAgICAgICAvLyBjYW4gc3RpbGwgdHJpZ2dlciBoYXNUYXNrIGNhbGxiYWNrXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hhc1Rhc2taUyAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYXNUYXNrWlMub25IYXNUYXNrKHRoaXMuX2hhc1Rhc2tEbGd0LCB0aGlzLl9oYXNUYXNrQ3VyclpvbmUsIHRhcmdldFpvbmUsIGlzRW1wdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRXJyb3IodGFyZ2V0Wm9uZSwgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cmVxdWlyZS1pbnRlcm5hbC13aXRoLXVuZGVyc2NvcmVcbiAgICAgICAgX3VwZGF0ZVRhc2tDb3VudCh0eXBlLCBjb3VudCkge1xuICAgICAgICAgICAgY29uc3QgY291bnRzID0gdGhpcy5fdGFza0NvdW50cztcbiAgICAgICAgICAgIGNvbnN0IHByZXYgPSBjb3VudHNbdHlwZV07XG4gICAgICAgICAgICBjb25zdCBuZXh0ID0gY291bnRzW3R5cGVdID0gcHJldiArIGNvdW50O1xuICAgICAgICAgICAgaWYgKG5leHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNb3JlIHRhc2tzIGV4ZWN1dGVkIHRoZW4gd2VyZSBzY2hlZHVsZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJldiA9PSAwIHx8IG5leHQgPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzRW1wdHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIG1pY3JvVGFzazogY291bnRzWydtaWNyb1Rhc2snXSA+IDAsXG4gICAgICAgICAgICAgICAgICAgIG1hY3JvVGFzazogY291bnRzWydtYWNyb1Rhc2snXSA+IDAsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VGFzazogY291bnRzWydldmVudFRhc2snXSA+IDAsXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZTogdHlwZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNUYXNrKHRoaXMuem9uZSwgaXNFbXB0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2xhc3MgWm9uZVRhc2sge1xuICAgICAgICBjb25zdHJ1Y3Rvcih0eXBlLCBzb3VyY2UsIGNhbGxiYWNrLCBvcHRpb25zLCBzY2hlZHVsZUZuLCBjYW5jZWxGbikge1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gICAgICAgICAgICB0aGlzLl96b25lID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMucnVuQ291bnQgPSAwO1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gICAgICAgICAgICB0aGlzLl96b25lRGVsZWdhdGVzID0gbnVsbDtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpyZXF1aXJlLWludGVybmFsLXdpdGgtdW5kZXJzY29yZVxuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSAnbm90U2NoZWR1bGVkJztcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IG9wdGlvbnM7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlRm4gPSBzY2hlZHVsZUZuO1xuICAgICAgICAgICAgdGhpcy5jYW5jZWxGbiA9IGNhbmNlbEZuO1xuICAgICAgICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgaXMgbm90IGRlZmluZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgLy8gVE9ETzogQEppYUxpUGFzc2lvbiBvcHRpb25zIHNob3VsZCBoYXZlIGludGVyZmFjZVxuICAgICAgICAgICAgaWYgKHR5cGUgPT09IGV2ZW50VGFzayAmJiBvcHRpb25zICYmIG9wdGlvbnMudXNlRykge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlID0gWm9uZVRhc2suaW52b2tlVGFzaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWm9uZVRhc2suaW52b2tlVGFzay5jYWxsKGdsb2JhbCwgc2VsZiwgdGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBpbnZva2VUYXNrKHRhc2ssIHRhcmdldCwgYXJncykge1xuICAgICAgICAgICAgaWYgKCF0YXNrKSB7XG4gICAgICAgICAgICAgICAgdGFzayA9IHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfbnVtYmVyT2ZOZXN0ZWRUYXNrRnJhbWVzKys7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRhc2sucnVuQ291bnQrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFzay56b25lLnJ1blRhc2sodGFzaywgdGFyZ2V0LCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmIChfbnVtYmVyT2ZOZXN0ZWRUYXNrRnJhbWVzID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZHJhaW5NaWNyb1Rhc2tRdWV1ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfbnVtYmVyT2ZOZXN0ZWRUYXNrRnJhbWVzLS07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZ2V0IHpvbmUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZTtcbiAgICAgICAgfVxuICAgICAgICBnZXQgc3RhdGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3RhdGU7XG4gICAgICAgIH1cbiAgICAgICAgY2FuY2VsU2NoZWR1bGVSZXF1ZXN0KCkge1xuICAgICAgICAgICAgdGhpcy5fdHJhbnNpdGlvblRvKG5vdFNjaGVkdWxlZCwgc2NoZWR1bGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJlcXVpcmUtaW50ZXJuYWwtd2l0aC11bmRlcnNjb3JlXG4gICAgICAgIF90cmFuc2l0aW9uVG8odG9TdGF0ZSwgZnJvbVN0YXRlMSwgZnJvbVN0YXRlMikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXRlID09PSBmcm9tU3RhdGUxIHx8IHRoaXMuX3N0YXRlID09PSBmcm9tU3RhdGUyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSB0b1N0YXRlO1xuICAgICAgICAgICAgICAgIGlmICh0b1N0YXRlID09IG5vdFNjaGVkdWxlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl96b25lRGVsZWdhdGVzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy50eXBlfSAnJHt0aGlzLnNvdXJjZX0nOiBjYW4gbm90IHRyYW5zaXRpb24gdG8gJyR7dG9TdGF0ZX0nLCBleHBlY3Rpbmcgc3RhdGUgJyR7ZnJvbVN0YXRlMX0nJHtmcm9tU3RhdGUyID8gJyBvciBcXCcnICsgZnJvbVN0YXRlMiArICdcXCcnIDogJyd9LCB3YXMgJyR7dGhpcy5fc3RhdGV9Jy5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0b1N0cmluZygpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGEgJiYgdHlwZW9mIHRoaXMuZGF0YS5oYW5kbGVJZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhLmhhbmRsZUlkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGFkZCB0b0pTT04gbWV0aG9kIHRvIHByZXZlbnQgY3ljbGljIGVycm9yIHdoZW5cbiAgICAgICAgLy8gY2FsbCBKU09OLnN0cmluZ2lmeSh6b25lVGFzaylcbiAgICAgICAgdG9KU09OKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICAgICAgICAgICAgc3RhdGU6IHRoaXMuc3RhdGUsXG4gICAgICAgICAgICAgICAgc291cmNlOiB0aGlzLnNvdXJjZSxcbiAgICAgICAgICAgICAgICB6b25lOiB0aGlzLnpvbmUubmFtZSxcbiAgICAgICAgICAgICAgICBydW5Db3VudDogdGhpcy5ydW5Db3VudFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAvLy8gIE1JQ1JPVEFTSyBRVUVVRVxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGNvbnN0IHN5bWJvbFNldFRpbWVvdXQgPSBfX3N5bWJvbF9fKCdzZXRUaW1lb3V0Jyk7XG4gICAgY29uc3Qgc3ltYm9sUHJvbWlzZSA9IF9fc3ltYm9sX18oJ1Byb21pc2UnKTtcbiAgICBjb25zdCBzeW1ib2xUaGVuID0gX19zeW1ib2xfXygndGhlbicpO1xuICAgIGxldCBfbWljcm9UYXNrUXVldWUgPSBbXTtcbiAgICBsZXQgX2lzRHJhaW5pbmdNaWNyb3Rhc2tRdWV1ZSA9IGZhbHNlO1xuICAgIGxldCBuYXRpdmVNaWNyb1Rhc2tRdWV1ZVByb21pc2U7XG4gICAgZnVuY3Rpb24gbmF0aXZlU2NoZWR1bGVNaWNyb1Rhc2soZnVuYykge1xuICAgICAgICBpZiAoIW5hdGl2ZU1pY3JvVGFza1F1ZXVlUHJvbWlzZSkge1xuICAgICAgICAgICAgaWYgKGdsb2JhbFtzeW1ib2xQcm9taXNlXSkge1xuICAgICAgICAgICAgICAgIG5hdGl2ZU1pY3JvVGFza1F1ZXVlUHJvbWlzZSA9IGdsb2JhbFtzeW1ib2xQcm9taXNlXS5yZXNvbHZlKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuYXRpdmVNaWNyb1Rhc2tRdWV1ZVByb21pc2UpIHtcbiAgICAgICAgICAgIGxldCBuYXRpdmVUaGVuID0gbmF0aXZlTWljcm9UYXNrUXVldWVQcm9taXNlW3N5bWJvbFRoZW5dO1xuICAgICAgICAgICAgaWYgKCFuYXRpdmVUaGVuKSB7XG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlIFByb21pc2UgaXMgbm90IHBhdGNoYWJsZSwgd2UgbmVlZCB0byB1c2UgYHRoZW5gIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gaXNzdWUgMTA3OFxuICAgICAgICAgICAgICAgIG5hdGl2ZVRoZW4gPSBuYXRpdmVNaWNyb1Rhc2tRdWV1ZVByb21pc2VbJ3RoZW4nXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5hdGl2ZVRoZW4uY2FsbChuYXRpdmVNaWNyb1Rhc2tRdWV1ZVByb21pc2UsIGZ1bmMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ2xvYmFsW3N5bWJvbFNldFRpbWVvdXRdKGZ1bmMsIDApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNjaGVkdWxlTWljcm9UYXNrKHRhc2spIHtcbiAgICAgICAgLy8gaWYgd2UgYXJlIG5vdCBydW5uaW5nIGluIGFueSB0YXNrLCBhbmQgdGhlcmUgaGFzIG5vdCBiZWVuIGFueXRoaW5nIHNjaGVkdWxlZFxuICAgICAgICAvLyB3ZSBtdXN0IGJvb3RzdHJhcCB0aGUgaW5pdGlhbCB0YXNrIGNyZWF0aW9uIGJ5IG1hbnVhbGx5IHNjaGVkdWxpbmcgdGhlIGRyYWluXG4gICAgICAgIGlmIChfbnVtYmVyT2ZOZXN0ZWRUYXNrRnJhbWVzID09PSAwICYmIF9taWNyb1Rhc2tRdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIFdlIGFyZSBub3QgcnVubmluZyBpbiBUYXNrLCBzbyB3ZSBuZWVkIHRvIGtpY2tzdGFydCB0aGUgbWljcm90YXNrIHF1ZXVlLlxuICAgICAgICAgICAgbmF0aXZlU2NoZWR1bGVNaWNyb1Rhc2soZHJhaW5NaWNyb1Rhc2tRdWV1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGFzayAmJiBfbWljcm9UYXNrUXVldWUucHVzaCh0YXNrKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZHJhaW5NaWNyb1Rhc2tRdWV1ZSgpIHtcbiAgICAgICAgaWYgKCFfaXNEcmFpbmluZ01pY3JvdGFza1F1ZXVlKSB7XG4gICAgICAgICAgICBfaXNEcmFpbmluZ01pY3JvdGFza1F1ZXVlID0gdHJ1ZTtcbiAgICAgICAgICAgIHdoaWxlIChfbWljcm9UYXNrUXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcXVldWUgPSBfbWljcm9UYXNrUXVldWU7XG4gICAgICAgICAgICAgICAgX21pY3JvVGFza1F1ZXVlID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXNrID0gcXVldWVbaV07XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXNrLnpvbmUucnVuVGFzayh0YXNrLCBudWxsLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hcGkub25VbmhhbmRsZWRFcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXBpLm1pY3JvdGFza0RyYWluRG9uZSgpO1xuICAgICAgICAgICAgX2lzRHJhaW5pbmdNaWNyb3Rhc2tRdWV1ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIC8vLyAgQk9PVFNUUkFQXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgY29uc3QgTk9fWk9ORSA9IHsgbmFtZTogJ05PIFpPTkUnIH07XG4gICAgY29uc3Qgbm90U2NoZWR1bGVkID0gJ25vdFNjaGVkdWxlZCcsIHNjaGVkdWxpbmcgPSAnc2NoZWR1bGluZycsIHNjaGVkdWxlZCA9ICdzY2hlZHVsZWQnLCBydW5uaW5nID0gJ3J1bm5pbmcnLCBjYW5jZWxpbmcgPSAnY2FuY2VsaW5nJywgdW5rbm93biA9ICd1bmtub3duJztcbiAgICBjb25zdCBtaWNyb1Rhc2sgPSAnbWljcm9UYXNrJywgbWFjcm9UYXNrID0gJ21hY3JvVGFzaycsIGV2ZW50VGFzayA9ICdldmVudFRhc2snO1xuICAgIGNvbnN0IHBhdGNoZXMgPSB7fTtcbiAgICBjb25zdCBfYXBpID0ge1xuICAgICAgICBzeW1ib2w6IF9fc3ltYm9sX18sXG4gICAgICAgIGN1cnJlbnRab25lRnJhbWU6ICgpID0+IF9jdXJyZW50Wm9uZUZyYW1lLFxuICAgICAgICBvblVuaGFuZGxlZEVycm9yOiBub29wLFxuICAgICAgICBtaWNyb3Rhc2tEcmFpbkRvbmU6IG5vb3AsXG4gICAgICAgIHNjaGVkdWxlTWljcm9UYXNrOiBzY2hlZHVsZU1pY3JvVGFzayxcbiAgICAgICAgc2hvd1VuY2F1Z2h0RXJyb3I6ICgpID0+ICFab25lW19fc3ltYm9sX18oJ2lnbm9yZUNvbnNvbGVFcnJvclVuY2F1Z2h0RXJyb3InKV0sXG4gICAgICAgIHBhdGNoRXZlbnRUYXJnZXQ6ICgpID0+IFtdLFxuICAgICAgICBwYXRjaE9uUHJvcGVydGllczogbm9vcCxcbiAgICAgICAgcGF0Y2hNZXRob2Q6ICgpID0+IG5vb3AsXG4gICAgICAgIGJpbmRBcmd1bWVudHM6ICgpID0+IFtdLFxuICAgICAgICBwYXRjaFRoZW46ICgpID0+IG5vb3AsXG4gICAgICAgIHBhdGNoTWFjcm9UYXNrOiAoKSA9PiBub29wLFxuICAgICAgICBwYXRjaEV2ZW50UHJvdG90eXBlOiAoKSA9PiBub29wLFxuICAgICAgICBpc0lFT3JFZGdlOiAoKSA9PiBmYWxzZSxcbiAgICAgICAgZ2V0R2xvYmFsT2JqZWN0czogKCkgPT4gdW5kZWZpbmVkLFxuICAgICAgICBPYmplY3REZWZpbmVQcm9wZXJ0eTogKCkgPT4gbm9vcCxcbiAgICAgICAgT2JqZWN0R2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOiAoKSA9PiB1bmRlZmluZWQsXG4gICAgICAgIE9iamVjdENyZWF0ZTogKCkgPT4gdW5kZWZpbmVkLFxuICAgICAgICBBcnJheVNsaWNlOiAoKSA9PiBbXSxcbiAgICAgICAgcGF0Y2hDbGFzczogKCkgPT4gbm9vcCxcbiAgICAgICAgd3JhcFdpdGhDdXJyZW50Wm9uZTogKCkgPT4gbm9vcCxcbiAgICAgICAgZmlsdGVyUHJvcGVydGllczogKCkgPT4gW10sXG4gICAgICAgIGF0dGFjaE9yaWdpblRvUGF0Y2hlZDogKCkgPT4gbm9vcCxcbiAgICAgICAgX3JlZGVmaW5lUHJvcGVydHk6ICgpID0+IG5vb3AsXG4gICAgICAgIHBhdGNoQ2FsbGJhY2tzOiAoKSA9PiBub29wLFxuICAgICAgICBuYXRpdmVTY2hlZHVsZU1pY3JvVGFzazogbmF0aXZlU2NoZWR1bGVNaWNyb1Rhc2tcbiAgICB9O1xuICAgIGxldCBfY3VycmVudFpvbmVGcmFtZSA9IHsgcGFyZW50OiBudWxsLCB6b25lOiBuZXcgWm9uZShudWxsLCBudWxsKSB9O1xuICAgIGxldCBfY3VycmVudFRhc2sgPSBudWxsO1xuICAgIGxldCBfbnVtYmVyT2ZOZXN0ZWRUYXNrRnJhbWVzID0gMDtcbiAgICBmdW5jdGlvbiBub29wKCkgeyB9XG4gICAgcGVyZm9ybWFuY2VNZWFzdXJlKCdab25lJywgJ1pvbmUnKTtcbiAgICByZXR1cm4gZ2xvYmFsWydab25lJ10gPSBab25lO1xufSkpKGdsb2JhbFRoaXMpO1xuXG4vKipcbiAqIFN1cHByZXNzIGNsb3N1cmUgY29tcGlsZXIgZXJyb3JzIGFib3V0IHVua25vd24gJ1pvbmUnIHZhcmlhYmxlXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBAc3VwcHJlc3Mge3VuZGVmaW5lZFZhcnMsZ2xvYmFsVGhpcyxtaXNzaW5nUmVxdWlyZX1cbiAqL1xuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJub2RlXCIvPlxuLy8gaXNzdWUgIzk4OSwgdG8gcmVkdWNlIGJ1bmRsZSBzaXplLCB1c2Ugc2hvcnQgbmFtZVxuLyoqIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgKi9cbmNvbnN0IE9iamVjdEdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4vKiogT2JqZWN0LmRlZmluZVByb3BlcnR5ICovXG5jb25zdCBPYmplY3REZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbi8qKiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgKi9cbmNvbnN0IE9iamVjdEdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xuLyoqIE9iamVjdC5jcmVhdGUgKi9cbmNvbnN0IE9iamVjdENyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG4vKiogQXJyYXkucHJvdG90eXBlLnNsaWNlICovXG5jb25zdCBBcnJheVNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuLyoqIGFkZEV2ZW50TGlzdGVuZXIgc3RyaW5nIGNvbnN0ICovXG5jb25zdCBBRERfRVZFTlRfTElTVEVORVJfU1RSID0gJ2FkZEV2ZW50TGlzdGVuZXInO1xuLyoqIHJlbW92ZUV2ZW50TGlzdGVuZXIgc3RyaW5nIGNvbnN0ICovXG5jb25zdCBSRU1PVkVfRVZFTlRfTElTVEVORVJfU1RSID0gJ3JlbW92ZUV2ZW50TGlzdGVuZXInO1xuLyoqIHpvbmVTeW1ib2wgYWRkRXZlbnRMaXN0ZW5lciAqL1xuY29uc3QgWk9ORV9TWU1CT0xfQUREX0VWRU5UX0xJU1RFTkVSID0gWm9uZS5fX3N5bWJvbF9fKEFERF9FVkVOVF9MSVNURU5FUl9TVFIpO1xuLyoqIHpvbmVTeW1ib2wgcmVtb3ZlRXZlbnRMaXN0ZW5lciAqL1xuY29uc3QgWk9ORV9TWU1CT0xfUkVNT1ZFX0VWRU5UX0xJU1RFTkVSID0gWm9uZS5fX3N5bWJvbF9fKFJFTU9WRV9FVkVOVF9MSVNURU5FUl9TVFIpO1xuLyoqIHRydWUgc3RyaW5nIGNvbnN0ICovXG5jb25zdCBUUlVFX1NUUiA9ICd0cnVlJztcbi8qKiBmYWxzZSBzdHJpbmcgY29uc3QgKi9cbmNvbnN0IEZBTFNFX1NUUiA9ICdmYWxzZSc7XG4vKiogWm9uZSBzeW1ib2wgcHJlZml4IHN0cmluZyBjb25zdC4gKi9cbmNvbnN0IFpPTkVfU1lNQk9MX1BSRUZJWCA9IFpvbmUuX19zeW1ib2xfXygnJyk7XG5mdW5jdGlvbiB3cmFwV2l0aEN1cnJlbnRab25lKGNhbGxiYWNrLCBzb3VyY2UpIHtcbiAgICByZXR1cm4gWm9uZS5jdXJyZW50LndyYXAoY2FsbGJhY2ssIHNvdXJjZSk7XG59XG5mdW5jdGlvbiBzY2hlZHVsZU1hY3JvVGFza1dpdGhDdXJyZW50Wm9uZShzb3VyY2UsIGNhbGxiYWNrLCBkYXRhLCBjdXN0b21TY2hlZHVsZSwgY3VzdG9tQ2FuY2VsKSB7XG4gICAgcmV0dXJuIFpvbmUuY3VycmVudC5zY2hlZHVsZU1hY3JvVGFzayhzb3VyY2UsIGNhbGxiYWNrLCBkYXRhLCBjdXN0b21TY2hlZHVsZSwgY3VzdG9tQ2FuY2VsKTtcbn1cbmNvbnN0IHpvbmVTeW1ib2wgPSBab25lLl9fc3ltYm9sX187XG5jb25zdCBpc1dpbmRvd0V4aXN0cyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xuY29uc3QgaW50ZXJuYWxXaW5kb3cgPSBpc1dpbmRvd0V4aXN0cyA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcbmNvbnN0IF9nbG9iYWwgPSBpc1dpbmRvd0V4aXN0cyAmJiBpbnRlcm5hbFdpbmRvdyB8fCBnbG9iYWxUaGlzO1xuY29uc3QgUkVNT1ZFX0FUVFJJQlVURSA9ICdyZW1vdmVBdHRyaWJ1dGUnO1xuZnVuY3Rpb24gYmluZEFyZ3VtZW50cyhhcmdzLCBzb3VyY2UpIHtcbiAgICBmb3IgKGxldCBpID0gYXJncy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3NbaV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGFyZ3NbaV0gPSB3cmFwV2l0aEN1cnJlbnRab25lKGFyZ3NbaV0sIHNvdXJjZSArICdfJyArIGkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcmdzO1xufVxuZnVuY3Rpb24gcGF0Y2hQcm90b3R5cGUocHJvdG90eXBlLCBmbk5hbWVzKSB7XG4gICAgY29uc3Qgc291cmNlID0gcHJvdG90eXBlLmNvbnN0cnVjdG9yWyduYW1lJ107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbk5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBmbk5hbWVzW2ldO1xuICAgICAgICBjb25zdCBkZWxlZ2F0ZSA9IHByb3RvdHlwZVtuYW1lXTtcbiAgICAgICAgaWYgKGRlbGVnYXRlKSB7XG4gICAgICAgICAgICBjb25zdCBwcm90b3R5cGVEZXNjID0gT2JqZWN0R2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvdHlwZSwgbmFtZSk7XG4gICAgICAgICAgICBpZiAoIWlzUHJvcGVydHlXcml0YWJsZShwcm90b3R5cGVEZXNjKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJvdG90eXBlW25hbWVdID0gKChkZWxlZ2F0ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGNoZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5hcHBseSh0aGlzLCBiaW5kQXJndW1lbnRzKGFyZ3VtZW50cywgc291cmNlICsgJy4nICsgbmFtZSkpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYXR0YWNoT3JpZ2luVG9QYXRjaGVkKHBhdGNoZWQsIGRlbGVnYXRlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0Y2hlZDtcbiAgICAgICAgICAgIH0pKGRlbGVnYXRlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGlzUHJvcGVydHlXcml0YWJsZShwcm9wZXJ0eURlc2MpIHtcbiAgICBpZiAoIXByb3BlcnR5RGVzYykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHByb3BlcnR5RGVzYy53cml0YWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gISh0eXBlb2YgcHJvcGVydHlEZXNjLmdldCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgcHJvcGVydHlEZXNjLnNldCA9PT0gJ3VuZGVmaW5lZCcpO1xufVxuY29uc3QgaXNXZWJXb3JrZXIgPSAodHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmIGluc3RhbmNlb2YgV29ya2VyR2xvYmFsU2NvcGUpO1xuLy8gTWFrZSBzdXJlIHRvIGFjY2VzcyBgcHJvY2Vzc2AgdGhyb3VnaCBgX2dsb2JhbGAgc28gdGhhdCBXZWJQYWNrIGRvZXMgbm90IGFjY2lkZW50YWxseSBicm93c2VyaWZ5XG4vLyB0aGlzIGNvZGUuXG5jb25zdCBpc05vZGUgPSAoISgnbncnIGluIF9nbG9iYWwpICYmIHR5cGVvZiBfZ2xvYmFsLnByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmXG4gICAge30udG9TdHJpbmcuY2FsbChfZ2xvYmFsLnByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXScpO1xuY29uc3QgaXNCcm93c2VyID0gIWlzTm9kZSAmJiAhaXNXZWJXb3JrZXIgJiYgISEoaXNXaW5kb3dFeGlzdHMgJiYgaW50ZXJuYWxXaW5kb3dbJ0hUTUxFbGVtZW50J10pO1xuLy8gd2UgYXJlIGluIGVsZWN0cm9uIG9mIG53LCBzbyB3ZSBhcmUgYm90aCBicm93c2VyIGFuZCBub2RlanNcbi8vIE1ha2Ugc3VyZSB0byBhY2Nlc3MgYHByb2Nlc3NgIHRocm91Z2ggYF9nbG9iYWxgIHNvIHRoYXQgV2ViUGFjayBkb2VzIG5vdCBhY2NpZGVudGFsbHkgYnJvd3NlcmlmeVxuLy8gdGhpcyBjb2RlLlxuY29uc3QgaXNNaXggPSB0eXBlb2YgX2dsb2JhbC5wcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHt9LnRvU3RyaW5nLmNhbGwoX2dsb2JhbC5wcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nICYmICFpc1dlYldvcmtlciAmJlxuICAgICEhKGlzV2luZG93RXhpc3RzICYmIGludGVybmFsV2luZG93WydIVE1MRWxlbWVudCddKTtcbmNvbnN0IHpvbmVTeW1ib2xFdmVudE5hbWVzJDEgPSB7fTtcbmNvbnN0IHdyYXBGbiA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3pvbmUuanMvaXNzdWVzLzkxMSwgaW4gSUUsIHNvbWV0aW1lc1xuICAgIC8vIGV2ZW50IHdpbGwgYmUgdW5kZWZpbmVkLCBzbyB3ZSBuZWVkIHRvIHVzZSB3aW5kb3cuZXZlbnRcbiAgICBldmVudCA9IGV2ZW50IHx8IF9nbG9iYWwuZXZlbnQ7XG4gICAgaWYgKCFldmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBldmVudE5hbWVTeW1ib2wgPSB6b25lU3ltYm9sRXZlbnROYW1lcyQxW2V2ZW50LnR5cGVdO1xuICAgIGlmICghZXZlbnROYW1lU3ltYm9sKSB7XG4gICAgICAgIGV2ZW50TmFtZVN5bWJvbCA9IHpvbmVTeW1ib2xFdmVudE5hbWVzJDFbZXZlbnQudHlwZV0gPSB6b25lU3ltYm9sKCdPTl9QUk9QRVJUWScgKyBldmVudC50eXBlKTtcbiAgICB9XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcyB8fCBldmVudC50YXJnZXQgfHwgX2dsb2JhbDtcbiAgICBjb25zdCBsaXN0ZW5lciA9IHRhcmdldFtldmVudE5hbWVTeW1ib2xdO1xuICAgIGxldCByZXN1bHQ7XG4gICAgaWYgKGlzQnJvd3NlciAmJiB0YXJnZXQgPT09IGludGVybmFsV2luZG93ICYmIGV2ZW50LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgLy8gd2luZG93Lm9uZXJyb3IgaGF2ZSBkaWZmZXJlbnQgc2lnbmF0dXJlXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9HbG9iYWxFdmVudEhhbmRsZXJzL29uZXJyb3Ijd2luZG93Lm9uZXJyb3JcbiAgICAgICAgLy8gYW5kIG9uZXJyb3IgY2FsbGJhY2sgd2lsbCBwcmV2ZW50IGRlZmF1bHQgd2hlbiBjYWxsYmFjayByZXR1cm4gdHJ1ZVxuICAgICAgICBjb25zdCBlcnJvckV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIHJlc3VsdCA9IGxpc3RlbmVyICYmXG4gICAgICAgICAgICBsaXN0ZW5lci5jYWxsKHRoaXMsIGVycm9yRXZlbnQubWVzc2FnZSwgZXJyb3JFdmVudC5maWxlbmFtZSwgZXJyb3JFdmVudC5saW5lbm8sIGVycm9yRXZlbnQuY29sbm8sIGVycm9yRXZlbnQuZXJyb3IpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBsaXN0ZW5lciAmJiBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAocmVzdWx0ICE9IHVuZGVmaW5lZCAmJiAhcmVzdWx0KSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuZnVuY3Rpb24gcGF0Y2hQcm9wZXJ0eShvYmosIHByb3AsIHByb3RvdHlwZSkge1xuICAgIGxldCBkZXNjID0gT2JqZWN0R2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgcHJvcCk7XG4gICAgaWYgKCFkZXNjICYmIHByb3RvdHlwZSkge1xuICAgICAgICAvLyB3aGVuIHBhdGNoIHdpbmRvdyBvYmplY3QsIHVzZSBwcm90b3R5cGUgdG8gY2hlY2sgcHJvcCBleGlzdCBvciBub3RcbiAgICAgICAgY29uc3QgcHJvdG90eXBlRGVzYyA9IE9iamVjdEdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90b3R5cGUsIHByb3ApO1xuICAgICAgICBpZiAocHJvdG90eXBlRGVzYykge1xuICAgICAgICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gaWYgdGhlIGRlc2NyaXB0b3Igbm90IGV4aXN0cyBvciBpcyBub3QgY29uZmlndXJhYmxlXG4gICAgLy8ganVzdCByZXR1cm5cbiAgICBpZiAoIWRlc2MgfHwgIWRlc2MuY29uZmlndXJhYmxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb25Qcm9wUGF0Y2hlZFN5bWJvbCA9IHpvbmVTeW1ib2woJ29uJyArIHByb3AgKyAncGF0Y2hlZCcpO1xuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkob25Qcm9wUGF0Y2hlZFN5bWJvbCkgJiYgb2JqW29uUHJvcFBhdGNoZWRTeW1ib2xdKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQSBwcm9wZXJ0eSBkZXNjcmlwdG9yIGNhbm5vdCBoYXZlIGdldHRlci9zZXR0ZXIgYW5kIGJlIHdyaXRhYmxlXG4gICAgLy8gZGVsZXRpbmcgdGhlIHdyaXRhYmxlIGFuZCB2YWx1ZSBwcm9wZXJ0aWVzIGF2b2lkcyB0aGlzIGVycm9yOlxuICAgIC8vXG4gICAgLy8gVHlwZUVycm9yOiBwcm9wZXJ0eSBkZXNjcmlwdG9ycyBtdXN0IG5vdCBzcGVjaWZ5IGEgdmFsdWUgb3IgYmUgd3JpdGFibGUgd2hlbiBhXG4gICAgLy8gZ2V0dGVyIG9yIHNldHRlciBoYXMgYmVlbiBzcGVjaWZpZWRcbiAgICBkZWxldGUgZGVzYy53cml0YWJsZTtcbiAgICBkZWxldGUgZGVzYy52YWx1ZTtcbiAgICBjb25zdCBvcmlnaW5hbERlc2NHZXQgPSBkZXNjLmdldDtcbiAgICBjb25zdCBvcmlnaW5hbERlc2NTZXQgPSBkZXNjLnNldDtcbiAgICAvLyBzbGljZSgyKSBjdXogJ29uY2xpY2snIC0+ICdjbGljaycsIGV0Y1xuICAgIGNvbnN0IGV2ZW50TmFtZSA9IHByb3Auc2xpY2UoMik7XG4gICAgbGV0IGV2ZW50TmFtZVN5bWJvbCA9IHpvbmVTeW1ib2xFdmVudE5hbWVzJDFbZXZlbnROYW1lXTtcbiAgICBpZiAoIWV2ZW50TmFtZVN5bWJvbCkge1xuICAgICAgICBldmVudE5hbWVTeW1ib2wgPSB6b25lU3ltYm9sRXZlbnROYW1lcyQxW2V2ZW50TmFtZV0gPSB6b25lU3ltYm9sKCdPTl9QUk9QRVJUWScgKyBldmVudE5hbWUpO1xuICAgIH1cbiAgICBkZXNjLnNldCA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAvLyBpbiBzb21lIG9mIHdpbmRvd3MncyBvbnByb3BlcnR5IGNhbGxiYWNrLCB0aGlzIGlzIHVuZGVmaW5lZFxuICAgICAgICAvLyBzbyB3ZSBuZWVkIHRvIGNoZWNrIGl0XG4gICAgICAgIGxldCB0YXJnZXQgPSB0aGlzO1xuICAgICAgICBpZiAoIXRhcmdldCAmJiBvYmogPT09IF9nbG9iYWwpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IF9nbG9iYWw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gdGFyZ2V0W2V2ZW50TmFtZVN5bWJvbF07XG4gICAgICAgIGlmICh0eXBlb2YgcHJldmlvdXNWYWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwRm4pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlzc3VlICM5NzgsIHdoZW4gb25sb2FkIGhhbmRsZXIgd2FzIGFkZGVkIGJlZm9yZSBsb2FkaW5nIHpvbmUuanNcbiAgICAgICAgLy8gd2Ugc2hvdWxkIHJlbW92ZSBpdCB3aXRoIG9yaWdpbmFsRGVzY1NldFxuICAgICAgICBvcmlnaW5hbERlc2NTZXQgJiYgb3JpZ2luYWxEZXNjU2V0LmNhbGwodGFyZ2V0LCBudWxsKTtcbiAgICAgICAgdGFyZ2V0W2V2ZW50TmFtZVN5bWJvbF0gPSBuZXdWYWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwRm4sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gVGhlIGdldHRlciB3b3VsZCByZXR1cm4gdW5kZWZpbmVkIGZvciB1bmFzc2lnbmVkIHByb3BlcnRpZXMgYnV0IHRoZSBkZWZhdWx0IHZhbHVlIG9mIGFuXG4gICAgLy8gdW5hc3NpZ25lZCBwcm9wZXJ0eSBpcyBudWxsXG4gICAgZGVzYy5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGluIHNvbWUgb2Ygd2luZG93cydzIG9ucHJvcGVydHkgY2FsbGJhY2ssIHRoaXMgaXMgdW5kZWZpbmVkXG4gICAgICAgIC8vIHNvIHdlIG5lZWQgdG8gY2hlY2sgaXRcbiAgICAgICAgbGV0IHRhcmdldCA9IHRoaXM7XG4gICAgICAgIGlmICghdGFyZ2V0ICYmIG9iaiA9PT0gX2dsb2JhbCkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gX2dsb2JhbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSB0YXJnZXRbZXZlbnROYW1lU3ltYm9sXTtcbiAgICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3JpZ2luYWxEZXNjR2V0KSB7XG4gICAgICAgICAgICAvLyByZXN1bHQgd2lsbCBiZSBudWxsIHdoZW4gdXNlIGlubGluZSBldmVudCBhdHRyaWJ1dGUsXG4gICAgICAgICAgICAvLyBzdWNoIGFzIDxidXR0b24gb25jbGljaz1cImZ1bmMoKTtcIj5PSzwvYnV0dG9uPlxuICAgICAgICAgICAgLy8gYmVjYXVzZSB0aGUgb25jbGljayBmdW5jdGlvbiBpcyBpbnRlcm5hbCByYXcgdW5jb21waWxlZCBoYW5kbGVyXG4gICAgICAgICAgICAvLyB0aGUgb25jbGljayB3aWxsIGJlIGV2YWx1YXRlZCB3aGVuIGZpcnN0IHRpbWUgZXZlbnQgd2FzIHRyaWdnZXJlZCBvclxuICAgICAgICAgICAgLy8gdGhlIHByb3BlcnR5IGlzIGFjY2Vzc2VkLCBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci96b25lLmpzL2lzc3Vlcy81MjVcbiAgICAgICAgICAgIC8vIHNvIHdlIHNob3VsZCB1c2Ugb3JpZ2luYWwgbmF0aXZlIGdldCB0byByZXRyaWV2ZSB0aGUgaGFuZGxlclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gb3JpZ2luYWxEZXNjR2V0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBkZXNjLnNldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldFtSRU1PVkVfQVRUUklCVVRFXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucmVtb3ZlQXR0cmlidXRlKHByb3ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBPYmplY3REZWZpbmVQcm9wZXJ0eShvYmosIHByb3AsIGRlc2MpO1xuICAgIG9ialtvblByb3BQYXRjaGVkU3ltYm9sXSA9IHRydWU7XG59XG5mdW5jdGlvbiBwYXRjaE9uUHJvcGVydGllcyhvYmosIHByb3BlcnRpZXMsIHByb3RvdHlwZSkge1xuICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcGF0Y2hQcm9wZXJ0eShvYmosICdvbicgKyBwcm9wZXJ0aWVzW2ldLCBwcm90b3R5cGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBvblByb3BlcnRpZXMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHByb3Auc2xpY2UoMCwgMikgPT0gJ29uJykge1xuICAgICAgICAgICAgICAgIG9uUHJvcGVydGllcy5wdXNoKHByb3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgb25Qcm9wZXJ0aWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBwYXRjaFByb3BlcnR5KG9iaiwgb25Qcm9wZXJ0aWVzW2pdLCBwcm90b3R5cGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuY29uc3Qgb3JpZ2luYWxJbnN0YW5jZUtleSA9IHpvbmVTeW1ib2woJ29yaWdpbmFsSW5zdGFuY2UnKTtcbi8vIHdyYXAgc29tZSBuYXRpdmUgQVBJIG9uIGB3aW5kb3dgXG5mdW5jdGlvbiBwYXRjaENsYXNzKGNsYXNzTmFtZSkge1xuICAgIGNvbnN0IE9yaWdpbmFsQ2xhc3MgPSBfZ2xvYmFsW2NsYXNzTmFtZV07XG4gICAgaWYgKCFPcmlnaW5hbENsYXNzKVxuICAgICAgICByZXR1cm47XG4gICAgLy8ga2VlcCBvcmlnaW5hbCBjbGFzcyBpbiBnbG9iYWxcbiAgICBfZ2xvYmFsW3pvbmVTeW1ib2woY2xhc3NOYW1lKV0gPSBPcmlnaW5hbENsYXNzO1xuICAgIF9nbG9iYWxbY2xhc3NOYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgYSA9IGJpbmRBcmd1bWVudHMoYXJndW1lbnRzLCBjbGFzc05hbWUpO1xuICAgICAgICBzd2l0Y2ggKGEubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgdGhpc1tvcmlnaW5hbEluc3RhbmNlS2V5XSA9IG5ldyBPcmlnaW5hbENsYXNzKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgdGhpc1tvcmlnaW5hbEluc3RhbmNlS2V5XSA9IG5ldyBPcmlnaW5hbENsYXNzKGFbMF0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIHRoaXNbb3JpZ2luYWxJbnN0YW5jZUtleV0gPSBuZXcgT3JpZ2luYWxDbGFzcyhhWzBdLCBhWzFdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICB0aGlzW29yaWdpbmFsSW5zdGFuY2VLZXldID0gbmV3IE9yaWdpbmFsQ2xhc3MoYVswXSwgYVsxXSwgYVsyXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgdGhpc1tvcmlnaW5hbEluc3RhbmNlS2V5XSA9IG5ldyBPcmlnaW5hbENsYXNzKGFbMF0sIGFbMV0sIGFbMl0sIGFbM10pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FyZyBsaXN0IHRvbyBsb25nLicpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBhdHRhY2ggb3JpZ2luYWwgZGVsZWdhdGUgdG8gcGF0Y2hlZCBmdW5jdGlvblxuICAgIGF0dGFjaE9yaWdpblRvUGF0Y2hlZChfZ2xvYmFsW2NsYXNzTmFtZV0sIE9yaWdpbmFsQ2xhc3MpO1xuICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IE9yaWdpbmFsQ2xhc3MoZnVuY3Rpb24gKCkgeyB9KTtcbiAgICBsZXQgcHJvcDtcbiAgICBmb3IgKHByb3AgaW4gaW5zdGFuY2UpIHtcbiAgICAgICAgLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTQ0NzIxXG4gICAgICAgIGlmIChjbGFzc05hbWUgPT09ICdYTUxIdHRwUmVxdWVzdCcgJiYgcHJvcCA9PT0gJ3Jlc3BvbnNlQmxvYicpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGluc3RhbmNlW3Byb3BdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgX2dsb2JhbFtjbGFzc05hbWVdLnByb3RvdHlwZVtwcm9wXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbb3JpZ2luYWxJbnN0YW5jZUtleV1bcHJvcF0uYXBwbHkodGhpc1tvcmlnaW5hbEluc3RhbmNlS2V5XSwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0RGVmaW5lUHJvcGVydHkoX2dsb2JhbFtjbGFzc05hbWVdLnByb3RvdHlwZSwgcHJvcCwge1xuICAgICAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbb3JpZ2luYWxJbnN0YW5jZUtleV1bcHJvcF0gPSB3cmFwV2l0aEN1cnJlbnRab25lKGZuLCBjbGFzc05hbWUgKyAnLicgKyBwcm9wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBrZWVwIGNhbGxiYWNrIGluIHdyYXBwZWQgZnVuY3Rpb24gc28gd2UgY2FuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXNlIGl0IGluIEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZyB0byByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgbmF0aXZlIG9uZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2hPcmlnaW5Ub1BhdGNoZWQodGhpc1tvcmlnaW5hbEluc3RhbmNlS2V5XVtwcm9wXSwgZm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1tvcmlnaW5hbEluc3RhbmNlS2V5XVtwcm9wXSA9IGZuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW29yaWdpbmFsSW5zdGFuY2VLZXldW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0ocHJvcCkpO1xuICAgIH1cbiAgICBmb3IgKHByb3AgaW4gT3JpZ2luYWxDbGFzcykge1xuICAgICAgICBpZiAocHJvcCAhPT0gJ3Byb3RvdHlwZScgJiYgT3JpZ2luYWxDbGFzcy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgX2dsb2JhbFtjbGFzc05hbWVdW3Byb3BdID0gT3JpZ2luYWxDbGFzc1twcm9wXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHBhdGNoTWV0aG9kKHRhcmdldCwgbmFtZSwgcGF0Y2hGbikge1xuICAgIGxldCBwcm90byA9IHRhcmdldDtcbiAgICB3aGlsZSAocHJvdG8gJiYgIXByb3RvLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIHByb3RvID0gT2JqZWN0R2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgIH1cbiAgICBpZiAoIXByb3RvICYmIHRhcmdldFtuYW1lXSkge1xuICAgICAgICAvLyBzb21laG93IHdlIGRpZCBub3QgZmluZCBpdCwgYnV0IHdlIGNhbiBzZWUgaXQuIFRoaXMgaGFwcGVucyBvbiBJRSBmb3IgV2luZG93IHByb3BlcnRpZXMuXG4gICAgICAgIHByb3RvID0gdGFyZ2V0O1xuICAgIH1cbiAgICBjb25zdCBkZWxlZ2F0ZU5hbWUgPSB6b25lU3ltYm9sKG5hbWUpO1xuICAgIGxldCBkZWxlZ2F0ZSA9IG51bGw7XG4gICAgaWYgKHByb3RvICYmICghKGRlbGVnYXRlID0gcHJvdG9bZGVsZWdhdGVOYW1lXSkgfHwgIXByb3RvLmhhc093blByb3BlcnR5KGRlbGVnYXRlTmFtZSkpKSB7XG4gICAgICAgIGRlbGVnYXRlID0gcHJvdG9bZGVsZWdhdGVOYW1lXSA9IHByb3RvW25hbWVdO1xuICAgICAgICAvLyBjaGVjayB3aGV0aGVyIHByb3RvW25hbWVdIGlzIHdyaXRhYmxlXG4gICAgICAgIC8vIHNvbWUgcHJvcGVydHkgaXMgcmVhZG9ubHkgaW4gc2FmYXJpLCBzdWNoIGFzIEh0bWxDYW52YXNFbGVtZW50LnByb3RvdHlwZS50b0Jsb2JcbiAgICAgICAgY29uc3QgZGVzYyA9IHByb3RvICYmIE9iamVjdEdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90bywgbmFtZSk7XG4gICAgICAgIGlmIChpc1Byb3BlcnR5V3JpdGFibGUoZGVzYykpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGNoRGVsZWdhdGUgPSBwYXRjaEZuKGRlbGVnYXRlLCBkZWxlZ2F0ZU5hbWUsIG5hbWUpO1xuICAgICAgICAgICAgcHJvdG9bbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGNoRGVsZWdhdGUodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhdHRhY2hPcmlnaW5Ub1BhdGNoZWQocHJvdG9bbmFtZV0sIGRlbGVnYXRlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVsZWdhdGU7XG59XG4vLyBUT0RPOiBASmlhTGlQYXNzaW9uLCBzdXBwb3J0IGNhbmNlbCB0YXNrIGxhdGVyIGlmIG5lY2Vzc2FyeVxuZnVuY3Rpb24gcGF0Y2hNYWNyb1Rhc2sob2JqLCBmdW5jTmFtZSwgbWV0YUNyZWF0b3IpIHtcbiAgICBsZXQgc2V0TmF0aXZlID0gbnVsbDtcbiAgICBmdW5jdGlvbiBzY2hlZHVsZVRhc2sodGFzaykge1xuICAgICAgICBjb25zdCBkYXRhID0gdGFzay5kYXRhO1xuICAgICAgICBkYXRhLmFyZ3NbZGF0YS5jYklkeF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXNrLmludm9rZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICBzZXROYXRpdmUuYXBwbHkoZGF0YS50YXJnZXQsIGRhdGEuYXJncyk7XG4gICAgICAgIHJldHVybiB0YXNrO1xuICAgIH1cbiAgICBzZXROYXRpdmUgPSBwYXRjaE1ldGhvZChvYmosIGZ1bmNOYW1lLCAoZGVsZWdhdGUpID0+IGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBtZXRhQ3JlYXRvcihzZWxmLCBhcmdzKTtcbiAgICAgICAgaWYgKG1ldGEuY2JJZHggPj0gMCAmJiB0eXBlb2YgYXJnc1ttZXRhLmNiSWR4XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIHNjaGVkdWxlTWFjcm9UYXNrV2l0aEN1cnJlbnRab25lKG1ldGEubmFtZSwgYXJnc1ttZXRhLmNiSWR4XSwgbWV0YSwgc2NoZWR1bGVUYXNrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGNhdXNlIGFuIGVycm9yIGJ5IGNhbGxpbmcgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGF0dGFjaE9yaWdpblRvUGF0Y2hlZChwYXRjaGVkLCBvcmlnaW5hbCkge1xuICAgIHBhdGNoZWRbem9uZVN5bWJvbCgnT3JpZ2luYWxEZWxlZ2F0ZScpXSA9IG9yaWdpbmFsO1xufVxubGV0IGlzRGV0ZWN0ZWRJRU9yRWRnZSA9IGZhbHNlO1xubGV0IGllT3JFZGdlID0gZmFsc2U7XG5mdW5jdGlvbiBpc0lFKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHVhID0gaW50ZXJuYWxXaW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICAgICAgaWYgKHVhLmluZGV4T2YoJ01TSUUgJykgIT09IC0xIHx8IHVhLmluZGV4T2YoJ1RyaWRlbnQvJykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gaXNJRU9yRWRnZSgpIHtcbiAgICBpZiAoaXNEZXRlY3RlZElFT3JFZGdlKSB7XG4gICAgICAgIHJldHVybiBpZU9yRWRnZTtcbiAgICB9XG4gICAgaXNEZXRlY3RlZElFT3JFZGdlID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB1YSA9IGludGVybmFsV2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgICAgIGlmICh1YS5pbmRleE9mKCdNU0lFICcpICE9PSAtMSB8fCB1YS5pbmRleE9mKCdUcmlkZW50LycpICE9PSAtMSB8fCB1YS5pbmRleE9mKCdFZGdlLycpICE9PSAtMSkge1xuICAgICAgICAgICAgaWVPckVkZ2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgIH1cbiAgICByZXR1cm4gaWVPckVkZ2U7XG59XG5cblpvbmUuX19sb2FkX3BhdGNoKCdab25lQXdhcmVQcm9taXNlJywgKGdsb2JhbCwgWm9uZSwgYXBpKSA9PiB7XG4gICAgY29uc3QgT2JqZWN0R2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbiAgICBjb25zdCBPYmplY3REZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgICBmdW5jdGlvbiByZWFkYWJsZU9iamVjdFRvU3RyaW5nKG9iaikge1xuICAgICAgICBpZiAob2JqICYmIG9iai50b1N0cmluZyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZykge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lO1xuICAgICAgICAgICAgcmV0dXJuIChjbGFzc05hbWUgPyBjbGFzc05hbWUgOiAnJykgKyAnOiAnICsgSlNPTi5zdHJpbmdpZnkob2JqKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqID8gb2JqLnRvU3RyaW5nKCkgOiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcbiAgICB9XG4gICAgY29uc3QgX19zeW1ib2xfXyA9IGFwaS5zeW1ib2w7XG4gICAgY29uc3QgX3VuY2F1Z2h0UHJvbWlzZUVycm9ycyA9IFtdO1xuICAgIGNvbnN0IGlzRGlzYWJsZVdyYXBwaW5nVW5jYXVnaHRQcm9taXNlUmVqZWN0aW9uID0gZ2xvYmFsW19fc3ltYm9sX18oJ0RJU0FCTEVfV1JBUFBJTkdfVU5DQVVHSFRfUFJPTUlTRV9SRUpFQ1RJT04nKV0gIT09IGZhbHNlO1xuICAgIGNvbnN0IHN5bWJvbFByb21pc2UgPSBfX3N5bWJvbF9fKCdQcm9taXNlJyk7XG4gICAgY29uc3Qgc3ltYm9sVGhlbiA9IF9fc3ltYm9sX18oJ3RoZW4nKTtcbiAgICBjb25zdCBjcmVhdGlvblRyYWNlID0gJ19fY3JlYXRpb25UcmFjZV9fJztcbiAgICBhcGkub25VbmhhbmRsZWRFcnJvciA9IChlKSA9PiB7XG4gICAgICAgIGlmIChhcGkuc2hvd1VuY2F1Z2h0RXJyb3IoKSkge1xuICAgICAgICAgICAgY29uc3QgcmVqZWN0aW9uID0gZSAmJiBlLnJlamVjdGlvbjtcbiAgICAgICAgICAgIGlmIChyZWplY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdVbmhhbmRsZWQgUHJvbWlzZSByZWplY3Rpb246JywgcmVqZWN0aW9uIGluc3RhbmNlb2YgRXJyb3IgPyByZWplY3Rpb24ubWVzc2FnZSA6IHJlamVjdGlvbiwgJzsgWm9uZTonLCBlLnpvbmUubmFtZSwgJzsgVGFzazonLCBlLnRhc2sgJiYgZS50YXNrLnNvdXJjZSwgJzsgVmFsdWU6JywgcmVqZWN0aW9uLCByZWplY3Rpb24gaW5zdGFuY2VvZiBFcnJvciA/IHJlamVjdGlvbi5zdGFjayA6IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBhcGkubWljcm90YXNrRHJhaW5Eb25lID0gKCkgPT4ge1xuICAgICAgICB3aGlsZSAoX3VuY2F1Z2h0UHJvbWlzZUVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVuY2F1Z2h0UHJvbWlzZUVycm9yID0gX3VuY2F1Z2h0UHJvbWlzZUVycm9ycy5zaGlmdCgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB1bmNhdWdodFByb21pc2VFcnJvci56b25lLnJ1bkd1YXJkZWQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodW5jYXVnaHRQcm9taXNlRXJyb3IudGhyb3dPcmlnaW5hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgdW5jYXVnaHRQcm9taXNlRXJyb3IucmVqZWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHVuY2F1Z2h0UHJvbWlzZUVycm9yO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlVW5oYW5kbGVkUmVqZWN0aW9uKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgVU5IQU5ETEVEX1BST01JU0VfUkVKRUNUSU9OX0hBTkRMRVJfU1lNQk9MID0gX19zeW1ib2xfXygndW5oYW5kbGVkUHJvbWlzZVJlamVjdGlvbkhhbmRsZXInKTtcbiAgICBmdW5jdGlvbiBoYW5kbGVVbmhhbmRsZWRSZWplY3Rpb24oZSkge1xuICAgICAgICBhcGkub25VbmhhbmRsZWRFcnJvcihlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBab25lW1VOSEFORExFRF9QUk9NSVNFX1JFSkVDVElPTl9IQU5ETEVSX1NZTUJPTF07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzVGhlbmFibGUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLnRoZW47XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZvcndhcmRSZXNvbHV0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZm9yd2FyZFJlamVjdGlvbihyZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIFpvbmVBd2FyZVByb21pc2UucmVqZWN0KHJlamVjdGlvbik7XG4gICAgfVxuICAgIGNvbnN0IHN5bWJvbFN0YXRlID0gX19zeW1ib2xfXygnc3RhdGUnKTtcbiAgICBjb25zdCBzeW1ib2xWYWx1ZSA9IF9fc3ltYm9sX18oJ3ZhbHVlJyk7XG4gICAgY29uc3Qgc3ltYm9sRmluYWxseSA9IF9fc3ltYm9sX18oJ2ZpbmFsbHknKTtcbiAgICBjb25zdCBzeW1ib2xQYXJlbnRQcm9taXNlVmFsdWUgPSBfX3N5bWJvbF9fKCdwYXJlbnRQcm9taXNlVmFsdWUnKTtcbiAgICBjb25zdCBzeW1ib2xQYXJlbnRQcm9taXNlU3RhdGUgPSBfX3N5bWJvbF9fKCdwYXJlbnRQcm9taXNlU3RhdGUnKTtcbiAgICBjb25zdCBzb3VyY2UgPSAnUHJvbWlzZS50aGVuJztcbiAgICBjb25zdCBVTlJFU09MVkVEID0gbnVsbDtcbiAgICBjb25zdCBSRVNPTFZFRCA9IHRydWU7XG4gICAgY29uc3QgUkVKRUNURUQgPSBmYWxzZTtcbiAgICBjb25zdCBSRUpFQ1RFRF9OT19DQVRDSCA9IDA7XG4gICAgZnVuY3Rpb24gbWFrZVJlc29sdmVyKHByb21pc2UsIHN0YXRlKSB7XG4gICAgICAgIHJldHVybiAodikgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlUHJvbWlzZShwcm9taXNlLCBzdGF0ZSwgdik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZVByb21pc2UocHJvbWlzZSwgZmFsc2UsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBEbyBub3QgcmV0dXJuIHZhbHVlIG9yIHlvdSB3aWxsIGJyZWFrIHRoZSBQcm9taXNlIHNwZWMuXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IG9uY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCB3YXNDYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIod3JhcHBlZEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICh3YXNDYWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3YXNDYWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHdyYXBwZWRGdW5jdGlvbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGNvbnN0IFRZUEVfRVJST1IgPSAnUHJvbWlzZSByZXNvbHZlZCB3aXRoIGl0c2VsZic7XG4gICAgY29uc3QgQ1VSUkVOVF9UQVNLX1RSQUNFX1NZTUJPTCA9IF9fc3ltYm9sX18oJ2N1cnJlbnRUYXNrVHJhY2UnKTtcbiAgICAvLyBQcm9taXNlIFJlc29sdXRpb25cbiAgICBmdW5jdGlvbiByZXNvbHZlUHJvbWlzZShwcm9taXNlLCBzdGF0ZSwgdmFsdWUpIHtcbiAgICAgICAgY29uc3Qgb25jZVdyYXBwZXIgPSBvbmNlKCk7XG4gICAgICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihUWVBFX0VSUk9SKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvbWlzZVtzeW1ib2xTdGF0ZV0gPT09IFVOUkVTT0xWRUQpIHtcbiAgICAgICAgICAgIC8vIHNob3VsZCBvbmx5IGdldCB2YWx1ZS50aGVuIG9uY2UgYmFzZWQgb24gcHJvbWlzZSBzcGVjLlxuICAgICAgICAgICAgbGV0IHRoZW4gPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhlbiA9IHZhbHVlICYmIHZhbHVlLnRoZW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIG9uY2VXcmFwcGVyKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVByb21pc2UocHJvbWlzZSwgZmFsc2UsIGVycik7XG4gICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFpvbmVBd2FyZVByb21pc2UpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZSAhPT0gUkVKRUNURUQgJiYgdmFsdWUgaW5zdGFuY2VvZiBab25lQXdhcmVQcm9taXNlICYmXG4gICAgICAgICAgICAgICAgdmFsdWUuaGFzT3duUHJvcGVydHkoc3ltYm9sU3RhdGUpICYmIHZhbHVlLmhhc093blByb3BlcnR5KHN5bWJvbFZhbHVlKSAmJlxuICAgICAgICAgICAgICAgIHZhbHVlW3N5bWJvbFN0YXRlXSAhPT0gVU5SRVNPTFZFRCkge1xuICAgICAgICAgICAgICAgIGNsZWFyUmVqZWN0ZWROb0NhdGNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlUHJvbWlzZShwcm9taXNlLCB2YWx1ZVtzeW1ib2xTdGF0ZV0sIHZhbHVlW3N5bWJvbFZhbHVlXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdGF0ZSAhPT0gUkVKRUNURUQgJiYgdHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGVuLmNhbGwodmFsdWUsIG9uY2VXcmFwcGVyKG1ha2VSZXNvbHZlcihwcm9taXNlLCBzdGF0ZSkpLCBvbmNlV3JhcHBlcihtYWtlUmVzb2x2ZXIocHJvbWlzZSwgZmFsc2UpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgb25jZVdyYXBwZXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZVByb21pc2UocHJvbWlzZSwgZmFsc2UsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZVtzeW1ib2xTdGF0ZV0gPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWV1ZSA9IHByb21pc2Vbc3ltYm9sVmFsdWVdO1xuICAgICAgICAgICAgICAgIHByb21pc2Vbc3ltYm9sVmFsdWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHByb21pc2Vbc3ltYm9sRmluYWxseV0gPT09IHN5bWJvbEZpbmFsbHkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHByb21pc2UgaXMgZ2VuZXJhdGVkIGJ5IFByb21pc2UucHJvdG90eXBlLmZpbmFsbHlcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSBSRVNPTFZFRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHN0YXRlIGlzIHJlc29sdmVkLCBzaG91bGQgaWdub3JlIHRoZSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHVzZSBwYXJlbnQgcHJvbWlzZSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZVtzeW1ib2xTdGF0ZV0gPSBwcm9taXNlW3N5bWJvbFBhcmVudFByb21pc2VTdGF0ZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlW3N5bWJvbFZhbHVlXSA9IHByb21pc2Vbc3ltYm9sUGFyZW50UHJvbWlzZVZhbHVlXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyByZWNvcmQgdGFzayBpbmZvcm1hdGlvbiBpbiB2YWx1ZSB3aGVuIGVycm9yIG9jY3Vycywgc28gd2UgY2FuXG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZSBhZGRpdGlvbmFsIHdvcmsgc3VjaCBhcyByZW5kZXIgbG9uZ1N0YWNrVHJhY2VcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IFJFSkVDVEVEICYmIHZhbHVlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgbG9uZ1N0YWNrVHJhY2Vab25lIGlzIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJhY2UgPSBab25lLmN1cnJlbnRUYXNrICYmIFpvbmUuY3VycmVudFRhc2suZGF0YSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgWm9uZS5jdXJyZW50VGFzay5kYXRhW2NyZWF0aW9uVHJhY2VdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJhY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9ubHkga2VlcCB0aGUgbG9uZyBzdGFjayB0cmFjZSBpbnRvIGVycm9yIHdoZW4gaW4gbG9uZ1N0YWNrVHJhY2Vab25lXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3REZWZpbmVQcm9wZXJ0eSh2YWx1ZSwgQ1VSUkVOVF9UQVNLX1RSQUNFX1NZTUJPTCwgeyBjb25maWd1cmFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgdmFsdWU6IHRyYWNlIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOykge1xuICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZVJlc29sdmVPclJlamVjdChwcm9taXNlLCBxdWV1ZVtpKytdLCBxdWV1ZVtpKytdLCBxdWV1ZVtpKytdLCBxdWV1ZVtpKytdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA9PSAwICYmIHN0YXRlID09IFJFSkVDVEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb21pc2Vbc3ltYm9sU3RhdGVdID0gUkVKRUNURURfTk9fQ0FUQ0g7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1bmNhdWdodFByb21pc2VFcnJvciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGVyZSB3ZSB0aHJvd3MgYSBuZXcgRXJyb3IgdG8gcHJpbnQgbW9yZSByZWFkYWJsZSBlcnJvciBsb2dcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCBpZiB0aGUgdmFsdWUgaXMgbm90IGFuIGVycm9yLCB6b25lLmpzIGJ1aWxkcyBhbiBgRXJyb3JgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBPYmplY3QgaGVyZSB0byBhdHRhY2ggdGhlIHN0YWNrIGluZm9ybWF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNhdWdodCAoaW4gcHJvbWlzZSk6ICcgKyByZWFkYWJsZU9iamVjdFRvU3RyaW5nKHZhbHVlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHZhbHVlICYmIHZhbHVlLnN0YWNrID8gJ1xcbicgKyB2YWx1ZS5zdGFjayA6ICcnKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5jYXVnaHRQcm9taXNlRXJyb3IgPSBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGlzYWJsZVdyYXBwaW5nVW5jYXVnaHRQcm9taXNlUmVqZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBkaXNhYmxlIHdyYXBwaW5nIHVuY2F1Z2h0IHByb21pc2UgcmVqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB1c2UgdGhlIHZhbHVlIGluc3RlYWQgb2Ygd3JhcHBpbmcgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmNhdWdodFByb21pc2VFcnJvci50aHJvd09yaWdpbmFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB1bmNhdWdodFByb21pc2VFcnJvci5yZWplY3Rpb24gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdW5jYXVnaHRQcm9taXNlRXJyb3IucHJvbWlzZSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIHVuY2F1Z2h0UHJvbWlzZUVycm9yLnpvbmUgPSBab25lLmN1cnJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHVuY2F1Z2h0UHJvbWlzZUVycm9yLnRhc2sgPSBab25lLmN1cnJlbnRUYXNrO1xuICAgICAgICAgICAgICAgICAgICBfdW5jYXVnaHRQcm9taXNlRXJyb3JzLnB1c2godW5jYXVnaHRQcm9taXNlRXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBhcGkuc2NoZWR1bGVNaWNyb1Rhc2soKTsgLy8gdG8gbWFrZSBzdXJlIHRoYXQgaXQgaXMgcnVubmluZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBSZXNvbHZpbmcgYW4gYWxyZWFkeSByZXNvbHZlZCBwcm9taXNlIGlzIGEgbm9vcC5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIGNvbnN0IFJFSkVDVElPTl9IQU5ETEVEX0hBTkRMRVIgPSBfX3N5bWJvbF9fKCdyZWplY3Rpb25IYW5kbGVkSGFuZGxlcicpO1xuICAgIGZ1bmN0aW9uIGNsZWFyUmVqZWN0ZWROb0NhdGNoKHByb21pc2UpIHtcbiAgICAgICAgaWYgKHByb21pc2Vbc3ltYm9sU3RhdGVdID09PSBSRUpFQ1RFRF9OT19DQVRDSCkge1xuICAgICAgICAgICAgLy8gaWYgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQgbm8gY2F0Y2ggc3RhdHVzXG4gICAgICAgICAgICAvLyBhbmQgcXVldWUubGVuZ3RoID4gMCwgbWVhbnMgdGhlcmUgaXMgYSBlcnJvciBoYW5kbGVyXG4gICAgICAgICAgICAvLyBoZXJlIHRvIGhhbmRsZSB0aGUgcmVqZWN0ZWQgcHJvbWlzZSwgd2Ugc2hvdWxkIHRyaWdnZXJcbiAgICAgICAgICAgIC8vIHdpbmRvd3MucmVqZWN0aW9uaGFuZGxlZCBldmVudEhhbmRsZXIgb3Igbm9kZWpzIHJlamVjdGlvbkhhbmRsZWRcbiAgICAgICAgICAgIC8vIGV2ZW50SGFuZGxlclxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gWm9uZVtSRUpFQ1RJT05fSEFORExFRF9IQU5ETEVSXTtcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlciAmJiB0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgeyByZWplY3Rpb246IHByb21pc2Vbc3ltYm9sVmFsdWVdLCBwcm9taXNlOiBwcm9taXNlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb21pc2Vbc3ltYm9sU3RhdGVdID0gUkVKRUNURUQ7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IF91bmNhdWdodFByb21pc2VFcnJvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocHJvbWlzZSA9PT0gX3VuY2F1Z2h0UHJvbWlzZUVycm9yc1tpXS5wcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIF91bmNhdWdodFByb21pc2VFcnJvcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzY2hlZHVsZVJlc29sdmVPclJlamVjdChwcm9taXNlLCB6b25lLCBjaGFpblByb21pc2UsIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgICAgIGNsZWFyUmVqZWN0ZWROb0NhdGNoKHByb21pc2UpO1xuICAgICAgICBjb25zdCBwcm9taXNlU3RhdGUgPSBwcm9taXNlW3N5bWJvbFN0YXRlXTtcbiAgICAgICAgY29uc3QgZGVsZWdhdGUgPSBwcm9taXNlU3RhdGUgP1xuICAgICAgICAgICAgKHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gJ2Z1bmN0aW9uJykgPyBvbkZ1bGZpbGxlZCA6IGZvcndhcmRSZXNvbHV0aW9uIDpcbiAgICAgICAgICAgICh0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJykgPyBvblJlamVjdGVkIDpcbiAgICAgICAgICAgICAgICBmb3J3YXJkUmVqZWN0aW9uO1xuICAgICAgICB6b25lLnNjaGVkdWxlTWljcm9UYXNrKHNvdXJjZSwgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnRQcm9taXNlVmFsdWUgPSBwcm9taXNlW3N5bWJvbFZhbHVlXTtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0ZpbmFsbHlQcm9taXNlID0gISFjaGFpblByb21pc2UgJiYgc3ltYm9sRmluYWxseSA9PT0gY2hhaW5Qcm9taXNlW3N5bWJvbEZpbmFsbHldO1xuICAgICAgICAgICAgICAgIGlmIChpc0ZpbmFsbHlQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBwcm9taXNlIGlzIGdlbmVyYXRlZCBmcm9tIGZpbmFsbHkgY2FsbCwga2VlcCBwYXJlbnQgcHJvbWlzZSdzIHN0YXRlIGFuZCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBjaGFpblByb21pc2Vbc3ltYm9sUGFyZW50UHJvbWlzZVZhbHVlXSA9IHBhcmVudFByb21pc2VWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgY2hhaW5Qcm9taXNlW3N5bWJvbFBhcmVudFByb21pc2VTdGF0ZV0gPSBwcm9taXNlU3RhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBub3QgcGFzcyB2YWx1ZSB0byBmaW5hbGx5IGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB6b25lLnJ1bihkZWxlZ2F0ZSwgdW5kZWZpbmVkLCBpc0ZpbmFsbHlQcm9taXNlICYmIGRlbGVnYXRlICE9PSBmb3J3YXJkUmVqZWN0aW9uICYmIGRlbGVnYXRlICE9PSBmb3J3YXJkUmVzb2x1dGlvbiA/XG4gICAgICAgICAgICAgICAgICAgIFtdIDpcbiAgICAgICAgICAgICAgICAgICAgW3BhcmVudFByb21pc2VWYWx1ZV0pO1xuICAgICAgICAgICAgICAgIHJlc29sdmVQcm9taXNlKGNoYWluUHJvbWlzZSwgdHJ1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgZXJyb3Igb2NjdXJzLCBzaG91bGQgYWx3YXlzIHJldHVybiB0aGlzIGVycm9yXG4gICAgICAgICAgICAgICAgcmVzb2x2ZVByb21pc2UoY2hhaW5Qcm9taXNlLCBmYWxzZSwgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBjaGFpblByb21pc2UpO1xuICAgIH1cbiAgICBjb25zdCBaT05FX0FXQVJFX1BST01JU0VfVE9fU1RSSU5HID0gJ2Z1bmN0aW9uIFpvbmVBd2FyZVByb21pc2UoKSB7IFtuYXRpdmUgY29kZV0gfSc7XG4gICAgY29uc3Qgbm9vcCA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICBjb25zdCBBZ2dyZWdhdGVFcnJvciA9IGdsb2JhbC5BZ2dyZWdhdGVFcnJvcjtcbiAgICBjbGFzcyBab25lQXdhcmVQcm9taXNlIHtcbiAgICAgICAgc3RhdGljIHRvU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuIFpPTkVfQVdBUkVfUFJPTUlTRV9UT19TVFJJTkc7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIHJlc29sdmUodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlUHJvbWlzZShuZXcgdGhpcyhudWxsKSwgUkVTT0xWRUQsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgcmVqZWN0KGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZVByb21pc2UobmV3IHRoaXMobnVsbCksIFJFSkVDVEVELCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIGFueSh2YWx1ZXMpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWVzIHx8IHR5cGVvZiB2YWx1ZXNbU3ltYm9sLml0ZXJhdG9yXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQWdncmVnYXRlRXJyb3IoW10sICdBbGwgcHJvbWlzZXMgd2VyZSByZWplY3RlZCcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG4gICAgICAgICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB2IG9mIHZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBwcm9taXNlcy5wdXNoKFpvbmVBd2FyZVByb21pc2UucmVzb2x2ZSh2KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQWdncmVnYXRlRXJyb3IoW10sICdBbGwgcHJvbWlzZXMgd2VyZSByZWplY3RlZCcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQWdncmVnYXRlRXJyb3IoW10sICdBbGwgcHJvbWlzZXMgd2VyZSByZWplY3RlZCcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBmaW5pc2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgZXJyb3JzID0gW107XG4gICAgICAgICAgICByZXR1cm4gbmV3IFpvbmVBd2FyZVByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvbWlzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbaV0udGhlbih2ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaW5pc2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodik7XG4gICAgICAgICAgICAgICAgICAgIH0sIGVyciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEFnZ3JlZ2F0ZUVycm9yKGVycm9ycywgJ0FsbCBwcm9taXNlcyB3ZXJlIHJlamVjdGVkJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICA7XG4gICAgICAgIHN0YXRpYyByYWNlKHZhbHVlcykge1xuICAgICAgICAgICAgbGV0IHJlc29sdmU7XG4gICAgICAgICAgICBsZXQgcmVqZWN0O1xuICAgICAgICAgICAgbGV0IHByb21pc2UgPSBuZXcgdGhpcygocmVzLCByZWopID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlID0gcmVzO1xuICAgICAgICAgICAgICAgIHJlamVjdCA9IHJlajtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZnVuY3Rpb24gb25SZXNvbHZlKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBvblJlamVjdChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCB2YWx1ZSBvZiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlzVGhlbmFibGUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFsdWUudGhlbihvblJlc29sdmUsIG9uUmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBhbGwodmFsdWVzKSB7XG4gICAgICAgICAgICByZXR1cm4gWm9uZUF3YXJlUHJvbWlzZS5hbGxXaXRoQ2FsbGJhY2sodmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgYWxsU2V0dGxlZCh2YWx1ZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IFAgPSB0aGlzICYmIHRoaXMucHJvdG90eXBlIGluc3RhbmNlb2YgWm9uZUF3YXJlUHJvbWlzZSA/IHRoaXMgOiBab25lQXdhcmVQcm9taXNlO1xuICAgICAgICAgICAgcmV0dXJuIFAuYWxsV2l0aENhbGxiYWNrKHZhbHVlcywge1xuICAgICAgICAgICAgICAgIHRoZW5DYWxsYmFjazogKHZhbHVlKSA9PiAoeyBzdGF0dXM6ICdmdWxmaWxsZWQnLCB2YWx1ZSB9KSxcbiAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrOiAoZXJyKSA9PiAoeyBzdGF0dXM6ICdyZWplY3RlZCcsIHJlYXNvbjogZXJyIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0aWMgYWxsV2l0aENhbGxiYWNrKHZhbHVlcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGxldCByZXNvbHZlO1xuICAgICAgICAgICAgbGV0IHJlamVjdDtcbiAgICAgICAgICAgIGxldCBwcm9taXNlID0gbmV3IHRoaXMoKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSA9IHJlcztcbiAgICAgICAgICAgICAgICByZWplY3QgPSByZWo7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIFN0YXJ0IGF0IDIgdG8gcHJldmVudCBwcmVtYXR1cmVseSByZXNvbHZpbmcgaWYgLnRoZW4gaXMgY2FsbGVkIGltbWVkaWF0ZWx5LlxuICAgICAgICAgICAgbGV0IHVucmVzb2x2ZWRDb3VudCA9IDI7XG4gICAgICAgICAgICBsZXQgdmFsdWVJbmRleCA9IDA7XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZFZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdmFsdWUgb2YgdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1RoZW5hYmxlKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXMucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGN1clZhbHVlSW5kZXggPSB2YWx1ZUluZGV4O1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLnRoZW4oKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZFZhbHVlc1tjdXJWYWx1ZUluZGV4XSA9IGNhbGxiYWNrID8gY2FsbGJhY2sudGhlbkNhbGxiYWNrKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5yZXNvbHZlZENvdW50LS07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5yZXNvbHZlZENvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNvbHZlZFZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkVmFsdWVzW2N1clZhbHVlSW5kZXhdID0gY2FsbGJhY2suZXJyb3JDYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVucmVzb2x2ZWRDb3VudC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bnJlc29sdmVkQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNvbHZlZFZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKHRoZW5FcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHRoZW5FcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB1bnJlc29sdmVkQ291bnQrKztcbiAgICAgICAgICAgICAgICB2YWx1ZUluZGV4Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBNYWtlIHRoZSB1bnJlc29sdmVkQ291bnQgemVyby1iYXNlZCBhZ2Fpbi5cbiAgICAgICAgICAgIHVucmVzb2x2ZWRDb3VudCAtPSAyO1xuICAgICAgICAgICAgaWYgKHVucmVzb2x2ZWRDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzb2x2ZWRWYWx1ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3RydWN0b3IoZXhlY3V0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKCEocHJvbWlzZSBpbnN0YW5jZW9mIFpvbmVBd2FyZVByb21pc2UpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IGJlIGFuIGluc3RhbmNlb2YgUHJvbWlzZS4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb21pc2Vbc3ltYm9sU3RhdGVdID0gVU5SRVNPTFZFRDtcbiAgICAgICAgICAgIHByb21pc2Vbc3ltYm9sVmFsdWVdID0gW107IC8vIHF1ZXVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbmNlV3JhcHBlciA9IG9uY2UoKTtcbiAgICAgICAgICAgICAgICBleGVjdXRvciAmJlxuICAgICAgICAgICAgICAgICAgICBleGVjdXRvcihvbmNlV3JhcHBlcihtYWtlUmVzb2x2ZXIocHJvbWlzZSwgUkVTT0xWRUQpKSwgb25jZVdyYXBwZXIobWFrZVJlc29sdmVyKHByb21pc2UsIFJFSkVDVEVEKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZVByb21pc2UocHJvbWlzZSwgZmFsc2UsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBnZXQgW1N5bWJvbC50b1N0cmluZ1RhZ10oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1Byb21pc2UnO1xuICAgICAgICB9XG4gICAgICAgIGdldCBbU3ltYm9sLnNwZWNpZXNdKCkge1xuICAgICAgICAgICAgcmV0dXJuIFpvbmVBd2FyZVByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhlbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gV2UgbXVzdCByZWFkIGBTeW1ib2wuc3BlY2llc2Agc2FmZWx5IGJlY2F1c2UgYHRoaXNgIG1heSBiZSBhbnl0aGluZy4gRm9yIGluc3RhbmNlLCBgdGhpc2BcbiAgICAgICAgICAgIC8vIG1heSBiZSBhbiBvYmplY3Qgd2l0aG91dCBhIHByb3RvdHlwZSAoY3JlYXRlZCB0aHJvdWdoIGBPYmplY3QuY3JlYXRlKG51bGwpYCk7IHRodXNcbiAgICAgICAgICAgIC8vIGB0aGlzLmNvbnN0cnVjdG9yYCB3aWxsIGJlIHVuZGVmaW5lZC4gT25lIG9mIHRoZSB1c2UgY2FzZXMgaXMgU3lzdGVtSlMgY3JlYXRpbmdcbiAgICAgICAgICAgIC8vIHByb3RvdHlwZS1sZXNzIG9iamVjdHMgKG1vZHVsZXMpIHZpYSBgT2JqZWN0LmNyZWF0ZShudWxsKWAuIFRoZSBTeXN0ZW1KUyBjcmVhdGVzIGFuIGVtcHR5XG4gICAgICAgICAgICAvLyBvYmplY3QgYW5kIGNvcGllcyBwcm9taXNlIHByb3BlcnRpZXMgaW50byB0aGF0IG9iamVjdCAod2l0aGluIHRoZSBgZ2V0T3JDcmVhdGVMb2FkYFxuICAgICAgICAgICAgLy8gZnVuY3Rpb24pLiBUaGUgem9uZS5qcyB0aGVuIGNoZWNrcyBpZiB0aGUgcmVzb2x2ZWQgdmFsdWUgaGFzIHRoZSBgdGhlbmAgbWV0aG9kIGFuZCBpbnZva2VzXG4gICAgICAgICAgICAvLyBpdCB3aXRoIHRoZSBgdmFsdWVgIGNvbnRleHQuIE90aGVyd2lzZSwgdGhpcyB3aWxsIHRocm93IGFuIGVycm9yOiBgVHlwZUVycm9yOiBDYW5ub3QgcmVhZFxuICAgICAgICAgICAgLy8gcHJvcGVydGllcyBvZiB1bmRlZmluZWQgKHJlYWRpbmcgJ1N5bWJvbChTeW1ib2wuc3BlY2llcyknKWAuXG4gICAgICAgICAgICBsZXQgQyA9IHRoaXMuY29uc3RydWN0b3I/LltTeW1ib2wuc3BlY2llc107XG4gICAgICAgICAgICBpZiAoIUMgfHwgdHlwZW9mIEMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBDID0gdGhpcy5jb25zdHJ1Y3RvciB8fCBab25lQXdhcmVQcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2hhaW5Qcm9taXNlID0gbmV3IEMobm9vcCk7XG4gICAgICAgICAgICBjb25zdCB6b25lID0gWm9uZS5jdXJyZW50O1xuICAgICAgICAgICAgaWYgKHRoaXNbc3ltYm9sU3RhdGVdID09IFVOUkVTT0xWRUQpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3N5bWJvbFZhbHVlXS5wdXNoKHpvbmUsIGNoYWluUHJvbWlzZSwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NoZWR1bGVSZXNvbHZlT3JSZWplY3QodGhpcywgem9uZSwgY2hhaW5Qcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2hhaW5Qcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKG9uUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseShvbkZpbmFsbHkpIHtcbiAgICAgICAgICAgIC8vIFNlZSBjb21tZW50IG9uIHRoZSBjYWxsIHRvIGB0aGVuYCBhYm91dCB3aHkgdGhlZSBgU3ltYm9sLnNwZWNpZXNgIGlzIHNhZmVseSBhY2Nlc3NlZC5cbiAgICAgICAgICAgIGxldCBDID0gdGhpcy5jb25zdHJ1Y3Rvcj8uW1N5bWJvbC5zcGVjaWVzXTtcbiAgICAgICAgICAgIGlmICghQyB8fCB0eXBlb2YgQyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIEMgPSBab25lQXdhcmVQcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2hhaW5Qcm9taXNlID0gbmV3IEMobm9vcCk7XG4gICAgICAgICAgICBjaGFpblByb21pc2Vbc3ltYm9sRmluYWxseV0gPSBzeW1ib2xGaW5hbGx5O1xuICAgICAgICAgICAgY29uc3Qgem9uZSA9IFpvbmUuY3VycmVudDtcbiAgICAgICAgICAgIGlmICh0aGlzW3N5bWJvbFN0YXRlXSA9PSBVTlJFU09MVkVEKSB7XG4gICAgICAgICAgICAgICAgdGhpc1tzeW1ib2xWYWx1ZV0ucHVzaCh6b25lLCBjaGFpblByb21pc2UsIG9uRmluYWxseSwgb25GaW5hbGx5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjaGVkdWxlUmVzb2x2ZU9yUmVqZWN0KHRoaXMsIHpvbmUsIGNoYWluUHJvbWlzZSwgb25GaW5hbGx5LCBvbkZpbmFsbHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNoYWluUHJvbWlzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBQcm90ZWN0IGFnYWluc3QgYWdncmVzc2l2ZSBvcHRpbWl6ZXJzIGRyb3BwaW5nIHNlZW1pbmdseSB1bnVzZWQgcHJvcGVydGllcy5cbiAgICAvLyBFLmcuIENsb3N1cmUgQ29tcGlsZXIgaW4gYWR2YW5jZWQgbW9kZS5cbiAgICBab25lQXdhcmVQcm9taXNlWydyZXNvbHZlJ10gPSBab25lQXdhcmVQcm9taXNlLnJlc29sdmU7XG4gICAgWm9uZUF3YXJlUHJvbWlzZVsncmVqZWN0J10gPSBab25lQXdhcmVQcm9taXNlLnJlamVjdDtcbiAgICBab25lQXdhcmVQcm9taXNlWydyYWNlJ10gPSBab25lQXdhcmVQcm9taXNlLnJhY2U7XG4gICAgWm9uZUF3YXJlUHJvbWlzZVsnYWxsJ10gPSBab25lQXdhcmVQcm9taXNlLmFsbDtcbiAgICBjb25zdCBOYXRpdmVQcm9taXNlID0gZ2xvYmFsW3N5bWJvbFByb21pc2VdID0gZ2xvYmFsWydQcm9taXNlJ107XG4gICAgZ2xvYmFsWydQcm9taXNlJ10gPSBab25lQXdhcmVQcm9taXNlO1xuICAgIGNvbnN0IHN5bWJvbFRoZW5QYXRjaGVkID0gX19zeW1ib2xfXygndGhlblBhdGNoZWQnKTtcbiAgICBmdW5jdGlvbiBwYXRjaFRoZW4oQ3Rvcikge1xuICAgICAgICBjb25zdCBwcm90byA9IEN0b3IucHJvdG90eXBlO1xuICAgICAgICBjb25zdCBwcm9wID0gT2JqZWN0R2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvLCAndGhlbicpO1xuICAgICAgICBpZiAocHJvcCAmJiAocHJvcC53cml0YWJsZSA9PT0gZmFsc2UgfHwgIXByb3AuY29uZmlndXJhYmxlKSkge1xuICAgICAgICAgICAgLy8gY2hlY2sgQ3Rvci5wcm90b3R5cGUudGhlbiBwcm9wZXJ0eURlc2NyaXB0b3IgaXMgd3JpdGFibGUgb3Igbm90XG4gICAgICAgICAgICAvLyBpbiBtZXRlb3IgZW52LCB3cml0YWJsZSBpcyBmYWxzZSwgd2Ugc2hvdWxkIGlnbm9yZSBzdWNoIGNhc2VcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcmlnaW5hbFRoZW4gPSBwcm90by50aGVuO1xuICAgICAgICAvLyBLZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBvcmlnaW5hbCBtZXRob2QuXG4gICAgICAgIHByb3RvW3N5bWJvbFRoZW5dID0gb3JpZ2luYWxUaGVuO1xuICAgICAgICBDdG9yLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKG9uUmVzb2x2ZSwgb25SZWplY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHdyYXBwZWQgPSBuZXcgWm9uZUF3YXJlUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWxUaGVuLmNhbGwodGhpcywgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZWQudGhlbihvblJlc29sdmUsIG9uUmVqZWN0KTtcbiAgICAgICAgfTtcbiAgICAgICAgQ3RvcltzeW1ib2xUaGVuUGF0Y2hlZF0gPSB0cnVlO1xuICAgIH1cbiAgICBhcGkucGF0Y2hUaGVuID0gcGF0Y2hUaGVuO1xuICAgIGZ1bmN0aW9uIHpvbmVpZnkoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0UHJvbWlzZSA9IGZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdFByb21pc2UgaW5zdGFuY2VvZiBab25lQXdhcmVQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgY3RvciA9IHJlc3VsdFByb21pc2UuY29uc3RydWN0b3I7XG4gICAgICAgICAgICBpZiAoIWN0b3Jbc3ltYm9sVGhlblBhdGNoZWRdKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hUaGVuKGN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFByb21pc2U7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChOYXRpdmVQcm9taXNlKSB7XG4gICAgICAgIHBhdGNoVGhlbihOYXRpdmVQcm9taXNlKTtcbiAgICAgICAgcGF0Y2hNZXRob2QoZ2xvYmFsLCAnZmV0Y2gnLCBkZWxlZ2F0ZSA9PiB6b25laWZ5KGRlbGVnYXRlKSk7XG4gICAgfVxuICAgIC8vIFRoaXMgaXMgbm90IHBhcnQgb2YgcHVibGljIEFQSSwgYnV0IGl0IGlzIHVzZWZ1bCBmb3IgdGVzdHMsIHNvIHdlIGV4cG9zZSBpdC5cbiAgICBQcm9taXNlW1pvbmUuX19zeW1ib2xfXygndW5jYXVnaHRQcm9taXNlRXJyb3JzJyldID0gX3VuY2F1Z2h0UHJvbWlzZUVycm9ycztcbiAgICByZXR1cm4gWm9uZUF3YXJlUHJvbWlzZTtcbn0pO1xuXG4vLyBvdmVycmlkZSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgdG8gbWFrZSB6b25lLmpzIHBhdGNoZWQgZnVuY3Rpb25cbi8vIGxvb2sgbGlrZSBuYXRpdmUgZnVuY3Rpb25cblpvbmUuX19sb2FkX3BhdGNoKCd0b1N0cmluZycsIChnbG9iYWwpID0+IHtcbiAgICAvLyBwYXRjaCBGdW5jLnByb3RvdHlwZS50b1N0cmluZyB0byBsZXQgdGhlbSBsb29rIGxpa2UgbmF0aXZlXG4gICAgY29uc3Qgb3JpZ2luYWxGdW5jdGlvblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xuICAgIGNvbnN0IE9SSUdJTkFMX0RFTEVHQVRFX1NZTUJPTCA9IHpvbmVTeW1ib2woJ09yaWdpbmFsRGVsZWdhdGUnKTtcbiAgICBjb25zdCBQUk9NSVNFX1NZTUJPTCA9IHpvbmVTeW1ib2woJ1Byb21pc2UnKTtcbiAgICBjb25zdCBFUlJPUl9TWU1CT0wgPSB6b25lU3ltYm9sKCdFcnJvcicpO1xuICAgIGNvbnN0IG5ld0Z1bmN0aW9uVG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbERlbGVnYXRlID0gdGhpc1tPUklHSU5BTF9ERUxFR0FURV9TWU1CT0xdO1xuICAgICAgICAgICAgaWYgKG9yaWdpbmFsRGVsZWdhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9yaWdpbmFsRGVsZWdhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsRnVuY3Rpb25Ub1N0cmluZy5jYWxsKG9yaWdpbmFsRGVsZWdhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvcmlnaW5hbERlbGVnYXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcyA9PT0gUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hdGl2ZVByb21pc2UgPSBnbG9iYWxbUFJPTUlTRV9TWU1CT0xdO1xuICAgICAgICAgICAgICAgIGlmIChuYXRpdmVQcm9taXNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbEZ1bmN0aW9uVG9TdHJpbmcuY2FsbChuYXRpdmVQcm9taXNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcyA9PT0gRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYXRpdmVFcnJvciA9IGdsb2JhbFtFUlJPUl9TWU1CT0xdO1xuICAgICAgICAgICAgICAgIGlmIChuYXRpdmVFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxGdW5jdGlvblRvU3RyaW5nLmNhbGwobmF0aXZlRXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3JpZ2luYWxGdW5jdGlvblRvU3RyaW5nLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICBuZXdGdW5jdGlvblRvU3RyaW5nW09SSUdJTkFMX0RFTEVHQVRFX1NZTUJPTF0gPSBvcmlnaW5hbEZ1bmN0aW9uVG9TdHJpbmc7XG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gbmV3RnVuY3Rpb25Ub1N0cmluZztcbiAgICAvLyBwYXRjaCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nIHRvIGxldCB0aGVtIGxvb2sgbGlrZSBuYXRpdmVcbiAgICBjb25zdCBvcmlnaW5hbE9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbiAgICBjb25zdCBQUk9NSVNFX09CSkVDVF9UT19TVFJJTkcgPSAnW29iamVjdCBQcm9taXNlXSc7XG4gICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBQcm9taXNlID09PSAnZnVuY3Rpb24nICYmIHRoaXMgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gUFJPTUlTRV9PQkpFQ1RfVE9fU1RSSU5HO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcmlnaW5hbE9iamVjdFRvU3RyaW5nLmNhbGwodGhpcyk7XG4gICAgfTtcbn0pO1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBzdXBwcmVzcyB7bWlzc2luZ1JlcXVpcmV9XG4gKi9cbmxldCBwYXNzaXZlU3VwcG9ydGVkID0gZmFsc2U7XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAncGFzc2l2ZScsIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBhc3NpdmVTdXBwb3J0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gTm90ZTogV2UgcGFzcyB0aGUgYG9wdGlvbnNgIG9iamVjdCBhcyB0aGUgZXZlbnQgaGFuZGxlciB0b28uIFRoaXMgaXMgbm90IGNvbXBhdGlibGUgd2l0aCB0aGVcbiAgICAgICAgLy8gc2lnbmF0dXJlIG9mIGBhZGRFdmVudExpc3RlbmVyYCBvciBgcmVtb3ZlRXZlbnRMaXN0ZW5lcmAgYnV0IGVuYWJsZXMgdXMgdG8gcmVtb3ZlIHRoZSBoYW5kbGVyXG4gICAgICAgIC8vIHdpdGhvdXQgYW4gYWN0dWFsIGhhbmRsZXIuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0ZXN0Jywgb3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0ZXN0Jywgb3B0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgcGFzc2l2ZVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgIH1cbn1cbi8vIGFuIGlkZW50aWZpZXIgdG8gdGVsbCBab25lVGFzayBkbyBub3QgY3JlYXRlIGEgbmV3IGludm9rZSBjbG9zdXJlXG5jb25zdCBPUFRJTUlaRURfWk9ORV9FVkVOVF9UQVNLX0RBVEEgPSB7XG4gICAgdXNlRzogdHJ1ZVxufTtcbmNvbnN0IHpvbmVTeW1ib2xFdmVudE5hbWVzID0ge307XG5jb25zdCBnbG9iYWxTb3VyY2VzID0ge307XG5jb25zdCBFVkVOVF9OQU1FX1NZTUJPTF9SRUdYID0gbmV3IFJlZ0V4cCgnXicgKyBaT05FX1NZTUJPTF9QUkVGSVggKyAnKFxcXFx3KykodHJ1ZXxmYWxzZSkkJyk7XG5jb25zdCBJTU1FRElBVEVfUFJPUEFHQVRJT05fU1lNQk9MID0gem9uZVN5bWJvbCgncHJvcGFnYXRpb25TdG9wcGVkJyk7XG5mdW5jdGlvbiBwcmVwYXJlRXZlbnROYW1lcyhldmVudE5hbWUsIGV2ZW50TmFtZVRvU3RyaW5nKSB7XG4gICAgY29uc3QgZmFsc2VFdmVudE5hbWUgPSAoZXZlbnROYW1lVG9TdHJpbmcgPyBldmVudE5hbWVUb1N0cmluZyhldmVudE5hbWUpIDogZXZlbnROYW1lKSArIEZBTFNFX1NUUjtcbiAgICBjb25zdCB0cnVlRXZlbnROYW1lID0gKGV2ZW50TmFtZVRvU3RyaW5nID8gZXZlbnROYW1lVG9TdHJpbmcoZXZlbnROYW1lKSA6IGV2ZW50TmFtZSkgKyBUUlVFX1NUUjtcbiAgICBjb25zdCBzeW1ib2wgPSBaT05FX1NZTUJPTF9QUkVGSVggKyBmYWxzZUV2ZW50TmFtZTtcbiAgICBjb25zdCBzeW1ib2xDYXB0dXJlID0gWk9ORV9TWU1CT0xfUFJFRklYICsgdHJ1ZUV2ZW50TmFtZTtcbiAgICB6b25lU3ltYm9sRXZlbnROYW1lc1tldmVudE5hbWVdID0ge307XG4gICAgem9uZVN5bWJvbEV2ZW50TmFtZXNbZXZlbnROYW1lXVtGQUxTRV9TVFJdID0gc3ltYm9sO1xuICAgIHpvbmVTeW1ib2xFdmVudE5hbWVzW2V2ZW50TmFtZV1bVFJVRV9TVFJdID0gc3ltYm9sQ2FwdHVyZTtcbn1cbmZ1bmN0aW9uIHBhdGNoRXZlbnRUYXJnZXQoX2dsb2JhbCwgYXBpLCBhcGlzLCBwYXRjaE9wdGlvbnMpIHtcbiAgICBjb25zdCBBRERfRVZFTlRfTElTVEVORVIgPSAocGF0Y2hPcHRpb25zICYmIHBhdGNoT3B0aW9ucy5hZGQpIHx8IEFERF9FVkVOVF9MSVNURU5FUl9TVFI7XG4gICAgY29uc3QgUkVNT1ZFX0VWRU5UX0xJU1RFTkVSID0gKHBhdGNoT3B0aW9ucyAmJiBwYXRjaE9wdGlvbnMucm0pIHx8IFJFTU9WRV9FVkVOVF9MSVNURU5FUl9TVFI7XG4gICAgY29uc3QgTElTVEVORVJTX0VWRU5UX0xJU1RFTkVSID0gKHBhdGNoT3B0aW9ucyAmJiBwYXRjaE9wdGlvbnMubGlzdGVuZXJzKSB8fCAnZXZlbnRMaXN0ZW5lcnMnO1xuICAgIGNvbnN0IFJFTU9WRV9BTExfTElTVEVORVJTX0VWRU5UX0xJU1RFTkVSID0gKHBhdGNoT3B0aW9ucyAmJiBwYXRjaE9wdGlvbnMucm1BbGwpIHx8ICdyZW1vdmVBbGxMaXN0ZW5lcnMnO1xuICAgIGNvbnN0IHpvbmVTeW1ib2xBZGRFdmVudExpc3RlbmVyID0gem9uZVN5bWJvbChBRERfRVZFTlRfTElTVEVORVIpO1xuICAgIGNvbnN0IEFERF9FVkVOVF9MSVNURU5FUl9TT1VSQ0UgPSAnLicgKyBBRERfRVZFTlRfTElTVEVORVIgKyAnOic7XG4gICAgY29uc3QgUFJFUEVORF9FVkVOVF9MSVNURU5FUiA9ICdwcmVwZW5kTGlzdGVuZXInO1xuICAgIGNvbnN0IFBSRVBFTkRfRVZFTlRfTElTVEVORVJfU09VUkNFID0gJy4nICsgUFJFUEVORF9FVkVOVF9MSVNURU5FUiArICc6JztcbiAgICBjb25zdCBpbnZva2VUYXNrID0gZnVuY3Rpb24gKHRhc2ssIHRhcmdldCwgZXZlbnQpIHtcbiAgICAgICAgLy8gZm9yIGJldHRlciBwZXJmb3JtYW5jZSwgY2hlY2sgaXNSZW1vdmVkIHdoaWNoIGlzIHNldFxuICAgICAgICAvLyBieSByZW1vdmVFdmVudExpc3RlbmVyXG4gICAgICAgIGlmICh0YXNrLmlzUmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlbGVnYXRlID0gdGFzay5jYWxsYmFjaztcbiAgICAgICAgaWYgKHR5cGVvZiBkZWxlZ2F0ZSA9PT0gJ29iamVjdCcgJiYgZGVsZWdhdGUuaGFuZGxlRXZlbnQpIHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgYmluZCB2ZXJzaW9uIG9mIGhhbmRsZUV2ZW50IHdoZW4gaW52b2tlXG4gICAgICAgICAgICB0YXNrLmNhbGxiYWNrID0gKGV2ZW50KSA9PiBkZWxlZ2F0ZS5oYW5kbGVFdmVudChldmVudCk7XG4gICAgICAgICAgICB0YXNrLm9yaWdpbmFsRGVsZWdhdGUgPSBkZWxlZ2F0ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbnZva2Ugc3RhdGljIHRhc2suaW52b2tlXG4gICAgICAgIC8vIG5lZWQgdG8gdHJ5L2NhdGNoIGVycm9yIGhlcmUsIG90aGVyd2lzZSwgdGhlIGVycm9yIGluIG9uZSBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB3aWxsIGJyZWFrIHRoZSBleGVjdXRpb25zIG9mIHRoZSBvdGhlciBldmVudCBsaXN0ZW5lcnMuIEFsc28gZXJyb3Igd2lsbFxuICAgICAgICAvLyBub3QgcmVtb3ZlIHRoZSBldmVudCBsaXN0ZW5lciB3aGVuIGBvbmNlYCBvcHRpb25zIGlzIHRydWUuXG4gICAgICAgIGxldCBlcnJvcjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRhc2suaW52b2tlKHRhc2ssIHRhcmdldCwgW2V2ZW50XSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHRhc2sub3B0aW9ucztcbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnICYmIG9wdGlvbnMub25jZSkge1xuICAgICAgICAgICAgLy8gaWYgb3B0aW9ucy5vbmNlIGlzIHRydWUsIGFmdGVyIGludm9rZSBvbmNlIHJlbW92ZSBsaXN0ZW5lciBoZXJlXG4gICAgICAgICAgICAvLyBvbmx5IGJyb3dzZXIgbmVlZCB0byBkbyB0aGlzLCBub2RlanMgZXZlbnRFbWl0dGVyIHdpbGwgY2FsIHJlbW92ZUxpc3RlbmVyXG4gICAgICAgICAgICAvLyBpbnNpZGUgRXZlbnRFbWl0dGVyLm9uY2VcbiAgICAgICAgICAgIGNvbnN0IGRlbGVnYXRlID0gdGFzay5vcmlnaW5hbERlbGVnYXRlID8gdGFzay5vcmlnaW5hbERlbGVnYXRlIDogdGFzay5jYWxsYmFjaztcbiAgICAgICAgICAgIHRhcmdldFtSRU1PVkVfRVZFTlRfTElTVEVORVJdLmNhbGwodGFyZ2V0LCBldmVudC50eXBlLCBkZWxlZ2F0ZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgIH07XG4gICAgZnVuY3Rpb24gZ2xvYmFsQ2FsbGJhY2soY29udGV4dCwgZXZlbnQsIGlzQ2FwdHVyZSkge1xuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci96b25lLmpzL2lzc3Vlcy85MTEsIGluIElFLCBzb21ldGltZXNcbiAgICAgICAgLy8gZXZlbnQgd2lsbCBiZSB1bmRlZmluZWQsIHNvIHdlIG5lZWQgdG8gdXNlIHdpbmRvdy5ldmVudFxuICAgICAgICBldmVudCA9IGV2ZW50IHx8IF9nbG9iYWwuZXZlbnQ7XG4gICAgICAgIGlmICghZXZlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBldmVudC50YXJnZXQgaXMgbmVlZGVkIGZvciBTYW1zdW5nIFRWIGFuZCBTb3VyY2VCdWZmZXJcbiAgICAgICAgLy8gfHwgZ2xvYmFsIGlzIG5lZWRlZCBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci96b25lLmpzL2lzc3Vlcy8xOTBcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gY29udGV4dCB8fCBldmVudC50YXJnZXQgfHwgX2dsb2JhbDtcbiAgICAgICAgY29uc3QgdGFza3MgPSB0YXJnZXRbem9uZVN5bWJvbEV2ZW50TmFtZXNbZXZlbnQudHlwZV1baXNDYXB0dXJlID8gVFJVRV9TVFIgOiBGQUxTRV9TVFJdXTtcbiAgICAgICAgaWYgKHRhc2tzKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIC8vIGludm9rZSBhbGwgdGFza3Mgd2hpY2ggYXR0YWNoZWQgdG8gY3VycmVudCB0YXJnZXQgd2l0aCBnaXZlbiBldmVudC50eXBlIGFuZCBjYXB0dXJlID0gZmFsc2VcbiAgICAgICAgICAgIC8vIGZvciBwZXJmb3JtYW5jZSBjb25jZXJuLCBpZiB0YXNrLmxlbmd0aCA9PT0gMSwganVzdCBpbnZva2VcbiAgICAgICAgICAgIGlmICh0YXNrcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBpbnZva2VUYXNrKHRhc2tzWzBdLCB0YXJnZXQsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICBlcnIgJiYgZXJyb3JzLnB1c2goZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3pvbmUuanMvaXNzdWVzLzgzNlxuICAgICAgICAgICAgICAgIC8vIGNvcHkgdGhlIHRhc2tzIGFycmF5IGJlZm9yZSBpbnZva2UsIHRvIGF2b2lkXG4gICAgICAgICAgICAgICAgLy8gdGhlIGNhbGxiYWNrIHdpbGwgcmVtb3ZlIGl0c2VsZiBvciBvdGhlciBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvcHlUYXNrcyA9IHRhc2tzLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3B5VGFza3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50ICYmIGV2ZW50W0lNTUVESUFURV9QUk9QQUdBVElPTl9TWU1CT0xdID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBpbnZva2VUYXNrKGNvcHlUYXNrc1tpXSwgdGFyZ2V0LCBldmVudCk7XG4gICAgICAgICAgICAgICAgICAgIGVyciAmJiBlcnJvcnMucHVzaChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFNpbmNlIHRoZXJlIGlzIG9ubHkgb25lIGVycm9yLCB3ZSBkb24ndCBuZWVkIHRvIHNjaGVkdWxlIG1pY3JvVGFza1xuICAgICAgICAgICAgLy8gdG8gdGhyb3cgdGhlIGVycm9yLlxuICAgICAgICAgICAgaWYgKGVycm9ycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcnNbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVycm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBlcnJvcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIGFwaS5uYXRpdmVTY2hlZHVsZU1pY3JvVGFzaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBnbG9iYWwgc2hhcmVkIHpvbmVBd2FyZUNhbGxiYWNrIHRvIGhhbmRsZSBhbGwgZXZlbnQgY2FsbGJhY2sgd2l0aCBjYXB0dXJlID0gZmFsc2VcbiAgICBjb25zdCBnbG9iYWxab25lQXdhcmVDYWxsYmFjayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsQ2FsbGJhY2sodGhpcywgZXZlbnQsIGZhbHNlKTtcbiAgICB9O1xuICAgIC8vIGdsb2JhbCBzaGFyZWQgem9uZUF3YXJlQ2FsbGJhY2sgdG8gaGFuZGxlIGFsbCBldmVudCBjYWxsYmFjayB3aXRoIGNhcHR1cmUgPSB0cnVlXG4gICAgY29uc3QgZ2xvYmFsWm9uZUF3YXJlQ2FwdHVyZUNhbGxiYWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiBnbG9iYWxDYWxsYmFjayh0aGlzLCBldmVudCwgdHJ1ZSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBwYXRjaEV2ZW50VGFyZ2V0TWV0aG9kcyhvYmosIHBhdGNoT3B0aW9ucykge1xuICAgICAgICBpZiAoIW9iaikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1c2VHbG9iYWxDYWxsYmFjayA9IHRydWU7XG4gICAgICAgIGlmIChwYXRjaE9wdGlvbnMgJiYgcGF0Y2hPcHRpb25zLnVzZUcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdXNlR2xvYmFsQ2FsbGJhY2sgPSBwYXRjaE9wdGlvbnMudXNlRztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWxpZGF0ZUhhbmRsZXIgPSBwYXRjaE9wdGlvbnMgJiYgcGF0Y2hPcHRpb25zLnZoO1xuICAgICAgICBsZXQgY2hlY2tEdXBsaWNhdGUgPSB0cnVlO1xuICAgICAgICBpZiAocGF0Y2hPcHRpb25zICYmIHBhdGNoT3B0aW9ucy5jaGtEdXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hlY2tEdXBsaWNhdGUgPSBwYXRjaE9wdGlvbnMuY2hrRHVwO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXR1cm5UYXJnZXQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHBhdGNoT3B0aW9ucyAmJiBwYXRjaE9wdGlvbnMucnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuVGFyZ2V0ID0gcGF0Y2hPcHRpb25zLnJ0O1xuICAgICAgICB9XG4gICAgICAgIGxldCBwcm90byA9IG9iajtcbiAgICAgICAgd2hpbGUgKHByb3RvICYmICFwcm90by5oYXNPd25Qcm9wZXJ0eShBRERfRVZFTlRfTElTVEVORVIpKSB7XG4gICAgICAgICAgICBwcm90byA9IE9iamVjdEdldFByb3RvdHlwZU9mKHByb3RvKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByb3RvICYmIG9ialtBRERfRVZFTlRfTElTVEVORVJdKSB7XG4gICAgICAgICAgICAvLyBzb21laG93IHdlIGRpZCBub3QgZmluZCBpdCwgYnV0IHdlIGNhbiBzZWUgaXQuIFRoaXMgaGFwcGVucyBvbiBJRSBmb3IgV2luZG93IHByb3BlcnRpZXMuXG4gICAgICAgICAgICBwcm90byA9IG9iajtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByb3RvKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3RvW3pvbmVTeW1ib2xBZGRFdmVudExpc3RlbmVyXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV2ZW50TmFtZVRvU3RyaW5nID0gcGF0Y2hPcHRpb25zICYmIHBhdGNoT3B0aW9ucy5ldmVudE5hbWVUb1N0cmluZztcbiAgICAgICAgLy8gYSBzaGFyZWQgZ2xvYmFsIHRhc2tEYXRhIHRvIHBhc3MgZGF0YSBmb3Igc2NoZWR1bGVFdmVudFRhc2tcbiAgICAgICAgLy8gc28gd2UgZG8gbm90IG5lZWQgdG8gY3JlYXRlIGEgbmV3IG9iamVjdCBqdXN0IGZvciBwYXNzIHNvbWUgZGF0YVxuICAgICAgICBjb25zdCB0YXNrRGF0YSA9IHt9O1xuICAgICAgICBjb25zdCBuYXRpdmVBZGRFdmVudExpc3RlbmVyID0gcHJvdG9bem9uZVN5bWJvbEFkZEV2ZW50TGlzdGVuZXJdID0gcHJvdG9bQUREX0VWRU5UX0xJU1RFTkVSXTtcbiAgICAgICAgY29uc3QgbmF0aXZlUmVtb3ZlRXZlbnRMaXN0ZW5lciA9IHByb3RvW3pvbmVTeW1ib2woUkVNT1ZFX0VWRU5UX0xJU1RFTkVSKV0gPVxuICAgICAgICAgICAgcHJvdG9bUkVNT1ZFX0VWRU5UX0xJU1RFTkVSXTtcbiAgICAgICAgY29uc3QgbmF0aXZlTGlzdGVuZXJzID0gcHJvdG9bem9uZVN5bWJvbChMSVNURU5FUlNfRVZFTlRfTElTVEVORVIpXSA9XG4gICAgICAgICAgICBwcm90b1tMSVNURU5FUlNfRVZFTlRfTElTVEVORVJdO1xuICAgICAgICBjb25zdCBuYXRpdmVSZW1vdmVBbGxMaXN0ZW5lcnMgPSBwcm90b1t6b25lU3ltYm9sKFJFTU9WRV9BTExfTElTVEVORVJTX0VWRU5UX0xJU1RFTkVSKV0gPVxuICAgICAgICAgICAgcHJvdG9bUkVNT1ZFX0FMTF9MSVNURU5FUlNfRVZFTlRfTElTVEVORVJdO1xuICAgICAgICBsZXQgbmF0aXZlUHJlcGVuZEV2ZW50TGlzdGVuZXI7XG4gICAgICAgIGlmIChwYXRjaE9wdGlvbnMgJiYgcGF0Y2hPcHRpb25zLnByZXBlbmQpIHtcbiAgICAgICAgICAgIG5hdGl2ZVByZXBlbmRFdmVudExpc3RlbmVyID0gcHJvdG9bem9uZVN5bWJvbChwYXRjaE9wdGlvbnMucHJlcGVuZCldID1cbiAgICAgICAgICAgICAgICBwcm90b1twYXRjaE9wdGlvbnMucHJlcGVuZF07XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoaXMgdXRpbCBmdW5jdGlvbiB3aWxsIGJ1aWxkIGFuIG9wdGlvbiBvYmplY3Qgd2l0aCBwYXNzaXZlIG9wdGlvblxuICAgICAgICAgKiB0byBoYW5kbGUgYWxsIHBvc3NpYmxlIGlucHV0IGZyb20gdGhlIHVzZXIuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBidWlsZEV2ZW50TGlzdGVuZXJPcHRpb25zKG9wdGlvbnMsIHBhc3NpdmUpIHtcbiAgICAgICAgICAgIGlmICghcGFzc2l2ZVN1cHBvcnRlZCAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcgJiYgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIC8vIGRvZXNuJ3Qgc3VwcG9ydCBwYXNzaXZlIGJ1dCB1c2VyIHdhbnQgdG8gcGFzcyBhbiBvYmplY3QgYXMgb3B0aW9ucy5cbiAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgbm90IHdvcmsgb24gc29tZSBvbGQgYnJvd3Nlciwgc28gd2UganVzdCBwYXNzIGEgYm9vbGVhblxuICAgICAgICAgICAgICAgIC8vIGFzIHVzZUNhcHR1cmUgcGFyYW1ldGVyXG4gICAgICAgICAgICAgICAgcmV0dXJuICEhb3B0aW9ucy5jYXB0dXJlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwYXNzaXZlU3VwcG9ydGVkIHx8ICFwYXNzaXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGNhcHR1cmU6IG9wdGlvbnMsIHBhc3NpdmU6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHBhc3NpdmU6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcgJiYgb3B0aW9ucy5wYXNzaXZlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLm9wdGlvbnMsIHBhc3NpdmU6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGN1c3RvbVNjaGVkdWxlR2xvYmFsID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIGFscmVhZHkgYSB0YXNrIGZvciB0aGUgZXZlbnROYW1lICsgY2FwdHVyZSxcbiAgICAgICAgICAgIC8vIGp1c3QgcmV0dXJuLCBiZWNhdXNlIHdlIHVzZSB0aGUgc2hhcmVkIGdsb2JhbFpvbmVBd2FyZUNhbGxiYWNrIGhlcmUuXG4gICAgICAgICAgICBpZiAodGFza0RhdGEuaXNFeGlzdGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuYXRpdmVBZGRFdmVudExpc3RlbmVyLmNhbGwodGFza0RhdGEudGFyZ2V0LCB0YXNrRGF0YS5ldmVudE5hbWUsIHRhc2tEYXRhLmNhcHR1cmUgPyBnbG9iYWxab25lQXdhcmVDYXB0dXJlQ2FsbGJhY2sgOiBnbG9iYWxab25lQXdhcmVDYWxsYmFjaywgdGFza0RhdGEub3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGN1c3RvbUNhbmNlbEdsb2JhbCA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICAvLyBpZiB0YXNrIGlzIG5vdCBtYXJrZWQgYXMgaXNSZW1vdmVkLCB0aGlzIGNhbGwgaXMgZGlyZWN0bHlcbiAgICAgICAgICAgIC8vIGZyb20gWm9uZS5wcm90b3R5cGUuY2FuY2VsVGFzaywgd2Ugc2hvdWxkIHJlbW92ZSB0aGUgdGFza1xuICAgICAgICAgICAgLy8gZnJvbSB0YXNrc0xpc3Qgb2YgdGFyZ2V0IGZpcnN0XG4gICAgICAgICAgICBpZiAoIXRhc2suaXNSZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3ltYm9sRXZlbnROYW1lcyA9IHpvbmVTeW1ib2xFdmVudE5hbWVzW3Rhc2suZXZlbnROYW1lXTtcbiAgICAgICAgICAgICAgICBsZXQgc3ltYm9sRXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChzeW1ib2xFdmVudE5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN5bWJvbEV2ZW50TmFtZSA9IHN5bWJvbEV2ZW50TmFtZXNbdGFzay5jYXB0dXJlID8gVFJVRV9TVFIgOiBGQUxTRV9TVFJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1Rhc2tzID0gc3ltYm9sRXZlbnROYW1lICYmIHRhc2sudGFyZ2V0W3N5bWJvbEV2ZW50TmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGFza3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleGlzdGluZ1Rhc2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1Rhc2sgPSBleGlzdGluZ1Rhc2tzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGFzayA9PT0gdGFzaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nVGFza3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldCBpc1JlbW92ZWQgdG8gZGF0YSBmb3IgZmFzdGVyIGludm9rZVRhc2sgY2hlY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXNrLmlzUmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsbCB0YXNrcyBmb3IgdGhlIGV2ZW50TmFtZSArIGNhcHR1cmUgaGF2ZSBnb25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgZ2xvYmFsWm9uZUF3YXJlQ2FsbGJhY2sgYW5kIHJlbW92ZSB0aGUgdGFzayBjYWNoZSBmcm9tIHRhcmdldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXNrLmFsbFJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXNrLnRhcmdldFtzeW1ib2xFdmVudE5hbWVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiBhbGwgdGFza3MgZm9yIHRoZSBldmVudE5hbWUgKyBjYXB0dXJlIGhhdmUgZ29uZSxcbiAgICAgICAgICAgIC8vIHdlIHdpbGwgcmVhbGx5IHJlbW92ZSB0aGUgZ2xvYmFsIGV2ZW50IGNhbGxiYWNrLFxuICAgICAgICAgICAgLy8gaWYgbm90LCByZXR1cm5cbiAgICAgICAgICAgIGlmICghdGFzay5hbGxSZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5hdGl2ZVJlbW92ZUV2ZW50TGlzdGVuZXIuY2FsbCh0YXNrLnRhcmdldCwgdGFzay5ldmVudE5hbWUsIHRhc2suY2FwdHVyZSA/IGdsb2JhbFpvbmVBd2FyZUNhcHR1cmVDYWxsYmFjayA6IGdsb2JhbFpvbmVBd2FyZUNhbGxiYWNrLCB0YXNrLm9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBjdXN0b21TY2hlZHVsZU5vbkdsb2JhbCA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICByZXR1cm4gbmF0aXZlQWRkRXZlbnRMaXN0ZW5lci5jYWxsKHRhc2tEYXRhLnRhcmdldCwgdGFza0RhdGEuZXZlbnROYW1lLCB0YXNrLmludm9rZSwgdGFza0RhdGEub3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGN1c3RvbVNjaGVkdWxlUHJlcGVuZCA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICByZXR1cm4gbmF0aXZlUHJlcGVuZEV2ZW50TGlzdGVuZXIuY2FsbCh0YXNrRGF0YS50YXJnZXQsIHRhc2tEYXRhLmV2ZW50TmFtZSwgdGFzay5pbnZva2UsIHRhc2tEYXRhLm9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBjdXN0b21DYW5jZWxOb25HbG9iYWwgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgcmV0dXJuIG5hdGl2ZVJlbW92ZUV2ZW50TGlzdGVuZXIuY2FsbCh0YXNrLnRhcmdldCwgdGFzay5ldmVudE5hbWUsIHRhc2suaW52b2tlLCB0YXNrLm9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBjdXN0b21TY2hlZHVsZSA9IHVzZUdsb2JhbENhbGxiYWNrID8gY3VzdG9tU2NoZWR1bGVHbG9iYWwgOiBjdXN0b21TY2hlZHVsZU5vbkdsb2JhbDtcbiAgICAgICAgY29uc3QgY3VzdG9tQ2FuY2VsID0gdXNlR2xvYmFsQ2FsbGJhY2sgPyBjdXN0b21DYW5jZWxHbG9iYWwgOiBjdXN0b21DYW5jZWxOb25HbG9iYWw7XG4gICAgICAgIGNvbnN0IGNvbXBhcmVUYXNrQ2FsbGJhY2tWc0RlbGVnYXRlID0gZnVuY3Rpb24gKHRhc2ssIGRlbGVnYXRlKSB7XG4gICAgICAgICAgICBjb25zdCB0eXBlT2ZEZWxlZ2F0ZSA9IHR5cGVvZiBkZWxlZ2F0ZTtcbiAgICAgICAgICAgIHJldHVybiAodHlwZU9mRGVsZWdhdGUgPT09ICdmdW5jdGlvbicgJiYgdGFzay5jYWxsYmFjayA9PT0gZGVsZWdhdGUpIHx8XG4gICAgICAgICAgICAgICAgKHR5cGVPZkRlbGVnYXRlID09PSAnb2JqZWN0JyAmJiB0YXNrLm9yaWdpbmFsRGVsZWdhdGUgPT09IGRlbGVnYXRlKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgY29tcGFyZSA9IChwYXRjaE9wdGlvbnMgJiYgcGF0Y2hPcHRpb25zLmRpZmYpID8gcGF0Y2hPcHRpb25zLmRpZmYgOiBjb21wYXJlVGFza0NhbGxiYWNrVnNEZWxlZ2F0ZTtcbiAgICAgICAgY29uc3QgdW5wYXRjaGVkRXZlbnRzID0gWm9uZVt6b25lU3ltYm9sKCdVTlBBVENIRURfRVZFTlRTJyldO1xuICAgICAgICBjb25zdCBwYXNzaXZlRXZlbnRzID0gX2dsb2JhbFt6b25lU3ltYm9sKCdQQVNTSVZFX0VWRU5UUycpXTtcbiAgICAgICAgY29uc3QgbWFrZUFkZExpc3RlbmVyID0gZnVuY3Rpb24gKG5hdGl2ZUxpc3RlbmVyLCBhZGRTb3VyY2UsIGN1c3RvbVNjaGVkdWxlRm4sIGN1c3RvbUNhbmNlbEZuLCByZXR1cm5UYXJnZXQgPSBmYWxzZSwgcHJlcGVuZCA9IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHRoaXMgfHwgX2dsb2JhbDtcbiAgICAgICAgICAgICAgICBsZXQgZXZlbnROYW1lID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChwYXRjaE9wdGlvbnMgJiYgcGF0Y2hPcHRpb25zLnRyYW5zZmVyRXZlbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50TmFtZSA9IHBhdGNoT3B0aW9ucy50cmFuc2ZlckV2ZW50TmFtZShldmVudE5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgZGVsZWdhdGUgPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICAgICAgaWYgKCFkZWxlZ2F0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmF0aXZlTGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzTm9kZSAmJiBldmVudE5hbWUgPT09ICd1bmNhdWdodEV4Y2VwdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9uJ3QgcGF0Y2ggdW5jYXVnaHRFeGNlcHRpb24gb2Ygbm9kZWpzIHRvIHByZXZlbnQgZW5kbGVzcyBsb29wXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuYXRpdmVMaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBkb24ndCBjcmVhdGUgdGhlIGJpbmQgZGVsZWdhdGUgZnVuY3Rpb24gZm9yIGhhbmRsZUV2ZW50XG4gICAgICAgICAgICAgICAgLy8gY2FzZSBoZXJlIHRvIGltcHJvdmUgYWRkRXZlbnRMaXN0ZW5lciBwZXJmb3JtYW5jZVxuICAgICAgICAgICAgICAgIC8vIHdlIHdpbGwgY3JlYXRlIHRoZSBiaW5kIGRlbGVnYXRlIHdoZW4gaW52b2tlXG4gICAgICAgICAgICAgICAgbGV0IGlzSGFuZGxlRXZlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlbGVnYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGVsZWdhdGUuaGFuZGxlRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuYXRpdmVMaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlzSGFuZGxlRXZlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodmFsaWRhdGVIYW5kbGVyICYmICF2YWxpZGF0ZUhhbmRsZXIobmF0aXZlTGlzdGVuZXIsIGRlbGVnYXRlLCB0YXJnZXQsIGFyZ3VtZW50cykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBwYXNzaXZlID0gcGFzc2l2ZVN1cHBvcnRlZCAmJiAhIXBhc3NpdmVFdmVudHMgJiYgcGFzc2l2ZUV2ZW50cy5pbmRleE9mKGV2ZW50TmFtZSkgIT09IC0xO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBidWlsZEV2ZW50TGlzdGVuZXJPcHRpb25zKGFyZ3VtZW50c1syXSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHVucGF0Y2hlZEV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayB1bnBhdGNoZWQgbGlzdFxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVucGF0Y2hlZEV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50TmFtZSA9PT0gdW5wYXRjaGVkRXZlbnRzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhc3NpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hdGl2ZUxpc3RlbmVyLmNhbGwodGFyZ2V0LCBldmVudE5hbWUsIGRlbGVnYXRlLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuYXRpdmVMaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBjYXB0dXJlID0gIW9wdGlvbnMgPyBmYWxzZSA6IHR5cGVvZiBvcHRpb25zID09PSAnYm9vbGVhbicgPyB0cnVlIDogb3B0aW9ucy5jYXB0dXJlO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uY2UgPSBvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0JyA/IG9wdGlvbnMub25jZSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHpvbmUgPSBab25lLmN1cnJlbnQ7XG4gICAgICAgICAgICAgICAgbGV0IHN5bWJvbEV2ZW50TmFtZXMgPSB6b25lU3ltYm9sRXZlbnROYW1lc1tldmVudE5hbWVdO1xuICAgICAgICAgICAgICAgIGlmICghc3ltYm9sRXZlbnROYW1lcykge1xuICAgICAgICAgICAgICAgICAgICBwcmVwYXJlRXZlbnROYW1lcyhldmVudE5hbWUsIGV2ZW50TmFtZVRvU3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sRXZlbnROYW1lcyA9IHpvbmVTeW1ib2xFdmVudE5hbWVzW2V2ZW50TmFtZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN5bWJvbEV2ZW50TmFtZSA9IHN5bWJvbEV2ZW50TmFtZXNbY2FwdHVyZSA/IFRSVUVfU1RSIDogRkFMU0VfU1RSXTtcbiAgICAgICAgICAgICAgICBsZXQgZXhpc3RpbmdUYXNrcyA9IHRhcmdldFtzeW1ib2xFdmVudE5hbWVdO1xuICAgICAgICAgICAgICAgIGxldCBpc0V4aXN0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nVGFza3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBoYXZlIHRhc2sgcmVnaXN0ZXJlZFxuICAgICAgICAgICAgICAgICAgICBpc0V4aXN0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrRHVwbGljYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4aXN0aW5nVGFza3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGFyZShleGlzdGluZ1Rhc2tzW2ldLCBkZWxlZ2F0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2FtZSBjYWxsYmFjaywgc2FtZSBjYXB0dXJlLCBzYW1lIGV2ZW50IG5hbWUsIGp1c3QgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nVGFza3MgPSB0YXJnZXRbc3ltYm9sRXZlbnROYW1lXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgc291cmNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnN0cnVjdG9yTmFtZSA9IHRhcmdldC5jb25zdHJ1Y3RvclsnbmFtZSddO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFNvdXJjZSA9IGdsb2JhbFNvdXJjZXNbY29uc3RydWN0b3JOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0U291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IHRhcmdldFNvdXJjZVtldmVudE5hbWVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSBjb25zdHJ1Y3Rvck5hbWUgKyBhZGRTb3VyY2UgK1xuICAgICAgICAgICAgICAgICAgICAgICAgKGV2ZW50TmFtZVRvU3RyaW5nID8gZXZlbnROYW1lVG9TdHJpbmcoZXZlbnROYW1lKSA6IGV2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGRvIG5vdCBjcmVhdGUgYSBuZXcgb2JqZWN0IGFzIHRhc2suZGF0YSB0byBwYXNzIHRob3NlIHRoaW5nc1xuICAgICAgICAgICAgICAgIC8vIGp1c3QgdXNlIHRoZSBnbG9iYWwgc2hhcmVkIG9uZVxuICAgICAgICAgICAgICAgIHRhc2tEYXRhLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgICAgIGlmIChvbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGFkZEV2ZW50TGlzdGVuZXIgd2l0aCBvbmNlIG9wdGlvbnMsIHdlIGRvbid0IHBhc3MgaXQgdG9cbiAgICAgICAgICAgICAgICAgICAgLy8gbmF0aXZlIGFkZEV2ZW50TGlzdGVuZXIsIGluc3RlYWQgd2Uga2VlcCB0aGUgb25jZSBzZXR0aW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGFuZCBoYW5kbGUgb3Vyc2VsdmVzLlxuICAgICAgICAgICAgICAgICAgICB0YXNrRGF0YS5vcHRpb25zLm9uY2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGFza0RhdGEudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICAgICAgICAgIHRhc2tEYXRhLmNhcHR1cmUgPSBjYXB0dXJlO1xuICAgICAgICAgICAgICAgIHRhc2tEYXRhLmV2ZW50TmFtZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB0YXNrRGF0YS5pc0V4aXN0aW5nID0gaXNFeGlzdGluZztcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdXNlR2xvYmFsQ2FsbGJhY2sgPyBPUFRJTUlaRURfWk9ORV9FVkVOVF9UQVNLX0RBVEEgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgLy8ga2VlcCB0YXNrRGF0YSBpbnRvIGRhdGEgdG8gYWxsb3cgb25TY2hlZHVsZUV2ZW50VGFzayB0byBhY2Nlc3MgdGhlIHRhc2sgaW5mb3JtYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnRhc2tEYXRhID0gdGFza0RhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRhc2sgPSB6b25lLnNjaGVkdWxlRXZlbnRUYXNrKHNvdXJjZSwgZGVsZWdhdGUsIGRhdGEsIGN1c3RvbVNjaGVkdWxlRm4sIGN1c3RvbUNhbmNlbEZuKTtcbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgY2xlYXIgdGFza0RhdGEudGFyZ2V0IHRvIGF2b2lkIG1lbW9yeSBsZWFrXG4gICAgICAgICAgICAgICAgLy8gaXNzdWUsIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzIwNDQyXG4gICAgICAgICAgICAgICAgdGFza0RhdGEudGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAvLyBuZWVkIHRvIGNsZWFyIHVwIHRhc2tEYXRhIGJlY2F1c2UgaXQgaXMgYSBnbG9iYWwgb2JqZWN0XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS50YXNrRGF0YSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGhhdmUgdG8gc2F2ZSB0aG9zZSBpbmZvcm1hdGlvbiB0byB0YXNrIGluIGNhc2VcbiAgICAgICAgICAgICAgICAvLyBhcHBsaWNhdGlvbiBtYXkgY2FsbCB0YXNrLnpvbmUuY2FuY2VsVGFzaygpIGRpcmVjdGx5XG4gICAgICAgICAgICAgICAgaWYgKG9uY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5vbmNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEoIXBhc3NpdmVTdXBwb3J0ZWQgJiYgdHlwZW9mIHRhc2sub3B0aW9ucyA9PT0gJ2Jvb2xlYW4nKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBub3Qgc3VwcG9ydCBwYXNzaXZlLCBhbmQgd2UgcGFzcyBhbiBvcHRpb24gb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGFkZEV2ZW50TGlzdGVuZXIsIHdlIHNob3VsZCBzYXZlIHRoZSBvcHRpb25zIHRvIHRhc2tcbiAgICAgICAgICAgICAgICAgICAgdGFzay5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGFzay50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgICAgICAgICAgdGFzay5jYXB0dXJlID0gY2FwdHVyZTtcbiAgICAgICAgICAgICAgICB0YXNrLmV2ZW50TmFtZSA9IGV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoaXNIYW5kbGVFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzYXZlIG9yaWdpbmFsIGRlbGVnYXRlIGZvciBjb21wYXJlIHRvIGNoZWNrIGR1cGxpY2F0ZVxuICAgICAgICAgICAgICAgICAgICB0YXNrLm9yaWdpbmFsRGVsZWdhdGUgPSBkZWxlZ2F0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFwcmVwZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nVGFza3MucHVzaCh0YXNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nVGFza3MudW5zaGlmdCh0YXNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJldHVyblRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHByb3RvW0FERF9FVkVOVF9MSVNURU5FUl0gPSBtYWtlQWRkTGlzdGVuZXIobmF0aXZlQWRkRXZlbnRMaXN0ZW5lciwgQUREX0VWRU5UX0xJU1RFTkVSX1NPVVJDRSwgY3VzdG9tU2NoZWR1bGUsIGN1c3RvbUNhbmNlbCwgcmV0dXJuVGFyZ2V0KTtcbiAgICAgICAgaWYgKG5hdGl2ZVByZXBlbmRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBwcm90b1tQUkVQRU5EX0VWRU5UX0xJU1RFTkVSXSA9IG1ha2VBZGRMaXN0ZW5lcihuYXRpdmVQcmVwZW5kRXZlbnRMaXN0ZW5lciwgUFJFUEVORF9FVkVOVF9MSVNURU5FUl9TT1VSQ0UsIGN1c3RvbVNjaGVkdWxlUHJlcGVuZCwgY3VzdG9tQ2FuY2VsLCByZXR1cm5UYXJnZXQsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHByb3RvW1JFTU9WRV9FVkVOVF9MSVNURU5FUl0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzIHx8IF9nbG9iYWw7XG4gICAgICAgICAgICBsZXQgZXZlbnROYW1lID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgaWYgKHBhdGNoT3B0aW9ucyAmJiBwYXRjaE9wdGlvbnMudHJhbnNmZXJFdmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICBldmVudE5hbWUgPSBwYXRjaE9wdGlvbnMudHJhbnNmZXJFdmVudE5hbWUoZXZlbnROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBhcmd1bWVudHNbMl07XG4gICAgICAgICAgICBjb25zdCBjYXB0dXJlID0gIW9wdGlvbnMgPyBmYWxzZSA6IHR5cGVvZiBvcHRpb25zID09PSAnYm9vbGVhbicgPyB0cnVlIDogb3B0aW9ucy5jYXB0dXJlO1xuICAgICAgICAgICAgY29uc3QgZGVsZWdhdGUgPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICBpZiAoIWRlbGVnYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5hdGl2ZVJlbW92ZUV2ZW50TGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWxpZGF0ZUhhbmRsZXIgJiZcbiAgICAgICAgICAgICAgICAhdmFsaWRhdGVIYW5kbGVyKG5hdGl2ZVJlbW92ZUV2ZW50TGlzdGVuZXIsIGRlbGVnYXRlLCB0YXJnZXQsIGFyZ3VtZW50cykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzeW1ib2xFdmVudE5hbWVzID0gem9uZVN5bWJvbEV2ZW50TmFtZXNbZXZlbnROYW1lXTtcbiAgICAgICAgICAgIGxldCBzeW1ib2xFdmVudE5hbWU7XG4gICAgICAgICAgICBpZiAoc3ltYm9sRXZlbnROYW1lcykge1xuICAgICAgICAgICAgICAgIHN5bWJvbEV2ZW50TmFtZSA9IHN5bWJvbEV2ZW50TmFtZXNbY2FwdHVyZSA/IFRSVUVfU1RSIDogRkFMU0VfU1RSXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVGFza3MgPSBzeW1ib2xFdmVudE5hbWUgJiYgdGFyZ2V0W3N5bWJvbEV2ZW50TmFtZV07XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdUYXNrcykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXhpc3RpbmdUYXNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ1Rhc2sgPSBleGlzdGluZ1Rhc2tzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGFyZShleGlzdGluZ1Rhc2ssIGRlbGVnYXRlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdUYXNrcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzZXQgaXNSZW1vdmVkIHRvIGRhdGEgZm9yIGZhc3RlciBpbnZva2VUYXNrIGNoZWNrXG4gICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ1Rhc2suaXNSZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ1Rhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsbCB0YXNrcyBmb3IgdGhlIGV2ZW50TmFtZSArIGNhcHR1cmUgaGF2ZSBnb25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBnbG9iYWxab25lQXdhcmVDYWxsYmFjayBhbmQgcmVtb3ZlIHRoZSB0YXNrIGNhY2hlIGZyb20gdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdUYXNrLmFsbFJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtzeW1ib2xFdmVudE5hbWVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgdGFyZ2V0LCB3ZSBoYXZlIGFuIGV2ZW50IGxpc3RlbmVyIHdoaWNoIGlzIGFkZGVkIGJ5IG9uX3Byb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3VjaCBhcyB0YXJnZXQub25jbGljayA9IGZ1bmN0aW9uKCkge30sIHNvIHdlIG5lZWQgdG8gY2xlYXIgdGhpcyBpbnRlcm5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IHRvbyBpZiBhbGwgZGVsZWdhdGVzIGFsbCByZW1vdmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBldmVudE5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9uUHJvcGVydHlTeW1ib2wgPSBaT05FX1NZTUJPTF9QUkVGSVggKyAnT05fUFJPUEVSVFknICsgZXZlbnROYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbb25Qcm9wZXJ0eVN5bWJvbF0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nVGFzay56b25lLmNhbmNlbFRhc2soZXhpc3RpbmdUYXNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXR1cm5UYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaXNzdWUgOTMwLCBkaWRuJ3QgZmluZCB0aGUgZXZlbnQgbmFtZSBvciBjYWxsYmFja1xuICAgICAgICAgICAgLy8gZnJvbSB6b25lIGtlcHQgZXhpc3RpbmdUYXNrcywgdGhlIGNhbGxiYWNrIG1heWJlXG4gICAgICAgICAgICAvLyBhZGRlZCBvdXRzaWRlIG9mIHpvbmUsIHdlIG5lZWQgdG8gY2FsbCBuYXRpdmUgcmVtb3ZlRXZlbnRMaXN0ZW5lclxuICAgICAgICAgICAgLy8gdG8gdHJ5IHRvIHJlbW92ZSBpdC5cbiAgICAgICAgICAgIHJldHVybiBuYXRpdmVSZW1vdmVFdmVudExpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIHByb3RvW0xJU1RFTkVSU19FVkVOVF9MSVNURU5FUl0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB0aGlzIHx8IF9nbG9iYWw7XG4gICAgICAgICAgICBsZXQgZXZlbnROYW1lID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgaWYgKHBhdGNoT3B0aW9ucyAmJiBwYXRjaE9wdGlvbnMudHJhbnNmZXJFdmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICBldmVudE5hbWUgPSBwYXRjaE9wdGlvbnMudHJhbnNmZXJFdmVudE5hbWUoZXZlbnROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IFtdO1xuICAgICAgICAgICAgY29uc3QgdGFza3MgPSBmaW5kRXZlbnRUYXNrcyh0YXJnZXQsIGV2ZW50TmFtZVRvU3RyaW5nID8gZXZlbnROYW1lVG9TdHJpbmcoZXZlbnROYW1lKSA6IGV2ZW50TmFtZSk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhc2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFzayA9IHRhc2tzW2ldO1xuICAgICAgICAgICAgICAgIGxldCBkZWxlZ2F0ZSA9IHRhc2sub3JpZ2luYWxEZWxlZ2F0ZSA/IHRhc2sub3JpZ2luYWxEZWxlZ2F0ZSA6IHRhc2suY2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzLnB1c2goZGVsZWdhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcbiAgICAgICAgfTtcbiAgICAgICAgcHJvdG9bUkVNT1ZFX0FMTF9MSVNURU5FUlNfRVZFTlRfTElTVEVORVJdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcyB8fCBfZ2xvYmFsO1xuICAgICAgICAgICAgbGV0IGV2ZW50TmFtZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGlmICghZXZlbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSBrZXlzW2ldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IEVWRU5UX05BTUVfU1lNQk9MX1JFR1guZXhlYyhwcm9wKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV2dE5hbWUgPSBtYXRjaCAmJiBtYXRjaFsxXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gbm9kZWpzIEV2ZW50RW1pdHRlciwgcmVtb3ZlTGlzdGVuZXIgZXZlbnQgaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gdXNlZCBmb3IgbW9uaXRvcmluZyB0aGUgcmVtb3ZlTGlzdGVuZXIgY2FsbCxcbiAgICAgICAgICAgICAgICAgICAgLy8gc28ganVzdCBrZWVwIHJlbW92ZUxpc3RlbmVyIGV2ZW50TGlzdGVuZXIgdW50aWxcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxsIG90aGVyIGV2ZW50TGlzdGVuZXJzIGFyZSByZW1vdmVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChldnROYW1lICYmIGV2dE5hbWUgIT09ICdyZW1vdmVMaXN0ZW5lcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbUkVNT1ZFX0FMTF9MSVNURU5FUlNfRVZFTlRfTElTVEVORVJdLmNhbGwodGhpcywgZXZ0TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHJlbW92ZUxpc3RlbmVyIGxpc3RlbmVyIGZpbmFsbHlcbiAgICAgICAgICAgICAgICB0aGlzW1JFTU9WRV9BTExfTElTVEVORVJTX0VWRU5UX0xJU1RFTkVSXS5jYWxsKHRoaXMsICdyZW1vdmVMaXN0ZW5lcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGNoT3B0aW9ucyAmJiBwYXRjaE9wdGlvbnMudHJhbnNmZXJFdmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnROYW1lID0gcGF0Y2hPcHRpb25zLnRyYW5zZmVyRXZlbnROYW1lKGV2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN5bWJvbEV2ZW50TmFtZXMgPSB6b25lU3ltYm9sRXZlbnROYW1lc1tldmVudE5hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChzeW1ib2xFdmVudE5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN5bWJvbEV2ZW50TmFtZSA9IHN5bWJvbEV2ZW50TmFtZXNbRkFMU0VfU1RSXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3ltYm9sQ2FwdHVyZUV2ZW50TmFtZSA9IHN5bWJvbEV2ZW50TmFtZXNbVFJVRV9TVFJdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXNrcyA9IHRhcmdldFtzeW1ib2xFdmVudE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYXB0dXJlVGFza3MgPSB0YXJnZXRbc3ltYm9sQ2FwdHVyZUV2ZW50TmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXNrcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlVGFza3MgPSB0YXNrcy5zbGljZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW1vdmVUYXNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhc2sgPSByZW1vdmVUYXNrc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVsZWdhdGUgPSB0YXNrLm9yaWdpbmFsRGVsZWdhdGUgPyB0YXNrLm9yaWdpbmFsRGVsZWdhdGUgOiB0YXNrLmNhbGxiYWNrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbUkVNT1ZFX0VWRU5UX0xJU1RFTkVSXS5jYWxsKHRoaXMsIGV2ZW50TmFtZSwgZGVsZWdhdGUsIHRhc2sub3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcHR1cmVUYXNrcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlVGFza3MgPSBjYXB0dXJlVGFza3Muc2xpY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtb3ZlVGFza3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YXNrID0gcmVtb3ZlVGFza3NbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRlbGVnYXRlID0gdGFzay5vcmlnaW5hbERlbGVnYXRlID8gdGFzay5vcmlnaW5hbERlbGVnYXRlIDogdGFzay5jYWxsYmFjaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW1JFTU9WRV9FVkVOVF9MSVNURU5FUl0uY2FsbCh0aGlzLCBldmVudE5hbWUsIGRlbGVnYXRlLCB0YXNrLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJldHVyblRhcmdldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBmb3IgbmF0aXZlIHRvU3RyaW5nIHBhdGNoXG4gICAgICAgIGF0dGFjaE9yaWdpblRvUGF0Y2hlZChwcm90b1tBRERfRVZFTlRfTElTVEVORVJdLCBuYXRpdmVBZGRFdmVudExpc3RlbmVyKTtcbiAgICAgICAgYXR0YWNoT3JpZ2luVG9QYXRjaGVkKHByb3RvW1JFTU9WRV9FVkVOVF9MSVNURU5FUl0sIG5hdGl2ZVJlbW92ZUV2ZW50TGlzdGVuZXIpO1xuICAgICAgICBpZiAobmF0aXZlUmVtb3ZlQWxsTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBhdHRhY2hPcmlnaW5Ub1BhdGNoZWQocHJvdG9bUkVNT1ZFX0FMTF9MSVNURU5FUlNfRVZFTlRfTElTVEVORVJdLCBuYXRpdmVSZW1vdmVBbGxMaXN0ZW5lcnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYXRpdmVMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGF0dGFjaE9yaWdpblRvUGF0Y2hlZChwcm90b1tMSVNURU5FUlNfRVZFTlRfTElTVEVORVJdLCBuYXRpdmVMaXN0ZW5lcnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXBpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHRzW2ldID0gcGF0Y2hFdmVudFRhcmdldE1ldGhvZHMoYXBpc1tpXSwgcGF0Y2hPcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5mdW5jdGlvbiBmaW5kRXZlbnRUYXNrcyh0YXJnZXQsIGV2ZW50TmFtZSkge1xuICAgIGlmICghZXZlbnROYW1lKSB7XG4gICAgICAgIGNvbnN0IGZvdW5kVGFza3MgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiB0YXJnZXQpIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gRVZFTlRfTkFNRV9TWU1CT0xfUkVHWC5leGVjKHByb3ApO1xuICAgICAgICAgICAgbGV0IGV2dE5hbWUgPSBtYXRjaCAmJiBtYXRjaFsxXTtcbiAgICAgICAgICAgIGlmIChldnROYW1lICYmICghZXZlbnROYW1lIHx8IGV2dE5hbWUgPT09IGV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXNrcyA9IHRhcmdldFtwcm9wXTtcbiAgICAgICAgICAgICAgICBpZiAodGFza3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YXNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRUYXNrcy5wdXNoKHRhc2tzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm91bmRUYXNrcztcbiAgICB9XG4gICAgbGV0IHN5bWJvbEV2ZW50TmFtZSA9IHpvbmVTeW1ib2xFdmVudE5hbWVzW2V2ZW50TmFtZV07XG4gICAgaWYgKCFzeW1ib2xFdmVudE5hbWUpIHtcbiAgICAgICAgcHJlcGFyZUV2ZW50TmFtZXMoZXZlbnROYW1lKTtcbiAgICAgICAgc3ltYm9sRXZlbnROYW1lID0gem9uZVN5bWJvbEV2ZW50TmFtZXNbZXZlbnROYW1lXTtcbiAgICB9XG4gICAgY29uc3QgY2FwdHVyZUZhbHNlVGFza3MgPSB0YXJnZXRbc3ltYm9sRXZlbnROYW1lW0ZBTFNFX1NUUl1dO1xuICAgIGNvbnN0IGNhcHR1cmVUcnVlVGFza3MgPSB0YXJnZXRbc3ltYm9sRXZlbnROYW1lW1RSVUVfU1RSXV07XG4gICAgaWYgKCFjYXB0dXJlRmFsc2VUYXNrcykge1xuICAgICAgICByZXR1cm4gY2FwdHVyZVRydWVUYXNrcyA/IGNhcHR1cmVUcnVlVGFza3Muc2xpY2UoKSA6IFtdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNhcHR1cmVUcnVlVGFza3MgPyBjYXB0dXJlRmFsc2VUYXNrcy5jb25jYXQoY2FwdHVyZVRydWVUYXNrcykgOlxuICAgICAgICAgICAgY2FwdHVyZUZhbHNlVGFza3Muc2xpY2UoKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwYXRjaEV2ZW50UHJvdG90eXBlKGdsb2JhbCwgYXBpKSB7XG4gICAgY29uc3QgRXZlbnQgPSBnbG9iYWxbJ0V2ZW50J107XG4gICAgaWYgKEV2ZW50ICYmIEV2ZW50LnByb3RvdHlwZSkge1xuICAgICAgICBhcGkucGF0Y2hNZXRob2QoRXZlbnQucHJvdG90eXBlLCAnc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uJywgKGRlbGVnYXRlKSA9PiBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgc2VsZltJTU1FRElBVEVfUFJPUEFHQVRJT05fU1lNQk9MXSA9IHRydWU7XG4gICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIGNhbGwgdGhlIG5hdGl2ZSBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cbiAgICAgICAgICAgIC8vIGluIGNhc2UgaW4gc29tZSBoeWJyaWQgYXBwbGljYXRpb24sIHNvbWUgcGFydCBvZlxuICAgICAgICAgICAgLy8gYXBwbGljYXRpb24gd2lsbCBiZSBjb250cm9sbGVkIGJ5IHpvbmUsIHNvbWUgYXJlIG5vdFxuICAgICAgICAgICAgZGVsZWdhdGUgJiYgZGVsZWdhdGUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGF0Y2hDYWxsYmFja3MoYXBpLCB0YXJnZXQsIHRhcmdldE5hbWUsIG1ldGhvZCwgY2FsbGJhY2tzKSB7XG4gICAgY29uc3Qgc3ltYm9sID0gWm9uZS5fX3N5bWJvbF9fKG1ldGhvZCk7XG4gICAgaWYgKHRhcmdldFtzeW1ib2xdKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbmF0aXZlRGVsZWdhdGUgPSB0YXJnZXRbc3ltYm9sXSA9IHRhcmdldFttZXRob2RdO1xuICAgIHRhcmdldFttZXRob2RdID0gZnVuY3Rpb24gKG5hbWUsIG9wdHMsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGAke3RhcmdldE5hbWV9LiR7bWV0aG9kfTo6YCArIGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3RvdHlwZSA9IG9wdHMucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIC8vIE5vdGU6IHRoZSBgcGF0Y2hDYWxsYmFja3NgIGlzIHVzZWQgZm9yIHBhdGNoaW5nIHRoZSBgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50YCBhbmRcbiAgICAgICAgICAgICAgICAvLyBgY3VzdG9tRWxlbWVudHMuZGVmaW5lYC4gV2UgZXhwbGljaXRseSB3cmFwIHRoZSBwYXRjaGluZyBjb2RlIGludG8gdHJ5LWNhdGNoIHNpbmNlXG4gICAgICAgICAgICAgICAgLy8gY2FsbGJhY2tzIG1heSBiZSBhbHJlYWR5IHBhdGNoZWQgYnkgb3RoZXIgd2ViIGNvbXBvbmVudHMgZnJhbWV3b3JrcyAoZS5nLiBMV0MpLCBhbmQgdGhleVxuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhvc2UgcHJvcGVydGllcyBub24td3JpdGFibGUuIFRoaXMgbWVhbnMgdGhhdCBwYXRjaGluZyBjYWxsYmFjayB3aWxsIHRocm93IGFuIGVycm9yXG4gICAgICAgICAgICAgICAgLy8gYGNhbm5vdCBhc3NpZ24gdG8gcmVhZC1vbmx5IHByb3BlcnR5YC4gU2VlIHRoaXMgY29kZSBhcyBhbiBleGFtcGxlOlxuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zYWxlc2ZvcmNlL2x3Yy9ibG9iL21hc3Rlci9wYWNrYWdlcy9AbHdjL2VuZ2luZS1jb3JlL3NyYy9mcmFtZXdvcmsvYmFzZS1icmlkZ2UtZWxlbWVudC50cyNMMTgwLUwxODZcbiAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRvIHN0b3AgdGhlIGFwcGxpY2F0aW9uIHJlbmRlcmluZyBpZiB3ZSBjb3VsZG4ndCBwYXRjaCBzb21lXG4gICAgICAgICAgICAgICAgLy8gY2FsbGJhY2ssIGUuZy4gYGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFja2AuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBhcGkuT2JqZWN0R2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvdHlwZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlc2NyaXB0b3IgJiYgZGVzY3JpcHRvci52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSBhcGkud3JhcFdpdGhDdXJyZW50Wm9uZShkZXNjcmlwdG9yLnZhbHVlLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5fcmVkZWZpbmVQcm9wZXJ0eShvcHRzLnByb3RvdHlwZSwgY2FsbGJhY2ssIGRlc2NyaXB0b3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocHJvdG90eXBlW2NhbGxiYWNrXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZVtjYWxsYmFja10gPSBhcGkud3JhcFdpdGhDdXJyZW50Wm9uZShwcm90b3R5cGVbY2FsbGJhY2tdLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHByb3RvdHlwZVtjYWxsYmFja10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZVtjYWxsYmFja10gPSBhcGkud3JhcFdpdGhDdXJyZW50Wm9uZShwcm90b3R5cGVbY2FsbGJhY2tdLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTm90ZTogd2UgbGVhdmUgdGhlIGNhdGNoIGJsb2NrIGVtcHR5IHNpbmNlIHRoZXJlJ3Mgbm8gd2F5IHRvIGhhbmRsZSB0aGUgZXJyb3IgcmVsYXRlZFxuICAgICAgICAgICAgICAgICAgICAvLyB0byBub24td3JpdGFibGUgcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hdGl2ZURlbGVnYXRlLmNhbGwodGFyZ2V0LCBuYW1lLCBvcHRzLCBvcHRpb25zKTtcbiAgICB9O1xuICAgIGFwaS5hdHRhY2hPcmlnaW5Ub1BhdGNoZWQodGFyZ2V0W21ldGhvZF0sIG5hdGl2ZURlbGVnYXRlKTtcbn1cblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBAc3VwcHJlc3Mge2dsb2JhbFRoaXN9XG4gKi9cbmZ1bmN0aW9uIGZpbHRlclByb3BlcnRpZXModGFyZ2V0LCBvblByb3BlcnRpZXMsIGlnbm9yZVByb3BlcnRpZXMpIHtcbiAgICBpZiAoIWlnbm9yZVByb3BlcnRpZXMgfHwgaWdub3JlUHJvcGVydGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG9uUHJvcGVydGllcztcbiAgICB9XG4gICAgY29uc3QgdGlwID0gaWdub3JlUHJvcGVydGllcy5maWx0ZXIoaXAgPT4gaXAudGFyZ2V0ID09PSB0YXJnZXQpO1xuICAgIGlmICghdGlwIHx8IHRpcC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG9uUHJvcGVydGllcztcbiAgICB9XG4gICAgY29uc3QgdGFyZ2V0SWdub3JlUHJvcGVydGllcyA9IHRpcFswXS5pZ25vcmVQcm9wZXJ0aWVzO1xuICAgIHJldHVybiBvblByb3BlcnRpZXMuZmlsdGVyKG9wID0+IHRhcmdldElnbm9yZVByb3BlcnRpZXMuaW5kZXhPZihvcCkgPT09IC0xKTtcbn1cbmZ1bmN0aW9uIHBhdGNoRmlsdGVyZWRQcm9wZXJ0aWVzKHRhcmdldCwgb25Qcm9wZXJ0aWVzLCBpZ25vcmVQcm9wZXJ0aWVzLCBwcm90b3R5cGUpIHtcbiAgICAvLyBjaGVjayB3aGV0aGVyIHRhcmdldCBpcyBhdmFpbGFibGUsIHNvbWV0aW1lcyB0YXJnZXQgd2lsbCBiZSB1bmRlZmluZWRcbiAgICAvLyBiZWNhdXNlIGRpZmZlcmVudCBicm93c2VyIG9yIHNvbWUgM3JkIHBhcnR5IHBsdWdpbi5cbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGZpbHRlcmVkUHJvcGVydGllcyA9IGZpbHRlclByb3BlcnRpZXModGFyZ2V0LCBvblByb3BlcnRpZXMsIGlnbm9yZVByb3BlcnRpZXMpO1xuICAgIHBhdGNoT25Qcm9wZXJ0aWVzKHRhcmdldCwgZmlsdGVyZWRQcm9wZXJ0aWVzLCBwcm90b3R5cGUpO1xufVxuLyoqXG4gKiBHZXQgYWxsIGV2ZW50IG5hbWUgcHJvcGVydGllcyB3aGljaCB0aGUgZXZlbnQgbmFtZSBzdGFydHNXaXRoIGBvbmBcbiAqIGZyb20gdGhlIHRhcmdldCBvYmplY3QgaXRzZWxmLCBpbmhlcml0ZWQgcHJvcGVydGllcyBhcmUgbm90IGNvbnNpZGVyZWQuXG4gKi9cbmZ1bmN0aW9uIGdldE9uRXZlbnROYW1lcyh0YXJnZXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KVxuICAgICAgICAuZmlsdGVyKG5hbWUgPT4gbmFtZS5zdGFydHNXaXRoKCdvbicpICYmIG5hbWUubGVuZ3RoID4gMilcbiAgICAgICAgLm1hcChuYW1lID0+IG5hbWUuc3Vic3RyaW5nKDIpKTtcbn1cbmZ1bmN0aW9uIHByb3BlcnR5RGVzY3JpcHRvclBhdGNoKGFwaSwgX2dsb2JhbCkge1xuICAgIGlmIChpc05vZGUgJiYgIWlzTWl4KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKFpvbmVbYXBpLnN5bWJvbCgncGF0Y2hFdmVudHMnKV0pIHtcbiAgICAgICAgLy8gZXZlbnRzIGFyZSBhbHJlYWR5IGJlZW4gcGF0Y2hlZCBieSBsZWdhY3kgcGF0Y2guXG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgaWdub3JlUHJvcGVydGllcyA9IF9nbG9iYWxbJ19fWm9uZV9pZ25vcmVfb25fcHJvcGVydGllcyddO1xuICAgIC8vIGZvciBicm93c2VycyB0aGF0IHdlIGNhbiBwYXRjaCB0aGUgZGVzY3JpcHRvcjogIENocm9tZSAmIEZpcmVmb3hcbiAgICBsZXQgcGF0Y2hUYXJnZXRzID0gW107XG4gICAgaWYgKGlzQnJvd3Nlcikge1xuICAgICAgICBjb25zdCBpbnRlcm5hbFdpbmRvdyA9IHdpbmRvdztcbiAgICAgICAgcGF0Y2hUYXJnZXRzID0gcGF0Y2hUYXJnZXRzLmNvbmNhdChbXG4gICAgICAgICAgICAnRG9jdW1lbnQnLCAnU1ZHRWxlbWVudCcsICdFbGVtZW50JywgJ0hUTUxFbGVtZW50JywgJ0hUTUxCb2R5RWxlbWVudCcsICdIVE1MTWVkaWFFbGVtZW50JyxcbiAgICAgICAgICAgICdIVE1MRnJhbWVTZXRFbGVtZW50JywgJ0hUTUxGcmFtZUVsZW1lbnQnLCAnSFRNTElGcmFtZUVsZW1lbnQnLCAnSFRNTE1hcnF1ZWVFbGVtZW50JywgJ1dvcmtlcidcbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnN0IGlnbm9yZUVycm9yUHJvcGVydGllcyA9IGlzSUUoKSA/IFt7IHRhcmdldDogaW50ZXJuYWxXaW5kb3csIGlnbm9yZVByb3BlcnRpZXM6IFsnZXJyb3InXSB9XSA6IFtdO1xuICAgICAgICAvLyBpbiBJRS9FZGdlLCBvblByb3Agbm90IGV4aXN0IGluIHdpbmRvdyBvYmplY3QsIGJ1dCBpbiBXaW5kb3dQcm90b3R5cGVcbiAgICAgICAgLy8gc28gd2UgbmVlZCB0byBwYXNzIFdpbmRvd1Byb3RvdHlwZSB0byBjaGVjayBvblByb3AgZXhpc3Qgb3Igbm90XG4gICAgICAgIHBhdGNoRmlsdGVyZWRQcm9wZXJ0aWVzKGludGVybmFsV2luZG93LCBnZXRPbkV2ZW50TmFtZXMoaW50ZXJuYWxXaW5kb3cpLCBpZ25vcmVQcm9wZXJ0aWVzID8gaWdub3JlUHJvcGVydGllcy5jb25jYXQoaWdub3JlRXJyb3JQcm9wZXJ0aWVzKSA6IGlnbm9yZVByb3BlcnRpZXMsIE9iamVjdEdldFByb3RvdHlwZU9mKGludGVybmFsV2luZG93KSk7XG4gICAgfVxuICAgIHBhdGNoVGFyZ2V0cyA9IHBhdGNoVGFyZ2V0cy5jb25jYXQoW1xuICAgICAgICAnWE1MSHR0cFJlcXVlc3QnLCAnWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCcsICdJREJJbmRleCcsICdJREJSZXF1ZXN0JywgJ0lEQk9wZW5EQlJlcXVlc3QnLFxuICAgICAgICAnSURCRGF0YWJhc2UnLCAnSURCVHJhbnNhY3Rpb24nLCAnSURCQ3Vyc29yJywgJ1dlYlNvY2tldCdcbiAgICBdKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGNoVGFyZ2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBfZ2xvYmFsW3BhdGNoVGFyZ2V0c1tpXV07XG4gICAgICAgIHRhcmdldCAmJiB0YXJnZXQucHJvdG90eXBlICYmXG4gICAgICAgICAgICBwYXRjaEZpbHRlcmVkUHJvcGVydGllcyh0YXJnZXQucHJvdG90eXBlLCBnZXRPbkV2ZW50TmFtZXModGFyZ2V0LnByb3RvdHlwZSksIGlnbm9yZVByb3BlcnRpZXMpO1xuICAgIH1cbn1cblxuWm9uZS5fX2xvYWRfcGF0Y2goJ3V0aWwnLCAoZ2xvYmFsLCBab25lLCBhcGkpID0+IHtcbiAgICAvLyBDb2xsZWN0IG5hdGl2ZSBldmVudCBuYW1lcyBieSBsb29raW5nIGF0IHByb3BlcnRpZXNcbiAgICAvLyBvbiB0aGUgZ2xvYmFsIG5hbWVzcGFjZSwgZS5nLiAnb25jbGljaycuXG4gICAgY29uc3QgZXZlbnROYW1lcyA9IGdldE9uRXZlbnROYW1lcyhnbG9iYWwpO1xuICAgIGFwaS5wYXRjaE9uUHJvcGVydGllcyA9IHBhdGNoT25Qcm9wZXJ0aWVzO1xuICAgIGFwaS5wYXRjaE1ldGhvZCA9IHBhdGNoTWV0aG9kO1xuICAgIGFwaS5iaW5kQXJndW1lbnRzID0gYmluZEFyZ3VtZW50cztcbiAgICBhcGkucGF0Y2hNYWNyb1Rhc2sgPSBwYXRjaE1hY3JvVGFzaztcbiAgICAvLyBJbiBlYXJsaWVyIHZlcnNpb24gb2Ygem9uZS5qcyAoPDAuOS4wKSwgd2UgdXNlIGVudiBuYW1lIGBfX3pvbmVfc3ltYm9sX19CTEFDS19MSVNURURfRVZFTlRTYCB0b1xuICAgIC8vIGRlZmluZSB3aGljaCBldmVudHMgd2lsbCBub3QgYmUgcGF0Y2hlZCBieSBgWm9uZS5qc2AuXG4gICAgLy8gSW4gbmV3ZXIgdmVyc2lvbiAoPj0wLjkuMCksIHdlIGNoYW5nZSB0aGUgZW52IG5hbWUgdG8gYF9fem9uZV9zeW1ib2xfX1VOUEFUQ0hFRF9FVkVOVFNgIHRvIGtlZXBcbiAgICAvLyB0aGUgbmFtZSBjb25zaXN0ZW50IHdpdGggYW5ndWxhciByZXBvLlxuICAgIC8vIFRoZSAgYF9fem9uZV9zeW1ib2xfX0JMQUNLX0xJU1RFRF9FVkVOVFNgIGlzIGRlcHJlY2F0ZWQsIGJ1dCBpdCBpcyBzdGlsbCBiZSBzdXBwb3J0ZWQgZm9yXG4gICAgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gICAgY29uc3QgU1lNQk9MX0JMQUNLX0xJU1RFRF9FVkVOVFMgPSBab25lLl9fc3ltYm9sX18oJ0JMQUNLX0xJU1RFRF9FVkVOVFMnKTtcbiAgICBjb25zdCBTWU1CT0xfVU5QQVRDSEVEX0VWRU5UUyA9IFpvbmUuX19zeW1ib2xfXygnVU5QQVRDSEVEX0VWRU5UUycpO1xuICAgIGlmIChnbG9iYWxbU1lNQk9MX1VOUEFUQ0hFRF9FVkVOVFNdKSB7XG4gICAgICAgIGdsb2JhbFtTWU1CT0xfQkxBQ0tfTElTVEVEX0VWRU5UU10gPSBnbG9iYWxbU1lNQk9MX1VOUEFUQ0hFRF9FVkVOVFNdO1xuICAgIH1cbiAgICBpZiAoZ2xvYmFsW1NZTUJPTF9CTEFDS19MSVNURURfRVZFTlRTXSkge1xuICAgICAgICBab25lW1NZTUJPTF9CTEFDS19MSVNURURfRVZFTlRTXSA9IFpvbmVbU1lNQk9MX1VOUEFUQ0hFRF9FVkVOVFNdID1cbiAgICAgICAgICAgIGdsb2JhbFtTWU1CT0xfQkxBQ0tfTElTVEVEX0VWRU5UU107XG4gICAgfVxuICAgIGFwaS5wYXRjaEV2ZW50UHJvdG90eXBlID0gcGF0Y2hFdmVudFByb3RvdHlwZTtcbiAgICBhcGkucGF0Y2hFdmVudFRhcmdldCA9IHBhdGNoRXZlbnRUYXJnZXQ7XG4gICAgYXBpLmlzSUVPckVkZ2UgPSBpc0lFT3JFZGdlO1xuICAgIGFwaS5PYmplY3REZWZpbmVQcm9wZXJ0eSA9IE9iamVjdERlZmluZVByb3BlcnR5O1xuICAgIGFwaS5PYmplY3RHZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSBPYmplY3RHZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4gICAgYXBpLk9iamVjdENyZWF0ZSA9IE9iamVjdENyZWF0ZTtcbiAgICBhcGkuQXJyYXlTbGljZSA9IEFycmF5U2xpY2U7XG4gICAgYXBpLnBhdGNoQ2xhc3MgPSBwYXRjaENsYXNzO1xuICAgIGFwaS53cmFwV2l0aEN1cnJlbnRab25lID0gd3JhcFdpdGhDdXJyZW50Wm9uZTtcbiAgICBhcGkuZmlsdGVyUHJvcGVydGllcyA9IGZpbHRlclByb3BlcnRpZXM7XG4gICAgYXBpLmF0dGFjaE9yaWdpblRvUGF0Y2hlZCA9IGF0dGFjaE9yaWdpblRvUGF0Y2hlZDtcbiAgICBhcGkuX3JlZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG4gICAgYXBpLnBhdGNoQ2FsbGJhY2tzID0gcGF0Y2hDYWxsYmFja3M7XG4gICAgYXBpLmdldEdsb2JhbE9iamVjdHMgPSAoKSA9PiAoe1xuICAgICAgICBnbG9iYWxTb3VyY2VzLFxuICAgICAgICB6b25lU3ltYm9sRXZlbnROYW1lcyxcbiAgICAgICAgZXZlbnROYW1lcyxcbiAgICAgICAgaXNCcm93c2VyLFxuICAgICAgICBpc01peCxcbiAgICAgICAgaXNOb2RlLFxuICAgICAgICBUUlVFX1NUUixcbiAgICAgICAgRkFMU0VfU1RSLFxuICAgICAgICBaT05FX1NZTUJPTF9QUkVGSVgsXG4gICAgICAgIEFERF9FVkVOVF9MSVNURU5FUl9TVFIsXG4gICAgICAgIFJFTU9WRV9FVkVOVF9MSVNURU5FUl9TVFJcbiAgICB9KTtcbn0pO1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBzdXBwcmVzcyB7bWlzc2luZ1JlcXVpcmV9XG4gKi9cbmZ1bmN0aW9uIHBhdGNoUXVldWVNaWNyb3Rhc2soZ2xvYmFsLCBhcGkpIHtcbiAgICBhcGkucGF0Y2hNZXRob2QoZ2xvYmFsLCAncXVldWVNaWNyb3Rhc2snLCAoZGVsZWdhdGUpID0+IHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICBab25lLmN1cnJlbnQuc2NoZWR1bGVNaWNyb1Rhc2soJ3F1ZXVlTWljcm90YXNrJywgYXJnc1swXSk7XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQGZpbGVvdmVydmlld1xuICogQHN1cHByZXNzIHttaXNzaW5nUmVxdWlyZX1cbiAqL1xuY29uc3QgdGFza1N5bWJvbCA9IHpvbmVTeW1ib2woJ3pvbmVUYXNrJyk7XG5mdW5jdGlvbiBwYXRjaFRpbWVyKHdpbmRvdywgc2V0TmFtZSwgY2FuY2VsTmFtZSwgbmFtZVN1ZmZpeCkge1xuICAgIGxldCBzZXROYXRpdmUgPSBudWxsO1xuICAgIGxldCBjbGVhck5hdGl2ZSA9IG51bGw7XG4gICAgc2V0TmFtZSArPSBuYW1lU3VmZml4O1xuICAgIGNhbmNlbE5hbWUgKz0gbmFtZVN1ZmZpeDtcbiAgICBjb25zdCB0YXNrc0J5SGFuZGxlSWQgPSB7fTtcbiAgICBmdW5jdGlvbiBzY2hlZHVsZVRhc2sodGFzaykge1xuICAgICAgICBjb25zdCBkYXRhID0gdGFzay5kYXRhO1xuICAgICAgICBkYXRhLmFyZ3NbMF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFzay5pbnZva2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZGF0YS5oYW5kbGVJZCA9IHNldE5hdGl2ZS5hcHBseSh3aW5kb3csIGRhdGEuYXJncyk7XG4gICAgICAgIHJldHVybiB0YXNrO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjbGVhclRhc2sodGFzaykge1xuICAgICAgICByZXR1cm4gY2xlYXJOYXRpdmUuY2FsbCh3aW5kb3csIHRhc2suZGF0YS5oYW5kbGVJZCk7XG4gICAgfVxuICAgIHNldE5hdGl2ZSA9XG4gICAgICAgIHBhdGNoTWV0aG9kKHdpbmRvdywgc2V0TmFtZSwgKGRlbGVnYXRlKSA9PiBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgaXNQZXJpb2RpYzogbmFtZVN1ZmZpeCA9PT0gJ0ludGVydmFsJyxcbiAgICAgICAgICAgICAgICAgICAgZGVsYXk6IChuYW1lU3VmZml4ID09PSAnVGltZW91dCcgfHwgbmFtZVN1ZmZpeCA9PT0gJ0ludGVydmFsJykgPyBhcmdzWzFdIHx8IDAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBhcmdzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgYXJnc1swXSA9IGZ1bmN0aW9uIHRpbWVyKCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpc3N1ZS05MzQsIHRhc2sgd2lsbCBiZSBjYW5jZWxsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZW4gaXQgaXMgYSBwZXJpb2RpYyB0YXNrIHN1Y2ggYXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNldEludGVydmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy80MDM4N1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYW51cCB0YXNrc0J5SGFuZGxlSWQgc2hvdWxkIGJlIGhhbmRsZWQgYmVmb3JlIHNjaGVkdWxlVGFza1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2luY2Ugc29tZSB6b25lU3BlYyBtYXkgaW50ZXJjZXB0IGFuZCBkb2Vzbid0IHRyaWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVkdWxlRm4oc2NoZWR1bGVUYXNrKSBwcm92aWRlZCBoZXJlLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEob3B0aW9ucy5pc1BlcmlvZGljKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5oYW5kbGVJZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW4gbm9uLW5vZGVqcyBlbnYsIHdlIHJlbW92ZSB0aW1lcklkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZyb20gbG9jYWwgY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRhc2tzQnlIYW5kbGVJZFtvcHRpb25zLmhhbmRsZUlkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5oYW5kbGVJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb2RlIHJldHVybnMgY29tcGxleCBvYmplY3RzIGFzIGhhbmRsZUlkc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSByZW1vdmUgdGFzayByZWZlcmVuY2UgZnJvbSB0aW1lciBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5oYW5kbGVJZFt0YXNrU3ltYm9sXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCB0YXNrID0gc2NoZWR1bGVNYWNyb1Rhc2tXaXRoQ3VycmVudFpvbmUoc2V0TmFtZSwgYXJnc1swXSwgb3B0aW9ucywgc2NoZWR1bGVUYXNrLCBjbGVhclRhc2spO1xuICAgICAgICAgICAgICAgIGlmICghdGFzaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTm9kZS5qcyBtdXN0IGFkZGl0aW9uYWxseSBzdXBwb3J0IHRoZSByZWYgYW5kIHVucmVmIGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGUgPSB0YXNrLmRhdGEuaGFuZGxlSWQ7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciBub24gbm9kZWpzIGVudiwgd2Ugc2F2ZSBoYW5kbGVJZDogdGFza1xuICAgICAgICAgICAgICAgICAgICAvLyBtYXBwaW5nIGluIGxvY2FsIGNhY2hlIGZvciBjbGVhclRpbWVvdXRcbiAgICAgICAgICAgICAgICAgICAgdGFza3NCeUhhbmRsZUlkW2hhbmRsZV0gPSB0YXNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChoYW5kbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yIG5vZGVqcyBlbnYsIHdlIHNhdmUgdGFza1xuICAgICAgICAgICAgICAgICAgICAvLyByZWZlcmVuY2UgaW4gdGltZXJJZCBPYmplY3QgZm9yIGNsZWFyVGltZW91dFxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVbdGFza1N5bWJvbF0gPSB0YXNrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBjaGVjayB3aGV0aGVyIGhhbmRsZSBpcyBudWxsLCBiZWNhdXNlIHNvbWUgcG9seWZpbGwgb3IgYnJvd3NlclxuICAgICAgICAgICAgICAgIC8vIG1heSByZXR1cm4gdW5kZWZpbmVkIGZyb20gc2V0VGltZW91dC9zZXRJbnRlcnZhbC9zZXRJbW1lZGlhdGUvcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZSAmJiBoYW5kbGUucmVmICYmIGhhbmRsZS51bnJlZiAmJiB0eXBlb2YgaGFuZGxlLnJlZiA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgaGFuZGxlLnVucmVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2sucmVmID0gaGFuZGxlLnJlZi5iaW5kKGhhbmRsZSk7XG4gICAgICAgICAgICAgICAgICAgIHRhc2sudW5yZWYgPSBoYW5kbGUudW5yZWYuYmluZChoYW5kbGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGhhbmRsZSA9PT0gJ251bWJlcicgfHwgaGFuZGxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0YXNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY2F1c2UgYW4gZXJyb3IgYnkgY2FsbGluZyBpdCBkaXJlY3RseS5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuYXBwbHkod2luZG93LCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgY2xlYXJOYXRpdmUgPVxuICAgICAgICBwYXRjaE1ldGhvZCh3aW5kb3csIGNhbmNlbE5hbWUsIChkZWxlZ2F0ZSkgPT4gZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gYXJnc1swXTtcbiAgICAgICAgICAgIGxldCB0YXNrO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAvLyBub24gbm9kZWpzIGVudi5cbiAgICAgICAgICAgICAgICB0YXNrID0gdGFza3NCeUhhbmRsZUlkW2lkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG5vZGVqcyBlbnYuXG4gICAgICAgICAgICAgICAgdGFzayA9IGlkICYmIGlkW3Rhc2tTeW1ib2xdO1xuICAgICAgICAgICAgICAgIC8vIG90aGVyIGVudmlyb25tZW50cy5cbiAgICAgICAgICAgICAgICBpZiAoIXRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgdGFzayA9IGlkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0YXNrICYmIHR5cGVvZiB0YXNrLnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2suc3RhdGUgIT09ICdub3RTY2hlZHVsZWQnICYmXG4gICAgICAgICAgICAgICAgICAgICh0YXNrLmNhbmNlbEZuICYmIHRhc2suZGF0YS5pc1BlcmlvZGljIHx8IHRhc2sucnVuQ291bnQgPT09IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaWQgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGFza3NCeUhhbmRsZUlkW2lkXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWRbdGFza1N5bWJvbF0gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIERvIG5vdCBjYW5jZWwgYWxyZWFkeSBjYW5jZWxlZCBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgdGFzay56b25lLmNhbmNlbFRhc2sodGFzayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY2F1c2UgYW4gZXJyb3IgYnkgY2FsbGluZyBpdCBkaXJlY3RseS5cbiAgICAgICAgICAgICAgICBkZWxlZ2F0ZS5hcHBseSh3aW5kb3csIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbn1cblxuZnVuY3Rpb24gcGF0Y2hDdXN0b21FbGVtZW50cyhfZ2xvYmFsLCBhcGkpIHtcbiAgICBjb25zdCB7IGlzQnJvd3NlciwgaXNNaXggfSA9IGFwaS5nZXRHbG9iYWxPYmplY3RzKCk7XG4gICAgaWYgKCghaXNCcm93c2VyICYmICFpc01peCkgfHwgIV9nbG9iYWxbJ2N1c3RvbUVsZW1lbnRzJ10gfHwgISgnY3VzdG9tRWxlbWVudHMnIGluIF9nbG9iYWwpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2FsbGJhY2tzID0gWydjb25uZWN0ZWRDYWxsYmFjaycsICdkaXNjb25uZWN0ZWRDYWxsYmFjaycsICdhZG9wdGVkQ2FsbGJhY2snLCAnYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrJ107XG4gICAgYXBpLnBhdGNoQ2FsbGJhY2tzKGFwaSwgX2dsb2JhbC5jdXN0b21FbGVtZW50cywgJ2N1c3RvbUVsZW1lbnRzJywgJ2RlZmluZScsIGNhbGxiYWNrcyk7XG59XG5cbmZ1bmN0aW9uIGV2ZW50VGFyZ2V0UGF0Y2goX2dsb2JhbCwgYXBpKSB7XG4gICAgaWYgKFpvbmVbYXBpLnN5bWJvbCgncGF0Y2hFdmVudFRhcmdldCcpXSkge1xuICAgICAgICAvLyBFdmVudFRhcmdldCBpcyBhbHJlYWR5IHBhdGNoZWQuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgeyBldmVudE5hbWVzLCB6b25lU3ltYm9sRXZlbnROYW1lcywgVFJVRV9TVFIsIEZBTFNFX1NUUiwgWk9ORV9TWU1CT0xfUFJFRklYIH0gPSBhcGkuZ2V0R2xvYmFsT2JqZWN0cygpO1xuICAgIC8vICBwcmVkZWZpbmUgYWxsIF9fem9uZV9zeW1ib2xfXyArIGV2ZW50TmFtZSArIHRydWUvZmFsc2Ugc3RyaW5nXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudE5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGV2ZW50TmFtZXNbaV07XG4gICAgICAgIGNvbnN0IGZhbHNlRXZlbnROYW1lID0gZXZlbnROYW1lICsgRkFMU0VfU1RSO1xuICAgICAgICBjb25zdCB0cnVlRXZlbnROYW1lID0gZXZlbnROYW1lICsgVFJVRV9TVFI7XG4gICAgICAgIGNvbnN0IHN5bWJvbCA9IFpPTkVfU1lNQk9MX1BSRUZJWCArIGZhbHNlRXZlbnROYW1lO1xuICAgICAgICBjb25zdCBzeW1ib2xDYXB0dXJlID0gWk9ORV9TWU1CT0xfUFJFRklYICsgdHJ1ZUV2ZW50TmFtZTtcbiAgICAgICAgem9uZVN5bWJvbEV2ZW50TmFtZXNbZXZlbnROYW1lXSA9IHt9O1xuICAgICAgICB6b25lU3ltYm9sRXZlbnROYW1lc1tldmVudE5hbWVdW0ZBTFNFX1NUUl0gPSBzeW1ib2w7XG4gICAgICAgIHpvbmVTeW1ib2xFdmVudE5hbWVzW2V2ZW50TmFtZV1bVFJVRV9TVFJdID0gc3ltYm9sQ2FwdHVyZTtcbiAgICB9XG4gICAgY29uc3QgRVZFTlRfVEFSR0VUID0gX2dsb2JhbFsnRXZlbnRUYXJnZXQnXTtcbiAgICBpZiAoIUVWRU5UX1RBUkdFVCB8fCAhRVZFTlRfVEFSR0VULnByb3RvdHlwZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGFwaS5wYXRjaEV2ZW50VGFyZ2V0KF9nbG9iYWwsIGFwaSwgW0VWRU5UX1RBUkdFVCAmJiBFVkVOVF9UQVJHRVQucHJvdG90eXBlXSk7XG4gICAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBwYXRjaEV2ZW50KGdsb2JhbCwgYXBpKSB7XG4gICAgYXBpLnBhdGNoRXZlbnRQcm90b3R5cGUoZ2xvYmFsLCBhcGkpO1xufVxuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBzdXBwcmVzcyB7bWlzc2luZ1JlcXVpcmV9XG4gKi9cblpvbmUuX19sb2FkX3BhdGNoKCdsZWdhY3knLCAoZ2xvYmFsKSA9PiB7XG4gICAgY29uc3QgbGVnYWN5UGF0Y2ggPSBnbG9iYWxbWm9uZS5fX3N5bWJvbF9fKCdsZWdhY3lQYXRjaCcpXTtcbiAgICBpZiAobGVnYWN5UGF0Y2gpIHtcbiAgICAgICAgbGVnYWN5UGF0Y2goKTtcbiAgICB9XG59KTtcblpvbmUuX19sb2FkX3BhdGNoKCd0aW1lcnMnLCAoZ2xvYmFsKSA9PiB7XG4gICAgY29uc3Qgc2V0ID0gJ3NldCc7XG4gICAgY29uc3QgY2xlYXIgPSAnY2xlYXInO1xuICAgIHBhdGNoVGltZXIoZ2xvYmFsLCBzZXQsIGNsZWFyLCAnVGltZW91dCcpO1xuICAgIHBhdGNoVGltZXIoZ2xvYmFsLCBzZXQsIGNsZWFyLCAnSW50ZXJ2YWwnKTtcbiAgICBwYXRjaFRpbWVyKGdsb2JhbCwgc2V0LCBjbGVhciwgJ0ltbWVkaWF0ZScpO1xufSk7XG5ab25lLl9fbG9hZF9wYXRjaCgncmVxdWVzdEFuaW1hdGlvbkZyYW1lJywgKGdsb2JhbCkgPT4ge1xuICAgIHBhdGNoVGltZXIoZ2xvYmFsLCAncmVxdWVzdCcsICdjYW5jZWwnLCAnQW5pbWF0aW9uRnJhbWUnKTtcbiAgICBwYXRjaFRpbWVyKGdsb2JhbCwgJ21velJlcXVlc3QnLCAnbW96Q2FuY2VsJywgJ0FuaW1hdGlvbkZyYW1lJyk7XG4gICAgcGF0Y2hUaW1lcihnbG9iYWwsICd3ZWJraXRSZXF1ZXN0JywgJ3dlYmtpdENhbmNlbCcsICdBbmltYXRpb25GcmFtZScpO1xufSk7XG5ab25lLl9fbG9hZF9wYXRjaCgnYmxvY2tpbmcnLCAoZ2xvYmFsLCBab25lKSA9PiB7XG4gICAgY29uc3QgYmxvY2tpbmdNZXRob2RzID0gWydhbGVydCcsICdwcm9tcHQnLCAnY29uZmlybSddO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tpbmdNZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBibG9ja2luZ01ldGhvZHNbaV07XG4gICAgICAgIHBhdGNoTWV0aG9kKGdsb2JhbCwgbmFtZSwgKGRlbGVnYXRlLCBzeW1ib2wsIG5hbWUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAocywgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiBab25lLmN1cnJlbnQucnVuKGRlbGVnYXRlLCBnbG9iYWwsIGFyZ3MsIG5hbWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5ab25lLl9fbG9hZF9wYXRjaCgnRXZlbnRUYXJnZXQnLCAoZ2xvYmFsLCBab25lLCBhcGkpID0+IHtcbiAgICBwYXRjaEV2ZW50KGdsb2JhbCwgYXBpKTtcbiAgICBldmVudFRhcmdldFBhdGNoKGdsb2JhbCwgYXBpKTtcbiAgICAvLyBwYXRjaCBYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0J3MgYWRkRXZlbnRMaXN0ZW5lci9yZW1vdmVFdmVudExpc3RlbmVyXG4gICAgY29uc3QgWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCA9IGdsb2JhbFsnWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCddO1xuICAgIGlmIChYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0ICYmIFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXQucHJvdG90eXBlKSB7XG4gICAgICAgIGFwaS5wYXRjaEV2ZW50VGFyZ2V0KGdsb2JhbCwgYXBpLCBbWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldC5wcm90b3R5cGVdKTtcbiAgICB9XG59KTtcblpvbmUuX19sb2FkX3BhdGNoKCdNdXRhdGlvbk9ic2VydmVyJywgKGdsb2JhbCwgWm9uZSwgYXBpKSA9PiB7XG4gICAgcGF0Y2hDbGFzcygnTXV0YXRpb25PYnNlcnZlcicpO1xuICAgIHBhdGNoQ2xhc3MoJ1dlYktpdE11dGF0aW9uT2JzZXJ2ZXInKTtcbn0pO1xuWm9uZS5fX2xvYWRfcGF0Y2goJ0ludGVyc2VjdGlvbk9ic2VydmVyJywgKGdsb2JhbCwgWm9uZSwgYXBpKSA9PiB7XG4gICAgcGF0Y2hDbGFzcygnSW50ZXJzZWN0aW9uT2JzZXJ2ZXInKTtcbn0pO1xuWm9uZS5fX2xvYWRfcGF0Y2goJ0ZpbGVSZWFkZXInLCAoZ2xvYmFsLCBab25lLCBhcGkpID0+IHtcbiAgICBwYXRjaENsYXNzKCdGaWxlUmVhZGVyJyk7XG59KTtcblpvbmUuX19sb2FkX3BhdGNoKCdvbl9wcm9wZXJ0eScsIChnbG9iYWwsIFpvbmUsIGFwaSkgPT4ge1xuICAgIHByb3BlcnR5RGVzY3JpcHRvclBhdGNoKGFwaSwgZ2xvYmFsKTtcbn0pO1xuWm9uZS5fX2xvYWRfcGF0Y2goJ2N1c3RvbUVsZW1lbnRzJywgKGdsb2JhbCwgWm9uZSwgYXBpKSA9PiB7XG4gICAgcGF0Y2hDdXN0b21FbGVtZW50cyhnbG9iYWwsIGFwaSk7XG59KTtcblpvbmUuX19sb2FkX3BhdGNoKCdYSFInLCAoZ2xvYmFsLCBab25lKSA9PiB7XG4gICAgLy8gVHJlYXQgWE1MSHR0cFJlcXVlc3QgYXMgYSBtYWNyb3Rhc2suXG4gICAgcGF0Y2hYSFIoZ2xvYmFsKTtcbiAgICBjb25zdCBYSFJfVEFTSyA9IHpvbmVTeW1ib2woJ3hoclRhc2snKTtcbiAgICBjb25zdCBYSFJfU1lOQyA9IHpvbmVTeW1ib2woJ3hoclN5bmMnKTtcbiAgICBjb25zdCBYSFJfTElTVEVORVIgPSB6b25lU3ltYm9sKCd4aHJMaXN0ZW5lcicpO1xuICAgIGNvbnN0IFhIUl9TQ0hFRFVMRUQgPSB6b25lU3ltYm9sKCd4aHJTY2hlZHVsZWQnKTtcbiAgICBjb25zdCBYSFJfVVJMID0gem9uZVN5bWJvbCgneGhyVVJMJyk7XG4gICAgY29uc3QgWEhSX0VSUk9SX0JFRk9SRV9TQ0hFRFVMRUQgPSB6b25lU3ltYm9sKCd4aHJFcnJvckJlZm9yZVNjaGVkdWxlZCcpO1xuICAgIGZ1bmN0aW9uIHBhdGNoWEhSKHdpbmRvdykge1xuICAgICAgICBjb25zdCBYTUxIdHRwUmVxdWVzdCA9IHdpbmRvd1snWE1MSHR0cFJlcXVlc3QnXTtcbiAgICAgICAgaWYgKCFYTUxIdHRwUmVxdWVzdCkge1xuICAgICAgICAgICAgLy8gWE1MSHR0cFJlcXVlc3QgaXMgbm90IGF2YWlsYWJsZSBpbiBzZXJ2aWNlIHdvcmtlclxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IFhNTEh0dHBSZXF1ZXN0UHJvdG90eXBlID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlO1xuICAgICAgICBmdW5jdGlvbiBmaW5kUGVuZGluZ1Rhc2sodGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W1hIUl9UQVNLXTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgb3JpQWRkTGlzdGVuZXIgPSBYTUxIdHRwUmVxdWVzdFByb3RvdHlwZVtaT05FX1NZTUJPTF9BRERfRVZFTlRfTElTVEVORVJdO1xuICAgICAgICBsZXQgb3JpUmVtb3ZlTGlzdGVuZXIgPSBYTUxIdHRwUmVxdWVzdFByb3RvdHlwZVtaT05FX1NZTUJPTF9SRU1PVkVfRVZFTlRfTElTVEVORVJdO1xuICAgICAgICBpZiAoIW9yaUFkZExpc3RlbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0ID0gd2luZG93WydYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0J107XG4gICAgICAgICAgICBpZiAoWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXRQcm90b3R5cGUgPSBYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0LnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgICBvcmlBZGRMaXN0ZW5lciA9IFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXRQcm90b3R5cGVbWk9ORV9TWU1CT0xfQUREX0VWRU5UX0xJU1RFTkVSXTtcbiAgICAgICAgICAgICAgICBvcmlSZW1vdmVMaXN0ZW5lciA9IFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXRQcm90b3R5cGVbWk9ORV9TWU1CT0xfUkVNT1ZFX0VWRU5UX0xJU1RFTkVSXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBSRUFEWV9TVEFURV9DSEFOR0UgPSAncmVhZHlzdGF0ZWNoYW5nZSc7XG4gICAgICAgIGNvbnN0IFNDSEVEVUxFRCA9ICdzY2hlZHVsZWQnO1xuICAgICAgICBmdW5jdGlvbiBzY2hlZHVsZVRhc2sodGFzaykge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRhc2suZGF0YTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGRhdGEudGFyZ2V0O1xuICAgICAgICAgICAgdGFyZ2V0W1hIUl9TQ0hFRFVMRURdID0gZmFsc2U7XG4gICAgICAgICAgICB0YXJnZXRbWEhSX0VSUk9SX0JFRk9SRV9TQ0hFRFVMRURdID0gZmFsc2U7XG4gICAgICAgICAgICAvLyByZW1vdmUgZXhpc3RpbmcgZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdGFyZ2V0W1hIUl9MSVNURU5FUl07XG4gICAgICAgICAgICBpZiAoIW9yaUFkZExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgb3JpQWRkTGlzdGVuZXIgPSB0YXJnZXRbWk9ORV9TWU1CT0xfQUREX0VWRU5UX0xJU1RFTkVSXTtcbiAgICAgICAgICAgICAgICBvcmlSZW1vdmVMaXN0ZW5lciA9IHRhcmdldFtaT05FX1NZTUJPTF9SRU1PVkVfRVZFTlRfTElTVEVORVJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgb3JpUmVtb3ZlTGlzdGVuZXIuY2FsbCh0YXJnZXQsIFJFQURZX1NUQVRFX0NIQU5HRSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3TGlzdGVuZXIgPSB0YXJnZXRbWEhSX0xJU1RFTkVSXSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LnJlYWR5U3RhdGUgPT09IHRhcmdldC5ET05FKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNvbWV0aW1lcyBvbiBzb21lIGJyb3dzZXJzIFhNTEh0dHBSZXF1ZXN0IHdpbGwgZmlyZSBvbnJlYWR5c3RhdGVjaGFuZ2Ugd2l0aFxuICAgICAgICAgICAgICAgICAgICAvLyByZWFkeVN0YXRlPTQgbXVsdGlwbGUgdGltZXMsIHNvIHdlIG5lZWQgdG8gY2hlY2sgdGFzayBzdGF0ZSBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGlmICghZGF0YS5hYm9ydGVkICYmIHRhcmdldFtYSFJfU0NIRURVTEVEXSAmJiB0YXNrLnN0YXRlID09PSBTQ0hFRFVMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHdoZXRoZXIgdGhlIHhociBoYXMgcmVnaXN0ZXJlZCBvbmxvYWQgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoYXQgaXMgdGhlIGNhc2UsIHRoZSB0YXNrIHNob3VsZCBpbnZva2UgYWZ0ZXIgYWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmxvYWQgbGlzdGVuZXJzIGZpbmlzaC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsc28gaWYgdGhlIHJlcXVlc3QgZmFpbGVkIHdpdGhvdXQgcmVzcG9uc2UgKHN0YXR1cyA9IDApLCB0aGUgbG9hZCBldmVudCBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWxsIG5vdCBiZSB0cmlnZ2VyZWQsIGluIHRoYXQgY2FzZSwgd2Ugc2hvdWxkIGFsc28gaW52b2tlIHRoZSBwbGFjZWhvbGRlciBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gY2xvc2UgdGhlIFhNTEh0dHBSZXF1ZXN0OjpzZW5kIG1hY3JvVGFzay5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzM4Nzk1XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkVGFza3MgPSB0YXJnZXRbWm9uZS5fX3N5bWJvbF9fKCdsb2FkZmFsc2UnKV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LnN0YXR1cyAhPT0gMCAmJiBsb2FkVGFza3MgJiYgbG9hZFRhc2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcmlJbnZva2UgPSB0YXNrLmludm9rZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXNrLmludm9rZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmVlZCB0byBsb2FkIHRoZSB0YXNrcyBhZ2FpbiwgYmVjYXVzZSBpbiBvdGhlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb2FkIGxpc3RlbmVyLCB0aGV5IG1heSByZW1vdmUgdGhlbXNlbHZlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2FkVGFza3MgPSB0YXJnZXRbWm9uZS5fX3N5bWJvbF9fKCdsb2FkZmFsc2UnKV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9hZFRhc2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9hZFRhc2tzW2ldID09PSB0YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFRhc2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRhdGEuYWJvcnRlZCAmJiB0YXNrLnN0YXRlID09PSBTQ0hFRFVMRUQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaUludm9rZS5jYWxsKHRhc2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkVGFza3MucHVzaCh0YXNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhc2suaW52b2tlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIWRhdGEuYWJvcnRlZCAmJiB0YXJnZXRbWEhSX1NDSEVEVUxFRF0gPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlcnJvciBvY2N1cnMgd2hlbiB4aHIuc2VuZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbWEhSX0VSUk9SX0JFRk9SRV9TQ0hFRFVMRURdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcmlBZGRMaXN0ZW5lci5jYWxsKHRhcmdldCwgUkVBRFlfU1RBVEVfQ0hBTkdFLCBuZXdMaXN0ZW5lcik7XG4gICAgICAgICAgICBjb25zdCBzdG9yZWRUYXNrID0gdGFyZ2V0W1hIUl9UQVNLXTtcbiAgICAgICAgICAgIGlmICghc3RvcmVkVGFzaykge1xuICAgICAgICAgICAgICAgIHRhcmdldFtYSFJfVEFTS10gPSB0YXNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VuZE5hdGl2ZS5hcHBseSh0YXJnZXQsIGRhdGEuYXJncyk7XG4gICAgICAgICAgICB0YXJnZXRbWEhSX1NDSEVEVUxFRF0gPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRhc2s7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcGxhY2Vob2xkZXJDYWxsYmFjaygpIHsgfVxuICAgICAgICBmdW5jdGlvbiBjbGVhclRhc2sodGFzaykge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRhc2suZGF0YTtcbiAgICAgICAgICAgIC8vIE5vdGUgLSBpZGVhbGx5LCB3ZSB3b3VsZCBjYWxsIGRhdGEudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIgaGVyZSwgYnV0IGl0J3MgdG9vIGxhdGVcbiAgICAgICAgICAgIC8vIHRvIHByZXZlbnQgaXQgZnJvbSBmaXJpbmcuIFNvIGluc3RlYWQsIHdlIHN0b3JlIGluZm8gZm9yIHRoZSBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICAgIGRhdGEuYWJvcnRlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gYWJvcnROYXRpdmUuYXBwbHkoZGF0YS50YXJnZXQsIGRhdGEuYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3Blbk5hdGl2ZSA9IHBhdGNoTWV0aG9kKFhNTEh0dHBSZXF1ZXN0UHJvdG90eXBlLCAnb3BlbicsICgpID0+IGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICBzZWxmW1hIUl9TWU5DXSA9IGFyZ3NbMl0gPT0gZmFsc2U7XG4gICAgICAgICAgICBzZWxmW1hIUl9VUkxdID0gYXJnc1sxXTtcbiAgICAgICAgICAgIHJldHVybiBvcGVuTmF0aXZlLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgWE1MSFRUUFJFUVVFU1RfU09VUkNFID0gJ1hNTEh0dHBSZXF1ZXN0LnNlbmQnO1xuICAgICAgICBjb25zdCBmZXRjaFRhc2tBYm9ydGluZyA9IHpvbmVTeW1ib2woJ2ZldGNoVGFza0Fib3J0aW5nJyk7XG4gICAgICAgIGNvbnN0IGZldGNoVGFza1NjaGVkdWxpbmcgPSB6b25lU3ltYm9sKCdmZXRjaFRhc2tTY2hlZHVsaW5nJyk7XG4gICAgICAgIGNvbnN0IHNlbmROYXRpdmUgPSBwYXRjaE1ldGhvZChYTUxIdHRwUmVxdWVzdFByb3RvdHlwZSwgJ3NlbmQnLCAoKSA9PiBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgaWYgKFpvbmUuY3VycmVudFtmZXRjaFRhc2tTY2hlZHVsaW5nXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIC8vIGEgZmV0Y2ggaXMgc2NoZWR1bGluZywgc28gd2UgYXJlIHVzaW5nIHhociB0byBwb2x5ZmlsbCBmZXRjaFxuICAgICAgICAgICAgICAgIC8vIGFuZCBiZWNhdXNlIHdlIGFscmVhZHkgc2NoZWR1bGUgbWFjcm9UYXNrIGZvciBmZXRjaCwgd2Ugc2hvdWxkXG4gICAgICAgICAgICAgICAgLy8gbm90IHNjaGVkdWxlIGEgbWFjcm9UYXNrIGZvciB4aHIgYWdhaW5cbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZE5hdGl2ZS5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZWxmW1hIUl9TWU5DXSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBYSFIgaXMgc3luYyB0aGVyZSBpcyBubyB0YXNrIHRvIHNjaGVkdWxlLCBqdXN0IGV4ZWN1dGUgdGhlIGNvZGUuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbmROYXRpdmUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0geyB0YXJnZXQ6IHNlbGYsIHVybDogc2VsZltYSFJfVVJMXSwgaXNQZXJpb2RpYzogZmFsc2UsIGFyZ3M6IGFyZ3MsIGFib3J0ZWQ6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgY29uc3QgdGFzayA9IHNjaGVkdWxlTWFjcm9UYXNrV2l0aEN1cnJlbnRab25lKFhNTEhUVFBSRVFVRVNUX1NPVVJDRSwgcGxhY2Vob2xkZXJDYWxsYmFjaywgb3B0aW9ucywgc2NoZWR1bGVUYXNrLCBjbGVhclRhc2spO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmICYmIHNlbGZbWEhSX0VSUk9SX0JFRk9SRV9TQ0hFRFVMRURdID09PSB0cnVlICYmICFvcHRpb25zLmFib3J0ZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgdGFzay5zdGF0ZSA9PT0gU0NIRURVTEVEKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHhociByZXF1ZXN0IHRocm93IGVycm9yIHdoZW4gc2VuZFxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBzaG91bGQgaW52b2tlIHRhc2sgaW5zdGVhZCBvZiBsZWF2aW5nIGEgc2NoZWR1bGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIHBlbmRpbmcgbWFjcm9UYXNrXG4gICAgICAgICAgICAgICAgICAgIHRhc2suaW52b2tlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYWJvcnROYXRpdmUgPSBwYXRjaE1ldGhvZChYTUxIdHRwUmVxdWVzdFByb3RvdHlwZSwgJ2Fib3J0JywgKCkgPT4gZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhc2sgPSBmaW5kUGVuZGluZ1Rhc2soc2VsZik7XG4gICAgICAgICAgICBpZiAodGFzayAmJiB0eXBlb2YgdGFzay50eXBlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIFhIUiBoYXMgYWxyZWFkeSBjb21wbGV0ZWQsIGRvIG5vdGhpbmcuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIFhIUiBoYXMgYWxyZWFkeSBiZWVuIGFib3J0ZWQsIGRvIG5vdGhpbmcuXG4gICAgICAgICAgICAgICAgLy8gRml4ICM1NjksIGNhbGwgYWJvcnQgbXVsdGlwbGUgdGltZXMgYmVmb3JlIGRvbmUgd2lsbCBjYXVzZVxuICAgICAgICAgICAgICAgIC8vIG1hY3JvVGFzayB0YXNrIGNvdW50IGJlIG5lZ2F0aXZlIG51bWJlclxuICAgICAgICAgICAgICAgIGlmICh0YXNrLmNhbmNlbEZuID09IG51bGwgfHwgKHRhc2suZGF0YSAmJiB0YXNrLmRhdGEuYWJvcnRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0YXNrLnpvbmUuY2FuY2VsVGFzayh0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKFpvbmUuY3VycmVudFtmZXRjaFRhc2tBYm9ydGluZ10gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgYWJvcnQgaXMgY2FsbGVkIGZyb20gZmV0Y2ggcG9seWZpbGwsIHdlIG5lZWQgdG8gY2FsbCBuYXRpdmUgYWJvcnQgb2YgWEhSLlxuICAgICAgICAgICAgICAgIHJldHVybiBhYm9ydE5hdGl2ZS5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgd2UgYXJlIHRyeWluZyB0byBhYm9ydCBhbiBYSFIgd2hpY2ggaGFzIG5vdCB5ZXQgYmVlbiBzZW50LCBzbyB0aGVyZSBpcyBub1xuICAgICAgICAgICAgLy8gdGFza1xuICAgICAgICAgICAgLy8gdG8gY2FuY2VsLiBEbyBub3RoaW5nLlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblpvbmUuX19sb2FkX3BhdGNoKCdnZW9sb2NhdGlvbicsIChnbG9iYWwpID0+IHtcbiAgICAvLy8gR0VPX0xPQ0FUSU9OXG4gICAgaWYgKGdsb2JhbFsnbmF2aWdhdG9yJ10gJiYgZ2xvYmFsWyduYXZpZ2F0b3InXS5nZW9sb2NhdGlvbikge1xuICAgICAgICBwYXRjaFByb3RvdHlwZShnbG9iYWxbJ25hdmlnYXRvciddLmdlb2xvY2F0aW9uLCBbJ2dldEN1cnJlbnRQb3NpdGlvbicsICd3YXRjaFBvc2l0aW9uJ10pO1xuICAgIH1cbn0pO1xuWm9uZS5fX2xvYWRfcGF0Y2goJ1Byb21pc2VSZWplY3Rpb25FdmVudCcsIChnbG9iYWwsIFpvbmUpID0+IHtcbiAgICAvLyBoYW5kbGUgdW5oYW5kbGVkIHByb21pc2UgcmVqZWN0aW9uXG4gICAgZnVuY3Rpb24gZmluZFByb21pc2VSZWplY3Rpb25IYW5kbGVyKGV2dE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjb25zdCBldmVudFRhc2tzID0gZmluZEV2ZW50VGFza3MoZ2xvYmFsLCBldnROYW1lKTtcbiAgICAgICAgICAgIGV2ZW50VGFza3MuZm9yRWFjaChldmVudFRhc2sgPT4ge1xuICAgICAgICAgICAgICAgIC8vIHdpbmRvd3MgaGFzIGFkZGVkIHVuaGFuZGxlZHJlamVjdGlvbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIC8vIHRyaWdnZXIgdGhlIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgICAgICAgICAgY29uc3QgUHJvbWlzZVJlamVjdGlvbkV2ZW50ID0gZ2xvYmFsWydQcm9taXNlUmVqZWN0aW9uRXZlbnQnXTtcbiAgICAgICAgICAgICAgICBpZiAoUHJvbWlzZVJlamVjdGlvbkV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2dCA9IG5ldyBQcm9taXNlUmVqZWN0aW9uRXZlbnQoZXZ0TmFtZSwgeyBwcm9taXNlOiBlLnByb21pc2UsIHJlYXNvbjogZS5yZWplY3Rpb24gfSk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VGFzay5pbnZva2UoZXZ0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGdsb2JhbFsnUHJvbWlzZVJlamVjdGlvbkV2ZW50J10pIHtcbiAgICAgICAgWm9uZVt6b25lU3ltYm9sKCd1bmhhbmRsZWRQcm9taXNlUmVqZWN0aW9uSGFuZGxlcicpXSA9XG4gICAgICAgICAgICBmaW5kUHJvbWlzZVJlamVjdGlvbkhhbmRsZXIoJ3VuaGFuZGxlZHJlamVjdGlvbicpO1xuICAgICAgICBab25lW3pvbmVTeW1ib2woJ3JlamVjdGlvbkhhbmRsZWRIYW5kbGVyJyldID1cbiAgICAgICAgICAgIGZpbmRQcm9taXNlUmVqZWN0aW9uSGFuZGxlcigncmVqZWN0aW9uaGFuZGxlZCcpO1xuICAgIH1cbn0pO1xuWm9uZS5fX2xvYWRfcGF0Y2goJ3F1ZXVlTWljcm90YXNrJywgKGdsb2JhbCwgWm9uZSwgYXBpKSA9PiB7XG4gICAgcGF0Y2hRdWV1ZU1pY3JvdGFzayhnbG9iYWwsIGFwaSk7XG59KTtcbiIsIih3aW5kb3cgYXMgYW55KS5nbG9iYWwgPSB3aW5kb3c7XG4od2luZG93IGFzIGFueSkucHJvY2VzcyA9IHtcbiAgZW52OiB7IERFQlVHOiB1bmRlZmluZWQgfSxcbn07XG4iXSwibWFwcGluZ3MiOiI7Q0FNRSxTQUFVLFFBQVE7QUFDaEIsUUFBTSxjQUFjLE9BQU8sYUFBYTtBQUN4QyxXQUFTLEtBQUssTUFBTTtBQUNoQixtQkFBZSxZQUFZLE1BQU0sS0FBSyxZQUFZLE1BQU0sRUFBRSxJQUFJO0FBQUEsRUFDbEU7QUFDQSxXQUFTLG1CQUFtQixNQUFNLE9BQU87QUFDckMsbUJBQWUsWUFBWSxTQUFTLEtBQUssWUFBWSxTQUFTLEVBQUUsTUFBTSxLQUFLO0FBQUEsRUFDL0U7QUFDQSxPQUFLLE1BQU07QUFJWCxRQUFNLGVBQWUsT0FBTyxzQkFBc0IsS0FBSztBQUN2RCxXQUFTLFdBQVcsTUFBTTtBQUN0QixXQUFPLGVBQWU7QUFBQSxFQUMxQjtBQUNBLFFBQU0saUJBQWlCLE9BQU8sV0FBVyx5QkFBeUIsQ0FBQyxNQUFNO0FBQ3pFLE1BQUksT0FBTyxNQUFNLEdBQUc7QUFVaEIsUUFBSSxrQkFBa0IsT0FBTyxPQUFPLE1BQU0sRUFBRSxlQUFlLFlBQVk7QUFDbkUsWUFBTSxJQUFJLE1BQU0sc0JBQXNCO0FBQUEsSUFDMUMsT0FDSztBQUNELGFBQU8sT0FBTyxNQUFNO0FBQUEsSUFDeEI7QUFBQSxFQUNKO0FBQ0EsUUFBTSxRQUFOLE1BQU0sTUFBSztBQUFBLElBR1AsT0FBTyxvQkFB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QUFFekQsV0FBUyw0QkFBNEIsU0FBUztBQUMxQyxXQUFPLFNBQVUsR0FBRztBQUNoQixZQUFNLGFBQWEsZUFBZSxRQUFRLE9BQU87QUFDakQsaUJBQVcsUUFBUSxlQUFhO0FBRzVCLGNBQU0sd0JBQXdCLE9BQU8sdUJBQXVCO0FBQzVELFlBQUksdUJBQXVCO0FBQ3ZCLGdCQUFNLE1BQU0sSUFBSSxzQkFBc0IsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLFFBQVEsRUFBRSxVQUFVLENBQUM7QUFDMUYsb0JBQVUsT0FBTyxHQUFHO0FBQUEsUUFDeEI7QUFBQSxNQUNKLENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDSjtBQUNBLE1BQUksT0FBTyx1QkFBdUIsR0FBRztBQUNqQyxJQUFBQSxNQUFLLFdBQVcsa0NBQWtDLENBQUMsSUFDL0MsNEJBQTRCLG9CQUFvQjtBQUNwRCxJQUFBQSxNQUFLLFdBQVcseUJBQXlCLENBQUMsSUFDdEMsNEJBQTRCLGtCQUFrQjtBQUFBLEVBQ3REO0FBQ0osQ0FBQztBQUNELEtBQUssYUFBYSxrQkFBa0IsQ0FBQyxRQUFRQSxPQUFNLFFBQVE7QUFDdkQsc0JBQW9CLFFBQVEsR0FBRztBQUNuQyxDQUFDOzs7QUNwckZBLE9BQWUsU0FBUztBQUN4QixPQUFlLFVBQVU7RUFDeEIsS0FBSyxFQUFFLE9BQU8sT0FBUzs7IiwibmFtZXMiOlsiWm9uZSIsInNlbGYiLCJkZWxlZ2F0ZSIsInByb3AiLCJPYmplY3RHZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJPYmplY3REZWZpbmVQcm9wZXJ0eSIsInZhbHVlIiwiX2dsb2JhbCIsImV2ZW50IiwicGF0Y2hPcHRpb25zIiwicmV0dXJuVGFyZ2V0IiwiaW50ZXJuYWxXaW5kb3ciLCJ3aW5kb3ciLCJpc0Jyb3dzZXIiLCJpc01peCIsInpvbmVTeW1ib2xFdmVudE5hbWVzIiwiVFJVRV9TVFIiLCJGQUxTRV9TVFIiLCJaT05FX1NZTUJPTF9QUkVGSVgiLCJuYW1lIiwibG9hZFRhc2tzIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXX0=