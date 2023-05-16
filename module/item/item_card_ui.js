export class ItemCardUI
{
    constructor()
    {
        this.currCard = null;
        this.intentDuration = 333;
        this.timerInterval = 20;
    }

    static bindEvents(whatContainer)
    {
        var itemCards = whatContainer.find(".itemCard");
        itemCards.hover(this.cardOver.bind(this), this.cardOut.bind(this));
        itemCards.mousedown(this.testCardClose.bind(this));
    }

    static cardOver(event)
    {
        this.currCard = $(event.delegateTarget);

        if (this.currCard.hasClass("itemDragging"))
        {
            return;
        }

        this.currCard.overStart = new Date().getTime();
        this.currCard.timer = setTimeout(this.cardOverCounter.bind(this), this.timerInterval);
    }

    static cardOverCounter()
    {
        if (!this.currCard)
        {
            return;
        }

        const timeDiff = new Date().getTime() - this.currCard.overStart;
        if (timeDiff >= this.intentDuration)
        {
            $(this.currCard).addClass("hoverIntent");

            const cardHeight = $(this.currCard).outerHeight();
            const cardDescription = $(this.currCard).find(".cardDescription");
            let descriptionHeight = cardDescription.outerHeight() + 20;

            if (descriptionHeight < 60)
            {
                descriptionHeight = 60;
            }

            const cardDetail = $(this.currCard).find(".cardDetail");

            const popDownData = this.canPopDown(this.currCard, descriptionHeight);

            if (popDownData.heightOverRide)
            {
                descriptionHeight = popDownData.heightOverRide;
                cardDetail.css({"overflow-y": "auto"});
                cardDetail.scrollTop(0);
            }

            if (popDownData.shouldPopDown)
            {
                cardDetail.addClass("popDown");
                cardDetail.css({ top: (cardHeight - 2), height: descriptionHeight});
            }
            else
            {
                cardDetail.addClass("popUp");
                cardDetail.css({ bottom: (cardHeight - 2), height: descriptionHeight});
            }

            clearInterval(this.currCard.timer);
            this.currCard.timer = null;
        }
        else
        {
            this.currCard.timer = setTimeout(this.cardOverCounter.bind(this), this.timerInterval);
        }
    }

    static canPopDown(whatCard, whatDescriptionHeight)
    {
        //console.log("canPopDown(), whatDetailHeight", whatDescriptionHeight);
        var popDownData = {shouldPopDown: true, heightOverRide: null};

        //alert("Patch this function so it understands about the containers.")
        const cardTopPos = $(whatCard).position().top;
        const cardHeight = $(whatCard).outerHeight();

        const parentHeight = $(whatCard).parent().outerHeight();
        const grandparentHeight = $(whatCard).parent().parent().outerHeight();

        const parentHeightOverspill = (cardTopPos + cardHeight + whatDescriptionHeight) - parentHeight;
        const grandparentHeightOverspill = (parentHeight + parentHeightOverspill) - grandparentHeight;

        // We can fit below without increasing any parent heights
        if (parentHeightOverspill < 0)
        {
            //console.log("We can fit below without increasing any parent heights");
            return popDownData;
        }

        // We would cause the grandparent to scroll if we popped down
        if (grandparentHeightOverspill > 0)
        {
            //console.log("We would cause the grandparent to scroll if we popped down");
            const topOverflowAmount = (whatDescriptionHeight - cardTopPos);

            // If we won't overflow out of the top, the just pop up
            if (topOverflowAmount <= 0)
            {
                //console.log("If we won't overflow out of the top, the just pop up. topOverflowAmount: ", topOverflowAmount);
                popDownData.shouldPopDown = false;
                return popDownData;
            }
            else // We will overflow out of the top and bottom, so work out which will happen least and cap the height of the detail
            {
                //console.log("We will overflow out of the top and bottom, so work out which will happen least and cap the height of the detail. topOverflowAmount, grandparentHeightOverspill", topOverflowAmount, grandparentHeightOverspill);
                if (topOverflowAmount < grandparentHeightOverspill)
                {
                    popDownData.heightOverRide = whatDescriptionHeight - topOverflowAmount - 10;
                    popDownData.shouldPopDown = false;
                    //console.log("Top overspill is less, popping up but shrinking height to: " + popDownData.heightOverRide);
                    return popDownData;
                }
                else
                {
                    popDownData.heightOverRide = whatDescriptionHeight - grandparentHeightOverspill - 10;
                    //console.log("Top overspill is more, popping down but shrinking height to: " + popDownData.heightOverRide);
                    return popDownData;
                }
            }
        }

        //console.log("We might increase parent height but won't grandparent scrolling");
        return popDownData;
    }

    static cardOut(event)
    {
        $(this.currCard).removeClass("hoverIntent");
        const cardDetail = $(this.currCard).find(".cardDetail");

        cardDetail.css({ top: "auto", bottom: "auto", height: 0, "overflow-y": "hidden"});
        cardDetail.removeClass("popDown popUp");

        if (this.currCard && this.currCard.timer)
        {
            clearTimeout(this.currCard.timer);
        }

        this.currCard = null;
    }

    static testCardClose(event)
    {
        if ($(event.target).hasClass("stopClose"))
        {
            return;
        }
        else
        {
            this.cardOut(event);
        }
    }
}