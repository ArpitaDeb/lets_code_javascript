// Copyright (c) 2014 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
(function() {
	"use strict";

	var assert = require("_assert");
	var cssHelper = require("./_css_test_helper.js");
	var quixote = require("./vendor/quixote-0.9.0.js");

	describe("CSS: Home page", function() {
		var frame;
		var page;
		var viewport;

		var logo;
		var tagline;
		var drawingAreaArrow;
		var drawingArea;
		var clearButton;
		var footer;
		var footerText;
		var joinUs;

		before(function(done) {
			/*eslint no-invalid-this:off */
			this.timeout(10 * 1000);
			var options = {
				src: "/base/src/client/content/index.html",
				width: cssHelper.IOS_BROWSER_WIDTH,
				height: cssHelper.IPAD_LANDSCAPE_HEIGHT_WITH_BROWSER_TABS
			};
			frame = quixote.createFrame(options, done);
		});

		after(function() {
			frame.remove();
		});

		beforeEach(function() {
			frame.reset();

			page = frame.page();
			viewport = frame.viewport();

			logo = frame.get("#logo");
			tagline = frame.get("#tagline");
			drawingAreaArrow = frame.get("#drawing-area-arrow");
			drawingArea = frame.get("#drawing-area");
			clearButton = frame.get("#clear-button");
			footer = frame.get("#footer");
			footerText = frame.get("#footer-text");
			joinUs = frame.get("#join-us");
		});

		it("fits perfectly within viewport", function() {
			page.assert({
				width: viewport.width,
				height: viewport.height
			}, "page should not be larger than viewport");

			joinUs.assert({
				bottom: viewport.bottom.minus(13)
			}, "bottom element should fit against bottom of viewport");
		});

		it("has a nice margin when viewport is smaller than the page", function() {
			frame.resize(100, 100);

			joinUs.assert({
				bottom: page.bottom.minus(13)
			}, "bottom element should have a nice margin before the bottom of the page");
		});

		it("has an overall layout", function() {
			logo.assert({
				center: page.center,
				top: 12
			}, "logo should be centered at top of page");
			assert.equal(cssHelper.textAlign(logo), "center", "logo text should be centered");
			tagline.assert({
				center: page.center,
				top: logo.bottom.plus(5)
			}, "tagline should be centered directly below logo");
			assert.equal(cssHelper.textAlign(tagline), "center", "tagline text should be centered");
			drawingArea.assert({
				center: page.center,
				top: tagline.bottom.plus(10),
				width: page.width
			}, "drawing area should be centered below tagline");

			footer.assert({
				center: page.center,
				top: drawingArea.bottom.plus(13)
			}, "footer should be centered below drawing area");
			assert.equal(cssHelper.textAlign(footer), "center", "footer text should be centered");
			joinUs.assert({
				center: page.center,
				top: footer.bottom.plus(13),
				height: 35
			}, "join us button should be centered below footer");
		});

		it("has flourishes inside drawing area", function() {
			drawingAreaArrow.assert({
				center: drawingArea.center,
				top: drawingArea.top
			}, "drawing area should have an arrow centered at the top");

			drawingAreaArrow.assert({
				height: 9
			}, "drawing area arrow should be same height as arrow gif");

			assert.equal(cssHelper.under(drawingAreaArrow, drawingArea), false, "drawing area arrow should be over drawing area");
			assert.equal(cssHelper.backgroundImage(drawingAreaArrow), "/images/arrow.png", "drawing area arrow is an image");
			assert.equal(drawingAreaArrow.getRawStyle("background-repeat"), "no-repeat", "drawing arrow is drawn once");
			assert.equal(cssHelper.backgroundPosition(drawingAreaArrow), "center", "drawing area arrow image is centered");
			clearButton.assert({
				top: drawingArea.top.plus(15),
				right: drawingArea.right.minus(15),
				height: 30,
				width: 70
			}, "clear screen button should be centered at top-right of drawing area");

			assert.equal(cssHelper.under(clearButton, drawingArea), false, "clear button should be over drawing area");
		});

		it("has a color scheme", function() {
			assert.equal(cssHelper.backgroundColor(frame.body()), cssHelper.BACKGROUND_BLUE, "page background should be light blue");
			assert.equal(cssHelper.textColor(logo), cssHelper.WHITE, "logo text should be white");
			assert.equal(cssHelper.textColor(tagline), cssHelper.DARK_BLUE, "tagline should be dark blue");
			assert.equal(cssHelper.backgroundColor(drawingArea), cssHelper.WHITE, "drawing area should be white");
			assert.equal(cssHelper.textColor(footerText), cssHelper.WHITE, "footer should be white");
			assert.equal(cssHelper.textColor(clearButton), cssHelper.DARK_GRAY, "clear button background should be dark gray");
			assert.equal(cssHelper.backgroundColor(clearButton), cssHelper.GRAY, "clear button text should be medium gray");
			assert.equal(cssHelper.backgroundColor(joinUs), cssHelper.MEDIUM_BLUE, "join us button background should be medium blue");
			assert.equal(cssHelper.textColor(joinUs), cssHelper.WHITE, "join us button text should be white");
		});

		it("has a typographic scheme", function() {
			assert.equal(cssHelper.fontFamily(logo), cssHelper.STANDARD_FONT, "logo font");
			assert.equal(cssHelper.fontWeight(logo), cssHelper.HEADLINE_WEIGHT, "logo weight");
			assert.equal(cssHelper.fontSize(logo), "30px", "logo font size");
			logo.assert({ height: 30 }, "logo height");

			assert.equal(cssHelper.fontFamily(tagline), cssHelper.STANDARD_FONT, "tagline font");
			assert.equal(cssHelper.fontWeight(tagline), cssHelper.BODY_TEXT_WEIGHT, "tagline weight");
			assert.equal(cssHelper.fontSize(tagline), "15px", "tagline font size");
			tagline.assert({ height: 18 }, "tagline height");

			assert.equal(cssHelper.fontFamily(clearButton), cssHelper.STANDARD_FONT, "clear button family");
			assert.equal(cssHelper.fontWeight(clearButton), cssHelper.DRAWING_BUTTON_WEIGHT, "clear button weight");
			assert.equal(cssHelper.fontSize(clearButton), "12px", "clear button font size");
			assert.equal(cssHelper.fontFamily(footerText), cssHelper.STANDARD_FONT, "footer family");
			assert.equal(cssHelper.fontWeight(footerText), cssHelper.BODY_TEXT_WEIGHT, "footer weight");
			assert.equal(cssHelper.fontSize(footerText), "15px", "footer font size");
			footer.assert({ height: 18 }, "footer height");

			assert.equal(cssHelper.fontFamily(joinUs), cssHelper.STANDARD_FONT, "join us button family");
			assert.equal(cssHelper.fontWeight(joinUs), cssHelper.LINK_BUTTON_WEIGHT, "join us button weight");
			assert.equal(cssHelper.fontSize(joinUs), "16px", "join us button font size");
		});

		it("rounds the corners of all rectangles", function() {
			assert.equal(cssHelper.roundedCorners(drawingArea), cssHelper.CORNER_ROUNDING, "drawing area");
			assert.equal(cssHelper.roundedCorners(clearButton), cssHelper.CORNER_ROUNDING, "clear button");
			assert.equal(cssHelper.roundedCorners(joinUs), cssHelper.CORNER_ROUNDING, "join us button");
		});

		describe("buttons", function() {

			it("have common styling", function() {
				assertStandardButtonStyling(clearButton, "clear button");
				assertStandardButtonStyling(joinUs, "'join us' button");
			});

			it("have specific sizes", function() {
				assertButtonSize(clearButton, 70, 30);
				assertButtonSize(joinUs, 225, 35);

				function assertButtonSize(button, width, height) {
					button.assert({
						width: width,
						height: height
					});
				}
			});

			it("have a drop shadow", function() {
				assert.equal(cssHelper.dropShadow(clearButton), cssHelper.MEDIUM_GRAY + cssHelper.BUTTON_DROP_SHADOW, "clear button drop shadow");
				assert.equal(cssHelper.dropShadow(joinUs), cssHelper.DARK_BLUE + cssHelper.BUTTON_DROP_SHADOW, "'join us' button drop shadow");
			});

			it("darken when user hovers over them", function() {
				cssHelper.assertHoverStyle(clearButton, cssHelper.DARKENED_GRAY, "clear button");
				cssHelper.assertHoverStyle(joinUs, cssHelper.DARKENED_MEDIUM_BLUE, "'join us' button");
			});

			it("appear to depress when user activates them", function() {
				cssHelper.assertActivateDepresses(clearButton, drawingArea.top.plus(16), "clear button");
				cssHelper.assertActivateDepresses(joinUs, footer.bottom.plus(14), "'join us' button");
			});

		});

	});

	function assertStandardButtonStyling(button, description) {
		assert.equal(cssHelper.textAlign(button), "center", description + "text horizontal centering");
		assert.equal(cssHelper.isTextVerticallyCentered(button), true, description + " text vertical centering");
		assert.equal(cssHelper.textIsUnderlined(button), false, description + " text underline");
		assert.equal(cssHelper.textIsUppercase(button), true, description + " text uppercase");
		assert.equal(cssHelper.hasBorder(button), false, description + " border");
	}

}());
