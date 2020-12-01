

export class ItemDragSort
{
	static currSourceItem = null;
	static currDragItem = null;
	static currDragContainer = null;
	static currInsertMarker = null;

	static dragClass = "dragContainer";
	static dragBoundsMargin = 5;

	static bestTargetsData = null;

	static dragItemTopOffset = null;
	static dragItemLeftOffset = null;

	static globalEventsBound = false;

	static bindEvents(whatContainer, whatDraggableClass, allowHorizontalMatches, allowVerticalMatches, matchHandler, whatItemType)
	{
		whatContainer.addClass(this.dragClass);
		whatContainer.data("dragClass", whatDraggableClass);
		whatContainer.data("allowHorizontalMatches", allowHorizontalMatches);
		whatContainer.data("allowVerticalMatches", allowVerticalMatches);
		whatContainer.data("itemType", whatItemType);
		whatContainer[0].matchHandler = matchHandler;

		var items = whatContainer.find(whatDraggableClass);
		items.mousedown(this.itemMouseDown.bind(this));

		if (!this.globalEventsBound)
		{
			$("body").mousemove(this.itemContainerMouseMove.bind(this));
			$("body").mouseup(this.itemMouseUp.bind(this));
			this.globalEventsBound = true;
		}
	}

	//static unbindEvents(whatContainer, whatDraggableClass)
	//{
	//
	//}

	static itemContainerMouseMove(event)
	{
		if (this.currDragItem)
		{
			this.updateDragItemCoords(event, false);
			this.showInsertionPosition();
		}
	}

	static itemMouseDown(event)
	{
		if ($(event.target).hasClass("stopDrag"))
		{
			return;
		}
		//console.log("itemMouseDown()");
		this.currSourceItem = $(event.delegateTarget);
		
		this.currDragItem = this.currSourceItem.clone();
		this.currDragContainer = this.currSourceItem.closest("." + this.dragClass);

		this.currSourceItem.addClass("itemDragging");
		this.currDragItem.addClass("dragItemDragging");
		this.currDragContainer.addClass("dragContainerActive");

		this.currDragItem.width(this.currSourceItem.outerWidth());
		this.currDragItem.height(this.currSourceItem.outerHeight());

		this.currDragContainer.append(this.currDragItem);

		this.updateDragItemCoords(event, true);
	}

	static async itemMouseUp(event)
	{
		//console.log("itemMouseUp()");
		if (this.currDragItem)
		{
			let triggerUpdate = false;
			if (this.bestTargetsData && this.bestTargetsData.bestMatch)
			{
				var itemIndex = this.currDragItem.data("itemIndex");
				var insertAfterIndex = this.getInsertAfterIndex();
				var itemType = this.currDragContainer.data("itemType");
				var matchHandler = this.currDragContainer[0].matchHandler;
				triggerUpdate = true;
			}
			this.bestTargetsData = null;

			this.currSourceItem.removeClass("itemDragging");
			this.currDragContainer.removeClass("dragContainerActive");
	
			this.currDragItem.remove();
			if (this.currInsertMarker)
			{
				this.currInsertMarker.remove();
			}
	
			this.currSourceItem = null;
			this.currDragItem = null;
			this.currDragContainer = null;
			this.currInsertMarker = null;

			this.dragItemTopOffset = null;
			this.dragItemLeftOffset = null;
	
			if (triggerUpdate)
			{
				await this.triggerMatchHandler(matchHandler, itemIndex, insertAfterIndex, itemType);
			}
		}
	}

	static async triggerMatchHandler(matchHandler, itemIndex, insertAfterIndex, itemType)
	{
		await matchHandler(itemIndex, insertAfterIndex, itemType);
	}

