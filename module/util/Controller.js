/**
 * Rather than generating a flat object, we split the '-' to represent different levels in the object. creating a richer object.
 * @param elem
 * @returns {{}}
 */
import {traversePath, datasetToObject, sanitizeView} from "./support.js";

let UID = 0;

/**
 * @returns {number} - a uniqueID
 */
function nextUid() {
    return UID += 1;
}

function random32BitInt() {
    return (Math.random() * 4294967296) >>> 0;
}

export default class Controller {
    models;
    dynKey;
    uid;

    /**
     *
     * @param {*} model
     * @param {string} (dynKey='')
     */
    constructor(models, dynKey = 'dyn') {
        this.models = models;
        this.dynKey = dynKey;
        this.uid = nextUid();
    }

    get _support() {
        if (this.__support == null) {
            this.__support = new ControllerSupport(this);
        }
        return this.__support;
    }

    control(view) {
        try {
            const theView = sanitizeView(view);
            this._support.fixIds(theView);
            this._support.hideShowElements(theView);
            this._support.disableEnableElements(theView);
            this._support.preselectValues(theView);
            // we take advantage of lambdas, to sidestep problems with 'this' changing.
            const onClick = this._support.clickListener(this);
            const onChange = this._support.changeListener(this);

            Object.values(this.models).forEach((model) => {
                this._support.attachListener(theView, model, 'click', "*", onClick);
                this._support.attachListener(theView, model, 'dblclick', "*", onClick);
                this._support.attachListener(theView, model, 'change', "input", onChange);
                this._support.attachListener(theView, model, 'change', "select", onChange);
                //TODO: textarea
            });
        } catch (err) {
            console.error('unable to bind view', err);
        }
    }
}

class ControllerSupport {
    controller;
    dataKey;

    /**
     *
     * @param {*} model
     * @param {string} (dynKey='')
     */
    constructor(controller) {
        this.controller = controller;
        this.dataKey = `data-${this.controller.dynKey}`;
    }

    get models() {
        return this.controller.models;
    }

    get dynKey() {
        return this.controller.dynKey;
    }

    get uid() {
        return this.controller.uid;
    }

    /**
     * #MARKED_SAFE_FROM_JQUERY
     *
     * ids are meant to be unique, however since we are working with repeated document fragments often they are not,
     * which plays havoc with labels. So if we have a repeated id, and the input is not the first in the document,
     * and we have at least one label pointing at it,  we extend the id fields to make them unique.
     *
     * We also add a unique id the view to match it to the controller, for debugging purposes and quick css selection.
     *
     * @param view
     */
    fixIds(view) {
        // Set a unique id as a data attribute.
        view.setAttribute(`${this.dataKey}-controller-uid`, this.uid);

        // fix non unique ids.
        const inputsOnView = view.querySelectorAll(':scope input');
        inputsOnView.forEach((input) => {
            const oldId = input.id;
            if (oldId) {
                const documentElement = document.getElementById(oldId);
                if (documentElement && documentElement !== input) {
                    const labelsForInputOnView = view.querySelectorAll(`:scope label[for="${oldId}"]`);
                    if (labelsForInputOnView.length > 0) {
                        const newId = `${oldId}-${this.dynKey}-${this.uid}-${random32BitInt()}`;
                        console.warn(`Multiple elements with id: ${oldId} detected, changing id for input to ${newId} and repointing related labels.`)
                        labelsForInputOnView.forEach((label) => label.htmlFor = newId);
                        input.id = newId;
                    }
                }
            }
        });
    }

    /**
     * #MARKED_SAFE_FROM_JQUERY
     * @param view
     * @param model
     * @param modelKey
     * @param eventType
     * @param cssElement
     * @param listener
     */
    attachListener(view, model, eventType, cssElement, listener) {
        const attribute = `${this.dataKey}-${eventType}-at`;
        const selector = `:scope ${cssElement}[${attribute}]`;
        const elements = view.querySelectorAll(selector);
        elements.forEach(element => {
            const path = element.getAttribute(attribute)
            const {previous, lastName} = traversePath(path, this.models);
            // this is typically the owning parent, not the function itself.
            element.addEventListener(eventType, listener.bind({controller: this, model, component: previous, at: lastName}), {capture: true});
        }, this);
    }


