require("dotenv").config();
const Discord = require("discord.js");

const client = new Discord.Client();
const { DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID } = process.env;

console.log(DISCORD_APPLICATION_ID, DISCORD_PUBLIC_KEY);

client.login("token");
