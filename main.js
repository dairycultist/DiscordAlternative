const reply = require("./reply.js");
const db    = require("./db.js");

const address = "localhost";
const port    = 3000; // 443 for HTTPS

// so that we don't need extensive moderation tools, I think we should have a simple account system
// modded accounts can create/delete chatrooms + messages and manage users

const qs = require("querystring");
const { createServer } = require("node:http"); // switch to https later

// const options = {
//     key: fs.readFileSync("../private.key.pem"), // path to ssl PRIVATE key from Porkbun
//     cert: fs.readFileSync("../domain.cert.pem"),// path to ssl certificate from Porkbun
// };

db.initialize();

createServer((req, res) => { // options before () for https

	// log request
	if (req.url == "/")
		req.url = "/Landing";

	console.log("\x1b[32m" + req.method + "\x1b[0m \x1b[2m" + req.url + "\x1b[0m");

	// handle request
	if (req.method == "POST") {

		// can't post in landing or non-existent chatroom
		if (req.url == "/Landing" || !db.chatroomExists(req.url.substring(1))) {
			
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
				db.addMessage(req.url.substring(1), post.message.trim());

				res.writeHead(201);
				res.end();
			}
        });

	} else if (req.method == "GET" || req.method == "HEAD") {

		// reply with the requested chatroom
		reply.HTMLChatroom(res, req.url.substring(1));

	} else {

		res.writeHead(501); // Not Implemented
		res.end();
	}

}).listen(port, address, () => {

	// open page automatically
	console.log(`Hosting on http://${ address }:${ port }}/`);
});