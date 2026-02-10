// so that we don't need extensive moderation tools, I think we should have a simple account system
// modded accounts can create/delete chatrooms + messages and manage users

const fs = require("fs");
const { createServer } = require("node:http"); // switch to https later

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.sql");

// const options = {
//     key: fs.readFileSync("../private.key.pem"), // path to ssl PRIVATE key from Porkbun
//     cert: fs.readFileSync("../domain.cert.pem"),// path to ssl certificate from Porkbun
// };

// for your information there is also db.each, which gives rows one-by-one
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='chatroom_Landing';", (err, rows) => {
	
	console.log(rows);

	if (err) {
		console.error("Error A.");
		process.exit();
	}

	let hasLanding = false;

	for (let row of rows) {

		if (row.name == "chatroom_Landing")
			hasLanding = true;
	}

	if (!hasLanding) {

		db.serialize(() => {

			db.run("CREATE TABLE chatroom_Landing (message_id INTEGER PRIMARY KEY, message TEXT NOT NULL);");
		
			const stmt = db.prepare("INSERT INTO chatroom_Landing VALUES (NULL, ?);");
			stmt.run("Welcome to the chatroom! We currently support NO link embedding!");
			stmt.run("You can't type in this chatroom, but you can select chatrooms at the top that you CAN type in.");
			stmt.finalize();
		});
	}
});

createServer((req, res) => { // options before () for https

	console.log("\x1b[32m" + req.method + "\x1b[0m \x1b[2m" + req.url + "\x1b[0m");

	if (req.method == "GET" && req.url == "/") {
		req.url = "/Landing";
	}

	// reply
	db.all("SELECT * FROM chatroom_Landing;", (err, rows) => {

		if (err) {
			console.error("Error B.");
			process.exit();
		}

		let messages = "";

		for (let row of rows)
			messages += row.message + "<br><br>";

		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.end(`
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Chat Rooms</title>
				<script>
					function onMessageSend(form) {

						let message = document.getElementById("message-input").value.trim();

						if (message.length == 0)
							return;

						document.getElementById("messages").innerHTML += message + "<br><br>";

						setTimeout(function(){ form.reset(); }, 10);
					}
				</script>
			</head>
			<body>
				<div>
					Logged in as <strong>username123</strong> [<a href>settings</a>] [<a href>log out</a>] (settings let you change password, pfp, etc)
				</div>
				<nav>
					Chatrooms: [<a href>Landing</a>] [<a href>General</a>]
				</nav>

				<h1>Landing</h1>
				<hr>
				<div id="messages">` + messages + `</div>

				<form action="I wanna send a message" method="POST" target="hidden_iframe" onsubmit="onMessageSend(this);">
					<input type="text" id="message-input" name="message" style="width: 60em;">
					<br>
					Refreshing in 30 <button type="button">refresh now</button>
				</form>
				<iframe name="hidden_iframe" style="display: none;"></iframe>

			</body>
			</html>
		`);
	});

}).listen(3000, "localhost", () => { // 443 for HTTPS

	// open page automatically
	console.log(`Hosting on http://localhost:3000/`);
});