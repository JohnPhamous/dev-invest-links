const dotenv = require("dotenv");
const Discord = require("discord.js");
const Airtable = require("airtable");

dotenv.config();
const {
  DISCORD_BOT_TOKEN,
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_NAME,
} = process.env;

const client = new Discord.Client();
Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

client.on("message", (message) => {
  const { content, author, createdTimestamp, channel, guild, id } = message;
  const { username } = author;
  const { id: channelId } = channel;

  if (content) {
    const urls = getAllUrls(content);

    if (urls.length > 0) {
      const entries = urls.map((url) => ({
        url,
        sharer: username,
        timestamp: new Date(createdTimestamp).toISOString(),
        content,
        channel: channel.name,
      }));

      entries.forEach(({ channel, content, sharer, timestamp, url }) => {
        const fields = {
          url,
          sharer,
          timestamp,
          channel,
          content,
          permalink: getDiscordPermalink(guild.id, channelId, id),
        };
        console.log("writing", fields);

        base(AIRTABLE_TABLE_NAME).create(
          [
            {
              fields,
            },
          ],
          function (err) {
            if (err) {
              console.error(err);
              return;
            }
          }
        );
      });
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

const getDiscordPermalink = (serverId, channelId, messageId) =>
  `https://discord.com/channels/${serverId}/${channelId}/${messageId}`;
