const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const fs = require('fs').promises
const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption, EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js');
const { getDBConnection } = require('../getDBConnection');

const nameOption = new SlashCommandUserOption()
    .setRequired(true)
    .setName('user')
    .setDescription('The person to whitelist')

const fieldOption = new SlashCommandStringOption()
    .setRequired(true)
    .setName("role")
    .setDescription("The role you want to whitelist the user for")
    .addChoices(
        {name:"Manager", value:"managers"},
        {name:"Admin", value:"admins"}
    )

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwhitelist')
        .setDescription('Unwhitelists a user for a specific role.')
        .addUserOption(nameOption)
        .addStringOption(fieldOption),
    async execute(interaction) {
        const db = await getDBConnection()
        const user = interaction.options.getUser("user");
        const type = interaction.options.getString("role");
        const guild = interaction.guild.id

        if (type === "managers") {
            const authorized = await db.get('SELECT * FROM Admins WHERE discordid = ? AND guild = ?', [interaction.user.id, guild])
            if (!authorized) {
                await db.close()
                return interaction.editReply({ content:`You are not authorized to unwhitelist managers!`, ephemeral:true });
            }

            const managerExists = await db.get('SELECT * FROM Managers WHERE discordid = ? AND guild = ?', [user.id, guild])
            if (!managerExists) {
                await db.close()
                return interaction.editReply({ content:`${user} is not whitelisted!`, ephemeral:true });
            }
            await db.run('DELETE FROM Managers WHERE discordid = ? AND guild = ?', [user.id, guild])
        } else if (type === "admins") {
            if (interaction.guild.ownerId !== interaction.user.id) {
                await db.close()
                return interaction.editReply({ content:`You are not authorized to unwhitelist admins!`, ephemeral:true });
            }
            const managerExists = await db.get('SELECT * FROM Admins WHERE discordid = ? AND guild = ?', [user.id, guild])
            if (!managerExists) {
                await db.close()
                return interaction.editReply({ content:`${user} is not whitelisted!`, ephemeral:true });
            }
            await db.run('DELETE FROM Admins WHERE discordid = ? AND guild = ?', [user.id, guild])
        }
        await db.close()
        return interaction.editReply({ content:`Successfully unwhitelisted ${user}!`, ephemeral:true });
    }
}