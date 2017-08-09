// Copyright (c) 2012-2017 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.
(function() {
	"use strict";

	var HttpServer = require("./http_server.js");
	var RealTimeServer = require("./real_time_server.js");

	module.exports = class Server {

		async start(contentDir, notFoundPageToServe, portNumber) {
			if (!portNumber) throw new Error("port number is required");

			this._httpServer = new HttpServer(contentDir, notFoundPageToServe);
			await this._httpServer.start(portNumber);

			this._realTimeServer = new RealTimeServer();
			this._realTimeServer.start(this._httpServer.getNodeServer());
		}

		async stop() {
			if (this._realTimeServer === undefined) throw new Error("stop() called before server started");

			await this._realTimeServer.stop();
		}

	};

}());