import { database } from "../../../../index.js";
import { d, util } from "../../../../lib/Class/Utils.js";
import { Query } from "../../../../lib/Class/Query.js";
import { Button } from "../../../../lib/Class/Xitext.js";
import { editMsg, link, m } from "../../index.js";
import { lang } from "../../index.js";
import { getOCS, noOC } from "../../utils.js";

new Query(
	{
		name: "find",
		prefix: "OC",
		message: "Поиск",
	},
	async (ctx, data) => {
		editMsg(ctx, "Загрузка...");
		const OCS = await getOCS(),
			keys = Object.keys(OCS);
		if (!keys[0]) {
			editMsg(ctx, lang.main._.text, {
				entities: lang.main._.entities,
				reply_markup: {
					inline_keyboard: lang.mainKeyboard,
				},
				disable_web_page_preview: true,
			});
			return noOC(ctx);
		}
		let btns = [],
			page = Number(data[0]) > 0 ? Number(data[0]) : 1;
		for (const e of keys.sort()) {
			try {
				/**
				 * @type {DB.User}
				 */
				const user = await database.get(d.user(e), true);

				const u = util.getFullName(user);

				if (u)
					btns.push([
						new Button(util.capitalizeFirstLetter(u)).data(
							link("uOC", page, e, util.capitalizeFirstLetter(u))
						),
					]);
			} catch (e) {}
		}
		btns = m.generatePageSwitcher(
			btns,
			new Button(m.config.backButtonSymbol).data(link("back")),
			"find",
			page
		);

		editMsg(ctx, lang.find, {
			reply_markup: { inline_keyboard: btns },
		});
	}
);
