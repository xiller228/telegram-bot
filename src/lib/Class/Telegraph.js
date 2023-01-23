import { Telegraph } from "better-telegraph";
import { DatabaseWrapper } from "leafy-db";
import { database, env, tables } from "../../index.js";
import { pack, unpack } from "./Pack.js";
import { u, util } from "./Utils.js";

/**
 * @type {DatabaseWrapper<string>}
 */
const TelegraphDB = database.CreateTable("modules/telegraph.json");

/**
 * @param {string | number | DB.User} user
 */
export async function getAccount(user) {
	if (typeof user !== "object") user = tables.users.get(user);
	const id = user.static.id;
	let token;

	if (!TelegraphDB.has(id)) {
		const account = new Telegraph({
			author_name: util.getName(user),
			author_url: u.httpsUserLink(user.static.nickname),
			short_name: user.static.nickname,
		});

		await account.setupAccount();

		token = account.token;
		TelegraphDB.set(id, pack(env.E, account.token));
	}

	token = token ?? unpack(env.E, TelegraphDB.get(id));
	return new Telegraph({ accessToken: token });
}
