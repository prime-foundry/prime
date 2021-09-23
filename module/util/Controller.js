/**
 * Rather than generating a flat object, we split the '-' to represent different levels in the object. creating a richer object.
 * @param elem
 * @returns {{}}
 */
import {datasetToObject, sanitizeView} from "./support.js";
import {attachEditor} from "./DynEditor.js";
import JSONPathBuilder from "./JSONPathBuilder.js";

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

const primeHandlebarsPartialsAsTemplates = {};

function partialAsTemplate(partialName) {
    let template = primeHandlebarsPartialsAsTemplates[partialName];
    if (template == null) {
        template = Handlebars.compile(`{{> ${partialName} }}`);
        primeHandlebarsPartialsAsTemplates[partialName] = template;
    }
    return template;
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
        const theView = sanitizeView(view);
        this._support.control(theView);
    }


    getModelValue(at, inputDyn) {
        return this._support.getModelValue(at, inputDyn);
    }



    /**
     * Needs work...
     * @param partialName
     * @param domElementToReplace
     * @param context
     */
    rerenderPartial(partialName, view, domElementToReplace, context= {}) {
        const handlebarsTemplate = partialAsTemplate(partialName);
        const rendered = handlebarsTemplate(context).trim();
        const htmlTemplate = document.createElement('template'); // template was designed for this purpose.
        htmlTemplate.innerHTML = rendered;
        const newElement = htmlTemplate.content.firstChild;
        domElementToReplace.replaceWith(newElement);
        this._support.control(newElement, view);
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

    inputDyn(element, html = {}) {
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
        inputDyn.html = {element, ...html};
        return inputDyn;
    }


    /**
     * Element is the parent element, where you want to attach all the control logic.
     * View is the parent view provided in the event, typically this would be the application sheet,
     * If view is not provided it defaults to the element.
     *
     * @param element
     * @param view
     */
    control(element, view = null) {
        if(view == null){
            view = element;
        }
        try {
            this.fixIds(element);
            this.hideShowElements(element);
            this.disableEnableElements(element);
            this.preselectValues(element);

            const onClick = this.clickListener(this, view);
            const onChange = this.changeListener(this, view);

            this.attachListener(element, 'click', "*", onClick);
            this.attachListener(element, 'dblclick', "*", onClick);
            this.attachListener(element, 'change', "input", onChange);
            this.attachListener(element, 'change', "textarea", onChange);
            this.attachListener(element, 'oninput', "textarea", onChange);
            this.attachListener(element, 'change', "select", onChange);
        } catch (err) {
            console.error('unable to bind view', err);
        }
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
    attachListener(view, eventType, cssElement, listener) {
        const attribute = `${this.dataKey}-${eventType}-at`;
        const selector = `:scope ${cssElement}[${attribute}]`;
        const elements = view.querySelectorAll(selector);
        const controller = this.controller;
        elements.forEach(element => {
            element.addEventListener(eventType, listener.bind(controller));
        }, this);
    }


    changeListener(controller, view) {
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            const element = event.currentTarget;
            const inputDynCommon = this.inputDyn(element, {event, view});
            const inputDyn = {...inputDynCommon, ...(inputDynCommon[event.type] || {})};
            return controller.onChangeInput(inputDyn);
        };
    }

    clickListener(controller, view) {
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            const element = event.currentTarget;
            const inputDynCommon = this.inputDyn(element, {event, view});
            /* allows for common and overridden properties
             * order of priority
             * 1. the clicked elements event prime object i.e. data-prime-click-at (specific values)
             * 2. the clicked elements prime object, base (common values)
             *
             * or given element <a data-prime-at="something" data-prime-click-at="else"></a>
             * the result for data-prime-at would be 'else',
             */
            const inputDyn = {...inputDynCommon, ...(inputDynCommon[event.type] || {})};

            return controller.onChangeValue(inputDyn.value, inputDyn);
        };
    }

    getModelValue(at, inputDyn) {

        const paths = Array.isArray(at) ? at : at.split(','); // 2 ways to create arrays in html
        const result = paths.reduce((accumulator, path) => {
            const jsonPath = JSONPathBuilder.from(path);
            if (jsonPath.isFunction()) {
                // its all about scope
                const {object, property} = jsonPath.collectingTraverse(this.models);
                return accumulator || object[property](inputDyn);
            } else {
                const value = jsonPath.traverse(this.models);
                return accumulator || value;
            }
        }, null);
        return result;
    }

    /**
     *
     * #MARKED_SAFE_FROM_JQUERY
     * @param view
     */
    hideShowElements(view) {
        const elements = view.querySelectorAll(`:scope *[${this.dataKey}-hide], *[${this.dataKey}-show]`);
        elements.forEach(element => {
            const inputDyn = this.inputDyn(element, {view});
            const hide = inputDyn.hide;
            const show = inputDyn.show;
            let hidden = false;
            if (hide != null) {
                if (hide === true || hide === 'true') {
                    hidden = element.hidden = true;
                } else if (hide === false || hide === 'false') {
                    hidden = element.hidden = false;
                } else {
                    hidden = element.hidden = !!this.getModelValue(hide, inputDyn);
                }
            }
            if (show != null) {
                if (show === true || show === 'true') {
                    element.hidden = false;
                } else if (show === false || show === 'false') {
                    element.hidden = true;
                } else {
                    hidden = element.hidden = !this.getModelValue(show, inputDyn);
                }
            }
            if (hidden && inputDyn.forcehide) {
                // show can override this, so we need to do it after.
                // we need to force this too.
                element.style.display = 'none'
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
            const inputDyn = this.inputDyn(element, {view});
            const disable = inputDyn.disable;
            const enable = inputDyn.enable;
            if (disable != null) {
                if (disable === true) {
                    element.disabled = true;
                } else {
                    element.disabled = !!this.getModelValue(disable, inputDyn);
                }
            }
            if (enable != null) {
                if (enable === true) {
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
            const inputDyn = this.inputDyn(element, {view});
            const path = inputDyn.select;
            if (path.startsWith("'") && path.endsWith("'")) {
                element.value = path.slice(1, -1);
            } else {
                const val = this.getModelValue(path, inputDyn);
                element.value = val;
            }
        });
        const counters = view.querySelectorAll(`:scope input[type=checkbox][${this.dataKey}-type='counter']`);
        counters.forEach(element => {
            const inputDyn = this.inputDyn(element, {view});
            const checked = inputDyn.current === inputDyn.value
            element.checked = checked;
        });
        const checkboxes = view.querySelectorAll(`:scope input[type=checkbox][${this.dataKey}-select]`);
        checkboxes.forEach(element => {
            const inputDyn = this.inputDyn(element, {view});
            const select = inputDyn.select;
            if (select === true) {
                element.checked = true;
            } else {
                element.checked = !!this.getModelValue(select, inputDyn);
            }
        });
    }


    async onChangeInput(inputDyn) {
        const {element} = inputDyn.html;
        if (element.tagName === 'SELECT') {
            return this.onChangeSelect(inputDyn);
        } else if (element.tagName === 'INPUT') {
            const type = (inputDyn.type || '').toLowerCase();
            if (element.type === 'checkbox') {
                const type = (inputDyn.type || '').toLowerCase();
                if (type === "counter") {
                    return this.onChangeCounter(element.checked, inputDyn);
                } else if (inputDyn.value == null && (element.value == null || element.value === "on" || element.value === "off")) {
                    return this.onChangeCheckbox(element.checked, inputDyn);
                }
            }
            return this.onChangeValue(element.value, inputDyn);
        } else if (element.tagName === 'TEXTAREA') {
            return this._update(inputDyn, {value: element.value});
        }
    }

    async onChangeSelect(inputDyn) {
        const {element} = inputDyn.html;
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
        return this._update(inputDyn, {activate: !!checked}, 'activate');
    }

    async onChangeCounter(checked, inputDyn) {
        let value;
        if (!checked && inputDyn.current === inputDyn.value) {
            value = (Number.parseInt(inputDyn.value) || 0) - 1;
        } else {
            value = Number.parseInt(inputDyn.value);
        }
        return this._update(inputDyn, {value, activate: !!checked});
    }


    async _update(inputDyn, args = {}, setParameter = 'value') {
        const at = inputDyn.at;
        const paths = Array.isArray(at) ? at : at.split(','); // 2 ways to create arrays in html
        paths.forEach(path => {
            const jsonPath = JSONPathBuilder.from(path);
            const {object, property} = jsonPath.collectingTraverse(this.models);
            if (jsonPath.isFunction()) {
                object[property]({...inputDyn, ...args});
            } else {
                object[property] = args[setParameter];
            }
        });
        if (!(inputDyn.commit && inputDyn.commit.off)) {
            const options = inputDyn.render && inputDyn.render.off ? {} : {render: true};
            return this._commit(options);
        }
        return true;
    }


    async _commit(options) {
        // default is to not render;
        Object.values(this.models).forEach((model) => {
            // sheets don't have data managers (for now)
            if (model && model.dyn && model.dyn.dataManager) {
                model.dyn.dataManager.commit(options);
            }
        })
        return true;
    }
}