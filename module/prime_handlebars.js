var primeHandlebarsPartialsPaths =
{
	"itemBasic": "systems/prime/templates/item/partials/item-basic.html",
	"itemValue": "systems/prime/templates/item/partials/item-value.html",
	"itemDescription": "systems/prime/templates/item/partials/item-description.html",
	"itemMetadata": "systems/prime/templates/item/partials/item-metadata.html"
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

Handlebars.registerHelper('convertHTMLForTitle', function (html, options)
{
	html = html.replace(/<style([\s\S]*?)<\/style>/gi, '');
	html = html.replace(/<script([\s\S]*?)<\/script>/gi, '');
	html = html.replace(/<\/div>/ig, '\n');
	html = html.replace(/<\/li>/ig, '\n');
	html = html.replace(/<li>/ig, '  *  ');
	html = html.replace(/<\/ul>/ig, '\n');
	html = html.replace(/<\/p>/ig, '\n');
	html = html.replace(/<br\s*[\/]?>/gi, "\n");
	html = html.replace(/<[^>]+>/ig, '');
	return html;
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