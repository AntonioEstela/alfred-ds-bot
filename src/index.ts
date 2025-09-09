import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { generateDependencyReport } from '@discordjs/voice';

dotenv.config();

// Add a module augmentation so TypeScript knows about client.commands
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, unknown>;
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs
  .readdirSync(foldersPath)
  .filter(file => file !== 'index.ts');
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.ts'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const command: any = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});
