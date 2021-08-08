import JSONPathBuilder from "./util/JSONPathBuilder.js";
import {DynError} from "./util/support.js";

class DynHandlebars {
    static dynEditor(options) {
        const root = options.data.root;
        const dyn = root.dyn;
        const hash = options.hash;

        const at = hash.at;
        if ( !at ) throw new DynError("You must define the name of an 'at' field.");

        const inputDyn = {root, handlebars:options.hash};

        const foundPath = dyn.controller.getModelValue(`${at}_path`,inputDyn);
        if ( !foundPath ) throw new DynError(`You must have a path getter for: ${at}_path`);

        const content = dyn.controller.getModelValue(at, inputDyn) || '';

        // exclude the first path component 'data.' because foundry is a dick.
        const target = JSONPathBuilder.from(foundPath).slice(1).toString();
        const newOptions = {...options, hash:{...hash, target, content}};

        return HandlebarsHelpers.editor(newOptions);
    }

    static dynLookup(object, dynamicPath, ...rest) {
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const pathParts = dynamicPath.split('$');
        const pathLength = pathParts.length;
        const valueLength = values.length;
        if(pathLength != valueLength + 1){
            throw new DynError('Incorrect number of parameters passed to replace on the lookup');
        }
        let path =pathParts[0];
        let valueIdx = 0;
        let pathIdx = 1;
        while(pathIdx < pathLength){
            path = `${path}${values[valueIdx++]}${pathParts[pathIdx++]}`;
        }
        const pathBuilder = JSONPathBuilder.from(path);
        try {
            return pathBuilder.traverse(object);
        } catch(err){
            // we don't actually want to throw an exception here, as we want to follow the handlebars spec of just returning null.
            return null;
        }
    }
    static count(object) {
        return Array.isArray(object) ? object.length : Object.entries(object).length;
    }
    static greaterThan(value1, value2){
        return (value1 || 0) > (value2 || 0);
    }
    static lessThan(value1, value2){
        return (value1 || 0) < (value2 || 0);
    }
    static equalTo(value1, value2){
        return value1 == value2;
    }
    static and(...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for(const val of values){
            if(!val){
                return false;
            }
        }
        return true;
    }
    static or(...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for(const val of values){
            if(!!val){
               return true;
            }
        }
        return false;
    }
    static xor(value1, ...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        let oneTrue = !!value1;
        for(const val of values){
            if(!!val){
                if(oneTrue){
                    return false;
                }
                oneTrue = true;
            }
        }
        return oneTrue;
    }
    static defined(...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for(const val of values){
            if(val == null){
                return false;
            }
        }
        return true;
    }
    static not(...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        for(const val of values){
            if(!!val){
                return false;
            }
        }
        return true;
    }
    static increment(value, ...rest){

        return parseInt(value) + (rest.length > 1 ? Number.parseInt(rest[0]) : 1);
    }
    static decrement(value, ...rest){

        return parseInt(value) - (rest.length > 1 ? Number.parseInt(rest[0]) : 1);
    }
    static isInteger(value){
        return Number.isInteger(value)
    }
    static join(...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const joinValue = values.pop();
        return values.join(joinValue);
    }
    static call(fn, ...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        return fn(...values);
    }
    static includes(collection, ...rest){
        const values = Array.from(rest);
        const options = values.pop(); // makes values 1 shorter ( we want this )
        const arr = Array.from(collection);
        for(const val of values){
            if(!collection.includes(val)){
                return false;
            }
        }
        return true;
    }

    static keys(collection) {
        if(collection instanceof Map){
            return Array.from(collection.keys());
        }
        if(collection instanceof Object){
            return Array.from(Object.keys(collection));
        }
    }
    static values(collection) {
        if(collection instanceof Map){
            return Array.from(collection.values());
        }
        if(collection instanceof Object){
            return Array.from(Object.values(collection));
        }
    }
}

Handlebars.registerHelper({
    dynEditor: DynHandlebars.dynEditor,
    dynLookup: DynHandlebars.dynLookup,
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
    includes: DynHandlebars.includes,
    keys: DynHandlebars.keys,
    values: DynHandlebars.values,
});
