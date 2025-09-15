import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder, TextChannel, VoiceChannel } from 'discord.js';
import { listenAndTranscribe } from '../../voice/transcribe';
import { parseIntent } from '../../nlu/intents';

function attachListener(
  conn: VoiceConnection,
  textChannel: TextChannel,
  invokerUserId: string
) {
  listenAndTranscribe(conn, invokerUserId, (text, isFinal) => {
    if (text) {
      console.log(`💬 ${isFinal ? 'Final' : 'Partial'} transcript: "${text}"`);
    }
    if (!isFinal) return;

    const intent = parseIntent(text);
    if (intent.action === 'play') {
      const q = intent.artist ? `${intent.song} ${intent.artist}` : intent.song;
      textChannel.send(`🥃 Amo, voy a reproducir: **${q}**`);
      // TODO: implement actual playback from query
      // await playFromQuery(conn.joinConfig.guildId!, q);
    }
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join-voice')
    .setDescription('Replies with the voice channel you are in and joins it.'),
  async execute(interaction: any) {
    const voiceChannel: VoiceChannel = interaction.member.voice.channel;
    const textChannel: TextChannel = interaction.channel;

    if (voiceChannel) {
      await interaction.reply(
        `You are in the voice channel: ${voiceChannel.name}, joining...`
      );

      const conn = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      conn.on('stateChange', (_oldState, newState) => {
        if (newState.status === 'ready') {
          attachListener(conn, textChannel, interaction.user.id);
        } else if (newState.status === 'destroyed') {
          console.log('❌ Voice connection destroyed');
        } else if (newState.status === 'disconnected') {
          console.log('🔌 Voice connection disconnected');
        }
      });

      // If already ready, attach immediately
      if (conn.state.status === 'ready') {
        attachListener(conn, textChannel, interaction.user.id);
      }
    } else {
      await interaction.reply(
        'You are not in a voice channel. Join one first.'
      );
    }
  },
};
