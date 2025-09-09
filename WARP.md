# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Alfred Discord Bot** is a Discord bot inspired by Alfred: always listening, always on time, always elegant. Built with TypeScript, Discord.js v14, and modern Node.js practices.

## Essential Commands

### Development Workflow
```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Build the project
pnpm build

# Start production server
pnpm start

# Register bot commands (required after adding new commands)
pnpm register
```

### Code Quality
```bash
# Run linter
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting without fixing
pnpm format:check

# Run both linting and formatting together
pnpm lint-and-format
```

### Testing
```bash
# Currently no tests configured
pnpm test  # Will exit with error
```

## Architecture Overview

### Core Structure
- **Entry Point**: `src/index.ts` - Discord client initialization and command loading
- **Command Registry**: `src/registry/register-commands.ts` - Discord API command registration
- **Command Loader**: `src/commands/index.ts` - Dynamic command discovery and JSON export
- **Commands**: `src/commands/*/` - Organized by category (utilities, etc.)

### Command System
The bot uses a **modular command architecture**:
- Commands are organized in category folders under `src/commands/`
- Each command file exports `data` (SlashCommandBuilder) and `execute` function
- Commands are automatically discovered and loaded at runtime
- Command registration is separate from runtime loading (via `pnpm register`)

### Key Technical Patterns
- **Module Augmentation**: Extends Discord.js Client interface to include commands collection
- **CommonJS Modules**: Uses `require()` for dynamic command loading (mixed with ES modules)
- **Environment Configuration**: Uses dotenv for configuration (Discord tokens, guild IDs)
- **TypeScript**: Compiled to `dist/` directory, source in `src/`

## Environment Setup

### Required Environment Variables
Create a `.env` file with:
```
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_TOKEN=your_bot_token_here  # Used by register script
CLIENT_ID=your_application_id_here
GUILD_ID=your_test_guild_id_here   # Optional: for instant guild-only commands
```

### Package Manager
- **Primary**: pnpm (specified in package.json as `pnpm@10.7.0`)
- Lock file: `pnpm-lock.yaml`

## Development Guidelines

### Command Development
1. Create new command files in appropriate `src/commands/category/` folder
2. Follow the command module pattern:
   ```typescript
   module.exports = {
     data: new SlashCommandBuilder()
       .setName('command-name')
       .setDescription('Description'),
     async execute(interaction) {
       // Command logic
     },
   };
   ```
3. Run `pnpm register` to register new commands with Discord
4. Commands are auto-discovered by the loader system

### Code Style
- **Prettier**: Configured with single quotes, 80 char width, 2-space indents
- **ESLint**: TypeScript-focused with JSON support
- **EditorConfig**: Enforces LF line endings, UTF-8, trailing newlines

### TypeScript Configuration
- Target: ES2022
- Module: CommonJS (for Discord.js compatibility)
- Output: `dist/` directory
- Strict mode enabled
- Declaration files generated

## Dependencies

### Core Runtime
- `discord.js@^14.22.1` - Discord API wrapper
- `@discordjs/voice@^0.19.0` - Voice channel support
- `dotenv@^17.2.2` - Environment configuration
- `libsodium-wrappers@^0.7.15` - Cryptography for voice

### Development Tools
- `typescript@^5.6.3` - TypeScript compiler
- `tsx@^4.20.5` - TypeScript execution and watching
- `eslint` + `typescript-eslint` - Linting
- `prettier@3.6.2` - Code formatting
- `semantic-release@^24.2.7` - Automated releases

## Special Considerations

### Command Registration vs Runtime
- **Registration** (`pnpm register`): Uploads command definitions to Discord API
- **Runtime** (`pnpm dev/start`): Loads and executes commands from files
- These are separate processes - always register after adding new commands

### Voice Channel Support
- Bot includes voice channel utilities (`@discordjs/voice`, `libsodium-wrappers`)
- Voice channel detection command exists (`/voice-channel`)

### Build System
- Development uses `tsx` for direct TypeScript execution
- Production builds to `dist/` with `tsc`
- Mixed module system (ES modules + CommonJS require for dynamic loading)

### Issue Templates
- Structured GitHub issue templates for bugs, features, chores, and docs
- Labels system: `type:bug`, `type:feature`, `type:chore`, `type:docs`
- Uses GitHub Discussions for questions

### Licensing
- Apache License 2.0
- Author: Antonio Estela
