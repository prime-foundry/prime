/**
 * Rather than generating a flat object, we split the '-' to represent different levels in the object. creating a richer object.
 * @param elem
 * @returns {{}}
 */
function datasetToObject(elem) {
    const data = {};
    if (elem && elem.attributes) {
        const isDataRegex = /^data-/;
        Array.from(elem.attributes)
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
                node[paths[lastIdx]] = attr.value;
            });
    }
    return data;
}

async function changeListener(controller, modelKey) {
    return (event) => {
        event.preventDefault();
        event.stopPropagation();
        const element = event.delegateTarget || event.target;
        return controller.onChangeInput(modelKey, element);
    };
}

async function clickListener(controller, modelKey) {
    return (event) => {
        event.preventDefault();
        event.stopPropagation();
        const clickedElement = event.delegateTarget || event.target;
        const targetElement = event.currentTarget;
        const inputDynClicked = (datasetToObject(clickedElement).dyn || {})[key] || {};
        const inputDynTarget = (datasetToObject(targetElement).dyn || {})[key] || {};
        /* allows for common and overridden properties
         * order of priority
         * 1. the clicked elements prime object i.e. data-prime-at
         * 2. the event prime object on the element we attached the event too i.e. data-prime-click-at
         * 2. the  prime object on the element we attached the event too i.e. data-prime-at
         *
         * or given element <a data-prime-at="something" data-prime-click-at="else"><i data-prime-at="entirely"></i></a>
         * the result for data-prime-at would be 'entirely',
         * if the user clicked the 'a' element and somehow didn't hit the 'i' the result would be 'else'
         */
        const inputDyn = {...inputDynTarget, ...inputDynTarget[event.type], ...inputDynClicked};
        return controller.onLinkClick(modelKey, event.type, inputDyn);
    };
}

//TODO take the version from support.js
function traversePath(path, prime, func) {
    const parts = path.split('.');
    const lastIdx = parts.length - 1;
    let current = prime; // this is the prime access, can be the current user or the actor.
    for (let idx = 0; idx < lastIdx; idx++) {
        current = current[parts[idx]];
    }
    return func(current, parts[lastIdx]);
}

function getModelValue(path, model, inputDyn) {
    return traversePath(path, model, (parent, key) => {
        if (key.endsWith('()')) {
            const newKey = key.slice(0, -2);
            return parent[newKey](inputDyn);
        } else {
            return parent[key];
        }
    });
}

/**
 * takes a list of values in the form of [model1, key1, model2, key2 ...]
 * and transforms it into a set of tuples with the keys and model positions flipped.
 * [[key1,model1],[key2,model2]...]
 * presumes the initialiser is an array,
 * @param {[]} tuples - the accumulating array,
 * @param modelOrKey - a model or key variable
 * @param idx - the current index.
 * @returns {*}
 */
function flippedTupleArrayFromListReducer(tuples, modelOrKey, idx) {
    if (idx % 2 === 0) {
        // first model in the second half of the array
        tuples[tuples.length] = ['', modelOrKey];
    } else {
        // second key in the first half of the array (it is made lowercase, because data attributes are always converted to lower case)
        tuples[tuples.length - 1][0] = modelOrKey.toLowerCase();
    }
    return tuples;
}

function dataDynKey(key){
    return key === '' ? 'data-dyn' : `data-dyn-${key}`;
}

export default class Controller {
    models;
    id;
    static UID = 0;
    /**
     *
     * @param {*} model
     * @param {string} (key='')
     * @param {...(*, string)} (otherModelKeys)
     */
    constructor(model, key, ...otherModelKeys) {
        let keyModels;
        if(arguments.length === 1){
            keyModels = [['',model]];
        } else {
            keyModels = [['',model],[key, model]];
            if(arguments.length > 2){
                keyModels = otherModelKeys.reduce(flippedTupleArrayFromListReducer, keyModels);
            }
        }
        this.models = new Map(keyModels);
        this.id = Controller.nextId();
    }

    /**
     * @returns {number} - a uniqueID
     */
    static nextId(){
        return Controller.UID += 1;
    }

