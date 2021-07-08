Hooks.once("createItem", async function (hookData1, hookData2, hookData3)
{
	PrimeItemManager.refreshItems(hookData1, hookData2, hookData3);
});

export class PrimeItemManager
{
	// [], {data.data.default}, false
	static getItems(itemCollection, itemBaseTypes, filtersData, matchAll, justContentData)
	{
		itemBaseTypes = (Array.isArray(itemBaseTypes)) ? itemBaseTypes : [itemBaseTypes];
		filtersData = (Array.isArray(filtersData)) ? filtersData : [filtersData];

		let matchingItems = [];
		itemCollection.forEach((item, key, items) =>
		{
			if (itemBaseTypes.indexOf(item.type) > -1 && this.testFilters(item, filtersData, matchAll))
			{
				// Fixes issues whereby compendiums have new IDs assigned.
				item.data.data.sourceKey = item.data._id;
				if (justContentData)
				{
					matchingItems.push(item.data);
				}
				else
				{
					matchingItems.push(item);
				}
			}
		});

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
};