	static updateDragItemCoords(whatEvent, isInitialUpdate)
	{
		const offsets = this.getOffsets(whatEvent);

		if (isInitialUpdate)
		{
			var normalisedTop = offsets.container.top;
			var normalisedLeft = offsets.container.left + 5;

			this.dragItemTopOffset = offsets.sourceItem.top;
			this.dragItemLeftOffset = offsets.sourceItem.left;
		}
		else
		{
			let baseCoords =
			{
				top: (offsets.page.top - this.currDragContainer.offset().top) - this.dragItemTopOffset,
				left: (offsets.page.left - this.currDragContainer.offset().left) - this.dragItemLeftOffset
			};

			this.applyCoordBounds(baseCoords);

			var normalisedTop = baseCoords.top;
			var normalisedLeft = baseCoords.left;
		}

		this.currDragItem.css({top: normalisedTop, left: normalisedLeft});
	}
	
	static applyCoordBounds(whatBaseCoords)
	{
		if (whatBaseCoords.top < this.dragBoundsMargin)
		{
			whatBaseCoords.top = this.dragBoundsMargin;
		}
		if (whatBaseCoords.left < this.dragBoundsMargin)
		{
			whatBaseCoords.left = this.dragBoundsMargin;
		}

		var maxTop = this.currDragContainer.outerHeight() - this.currDragItem.outerHeight() - this.dragBoundsMargin;
		var maxLeft = this.currDragContainer.outerWidth() - this.currDragItem.outerWidth() - this.dragBoundsMargin;

		if (whatBaseCoords.top > maxTop)
		{
			whatBaseCoords.top = maxTop;
		}
		if (whatBaseCoords.left > maxLeft)
		{
			whatBaseCoords.left = maxLeft;
		}
	}
	
	static showInsertionPosition()
	{
		let possibleTargets = this.currDragContainer.find(this.currDragContainer.data("dragClass")).not(".dragItemDragging");
		possibleTargets.removeClass("matchingTarget bestMatchingTarget secondBestMatchingTarget");

		this.addIndexAsRequired(possibleTargets);

		this.bestTargetsData = this.getBestTargets(possibleTargets);
		this.setInsertMarker();
	}

	static addIndexAsRequired(whatPossibleTargets)
	{
		whatPossibleTargets.each((index) =>
		{
			var item = $(whatPossibleTargets[index])
			if (!item.data("itemIndex") && item.data("itemIndex") != 0)
			{
				item.data("itemIndex", index);
			}
		});
	}

	static getBestTargets(possibleTargets)
	{
		var matches = {bestMatch: null, secondBestMatch: null, isHorizontal: null};

		let matchingTargets = this.getTargetsWithOverlap(possibleTargets);
		let bestMatch = this.getBestMatch(matchingTargets, false);

		if (bestMatch)
		{
			matches.bestMatch = bestMatch;
			bestMatch.element.addClass("bestMatchingTarget");

			let secondBestMatch = this.getSecondBestMatch(bestMatch, matchingTargets);
			if (secondBestMatch)
			{
				secondBestMatch.element.addClass("secondBestMatchingTarget");
				matches.secondBestMatch = secondBestMatch;
			}
			
			this.setMatchOrientation(matches);

			return matches;
		}

		return matches;
	}

