// Copyright (c) 2015-2016 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
(function() {
	"use strict";

	var assert = require("_assert");
	var harness = require("./__test_harness_client.js");
	var Connection = require("./real_time_connection.js");
	var async = require("./vendor/async-1.5.2.js");
	var ServerDrawMessage = require("../../shared/server_draw_message.js");
	var ClientDrawMessage = require("../../shared/client_draw_message.js");

	describe("NET: RealTimeConnection", function() {

		var connection;

		beforeEach(function() {
			connection = new Connection();
		});

		it("connects and disconnects from Socket.IO server", function(done) {
			connection.connect(harness.PORT, function(err) {
				assert.equal(err, null, "connect() should not have error");
				assert.equal(harness.isConnected(connection), true, "client should have connected to server");

				connection.disconnect(function(err2) {
					assert.equal(err2, null, "disconnect() should not have error");
					harness.waitForServerDisconnect(connection, done);   // will timeout if disconnect doesn't work
				});
			});
		});

		it("only calls connect() and disconnect() callbacks once", function(done) {
			var connectCallback = 0;
			var disconnectCallback = 0;

			connection.connect(harness.PORT, function(err) {
				if (err) return done(err);
				connectCallback++;

				connection.disconnect(function(err) {
					if (err) return done(err);
					disconnectCallback++;

					connection.connect(harness.PORT, function(err) {
						if (err) return done(err);

						assert.equal(connectCallback, 1, "connect callback");
						assert.equal(disconnectCallback, 1, "disconnect callback");
						done();
					});
				});
			});
		});

		it("connect() can be called without callback", function(done) {
			connection.connect(harness.PORT);
			async.until(test, fn, done);

			function test() {
				return connection.isConnected();
			}

			function fn(callback) {
				setTimeout(callback, 50);
			}
		});

		it("sends messages to Socket.IO server", function(done) {
			connection.connect(harness.PORT, function() {
				var message = new ClientDrawMessage(1, 2, 3, 4);

				connection.sendMessage(message);

				harness.waitForMessage(connection, ClientDrawMessage, function(error, messageData) {
					assert.deepEqual(messageData, message.payload());
					connection.disconnect(done);
				});
			});
		});

		it("gets most recent message sent to Socket.IO server, even if it hasn't be received yet", function(done) {
			var DRAW_MESSAGE = new ClientDrawMessage(1, 2, 3, 4);

			connection.connect(harness.PORT, function() {
				assert.deepEqual(connection.getLastSentMessage(), null, "should not have message if nothing sent");
				connection.sendMessage(DRAW_MESSAGE);
				assert.deepEqual(connection.getLastSentMessage(), DRAW_MESSAGE, "should return last sent message");
				connection.disconnect(done);
			});
		});

		it("receives messages from Socket.IO server", function(done) {
			var DRAW_MESSAGE = new ServerDrawMessage(1, 2, 3, 4);

			connection.connect(harness.PORT, function() {

				connection.onMessage(ServerDrawMessage, function(message) {
					assert.deepEqual(message, DRAW_MESSAGE);
					connection.disconnect(done);
				});
				harness.sendMessage(connection, DRAW_MESSAGE, function() {});
			});
		});

		it("can trigger messages manually", function(done) {
			var DRAW_MESSAGE = new ServerDrawMessage(1, 2, 3, 4);

			connection.connect(harness.PORT, function() {
				connection.onMessage(ServerDrawMessage, function(message) {
					assert.deepEqual(message, DRAW_MESSAGE);
					connection.disconnect(done);
				});

				connection.triggerMessage(DRAW_MESSAGE);
				// if triggerMessage doesn't do anything, the test will time out
			});
		});

		it("provides socket ID", function(done) {
			connection.connect(harness.PORT, function() {
				var socketId = connection.getSocketId();
				assert.defined(socketId, "should return socket ID after connecting");
				connection.disconnect(function() {
					assert.equal(connection.getSocketId(), null, "should return null after disconnecting");
					done();
				});
			});
		});

		it("provides server port", function(done) {
			connection.connect(harness.PORT, function() {
				assert.equal(connection.getPort(), harness.PORT, "should return connection port after connecting");
				connection.disconnect(function() {
					assert.equal(connection.getPort(), null, "should return null after disconnecting");
					done();
				});
			});
		});

		it("checks status of connection", function(done) {
			assert.equal(connection.isConnected(), false, "should not be connected before connect() is called");

			connection.connect(harness.PORT, function() {
				assert.equal(connection.isConnected(), true, "should be connected after connect() is complete");
				connection.disconnect(function() {
					assert.equal(connection.isConnected(), false, "should not be connected after disconnect() is complete");
					done();
				});
			});
		});

		it("fails fast when methods are called before connect() is called", function() {
			var expectedMessage = "Connection used before connect() called";

			assert.throws(connection.disconnect.bind(connection, callback), expectedMessage, "disconnect()");
			assert.throws(connection.sendMessage.bind(connection), expectedMessage, "sendMessage()");
			assert.throws(connection.onMessage.bind(connection, ServerDrawMessage, callback), expectedMessage, "onMessage()");
			assert.throws(connection.triggerMessage.bind(connection), expectedMessage, "triggerMessage()");
			assert.throws(connection.getSocketId.bind(connection), expectedMessage, "getSocketId()");
			assert.throws(connection.getPort.bind(connection), expectedMessage, "getPort()");

			function callback() {
				assert.fail("Callback should never be called");
			}
		});

	});


	describe("NET: RealTimeConnection._nullIo", function() {

		var IRRELEVANT_SERVER = "http://irrelevant_server";

		var nullIo = Connection._nullIo;

		it("mimics Socket.IO variables (without actually talking to a server)", function() {
			var socket = nullIo("http://any.host:9283");

			assert.equal(socket.connected, true, "connected");
			assert.equal(socket.id, "NullConnection", "id");
			assert.deepEqual(socket.io, {
				engine: {
					port: "9283"
				}
			}, "io");
		});

		it("emits connect event upon construction", function(done) {
			var socket = nullIo(IRRELEVANT_SERVER);
			socket.once("connect", function() {
				done();
			});
			// test times out if connect event not sent
		});

		it("silently swallows all events that would be sent to server", function(done) {
			var socket = nullIo(IRRELEVANT_SERVER);

			var eventHandler = false;
			socket.on("my_event", function() {
				eventHandler = true;
				done();   // test will fail if done is called twice
			});
			socket.emit("my_event");

			assert.equal(eventHandler, false, "events should be swallowed");
			done();
		});

		it("'closes' socket by emitting asynchronous disconnect event and changing state", function(done) {
			var socket = nullIo(IRRELEVANT_SERVER);

			socket.close();
			// by putting event handler after close(), we test that the event is asynchronous
			socket.once("disconnect", function() {
				assert.equal(socket.connected, false, "socket should no longer be connected");
				done();
			});
			// test times out if disconnect event not sent
		});

	});

}());