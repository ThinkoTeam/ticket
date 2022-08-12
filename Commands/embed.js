// SupportBot | Emerald Services
// Embed Command

const fs = require("fs");

const Discord = require("discord.js");
const yaml = require("js-yaml");

const supportbot = yaml.load(
  fs.readFileSync("./Configs/supportbot.yml", "utf8")
);

const cmdconfig = yaml.load(
  fs.readFileSync("./Configs/commands.yml", "utf8")
);

const msgconfig = yaml.load(
  fs.readFileSync("./Configs/messages.yml", "utf8")
)

const Command = require("../Structures/Command.js");

module.exports = new Command({
  name: cmdconfig.Embed.Command,
  description: cmdconfig.Embed.Description,
  type: Discord.ApplicationCommandType.ChatInput,
  options: [
    {
      name: "title",
      description: "Embed Title",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "message",
      description: "Embed Message",
      type: Discord.ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "color",
      description: "Embed HEX Color",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "fieldtitle",
      description: "Add an additional Embed Field",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "fieldcontent",
      description: "Add an additional Embed Field",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "thumbnail",
      description: "Embed Thumbnail URL",

      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: "image",
      description: "Embed Image URL",
      type: Discord.ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  permissions: cmdconfig.Embed.Permission,

  async run(interaction) {
    let disableCommand = true;

    const { getRole } = interaction.client;
    let SupportStaff = await getRole(supportbot.Roles.StaffMember.Staff, interaction.guild);
    let Admin = await getRole(supportbot.Roles.StaffMember.Admin, interaction.guild);

    if (!SupportStaff || !Admin)
      return interaction.reply(
        "Some roles seem to be missing!\nPlease check for errors when starting the bot."
      );

      const NoPerms = new Discord.EmbedBuilder()
      .setTitle("Invalid Permissions!")
      .setDescription(
        `${msgconfig.Error.IncorrectPerms}\n\nRole Required: \`${supportbot.Roles.StaffMember.Staff}\` or \`${supportbot.Roles.StaffMember.Admin}\``
      )
      .setColor(supportbot.Embed.Colours.Warn);

    if (
      interaction.member.roles.cache.has(SupportStaff.id) ||
      interaction.member.roles.cache.has(Admin.id)
    ) {
      const EmbedTitle = interaction.options.getString("title");
      const EmbedSubject = interaction.options.getString("message");
      const GeneralColour = interaction.options.getString("color");
      const EmbedThumbnail = interaction.options.getString("thumbnail");
      const EmbedImage = interaction.options.getString("image");
      const EmbedFieldContent = interaction.options.getString("fieldcontent");
      const EmbedFieldTitle = interaction.options.getString("fieldtitle");

      const EmbedMsg = new Discord.EmbedBuilder()
        .setTitle(EmbedTitle)
        .setDescription(EmbedSubject)
        .setColor(GeneralColour)
        .setThumbnail(EmbedThumbnail)
        .setImage(EmbedImage)
        if (EmbedFieldTitle && EmbedFieldContent) { EmbedMsg.addField(EmbedFieldTitle, EmbedFieldContent) };

      interaction.reply({
        embeds: [EmbedMsg],
      });
    } else {
      return interaction.reply({ embeds: [NoPerms] });
    }
  },
});
