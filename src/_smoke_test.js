// Copyright (c) 2012-2018 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.
/*global document, window, CSSRule */
/*jshint regexp:false*/

// CONSIDER THESE ALTERNATIVES TO SELENIUM:
// http://www.letscodejavascript.com/v3/comments/live/242#comment-2483111382


(function() {
	"use strict";

	const http = require("http");
	const webdriver = require('selenium-webdriver');
	const By = webdriver.By;
	const until = webdriver.until;
	const runServer = require("./_run_server.js");
	const assert = require("_assert");

	const HOME_PAGE_URL = "http://localhost:5000";
	const NOT_FOUND_PAGE_URL = "http://localhost:5000/xxx";
	const EXPECTED_BROWSER = "firefox 59.0";
	const GHOST_POINTER_SELECTOR = ".ghost-pointer";
	const DRAWING_AREA_ID = "drawing-area";

	let serverProcess;
	let driver;

	describe("Smoke test", function() {
		/*eslint no-invalid-this:off */
		this.timeout(30 * 1000);

		before(function (done) {
			runServer.runProgrammatically(function(process) {
				serverProcess = process;

				driver = createDriver();
				driver.getCapabilities().then(function(capabilities) {
					const version = capabilities.get("browserName") + " " + capabilities.get("browserVersion");
					if (version !== EXPECTED_BROWSER) {
						console.log("Warning: Smoke test browser expected " + EXPECTED_BROWSER + ", but was " + version);
					}
					done();
				});
			});
		});

		after(function(done) {
			serverProcess.on("exit", function(code, signal) {
				driver.quit().then(done);
			});
			serverProcess.kill();
		});

		it("can get home page", function(done) {
			httpGet(HOME_PAGE_URL, function(response, receivedData) {
				const foundHomePage = receivedData.indexOf("WeeWikiPaint home page") !== -1;
				assert.equal(foundHomePage, true, "home page should have contained test marker");
				done();
			});
		});

		it("can get 404 page", function(done) {
			httpGet(HOME_PAGE_URL + "/nonexistant.html", function(response, receivedData) {
				const foundHomePage = receivedData.indexOf("WeeWikiPaint 404 page") !== -1;
				assert.equal(foundHomePage, true, "404 page should have contained test marker");
				done();
			});
		});

		it("home page fonts are loaded", function(done) {
			assertWebFontsLoaded(HOME_PAGE_URL, done);
		});

		it("404 page fonts are loaded", function(done) {
			assertWebFontsLoaded(NOT_FOUND_PAGE_URL, done);
		});

		it("user can draw on page and drawing is networked", function(done) {
			driver.get(HOME_PAGE_URL);
			const driver2 = createDriver();
			driver2.get(HOME_PAGE_URL);

			driver2.findElements(By.css(GHOST_POINTER_SELECTOR)).then(function(elements) {
				assert.equal(elements.length, 0, "should not have any ghost pointers before pointer is moved in other browser");
			});

			driver.executeScript(function(DRAWING_AREA_ID) {
				const client = require("./client.js");
				const HtmlElement = require("./html_element.js");

				const drawingArea = HtmlElement.fromId(DRAWING_AREA_ID);
				drawingArea.triggerMouseDown(10, 20);
				drawingArea.triggerMouseMove(50, 60);
				drawingArea.triggerMouseUp(50, 60);

				return client.drawingAreaCanvas.lineSegments();
			}, DRAWING_AREA_ID).then(function(lineSegments) {
				assert.deepEqual(lineSegments, [[ 10, 20, 50, 60 ]]);
			});

			// Wait for ghost pointer to appear -- that means real-time networking has been established
			// If it doesn't get established, the test will time out and fail.
			driver2.wait(until.elementsLocated(By.css(GHOST_POINTER_SELECTOR))).then(function() {
				driver2.executeScript(function() {
					const client = require("./client.js");
					return client.drawingAreaCanvas.lineSegments();
				}).then(function (lineSegments) {
					assert.deepEqual(lineSegments, [[ 10, 20, 50, 60 ]]);
					driver2.quit().then(done);
				});
			});
		});

	});

	function createDriver() {
		return new webdriver.Builder().forBrowser("firefox").build();
	}

	function assertWebFontsLoaded(url, done) {
		const TIMEOUT = 10 * 1000;

		driver.get(url);

		// wait for fonts to load
		driver.wait(function() {
			return driver.executeScript(function() {
				return window.wwp_typekitDone;
			});
		}, TIMEOUT, "Timed out waiting for web fonts to load");

		// get fonts from style sheet
		let expectedFonts;
		driver.executeScript(browser_getStyleSheetFonts)
		.then(function(returnValue) {
			expectedFonts = normalizeExpectedFonts(returnValue);
		});

		// get loaded fonts
		let actualFonts;
		driver.executeScript(function() {
			return window.wwp_loadedFonts;
		}).then(function(returnValue) {
			actualFonts = returnValue;
		});

		// check fonts
		driver.controlFlow().execute(function() {
			if (expectedFonts.length === 0) {
				assert.fail("No web fonts found in CSS, but expected at least one.");
			}

			const fontsNotPresent = expectedFonts.filter(function(expectedFont) {
				const fontPresent = actualFonts.some(function(actualFont) {
					return ('"' + actualFont.family + '"' === expectedFont.family) && (actualFont.variant === expectedFont.variant);
				});
				return !fontPresent;
			});

			if (fontsNotPresent.length !== 0) {
				console.log("Expected these fonts to be loaded, but they weren't:\n", fontsNotPresent);
				console.log("All expected fonts:\n", expectedFonts);
				console.log("All loaded fonts:\n", actualFonts);
				assert.fail("Required fonts weren't loaded");
			}

			done();
		});

		function normalizeExpectedFonts(styleSheetFonts) {
			const expectedFonts = [];

			Object.keys(styleSheetFonts.families).forEach(function(family) {
				Object.keys(styleSheetFonts.styles).forEach(function(style) {
					Object.keys(styleSheetFonts.weights).forEach(function(weight) {
						style = style[0];
						weight = weight[0];

						expectedFonts.push({
							family: family,
							variant: style + weight
						});
					});
				});
			});
			return expectedFonts;
		}
	}

	function httpGet(url, callback) {
		const request = http.get(url);
		request.on("response", function(response) {
			let receivedData = "";
			response.setEncoding("utf8");

			response.on("data", function(chunk) {
				receivedData += chunk;
			});
			response.on("end", function() {
				callback(response, receivedData);
			});
		});
	}

	function browser_getStyleSheetFonts() {
		// Rather than looking at stylesheet, we could descend the DOM.
		// Pros: Knows exactly which combination of fonts, weights, and styles we're using
		// Cons: It won't see all possibilities when using conditional styling such as media queries (I think)

		const styleSheetFonts = {
			families: {},
			weights: {},
			styles: {
				"normal": true
			}
		};

		const sheets = document.styleSheets;
		processAllSheets();
		return styleSheetFonts;

		function processAllSheets() {
			for (let i = 0; i < sheets.length; i++) {
				processStyleSheet(sheets[i]);
			}
		}

		function processStyleSheet(sheet) {
			if (sheet.disabled) {
				return;
			}

			const rules = getCssRulesOrNullIfSecurityError(sheet);
			if (rules === null) return;

			for (let i = 0; i < rules.length; i++) {
				processRule(rules[i]);
			}
		}

		function getCssRulesOrNullIfSecurityError(sheet) {
			// Reading cssRules from a different domain (typekit, in our case) causes a SecurityError on Firefox.
			// This occurs even though the CORS header Access-Control-Allow-Origin is set by Typekit.
			// So we have to squelch it here.
			try {
				return sheet.cssRules;
			}
			catch(err) {
				if (err.name === "SecurityError") return null;
				else throw err;
			}
		}

		function processRule(rule) {
			if (rule.type !== CSSRule.STYLE_RULE) return;
			const style = rule.style;

			processFontFamily(style.getPropertyValue("font-family"));
			processFontWeight(style.getPropertyValue("font-weight"));
			processFontStyle(style.getPropertyValue("font-style"));
		}

		function processFontFamily(familyDeclaration) {
			if (familyDeclaration === "") return;

			const families = familyDeclaration.split(",");

			families.forEach(function(family) {
				family = family.trim();
				if (family === "") return;
				if (isGenericName(family)) return;

				family = normalizeQuotes(family);
				if (isBuiltInFont(family)) return;

				styleSheetFonts.families[family] = true;
			});

			function isGenericName(family) {
				return family === "inherit" || family === "sans-serif" || family === "serif" ||
					family === "monospace" || family === "cursive" || family === "fantasy";
			}

			function isBuiltInFont(family) {
				return family === '"Helvetica"' || family === '"Arial"' || family === '"Courier New"';
			}
		}

		function normalizeQuotes(family) {
			// remove quotes if present; courtesy of peterpengnz, http://stackoverflow.com/a/19156197
			family = family.replace(/"([^"]+(?="))"/g, '$1');
			// put them back
			family = '"' + family + '"';
			return family;
		}

		function processFontWeight(weightDeclaration) {
			if (weightDeclaration === "" || weightDeclaration === "inherit") return;

			styleSheetFonts.weights[weightDeclaration + ""] = true;
		}

		function processFontStyle(styleDeclaration) {
			if (styleDeclaration === "" || styleDeclaration === "inherit") return;

			styleSheetFonts.styles[styleDeclaration] = true;
		}
	}

}());