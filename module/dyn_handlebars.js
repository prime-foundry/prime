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

        const content = dyn.controller.getModelValue(at, inputDyn);
        if ( !content ) throw new DynError(`You must have a content getter for: ${at}`);

        const actualTarget = JSONPathBuilder.from(foundPath).toString();
        const target = actualTarget.slice(5); // exclude the first five characters .data because foundry is a dick.
        const newOptions = {...options, hash:{...hash, target, content}};

        return HandlebarsHelpers.editor(newOptions);
    }
}

Handlebars.registerHelper({
    dynEditor: DynHandlebars.dynEditor
});
