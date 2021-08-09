import JSONPathBuilder from "./util/JSONPathBuilder.js";
import {DynError, isString} from "./util/support.js";

class DynHandlebars {
    static dynEditor(options) {
        const root = options.data.root;
        const dyn = root.dyn;
        const hash = options.hash;

        const at = hash.at;
        if (!at) throw new DynError("You must define the name of an 'at' field.");

        const inputDyn = {root, handlebars: options.hash};

        const foundPath = dyn.controller.getModelValue(`${at}_path`, inputDyn);
        if (!foundPath) throw new DynError(`You must have a path getter for: ${at}_path`);

        const content = dyn.controller.getModelValue(at, inputDyn) || '';

        // exclude the first path component 'data.' because foundry is a dick.
        const target = JSONPathBuilder.from(foundPath).slice(1).toString();
        const newOptions = {...options, hash: {...hash, target, content}};

        return HandlebarsHelpers.editor(newOptions);
    }

    /**
     * Given an object, and some variables,
     * navigate from the object using those variable until you get the required value.
     *
     * @example <caption>Simple</caption>
     * let myObject = {levelOne: {something: 'hi', else: 'bye'}};
     *
     * {{at myObject 'levelOne' 'else'}} <!-- prints 'bye' -->
     *
     * @param object
     * @param rest
     * @returns {null|*}
     */
    static at(object, ...rest) {

        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const path = values.join('.');
        const pathBuilder = JSONPathBuilder.from(path);
        try {
            return pathBuilder.traverse(object);
        } catch (err) {
            // we don't actually want to throw an exception here, as we want to follow the handlebars spec of just returning null.
            return null;
        }
    }

    /**
     * Given an object, a path with '?' placeholders, and some variables,
     * navigate from the object using that path with injected variables until you get the required value.
     *
     * @example <caption>Simple</caption>
     * let myObject = {levelOne: {something: 'hi', else: 'bye'}};
     *
     * {{path myObject 'levelOne.?' 'something'}} <!-- prints 'hi' -->
     *
     * @param object
     * @param dynamicPath
     * @param rest
     * @returns {null|*}
     */
    static path(object, dynamicPath, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const pathParts = dynamicPath.split('?');
        const pathLength = pathParts.length;
        const valueLength = values.length;
        if (pathLength != valueLength + 1) {
            throw new DynError('Incorrect number of parameters passed to replace on the lookup');
        }
        let path = pathParts[0];
        let valueIdx = 0;
        let pathIdx = 1;
        while (pathIdx < pathLength) {
            path = `${path}${values[valueIdx++]}${pathParts[pathIdx++]}`;
        }
        const pathBuilder = JSONPathBuilder.from(path);
        try {
            return pathBuilder.traverse(object);
        } catch (err) {
            // we don't actually want to throw an exception here, as we want to follow the handlebars spec of just returning null.
            return null;
        }
    }

    static count(object) {
        return Array.isArray(object) ? object.length : Object.entries(object).length;
    }

    static greaterThan(value1, value2) {
        return (value1 || 0) > (value2 || 0);
    }

    static lessThan(value1, value2) {
        return (value1 || 0) < (value2 || 0);
    }

    static equalTo(value1, value2) {
        return value1 == value2;
    }

    static and(...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for (const val of values) {
            if (!val) {
                return false;
            }
        }
        return true;
    }

    static or(...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for (const val of values) {
            if (!!val) {
                return true;
            }
        }
        return false;
    }

    static xor(value1, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        let oneTrue = !!value1;
        for (const val of values) {
            if (!!val) {
                if (oneTrue) {
                    return false;
                }
                oneTrue = true;
            }
        }
        return oneTrue;
    }

    static defined(...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for (const val of values) {
            if (val == null) {
                return false;
            }
        }
        return true;
    }

    static not(...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for (const val of values) {
            if (!!val) {
                return false;
            }
        }
        return true;
    }

