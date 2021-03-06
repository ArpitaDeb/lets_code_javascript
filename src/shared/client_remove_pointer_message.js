// Copyright (c) 2016-2017 Titanium I.T. LLC. All rights reserved. For license, see "README" or "LICENSE" file.
(function() {
	"use strict";

	var ServerRemovePointerMessage = require("./server_remove_pointer_message.js");

	var ClientRemovePointerMessage = module.exports = function() {
	};

	ClientRemovePointerMessage.MESSAGE_NAME = "client_remove_pointer_message";
	ClientRemovePointerMessage.prototype.name = function() { return ClientRemovePointerMessage.MESSAGE_NAME; };

	ClientRemovePointerMessage.fromPayload = function(obj) {
		return new ClientRemovePointerMessage();
	};

	ClientRemovePointerMessage.prototype.payload = function() {
		return {};
	};

	ClientRemovePointerMessage.prototype.toServerMessage = function(clientId) {
		return new ServerRemovePointerMessage(clientId);
	};

}());