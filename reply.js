const db = require("./db.js");

module.exports = {
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

function HTMLChatroom(res, chatroomName) {

	db.getChatroomMessages(chatroomName,
		() => {
			// no such table, return error 404
			HTML404(res);
		},
		(messages) => {

			let messagesEmbed = "";

			for (let row of messages)
				messagesEmbed += "<strong>[username]:</strong> " + row.message + "<br><br>";

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
							messages.innerHTML += "<strong>[username]:</strong> " + message + "<br><br>";

							// ensure scrolled to bottom of messages area
							messages.scrollTop = messages.scrollHeight;

							setTimeout(function(){ form.reset(); }, 10);
						}

						function refreshMessages() {

							alert("implement this with fetch later, for now just refresh the page to get all the content");
							// <i>Refreshing in - <button type="button" onclick="refreshMessages();">refresh now</button></i>
						}
					</script>
				</head>
				<body style="height: 100vh; margin: 0; padding: 1em; box-sizing: border-box;">
					<!--<div>
						Logged in as <strong>username123</strong> [<a href>settings</a>] [<a href>log out</a>] (settings let you change password, pfp, etc)
					</div>-->
					<br>
					<nav>
						Chatrooms:` + db.getAllChatroomNames() + `
					</nav>

					<h1>` + chatroomName + `</h1>
					<hr>
					<div id="messages" style="overflow-y: scroll; height: 50vh;">` + messagesEmbed + `</div>

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
		},
	)
}