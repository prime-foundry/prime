import {isString} from "./support.js";

function buildPathComponents(pathComponents){
    const addedComponents = pathComponents.flatMap(pathComponent => {
        if(pathComponent instanceof JSONPathBuilder){
            return pathComponent.pathComponents;
        } else if(Array.isArray(pathComponent)){
            return buildPathComponents(pathComponent);
        } else if(isString(pathComponent)){
            return pathComponent.split('.');
        } else if(pathComponent != null){
            return [pathComponent];
        } else {
            console.warn('Null Path component found');
            return [];
        }
    });
    return addedComponents;
}

export default class JSONPathBuilder {
    pathComponents;
    constructor(...pathComponents) {
        this.pathComponents =  buildPathComponents(pathComponents);
    }

    static from(...pathComponents){
        if(pathComponents.length === 1 && pathComponents[0] instanceof JSONPathBuilder){
            return pathComponents[0]; // these are effectively immutable, so might as well just return the original.
        }
        return new JSONPathBuilder(...pathComponents)
    }

    with(...pathComponents){
        const addedComponents = buildPathComponents(pathComponents);
        return JSONPathBuilder.from(...this.pathComponents, ...addedComponents);
    }

    toString(){
        return this.pathComponents.join('.');
    }

    toArray(){
        return Array.from(this.pathComponents); // its basically a clone.
    }

    slice(...args){
        return JSONPathBuilder.from(...(this.pathComponents.slice(...args)));
    }

    find(...args){
        this.pathComponents.find(...args);
    }

    * [Symbol.iterator] (){
        yield * this.pathComponents;
    }

    get length(){
        return this.pathComponents.length;
    }
}