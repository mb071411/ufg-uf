const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const { SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandAttachmentOption, EmbedBuilder } = require('discord.js');
const { getDBConnection } = require('../getDBConnection');
const { admins, maxPlayers } = require('../config.json');

const attemptsOption = new SlashCommandIntegerOption().setRequired(true).setName('catches').setDescription("The number of catches you've made");
const tdOption = new SlashCommandIntegerOption().setRequired(true).setName('touchdowns').setDescription("The number of touchdowns you've caught");
const yardsOption = new SlashCommandIntegerOption().setRequired(true).setName('yards').setDescription("The number of yards you've ran for");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wrstats')
        .addIntegerOption(attemptsOption)
        .addIntegerOption(tdOption)
        .addIntegerOption(yardsOption)
        .setDescription('Records a players wide receiver stats for use in a statsheet.'),
    async execute(interaction) {
        const db = await getDBConnection();

        // first, get player stats
        const userid = interaction.user.id;
        const guild = interaction.guild.id
        const attempts = interaction.options.getInteger('catches')
        const tds = interaction.options.getInteger('touchdowns')
        const yards = interaction.options.getInteger('yards')

        const admin = await db.get('SELECT * FROM Admins WHERE discordid = ? AND guild = ?', [interaction.user.id, guild])
        const manager = await db.get('SELECT * FROM Managers WHERE discordid = ? AND guild = ?', [interaction.user.id, guild])
        if (!(admin || manager)) {
            await db.close()
            return interaction.editReply({ content:"You are not permitted to run this command!", ephemeral:true })
        }

        let average = yards / attempts
        average = Math.round(average * 10) / 10

        // first, check to see if player already has qb stats logged
        const playerExists = await db.get("SELECT * FROM WRStats WHERE discordid = ?", userid);
        if (!playerExists) {
            await db.run("INSERT INTO WRStats (discordid, guild, average, catches, touchdowns, yards) VALUES (?, ?, ?, ?, ?, ?)", [userid, guild, 0, 0, 0, 0])
        }
        await db.run("UPDATE WRStats SET catches = catches + ?, touchdowns = touchdowns + ?, yards = yards + ? WHERE discordid = ? AND guild = ?", [attempts, tds, yards, userid, guild])
        await db.run("UPDATE WRStats SET average = (yards / catches) WHERE discordid = ? AND guild = ?", [userid, guild])
        await db.close()
        return interaction.editReply({ content:`Successfully uploaded WR stats!`, ephemeral:true })
    }
}