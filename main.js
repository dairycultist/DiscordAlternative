// server console allows you to run commands that create chatrooms and stuff
// use SQLite

// so that we don't need extensive moderation tools, I think we should have a simple account system

const fs = require("fs");
const { createServer } = require("node:http"); // switch to https later

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.sql");

// const options = {
//     key: fs.readFileSync("../private.key.pem"), // path to ssl PRIVATE key from Porkbun
//     cert: fs.readFileSync("../domain.cert.pem"),// path to ssl certificate from Porkbun
// };

db.serialize(() => {

	db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='chatroom_Landing';", (err, rows) => {
        
		console.log(rows);

		if (err) {
			console.error("Error.");
			process.exit();
		}

		let hasLanding = false;

		rows.forEach((row) => {
			if (row.name == "chatroom_Landing") {
				hasLanding = true;
			}
		});

		if (!hasLanding)
			db.run("CREATE TABLE chatroom_Landing (message_id INTEGER PRIMARY KEY, message TEXT NOT NULL);");
    });

    // const stmt = db.prepare("INSERT INTO lorem VALUES (?);");
    // for (let i = 0; i < 10; i++) {
    //     stmt.run("Ipsum " + i);
    // }
    // stmt.finalize();

    // db.each("SELECT rowid AS id, info FROM lorem;", (err, row) => {
    //     console.log(row.id + ": " + row.info);
    // });
});

createServer((req, res) => { // options before () for https

	console.log("\x1b[32m" + req.method + "\x1b[0m \x1b[2m" + req.url + "\x1b[0m");

	// if (req.method == "POST" && req.url == "/") {}

	// reply
	res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
	res.end(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>Chat Rooms</title>
		</head>
		<body>
			<div>
				Logged in as <strong>username123</strong> [settings] [log out] (settings let you change password, pfp, etc)
			</div>
			<nav>
				Chatrooms: [<a href>Landing</a>] [<a href>General</a>]
			</nav>
			<h1>Landing</h1>
		</body>
		</html>
	`);

}).listen(3000, "localhost", () => { // 443 for HTTPS

	// open page automatically
	console.log(`Hosting on http://localhost:3000/`);
});