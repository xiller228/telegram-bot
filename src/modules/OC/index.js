import { TypedBind } from "leafy-utils";
import { MultiMenu } from "../../lib/Class/Menu.js";
import { u } from "../../lib/Class/Utils.js";
import { bold, fmt, link } from "../../lib/Class/Xitext.js";
import { safeLoad } from "../../lib/utils/safe.js";

export const m = new MultiMenu("OC");

m.query({ name: "s" }, (ctx) => {
	ctx.answerCbQuery("Скоро!", { show_alert: true });
});

export const ocbutton = m.createButtonMaker();

export const lang = {
	mainKeyboard: [
		[ocbutton("Найти", "find")],
		[ocbutton("Добавить", "reg")],
		[ocbutton("Мои персонажи", "my")],
		[ocbutton("Все персонажи", "s", "all")],
		[ocbutton("Случайный персонаж", "s", "random")],
	],

	main: fmt`Меню персонажей (${link("OC", u.guide(6))})`,

	/**
	 * @param {string} type
	 * @param {number | string} length
	 */
	maxLength: (type, length, end = "о") =>
		fmt`${type} должн${end} быть ${bold("не")} больше ${length} символов в длину.`,
	find: "Список владельцев ОС",
	/**
	 * @param {string} name
	 * @param {string} nickname
	 * @param {number} id
	 */
	ocs: (name, nickname, id, oldocs = false) =>
		fmt`Автор: ${link(name, nickname ? u.httpsUserLink(nickname) : u.userLink(id))}${
			oldocs
				? `\nНекоторые персонажи не были показаны т.к. не были обновлены. Попросите автора обновить их, чтобы увидеть здесь.`
				: ""
		}`,
	myOCS: "Ваши персонажи",
	/**
	 *
	 * @param {string} name
	 * @param {string} path
	 * @returns
	 */
	mOC(name, path) {
		return fmt`${
			path
				? bold("", link(name, `https://telegra.ph/${path}`))
				: `${name} - не обновлен. Нажми редактировать и просто пропусти все шаги для обновления. Если что-то не сработало, попробуй скинуть старый реф, т.к. ссылка на файл могла перестать работать.`
		}\nЭто Ваш персонаж.`;
	},
};

const modules = {
	menu: ["index", "del", "edit", "my", "create", "myoc"],
	"menu/find": ["find", "uOC"],
};

const mds = [];

for (const [folder, files] of Object.entries(modules)) {
	for (const file of files) mds.push(`./${folder}/${file}.js`);
}

export const wait = safeLoad(mds, (path) => import(path), false);
