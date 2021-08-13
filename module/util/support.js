/**
 * Lazily loads a Component on request. This keeps our object model small, as we only generate instances we need.
 * We use the property descriptors of Object to keep the fields private.
 * @example <caption>equivalent to the following: when provided a *name* and a *Type* </caption
 * if(!this._name) {
 *     return this.__name = new Type(this);
 * }
 * return this.name;
 * @template {Component} T
 * @template {Class.<T>} C
 * @param {string} name the fieldName
 * @param {C} Type the class we want to instantiate
 * @param {object} (config) any additional parameters we want to send to its constructor.
 * @return {T} the actor component we generate
 */
export function getComponentLazily(target, name, Type, config = {}) {
    const fieldName = `__${name}`;
    const property = Object.getOwnPropertyDescriptor(target, fieldName);
    if (property == null) {
        const value = new Type(target, config);
        Object.defineProperty(target, fieldName, {value});
        return value;
    }
    return property.value;
}

export function orderedSort(itemA, itemB, currentItemSortList) {
    const itemAPosition = currentItemSortList[itemA.id];
    const itemBPosition = currentItemSortList[itemB.id];

    // Sorting data is missing or not generated yet - put unordered at the end of the list.
    if (itemAPosition == null) {
        return itemBPosition == null ? 0 : -1;
    }
    if (itemBPosition == null) {
        return 1;
    }

    if (itemAPosition < itemBPosition) {
        return -1;
    }
    if (itemAPosition > itemBPosition) {
        return 1;
    }

    return 0;
}

export function arrayIfNot(potentialArray, nullOnEmpty = false, arrayIfNull = false) {
    if (potentialArray == null) {
        return arrayIfNull ? [] : potentialArray;
    }
    if (Array.isArray(potentialArray)) {
        return (nullOnEmpty && potentialArray.length === 0) ? null : potentialArray;
    }
    return [potentialArray];
}

/**
 * calculates a value once. This prevents calculating values more than once a request.
 * Specifically we may have some expensive calculations iterating
 * through loads of items, and we want to reduce that load.
 *
 * We use the property descriptors of Object to keep the fields private.
 * if a thisArg is provided then the *this* scope will be of the thisArg otherwise it defaults to the calling actor component.
 * You can also provide an array of arguments you want to send to the function.
 * @example <caption>equivalent to the following: when provided a *name* and a *func* </caption
 * if(!this._name) {
 *     return this.__name = func();
 * }
 * return this.name;
 * @example <caption> call a function with arguments </caption>
 * const value = this._calculateValueOnce('myName', (a,b) => a+b, this, 3,5);
 * // returns 8
 * @param {string} name the fieldName
 * @param {function} func the class we want to instantiate.
 * @return {any}
 */
export function calculateValueOnce(target, name, func) {
    const fieldName = `__${name}`;
    const property = Object.getOwnPropertyDescriptor(target, fieldName);
    if (property == null) {
        const value = func.call(target);
        Object.defineProperty(target, fieldName, {value});
        return value;
    }
    return property.value;
}


export class DynError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DynError';
    }
}

export function minmax(min, value, max) {
    return Math.max(min, Math.min(max, (value || 0)));
}

export function datasetToObject(htmlElement, key = undefined) {
    const data = {};
    if (htmlElement && htmlElement.attributes) {
        const isDataRegex = /^data-/;
        Array.from(htmlElement.attributes)
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
                // if there is no value, then we presume it to be truthy
                node[paths[lastIdx]] = attr.value || true;
            });

    }
    if (key == null) {
        return data;
    }
    return data[key] || {};
}

export function sanitizeView(view) {
    if (view['jquery']) {
        return view.get()[0];
    }
    return view;
}

export function dateAsString(date = new Date(), locale = 'en-gb') {
    //const timezone = new Date().getTimezoneOffset();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const dateString = date.toLocaleDateString(
        locale,
        {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezone
        }
    );
    return dateString
}

export function currentUser() {
    return userForId(game.userId);
}

export function userForId(userId) {
    return game.users.get(userId);
}

export function isString(str) {
    return Object.prototype.toString.call(str) === "[object String]"
}

let isFunction = function (value) {
    return typeof value === 'function';
};
if (isFunction(/x/)) {
    isFunction = function (value) {
        return (
            typeof value === 'function' &&
            toString.call(value) === '[object Function]'
        );
    };
}
export {isFunction};

/**
 * class MyClass extends mix(SuperClass).with(Mixin1, Mixin2);
 *
 * @param superclass
 * @returns {MixinBuilder}
 */
export function mixin(superclass) {
    return new MixinBuilder(superclass);
}

class MixinBuilder {
    constructor(superclass) {
        this.superclass = superclass;
    }

    with(...mixins) {
        return mixins.reduce((c, mixin) => mixin(c), this.superclass);
    }
}

export function htmlToText(html, maxChars) {
    let text = html;
    if (isString(text)) {
        text = text.replace(/\&nbsp;/ig, ' ');
        text = text.replace(/<style([\s\S]*?)<\/style>/gi, '');
        text = text.replace(/<script([\s\S]*?)<\/script>/gi, '');
        text = text.replace(/<\/div>/ig, '\n');
        text = text.replace(/<\/li>/ig, '\n');
        text = text.replace(/<li>/ig, '  * ');
        text = text.replace(/<\/ul>/ig, '\n');
        text = text.replace(/<\/p>/ig, '\n');
        text = text.replace(/<br\s*[\/]?>/gi, "\n");
        text = text.replace(/(<([^>]+)>)/ig, '');
        text = text.trim(); // remove all white space at the end

        if (maxChars && text.length > maxChars) {
            text = text.slice(0, maxChars - 3) + "..."; // 3 for the dots
        }
    } else {
        text = '';
    }
    return text;
}