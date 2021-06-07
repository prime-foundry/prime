import { PrimeTables } from "./prime_tables.js";

var primeHandlebarsPartialsPaths =
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
	"actorTabPerks": "systems/prime/templates/actor/partials/tabs/actor-perks-tab.html",
	"actorTabStatistics": "systems/prime/templates/actor/partials/tabs/actor-statistics-tab.html",

	"itemListArmour": "systems/prime/templates/item/partials/list/item-list-armour.html",
	"itemListShield": "systems/prime/templates/item/partials/list/item-list-shield.html",
	"itemListGeneral": "systems/prime/templates/item/partials/list/item-list-general.html",
	"itemListMeleeWeapons": "systems/prime/templates/item/partials/list/item-list-melee-weapons.html",
	"itemListRangedWeapons": "systems/prime/templates/item/partials/list/item-list-ranged-weapons.html",

	"itemBasic": "systems/prime/templates/item/partials/sheet/item-basic.html",
	"itemValue": "systems/prime/templates/item/partials/sheet/item-value.html",
	"itemDescription": "systems/prime/templates/item/partials/sheet/item-description.html",
	"itemMetadata": "systems/prime/templates/item/partials/sheet/item-metadata.html",

	"itemEffects": "systems/prime/templates/item/partials/sheet/item-effects.html",
	"itemPrerequisites": "systems/prime/templates/item/partials/sheet/item-prerequisites.html",

	"itemCardAction": "systems/prime/templates/item/partials/cards/item-card-action.html",
	"itemCardPerk": "systems/prime/templates/item/partials/cards/item-card-perk.html"
}

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

Handlebars.registerHelper('convertHTMLForTitle', function (html, maxChars)
{
	if (html)
	{
		html = html.replace(/\&nbsp;/ig, '');
		html = html.replace(/<style([\s\S]*?)<\/style>/gi, '');
		html = html.replace(/<script([\s\S]*?)<\/script>/gi, '');
		html = html.replace(/<\/div>/ig, '\n');
		html = html.replace(/<\/li>/ig, '\n');
		html = html.replace(/<li>/ig, '  *  ');
		html = html.replace(/<\/ul>/ig, '\n');
		html = html.replace(/<\/p>/ig, '\n');
		html = html.replace(/<br\s*[\/]?>/gi, "\n");
		html = html.replace(/(<([^>]+)>)/ig, '');

		if (maxChars && html.length > maxChars)
		{
			html = html.slice(0,150) + "...";
		}
	}
	return html;
});


Handlebars.registerHelper('getStatMin', function (whatStat, options)
{
	var statMinTable = PrimeTables.cloneTables("actor.actorStatMinimums");
	if (statMinTable[whatStat] || statMinTable[whatStat] === 0)
	{
		return statMinTable[whatStat];
	}
	return 1;
});

Handlebars.registerHelper('isNotLastItem', function (v1, v2, options)
{
	return (v1 < (v2 - 1)) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('checkboxGroupState', function (v1)
{
	if (v1)
	{
		return "expanded";
	}
	return "collapsed"
});

Handlebars.registerHelper('for', function(from, to, incr, block) {
    var accum = '';
    for(var i = from; i <= to; i += incr)
        accum += block.fn(i);
    return accum;
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

Handlebars.registerHelper('itemSelected', function (pointIndex, currentPoints)
{
	if (pointIndex <= currentPoints)
	{
		return "checked";
	}
	return "";
});

Handlebars.registerHelper('itemEnabled', function (pointIndex, currentPoints)
{
	if (pointIndex <= currentPoints)
	{
		return "";
	}
	return "disabled";
});
Handlebars.registerHelper('disableIfTended', function (index, injurable)
{
	const injury = injurable.getInjury(index-1);
	if (!injury || injury.tended)
	{
		return "disabled";
	}
	return "";
});

Handlebars.registerHelper('selectIfWounded', function (index, injurable)
{
	const injury = injurable.getInjury(index-1);
	if (injury && !injury.tended)
	{
		return "checked";
	}
	return "";
});

Handlebars.registerHelper('addInjuryClasses', function (index, injurable)
{
	const injury = injurable.getInjury(index-1);
	var classes = []

	if (injury && !injury.tended)
	{
		classes.push("activePoint");
		return " activePoint";
	}
	return "";
});

Handlebars.registerHelper('disabledIf', function (value)
{
	if (value)
	{
		return "disabled title='This cannot be edited on an item that is owned.";
	}
	return "";
});
Handlebars.registerHelper('disabledClassIf', function (value)
{
	if (value)
	{
		return "elementDisabled";
	}
	return "";
});



Handlebars.registerHelper('itemChecked', function (checkedState)
{
	if (checkedState)
	{
		return "checked";
	}
	return "";
});

Handlebars.registerHelper('addStateClasses', function (pointIndex, basePointData)
{
	const current = basePointData.value;
	const lastTotal = basePointData.lastTotal;
	var classes = []

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

Handlebars.registerHelper('cropToLength', function(value, cropLength)
{
	if (!cropLength)
	{
		cropLength = 10
	}

	if (value.length > cropLength)
	{
		return value.substring(0, cropLength) + '...';
	}
	return value;
});