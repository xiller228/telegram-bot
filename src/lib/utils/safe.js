import { Service } from "../../index.js";
import styles from "../styles.js";

/**
 *
 * @param {Function} callback
 * @param {string} runnerName
 * @returns
 */
export async function runWithCatch(runnerName, callback) {
	try {
		await callback();
		return true;
	} catch (error) {
		Service.error({
			name: `${runnerName} error: `,
			message: error.message,
			stack: error.stack,
		});
		return false;
	}
}

/**
 * It loads all the files in a folder and logs the time it took to load each file
 * @param {string[]} folderArray - An array of folders to load.
 * @param {(file: string) => Promise<void | {wait: Promise<void>}>} loadFN - Function that loads.
 */
export async function importMultiple(folderArray, loadFN, log = true) {
	for (const file of folderArray) {
		try {
			const start = performance.now();

			const module = await loadFN(file);
			if (module && "wait" in module) await module.wait;

			if (log)
				console.log(
					`${styles.load}${file} (${styles.number(
						`${(performance.now() - start).toFixed(2)} ms`
					)})`
				);
		} catch (e) {
			console.log(`${styles.loadError}${file}`);
			await Service.error(e);
			Service.stop("Error while loading", "ALL", false);
			throw new Error("Stop");
		}
	}
}
