const dotenv = require("dotenv");
const Discord = require("discord.js");
const Airtable = require("airtable");
const Twitter = require("twitter");

dotenv.config();
const {
  DISCORD_BOT_TOKEN,
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_NAME,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_TOKEN_KEY,
  TWITTER_TOKEN_SECRET,
  RUNTIME_MODE,
} = process.env;

const DiscordClient = new Discord.Client();
Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

const TwitterClient = new Twitter({
  consumer_key: TWITTER_CONSUMER_KEY,
  consumer_secret: TWITTER_CONSUMER_SECRET,
  access_token_key: TWITTER_TOKEN_KEY,
  access_token_secret: TWITTER_TOKEN_SECRET,
});

DiscordClient.once("ready", () => {
  console.log("Listening");
});

DiscordClient.on("message", (message) => {
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

        if (RUNTIME_MODE !== "dev") {
          sendTweet(fields);
          writeToAirtable(fields);
        }
      });
    }
  }
});

DiscordClient.login(DISCORD_BOT_TOKEN);

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

const TWITTER_MAX_TWEET_LENGTH = 280;

const sendTweet = ({ url, sharer, channel, content }) => {
  const statusPreamble = `${sharer}#${channel}`;
  const longMessage = `${statusPreamble}: "${content}"`;
  const shortMessage = `${statusPreamble} shared ${url}`;
  const status =
    longMessage.length < TWITTER_MAX_TWEET_LENGTH ? longMessage : shortMessage;

  console.log("Tweeting:", status);
  TwitterClient.post(
    "statuses/update",
    { status },
    function (error, _tweet, response) {
      if (error) {
        console.error(error);
      }
    }
  );
};

const writeToAirtable = (fields) => {
  console.log("Writing to Airtable");
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
};