	static getTargetsWithOverlap(whatPossibleTargets)
	{		
		var dragItemPosition = this.currDragItem.position();

		var matchingTargets = [];
		whatPossibleTargets.each((index) =>
		{
			//whatPossibleTargets[index].dataset.overlapVolume = "-1";
			//whatPossibleTargets[index].dataset.totalVolume = "-1";
			//whatPossibleTargets[index].dataset.percentageVolume = "-1";

			let currPossible = $(whatPossibleTargets[index]);
			let currPossiblePosition = currPossible.position();
			currPossiblePosition.top += 5;	// +5 as jQuery isn't dealing with the margin
			currPossiblePosition.left += 5;	// +5 as jQuery isn't dealing with the margin
			let currPossibleHeight = currPossible.outerHeight();
			let currPossibleWidth = currPossible.outerWidth();

			var topMatchPercent = false;
			var leftMatchPercent = false;

			var fromBelow = false;
			var fromAbove = false;
			var fromLeft = false;
			var fromRight = false;

			var topOverlap = false;
			var leftOverlap = false;

			if (dragItemPosition.top >= currPossiblePosition.top && dragItemPosition.top <= (currPossiblePosition.top + currPossibleHeight))
			{
				topOverlap = currPossibleHeight - (dragItemPosition.top - currPossiblePosition.top);
				topMatchPercent = (topOverlap / currPossibleHeight) * 100;
				fromBelow = true;
			}

			if (dragItemPosition.top + this.currDragItem.outerHeight() >= currPossiblePosition.top && dragItemPosition.top + this.currDragItem.outerHeight() <= (currPossiblePosition.top + currPossibleHeight))
			{
				topOverlap = (dragItemPosition.top + this.currDragItem.outerHeight()) - currPossiblePosition.top;
				topMatchPercent = (topOverlap / currPossibleHeight) * 100;
				fromAbove = true;
			}

			if (dragItemPosition.left >= currPossiblePosition.left && dragItemPosition.left <= (currPossiblePosition.left + currPossibleWidth))
			{
				leftOverlap = currPossibleWidth - (dragItemPosition.left - currPossiblePosition.left);
				leftMatchPercent = (leftOverlap / currPossibleWidth) * 100;
				fromRight = true;
			}

			if (dragItemPosition.left + this.currDragItem.outerWidth() >= currPossiblePosition.left && dragItemPosition.left + this.currDragItem.outerWidth() <= (currPossiblePosition.left + currPossibleWidth))
			{
				leftOverlap = (dragItemPosition.left + this.currDragItem.outerWidth()) - currPossiblePosition.left;
				leftMatchPercent = (leftOverlap / currPossibleWidth) * 100;
				fromLeft = true;
			}

			if (topMatchPercent && leftMatchPercent)
			{
				let overlapVolume = topOverlap * leftOverlap;
				let totalVolume = currPossibleHeight * currPossibleWidth;
				let percentageVolume = (overlapVolume / totalVolume) * 100;

				//whatPossibleTargets[index].dataset.overlapVolume = overlapVolume
				//whatPossibleTargets[index].dataset.totalVolume = totalVolume
				//whatPossibleTargets[index].dataset.percentageVolume = percentageVolume

				let matchData =
				{
					element: currPossible,
					index: index,

					topOverlap: topOverlap,
					leftOverlap: leftOverlap,
					overlapVolume: overlapVolume,

					topPercent: topMatchPercent,
					leftPercent: leftMatchPercent,
					percentageVolume: percentageVolume,

					fromBelow: fromBelow,
					fromAbove: fromAbove, 
					fromLeft: fromLeft,
					fromRight: fromRight
				}
				
				currPossible.addClass("matchingTarget");

				matchingTargets.push(matchData);
			}
		});

		return matchingTargets;
	}

	static getBestMatch(whatTargets)
	{
		var highestPercent = 0;
		var bestMatch = null;
		var currTarget = null;

		var count = 0;
		while (count < whatTargets.length)
		{
			currTarget = whatTargets[count];

			if (currTarget.percentageVolume > highestPercent)
			{
				bestMatch = currTarget;
				highestPercent = currTarget.percentageVolume;
			}
			count++;
		}

		return bestMatch;
	}

	// Can return null, which means the match is from the outside of the grid. Marker
	// will be based on match direction of best match only.
	static getSecondBestMatch(whatBestMatch, whatOtherMatches)
	{
		var secondBestMatch = null;
		var currMatch = null;
		var isValidDirection = false;
		var bestMatchPercentage = 0;
		var validMatchDirections = this.getValidMatchDirections(whatBestMatch)

		var count = 0;
		while (count < whatOtherMatches.length)
		{
			currMatch = whatOtherMatches[count];
			isValidDirection = this.checkMatchDirection(currMatch, validMatchDirections);
			if (isValidDirection && currMatch.percentageVolume > bestMatchPercentage)
			{
				bestMatchPercentage = currMatch.percentageVolume;
				secondBestMatch = currMatch;
			}			
			count++;
		}
		return secondBestMatch;
	}

