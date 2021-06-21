/**
 * Rather than generating a flat object, we split the '-' to represent different levels in the object. creating a richer object.
 * @param elem
 * @returns {{}}
 */
function datasetToObject(elem) {
    const data = {};
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
    return data;
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

    static activateListeners(html, sheet) {
        async function changeListener(event) {
            event.preventDefault();
            event.stopPropagation();
            const data = this.getData();
            const prime = data.prime;
            const element = event.target;
            return prime._controller.onChangeInput(element);
        }
        async function clickListener(event) {
            event.preventDefault();
            event.stopPropagation();
            const clickedElement = event.target;
            const targetElement = event.delegateTarget;
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

        const id = `#appId_${sheet.appId} `;
        const fixedHtml = html.parent();
        const found = fixedHtml.find(id+'*[data-prime-click-at]');
        found.click(clickListener.bind(sheet));
        fixedHtml.find(id+'*[data-prime-dblclick-at]').dblclick(clickListener.bind(sheet));
        fixedHtml.find(id+'input[data-prime-at]').change(changeListener.bind(sheet));

        // html.on("change", "input,select,textarea", this._onChangeInput.bind(this));
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
        const isPrimeInput = data && data.prime && data.prime.at;
        if (isPrimeInput) {
            const inputPrimeData = data.prime;
            const isFunction = inputPrimeData.at.endsWith('()');

            switch (element.type) {
                case 'checkbox':
                    await this._onPrimeChangeCheckbox(element.checked, inputPrimeData, isFunction);
                    break;
                default:
                    await this._onPrimeChangeValue(element.value, inputPrimeData);
                    break;
            }
        }
        return isPrimeInput;
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
            if (!checked && inputPrimeData.currentvalue === inputPrimeData.value) {
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
                        inputPrimeData,
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
        const parts = path.split('.');
        const data = this.__sheetData;
        const prime = data.prime;
        const lastIdx = parts.length - 1;
        let current = prime; // this is the prime access, can be the current user or the actor.
        for (let idx = 0; idx < lastIdx; idx++) {
            current = current[parts[idx]];
        }
        await func(current, parts[lastIdx]);
        return this.__sheet.updateIfDirty(data);
    }
}