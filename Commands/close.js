// SupportBot | Emerald Services
// Close Ticket Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");
const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);
const cmdconfig = yaml.load(fs.readFileSync("./Configs/commands.yml", "utf8"));

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.CloseTicket,
  description: cmdconfig.CloseTicketDesc,
  slashCommandOptions: [
    {
      name: "reason",
      description: "Ticket Close Reason",
      type: "STRING",
    },
  ],
  permission: "SEND_MESSAGES",

  async run(interaction) {
    await interaction.deferReply();
    let TicketData = await JSON.parse(
      fs.readFileSync("./Data/TicketData.json", "utf8")
    ).tickets.find((t) => t.id === interaction.channel.id);
    if (!TicketData) {
      const Exists = new Discord.MessageEmbed()
        .setTitle("No Ticket Found!")
        .setDescription(`${supportbot.NoValidTicket}`)
        .setColor(supportbot.WarningColour);
      return interaction.followUp({ embeds: [Exists] });
    }
    let tUser = interaction.client.users.cache.get(TicketData.user);
    let transcriptChannel = await interaction.guild.channels.cache.find(
      (channel) =>
        channel.name == supportbot.TranscriptLog ||
        channel.id == supportbot.TranscriptLog
    );
    let logChannel = await interaction.guild.channels.cache.find(
      (channel) =>
        channel.name == supportbot.TicketLog ||
        channel.id == supportbot.TicketLog
    );
    let reason =
      (await interaction.options?.getString("reason")) || "No Reason Provided.";

    if (!transcriptChannel || !logChannel)
      return interaction.followUp("Some Channels seem to be missing!");
    if (supportbot.CloseConfirmation) {
      const CloseTicketRequest = new Discord.MessageEmbed()
        .setTitle(`**${supportbot.ClosingTicket}**`)
        .setDescription(
          `Please confirm by repeating the following word.. \`${supportbot.ClosingConfirmation_Word}\` `
        )
        .setColor(supportbot.EmbedColour);
      await interaction.followUp({ embeds: [CloseTicketRequest] });
      let filter = (m) =>
        m.content.toLowerCase() == supportbot.ClosingConfirmation_Word &&
        m.author.id == interaction.user.id;
      await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 20000,
        errors: ["time"],
      });
    }
    try {
      await interaction.followUp(`**${supportbot.ClosingTicket}**`);
      const transcriptEmbed = new Discord.MessageEmbed()
        .setTitle(supportbot.TranscriptTitle)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter)
        .addField(
          "Ticket",
          `${interaction.channel.name} (${interaction.channel.id})`
        )
        .addField(
          "User",
          `${tUser.username}#${tUser.discriminator} (${tUser.id})`
        )
        .addField("Closed By", interaction.user.tag)
        .addField("Reason", reason);
      const logEmbed = new Discord.MessageEmbed()
        .setTitle(supportbot.TicketLog_Title)
        .setColor(supportbot.EmbedColour)
        .setFooter(supportbot.EmbedFooter)
        .addField(
          "Ticket",
          `${interaction.channel.name} (${interaction.channel.id})`
        )
        .addField(
          "User",
          `${tUser.username}#${tUser.discriminator} (${tUser.id})`
        )
        .addField("Closed By", interaction.user.tag)
        .addField("Reason", reason);
      let msgs = await interaction.channel.messages.fetch();
      let html = "";

      msgs = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      html += `<style>* {background-color: #2c2f33;color: #fff;font-family: Arial, Helvetica, sans-serif;}</style>`;
      html += `<strong>Server Name:</strong> ${interaction.guild.name}<br>`;
      html += `<strong>Ticket:</strong> ${interaction.channel.name}<br>`;
      html += `<strong>Message:</strong> ${msgs.size} Messages<br><br><br>`;

      await msgs.forEach((msg) => {
        if (msg.content) {
          html += `<strong>User:</strong> ${msg.author.tag}<br>`;
          html += `<strong>Message:</strong> ${msg.content}<br>`;
          html += `-----<br><br>`;
        }
      });

      await logChannel.send({ embeds: [logEmbed] }).catch((err) => {
        console.error(err);
      });

      let file = new Discord.MessageAttachment(
        Buffer.from(html),
        `${interaction.channel.name}.html`
      );
      await transcriptChannel
        .send({ embeds: [transcriptEmbed], files: [file] })
        .catch(async (err) => {
          console.error(err);
        });
      await tUser
        .send({ embeds: [transcriptEmbed], files: [file] })
        .catch(async (err) => {
          console.error(err);
        });
      TicketData.subUsers.forEach(async (subUser) => {
        interaction.client.users.cache
          .get(subUser)
          .send({ embeds: [transcriptEmbed], files: [file] });
      });
      await interaction.channel.delete().catch(async (error) => {
        console.error(error);
        if (error.code !== Discord.Constants.APIErrors.UNKNOWN_CHANNEL) {
          console.error("Failed to delete the interaction:", error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  },
});
