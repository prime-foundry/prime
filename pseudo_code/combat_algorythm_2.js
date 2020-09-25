

function hitThings2()
{
	var STEP = ((ATTACK + ROLL) - (DEFEND + ROLL));

	if (STEP > 0)
	{
		if (STEP > WEAPON_THRESHOLD)
		{
			if (STEP > (WEAPON_THRESHOLD * 2))
			{
				if (ARMOUR_HEAVY_WOUND)
				{
					ARMOUR_HEAVY_WOUND++
				}
				else
				{
					DEFENDER_HEAVY_WOUND++;
				}
			}
			else
			{
				if (ARMOUR_MEDIUM_WOUND)
				{
					ARMOUR_MEDIUM_WOUND++
				}
				else
				{
					DEFENDER_MEDIUM_WOUND++;
				}
			}

			if (ARMOUR_LIGHT_WOUND)
			{
				ARMOUR_LIGHT_WOUND++
			}
			else
			{
				ARMOUR_LIGHT_WOUND++;
			}
		}
	}
}