    /**
     * returns the provided value with 1 added (does not change the original value)
     * or return the first value with the second value added to it.
     *
     * @example <caption>Simple</caption>
     *
     * {{increment 3}} <!-- prints 4 -->
     * {{increment 3 2}} <!-- prints 5 -->
     *
     * @param value
     * @returns {number}
     */
    static increment(value, ...rest) {

        return parseInt(value) + (rest.length > 1 ? Number.parseInt(rest[0]) : 1);
    }

    /**
     * returns the provided value with 1 subtracted (does not change the original value)
     * or return the first value with the second value subtracted from it.
     *
     * @example <caption>Simple</caption>
     *
     * {{decrement 3}} <!-- prints 2 -->
     * {{decrement 3 2}} <!-- prints 1 -->
     *
     * @param value
     * @returns {number}
     */
    static decrement(value, ...rest) {

        return parseInt(value) - (rest.length > 1 ? Number.parseInt(rest[0]) : 1);
    }

    /**
     * returns true if the provided value is an integer.
     *
     * @example <caption>Simple</caption>
     *
     * {{isInteger 3}} <!-- prints true -->
     * {{isInteger 'hi'}} <!-- prints false -->
     *
     *
     * @param value
     * @returns {boolean}
     */
    static isInteger(value) {
        return Number.isInteger(value)
    }

    /**
     * Calls Array.prototype.join() on the provided parameters. The last parameter is the join value (i.e. ', ').
     *
     * @example <caption>Simple</caption>
     *
     * {{join 'hello', 'darkness', 'my', 'old', 'friend', '-'}} <!-- prints 'hello-darkness-my-old-friend' -->
     *
     * @param rest
     * @returns {string}
     */
    static join(...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const joinValue = values.pop();
        return values.join(joinValue);
    }

    /**
     * Given a function, and a list of parameters call that function.
     * WARNING: The first parameter is the 'this' argument. It will not be passed as an argument to the actual function.
     *
     * @example <caption>Simple</caption>
     * let myFunction = (a) => this.total + a;
     * let myObj = {total:5};
     *
     * {{call myObj myFunction 6}} <!-- prints 11 -->
     *
     * @param self this this.
     * @param fn the function to use
     * @param rest the parameters.
     * @returns {*} the result of the function
     */
    static call(self, fn, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        if(isString(fn)){
            fn = self[fn];
        }
        return fn.call(self, ...values);
    }

    /**
     *
     * Given a function, and a list of parameters call that function.
     * WARNING: There is no 'this' defined, so best used for static methods.
     *
     * @example <caption>Simple</caption>
     * let myFunction = (a, b) => a + b;
     *
     * {{callStatic 3 4}} <!-- prints 7 -->
     * @param fn the function to use
     * @param rest the parameters.
     * @returns {*} the result of the function
     */
    static callStatic(fn, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        return fn(...values);
    }

