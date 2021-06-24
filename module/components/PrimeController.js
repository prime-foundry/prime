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

async function changeListener(event) {
    event.preventDefault();
    event.stopPropagation();
    const data = this.getData();
    const prime = data.prime;
    const element = event.delegateTarget || event.target;
    return prime._controller.onChangeInput(element);
}

async function clickListener(event) {
    event.preventDefault();
    event.stopPropagation();
    const clickedElement = event.delegateTarget || event.target;
    const targetElement = event.currentTarget;
    const data = this.getData();
    const prime = data.prime;
    const inputPrimeDataClicked = datasetToObject(clickedElement).prime || {};
    const inputPrimeDataTarget = datasetToObject(targetElement).prime || {};
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
    const inputPrimeData = {...inputPrimeDataTarget, ...inputPrimeDataTarget[event.type], ...inputPrimeDataClicked};
    return prime._controller.onLinkClick(event.type, inputPrimeData);
}

function executePrime(path, prime, func) {
    const parts = path.split('.');
    const lastIdx = parts.length - 1;
    let current = prime; // this is the prime access, can be the current user or the actor.
    for (let idx = 0; idx < lastIdx; idx++) {
        current = current[parts[idx]];
    }
    return func(current, parts[lastIdx]);
}

function getPrimeValue(path, prime, inputPrimeData) {
    return executePrime(path, prime, (parent, key) => {
        if (key.endsWith('()')) {
            const newKey = key.slice(0, -2);
            return parent[newKey](inputPrimeData);
        } else {
            return parent[key];
        }
    });
}

export default class PrimeController {
    constructor(sheet, sheetData) {
        this.__sheet = sheet;
        this.__sheetData = sheetData;
    }

    get _sheet() {
        return this.__sheet;
    }

    get _sheetData() {
        return this.__sheetData;
    }

    static initializeForm(html, sheet) {

        this._fixIds(html, sheet);

        const data = sheet.getData();
        const prime = data.prime;
        this._preselectValues(html, prime);
        this._predisableElements(html, prime);
        this._prehideElements(html,prime);

        this._attachListener(html, sheet, '*[data-prime-click-at]', 'click', clickListener);
        this._attachListener(html, sheet, '*[data-prime-dblclick-at]', 'dblclick', clickListener);
        this._attachListener(html, sheet, 'input[data-prime-at], input[data-prime-change-at]', 'change', changeListener);
        this._attachListener(html, sheet, 'select[data-prime-at], select[data-prime-change-at]', 'change', changeListener);
        //TODO: select,textarea
    }

    static _prehideElements(html, prime) {
        html.find("*[data-prime-hidden-on]").each(function (index, element) {
            const inputPrimeData = datasetToObject(element).prime || {};
            const hidden = inputPrimeData.hidden.on;

            if (inputPrimeData.index && !isNaN(inputPrimeData.index)) {
                inputPrimeData.index = Number.parseInt(inputPrimeData.index);
            }
            const val = getPrimeValue(hidden, prime, inputPrimeData);
            element.hidden = !!val ? true : undefined;
        });
    }
    static _predisableElements(html, prime) {
        html.find("*[data-prime-disable-on]").each(function (index, element) {
            const inputPrimeData = datasetToObject(element).prime || {};
            const disable = inputPrimeData.disable.on;

            if (inputPrimeData.index && !isNaN(inputPrimeData.index)) {
                inputPrimeData.index = Number.parseInt(inputPrimeData.index);
            }
            const val = getPrimeValue(disable, prime, inputPrimeData);
            element.disabled = !!val;
        });
    }

    static _preselectValues(html, prime) {

        html.find("select[data-prime-select-on]").each(function (index, element) {
            const inputPrimeData = datasetToObject(element).prime || {};
            const select = inputPrimeData.select.on;
            // converts strings to an integer.
            if (inputPrimeData.index && !isNaN(inputPrimeData.index)) {
                inputPrimeData.index = Number.parseInt(inputPrimeData.index);
            }
            const val = getPrimeValue(select, prime, inputPrimeData);
            $(element).val(val || '');
        });
        html.find("input[type=checkbox][data-prime-select-on]").each(function (index, element) {
            const inputPrimeData = datasetToObject(element).prime || {};
            const select = inputPrimeData.select.on;
            // converts strings to an integer.
            if (inputPrimeData.index && !isNaN(inputPrimeData.index)) {
                inputPrimeData.index = Number.parseInt(inputPrimeData.index);
            }
            const val = getPrimeValue(select, prime, inputPrimeData);
            $(element).attr('checked', !!val);
        });
        html.find("input[type=checkbox][data-prime-type='counter']").each(function (index, element) {
            const inputPrimeData = datasetToObject(element).prime || {};
            const checked = inputPrimeData.current === inputPrimeData.value
            $(element).attr('checked', !!checked);
        });
    }

