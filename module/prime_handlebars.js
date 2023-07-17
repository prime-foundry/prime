import { PrimeTables } from "./prime_tables.js";
import { prepForTitleAttribute } from "./utils/strings.js";

var primeHandlebarsPartialsPaths =
{
    "actorActionPoints": "systems/prime/templates/actor/partials/sheet/actor-action-points.hbs",
    "actorBaseMetadata": "systems/prime/templates/actor/partials/sheet/actor-base-metadata.hbs",
    "actorExperiencePoints": "systems/prime/templates/actor/partials/sheet/actor-experience-points.hbs",
    "actorMentalHealth": "systems/prime/templates/actor/partials/sheet/actor-mental-health.hbs",
    "actorPhysicalHealth": "systems/prime/templates/actor/partials/sheet/actor-physical-health.hbs",
    "actorPrimesAndRefinements": "systems/prime/templates/actor/partials/sheet/actor-primes-and-refinements.hbs",
    "actorSoulPoints": "systems/prime/templates/actor/partials/sheet/actor-soul-points.hbs",
    "actorActionsList": "systems/prime/templates/actor/partials/sheet/actor-actions-list.hbs",

    "actorTabDescription": "systems/prime/templates/actor/partials/tabs/actor-description-tab.hbs",
    "actorTabCombat": "systems/prime/templates/actor/partials/tabs/actor-combat-tab.hbs",
    "actorTabInventory": "systems/prime/templates/actor/partials/tabs/actor-inventory-tab.hbs",
    "actorTabNotes": "systems/prime/templates/actor/partials/tabs/actor-notes-tab.hbs",
    "actorTabPerks": "systems/prime/templates/actor/partials/tabs/actor-perks-tab.hbs",
    "actorTabStatistics": "systems/prime/templates/actor/partials/tabs/actor-statistics-tab.hbs",

    "itemListArmour": "systems/prime/templates/item/partials/list/item-list-armour.hbs",
    "itemListShield": "systems/prime/templates/item/partials/list/item-list-shield.hbs",
    "itemListGeneral": "systems/prime/templates/item/partials/list/item-list-general.hbs",
    "itemListMeleeWeapons": "systems/prime/templates/item/partials/list/item-list-melee-weapons.hbs",
    "itemListRangedWeapons": "systems/prime/templates/item/partials/list/item-list-ranged-weapons.hbs",

    "itemBasic": "systems/prime/templates/item/partials/sheet/item-basic.hbs",
    "itemValue": "systems/prime/templates/item/partials/sheet/item-value.hbs",
    "itemDescription": "systems/prime/templates/item/partials/sheet/item-description.hbs",
    "itemMetadata": "systems/prime/templates/item/partials/sheet/item-metadata.hbs",

    "itemEffects": "systems/prime/templates/item/partials/sheet/item-effects.hbs",
    "itemPrerequisites": "systems/prime/templates/item/partials/sheet/item-prerequisites.hbs",

    "itemCardAction": "systems/prime/templates/item/partials/cards/item-card-action.hbs",
    "itemCardPerk": "systems/prime/templates/item/partials/cards/item-card-perk.hbs"
};

export class PrimeHandlebarsPartials
{
    static async loadPartials()
    {
        var handlebarsTemplate = null;
        for (var partialName in primeHandlebarsPartialsPaths)
        {
            handlebarsTemplate = await getTemplate(primeHandlebarsPartialsPaths[partialName]);
            Handlebars.registerPartial(partialName, handlebarsTemplate);
        }
    }
}

Handlebars.registerHelper("convertHTMLForTitle", function (html, maxChars)
{
    if (html)
    {
        html = html.replace(/&nbsp;/ig, "");
        html = html.replace(/<style([\s\S]*?)<\/style>/gi, "");
        html = html.replace(/<script([\s\S]*?)<\/script>/gi, "");
        html = html.replace(/<\/div>/ig, "\n");
        html = html.replace(/<\/li>/ig, "\n");
        html = html.replace(/<li>/ig, "  *  ");
        html = html.replace(/<\/ul>/ig, "\n");
        html = html.replace(/<\/p>/ig, "\n");
        html = html.replace(/<br\s*[/]?>/gi, "\n");
        html = html.replace(/(<([^>]+)>)/ig, "");

        if (maxChars && html.length > maxChars)
        {
            html = html.slice(0,150) + "...";
        }
        html = prepForTitleAttribute(html);
    }
    return html;
});


Handlebars.registerHelper("getStatMin", function (whatStat, options)
{
    var statMinTable = PrimeTables.cloneTables("actor.actorStatMinimums");
    if (statMinTable[whatStat] || statMinTable[whatStat] === 0)
    {
        return statMinTable[whatStat];
    }
    return 1;
});

