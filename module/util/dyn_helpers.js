/**
 * Lazily loads a Component on request. This keeps our object model small, as we only generate instances we need.
 * We use the property descriptors of Object to keep the fields private.
 * @example <caption>equivalent to the following: when provided a *name* and a *Type* </caption
 * if(!this._name) {
 *     return this.__name = new Type(this);
 * }
 * return this.name;
 * @template {Component} T
 * @template {Class.<T>} C
 * @param {string} name the fieldName
 * @param {C} Type the class we want to instantiate
 * @param {object} (config) any additional parameters we want to send to its constructor.
 * @return {T} the actor component we generate
 */
import {isFunction} from "./support.js";

export function getComponentLazily(target, name, Type, config = {}) {
    const fieldName = `__${name}`;
    const property = Object.getOwnPropertyDescriptor(target, fieldName);
    if (property == null) {
        const value = new Type(target, config);
        Object.defineProperty(target, fieldName, {value});
        return value;
    }
    return property.value;
}

function cachedGetter(fieldName, target, getter) {
    const cachedTime = `__${fieldName}_cachedTime`;
    const lastValue = `__${fieldName}_lastValue`;

    Object.defineProperty(target, cachedTime, {
        enumerable: false,
        writable: true,
        value: Date.now()
    });
    Object.defineProperty(target, lastValue, {
        enumerable: false,
        writable: true,
        value: null
    });
    const cachedGetter = getter;
    getter = () => {
        if (target[lastValue] == null || target[cachedTime] < target.dyn.lastChangedTime) {
            target[cachedTime] = target.dyn.lastChangedTime;
            target[lastValue] = cachedGetter();
        }
        return target[lastValue];
    };
    return getter;
}

/**
 *
 * @template {any} V
 * @param {Component} target
 * @param {string} fieldName
 * @param {function():V} get
 * @param (options)
 * @param {function(V):V} (options.onGet)
 * @param {boolean} (options.cached=false)
 */
export function getter(target, fieldName,  get, options = {
    onGet: undefined,
    cached: false
}) {
    let getter = get;
    if (isFunction(options.onGet)) {
        const onGet = options.onGet;
        const wrappedGetter = getter;
        getter = () => onGet(wrappedGetter());
    }

    if (options.cached) {
        getter = cachedGetter(fieldName, target, getter);
    }

    Object.defineProperty(target, fieldName, {
        enumerable: true,
        configurable: true,
        get: getter,
    });
}

/**
 *
 * @param {Component} target
 * @param {string} fieldName
 * @param {JSONPathBuilder} path
 * @param (options)
 * @template {any} V
 * @param {function():V || undefined} (options.get)
 * @param {function(V):V || undefined} (options.onGet)
 * @param {boolean || undefined} (options.fieldNameOnPath=true)
 * @param {boolean} (options.cached=false)
 */
export function pathGetter(target, fieldName, path, options = {
    get: undefined,
    onGet: undefined,
    cached: false
}) {
    pathProperty(target,fieldName, path, options,true);
}
/**
 *
 * @param {Component} target
 * @param {string} fieldName
 * @param {JSONPathBuilder} path
 * @param (options)
 * @template {any} V
 * @param {function():V || undefined} (options.get)
 * @param {function(V) || undefined} (options.set)
 * @param {function(V):V || undefined} (options.onGet)
 * @param {function(V):V || undefined} (options.onSet)
 * @param {boolean || undefined} (options.fieldNameOnPath=true)
 * @param {boolean || undefined} (options.cached=false)
 * @param {boolean} (noSetter=false)
 */
export function pathProperty(target, fieldName, path, options = {
    get: undefined,
    set: undefined,
    onGet: undefined,
    onSet: undefined,
    cached: false,
    fieldNameOnPath: true
}, getterOnly= false) {
    const fieldNameOnPath = options.fieldNameOnPath === undefined  ? true : options.fieldNameOnPath;
    const hasSetter = !getterOnly // undefined we default, null we don't use.
    const cached = !!options.cached;

    const traversingPath = fieldNameOnPath ? path.with(fieldName) : path
    let getter =  options.get || (() => traversingPath.traverse(target.document));
    let setter = hasSetter ? (options.set || ((value) => target.write(traversingPath, value))) : undefined;
    if (isFunction(options.onGet)) {
        const onGet = options.onGet;
        const wrappedGetter = getter;
        getter = () => onGet(wrappedGetter());
    }
    if (hasSetter && isFunction(options.onSet)) {
        const onSet = options.onSet;
        const wrappedSetter = setter;
        setter = (value) => wrappedSetter(onSet(value));
    }
    if (cached) {
        getter = cachedGetter(fieldName, target, getter);
    }
    Object.defineProperty(target, fieldName, {
        enumerable: true,
        configurable: true,
        get: getter,
        set: setter,
    });
}
