const dotenv = require("dotenv");
const Discord = require("discord.js");

dotenv.config();
const client = new Discord.Client();
const { DISCORD_BOT_TOKEN } = process.env;

client.on("message", (message) => {
  const { content, author, createdTimestamp } = message;
  const { username } = author;

  if (content) {
    const urls = getAllUrls(content);

    if (urls.length > 0) {
      const entries = urls.map((url) => ({
        url,
        sharer: username,
        timestamp: createdTimestamp,
        content,
      }));
    }
  }
});

client.login(DISCORD_BOT_TOKEN);

const URL_REGEX =
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/gi;
/**
 * Returns all the URLs in message.
 * @param {string} message
 */
const getAllUrls = (message) => {
  const urls = message.match(URL_REGEX);

  if (!urls) {
    return [];
  }

  return urls.map((url) => url);
};
