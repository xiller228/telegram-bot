import { Command } from "../../../../lib/Class/Cmd.js";
import { Query } from "../../../../lib/Class/Query.js";
import { editMsg } from "../../index.js";
import { lang } from "../../index.js";
import { sendMsgDelDoc } from "../../utils.js";

new Command(
  {
    name: "oc",
    description: "Все действия с OC",
    permisson: 0,
    type: "private",
  },
  (ctx) => {
    ctx.reply(
      ...lang.main
        .inlineKeyboard(...lang.mainKeyboard)
        ._.build({ disable_web_page_preview: true })
    );
  }
);

new Query(
  {
    name: "back",
    prefix: "OC",
    message: "Назад",
  },
  async (ctx) => {
    editMsg(ctx, lang.main._.text, {
      entities: lang.main._.entities,
      reply_markup: {
        inline_keyboard: lang.mainKeyboard,
      },
      disable_web_page_preview: true,
    });
  }
);

new Query(
  {
    name: "backdoc",
    prefix: "OC",
    message: "Назад",
  },
  (ctx, data) => {
    sendMsgDelDoc(
      ctx,
      lang.main._.text,
      lang.main._.entities,
      lang.mainKeyboard,
      data[0]
    );
  }
);
