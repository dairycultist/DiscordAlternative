const db = require("./db.js");

module.exports = {
	HTML404: HTML404,
	HTMLChatroomMessages: HTMLChatroomMessages,
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

function HTMLChatroomMessages(res, chatroomName, beforeDate = 0, limit = 20) {

	db.getChatroomMessages(chatroomName, beforeDate, limit,
		() => {
			// no such table, return error 404
			HTML404(res);
		},
		(messages) => {

			let messagesEmbed = "";

			// TODO put button at the top which calls the script for the preceding chat logs

			// embed all messages
			for (let msg of messages)
				messagesEmbed += "<strong>username</strong> - <i style='color: #aaa;'>u" + msg.datetime + "</i><br>" + msg.message + "<br><br>";

			res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
			res.end(messagesEmbed);
		}
	);
}

function HTMLChatroom(res, chatroomName) {

	res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	res.end(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Chatrooms</title>
			<script>
				function onMessageSend(form) {

					let message = document.getElementById("message-input").value.trim();

					if (message.length == 0)
						return;

					var messages = document.getElementById("messages");

					// put message into messages area
					messages.innerHTML += "<strong>you sent:</strong> " + message + "<br><br>";

					// ensure scrolled to bottom of messages area
					messages.scrollTop = messages.scrollHeight;

					setTimeout(function(){ form.reset(); }, 10);
				}

				function refreshMessages() {

					alert("implement this with fetch later, for now just refresh the page to get all the content");
					// <i>Refreshing in - <button type="button" onclick="refreshMessages();">refresh now</button></i>
				}

				function init() {

					// request messages before date 0 and insert them into #messages
					fetch("/messages?chatroomName=${ chatroomName }&beforeDate=0")
					.then(res => res.text())
					.then(text => {
						document.getElementById("messages").innerHTML = text;
					});
				}
			</script>
		</head>
		<body onload="init();" style="height: 100vh; margin: 0; padding: 1em; box-sizing: border-box;">
			<!--<div>
				Logged in as <strong>username123</strong> [<a href>settings</a>] [<a href>log out</a>] (settings let you change password, pfp, etc)
			</div>-->
			<br>
			<nav>
				Chatrooms:` + db.getAllChatroomNames() + `
			</nav>

			<h1>` + chatroomName + `</h1>
			<hr>
			<div id="messages" style="overflow-y: scroll; height: 50vh;"></div>

			<i>Chat messages don't automatically appear yet, you have to refresh the page manually.</i>
			<hr>
			<br>

			<form action="` + chatroomName + `" method="POST" target="hidden_iframe" onsubmit="onMessageSend(this);">
				<input type="text" id="message-input" name="message" style="width: 60em;"${ chatroomName == "Landing" ? " disabled" : "" }>
			</form>
			<iframe name="hidden_iframe" style="display: none;"></iframe>

		</body>
		</html>
	`);
}