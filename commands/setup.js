const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const { SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandAttachmentOption, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { getDBConnection } = require('../getDBConnection');
const { teams } = require('./teams.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Runs the server setup prompts.'),
    async execute(interaction) {
        const db = await getDBConnection();

        // first, get player stats
        const userid = interaction.user.id;
        const guild = interaction.guild.id;
        const embed = new EmbedBuilder()
            .setTitle("Thank you for choosing Anarchy!")
            .setDescription(`You will now run through the server setup. To move on to the next step of the server setup, press the green button marked "next". Note that you will have 3 minutes per step.`)

        const buttons = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Continue')
                            .setStyle(ButtonStyle.Success))

        let message = await interaction.editReply({ embeds:[embed], components:[buttons], ephemeral:true})
        let messageCollector = await message.awaitMessageComponent({ componentType: ComponentType.Button, time: 180000})
        if (messageCollector.customId === "next") {
            embed.setDescription("You will now be prompted to select your channels for certain commands. Note that you can change these channels at any time by running the /channel command.")
            // only prompt for 3 channels; transactions, demands, results
            message = await messageCollector.update({ embeds:[embed], components:[buttons], ephemeral:true})
            messageCollector = await message.awaitMessageComponent({ componentType: ComponentType.Button, time: 180000})
        }
        if (messageCollector.customId === "next") {
            embed.setDescription("You will now be prompted to select your options for importing teams or starting from scratch. Note that you can create new teams at any time by running the /newteam command.")
            // 3 options: scan for existing teams, add new teams, add teams later
            message = await messageCollector.update({ embeds:[embed], components:[buttons], ephemeral:true})
            messageCollector = await message.awaitMessageComponent({ componentType: ComponentType.Button, time: 180000})
        }

        await db.close()
    }
}