    modelForKey(key){
        if(this.models.has(key)) {
            return this.models.get(key);
        } else {
            return this.models.get('');
        }
    }

    initializeView(view) {
        this._fixIds(view);
        this.models.forEach((model, key) => {

            const dynKey = dataDynKey(key);
            const onClick = clickListener(this, key);
            const onChange = changeListener(this, key);

            this._prehideElements(view, model, key);
            this._preselectValues(view, model, key);
            this._predisableElements(view, model, key);
            this._prehideElements(view, model, key);

            this._attachListener(view, model,`*[${dynKey}-click-at]`, 'click', onClick);
            this._attachListener(view, model,`*[${dynKey}-dblclick-at]`, 'dblclick', onClick);
            this._attachListener(view, model,`input[${dynKey}-at], input[${dynKey}-change-at]`, 'change', onChange);
            this._attachListener(view, model,`select[${dynKey}-at], select[${dynKey}-change-at]`, 'change', onChange);
        });
        //TODO: select,textarea
    }

    _prehideElements(view, model, key) {
        const dynKey = dataDynKey(key);
        html.find(`*[${dynKey}-hidden-on]`).each(function (index, element) {
            const inputDyn = datasetToObject(element).dyn || {};
            const hidden = inputDyn.hidden.on;

            if (inputDyn.index && !isNaN(inputDyn.index)) {
                inputDyn.index = Number.parseInt(inputDyn.index);
            }
            const val = getModelValue(hidden, model, inputDyn);
            element.hidden = !!val ? true : undefined;
        });
    }

    _predisableElements(view, model, key) {
        const dynKey = dataDynKey(key);
        html.find(`*[${dynKey}-disable-on]`).each(function (index, element) {
            const inputDyn = datasetToObject(element).dyn || {};
            const disable = inputDyn.disable.on;

            if (inputDyn.index && !isNaN(inputDyn.index)) {
                inputDyn.index = Number.parseInt(inputDyn.index);
            }
            const val = getModelValue(disable, model, inputDyn);
            element.disabled = !!val;
        });
    }

    _preselectValues(view, model, key) {

        const dynKey = dataDynKey(key);
        html.find(`select[${dynKey}-select-on]`).each(function (index, element) {
            const inputDyn = datasetToObject(element).dyn || {};
            const select = inputDyn.select.on;
            // converts strings to an integer.
            if (inputDyn.index && !isNaN(inputDyn.index)) {
                inputDyn.index = Number.parseInt(inputDyn.index);
            }
            const val = getModelValue(select, model, inputDyn);
            $(element).val(val || '');
        });
        html.find(`input[type=checkbox][${dynKey}-select-on]`).each(function (index, element) {
            const inputDyn = datasetToObject(element).dyn || {};
            const select = inputDyn.select.on;
            // converts strings to an integer.
            if (inputDyn.index && !isNaN(inputDyn.index)) {
                inputDyn.index = Number.parseInt(inputDyn.index);
            }
            const val = getModelValue(select, model, inputDyn);
            $(element).attr('checked', !!val);
        });
        html.find(`input[type=checkbox][${dynKey}-type='counter']`).each(function (index, element) {
            const inputDyn = datasetToObject(element).dyn || {};
            const checked = inputDyn.current === inputDyn.value
            $(element).attr('checked', !!checked);
        });
    }

    /**
     * Removes the jquery nonsense from our event listeners and just uses the js native ones instead.
     * These is nothing in the jquery elements we need.
     * @private
     */
    _attachListener(view, model, selector, type, listener) {
        const elements = view.find(selector).get();
        elements.forEach(element => {
            element.addEventListener(type, listener.bind(model), {capture: true});
        });
    }

    _fixIds(view) {
        const idPostpend = `-dynid-${this.id}`;
        view.find('input').each(function () {
            const oldId = this.id;
            if (oldId) {
                const newId = oldId + idPostpend;
                view.find(`label[for="${oldId}"]`).attr('for', newId);
                this.id = newId;
            }
        });
    }

    async commit(model) {
        return model.dyn.dataManager.commit();
    }

