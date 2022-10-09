import { Context } from "telegraf";
import { Xitext } from "./XitextCLS.js";
import { isAdmin } from "../functions/checkFNC.js";
import { bot, members } from "../setup/tg.js";
import { data, log, SERVISE_error } from "../start-stop.js";
import { d, format } from "./formatterCLS.js";
import { database } from "../../index.js";
import { Session, ssn } from "./sessionCLS.js";
import { EventListener } from "./EventsCLS.js";
import { commandClearRegExp } from "../../config.js";
import { safeRun } from "../functions/safeRunFNC.js";

/**
 * @type {Array<ChatCommand>}
 */
const public_cmds = [];

/**
 * @type {Array<ChatCommand>}
 */
const private_cmds = [];
/**
 * @typedef {Object} CommandType
 * @property {String} group
 * @property {String} private
 * @property {String} all
 */

/**
 * @typedef {function(Context, Array<String>, import("./EventsCLS.js").EventData, ChatCommand)} ChatCommandCallback
 */

/**
 * @typedef {Object} ChatCommand
 * @property {Object} info
 * @property {string} info.name
 * @property {string} info.description
 * @property {CommandType} info.type
 * @property {number}  info.perm
 * @property {boolean} info.hide
 * @property {string} info.session
 * @property {Array<string>} info.aliases
 * @property {ChatCommandCallback} callback
 */

export class Command {
  /**
   * Создает команду
   * @param {Object} info
   * @param {String} info.name Имя
   * @param {Array<String>} info.aliases Имя
   * @param {Boolean} info.hide Спрятать ли из листа команд
   * @param {Boolean} info.specprefix
   * @param {String} info.description Описание
   * @param {String} info.session В формате d.session
   * @param {Number} info.permisson 0 - все, 1 - админы
   * @param {CommandType} info.type all | group | private
   * @param {ChatCommandCallback} callback
   */
  constructor(info, callback) {
    if (!info.name) return;

    // Регистрация инфы
    const cmd = {
      info: {
        name: info.name,
        description: info.description ?? "Пусто",
        type: info.type,
        perm: info.permisson ?? 0,
        hide: info.hide,
        session: info.session,
        aliases: info.aliases
      },
      callback: callback
    }

    // Ы
    if (!info.specprefix) {
      public_cmds.push(cmd)
    } else {
      private_cmds.push(cmd)
    }
    return this;
  }
  /**
   *
   * @param {String} a
   * @returns {Command}
   */
  static getCmd(a) {
    if (!a) return false;
    /**
     * @type {Command}
     */
    let command = false;

    const type = /^\/\S+/.test(a)
      ? "slash"
      : /^\-\S+/.test(a)
        ? "special"
        : "message"
    if (type === "message") return

    const
      // Команда из сообщения      
      c = a.replace(/^.([^\@\s]+)\s?.*/, "$1"),
      // Функция поиска команды в массиве по имени или сокращению      
      findC = (e) =>
        e.info?.name == c ||
        e.info?.aliases?.includes(c);

    cmd = type === "slash"
      ? public_cmds.find(findC)
      : private_cmds.find(findC)

    return cmd;

  }
  /**
   *
   * @param {Command} command
   * @param {Context} ctx
   * @returns
   */
  static async cantUse(command, ctx, user = null) {
    // Условия разрешений
    let _lg = // Где
      command.info.type === "group" &&
      (ctx.chat.type === "group" || ctx.chat.type === "supergroup"),
      _lp = command.info.type === "private" && ctx.chat.type === "private",
      _lc = command.info.type === "channel" && ctx.chat.type === "channel",
      _la = command.info.type === "all" || !command.info.type,
      // Если команда для всех
      _pall = command.info.perm === 0,
      // Если команда для админов, и отправитель админ
      _padmin =
        command.info.perm === 1 &&
        (await isAdmin(ctx, ctx.message.from.id, user)),
      // Если команда хильки
      _pxiller =
        command.info.perm === 2 && ctx.message.from.id == data.logChatId.owner;

    // Если нет ни одного разрешения, значит нельзя
    return !((_la || _lc || _lg || _lp) && (_pall || _padmin || _pxiller));
  }
}

/**======================ss
 *    Приветствие
 *========================**/
new Command(
  {
    name: "start",
    description: "Начало работы с ботом в лс",
    type: "private",
    hide: true,
  },
  (ctx, _args, data) => {
    ctx.reply(
      `${data.DBUser.static.name} Кобольдя очнулся. Список доступных Вам команд: /help`
    );
  }
);
/*========================*/

