export class ItemDragSort
{
    static currSourceItem = null;
    static currDragItem = null;
    static currDragContainer = null;
    static currInsertMarker = null;

    static debugOverlay = null;

    static dragClass = "dragContainer";
    static dragBoundsMargin = 5;

    static bestTargetsData = null;

    static minCoordsMatrix = {rows: {}, cols:{}};

    static dragItemTopOffset = null;
    static dragItemLeftOffset = null;

    static globalEventsBound = false;
    static canDrag = false;

    // Show the overlap div's, match types by border and match direction by border.
    static showDebugOverlays = false;

    // Keep the match classes attached after mouse up.
    static persistMatchClasses = true;

    // Whether or not to remove the overlap markers (only applies if debug overlays are on)
    static persistOverlapMarkers = true;

    static bindEvents(whatContainer, whatDraggableClass, allowHorizontalMatches, allowVerticalMatches, displaceTargets, matchHandler, whatItemType)
    {
        if (this.showDebugOverlays)
        {
            whatContainer.addClass("showDebugOverlays");
        }

        whatContainer.addClass(this.dragClass);

        if (allowHorizontalMatches)
        {
            whatContainer.addClass("allowHorizontalMatches");
        }

        if (allowVerticalMatches)
        {
            whatContainer.addClass("allowVerticalMatches");
        }

        if (displaceTargets)
        {
            whatContainer.addClass("displaceTargets");
        }

        whatContainer.data("dragClass", whatDraggableClass);
        whatContainer.data("allowHorizontalMatches", allowHorizontalMatches);
        whatContainer.data("allowVerticalMatches", allowVerticalMatches);
        whatContainer.data("itemType", whatItemType);
        whatContainer[0].matchHandler = matchHandler;


        var items = whatContainer.find(whatDraggableClass);
        items.mousedown(this.itemMouseDown.bind(this));
        items.addClass("draggableItem");

        if (!this.globalEventsBound)
        {
            $("body").mousemove(this.itemContainerMouseMove.bind(this));
            $("body").mouseup(this.itemMouseUp.bind(this));
            this.globalEventsBound = true;
        }

        this.canDrag = true;
    }

    static itemContainerMouseMove(event)
    {
        if (this.currDragItem)
        {
            this.bestTargetsData = null;
            this.updateDragItemCoords(event, false);
            this.showInsertionPosition();
        }
    }

    static itemMouseDown(event)
    {
        if ($(event.target).hasClass("stopDrag") || !this.canDrag)
        {
            return;
        }
        //console.log("itemMouseDown()");
        this.currSourceItem = $(event.delegateTarget);

        this.minCoordsMatrix = {rows: {}, cols:{}};

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
                var insertAfterIndex = this.getInsertData(true).insertIndex;

                if (insertAfterIndex || insertAfterIndex === 0)
                {
                    insertAfterIndex = Math.max(insertAfterIndex, 0);
                    var itemType = this.currDragContainer.data("itemType");
                    var matchHandler = this.currDragContainer[0].matchHandler;
                    triggerUpdate = true;
                }
            }

            this.bestTargetsData = null;

            this.currSourceItem.removeClass("itemDragging");
            this.currDragContainer.removeClass("dragContainerActive");

            this.currDragItem.remove();
            if (this.currInsertMarker)
            {
                this.currInsertMarker.remove();
            }

            if (!this.persistOverlapMarkers)
            {
                var overlapDebugs = this.currDragContainer.find(".dragOverlapDebug");
                overlapDebugs.remove();
            }

            if (!this.persistMatchClasses)
            {
                var matchingTargets = this.currDragContainer.find(".matchingTarget");
                matchingTargets.removeClass("matchingTarget bestMatchingTarget secondBestMatchingTarget dragOverlapFromTop dragOverlapFromBottom dragOverlapFromLeft dragOverlapFromRight");
            }

            this.currSourceItem = null;
            this.currDragItem = null;
            this.currDragContainer = null;
            this.currInsertMarker = null;

