import { Telegraf } from "telegraf";
export * from "telegraf";
export * from "telegraf/filters";
export * from "telegraf/format";
export * from "telegraf/future";

if (!process.env.TOKEN || !process.env.DB_TOKEN || !process.env.DB_REPO)
	throw new ReferenceError("No tokens in env found!");

if (process.argv[2] === "dev") process.env.dev = "true";

/** @type {Telegraf<DataContext>} */
export const bot = new Telegraf(process.env.TOKEN);