    async changeListener(controller) {
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            const element = event.delegateTarget || event.target;
            const inputDyn = this.inputDyn(element);
            return controller.onChangeInput(element, inputDyn);
        };
    }

    async clickListener(controller) {
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            const clickedElement = event.delegateTarget || event.target;
            const targetElement = event.currentTarget;
            const inputDynClicked = this.inputDyn(clickedElement);
            const inputDynTarget = this.inputDyn(targetElement);
            /* allows for common and overridden properties
             * order of priority
             * 1. the clicked elements event prime object i.e. data-prime-click-at (specific values)
             * 2. the parent element we attached the event too's, event prime object i.e. data-prime-click-at (specific values)
             * 3. the clicked elements prime object, base (common values)
             * 4. the parent element we attached the event too's, prime object, base i.e. (common values)
             *
             * or given element <a data-prime-at="something" data-prime-click-at="else"><i data-prime-at="entirely"></i></a>
             * the result for data-prime-at would be 'else',
             * if the user clicked the 'a' element and somehow didn't hit the 'i' the result would still be 'else'
             */
            const inputDynCommon = {...inputDynTarget, ...inputDynClicked};
            const inputDyn = {...inputDynCommon, ...(inputDynCommon[event.type] || {})};
            const isFunction = inputDyn.at.endsWith('()');
            if (isFunction) {
                return controller._updateWithFunction(inputDyn, {eventType: event.type});
            } else {
                return controller._onChangeValue(inputDyn.value, inputDyn);
            }
        };
    }

    inputDyn(element) {
        const inputDyn = datasetToObject(element, this.dynKey);
        const newIndex = Number.parseInt(inputDyn.index);
        if (!Number.isNaN(newIndex)) {
            inputDyn.index = newIndex;
        }
        if (inputDyn.type === 'number' || inputDyn.type === 'counter') {
            const newValue = Number.parseInt(inputDyn.value);
            if (!Number.isNaN(newValue)) {
                inputDyn.value = newValue;
            }
        }
        if (inputDyn.type === 'counter') {
            const newCurrent = Number.parseInt(inputDyn.current);
            if (!Number.isNaN(newCurrent)) {
                inputDyn.current = newCurrent;
            }
        }
        return inputDyn;
    }

    getModelValue(path, inputDyn) {
        const {previous: obj, lastName: key, isFunction} = traversePath(path, this.models);
        if (isFunction) {
            return obj[key](inputDyn);
        } else {
            return obj[key];
        }
    }

    /**
     *
     * #MARKED_SAFE_FROM_JQUERY
     * @param view
     */
    hideShowElements(view) {
        const elements = view.querySelectorAll(`:scope *[${this.dataKey}-hide], *[${this.dataKey}-show]`);
        elements.forEach(element => {
            const inputDyn = this.inputDyn(element);
            const hide = inputDyn.hide;
            const show = inputDyn.show;
            if (hide != null) {
                if (hide === 'true') {
                    element.hidden = true;
                } else if (hide === 'false') {
                    element.hidden = false;
                } else {
                    element.hidden = !!this.getModelValue(hide, inputDyn);
                }
            }
            if (show != null) {
                if (show === 'false') {
                    element.hidden = true;
                } else if (show === 'true') {
                    element.hidden = false;
                } else {
                    element.hidden = !this.getModelValue(show, inputDyn);
                }
            }
        }, this);
    }

    /**
     *
     * #MARKED_SAFE_FROM_JQUERY
     * @param view
     */
    disableEnableElements(view) {
        const elements = view.querySelectorAll(`:scope *[${this.dataKey}-disable], *[${this.dataKey}-enable]`);
        elements.forEach(element => {
            const inputDyn = this.inputDyn(element);
            const disable = inputDyn.disable;
            const enable = inputDyn.enable;
            if (disable != null) {
                if (disable === 'true') {
                    element.disabled = true;
                } else if (disable === 'false') {
                    element.disabled = false;
                } else {
                    element.disabled = !!this.getModelValue(disable, inputDyn);
                }
            }
            if (enable != null) {
                if (enable === 'false') {
                    element.disabled = true;
                } else if (enable === 'true') {
                    element.disabled = false;
                } else {
                    element.disabled = !this.getModelValue(enable, inputDyn);
                }
            }
        }, this);
    }

    /**
     *
     * #MARKED_SAFE_FROM_JQUERY
     * @param view
     */
    preselectValues(view) {
        const selects = view.querySelectorAll(`:scope select[${this.dataKey}-select]`);
        selects.forEach(element => {
            const inputDyn = this.inputDyn(element);
            const path = inputDyn.select;
            if (path.startsWith("'") && path.endsWith("'")) {
                element.value = path.slice(1, -1);
            } else {
                element.value = this.getModelValue(path, inputDyn);
            }
        });
        const counters = view.querySelectorAll(`:scope input[type=checkbox][${this.dataKey}-type='counter']`);
        counters.forEach(element => {
            const inputDyn = this.inputDyn(element);
            const checked = inputDyn.current === inputDyn.value
            element.checked = checked;
        });
        const checkboxes = view.querySelectorAll(`:scope input[type=checkbox][${this.dataKey}-select]`);
        checkboxes.forEach(element => {
            const inputDyn = this.inputDyn(element);
            const select = inputDyn.select;
            if (select === 'false') {
                element.checked = false;
            } else if (select === 'true') {
                element.checked = true;
            } else {
                element.checked = !!this.getModelValue(select, inputDyn);
            }
        });
    }

    async commit(model) {
        Object.values(this.models).forEach((model) => {
            return model.dyn.dataManager.commit();
        })
    }


    async onChangeInput(element, inputDyn) {
        if (element.tagName === 'SELECT') {
            await this.onChangeSelect(element, inputDyn);
        } else if (element.tagName === 'INPUT') {
            switch (element.type) {
                case 'checkbox':
                    await this.onChangeCheckbox(element.checked, inputDyn);
                    break;
                default:
                    await this.onChangeValue(element.value, inputDyn);
                    break;
            }
        }
    }

    async onChangeSelect(element, inputDyn) {
        const selected = element.value;
        return this._update(inputDyn, {selected}, 'selected');
    }

    async onChangeValue(value, inputDyn) {
        const type = (inputDyn.type || '').toLowerCase();
        if (type === 'number') {
            return this.onChangeNumber(value, inputDyn);
        } else if (type === 'boolean') {
            return this.onChangeBoolean(value, inputDyn);
        } else {
           return this._update(inputDyn, {value});
        }
    }

    async onChangeNumber(number, inputDyn) {
        const value = Number.parseInt(number) || 0;
        return this._update(inputDyn, {value});
    }

    async onChangeBoolean(boolean, inputDyn) {
        const value = (boolean || '').toLowerCase() === 'true';
        return this._update(inputDyn, {value});
    }

    async onChangeCheckbox(checked, inputDyn) {
        const type = (inputDyn.type || '').toLowerCase();
        if (type === 'counter') {
            let value;
            if (!checked && inputDyn.current === inputDyn.value) {
                value = (Number.parseInt(inputDyn.value) || 0) - 1;
            } else {
                value = Number.parseInt(inputDyn.value);
            }
            return this._update(inputDyn, {value, activate: !!checked});

        }
        return this._update(inputDyn, {activate: !!checked}, 'activate');
    }


    async _update(inputDyn, args = {}, setParameter = 'value') {
        const path = inputDyn.at;
        const {previous, lastName, isFunction} = traversePath(path, this.models);
        if (isFunction) {
            previous[lastName]({...inputDyn, ...args});
        } else {
            previous[lastName] = args[setParameter];
        }
        return this.commit();
    }
}