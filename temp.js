var perkItems = game.items.filter(
function callback(element, index, array) {
	if (element.type == "perk")
	{
		return true;
	}
	return false;
})

var parsedPerkItems = perkItems.map(
	function (element)
	{
		return {
			name: element.name,
			cost: element.data.data.cost.amount,
			costType: element.data.data.cost.attributeType
		};
		
	});