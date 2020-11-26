

export class ItemCardUI
{
	static currCard = null;
	static intentDuration = 333;
	static timerInterval = 20;

	static bindEvents(whatContainer)
	{
		var itemCards = whatContainer.find(".itemCard");

		itemCards.hover(this.cardOver.bind(this), this.cardOut.bind(this))
	}

	static cardOver(event)
	{
		this.currCard = $(event.delegateTarget);

		this.currCard.overStart = new Date().getTime();
		this.currCard.timer = setInterval(this.cardOverCounter.bind(this), this.timerInterval);

	}

	static cardOverCounter()
	{
		const timeDiff = new Date().getTime() - this.currCard.overStart;
		if (timeDiff >= this.intentDuration)
		{
			$(this.currCard).addClass("hoverIntent");
			
			const cardHeight = $(this.currCard).outerHeight();
			let detailHeight = $(this.currCard).find(".cardDescription").outerHeight() + 20;

			if (detailHeight < 60)
			{
				detailHeight = 60;
			}

			const cardDetail = $(this.currCard).find(".cardDetail");
			
			const popDown = this.getDetailPopDirection(this.currCard, detailHeight);
			
			if (popDown)
			{
				cardDetail.addClass("popDown");
				cardDetail.css({ top: (cardHeight - 2), height: detailHeight});
			}
			else
			{
				cardDetail.addClass("popUp");
				cardDetail.css({ bottom: (cardHeight - 2), height: detailHeight});
			}

			clearInterval(this.currCard.timer);
			this.currCard.timer = null;
		}
	}

	static getDetailPopDirection(whatCard, whatDetailHeight)
	{
		alert("Patch this function so it understands about the containers.")
		const cardTopPos = $(whatCard).position().top;
		const cardHeight = $(whatCard).outerHeight();

		const parentHeight = $(whatCard).parent().outerHeight();

		if ((cardTopPos + cardHeight + whatDetailHeight) >= parentHeight)
		{
			return true;
		}

		return true;
	}

	static cardOut(event)
	{
		$(this.currCard).removeClass("hoverIntent");
		$(this.currCard).find(".cardDetail").height("0px");
		
		if (this.currCard.timer)
		{
			clearInterval(this.currCard.timer);
		}

		this.currCard = null;
	}
}