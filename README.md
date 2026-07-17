# PTE UI

A modern PTE Academic preparation platform built with React, Vite, Express, Prisma, and Tailwind CSS.

## Overview

PTE UI helps students practise PTE Academic tasks, receive scoring feedback, review diagnostic results, and manage their study progress through a clean web interface.

## Core Features

- Student practice interface for PTE task types
- Speaking, writing, reading, and listening practice flows
- AI-assisted scoring through DeepSeek when configured
- Local fallback grading for development and offline testing
- Student dashboard and progress review
- Teacher/admin-oriented feedback workflows
- Express API backend
- Prisma database layer
- Vite + React frontend
- Tailwind CSS styling

## Tech Stack

- React
- Vite
- TypeScript
- Express
- Prisma
- Tailwind CSS
- DeepSeek API integration
- Local fallback scoring engine

## Getting Started

### Prerequisites

- Node.js or Bun
- A configured database URL
- Optional DeepSeek API key for AI scoring

### Environment Variables

Create a local environment file from the example:

```
cp .env.example .env.local
```

Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Database connection string (e.g. `file:./dev.db` for SQLite) |
| `JWT_SECRET` | Secret key used for signing JSON Web Tokens |

Optional:

| Variable | Description |
|---|---|
| `DEEPSEEK_API_KEY` | API key for DeepSeek AI scoring (enables AI-powered feedback) |

### Install Dependencies

```
bun install
```

### Run Development Server

```
bun run dev
```

### Build

```
bun run build
```

### Start Production Build

```
bun run start
```

### Type Check

```
bun run lint
```

## Project Structure

```
src/
  server/        Express server logic and AI scoring services
  components/    UI components
  pages/         Application pages
  index.css      Tailwind and global styles

prisma/          Database schema and migrations
server.ts        Application server entry
vite.config.ts   Vite configuration
```

## AI Scoring Behaviour

When `DEEPSEEK_API_KEY` is configured, the backend uses DeepSeek for structured PTE scoring and feedback.
When the key is not configured or the provider call fails, the app falls back to the local heuristic scoring engine so the platform remains usable during development.

## Development Notes

- Keep provider-specific logic isolated inside `src/server/aiService.ts`.
- Keep README, package metadata, HTML title, and environment examples aligned with the PTE UI brand.

## License

Private project.
