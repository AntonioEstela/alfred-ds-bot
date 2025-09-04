import { REST, Routes } from 'discord.js';
import { loadCommandJSON } from '../commands';
import { config } from 'dotenv';
config(); // load .env

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID; // set only for dev/guild deploys

async function main() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const body = loadCommandJSON(); // array of JSON commands

  if (GUILD_ID) {
    // ⚡ Instant updates (per-guild)
    const route = Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
    await rest.put(route, { body });
    console.log(`✅ Registered ${body.length} guild commands to ${GUILD_ID}`);
  } else {
    // 🌍 Global (can take minutes to appear)
    console.log('Registering global commands...');
    const route = Routes.applicationCommands(CLIENT_ID);
    await rest.put(route, { body });
    console.log(`✅ Registered ${body.length} global commands`);
  }
}

main().catch(err => {
  console.error('❌ Command registration failed:', err);
  process.exit(1);
});
