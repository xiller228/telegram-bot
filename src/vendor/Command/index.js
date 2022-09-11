export const cooldown = 5 * 3.6e6,
  chatcooldown = 3.6e6;

/*
|--------------------------------------------------------------------------
| Команды
|--------------------------------------------------------------------------
|
| Этот файл содержит в себе импорты всех команд из других файлов папки
| 
| 
*/

// Команды, начинающиеся со /
import "./commonCMDS.js"

// Команды с другими префиксами, спрятанные из списка команд
import "./hiddenCMDS.js"

// Старые команды
import "./oldCMDS.js"