    /**
     * Removes the jquery nonsense from our event listeners and just uses the js native ones instead.
     * These is nothing in the jquery elements we need.
     * @private
     */
    static _attachListener(html, sheet, selector, type, listener) {
        const elements = html.find(selector).get();
        elements.forEach(element => {
            element.addEventListener(type, listener.bind(sheet), {capture: true});
        });
    }

    static _fixIds(html, sheet) {
        const idPostpend = `-appId-${sheet.appId}`;
        html.find('input').each(function () {
            const oldId = this.id;
            if (oldId) {
                const newId = oldId + idPostpend;
                html.find(`label[for="${oldId}"]`).attr('for', newId);
                this.id = newId;
            }
        });
    }

    _update() {
        this._sheetData.markedDirty = true;
    }

    async onLinkClick(eventType, inputPrimeData) {
        const isFunction = inputPrimeData.at.endsWith('()');
        if (isFunction) {
            return this.__updateWithFunction(inputPrimeData, {eventType});

        } else {
            return this._onPrimeChangeValue(inputPrimeData.value, inputPrimeData);
        }
    }

    async onChangeInput(element) {
        const data = datasetToObject(element);
        const isPrimeInput = !!data.prime;
        if (isPrimeInput) {
            const inputPrimeData = {...data.prime, ...(data.prime.change || {})};
            const isFunction = inputPrimeData.at.endsWith('()');
            if (element.tagName === 'SELECT') {
                await this._onPrimeChangeSelect(element, inputPrimeData, isFunction);
            } else if (element.tagName === 'INPUT') {
                switch (element.type) {
                    case 'checkbox':
                        await this._onPrimeChangeCheckbox(element.checked, inputPrimeData, isFunction);
                        break;
                    default:
                        await this._onPrimeChangeValue(element.value, inputPrimeData);
                        break;
                }
            }
        }
        return isPrimeInput;
    }

    async _onPrimeChangeSelect(element, inputPrimeData, isFunction) {
        const selected = $(element).val();
        if (isFunction) {
            return this.__updateWithFunction(inputPrimeData, {selected});
        } else {
            return this.__updateWithSetValue(selected, inputPrimeData);
        }
    }

    async _onPrimeChangeValue(value, inputPrimeData) {
        if (inputPrimeData.type === 'number') {
            return this._onPrimeChangeNumber(value, inputPrimeData);
        } else if (inputPrimeData.type === 'boolean') {
            return this._onPrimeChangeBoolean(value, inputPrimeData);
        } else {
            return this.__updateWithSetValue(value, inputPrimeData);
        }
    }

    async _onPrimeChangeNumber(value, inputPrimeData) {
        return this.__updateWithSetValue(Number.parseInt(value) || 0, inputPrimeData);
    }

    async _onPrimeChangeBoolean(value, inputPrimeData) {
        return this.__updateWithSetValue((value || '').toLowerCase() === 'true', inputPrimeData);
    }

    async _onPrimeChangeCheckbox(checked, inputPrimeData, isFunction) {
        if (inputPrimeData.type === 'counter') {
            let value;
            if (!checked && inputPrimeData.current === inputPrimeData.value) {
                value = (Number.parseInt(inputPrimeData.value) || 0) - 1;
            } else {
                value = Number.parseInt(inputPrimeData.value);
            }
            if (isFunction) {
                return this.__updateWithFunction(inputPrimeData, {value, activate: !!checked});
            } else {
                return this.__updateWithSetValue(value, inputPrimeData);
            }

        }
        if (isFunction) {
            return this.__updateWithFunction(inputPrimeData, {activate: !!checked});
        } else {
            return this.__updateWithSetValue(!!checked, inputPrimeData);
        }
    }

    /**
     *
     * @param inputPrimeData
     * @param rest
     * @returns {Promise<*>}
     * @private
     */
    async __updateWithFunction(inputPrimeData, optArgs) {
        return this.__updatePrime(inputPrimeData,
            (parent, key) => {
                const newKey = key.slice(0, -2);
                parent[newKey](
                    {
                        ...inputPrimeData,
                        ...optArgs
                    }
                );
            }
        );
    }

    async __updateWithSetValue(value, inputPrimeData) {
        return this.__updatePrime(inputPrimeData,
            (parent, key) => parent[key] = value);
    }

    async __updatePrime(inputPrimeData, func) {
        const path = inputPrimeData.at;
        const data = this.__sheetData;
        executePrime(path, data.prime, func);
        return this.__sheet.updateIfDirty(data);
    }
}