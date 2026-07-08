# LinguaForge

## Overview

AI-powered language learning app for intermediate-to-advanced learners, using hosted LLMs to generate exercises and practice flows.

## What it does

- Run a mobile/web Expo app.
- Generate language exercises using Groq and Gemini.
- Persist or connect learning state through Supabase variables.
- Support B2-C2 style practice workflows.

## User workflows

- Start Expo, choose platform, configure public AI/Supabase keys, and test exercise generation.

## Stack

- Expo React Native.
- TypeScript/JavaScript package scripts.
- Groq and Gemini AI APIs.
- Supabase public client configuration.

## Project structure

- `package.json` - Expo scripts.
- App source files in the project root/app structure.
- .env.example` - public runtime variable names.

## Setup

- Run `npm install`.
- Create `.env` from `.env.example`.
- Run `npm run start`.

## Common commands

- `npm run start` - Expo start.
- `npm run ios` - iOS run.
- `npm run android` - Android run.
- `npm run web` - web run.

## Configuration and secrets

- Uses `EXPO_PUBLIC_GEMINI_API_KEY`, `EXPO_PUBLIC_GROQ_API_KEY`, and Supabase public variables. Public mobile variables can be visible to clients; do not place privileged service keys there.

## Data, storage, and integrations

- Supabase stores app data when enabled. AI providers generate exercise content.

## Troubleshooting

- If generation fails, verify provider keys and model availability.
- If Supabase fails, verify project URL and anon key.

## Documentation maintenance

Update this README whenever functionality, setup, commands, environment variables, storage, integrations, or user workflows change. Follow the CoS project documentation standard in `../../../docs/project-documentation-standard.md` or `../../docs/project-documentation-standard.md` depending on the project depth. Never include real secret values.
