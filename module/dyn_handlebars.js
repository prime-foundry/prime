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
    static objectPropertyCount(object) {
        return Object.entries(object).length;
    }
    static increment(value){
        return parseInt(value) + 1;
    }
}

Handlebars.registerHelper({
    dynEditor: DynHandlebars.dynEditor,
    dynLookup: DynHandlebars.dynLookup,
    objectPropertyCount: DynHandlebars.objectPropertyCount,
    increment: DynHandlebars.increment,
});