new Command(
  {
    name: "help",
    description: "Список команд",
    type: "all",
  },
  async (ctx, _a, data) => {
    if (!Object.keys(public_cmds)[0] && !Object.keys(private_cmds)[0])
      return ctx.reply("А команд то и нет");
    let c = false,
      p = false,
      a = new Xitext();

    for (const e of Object.values(public_cmds)) {
      if (await Command.cantUse(e, ctx, data.userRights)) continue;
      if (!c) a.Text(`Доступные везде команды:\n`), (c = true);
      a.Text(`  /${e.info.name}`);
      a.Italic(` - ${e.info.description}\n`);
    }

    for (const e of Object.values(private_cmds)) {
      if (await Command.cantUse(e, ctx, data.userRights)) continue;
      if (!p) a.Text(`\nДоступные вам в этом чате команды:\n`), (p = true);
      a.Text(`  `);
      a.Mono(`-${e.info.name}`);
      a.Italic(` - ${e.info.description}\n`);
    }
    if (!a._text) return ctx.reply("А доступных команд то и нет");
    ctx.reply(...a._Build());
  }
);

new Command(
  {
    name: "cancel",
    prefix: "def",
    description: "Выход из пошагового меню",
    permisson: 0,
    hide: true,
    type: "private",
  },
  async (ctx, _args, data) => {
    /**
     * @type {import("../models.js").DBUser}
     */
    const user = data.DBUser ?? (await database.get(d.user(ctx.from.id), true));
    if (user?.cache?.session) {
      await ctx.reply(`Вы вышли из меню ${user.cache.session}`);
      delete user.cache.session;
      await database.set(d.user(ctx.from.id), user, true);
    } else ctx.reply("Вы не находитесь в меню!");
  }
);

new Command(
  {
    name: "next",
    prefix: "def",
    description: "Переходит на следующий шаг меню",
    permisson: 0,
    hide: true,
    type: "private",
  },
  async (ctx, _a, data) => {
    /**
     * @type {import("../models.js").DBUser}
     */
    const user = data.DBUser ?? (await database.get(d.user(ctx.from.id), true));
    if (user?.cache?.session?.split) {
      /**
       * @type {Session}
       */
      const abst = user.cache.session.split("::"),
        sess = ssn[abst[0]];
      if (sess) {
        if (sess.executers[abst[1]]) {
          sess.executers[abst[1]](ctx, user);
        } else ctx.reply("Этот шаг не предусматривает пропуска!");
      } else delete user.cache.session;
      await database.set(d.user(ctx.from.id), user, true);
    } else ctx.reply("Вы не находитесь в меню!");
  }
);

export function loadCMDS() {
  //  Общие команды группы
  let groupC = [],
    // Общие команды в лс
    privateC = [],
    // Админские в группах
    groupAC = [],
    xiller = [],
    allKmds = [];
  public_cmds.forEach((e) => {
    /**
     * @type {Command}
     */
    const cmd = e,
      m = { command: cmd.info.name, description: cmd.info.description };
    if (!cmd.info.hide) {
      if (
        (cmd.info.type == "group" || cmd.info.type == "all") &&
        cmd.info.perm == 0
      )
        groupC.push(m);
      if (
        (cmd.info.type == "group" || cmd.info.type == "all") &&
        cmd.info.perm == 1
      )
        groupAC.push(m);
      if (
        (cmd.info.type == "private" || cmd.info.type == 'all') &&
        cmd.info.perm == 0
      )
        privateC.push(m), xiller.push(m);
      if (cmd.info.perm == 2) xiller.push(m);
    }

    allKmds.push(e);
  });
  Object.keys(private_cmds).forEach((e) => allKmds.push(e));

  if (groupC[0])
    bot.telegram.setMyCommands(groupC, { scope: { type: "all_group_chats" } });
  if (groupAC[0])
    bot.telegram.setMyCommands(groupAC.concat(groupC), {
      scope: { type: "all_chat_administrators" },
    });
  if (privateC[0])
    bot.telegram.setMyCommands(privateC, {
      scope: { type: "all_private_chats" },
    });
  if (xiller[0])
    bot.telegram.setMyCommands(xiller.concat(privateC), {
      scope: { type: "chat", chat_id: data.logChatId.owner },
    });
  if (data.isDev)
    console.log(
      `> Command Кол-во команд: ${allKmds.length}${allKmds[0] ? `, список: ${allKmds.join(", ")}` : ""
      }`
    );

  new EventListener("text", 9, async (ctx, next, data) => {
    /**
     * @type {String}
     */
    const t = ctx.message.text;
    /**
     * @type {ChatCommand}
     */
    const command = Command.getCmd(t)
    if (!command) return next();
    if (await Command.cantUse(command, ctx, data.userRights))
      return ctx.reply(
        "В этом чате эта команда недоступна. /help", { reply_to_message_id: ctx.message.message_id, allow_sending_without_reply: true }
      );

    const // All good, run
      a =
        t
          .replace(commandClearRegExp, "")
          ?.match(/"[^"]+"|[^\s]+/g)
          ?.map((e) => e.replace(/"(.+)"/, "$1").toString()) ?? [],
      user = data.DBUser,
      name =
        user?.cache?.nickname ??
        user?.static?.name ??
        format.getName(ctx.message.from) ??
        ctx.message.from.id,
      xt = new Xitext().Text(' ').Url(name, d.userLink(ctx.from.username)).Text(': ' + t)._Build({ disableWebPagePreview: true })

    safeRun(
      "CMD",
      () => command.callback(ctx, a, data, command),
      ` (${name}: ${t})`,
      ...xt
    );
  });
}