Handlebars.registerHelper("isNotLastItem", function (v1, v2, options)
{
    return (v1 < (v2 - 1)) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("checkboxGroupState", function (v1)
{
    if (v1)
    {
        return "expanded";
    }
    return "collapsed";
});

Handlebars.registerHelper("for", function(from, to, incr, block) 
{
    var accum = "";
    for(var i = from; i <= to; i += incr)
        accum += block.fn(i);
    return accum;
});

Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) 
{

    switch (operator)
    {
    case "==":
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case "===":
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case "!=":
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
    case "!==":
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    case "<":
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case "<=":
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case ">":
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case ">=":
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    case "&&":
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
    case "||":
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
    default:
        return options.inverse(this);
    }
});

Handlebars.registerHelper("itemSelected", function (pointIndex, currentPoints)
{
    if (pointIndex <= currentPoints)
    {
        return "checked";
    }
    return "";
});

Handlebars.registerHelper("itemEnabled", function (pointIndex, currentPoints)
{
    if (pointIndex <= currentPoints)
    {
        return "";
    }
    return "disabled";
});

Handlebars.registerHelper("disabledIf", function (value)
{
    if (value)
    {
        return "disabled title='This cannot be edited on an item that is owned.";
    }
    return "";
});
Handlebars.registerHelper("disabledClassIf", function (value)
{
    if (value)
    {
        return "elementDisabled";
    }
    return "";
});



Handlebars.registerHelper("itemChecked", function (checkedState)
{
    if (checkedState)
    {
        return "checked";
    }
    return "";
});

Handlebars.registerHelper("addStateClasses", function (pointIndex, basePointData)
{
    const current = basePointData.value;
    const lastTotal = basePointData.lastTotal;
    var classes = [];

    if (pointIndex <= current)
    {
        classes.push("activePoint");
    }
    if (pointIndex == current)
    {
        classes.push("currentPointTotal");
    }

    if (lastTotal > current)
    {
        if (pointIndex > current && pointIndex <= lastTotal)
        {
            classes.push("emptyAnimation");
        }
    }
    else if (lastTotal < current)
    {
        if (pointIndex > lastTotal && pointIndex <= current)
        {
            classes.push("fillAnimation");
        }
    }
    if (classes.length > 0)
    {
        return " " + classes.join(" ");
    }
    return "";
});

Handlebars.registerHelper("humanIndex", function(value, options)
{
    return parseInt(value) + 1;
});

Handlebars.registerHelper("cropToLength", function(value, cropLength)
{
    if (!cropLength)
    {
        cropLength = 10;
    }

    if (value.length > cropLength)
    {
        return value.substring(0, cropLength) + "...";
    }
    return value;
});

// Usage: {{log this}}
Handlebars.registerHelper("log", function(messageData)
{
    console.log(`HB log: ${messageData}`, messageData);
});

const sizeFontAndOffsetLookup = {
    "1" : {height:80, font: 14, offset: 0},
    "2" : {height:50, font: 14, offset: 55},
    "3" : {height:45, font: 14, offset: 65},
    "4" : {height:40, font: 14, offset: 80},
    "5" : {height:32, font: 14, offset: 105},
    "6" : {height:30, font: 14, offset: 120},
    "7" : {height:28, font: 14, offset: 135},
    "8" : {height:26, font: 14, offset: 160},
    "9" : {height:24, font: 14, offset: 175},
    "10" : {height:20, font: 14, offset: 195},
    "11" : {height:20, font: 10, offset: 215},
    "12" : {height:18, font: 10, offset: 220},
    "13" : {height:18, font: 8, offset: 240}
};

Handlebars.registerHelper("generateFlareTransformCSS", function(currentFlare, maxFlares)
{
    const totalFlareIndicators = maxFlares + 1;

    const {height, offset} = sizeFontAndOffsetLookup[totalFlareIndicators];
    const rotation = 180 + (360 / (totalFlareIndicators)) * currentFlare;

    return `transform: rotate(${rotation}deg) translate(${offset}%, 0); height: ${height}%; margin-top: -${height / 2}%; margin-left: -${height / 2}%;`;
});

Handlebars.registerHelper("generateFlareLabelTransformCSS", function(currentFlare, maxFlares)
{
    const totalFlareIndicators = maxFlares + 1;

    const {font} = sizeFontAndOffsetLookup[totalFlareIndicators];
    // Here we got in reverse, to ensure the number ends up back the right way.
    const rotation = 180 - (360 / (totalFlareIndicators)) * currentFlare;

    return `transform: rotate(${rotation}deg); font-size: ${font}px`;
});
