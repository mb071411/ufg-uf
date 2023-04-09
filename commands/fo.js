const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const { SlashCommandBuilder, SlashCommandUserOption, SlashCommandRoleOption} = require('discord.js');
const { getDBConnection } = require('../getDBConnection');
const { admins } = require('../config.json');

const userOption = new SlashCommandUserOption()
    .setRequired(true)
    .setName('player')
    .setDescription('The player who you want to promote to franchise owner');

const teamOption = new SlashCommandRoleOption()
    .setRequired(true)
    .setName('team')
    .setDescription('The team you want to make the specified user franchise owner of')



module.exports = {
    data: new SlashCommandBuilder()
        .setName('fo')
        .setDescription('Assign a franchise owner to a team.')
        .addUserOption(userOption)
        .addRoleOption(teamOption),
    async execute(interaction) {
        const db = await getDBConnection();

        const userId = interaction.user.id;
        const userChoice = interaction.options.getMember('player');
        const teamChoice = interaction.options.getRole('team')
        const chosenUserId = userChoice.id;

        // check if the user is trying to assign themselves a role

        // first, check which branch of code we go into
        // if the choice is to assign a franchise owner, check if they are authorized.
        // this means the person calling the command must be on the admin list.
        if (!admins.includes(userId)) {
            await db.close();
            return interaction.editReply({ content:"You are not authorized to assign a franchise owner!", ephemeral:true });
        }

        // then, check to see if the team exists or not
        const teamExists = await db.get('SELECT * FROM Roles WHERE roleid = ? AND NOT code = "FA" AND NOT code = "GM" AND NOT code = "HC" AND NOT code = "FO"', teamChoice.id)

        if (!teamExists) {
            await db.close()
            return interaction.editReply({ content:'The specified team is not a valid team! Ensure the team exists before assigning a player to be an FO.', ephemeral:true })
        }

        // then, check to see if the role is taken or not
        const roleTaken = await db.get('SELECT * FROM Players WHERE role = "FO" AND team = ?', [teamExists.code]);

        if (roleTaken) {
            await db.close();
            return interaction.editReply({ content:'This role has already been filled!', ephemeral:true });
        }

        // delete from the database as a safeguard
        await db.run('DELETE FROM Players WHERE discordid = ?', chosenUserId)

        // then, change the role if the user is on a team and the user calling this command
        // is authorized
        await db.run('INSERT INTO Players (team, discordid, role, contractlength) VALUES (?, ?, ?, ?)', [teamExists.code, chosenUserId, "FO", 999]);

        // then, add the team role to the player
        userChoice.roles.add(teamChoice)

        // then, check to see if the franchise owner role exists
        const gmRole = await db.get('SELECT roleid FROM Roles WHERE code = "FO"');
        if (!gmRole) {
            // this means the role doesn't exist. create the role and log it
            const newRole = await interaction.guild.roles.create({
                name: "Franchise Owner"
            });

            await db.run('INSERT INTO Roles (code, roleid) VALUES (?, ?)', "FO", newRole.id);

            await userChoice.roles.add(newRole);
        } else {
            const role = await interaction.guild.roles.fetch(gmRole.roleid);

            await userChoice.roles.add(role);
        }

        // update the playercount if necessary
        await db.run('UPDATE Teams SET playercount = (SELECT COUNT(*) FROM Players WHERE team = ?) WHERE code = ?', [teamExists.code, teamExists.code])

        // then, send a message back to the user
        await interaction.editReply({ content:'Successfully promoted the specified user to franchise owner!', ephemeral:true });
        await db.close();
    }
}