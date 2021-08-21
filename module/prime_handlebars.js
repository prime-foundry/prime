import {htmlToText} from "./util/support.js";

const primeHandlebarsPartialsPaths =
    {
        "actorActionPoints": "systems/prime/templates/actor/partials/sheet/actor-action-points.html",
        "actorBaseMetadata": "systems/prime/templates/actor/partials/sheet/actor-base-metadata.html",
        "actorExperiencePoints": "systems/prime/templates/actor/partials/sheet/actor-experience-points.html",
        "actorMentalHealth": "systems/prime/templates/actor/partials/sheet/actor-mental-health.html",
        "actorPhysicalHealth": "systems/prime/templates/actor/partials/sheet/actor-physical-health.html",
        "actorPrimesAndRefinements": "systems/prime/templates/actor/partials/sheet/actor-primes-and-refinements.html",
        "actorSoulPoints": "systems/prime/templates/actor/partials/sheet/actor-soul-points.html",
        "actorActionsList": "systems/prime/templates/actor/partials/sheet/actor-actions-list.html",

        "actorTabDescription": "systems/prime/templates/actor/partials/tabs/actor-description-tab.html",
        "actorTabCombat": "systems/prime/templates/actor/partials/tabs/actor-combat-tab.html",
        "actorTabInventory": "systems/prime/templates/actor/partials/tabs/actor-inventory-tab.html",
        "actorTabNotes": "systems/prime/templates/actor/partials/tabs/actor-notes-tab.html",
        "actorTabHistory": "systems/prime/templates/actor/partials/tabs/actor-history-tab.html",
        "actorTabPerks": "systems/prime/templates/actor/partials/tabs/actor-perks-tab.html",
        "actorTabStatistics": "systems/prime/templates/actor/partials/tabs/actor-statistics-tab.html",

        "actorDiceNav": "systems/prime/templates/actor/partials/actor-dice-nav.html",

        "itemListArmour": "systems/prime/templates/item/partials/list/item-list-armour.html",
        "itemListShield": "systems/prime/templates/item/partials/list/item-list-shield.html",
        "itemListGeneral": "systems/prime/templates/item/partials/list/item-list-general.html",
        "itemListMeleeWeapons": "systems/prime/templates/item/partials/list/item-list-melee-weapons.html",
        "itemListRangedWeapons": "systems/prime/templates/item/partials/list/item-list-ranged-weapons.html",
        "injuryList" : "systems/prime/templates/item/partials/list/injury-list.html",

        "itemBasic": "systems/prime/templates/item/partials/sheet/item-basic.html",
        "itemValue": "systems/prime/templates/item/partials/sheet/item-monetary-value.html",
        "itemDescription": "systems/prime/templates/item/partials/sheet/item-description.html",
        "itemSetting": "systems/prime/templates/item/partials/sheet/item-setting.html",
        "itemAudit": "systems/prime/templates/item/partials/sheet/item-audit.html",
        "itemName": "systems/prime/templates/item/partials/sheet/item-name.html",
        "itemOwnership": "systems/prime/templates/item/partials/sheet/item-ownership.html",
        "itemImage": "systems/prime/templates/item/partials/sheet/item-image.html",
        "itemWeapon": "systems/prime/templates/item/partials/sheet/item-weapon.html",
        "itemArmour": "systems/prime/templates/item/partials/sheet/item-armour.html",
        "itemMetrics": "systems/prime/templates/item/partials/sheet/item-metrics.html",

        "itemModifiers": "systems/prime/templates/item/partials/sheet/item-modifiers.html",
        "itemPrerequisites": "systems/prime/templates/item/partials/sheet/item-prerequisites.html",

        "itemCardAction": "systems/prime/templates/item/partials/cards/item-card-action.html",
        "itemCardPerk": "systems/prime/templates/item/partials/cards/item-card-perk.html"
    }

export class PrimeHandlebarsPartials {
    static async loadPartials() {
        for (let partialName in primeHandlebarsPartialsPaths) {
            const handlebarsTemplate = await getTemplate(primeHandlebarsPartialsPaths[partialName]);
            Handlebars.registerPartial(partialName, handlebarsTemplate);
        }
    }

}

