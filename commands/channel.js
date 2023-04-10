const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const fs = require('fs').promises
const { SlashCommandBuilder, SlashCommandChannelOption, SlashCommandStringOption, EmbedBuilder } = require('discord.js');
const { getDBConnection } = require('../getDBConnection');
const { admins } = require('../config.json');

const channelChoices = new SlashCommandStringOption().setName("channel-options").setDescription("The possible types of channels").setRequired(true)
                          .addChoices(
                            { name:"Transactions", value: "transactions" },
                            { name:"Game Results", value: "results" },
                            { name:"Demands", value: "demands" },
                            { name:"Gametimes", value:"gametime" },
                            { name:"Looking for Players", value:"lfp" }
                          )

const channelMention = new SlashCommandChannelOption().setName("channel").setDescription("The channel you want to set").setRequired(true)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Allows you to set a channel for a specific purpose'),
    async execute(interaction) {
        const db = await getDBConnection();
        const userChoice = interaction.options.getString("channel-options")
        const channel = interaction.options.getChannel("channel")

        // write this later
    }
}