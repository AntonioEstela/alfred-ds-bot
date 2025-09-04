// src/commands/index.ts
import fs from 'fs';
import path from 'path';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

export function loadCommandJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

  const foldersPath = path.join(__dirname);
  const commandFolders = fs
    .readdirSync(foldersPath)
    .filter(file => file !== 'index.ts');

  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter(file => file.endsWith('.ts'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }

  return commands;
}
