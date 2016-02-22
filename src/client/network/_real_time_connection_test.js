// Copyright (c) 2015 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
(function() {
	"use strict";

	var assert = require("../../shared/_assert.js");
	var harness = require("./_network_test_harness.js");
	var Connection = require("./real_time_connection.js");
	var failFast = require("../ui/fail_fast.js");

	describe("NET: Real Time Network", function() {

		var connection;

		beforeEach(function() {
			connection = new Connection();
		});

		it("connects and disconnects from Socket.IO server", function(done) {
			connection.connect(harness.PORT, function(socketId) {
				assert.equal(harness.client.isConnected(socketId), true, "client should have connected to server");

				connection.disconnect(function() {
					harness.client.waitForServerDisconnect(socketId, done);   // will timeout if disconnect doesn't work
				});
			});
		});

		it("sends pointer status to Socket.IO server", function(done) {
			connection.connect(harness.PORT, function(socketId) {
				connection.sendPointerLocation(50, 75);

				harness.client.waitForPointerLocation(socketId, function(location) {
					assert.deepEqual(location, { x: 50, y: 75 });
					connection.disconnect(done);
				});
			});
		});

		it("fails fast when methods are called before connect() is called", function() {
			var expectedMessage = "Connection used before connect() called";

			assert.throws(connection.disconnect.bind(connection, callback), expectedMessage, "disconnect()");
			assert.throws(connection.sendPointerLocation.bind(connection, 0, 0), expectedMessage, "sendPointerLocation()");

			function callback() {
				assert.fail("Callback should never be called");
			}
		});
	});

}());