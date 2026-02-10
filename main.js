// - account system + log in page which you are redirected to if any of your communications don't contain a valid session token
// - automatic chat log refreshing
// - link embedding (the client does this processing from the plaintext message)

// DMs? mods?
// modded accounts would be able to create/delete chatrooms + messages and manage users

const reply = require("./reply.js");
const db    = require("./db.js");

const address    = "localhost";
const useSecure  = false;
const useAltPort = true;

const qs = require("querystring");

db.initialize();

const onRequest = (req, res) => {

	// log request
	if (req.url == "/")
		req.url = "/chatroom/Landing";

	console.log("\x1b[32m" + req.method + "\x1b[0m \x1b[2m" + req.url + "\x1b[0m");

	// handle request
	if (req.method == "POST") {

		if (!req.url.startsWith("/chatroom/")) {

			reply.HTML404();
			return;
		}

		// can't post in landing or non-existent chatroom
		if (req.url == "/Landing" || !db.chatroomExists(req.url.substring(10))) {
			
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
				db.addMessage(req.url.substring(10), post.message.trim());

				res.writeHead(201);
				res.end();
			}
        });

	} else if (req.method == "GET" || req.method == "HEAD") {

		if (req.url.startsWith("/chatroom/")) {

			// reply with the requested chatroom
			reply.HTMLChatroom(res, req.url.substring(10));
		
		} else if (req.url.startsWith("/messages")) {

			const query = qs.parse(req.url.substring(10));

			// TODO prevent errors from query being malformed

			reply.HTMLChatroomMessages(res, query.chatroomName, query.beforeDate, 20);

		} else {

			res.writeHead(400);
			res.end();
		}

	} else {

		res.writeHead(501); // Not Implemented
		res.end();
	}

};

const onServerCreate = () => {

	console.log(`Hosting on http://${ address }:${ useAltPort ? 3000 : useSecure ? 443 : 80 }}/`);
};

if (useSecure) {

	// const options = {
	//     key: fs.readFileSync("../private.key.pem"), // path to ssl PRIVATE key from Porkbun
	//     cert: fs.readFileSync("../domain.cert.pem"),// path to ssl certificate from Porkbun
	// };

	require("node:https").createServer(options, onRequest).listen(useAltPort ? 3000 : 443, address, onServerCreate);

} else {

	require("node:http").createServer(onRequest).listen(useAltPort ? 3000 : 80, address, onServerCreate);
}