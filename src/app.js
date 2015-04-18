/** @jsx React.DOM */

// the animal images array
var imageClasses = 
	[
		"sprite-badger",
		"sprite-bear",
		"sprite-elephant",
		"sprite-fox",
		"sprite-giraff",
		"sprite-kangaroo",
		"sprite-mongoose",
		"sprite-otter",
		"sprite-turtle",
		"sprite-zebra"
	];

// background images behind the board that slowly reveal as the player pairs more and more cards.
var backgroundImageClasses = 
	[
		"jungle-panther-bg",
		"jungle-elephant-bg",
		"fox-bg",
		"bear-bg"
	];

// a small abstraction around sound handling
var SoundEffects = function() {
	var self = this;
	var clickEffect = new Audio();
	clickEffect.src = "/content/sounds/card_flip.mp3";

	var successEffect = new Audio();
	successEffect.src = "/content/sounds/ooweee.mp3";

	self.playClickEffect = function() {
		clickEffect.load();
		clickEffect.play();
	};

	self.playPairedSuccessEffect = function() {
		successEffect.load();
		successEffect.play();
	}

	return self;
};

// a basic construct to represent a card
var card = function(value) {
	var self = this;
	
	self.val = value;
	self.visible = false;
	self.matched = false;

	return self;
};

var CardComponent = React.createClass({
	getInitialState: function() {
		var state = {
			visible: false,
			matched: false,
			val: this.props.card.val
		};

		return state;
	},
	onClickEvent: function() {
		this.props.onCardTouched(this);
	},
	render: function() {
		var currentCard = this.state;


		// lay out the grid to support mobile and desktop views
		var classes = ["col-md-2 col-xs-2", "card"];

		// add the appropriate styling based on state being matched, visible, or hidden.
		if (currentCard.matched) classes.push("matched");
		else if (currentCard.visible) classes.push("face-up");
		else classes.push("face-down");

		var clickHandler = this.onClickEvent;

		var resultClasses = ["result"];
		resultClasses.push(imageClasses[currentCard.val-1]);

		if (!currentCard.matched && currentCard.visible) resultClasses.push("visible-result");
		else resultClasses.push("invisible-result");

		return 	<div className={classes.join(' ')} onClick={clickHandler}>
					<div className={resultClasses.join(' ')}></div>
				</div>
	}
});

var MemoryGame = React.createClass({
	cardsLeft: 0,
	handleWin: function() {
		// play sound or something
	},
	getInitialState: function() {
		var shuffeled = this.getShuffledCards(1,11);
		var rows = this.getRows(shuffeled);
		this.cardsLeft = shuffeled.length;
		return {
			cards: rows,
			visibleCards: [],
			background: _.shuffle(backgroundImageClasses)[0],
			sounds: new SoundEffects()
		}
	},
	onCardTouched: function(card) {
		// we want to not handle the case where the player touches the same card twice, or when two cards are already visible
		// and the player touched another card. in that scenario the player will have to wait for the moment delay for the cards to flip back
		// and for the visibleCards array to be reset.
		if (this.state.visibleCards.indexOf(card) >= 0 || card.state.matched || this.state.visibleCards.length === 2) return;

		this.state.sounds.playClickEffect();
		card.setState({visible: true});

		var allVisibleCards = this.state.visibleCards.concat(card);
		this.setState({
	 		visibleCards: allVisibleCards
		});
	},
	componentDidUpdate: function(){
		// our win scenario is achieved when all cards are flipped.
		if (this.cardsLeft === 0) {
			this.handleWin();
		}
		else {
			var visibleCards = this.state.visibleCards;
			var handlePair = this.handlePair;

			// take moment pause to let the player see the two cards, then hide them again
			if (visibleCards.length === 2) {
				setTimeout(function(){
					handlePair(visibleCards);
				}, 500);
			}
		}
	},
	// when we have a pair, what do we do with it
	handlePair: function(cards) {
		var newState = {};
		// do the two cards match?
		if (cards[0].state.val === cards[1].state.val) {

			// play sound effect
			this.state.sounds.playPairedSuccessEffect();

			// when this hits 0 you win the game.
			this.cardsLeft -=2;
			cards.forEach(function(c){
				newState["matched"] = true;
			});
		} else {
			newState["visible"] = false;
		}
		cards.forEach(function(c){
			c.setState(newState);
		});

		this.setState({visibleCards: []});
	},
	// shuffle and generate pairs
	getShuffledCards: function(low, high) {
		return _.shuffle(_.range(low,high).reduce(function(p,c){
			return p.concat(
				[
					new card(c),
					new card(c)
				]);
		},[]))
	},
	// arrange cards in rows 5x4 so that we can easily lay them out in the grid
	getRows: function(cards) {
		var factors = this.getFactors(cards.length);
		return cards.reduce(function(p,c,i,a) {
			var index = i % factors[1];
			var row = p[index] || [];
			p[index] = row.concat(c);
			return p;
		},[]);
	},
	// this attempts to be a generic way to get the highest two factors (lower than the sqrt) to achieve a balanced layout.
	getFactors: function(number) {
		var factors = _.range(2, Math.sqrt(number) + 2).filter(function(n){
			return number % n == 0;
		});
		return factors.slice(factors.length - 2, factors.length);
	},
	render: function() {
		var onCardTouched = this.onCardTouched;
		var classes = ["board"].concat(this.state.background);

		return 	<div className={classes.join(' ')}>
			   		{this.state.cards.map(function(r) { 
			   			return <div className="row">
									{r.map(function(c){
										return <CardComponent card={c} onCardTouched={onCardTouched} />
									})}
								</div>;
			   		})}
				</div>
	}
});


React.render(<MemoryGame />, document.getElementById('content'));