    /**
     * Given a collection, (iterable or array), and a list of values
     * Return true, if the collection contains at least one of each of those values. (it can contain other values too)
     *
     * @example <caption>Simple</caption>
     * let myCollection = ['hello', 'world'];
     *
     * {{#if (includes myCollection 'hello' 'world')}}
     * <!-- enters -->
     * {{/if}}
     *
     * {{#if (includes myCollection 'hello')}}
     * <!-- enters -->
     * {{/if}}
     *
     * {{#if (includes myCollection 'hello' 'world' 'goodbye')}}
     * <!-- does not enter -->
     * {{/if}}
     * @param collection
     * @param rest
     * @returns {boolean}
     */
    static includes(collection, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const arr = Array.from(collection);
        for (const val of values) {
            if (!collection.includes(val)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Given a collection, (iterable or array), and a list of values
     * Return true, if the collection only contains those values and nothing else.
     *
     * @example <caption>Simple</caption>
     * let myCollection = ['hello', 'world'];
     *
     * {{#if (onlyIncludes myCollection 'hello' 'world')}}
     * <!-- enters -->
     * {{/if}}
     *
     * {{#if (onlyIncludes myCollection 'hello')}}
     * <!-- does not enter -->
     * {{/if}}
     *
     * {{#if (onlyIncludes myCollection 'hello' 'world' 'goodbye')}}
     * <!-- enters -->
     * {{/if}}
     * @param collection
     * @param rest
     * @returns {boolean}
     */
    static onlyIncludes(collection, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const arr = Array.from(collection);
        for (const val of collection) {
            if (!values.includes(val)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Given a Map or an Object,
     * Return the keys on the map or object
     * In the case of the object these will be the property names.
     * Typically used as a subexpression.
     *
     * @example <caption>Simple</caption
     *
     * {{#each (keys myCollection)}}
     * <!-- Iterates over each key -->
     * {{/each}}
     *
     * @param collection
     * @param options
     * @returns {[]}
     */
    static keys(collection, options) {
        if (collection instanceof Map) {
            return Array.from(collection.keys());
        }
        if (collection instanceof Object) {
            return Array.from(Object.keys(collection));
        }
        return [];
    }

    /**
     * Given a Map or an Object,
     * Return the values on the map or object
     * In the case of the object these will be the property values.
     * Typically used as a subexpression.
     *
     * @example <caption>Simple</caption
     *
     * {{#each (values myCollection)}}
     * <!-- Iterates over each value -->
     * {{/each}}
     *
     * @param collection
     * @param options
     * @returns {[]}
     */
    static values(collection, options) {
        if (collection instanceof Map) {
            return Array.from(collection.values());
        }
        if (collection instanceof Object) {
            return Array.from(Object.values(collection));
        }
        return [];
    }

    /**
     * Scopes a value to the current context with the provided name as an alias.
     * Multiple pairs of (name values) are allowed however, the values are not scoped until after the alias block,
     * meaning you can't refer to a value defined in the same alias block by its property name.
     * Parameters must be in twos. an error will be thrown if an odd number of parameters are included.
     *
     * @example <caption>Simple</caption
     * let myValue = 'Hello';
     *
     * {{alias 'myPropertyName' myValue}}
     * {{@myPropertyName}} <!-- Resolves to 'Hello' -->
     *
     *  @example <caption>Multiple values</caption
     * let myValue = 'Hello';
     * let otherValue = 'World';
     *
     * {{alias 'propName' myValue 'otherPropName' otherValue}}
     * {{@propName}} <!-- Resolves to 'Hello' -->
     * {{@otherPropName}} <!-- Resolves to 'World' -->
     *
     *  @example <caption>Multiple values - error</caption
     * let myValue = 'Hello';
     *
     * {{alias 'propName' myValue 'otherPropName' @propName}}
     * {{@propName}} <!-- Resolves to 'Hello' -->
     * {{@otherPropName}} <!-- Will not resolve -->
     *
     *  @example <caption>Multiple values - error - fix</caption
     * let myValue = 'Hello';
     *
     * {{alias 'propName' myValue}}
     * {{alias 'otherPropName' @propName}}
     * {{@propName}} <!-- Resolves to 'Hello' -->
     * {{@otherPropName}} <!-- Resolves to 'Hello' -->
     */
    static alias(...rest) {
        let values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const data = options.data;
        if (values.length % 2 !== 0) {
            throw new Error('#alias requires an even number of parameters in the form of key1, object1, key2, object2 ');
        }

        for (let i = 0; i < values.length; i += 2) {
            data[values[i]] = values[i + 1];
        }
    }
}

Handlebars.registerHelper({
    dynEditor: DynHandlebars.dynEditor,
    at: DynHandlebars.at,
    path: DynHandlebars.path,
    count: DynHandlebars.count,
    increment: DynHandlebars.increment,
    decrement: DynHandlebars.decrement,
    isInteger: DynHandlebars.isInteger,
    greaterThan: DynHandlebars.greaterThan,
    lessThan: DynHandlebars.lessThan,
    equalTo: DynHandlebars.equalTo,
    defined: DynHandlebars.defined,
    not: DynHandlebars.not,
    and: DynHandlebars.and,
    xor: DynHandlebars.xor,
    or: DynHandlebars.or,
    join: DynHandlebars.join,
    call: DynHandlebars.call,
    callStatic: DynHandlebars.callStatic,
    includes: DynHandlebars.includes,
    onlyIncludes: DynHandlebars.onlyIncludes,
    keys: DynHandlebars.keys,
    values: DynHandlebars.values,
    alias: DynHandlebars.alias,
});
