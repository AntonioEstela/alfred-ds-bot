import { joinVoiceChannel } from '@discordjs/voice';
import { SlashCommandBuilder, VoiceChannel } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join-voice')
    .setDescription('Replies with the voice channel you are in and joins it.'),
  async execute(interaction: any) {
    const voiceChannel: VoiceChannel = interaction.member.voice.channel;
    if (voiceChannel) {
      await interaction.reply(
        `You are in the voice channel: ${voiceChannel.name}, joining...`
      );
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });
    } else {
      await interaction.reply(
        'You are not in a voice channel. Join one first.'
      );
    }
  },
};
