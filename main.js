// so that we don't need extensive moderation tools, I think we should have a simple account system
// modded accounts can create/delete chatrooms + messages and manage users

// for your information there is also db.each, which gives rows one-by-one

const fs = require("fs");
const { createServer } = require("node:http"); // switch to https later

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.sql");

// const options = {
//     key: fs.readFileSync("../private.key.pem"), // path to ssl PRIVATE key from Porkbun
//     cert: fs.readFileSync("../domain.cert.pem"),// path to ssl certificate from Porkbun
// };

// make server aware of all existing chatrooms (and initialize the Landing chatroom if not already done)
var allChatroomNames;

db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {

	if (err) {
		console.error("Error A.");
		process.exit();
	}

	allChatroomNames = rows.map(row => row.name);

	if (!allChatroomNames.includes("chatroom_Landing")) {

		db.serialize(() => {

			db.run("CREATE TABLE chatroom_Landing (message_id INTEGER PRIMARY KEY, message TEXT NOT NULL);");
			allChatroomNames.push("chatroom_Landing");

			// system messages
			addMessage("Landing", "Welcome to the chatroom! We currently support NO link embedding!");
			addMessage("Landing", "You can't type in this chatroom, but you can select chatrooms at the top that you CAN type in.");

			// test chatrooms
			db.run("CREATE TABLE chatroom_Test1 (message_id INTEGER PRIMARY KEY, message TEXT NOT NULL);");
			allChatroomNames.push("chatroom_Test1");

			db.run("CREATE TABLE chatroom_Test2 (message_id INTEGER PRIMARY KEY, message TEXT NOT NULL);");
			allChatroomNames.push("chatroom_Test2");
		});
	}

	console.log("All chatrooms: " + allChatroomNames.toString());
});

createServer((req, res) => { // options before () for https

	console.log("\x1b[32m" + req.method + "\x1b[0m \x1b[2m" + req.url + "\x1b[0m");

	if (req.method == "POST") {

		addMessage("Landing", "right now every message you send just posts this in the landing");

	} else {

		if (req.url == "/")
			req.url = "/Landing";

		let chatroom_name = req.url.substring(1);

		// reply
		db.all("SELECT * FROM chatroom_" + chatroom_name + ";", (err, rows) => {

			if (err) {

				// no such table, return error 404
				replyHTML404(res);
				
				return;
			}

			let messages = "";

			for (let row of rows)
				messages += "<strong>[username]:</strong> " + row.message + "<br><br>";

			replyHTMLChatroom(res, chatroom_name, messages);
		});

	}

}).listen(3000, "localhost", () => { // 443 for HTTPS

	// open page automatically
	console.log(`Hosting on http://localhost:3000/`);
});



/*
 * helpers
 */

function addMessage(chatroom_name, message) {

	const stmt = db.prepare("INSERT INTO chatroom_" + chatroom_name + " VALUES (NULL, ?);");
	stmt.run(message);
	stmt.finalize();
}

function replyHTML404(res) {

	res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
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

function replyHTMLChatroom(res, chatroom_name, messages) {

	let chatrooms = "";

	for (let name of allChatroomNames)
		chatrooms += ` [<a href=${ name.substring(9) }>${ name.substring(9) }</a>]`;

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
					messages.innerHTML += message + "<br><br>";

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
			<div>
				Logged in as <strong>username123</strong> [<a href>settings</a>] [<a href>log out</a>] (settings let you change password, pfp, etc)
			</div>
			<br>
			<nav>
				Chatrooms:` + chatrooms + `
			</nav>

			<h1>` + chatroom_name + `</h1>
			<hr>
			<div id="messages" style="overflow-y: scroll; height: 50vh;">` + messages + `</div>

			<i>Chat messages don't automatically appear yet, you have to refresh the page manually.</i>
			<hr>
			<br>

			<form action="I wanna send a message" method="POST" target="hidden_iframe" onsubmit="onMessageSend(this);">
				<input type="text" id="message-input" name="message" style="width: 60em;">
			</form>
			<iframe name="hidden_iframe" style="display: none;"></iframe>

		</body>
		</html>
	`);
}