            this.dragItemTopOffset = null;
            this.dragItemLeftOffset = null;

            //console.log("this.minCoordsMatrix: ", this.minCoordsMatrix);

            this.minCoordsMatrix = {rows: {}, cols:{}};

            if (triggerUpdate)
            {
                this.canDrag = false;
                await this.triggerMatchHandler(matchHandler, itemIndex, insertAfterIndex, itemType);
                this.canDrag = true;
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

        let normalisedTop = 0;
        let normalisedLeft = 0;
        if (isInitialUpdate)
        {
            normalisedTop = offsets.container.top;
            normalisedLeft = offsets.container.left + 5;

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

            normalisedTop = baseCoords.top;
            normalisedLeft = baseCoords.left;
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
            var item = $(whatPossibleTargets[index]);
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
        var matchingTargets = [];
        whatPossibleTargets.each((index) =>
        {
            let currPossible = $(whatPossibleTargets[index]);
            var overlapData = this.getOverlapData(this.currDragItem, currPossible);

            if (this.showDebugOverlays)
            {
                this.showMatchDebugOverlay(overlapData, currPossible);
            }
            this.showDirectionDebugOverlay(overlapData, currPossible);

            if (overlapData.overlapVolume > 0)
            {
                overlapData.element = currPossible;
                overlapData.index = index;

                currPossible.addClass("matchingTarget");

                matchingTargets.push(overlapData);
            }
        });

        return matchingTargets;
    }

    static getOverlapData(dragItem, possibleTarget)
    {
        let l1 = dragItem.offset().left;
        let t1 = dragItem.offset().top;
        let w1 = dragItem.outerWidth() - 2;
        let h1 = dragItem.outerHeight() - 2;

        let l2 = possibleTarget.offset().left;
        let t2 = possibleTarget.offset().top;
        let w2 = possibleTarget.outerWidth() - 2;
        let h2 = possibleTarget.outerHeight() - 2;

        let globalTop = Math.max(t1,t2);
        let globalLeft = (l2>l1 && l2<(l1+w1)) ? l2 : (l1>l2 && l1<(l2+w2)) ? l1 : 0;

        let dragAreaTop = globalTop - this.currDragContainer.offset().top;
        let dragAreaLeft = globalLeft - this.currDragContainer.offset().left;

        let possibleTargetTop = globalTop - t2;
        let possibleTargetLeft = globalLeft - l2;

        let width = Math.max(Math.min(l1+w1,l2+w2) - Math.max(l1,l2),0);
        let height = Math.max(Math.min(t1+h1,t2+h2) - Math.max(t1,t2),0);

        let overlapData = new OverlapData(
            {
                globalTop: globalTop,
                globalLeft: globalLeft,

                dragAreaTop: dragAreaTop,
                dragAreaLeft: dragAreaLeft,

                possibleTargetTop: possibleTargetTop,
                possibleTargetLeft: possibleTargetLeft,

                width: width,
                height: height
            });

        this.addVolumeData(overlapData, w2, h2);
        this.addDirectionData(overlapData, l1, t1, w1, h1, l2, t2, w2, h2);

        this.checkMinCoords(l2, t2, w2, h2);

        return overlapData;
    }

    static addVolumeData(whatOverlapData, possibleTargetWidth, possibleTargetHeight)
    {
        let overlapVolume = whatOverlapData.width * whatOverlapData.height;
        let targetVolume = possibleTargetWidth * possibleTargetHeight;
        let percentageVolume = (overlapVolume / targetVolume) * 100;

        whatOverlapData.verticalPercent = (whatOverlapData.height / possibleTargetHeight) * 100;
        whatOverlapData.horizontalPercent = (whatOverlapData.width / possibleTargetWidth) * 100;

        whatOverlapData.overlapVolume = overlapVolume;
        whatOverlapData.percentageVolume = percentageVolume;
    }

    static addDirectionData(whatOverlapData, l1, t1, w1, h1, l2, t2, w2, h2)
    {
        let centeredCoords = this.getCenteredCoords(l1, t1, w1, h1, l2, t2, w2, h2);

        if (centeredCoords.l1 > centeredCoords.l2)
        {
            whatOverlapData.fromLeft = false;
            whatOverlapData.fromRight = true;
        }
        else if (centeredCoords.l1 < centeredCoords.l2)
        {
            whatOverlapData.fromLeft = true;
            whatOverlapData.fromRight = false;
        }
        else
        {
            whatOverlapData.fromLeft = true;
            whatOverlapData.fromRight = true;
        }

        if (centeredCoords.t1 > centeredCoords.t2)
        {
            whatOverlapData.fromAbove = false;
            whatOverlapData.fromBelow = true;
        }
        else if (centeredCoords.t1 < centeredCoords.t2)
        {
            whatOverlapData.fromAbove = true;
            whatOverlapData.fromBelow = false;
        }
        else
        {
            whatOverlapData.fromAbove = true;
            whatOverlapData.fromBelow = true;
        }
    }

    static getCenteredCoords(l1, t1, w1, h1, l2, t2, w2, h2)
    {
        let centeredCoords =
        {
            l1: l1 + (w1 / 2),
            t1: t1 + (h1 / 2),

            l2: l2 + (w2 / 2),
            t2: t2 + (h2 / 2)
        };

        return centeredCoords;
    }

    static showMatchDebugOverlay(whatOverlapData, whatPossibleTarget)
    {
        var debugOverlay = whatPossibleTarget.find(".dragOverlapDebug");
        if (debugOverlay.length == 0)
        {
            debugOverlay = $("<div class='dragOverlapDebug'></div>");
            whatPossibleTarget.append(debugOverlay);
        }

        let debugOverlayTitle = this.generateDebugTitle(whatOverlapData);
        debugOverlay.attr("title", debugOverlayTitle);

        debugOverlay.css({top: whatOverlapData.possibleTargetTop, left: whatOverlapData.possibleTargetLeft, width: whatOverlapData.width, height: whatOverlapData.height});
    }

    static generateDebugTitle(whatOverlapData)
    {
        var titleTextArray = [];
        for (var key in whatOverlapData)
        {
            titleTextArray.push(key + ": " + whatOverlapData[key]);
        }

        return titleTextArray.join("\n");
    }

    static showDirectionDebugOverlay(whatOverlapData, whatPossibleTarget)
    {
        whatPossibleTarget.removeClass("dragOverlapFromTop dragOverlapFromBottom dragOverlapFromLeft dragOverlapFromRight");

        if (whatOverlapData.fromAbove)
        {
            whatPossibleTarget.addClass("dragOverlapFromTop");
        }
        if (whatOverlapData.fromBelow)
        {
            whatPossibleTarget.addClass("dragOverlapFromBottom");
        }

        if (whatOverlapData.fromLeft)
        {
            whatPossibleTarget.addClass("dragOverlapFromLeft");
        }
        if (whatOverlapData.fromRight)
        {
            whatPossibleTarget.addClass("dragOverlapFromRight");
        }
    }

    static checkMinCoords(possibleTargetLeft, possibleTargetTop, possibleTargetWidth, possibleTargetHeight)
    {
        this.setMinRowCoords(possibleTargetLeft, possibleTargetTop, possibleTargetWidth);
        this.setMinColumnCoords(possibleTargetTop, possibleTargetLeft, possibleTargetHeight);
    }

    static setMinRowCoords(possibleTargetLeft, possibleTargetTop, possibleTargetWidth)
    {
        if (!this.minCoordsMatrix.rows[possibleTargetTop])
        {
            this.minCoordsMatrix.rows[possibleTargetTop] = {left: Infinity, right: 0};
        }

        // We're after the lowest possible left value in this row
        if (this.minCoordsMatrix.rows[possibleTargetTop].left > possibleTargetLeft)
        {
            this.minCoordsMatrix.rows[possibleTargetTop].left = possibleTargetLeft;
        }

        // And the highest right edge
        var rightEdge = possibleTargetLeft + possibleTargetWidth;
        if (rightEdge > this.minCoordsMatrix.rows[possibleTargetTop].right)
        {
            this.minCoordsMatrix.rows[possibleTargetTop].right = rightEdge;
        }
    }

    static setMinColumnCoords(possibleTargetTop, possibleTargetLeft, possibleTargetHeight)
    {
        if (!this.minCoordsMatrix.cols[possibleTargetLeft])
        {
            this.minCoordsMatrix.cols[possibleTargetLeft] = {top: Infinity, bottom: 0};
        }

        // We're after the lowest possible top value in this column
        if (this.minCoordsMatrix.cols[possibleTargetLeft].top > possibleTargetTop)
        {
            this.minCoordsMatrix.cols[possibleTargetLeft].top = possibleTargetTop;
        }

        // And the highest bottom edge
        var bottomEdge = possibleTargetTop + possibleTargetHeight;
        if (bottomEdge > this.minCoordsMatrix.cols[possibleTargetLeft].bottom)
        {
            this.minCoordsMatrix.cols[possibleTargetLeft].bottom = bottomEdge;
        }
    }

    static getBestMatch(whatTargets)
    {
        // console.group("Getting best match");
        var highestPercent = 0;
        var bestMatch = null;
        var currTarget = null;

        var count = 0;
        while (count < whatTargets.length)
        {
            currTarget = whatTargets[count];

            // console.log("currTarget.percentageVolume: " + currTarget.percentageVolume + ", highestPercent:" + highestPercent);
            if (currTarget.percentageVolume > highestPercent)
            {
                // console.log("Increase on previous, updating best match");
                bestMatch = currTarget;
                highestPercent = currTarget.percentageVolume;
            }
            count++;
        }
        // console.groupEnd();

        if (bestMatch)
        {
            this.addEdgemostData(bestMatch);
            this.checkDirectionOverride(bestMatch);

            if (this.showDebugOverlays)
            {
                var debugOverlay = bestMatch.element.find(".dragOverlapDebug");
                let debugOverlayTitle = "BEST!\n\n" + this.generateDebugTitle(bestMatch);
                debugOverlay.attr("title", debugOverlayTitle);
            }
        }

        return bestMatch;
    }

    static addEdgemostData(whatOverlapData)
    {
        let leftEdge = whatOverlapData.element.offset().left;
        let topEdge = whatOverlapData.element.offset().top;
        let rightEdge = leftEdge + whatOverlapData.element.outerWidth() - 2;
        let bottomEdge = topEdge + whatOverlapData.element.outerHeight() - 2;

        if (leftEdge == this.minCoordsMatrix.rows[topEdge].left)
        {
            whatOverlapData.isLeftmost = true;
        }
        if (rightEdge == this.minCoordsMatrix.rows[topEdge].right)
        {
            whatOverlapData.isRightmost = true;
        }

        if (topEdge == this.minCoordsMatrix.cols[leftEdge].top)
        {
            whatOverlapData.isTopmost = true;
        }
        if (bottomEdge == this.minCoordsMatrix.cols[leftEdge].bottom)
        {
            whatOverlapData.isBottommost = true;
        }
    }

    // Check to see if we're an edge and the drag item is between us and the edge.
    // If so, we assume the user is trying to fit inbetween us and the edge and mark
    // an override to stop 2nd best and direction sensing from coming into play.
    static checkDirectionOverride(bestMatchData)
    {
        if (bestMatchData.isLeftmost && this.currDragItem.offset().left < bestMatchData.element.offset().left)
        {
            bestMatchData.forceToLeft = true;
        }

        var dragRightEdge = this.currDragItem.offset().left + this.currDragItem.outerWidth() - 2;
        var overlapElementRightEdge = bestMatchData.element.offset().left + bestMatchData.element.outerWidth() - 2;
        if (bestMatchData.isRightmost && dragRightEdge > overlapElementRightEdge)
        {
            bestMatchData.forceToRight = true;
        }

        if (bestMatchData.isTopmost && this.currDragItem.offset().top < bestMatchData.element.offset().top)
        {
            bestMatchData.forceToTop = true;
        }

        var dragBottomEdge = this.currDragItem.offset().top + this.currDragItem.outerHeight() - 2;
        var overlapElementBottomEdge = bestMatchData.element.offset().top + bestMatchData.element.outerHeight() - 2;
        if (bestMatchData.isBottommost && dragBottomEdge > overlapElementBottomEdge)
        {
            bestMatchData.forceToBottom = true;
        }
    }

    // Can return null, which means the match is from the outside of the grid. Marker
    // will be based on match direction of best match only.
    static getSecondBestMatch(whatBestMatch, whatOtherMatches)
    {
        var secondBestMatch = null;
        var currMatch = null;
        var isValidDirection = false;
        var bestMatchPercentage = 0;
        var validMatchDirections = this.getValidMatchDirections(whatBestMatch);

        var count = 0;
        while (count < whatOtherMatches.length)
        {
            currMatch = whatOtherMatches[count];
            isValidDirection = this.checkMatchDirection(whatBestMatch, currMatch, validMatchDirections);
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

    static checkMatchDirection(whatBestMatch, currMatch, whatValidDirections)
    {
        if ((currMatch.fromLeft && whatValidDirections.fromLeft) ||
            (currMatch.fromRight && whatValidDirections.fromRight) ||
            (currMatch.fromTop && whatValidDirections.fromTop) ||
            (currMatch.fromBottom && whatValidDirections.fromBottom))
        {
            // If we're a horizontal match, but on different rows, we're not valid.
            if ((currMatch.fromLeft || currMatch.fromRight) && whatBestMatch.globalTop != currMatch.globalTop)
            {
                return false;
            }

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
        };

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
            if (whatTargets.bestMatch.horizontalPercent > whatTargets.bestMatch.verticalPercent)
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
        var insertMarkerAfterIndex = this.getMarkerInsertionIndex();
        var currDragIndex = this.currDragItem.data("itemIndex");
        //console.log("insertAfterIndex: " + insertAfterIndex + ", currDragIndex: " + currDragIndex);

        if (!this.bestTargetsData.bestMatch || currDragIndex == insertMarkerAfterIndex || (currDragIndex - 1) == insertMarkerAfterIndex)
        {
            this.currDragContainer.removeClass("validDropFound");
            this.removeInsertMarker();
        }
        else
        {
            this.currDragContainer.addClass("validDropFound");
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
        var cssData = this.getInsertData().css;

        if (!this.currInsertMarker)
        {

            let directionClass = "verticalInsert";
            if (this.bestTargetsData.isHorizontal)
            {
                directionClass = "horizontalInsert";
            }

            this.currInsertMarker = $("<div class='itemInsertMarker " + directionClass + "'><span class='insertIcon'></span></div>");

            this.currDragContainer.append(this.currInsertMarker);
        }

        this.currInsertMarker.css(cssData);
    }

    static getInsertData(logResults)
    {
        var insertIndex = null;
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

            if (secondBestTargetOffsets && (!this.bestTargetsData.bestMatch.forceToLeft && !this.bestTargetsData.bestMatch.forceToRight))
            {
                if (logResults)
                    console.log("Has 2nd best");

                if (this.bestTargetsData.bestMatch.fromRight)
                {
                    if (logResults)
                        console.log("From right");
                    markerCSS.left = bestTargetOffsets.left + this.bestTargetsData.bestMatch.element.outerWidth() + 5;
                    markerCSS.width = (secondBestTargetOffsets.left + 5) - markerCSS.left;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex") + 1;
                }
                else
                {
                    if (logResults)
                        console.log("From left");
                    markerCSS.left = secondBestTargetOffsets.left + this.bestTargetsData.secondBestMatch.element.outerWidth() + 5;
                    markerCSS.width = (bestTargetOffsets.left + 5) - markerCSS.left;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex");
                }
            }
            else
            {
                if (logResults)
                    console.log("NO 2nd best");
                if ((this.bestTargetsData.bestMatch.fromRight || this.bestTargetsData.bestMatch.forceToRight) && (!this.bestTargetsData.bestMatch.forceToLeft))
                {

                    if (logResults)
                        console.log("From right");
                    markerCSS.left = bestTargetOffsets.left + this.bestTargetsData.bestMatch.element.outerWidth() + 5;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex") + 1;
                }
                else
                {

                    if (logResults)
                        console.log("From left");
                    markerCSS.left = (bestTargetOffsets.left + 5) - 10;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex");
                }
            }
        }
        else
        {
            markerCSS.left = bestTargetOffsets.left + 5;
            markerCSS.width = this.bestTargetsData.bestMatch.element.outerWidth();

            if (secondBestTargetOffsets && (!this.bestTargetsData.bestMatch.forceToTop && !this.bestTargetsData.bestMatch.forceToBottom))
            {
                if (this.bestTargetsData.bestMatch.fromBottom)
                {
                    markerCSS.top = bestTargetOffsets.top + this.bestTargetsData.bestMatch.element.outerHeight() + 5;
                    markerCSS.height = (secondBestTargetOffsets.top + 5) - markerCSS.top;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex") + 1;
                }
                else
                {
                    markerCSS.top = secondBestTargetOffsets.top + this.bestTargetsData.secondBestMatch.element.outerHeight() + 5;
                    markerCSS.height = (bestTargetOffsets.top + 5) - markerCSS.top;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex");
                }
            }
            else
            {
                if (this.bestTargetsData.bestMatch.fromBottom || !this.bestTargetsData.bestMatch.forceToBottom)
                {
                    markerCSS.top = bestTargetOffsets.top + this.bestTargetsData.bestMatch.element.outerHeight() + 5;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex") + 1;
                }
                else
                {
                    markerCSS.top = (bestTargetOffsets.top + 5) - 10;
                    insertIndex = this.bestTargetsData.bestMatch.element.data("itemIndex");
                }
            }
        }

        var returnData =
        {
            insertIndex: insertIndex,
            css: markerCSS
        };

        return returnData;
    }

    static getMarkerInsertionIndex()
    {
        if (!this.bestTargetsData.bestMatch)
        {
            return this.currDragItem.data("itemIndex");
        }

        var bestMatchIndex = this.bestTargetsData.bestMatch.element.data("itemIndex");

        let insertAfterIndex = bestMatchIndex;
        if (this.bestTargetsData.bestMatch.fromLeft || this.bestTargetsData.bestMatch.fromTop)
        {
            insertAfterIndex = bestMatchIndex - 1;
        }
        return insertAfterIndex;
    }
}

class OverlapData
{
    constructor(data)
    {
        this.globalTop = data.globalTop;
        this.globalLeft = data.globalLeft;

        this.dragAreaTop = data.dragAreaTop;
        this.dragAreaLeft = data.dragAreaLeft;

        this.possibleTargetTop = data.possibleTargetTop;
        this.possibleTargetLeft = data.possibleTargetLeft;

        this.width = data.width;
        this.height = data.height;

        this.verticalPercent = null;
        this.horizontalPercent = null;

        this.overlapVolume = null;
        this.percentageVolume = null;

        this.fromLeft = null;
        this.fromRight = null;
        this.fromAbove = null;
        this.fromBelow = null;

        this.isLeftmost = null;
        this.isRightmost = null;
        this.isTopmost = null;
        this.isBottommost = null;

        this.forceToLeft = null;
        this.forceToRight = null;
        this.forceToTop = null;
        this.forceToBottom = null;
    }
}