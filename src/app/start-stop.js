import { dbkey, PORT, VERSION } from "./config.js";
import { bot, members } from "./setup/tg.js";
import { createClient } from "redis";
import { database } from "../index.js";
import { format } from "./functions/formatterCLS.js";

/**======================
 * Плагины
 *========================**/
const Plugins = ["updates", "commands", "timeChecker", "html"];


/**======================
 * Кэш сессии
 *========================**/
export const data = {
  v: VERSION.join("."),
  isLatest: true,
  versionMSG: `v${VERSION.join(".")} (Init)`,
  session: 0,
  start_time: Date.now()
};

/**
 * Запуск бота
 * @returns {void}
 */
export async function SERVISE_start() {
  console.log(`[Load] Обнаружен Кобольдя v${VERSION.join(".")}, Порт: ${PORT}`);

  /**======================
   * Подключение к базе данных
   *========================**/

  const client = createClient({
    url: process.env.REDIS_URL,
  });

  client.on("error", (err) => console.log("[DB][Error] ", err));

  await client.connect();

  database.client = client;

  await updateSession();

  /**======================
   * Обработчик ошибок
   *========================**/
  bot.catch((error) => {
    console.log("Ошибка при работе бота: ", error);
    SERVISE_stop("error", error);
  });

  /**======================
   * Остановка при обнаружении новой версии
   *========================**/
  setInterval(async () => {
    const cur = await database.get(dbkey.session);
    if (cur > data.session)
      SERVISE_stop(`Обнаружена вторая сессия номер ${cur} (против активной ${session})`, null, true, false);
  }, 1000);

  setTimeout(async () => {
    /**======================
     * Запуск бота
     *========================**/
    await bot.launch();

    /**======================
     * Загрузка плагинов
     *========================**/
    for (const plugin of Plugins) {
      const start = Date.now();

      await import(`../vendor/${plugin}/index.js`).catch((error) => {
        console.warn(`[Error][Plugin] ${plugin}: ` + error + error.stack);
      });
      console.log(`[Load] ${plugin} (${Date.now() - start} ms)`);
    }
  }, 5000);
}

export async function SERVISE_stop(
  reason,
  extra = null,
  stopBot = true,
  stopApp = true
) {
  await bot.telegram.sendMessage(
    members.xiller,
    `⚠️ Бот ${data.versionMSG} остановлен${reason ?  ` по причине: ${reason}.` : '.'}${
      extra ? ` (${format.stringifyEx(extra, " ")})` : ""
    }\nApp: ${stopApp}\nBot: ${stopBot}`
  );
  if (stopBot) bot.stop(reason);
  if (stopApp) process.exit(0);
  console.log(`[Stop] Бот ${data.versionMSG} остановлен${reason ?  ` по причине: ${reason}.` : '.'}${
    extra ? ` (${format.stringifyEx(extra, " ")})` : ""
  }\nApp: ${stopApp}\nBot: ${stopBot}`)
}

async function updateSession() {
  if (!(await database.has(dbkey.session))) {
    await database.set(dbkey.session, 0);
  }

  await database.add(dbkey.session, 1);

  data.session = await database.get(dbkey.session);
}
