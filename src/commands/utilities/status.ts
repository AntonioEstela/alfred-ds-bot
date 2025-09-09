import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Replies with bot status!'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply(
      `Hey ${interaction.user.username}, Alfred here, ready for what you need. Bat-signal in the distance, sir?`
    );
  },
};
