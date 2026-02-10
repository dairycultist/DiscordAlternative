// for your information there is also db.each, which gives rows one-by-one

module.exports = {
    initialize: initialize,
	addMessage: addMessage,
	getAllChatroomNames: getAllChatroomNames,
	getChatroomMessages: getChatroomMessages,
	chatroomExists: chatroomExists
};

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.sql");

var allChatroomNames; // these are prefixed with chatroom_

// make server aware of all existing chatrooms (and initialize the Landing chatroom if not already initialized)
function initialize() {

	db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {

		if (err) {
			console.error("Error A.");
			process.exit();
		}

		allChatroomNames = rows.map(row => row.name);

		if (!allChatroomNames.includes("chatroom_Landing")) {

			db.serialize(() => {

				createChatroom("Landing");

				// system messages
				addMessage("Landing", "Welcome to the chatroom! We currently support NO link embedding!");
				addMessage("Landing", "You can't type in this chatroom, but you can select chatrooms at the top that you CAN type in.");

				// test chatrooms
				createChatroom("Test1");
				createChatroom("Test2");
			});
		}

		console.log("All chatrooms: " + allChatroomNames.toString());
	});
}

function createChatroom(chatroomName) {

	db.run(`CREATE TABLE chatroom_${ chatroomName } (message_id INTEGER PRIMARY KEY, message TEXT NOT NULL, datetime INTEGER NOT NULL);`);
	allChatroomNames.push("chatroom_" + chatroomName);
}

function addMessage(chatroomName, message) {

	// if the chatroom name isn't real, don't even bother (prevents SQL injections too!)
	if (!chatroomExists(chatroomName))
		return;

	// otherwise insert the message
	const stmt = db.prepare("INSERT INTO chatroom_" + chatroomName + " VALUES (NULL, ?, " + Math.floor(Date.now() / 1000) + ");");
	stmt.run(message); // TODO sanitize the message of HTML and such lol
	stmt.finalize();
}

function getAllChatroomNames() {

	let all_chatroom_names = "";

	for (let name of allChatroomNames)
		all_chatroom_names += ` [<a href=${ name.substring(9) }>${ name.substring(9) }</a>]`;

	return all_chatroom_names;
}

function getChatroomMessages(chatroomName, onFail, onSuccess) {

	// if the chatroom name isn't real, don't even bother (prevents SQL injections too!)
	if (!chatroomExists(chatroomName)) {
		onFail();
		return;
	}

	db.all("SELECT * FROM chatroom_" + chatroomName + ";", (err, rows) => {

		if (err) {

			onFail();
			return;
		}

		onSuccess(rows);
	});
}

function chatroomExists(chatroomName) {

	return getAllChatroomNames().includes(chatroomName);
}