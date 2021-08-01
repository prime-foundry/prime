Hooks.once("createItem", async function (hookData1, hookData2, hookData3)
{
	PrimeItemManager.refreshItems(hookData1, hookData2, hookData3);
});

export class PrimeItemManager
{
	// [], {data.data.default}, false
	static getItems(requestData)
	{
		const { itemCollection, matchAll, justContentData, sortItems } = requestData;
		let { itemBaseTypes, filtersData } = requestData;

		itemBaseTypes = (Array.isArray(itemBaseTypes)) ? itemBaseTypes : [itemBaseTypes];
		filtersData = (Array.isArray(filtersData)) ? filtersData : [filtersData];

		const itemsByBaseTypes = itemCollection.filter(({type}) => itemBaseTypes.includes(type));
		const matchingItems = itemsByBaseTypes.filter((item) => this.testFilters(item, filtersData, matchAll));

		if (sortItems) {
			matchingItems.sort(this.sortItems);
		}

		if (justContentData) {
			const justContentMatchingItems = matchingItems.map((item) => {
				const newItem = item.toObject(false);
				// Fixes issues whereby compendiums have new IDs assigned.
				newItem.data.sourceKey = item.id;
				newItem._id = undefined;
				return newItem;
			});
			return justContentMatchingItems;
		}

		return matchingItems;
	}

	static testFilters(item, filtersData, matchAll)
	{
		let allMatchsMade = true;
		let matchedOne = false;
		filtersData.forEach((filter) =>
		{
			let match = this.testFilter(item, filter);
			if (!matchedOne && match)
			{
				matchedOne = true;
			}

			if (allMatchsMade && !match)
			{
				allMatchsMade = false;
			}
		});

		return ((matchAll && allMatchsMade) || (!matchAll && matchedOne));
	}

	static testFilter(item, filterData)
	{
		if (Array.isArray(filterData))
		{
			return this.testFilterInArray(item, filterData);
		}
		else
		{
			return this.testFilterInObject(item, filterData);
		}
	}

	static testFilterInObject(item, filterData)
	{
		for (let key in filterData)
		{
			if (!item.hasOwnProperty(key))
			{
				return false;
			}
			
			if ((typeof item[key] === 'object' && item[key] !== null) || (Array.isArray(item[key])))
			{
				const recursiveResult = this.testFilterInObject(item[key], filterData[key]);
				if (!recursiveResult)
				{
					return false;
				}
			}
			else if (filterData[key] !== item[key])
			{
				return false;
			}
		}
		return true;
	}

	static testFilterInArray(item, filterData)
	{
		let allMatched = true;
		filterData.forEach((filterDataElement, count) =>
		{
			if (!typeof item[count] === 'undefined' || filterDataElement[count] !== item[count])
			{
				allMatched = false;
			}
			else if ((typeof item[count] === 'object' && item[count] !== null) || (Array.isArray(item[count])))
			{
				const recursiveResult = this.testFilterInObject(item[count], filterDataElement[count]);
				if (!recursiveResult)
				{
					allMatched = false;
				}
			}
		});

		return allMatched;
	}

	static refreshItems(hookData1, hookData2, hookData3)
	{
		console.log(hookData1, hookData2, hookData3);
	}

	static sortItems(itemA, itemB)
	{
		if (itemA.name)
		{
			var textA = itemA.name.toUpperCase();
			var textB = itemB.name.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		}
		if (itemA.title)
		{
			var textA = itemA.title.toUpperCase();
			var textB = itemB.title.toUpperCase();
			return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		}

		return 0;
	}
};