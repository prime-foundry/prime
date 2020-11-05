
export class PrimeTables
{

	static cloneAndTranslateTables(whatPath)
	{
		var tableClone = this.cloneTables(whatPath);
		this.addTranslations(tableClone);
		
		return tableClone;
	}

	static cloneTables(path, surpressTranslation)
	{
		var pathSplit = path.split(".");
		var count = 0;
		var currTable = game.system.template.Tables
		while (count < pathSplit.length)
		{
			var currPathSplit = pathSplit[count];
			if (currTable[currPathSplit])
			{
				currTable = currTable[currPathSplit]
			}
			else
			{
				console.error("ERROR: Unable to find the table reference. path: '" + path + "', failed portion: '" + currPathSplit + "'. Base table data: ", game.system.template.Tables)
			}
			count++;
		}

		return currTable;
	}

	static addTranslations(whatData)
	{
		for (var key in whatData)
		{
			if (whatData[key].indexOf)
			{
				var _primeDataIndex = whatData[key].indexOf("PRIME.");
			}

			if (key == "title" || key == "description" || _primeDataIndex === 0)
			{
				var translation = game.i18n.localize(whatData[key]);
				whatData[key] = translation;
			}
			if (typeof whatData[key] === 'object' && whatData[key] !== null)
			{
				this.addTranslations(whatData[key]);
			}
			_primeDataIndex = false;
		}
	}

}