    async onLinkClick(modelKey, eventType, inputDyn) {
        const isFunction = inputDyn.at.endsWith('()');
        if (isFunction) {
            return this.__updateWithFunction(modelKey, inputDyn, {eventType});

        } else {
            return this._onChangeValue(modelKey, inputDyn.value, inputDyn);
        }
    }

    async onChangeInput(modelKey, element) {
        const data = datasetToObject(element);
        const isDynInput = !!data.dyn;
        if (isDynInput) {
            const inputDyn = {...data.prime, ...(data.prime.change || {})};
            const isFunction = inputDyn.at.endsWith('()');
            if (element.tagName === 'SELECT') {
                await this._onChangeSelect(modelKey,element, inputDyn, isFunction);
            } else if (element.tagName === 'INPUT') {
                switch (element.type) {
                    case 'checkbox':
                        await this._onChangeCheckbox(modelKey,element.checked, inputDyn, isFunction);
                        break;
                    default:
                        await this._onChangeValue(modelKey,element.value, inputDyn, isFunction);
                        break;
                }
            }
        }
        return isDynInput;
    }

    async _onChangeSelect(modelKey,element, inputDyn, isFunction) {
        const selected = $(element).val();
        if (isFunction) {
            return this.__updateWithFunction(modelKey,inputDyn, {selected});
        } else {
            return this.__updateWithSetValue(modelKey,selected, inputDyn);
        }
    }

    async _onChangeValue(modelKey,value, inputDyn, isFunction) {
        const type = (inputDyn.type || '').toLowerCase();
        if (type === 'number') {
            return this._onChangeNumber(modelKey,value, inputDyn, isFunction);
        } else if (type === 'boolean') {
            return this._onChangeBoolean(modelKey,value, inputDyn, isFunction);
        } else {
            return this.__updateWithSetValue(modelKey,value, inputDyn, isFunction);
        }
    }

    async _onChangeNumber(modelKey,value, inputDyn, isFunction) {
        return this.__updateWithSetValue(modelKey,Number.parseInt(value) || 0, inputDyn, isFunction);
    }

    async _onChangeBoolean(modelKey,value, inputDyn, isFunction) {
        return this.__updateWithSetValue(modelKey,(value || '').toLowerCase() === 'true', inputDyn, isFunction);
    }

    async _onChangeCheckbox(modelKey,checked, inputDyn, isFunction) {
        const type = (inputDyn.type || '').toLowerCase();
        if (type === 'counter') {
            let value;
            if (!checked && inputDyn.current === inputDyn.value) {
                value = (Number.parseInt(inputDyn.value) || 0) - 1;
            } else {
                value = Number.parseInt(inputDyn.value);
            }
            if (isFunction) {
                return this.__updateWithFunction(modelKey,inputDyn, {value, activate: !!checked});
            } else {
                return this.__updateWithSetValue(modelKey,value, inputDyn);
            }

        }
        if (isFunction) {
            return this.__updateWithFunction(modelKey,inputDyn, {activate: !!checked});
        } else {
            return this.__updateWithSetValue(modelKey,!!checked, inputDyn);
        }
    }

    /**
     *
     * @param inputDyn
     * @param rest
     * @returns {Promise<*>}
     * @private
     */
    async __updateWithFunction(modelKey,inputDyn, optArgs) {
        return this.__updateModel(modelKey,inputDyn,
            (parent, key) => {
                const newKey = key.slice(0, -2);
                parent[newKey](
                    {
                        ...inputDyn,
                        ...optArgs
                    }
                );
            }
        );
    }

    async __updateWithSetValue(modelKey,value, inputDyn, isFunction=false) {

        if (isFunction) {
            return this.__updateWithFunction(modelKey,inputDyn, {value});
        } else {
            return this.__updateModel(modelKey,inputDyn, (parent, key) => parent[key] = value);
        }
    }

    async __updateModel(modelKey,inputDyn, func) {
        const path = inputDyn.at;
        const model = this.modelForKey(modelKey);
        traversePath(path, model, func);
        return this.commit(model);
    }
}