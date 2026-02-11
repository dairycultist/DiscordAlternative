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

let allChatroomNames; // these are prefixed with chatroom_

// make server aware of all existing chatrooms (and initialize the Landing chatroom if not already initialized)
function initialize() {

	db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'chatroom_%';", (err, rows) => {

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

	db.run(`CREATE TABLE chatroom_${ chatroomName } (message_id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT NOT NULL, datetime INTEGER NOT NULL);`);
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

	let names = [];

	for (let name of allChatroomNames)
		names.push(name.substring(9));

	return names;
}

// returns the 'limit' most recent messages that precede beforeID in chatroomName in ascending order by message_id
// if beforeID is -1, the most recent messages of all time are selected
function getChatroomMessages(chatroomName, beforeID, limit, onFail, onSuccess) {

	// if the chatroom name isn't real, don't even bother (prevents SQL injections too!)
	if (!chatroomExists(chatroomName)) {
		onFail();
		return;
	}

	let where = "";

	if (beforeID != -1)
		where = `WHERE message_id < ${ beforeID } `;

	db.all(`SELECT * FROM chatroom_${ chatroomName } ${ where }ORDER BY message_id DESC LIMIT ${ limit };`, (err, rows) => {

		if (err)
			onFail();
		else
			onSuccess(rows.reverse());
	});
}

function chatroomExists(chatroomName) {

	return getAllChatroomNames().includes(chatroomName);
}