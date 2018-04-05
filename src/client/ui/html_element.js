// Copyright (c) 2013-2016 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.
/*global $, jQuery */
/*eslint no-invalid-this:off */   // event handlers set 'this'

(function() {
	"use strict";

	var browser = require("./browser.js");
	var failFast = require("fail_fast.js");
	var HtmlCoordinate = require("./html_coordinate.js");

	/* Constructors */

	var HtmlElement = module.exports = function(domElement) {
		var self = this;

		self._domElement = domElement;
		self._element = $(domElement);
		self._dragDefaultsPrevented = false;
	};

	HtmlElement.fromHtml = function(html) {
		return new HtmlElement($(html)[0]);
	};

	HtmlElement.appendHtmlToBody = function(html) {
		var element = HtmlElement.fromHtml(html);
		element.appendSelfToBody();
		return element;
	};

	HtmlElement.fromId = function(id) {
		var domElement = document.getElementById(id);
		failFast.unlessTrue(domElement !== null, "could not find element with id '" + id + "'");
		return new HtmlElement(domElement);
	};

	HtmlElement.fromSelector = function(selector) {
		return $(selector).map(function(index, domElement) {
			return new HtmlElement(domElement);
		}).get();
	};

	/* General event handling */

	HtmlElement.prototype.removeAllEventHandlers = function() {
		this._element.off();
	};

	HtmlElement.prototype.preventBrowserDragDefaults = function() {
		this._element.on("selectstart", preventDefaults);
		this._element.on("mousedown", preventDefaults);
		this._element.on("touchstart", preventDefaults);

		this._dragDefaultsPrevented = true;

		function preventDefaults(event) {
			event.preventDefault();
		}
	};

	HtmlElement.prototype.isBrowserDragDefaultsPrevented = function() {
		return this._dragDefaultsPrevented;
	};

	/* Mouse events */
	HtmlElement.prototype.triggerMouseClick = triggerMouseEventFn("click");
	HtmlElement.prototype.triggerMouseDown = triggerMouseEventFn("mousedown");
	HtmlElement.prototype.triggerMouseMove = triggerMouseEventFn("mousemove");
	HtmlElement.prototype.triggerMouseLeave = triggerMouseEventFn("mouseleave");
	HtmlElement.prototype.triggerMouseUp = triggerMouseEventFn("mouseup");

	HtmlElement.prototype.onMouseClick = onMouseEventFn("click");
	HtmlElement.prototype.onMouseDown = onMouseEventFn("mousedown");
	HtmlElement.prototype.onMouseMove = onMouseEventFn("mousemove");
	HtmlElement.prototype.onMouseLeave = onMouseEventFn("mouseleave");
	HtmlElement.prototype.onMouseUp = onMouseEventFn("mouseup");

	function triggerMouseEventFn(event) {
		return function(parm1, parm2) {
			var coordinate;
			if (parm1 === undefined && parm2 === undefined) {
				// no parameters, assume no coordinate
				coordinate = HtmlCoordinate.fromPageOffset(0, 0);
			}
			else if (parm1 !== undefined && parm2 === undefined) {
				// one HtmlCoordinate parameter
				coordinate = parm1;
			}
			else {
				// (x, y) coordinate as numbers relative to this element
				coordinate = HtmlCoordinate.fromRelativeOffset(this, parm1, parm2);
			}

			sendMouseEvent(this, event, coordinate.toPageOffset());
		};
	}

	function onMouseEventFn(event) {
		return function(callback) {
			this._element.on(event, function(event) {
				callback(HtmlCoordinate.fromPageOffset(event.pageX, event.pageY));
			});
		};
	}

	function sendMouseEvent(self, event, pageCoords) {
		var jqElement = self._element;

		var eventData = new jQuery.Event();
		eventData.pageX = pageCoords.x;
		eventData.pageY = pageCoords.y;
		eventData.type = event;
		jqElement.trigger(eventData);
	}


	/* Touch events */

	HtmlElement.prototype.triggerTouchEnd = triggerZeroTouchEventFn("touchend");
	HtmlElement.prototype.triggerTouchCancel = triggerZeroTouchEventFn("touchcancel");
	HtmlElement.prototype.triggerSingleTouchStart = triggerSingleTouchEventFn("touchstart");
	HtmlElement.prototype.triggerSingleTouchMove = triggerSingleTouchEventFn("touchmove");
	HtmlElement.prototype.triggerMultiTouchStart = triggerMultiTouchEventFn("touchstart");

	HtmlElement.prototype.onTouchEnd = onZeroTouchEventFn("touchend");
	HtmlElement.prototype.onTouchCancel = onZeroTouchEventFn("touchcancel");
	HtmlElement.prototype.onSingleTouchStart = onSingleTouchEventFn("touchstart");
	HtmlElement.prototype.onSingleTouchMove = onSingleTouchEventFn("touchmove");
	HtmlElement.prototype.onMultiTouchStart = onMultiTouchEventFn("touchstart");


	function triggerZeroTouchEventFn(event) {
		return function() {
			sendTouchEvent(this, event, []);
		};
	}

	function triggerSingleTouchEventFn(event) {
		return function(parm1, parm2) {
			var coordinate;
			if (parm1 === undefined && parm2 === undefined) {
				// no parameters, assume no coordinate
				coordinate = HtmlCoordinate.fromPageOffset(0, 0);
			}
			else if (parm1 !== undefined && parm2 === undefined) {
				// one HtmlCoordinate parameter
				coordinate = parm1;
			}
			else {
				// (x, y) coordinate as numbers relative to this element
				coordinate = HtmlCoordinate.fromRelativeOffset(this, parm1, parm2);
			}

			var touch = createTouch(this, coordinate);
			sendTouchEvent(this, event, [ touch ]);
		};
	}

	function triggerMultiTouchEventFn(event) {
		return function(parm1, parm2, parm3, parm4) {
			var coordinate1;
			var coordinate2;
			if (parm1 === undefined && parm2 === undefined && parm3 === undefined && parm4 === undefined) {
				// no parameters, assume no coordinates
				coordinate1 = HtmlCoordinate.fromPageOffset(0, 0);
				coordinate2 = HtmlCoordinate.fromPageOffset(0, 0);
			}
			else if (parm1 !== undefined && parm2 !== undefined && parm3 === undefined && parm4 === undefined) {
				// two HtmlCoordinate parameters
				coordinate1 = parm1;
				coordinate2 = parm2;
			}
			else {
				// two (x, y) coordinates as numbers relative to this element
				coordinate1 = HtmlCoordinate.fromRelativeOffset(this, parm1, parm2);
				coordinate2 = HtmlCoordinate.fromRelativeOffset(this, parm3, parm4);
			}

			var touch1 = createTouch(this, coordinate1);
			var touch2 = createTouch(this, coordinate2);
			sendTouchEvent(this, event, [ touch1, touch2 ]);
		};
	}


	function onZeroTouchEventFn(event) {
		return function(callback) {
			this._element.on(event, function() {
				callback();
			});
		};
	}

	function onSingleTouchEventFn(eventName) {
		return function(callback) {
			this._element.on(eventName, function(event) {
				var originalEvent = event.originalEvent;
				if (originalEvent.touches.length !== 1) return;

				var pageX = originalEvent.touches[0].pageX;
				var pageY = originalEvent.touches[0].pageY;

				callback(HtmlCoordinate.fromPageOffset(pageX, pageY));
			});
		};
	}

	function onMultiTouchEventFn(event) {
		return function(callback) {
			var self = this;
			this._element.on(event, function(event) {
				var originalEvent = event.originalEvent;
				if (originalEvent.touches.length !== 1) callback();
			});
		};
	}

	function sendTouchEvent(self, eventType, touchesToSend) {
		var touchEvent = document.createEvent("TouchEvent");

		var touchList;
		if (touchesToSend.length === 0) touchList = document.createTouchList();
		else if (touchesToSend.length === 1) touchList = document.createTouchList(touchesToSend[0]);
		else if (touchesToSend.length === 2) touchList = document.createTouchList(touchesToSend[0], touchesToSend[1]);
		else failFast.unreachable("Too many touchesToSend: " + touchesToSend.length);

		var canBubble = true;
		var cancelable = true;
		var view = window;
		var detail = null;    // not sure what this is
		var screenX = 0;
		var screenY = 0;
		var clientX = 0;
		var clientY = 0;
		var ctrlKey = false;
		var altKey = false;
		var shiftKey = false;
		var metaKey = false;
		var touches = touchList;
		var targetTouches = touchList;
		var changedTouches = touchList;
		var scale = 1;
		var rotation = 0;

		if (browser.supportsTouchEventConstructor()) {
			touchEvent = new TouchEvent(eventType, {
				// Event options
				bubbles: canBubble,
				cancelable: cancelable,

				// UIEvent options
				detail: detail,
				view: view,

				// TouchEvent options
				touches: touches,
				targetTouches: targetTouches,
				changedTouches: changedTouches,
				ctrlKey: ctrlKey,
				altKey: altKey,
				shiftKey: shiftKey,
				metaKey: metaKey
			});
		}
		else if (browser.usesAndroidInitTouchEventParameterOrder()) {
			touchEvent.initTouchEvent(
				touches, targetTouches, changedTouches,
				eventType,
				view,
				screenX, screenY,
				clientX, clientY,
				ctrlKey, altKey, shiftKey, metaKey
			);
		}
		else {
			touchEvent.initTouchEvent(
				eventType,
				canBubble,
				cancelable,
				view,
				detail,
				screenX, screenY,
				clientX, clientY,
				ctrlKey, altKey, shiftKey, metaKey,
				touches, targetTouches, changedTouches,
				scale, rotation
			);
		}

		var eventData = new jQuery.Event("event");
		eventData.type = eventType;
		eventData.originalEvent = touchEvent;
		self._element.trigger(eventData);
	}

	function createTouch(self, coordinate) {
		var offset = coordinate.toPageOffset();

		var view = window;
		var target = self._element[0];
		var identifier = 0;
		var pageX = offset.x;
		var pageY = offset.y;
		var screenX = 0;
		var screenY = 0;

		return document.createTouch(view, target, identifier, pageX, pageY, screenX, screenY);
	}


	/* Position and Dimensions */

	HtmlElement.prototype.getPosition = function() {
		return HtmlCoordinate.fromRelativeOffset(this, 0, 0);
	};

	HtmlElement.prototype.setAbsolutePosition = function(coordinate) {
		var offset;

		var offsetParent = this.toDomElement().offsetParent;
		if (offsetParent === document.body && !isPositioned(document.body)) {
			offset = coordinate.toPageOffset();
		}
		else {
			var positionedParent = new HtmlElement(offsetParent);
			offset = coordinate.toRelativeOffset(positionedParent);
		}

		var style = this.toDomElement().style;
		style.position = "absolute";
		style.top = offset.y + "px";
		style.left = offset.x + "px";

		function isPositioned(element) {
			var position = element.style.position;
			return position === "relative" || position === "fixed" || position === "absolute";
		}
	};

	HtmlElement.prototype.getDimensions = function() {
		return {
			width: this._element.width(),
			height: this._element.height()
		};
	};


	/* DOM Manipulation */

	HtmlElement.prototype.append = function(elementToAppend) {
		this._element.append(elementToAppend._element);
	};

	HtmlElement.prototype.appendSelfToBody = function() {
		$(document.body).append(this._element);
	};

	HtmlElement.prototype.remove = function() {
		this._element.remove();
	};

	HtmlElement.prototype.toDomElement = function() {
		return this._element[0];
	};


	/* Equality */

	HtmlElement.prototype.equals = function(that) {
		failFast.unlessTrue(that instanceof HtmlElement, "Tried to compare HtmlElement to non-HtmlElement: [" + that + "]");

		return this.toDomElement() === that.toDomElement();
	};

}());