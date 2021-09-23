import JSONPathBuilder from "./util/JSONPathBuilder.js";
import {DynError, isFunction, isString} from "./util/support.js";

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
     * traverse from either 'this' object or the provided 'from' object,
     * optionally using a 'path' with injected variables until you get the required value.
     * path='' - a path string with '?' placeholders.
     * from=this - the object to navigate from.
     * placeholder='?' - the placeholder you want to use to inject variables. (Turbo users only)
     * separator='.' - the path separator to determine how to navigate the object. (Turbo users only)
     *
     * @example <caption>Simple using default of this</caption>
     * let myObject = {levelOne: {something: 'hi', else: 'bye'}};
     * let level = 'levelOne';
     * let param = 'else;
     *
     * {{#with myObject}}
     * {{traverse level param}} <!-- prints 'bye' -->
     * {{/with}}
     *
     * @example <caption>From this, with path</caption>
     * let myObject = {levelOne: {something: 'hi', else: 'bye'}};
     * let param = 'something;
     *
     * {{#with myObject}}
     * {{traverse param path='levelOne.?' }} <!-- prints 'hi' -->
     * {{/with}}
     *
     * @example <caption>From object, without path</caption>
     * let myObject = {levelOne: {something: 'hi', else: 'bye'}};
     * let level = 'levelOne';
     * let param = 'else;
     *
     * {{traverse level param from=myObject}} <!-- prints 'bye' -->
     *
     * @example <caption>From object, with path</caption>
     * let myObject = {levelOne: {something: 'hi', else: 'bye'}};
     * let param = 'something;
     *
     * {{traverse param from=myObject path='levelOne.?' }} <!-- prints 'hi' -->
     *
     * @param rest
     * @returns {null|*}
     */
    static traverse(...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const hash = options.hash;
        const pathParameter = hash.path || '';
        const from = hash.from || this;
        const valueLength = values.length;
        let pathBuilder = JSONPathBuilder.from();
        let valueIdx = 0;

        if (pathParameter !== '') {
            const placeholder = hash.placeholder || '?';
            const separator = hash.separator || '.';

            const pathParts = pathParameter.split(separator);
            for (const pathPart of pathParts) {
                const placeHolderParts = pathPart.split(placeholder);
                let resolvedPart = placeHolderParts[0];
                for (let i = 1; i < placeHolderParts.length; i++) {

                    if (valueLength <= valueIdx) {
                        throw new DynError('Incorrect number of parameters passed to replace on the lookup');
                    }
                    resolvedPart = `${values[valueIdx++]}${placeHolderParts[i]}`
                }
                pathBuilder = pathBuilder.withRaw(resolvedPart);
            }
        }
        pathBuilder = pathBuilder.withRaw(values.slice(valueIdx));
        try {
            return pathBuilder.traverse(from);
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

    static equal(value1, value2) {
        return value1 == value2;
    }

    static and(...rest) {
        const values = Array.from(rest).slice(0, -1);
        for (const val of values) {
            if (!val) {
                return false;
            }
        }
        return true;
    }

    static or(...rest) {
        const values = Array.from(rest).slice(0, -1);
        for (const val of values) {
            if (!!val) {
                return true;
            }
        }
        return false;
    }

    static xor(value1, ...rest) {
        const values = Array.from(rest).slice(0, -1);
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
        const values = Array.from(rest).slice(0, -1);
        for (const val of values) {
            if (val == null) {
                return false;
            }
        }
        return true;
    }

    static not(...rest) {
        const values = Array.from(rest).slice(0, -1);
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
     * @param {number} rest
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
     * @param {number} rest
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
     * Calls Array.prototype.join() on the provided parameters. .
     * There are 2 parameters
     * separator=',' - the string to separate the contents, it will default to the native js of ',' if not provided.
     * depth=1 - how far do we expand into the arrays, this is the equivalent of Array.prototype.flat(depth),
     *    with the first level being the array of parameters
     * @example <caption>Simple</caption>
     *
     * {{join 'hello' 'darkness' 'my' 'old' 'friend' separator='-'}} <!-- prints 'hello-darkness-my-old-friend' -->
     *
     * @param rest
     * @returns {string}
     */
    static join(...rest) {
        let values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const hash = options.hash;
        const separator = hash.separator || undefined;
        const depth = hash.depth || 1;
        return values.flat(depth).join(separator);
    }

    /**
     * Given a function, and a list of parameters call that function.
     * There is 1 parameter
     * self=this - the this argument to use, this will typically by the object handlebars is navigating.
     *
     * @example <caption>Simple</caption>
     * let myFunction = (a) => this.total + a;
     * let myObj = {total:5};
     *
     * {{call myFunction 6 self=myObj}} <!-- prints 11 -->
     *
     * @param fn the function to use
     * @param rest the parameters.
     * @returns {*} the result of the function
     */
    static call(fn, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const self = options.self || this;
        if (isString(fn)) {
            fn = self[fn];
        }
        return fn.call(self, ...values);
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
        const values = Array.from(rest).slice(0, -1);
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
        const values = Array.from(rest).slice(0, -1);
        for (const val of collection) {
            if (!values.includes(val)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Given a collection (Map, Object or Array.<string>) and a set of key strings (parameter list of strings or Array.<string>)
     * Return a new (Map, Object or Array.<string>) which only has the elements that exist in the set of keys.
     * Original order of the collection is maintained.
     *
     * 2nd Parameter onward can be a mix of strings or string Arrays
     *
     * @example <caption>Simple Object</caption>
     * let myCollection = {hello: 2, world:3, there:4};
     * let myKeys = ['hello', 'world'];
     *
     * (retain myCollection myKeys) == {hello: 2, world:3}
     *
     * @example <caption>Simple Array</caption>
     * let myCollection = ['hello', 'there', 'world', 'hello'];
     * let myKeys = ['hello', 'world'];
     *
     * (retain myCollection myKeys) == ['hello', 'world', 'hello']
     *
     * @param {{}|string[]|Map<string, any>} collection
     * @param {string[] | string} rest
     * @returns {{}|string[]|Map<string, any>}
     */
    static retain(collection, ...rest) {
        let keys = Array.from(rest).slice(0, -1);
        keys = new Set(keys.flat());
        if (collection instanceof Map) {
            const result = new Map();
            collection.forEach((value, key) => {
                if (keys.has(key)) {
                    result.set(key, value);
                }
            });
            return result;
        }
        if (Array.isArray(collection)) {
            const result = [];
            collection.forEach((key) => {
                if (keys.has(key)) {
                    result.push(key);
                }
            });
            return result;
        }
        if (collection instanceof Object) {
            const result = {};
            Array.from(Object.entries(collection)).forEach(([key, value]) => {
                if (keys.has(key)) {
                    result[key] = value;
                }
            });
            return result;
        }
        throw new DynError('Unable to do a retain on the provided collection');
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
     * @returns {[]}
     */
    static keys(collection) {
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
     * {{aliasAs 'myPropertyName' myValue}}
     * {{@myPropertyName}} <!-- Resolves to 'Hello' -->
     *
     *  @example <caption>Multiple values</caption
     * let myValue = 'Hello';
     * let otherValue = 'World';
     *
     * {{aliasAs 'propName' myValue 'otherPropName' otherValue}}
     * {{@propName}} <!-- Resolves to 'Hello' -->
     * {{@otherPropName}} <!-- Resolves to 'World' -->
     *
     *  @example <caption>Multiple values - error</caption
     * let myValue = 'Hello';
     *
     * {{aliasAs 'propName' myValue 'otherPropName' @propName}}
     * {{@propName}} <!-- Resolves to 'Hello' -->
     * {{@otherPropName}} <!-- Will not resolve -->
     *
     *  @example <caption>Multiple values - error - fix</caption
     * let myValue = 'Hello';
     *
     * {{aliasAs 'propName' myValue}}
     * {{aliasAs 'otherPropName' @propName}}
     * {{@propName}} <!-- Resolves to 'Hello' -->
     * {{@otherPropName}} <!-- Resolves to 'Hello' -->
     */
    static aliasAs(...rest) {
        let values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const data = options.data;
        if (values.length % 2 !== 0) {
            throw new Error('#aliasAs requires an even number of parameters in the form of key1, object1, key2, object2 ');
        }

        for (let i = 0; i < values.length; i += 2) {
            data[values[i]] = values[i + 1];
        }
    }
    static either(...args) {
        let values = Array.from(args);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for (let value of values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    static attr(name, ...rest){
        let values = Array.from(rest);
        const options = values.pop();

        const hash = options.hash;
        const ifValue = hash.if;
        const should = ifValue == null ? false : !!ifValue;
        if(should) {
            if(values.length === 0){
                return ` ${name} `
            }
            else {
                return ` ${name}="${values[0]}" `
            }
        }
        return '';
    }

    static cssClassIf(...rest){
        let values = Array.from(rest);
        const options = values.pop();

        const hash = options.hash;
        const ifValue = hash.if;
        const should = ifValue == null ? false : !!ifValue;
        if(should) {
            return ` ${values.join(' ')} `;
        }
        return '';
    }

    static reverse(arr, options){
        return arr.reverse();
    }

}

Handlebars.registerHelper({
    dynEditor: DynHandlebars.dynEditor,
    traverse: DynHandlebars.traverse,
    count: DynHandlebars.count,
    increment: DynHandlebars.increment,
    decrement: DynHandlebars.decrement,
    isInteger: DynHandlebars.isInteger,
    greaterThan: DynHandlebars.greaterThan,
    lessThan: DynHandlebars.lessThan,
    equal: DynHandlebars.equal,
    defined: DynHandlebars.defined,
    not: DynHandlebars.not,
    and: DynHandlebars.and,
    or: DynHandlebars.or,
    xor: DynHandlebars.xor,
    join: DynHandlebars.join,
    call: DynHandlebars.call,
    includes: DynHandlebars.includes,
    onlyIncludes: DynHandlebars.onlyIncludes,
    retain: DynHandlebars.retain,
    keys: DynHandlebars.keys,
    values: DynHandlebars.values,
    aliasAs: DynHandlebars.aliasAs,
    either: DynHandlebars.either,
    attr: DynHandlebars.attr,
    cssClassIf: DynHandlebars.cssClassIf,
    reverse: DynHandlebars.reverse
});
