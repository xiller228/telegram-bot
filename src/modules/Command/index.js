export const cooldown = 5 * 3.6e6;

const PUBLIC = [
	"abc",
	"call",
	"google",
	"name",
	"pin",
	"admins",
	"upload",
	// sleep Moved to middlewares/NoNotify/index.js
];

for (const cmd of PUBLIC) import(`./public/${cmd}.js`);

const PRIVATE = [
	"stop",
	"sudo",
	"v",
	"ping",
	"repl", //
];

for (const cmd of PRIVATE) import(`./private/${cmd}.js`);