	static getValidMatchDirections(whatBestMatch)
	{
		var validDirections =
		{
			fromBelow: false,
			fromAbove: false, 
			fromLeft: false,
			fromRight: false
		};
		if (this.currDragContainer.data("allowHorizontalMatches"))
		{
			if (whatBestMatch.fromLeft)
			{
				validDirections.fromRight = true;
			}
			if (whatBestMatch.fromRight)
			{
				validDirections.fromLeft = true;
			}
		}

		if (this.currDragContainer.data("allowVerticalMatches"))
		{
			if (whatBestMatch.fromTop)
			{
				validDirections.fromBottom = true;
			}
			if (whatBestMatch.fromBottom)
			{
				validDirections.fromTop = true;
			}
		}
		return validDirections;
	}

	static checkMatchDirection(whatMatch, whatValidDirections)
	{
		if ((whatMatch.fromLeft && whatValidDirections.fromLeft) ||
			(whatMatch.fromRight && whatValidDirections.fromRight) ||
			(whatMatch.fromTop && whatValidDirections.fromTop) ||
			(whatMatch.fromBottom && whatValidDirections.fromBottom))
		{
			return true;
		}
		return false;
	}

	static getOffsets(whatEvent)
	{
		let dragContainerOffsets = this.collateOffsetsToAncestor(this.currSourceItem, "dragContainerActive");

		let offsets =
		{
			page: {top: whatEvent.pageY, left: whatEvent.pageX},
			container:{top: dragContainerOffsets.top + 5, left: dragContainerOffsets.left + 5},	// +5 as jQuery isn't dealing with the margin
			sourceItem:{top: whatEvent.offsetY + 5, left: whatEvent.offsetX + 5} // +5 as jQuery isn't dealing with the margin
		};

		return offsets;
	}

	static collateOffsetsToAncestor(whatNode, whatAncestorClass)
	{
		let totalOffsets =
		{
			top: 0,
			left: 0
		}
		
		var currNode = whatNode;
		while (currNode && !currNode.hasClass(whatAncestorClass))
		{
			let currParentOffsets = currNode.position();
			totalOffsets.top += currParentOffsets.top;
			totalOffsets.left += currParentOffsets.left;
			currNode = currNode.offsetParent();
		}

		return totalOffsets;
	}
	
	static setMatchOrientation(whatTargets)
	{
		if (this.currDragContainer.data("allowHorizontalMatches") && !this.currDragContainer.data("allowVerticalMatches"))
		{
			whatTargets.isHorizontal = true;
			return;
		}

		if (!this.currDragContainer.data("allowHorizontalMatches") && this.currDragContainer.data("allowVerticalMatches"))
		{
			whatTargets.isHorizontal = false;
			return;
		}

		if (this.currDragContainer.data("allowHorizontalMatches") && this.currDragContainer.data("allowVerticalMatches"))
		{
			if (whatTargets.bestMatch.leftPercent > whatTargets.bestMatch.topPercent)
			{
				whatTargets.isHorizontal = true;
			}
			else
			{
				whatTargets.isHorizontal = false;
			}
			return;
		}

		console.error("Neither horizontal or vertical matches are allowed. Please adjust parameters for drag sort.");
	}

	static setInsertMarker(whatTargetsData)
	{
		var insertAfterIndex = this.getInsertAfterIndex();
		var currDragIndex = this.currDragItem.data("itemIndex");
		console.log("insertAfterIndex: " + insertAfterIndex + ", currDragIndex: " + currDragIndex);

		if (!this.bestTargetsData.bestMatch || currDragIndex == insertAfterIndex)
		{
			this.removeInsertMarker();
		}
		else
		{
			this.addInsertMarker();
		}
	}

	static removeInsertMarker()
	{
		if (this.currInsertMarker)
		{
			this.currInsertMarker.remove();
			this.currInsertMarker = null;
		}
	}

	static addInsertMarker()
	{
		var cssData = this.getInsertMarkerCSSObject();

		if (!this.currInsertMarker)
		{
			//whatTargetsData.isHorizontal = false;
			if (this.bestTargetsData.isHorizontal)
			{
				var directionClass = "horizontalInsert";
			}
			else
			{
				var directionClass = "verticalInsert";
			}
			
			this.currInsertMarker = $("<div class='itemInsertMarker " + directionClass + "'><span class='insertIcon'></span></div>");

			this.currDragContainer.append(this.currInsertMarker);
		}

		this.currInsertMarker.css(cssData);
	}

