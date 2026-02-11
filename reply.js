const fs = require("fs");
const db = require("./db.js");

module.exports = {
	HTML404: HTML404,
	JSONChatroomMessages: JSONChatroomMessages,
    HTMLChatroom: HTMLChatroom
};

function HTML404(res) {

	res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
	res.end(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Chatrooms</title>
		</head>
		<body>
			<h1>404 error, page not found</h1>
		</body>
		</html>
	`);
}

// the server sends chat messages as JSON, which the client formats themselves
function JSONChatroomMessages(res, chatroomName, beforeID = -1, limit = 20) {

	db.getChatroomMessages(chatroomName, beforeID, limit,
		() => {
			// no such table, return error 404
			HTML404(res);
		},
		(messages) => {

			res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
			res.end(JSON.stringify(messages));
		}
	);
}

function HTMLChatroom(res, chatroomName) {

	let chatroomList = "";

	for (let name of db.getAllChatroomNames())
		chatroomList += ` [<a href="/chatroom/${ name }">${ name }</a>]`;

	res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	res.end(
		fs.readFileSync("./index.html", "utf8")
		.replaceAll("[[[chatroomName]]]", chatroomName)
		.replaceAll("[[[chatroomList]]]", chatroomList)
		.replaceAll("[[[disable]]]", chatroomName == "Landing" ? " disabled" : "")
	);
}