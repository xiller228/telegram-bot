import { createClient } from "redis";
import config from "../config.js";
import { database } from "../index.js";
import "./Class/Command.js";
import { triggerEvent } from "./Class/Events.js";
import "./Class/Query.js";
import { util } from "./Class/Utils.js";
import { Xitext } from "./Class/Xitext.js";
import { bot, env } from "./launch/tg.js";
import { updateSession, updateVisualVersion } from "./launch/update.js";

export const data = {
	v: config.version.join("."),

	publicVersion: `v${config.version.join(".")}`,
	logVersion: `v${config.version.join(".")} I`,
	/** @type {'work' | 'realese' | 'old'} */
	type: "realese",

	session: 0,
	start_time: Date.now(),

	launched: false,
	stopped: false,

	development: env.dev && env.dev == "true" ? true : false,
	benchmark: true,
	private: true,

	chatID: {
		// Айди чата, куда будут поступать сообщения
		owner: Number(env.ownerID),
		log: Number(env.logID),
	},
	/** @type {Object<number, 'accepted' | 'waiting'>} */
	joinCodes: {},
	errorLog: {},
	updateTimer: null,
};

import { start_stop_lang as lang } from "./launch/lang.js";
import { handleDB, handleError } from "./utils/handlers.js";
import { UpdateCheckTimer } from "./between.js";

export const SERVISE = {
	start,
	stop,
	error,
	message: {
		development: "development",
		terminate_you: "terminate_you",
		terminate_me: "terminate_me",
	},
};

export const handlers = {
	processError: handleError,
	dbError: handleDB,
	bot: SERVISE.error,
};

export function log(msg, extra = {}, owner = false) {
	console.log(msg);
	owner
		? bot.telegram.sendMessage(data.chatID.owner, msg, extra)
		: bot.telegram.sendMessage(data.chatID.log, msg, extra);
}

/**
 * Запуск бота
 * @returns {Promise<void>}
 */
async function start() {
	lang.log.start();

	/**======================
	 * Подключение к базе данных
	 *========================**/
	const time = performance.now();

	const client = createClient({
		url: process.env.REDIS_URL,
	});

	client.on("error", handlers.dbError);

	// Сохранение клиента
	await database._.connect(client, time);

	// Обновляет сессию
	await updateSession(data);

	await updateVisualVersion(data);

	bot.catch(handlers.bot);

	bot.telegram.sendMessage(data.chatID.log, ...lang.start());

	/**======================
	 * Загрузка плагинов
	 *========================**/
	const m = [];
	for (const module of config.modules) {
		const start = performance.now();

		await import(`../modules/${module}/index.js`).catch(SERVISE.error);

		m.push(`${module} (${(performance.now() - start).toFixed(2)} ms)`);
	}
	// Инициализация команд и списков
	triggerEvent("modules.load");

	/**======================
	 * Запуск бота
	 *========================**/
	await bot.launch();
	data.launched = true;

	lang.log.end(m);
	UpdateCheckTimer.open();
}

/**
 *
 * @param {string} reason
 * @param {"ALL" | "BOT" | "none"} type
 * @param {boolean} sendMessage
 */
async function stop(reason = "Остановка", type = "none", sendMessage = true) {
	UpdateCheckTimer.close();
	const text = new Xitext()._.group("✕  ").url(null, "https://t.me").bold()._.group();

	text.text(`${type}. `);

	text.text(reason);

	console.log(text._.text);
	if (data.launched && sendMessage) await bot.telegram.sendMessage(data.chatID.log, ...text._.build());

	if (type !== "none" && data.launched && !data.stopped) {
		data.stopped = true;
		bot.stop(reason);
	}

	if (type === "ALL") {
		await database._.close();
		process.exit(0);
	}
}

/**
 *
 * @param {{name?: string, message: string, stack: string, on?: object}} error
 */
async function error(error) {
	try {
		console.warn(" ");
		console.warn(error);
		console.warn(" ");

		const [type, message, stack, extra] = util.errParse(error, true);

		const text = new Xitext().url(type, "https://t.me")._.group(message).bold()._.group().text(` ${stack}`);

		if (!data.launched) return;

		await bot.telegram.sendMessage(data.chatID.log, ...text._.build());

		if (extra) {
			await util.sendSeparatedMessage(
				extra,
				async (a) =>
					await bot.telegram.sendMessage(data.chatID.log, a, {
						disable_web_page_preview: true,
					})
			);
		}
	} catch (e) {
		console.warn(e);
	}
}
