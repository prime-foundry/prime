/**
 * Lazily loads a Component on request. This keeps our object model small, as we only generate instances we need.
 * We use the property descriptors of Object to keep the fields private.
 * @example <caption>equivalent to the following: when provided a *name* and a *Type* </caption
 * if(!this._name) {
 *     return this.__name = new Type(this);
 * }
 * return this.name;
 *
 * @param {string} name the fieldName
 * @param {Class.<Component>} Type the class we want to instantiate
 * @param {object} (config) any additional parameters we want to send to its constructor.
 * @return {typeof Component} the actor component we generate
 */
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

/**
 * calculates a value once. This prevents calculating values more than once a request.
 * Specifically we may have some expensive calculations iterating
 * through loads of items, and we want to reduce that load.
 *
 * We use the property descriptors of Object to keep the fields private.
 * if a thisArg is provided then the *this* scope will be of the thisArg otherwise it defaults to the calling actor component.
 * You can also provide an array of arguments you want to send to the function.
 * @example <caption>equivalent to the following: when provided a *name* and a *func* </caption
 * if(!this._name) {
 *     return this.__name = func();
 * }
 * return this.name;
 * @example <caption> call a function with arguments </caption>
 * const value = this._calculateValueOnce('myName', (a,b) => a+b, this, 3,5);
 * // returns 8
 * @param {string} name the fieldName
 * @param {function} func the class we want to instantiate.
 * @return {any}
 */
export function calculateValueOnce(target, name, func) {
    const fieldName = `__${name}`;
    const property = Object.getOwnPropertyDescriptor(target, fieldName);
    if (property == null) {
        const value = func.call(target);
        Object.defineProperty(target, fieldName, {value});
        return value;
    }
    return property.value;
}

/**
 * @param {string} path - the dot seperated path to an object
 * @param {{}} root - the root object to traverse.
 * @param {boolean} (createIfMissing=false) - fills in missing fields, if set to true; or throws an error if set to false, defaults to false.
 * @returns {{object: {}, property: string}}
 */
export function traversePath(path, root, createIfMissing = false, collectParts = false) {
    const pathParts = path.split('.');
    const lastIdx = pathParts.length - 1;
    let object = root; // this is the prime access, can be the current user or the actor.
    const parts = collectParts ? [] : undefined;
    const numbers = /^\d+$/;
    for (let idx = 0; idx < lastIdx; idx++) {
        let property = pathParts[idx];
        let isArray = false;
        if (Array.isArray(object)) {
            if (numbers.test(pathParts[idx])) {
                property = Number.parseInt(property);
            }
            isArray = true;
        }
        if (object[property] == null) {
            if (createIfMissing) {
                object[property] = numbers.test(pathParts[idx + 1]) ? [] : {};
            } else {
                throw `Undefined path element '${property}' at ${idx} whilst traversing path: '${path}'`;
            }
        }
        if (collectParts) {
            parts.push({object, property, isArray});
        }
        object = object[property];
    }
    const untransformedLastName = pathParts[lastIdx];
    const isArray = untransformedLastName.endsWith('[]');
    const isFunction = untransformedLastName.endsWith('()');
    const property = (isArray || isFunction) ? untransformedLastName.slice(0, -2) : untransformedLastName;
    if (createIfMissing && object[property] == null) {
        let missing;
        if (isArray) {
            missing = [];
        } else if (isFunction) {
            missing = () => {
            };
        } else {
            missing = {};
        }
        object[property] = missing;
    }
    if (collectParts) {
        return {object, property, isArray, isFunction, parts};
    }
    return {object, property, isArray, isFunction};
}

export class DynError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DynError';
    }
}

export function datasetToObject(htmlElement, key = undefined) {
    const data = {};
    if (htmlElement && htmlElement.attributes) {
        const isDataRegex = /^data-/;
        Array.from(htmlElement.attributes)
            .filter(attr => isDataRegex.test(attr.name))
            .forEach((attr) => {
                const paths = attr.name.split('-');
                const lastIdx = paths.length - 1;
                let node = data;
                // we ignore the first 'data' and the last value.
                for (let idx = 1; idx < lastIdx; idx += 1) {
                    const name = paths[idx];
                    if (node[name] == null) {
                        node[name] = {};
                    }
                    node = node[name];
                }
                // if there is no value, then we presume it to be truthy
                node[paths[lastIdx]] = attr.value || true;
            });

    }
    if (key == null) {
        return data;
    }
    return data[key] || {};
}

export function sanitizeView(view) {
    if (view['jquery']) {
        return view.get()[0];
    }
    return view;
}

/**
 * class MyClass extends mix(SuperClass).with(Mixin1, Mixin2);
 *
 * @param superclass
 * @returns {MixinBuilder}
 */
export function mixin(superclass) {
    return new MixinBuilder(superclass);
}

class MixinBuilder {
    constructor(superclass) {
        this.superclass = superclass;
    }

    with(...mixins) {
        return mixins.reduce((c, mixin) => mixin(c), this.superclass);
    }
}