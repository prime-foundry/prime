export default class Util {
    /**
     * Lazily loads an ActorComponent on request. This keeps our object model small, as we only generate instances we need.
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
    static getComponentLazily(target, name, Type, config = {}) {
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
    static calculateValueOnce(target, name, func) {
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
     * @returns {{previous: {}, lastName: string}}
     */
    static traversePath(path, root, createIfMissing = false) {
        const parts = path.split('.');
        const lastIdx = parts.length - 1;
        let previous = root; // this is the prime access, can be the current user or the actor.

        const numbers = /^\d+$/;
        for (let idx = 0; idx < lastIdx; idx++) {
            let previousName = parts[idx];
            if(numbers.test(parts[idx]) && Array.isArray(previous)) {
                previousName = Number.parseInt(previousName);
            }
            if (previous[previousName] == null) {
                if (createIfMissing) {
                    previous[previousName] = numbers.test(parts[idx+1]) ? [] : {};
                } else {
                    throw `Undefined path element '${previousName}' at ${idx} whilst traversing path: '${path}'`;
                }
            }
            previous = previous[previousName];
        }
        const lastName = parts[lastIdx];
        if (previous[lastName] == null) {
            if (createIfMissing) {
                if(lastName.endsWith('[]')) {
                    previous[lastName.slice(-2)] = [];
                } else {
                    previous[lastName] =  {};
                }
            } else {
                throw `Undefined last element '${lastName}' at ${lastIdx} whilst traversing path: '${path}'`;
            }
        }
        return {previous, lastName};
    }

    /**
     * @param {string} path - the dot seperated path to an object
     * @param {{}} root - the root object to traverse.
     * @param {*} (value) - the rvalue object to set.
     * @param {boolean} (createIfMissing=true) - fills in missing fields, if set to true; or throws an error if set to false, unlike traversePath this
     * defaults to true.
     * @returns {*} the lastValue
     */
    static traverseAndSet(path, root, value, createIfMissing= true) {
        const {previous, lastName } = Util.traversePath(path, root, createIfMissing);
        const lastValue = previous[lastName];
        previous[lastName] = value;
        return lastValue;
    }
};