	static getInsertMarkerCSSObject()
	{
		var markerCSS = {top: "auto", left: "auto", bottom: "auto", right: "auto"};

		const bestTargetOffsets = this.collateOffsetsToAncestor(this.bestTargetsData.bestMatch.element, "dragContainerActive");
		//console.log("bestTargetOffsets: ", bestTargetOffsets);
		var secondBestTargetOffsets = null;
		if (this.bestTargetsData.secondBestMatch && this.bestTargetsData.secondBestMatch.element)
		{
			secondBestTargetOffsets = this.collateOffsetsToAncestor(this.bestTargetsData.secondBestMatch.element, "dragContainerActive");
			//console.log("secondBestTargetOffsets: ", secondBestTargetOffsets);
		}

		if (this.bestTargetsData.isHorizontal)
		{
			markerCSS.top = bestTargetOffsets.top + 5;
			markerCSS.height = this.bestTargetsData.bestMatch.element.outerHeight();

			if (secondBestTargetOffsets)
			{
				//console.log("Has 2nd best");
				if (this.bestTargetsData.bestMatch.fromRight)
				{
					//console.log("From right");
					markerCSS.left = bestTargetOffsets.left + this.bestTargetsData.bestMatch.element.outerWidth() + 5;
					markerCSS.width = (secondBestTargetOffsets.left + 5) - markerCSS.left;
				}
				else
				{
					//console.log("From left");
					markerCSS.left = secondBestTargetOffsets.left + this.bestTargetsData.secondBestMatch.element.outerWidth() + 5;
					markerCSS.width = (bestTargetOffsets.left + 5) - markerCSS.left;
				}
			}
			else
			{
				//console.log("NO 2nd best");
				if (this.bestTargetsData.bestMatch.fromRight)
				{
					//console.log("From right");
					markerCSS.left = bestTargetOffsets.left + this.bestTargetsData.bestMatch.element.outerWidth() + 5;
				}
				else
				{
					//console.log("From left");
					markerCSS.left = (bestTargetOffsets.left + 5) - 10;
				}
			}
		}
		else
		{
			markerCSS.left = bestTargetOffsets.left + 5;
			markerCSS.width = this.bestTargetsData.bestMatch.element.outerWidth();

			if (secondBestTargetOffsets)
			{
				if (this.bestTargetsData.bestMatch.fromBottom)
				{
					markerCSS.top = bestTargetOffsets.top + this.bestTargetsData.bestMatch.element.outerHeight() + 5;
					markerCSS.height = (secondBestTargetOffsets.top + 5) - markerCSS.top;
				}
				else
				{
					markerCSS.top = secondBestTargetOffsets.top + this.bestTargetsData.secondBestMatch.element.outerHeight() + 5;
					markerCSS.height = (bestTargetOffsets.top + 5) - markerCSS.top;
				}
			}
			else
			{
				if (this.bestTargetsData.bestMatch.fromBottom)
				{
					markerCSS.top = bestTargetOffsets.top + this.bestTargetsData.bestMatch.element.outerHeight() + 5;
				}
				else
				{
					markerCSS.top = (bestTargetOffsets.top + 5) - 10;
				}
			}
		}
		return markerCSS;
	}

	static getInsertAfterIndex()
	{
		if (!this.bestTargetsData.bestMatch)
		{
			return this.currDragItem.data("itemIndex");
		}

		var bestMatchIndex = this.bestTargetsData.bestMatch.element.data("itemIndex")
		if (this.bestTargetsData.bestMatch.fromLeft || this.bestTargetsData.bestMatch.fromTop)
		{
			var insertAfterIndex = bestMatchIndex - 1;
		}
		else
		{
			var insertAfterIndex = bestMatchIndex;
		}
		return insertAfterIndex;
	}
}