Handlebars.logger.log = function (level, ...rest) {
    if (level >= Handlebars.logger.level) {
        let logger = console.log;
        switch (level) {
            case 0:
                logger = console.debug;
                break;
            case 1:
                logger = console.info;
                break;
            case 2:
                logger = console.warn;
                break;
            case 3:
                logger = console.error;
                break;
        }
        logger.apply(console, ["Handlebars: "].concat([level], Array.from(rest)));
    }
};
// DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3,
Handlebars.registerHelper('log', Handlebars.logger.log);
// Std level is 3, when set to 0, handlebars will log all compilation results
Handlebars.logger.level = 0;

Handlebars.registerHelper('convertHTMLForTitle', function (html, maxChars, options) {
    // if options is null, no maxChars was provided.
    return htmlToText(html, options == null ? null : maxChars);
});

Handlebars.registerHelper('checkboxGroupState', function (v1) {
    if (v1) {
        return "expanded";
    }
    return "collapsed"
});

/**
 * generator function, which generates a list of numbers.
 * @param from
 * @param to
 * @param incr
 * @param exclusive
 * @returns {Generator<*, void, *>}
 */
function* range(from, to, incr = 1, exclusive = false) {
    let count = from;
    const last = exclusive ? (to - incr) : to;
    while (count <= last) {
        yield count;
        count += incr;
    }
}

/**
 * produces a range of numbers from -> to
 * from = minimum number
 * to = maximum number
 *
 */
Handlebars.registerHelper('range', function (from, to, incr, exclusive, block) {
    return Array.from(range(from, to, incr, exclusive))
        .map(num => block.fn(num)).join('');
});


Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('itemSelected', function (pointIndex, currentPoints) {
    if (pointIndex <= currentPoints) {
        return "checked";
    }
    return "";
});

Handlebars.registerHelper('itemEnabled', function (pointIndex, currentPoints) {
    if (pointIndex <= currentPoints) {
        return "";
    }
    return "disabled";
});

Handlebars.registerHelper('addInjuryClasses', function (injury) {
    var classes = []

    if (injury && !injury.tended) {
        classes.push("activePoint");
        return " activePoint";
    }
    return "";
});

Handlebars.registerHelper('characterNameClass', function (whatName) {
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    canvasContext.font = "34px Signika";

    const nameText = canvasContext.measureText(whatName);
    const nameWidth = nameText.width;

    // 215 is width of name field on default open.
    if (nameWidth <= 180) {
        return "largestNameFont";
    } else if (nameWidth > 180 && nameWidth <= 205) {
        return "largeNameFont";
    } else if (nameWidth > 205 && nameWidth <= 320) {
        return "mediumNameFont";
    } else if (nameWidth > 320 && nameWidth <= 450) {
        return "smallNameFont";
    } else {
        return "tinyNameFont";
    }
});

Handlebars.registerHelper('disabledIf', function (value) {
    if (value) {
        return "disabled title='This cannot be edited on an item that is owned.";
    }
    return "";
});
Handlebars.registerHelper('disabledClassIf', function (value) {
    if (value) {
        return "elementDisabled";
    }
    return "";
});


Handlebars.registerHelper('itemChecked', function (checkedState) {
    if (checkedState) {
        return "checked";
    }
    return "";
});

Handlebars.registerHelper('addStateClasses', function (pointIndex, basePointData) {
    const current = basePointData.value;
    const classes = []
    if (pointIndex <= current) {
        classes.push("activePoint");
    }
    if (pointIndex == current) {
        classes.push("currentPointTotal");
    }
    if (classes.length > 0) {
        return " " + classes.join(" ");
    }
    return "";
});

Handlebars.registerHelper("humanIndex", function (value, options) {
    return parseInt(value) + 1;
});

Handlebars.registerHelper('cropToLength', function (value, cropLength) {
    if (!cropLength) {
        cropLength = 10
    }
    if (value == null) {
        return '';
    }
    const valueToCrop = value.trim(); // remove all whitespace at start and end.
    if (valueToCrop.length > cropLength) {
        // otherwise we might have unfinished html tags, which will break the sheet.
        return htmlToText(valueToCrop, cropLength);
    }
    return valueToCrop;
});