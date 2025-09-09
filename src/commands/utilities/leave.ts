import { getVoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder, VoiceChannel } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leaves the voice channel you are in.'),
  async execute(interaction: any) {
    const voiceChannel: VoiceChannel = interaction.member.voice.channel;
    if (voiceChannel) {
      await interaction.reply(
        `You are in the voice channel: ${voiceChannel.name}, leaving...`
      );
      const voiceConnection = getVoiceConnection(voiceChannel.guildId);
      if (voiceConnection) {
        voiceConnection.destroy();
      }
    } else {
      await interaction.reply('You are not in a voice channel.');
    }
  },
};
