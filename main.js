// server console allows you to run commands that create chatrooms and stuff
// use SQLite

const fs = require("fs");
const { createServer } = require("node:http");

createServer((req, res) => {

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
	<h1>hello!</h1>
</body>
</html>
	`);

}).listen(3000, "localhost", () => {

	// open page automatically
	console.log(`Hosting on http://localhost:3000/`);
});