# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a HTML5 recreation of the classic Amiga game "Shadow of the Beast" migrated from a custom PandaJS engine to PIXI.js with Vite as the build system. The project focuses on recreating the game's distinctive parallax scrolling effects with up to twelve layers of background elements.

## Build Commands

- `npm run dev`: Start Vite development server with hot reload
- `npm run build`: Build production version with Vite
- `npm run preview`: Preview production build locally

### Legacy Commands (deprecated)
- `grunt dev`: Build development version (concatenates core engine files)
- `grunt` or `grunt ugh`: Build production version (uglifies pre-built game.min.js)

## Architecture

### Current Architecture (PIXI.js)
- `main.js`: Main game application using PIXI.js v8
- `index.html`: Modern HTML5 entry point for Vite
- `vite.config.js`: Vite configuration for development and build
- `media/`: Game assets (sprites, audio) with resolution-specific folders

### Legacy Architecture (deprecated)
- `src/engine/`: Custom PandaJS-based engine (no longer used)
- `src/game/`: Original game code (migrated to main.js)

### Key Technical Features
- Multi-layer parallax scrolling implemented with PIXI.TilingSprite (main.js:150-155)
- Character sprite animation using PIXI.AnimatedSprite with 6-frame running cycle (main.js:128-140)
- Modern async/await asset loading with PIXI.Assets (main.js:48-70)
- Responsive canvas rendering with proper pixel art scaling

### Migration Notes
- Migrated from custom PandaJS engine to PIXI.js v8
- Replaced Grunt build system with Vite for modern development experience
- Converted module system to ES6 modules
- Parallax scrolling preserved with varying speeds: clouds (40-200px/s), grass layers (40-160px/s increment)
- Character animation maintained at 12fps equivalent (0.2 animationSpeed in PIXI)
- Asset paths updated to use local media folder instead of CDN