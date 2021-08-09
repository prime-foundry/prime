import {DynError, isString} from "./support.js";

const numbers = /^\d+$/;

function buildPathComponents(pathComponents, split = true){
    const addedComponents = pathComponents.flatMap(pathComponent => {
        if(pathComponent instanceof JSONPathBuilder){
            return pathComponent.pathComponents;
        } else if(Array.isArray(pathComponent)){
            return buildPathComponents(pathComponent, split);
        } else if(split && isString(pathComponent)){
            return pathComponent.trim().split('.');
        } else if(pathComponent != null){
            return [pathComponent];
        } else {
            console.warn('Null Path component found');
            return [];
        }
    });
    return addedComponents;
}


function collectingTraverseSupport(jsonPathBuilder, root, onNulls ) {
    const parts = [];
    let object = root;
    const decapitatedPathComponents = jsonPathBuilder.pathComponents.slice(0, -1);
    decapitatedPathComponents.forEach((pathComponent, idx) => {
        let property = pathComponent;
        let isArray = false;
        if (Array.isArray(object)) {
            if (isString(property) && numbers.test(property)) {
                property = Number.parseInt(property);
            }
            isArray = true;
        }
        if (object[property] == null) {
            onNulls(jsonPathBuilder, object, property, idx);
        }
        parts.push({object, property, isArray});
        object = object[property];
    });

    const property = jsonPathBuilder.fixedComponent();
    return {object, property, parts};
}

export default class JSONPathBuilder {
    pathComponents;
    constructor(...pathComponents) {
        this.pathComponents = buildPathComponents(pathComponents);
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

    withRaw(...pathComponents) {
        const addedComponents = buildPathComponents(pathComponents, false);
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

    traverse(root) {
        let object = root;
        let idx = 0;
        for(const property of this) {
            object = object[this.fixedComponent(property)];
            if(object == null) {
                throw new DynError(`Undefined path element '${property}' at index: '${idx}', whilst traversing path: '${this.toString()}'`);
            }
            idx++;
        };
        return object;
    }

    get last() {
        return this.pathComponents[this.length-1];
    }

    fixedComponent(pathComponent = this.last) {
        if(this.isArray(pathComponent)|| this.isFunction(pathComponent)){
            return pathComponent.slice(0,-2);
        }
        return pathComponent;
    }

    isArray(pathComponent = this.last){
        return isString(pathComponent) && pathComponent.endsWith('[]');
    }

    isFunction(pathComponent = this.last){
        return isString(pathComponent) && pathComponent.endsWith('()');
    }

    collectingTraverse(root) {
        function onNulls(jsonPathBuilder, object, property, idx) {
            throw new DynError(`Undefined path element '${property}' at index: '${idx}', whilst traversing path: '${jsonPathBuilder.toString()}'`);
        }
        return collectingTraverseSupport(this, root, onNulls);
    }

    collectingFixingTraverse(root) {
        function onNulls(jsonPathBuilder, object, property, idx) {
            object[property] = numbers.test(jsonPathBuilder.pathComponents[idx + 1]) ? [] : {};
        }
        const {object, property, parts} = collectingTraverseSupport(this, root, onNulls);
        const last = this.last;
        const isArray = this.isArray(last);
        const isFunction = this.isFunction(last);
        if (object[property] == null) {
            let missing;
            if (isArray) {
                missing = [];
            } else if (isFunction) {
                missing = () => {};
            } else {
                missing = {};
            }
            object[property] = missing;
        }
        return {object, property, parts, isArray, isFunction};
    }

}