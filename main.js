const reply = require("./reply.js");

// so that we don't need extensive moderation tools, I think we should have a simple account system
// modded accounts can create/delete chatrooms + messages and manage users

// for your information there is also db.each, which gives rows one-by-one

// TODO clean up code and MAKE SQL COMMANDS SAFE!

const qs = require("querystring");
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

	if (req.url == "/")
		req.url = "/Landing";

	console.log("\x1b[32m" + req.method + "\x1b[0m \x1b[2m" + req.url + "\x1b[0m");



	if (req.method == "POST") {

		// can't post in landing or non-existent chatroom
		if (req.url == "/Landing" || !allChatroomNames.includes("chatroom_" + req.url.substring(1))) {
			
			res.writeHead(400);
			res.end();
			return;
		}

		// get POST body
		var body = "";

        req.on("data", (data) => {

            body += data;

            // Too much POST data, kill the connection! (1e6 ~ 1MB)
            if (body.length > 1e6)
                request.connection.destroy();
        });

        req.on("end", () => {

            var post = qs.parse(body);

			if (post.message.trim().length == 0) {

				// can't post empty messages
				res.writeHead(400);
				res.end();

			} else {
			
				// post message
				addMessage(req.url.substring(1), post.message.trim());

				res.writeHead(201);
				res.end();
			}
        });

	} else {

		let chatroom_name = req.url.substring(1);

		// reply
		db.all("SELECT * FROM chatroom_" + chatroom_name + ";", (err, rows) => {

			if (err) {

				// no such table, return error 404
				reply.HTML404(res);
				
				return;
			}

			let all_chatroom_names = "";

			for (let name of allChatroomNames)
				all_chatroom_names += ` [<a href=${ name.substring(9) }>${ name.substring(9) }</a>]`;

			let messages = "";

			for (let row of rows)
				messages += "<strong>[username]:</strong> " + row.message + "<br><br>";

			reply.HTMLChatroom(res, chatroom_name, all_chatroom_names, messages);
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