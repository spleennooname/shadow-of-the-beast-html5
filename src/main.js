import * as PIXI from 'pixi.js';

import { ASSETS } from './assets.js';
import { GAME_CONFIG } from './game.js';
import { CRT_FILTER_OPTIONS } from './filters.js';

/**
 * Dynamically import filters for better code splitting
 */
let pixiFilters = null;
const loadFilters = async () => {
  if (!pixiFilters) {
    pixiFilters = await import('pixi-filters');
  }
  return pixiFilters;
};

// game state object
const createGameState = () => ({
  app: null,
  parallaxLayers: {},
  character: null,
  gameSpeed: 200,
  filters: {
    crt: null,
    bloom: null
  },
  audio: null,
  ui: {
    resizeObserver: null,
    resizeTimeout: null
  }
});

/**
 * Initialize PIXI application
 * @param {Object} state - Game state object
 * @returns {Promise<Object>} Updated state
 */
const initializeApp = async (state) => {
  const app = new PIXI.Application();

  await app.init({
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    backgroundColor: GAME_CONFIG.backgroundColor,
    antialias: true,
    preference: 'webgl2',
    resizeTo: window
  });

  // Configure ticker for 60fps
  app.ticker.maxFPS = 60;
  app.ticker.minFPS = 30;

  // Add canvas to DOM
  document.body.appendChild(app.canvas);

  return { ...state, app };
};

/**
 * Handle window resize - scale game to fit screen
 * @param {Object} state - Game state object
 */
const resizeGame = (state) => {
  if (!state.app) return;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Calculate scale factors
  const scaleX = screenWidth / GAME_CONFIG.width;
  const scaleY = screenHeight / GAME_CONFIG.height;

  // Use the smaller scale to maintain aspect ratio
  const scale = Math.min(scaleX, scaleY);

  // Apply scaling to the main stage
  state.app.stage.scale.set(scale);

  // Center the game on screen
  state.app.stage.position.set(
    (screenWidth - GAME_CONFIG.width * scale) / 2,
    (screenHeight - GAME_CONFIG.height * scale) / 2
  );

  // Update renderer size
  state.app.renderer.resize(screenWidth, screenHeight);

  // Update CRT filter time for animation
  if (state.filters.crt) {
    state.filters.crt.time = performance.now() * 0.001;
  }
};

/**
 * Setup fullscreen resize system
 * @param {Object} state - Game state object
 * @returns {Object} Updated state
 */
const setupResize = (state) => {
  // Calculate scale to fit screen while maintaining aspect ratio
  const resizeHandler = () => resizeGame(state);
  resizeHandler();

  let resizeObserver = null;
  let resizeTimeout = null;

  // Use ResizeObserver for better performance than window resize events
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      // Debounce resize calls for performance
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(resizeHandler, 16); // ~60fps
    });

    // Observe document body for size changes
    resizeObserver.observe(document.body);
  } else {
    // Fallback to window resize event for older browsers
    window.addEventListener('resize', resizeHandler);
  }

  return {
    ...state,
    ui: {
      ...state.ui,
      resizeObserver,
      resizeTimeout
    }
  };
};

/**
 * Load and setup game audio
 * @returns {Promise<Audio|null>} Audio instance or null if failed
 */
const loadAudio = async () => {
  try {
    const audio = new Audio('./audio/sotb.mp3');
    audio.loop = true;
    audio.volume = 0.7;

    // Wait for audio to be ready
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
      audio.load();
    });

    console.log('Audio loaded successfully');
    return audio;
  } catch (error) {
    console.warn('Audio loading failed:', error);
    return null;
  }
};

/**
 * Load all game assets including audio
 * @param {Object} state - Game state object
 * @returns {Promise<Object>} Updated state
 */
const loadAssets = async (state) => {

  // Validate and add assets to loader
  for (const [alias, src] of Object.entries(ASSETS)) {
    if (typeof src === 'string' && src.length > 0) {
      PIXI.Assets.add({ alias, src });
    } else {
      console.warn(`Invalid asset src for ${alias}:`, src);
    }
  }

  // Load all assets
  try {
    await PIXI.Assets.load(Object.keys(ASSETS));
    console.log('Assets loaded successfully');
  } catch (error) {
    console.error('Error loading assets:', error);
    throw error;
  }

  // Load and setup audio
  const audio = await loadAudio();

  return { ...state, audio };
};

/**
 * Setup audio toggle button functionality
 * @param {Object} state - Game state object
 */
const setupAudioToggle = (state) => {
  const audioToggle = document.getElementById('audioToggle');
  if (!audioToggle || !state.audio) return;

  let isPlaying = false;

  /**
   * Update button appearance based on audio state
   */
  const updateButton = () => {
    audioToggle.textContent = isPlaying ? '🔊' : '🔇';
    audioToggle.classList.toggle('muted', !isPlaying);
  };

  /**
   * Toggle audio playback
   */
  const toggleAudio = () => {
    if (isPlaying) {
      state.audio.pause();
      isPlaying = false;
    } else {
      const playPromise = state.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlaying = true;
          updateButton();
        }).catch(console.error);
      }
    }
    updateButton();
  };

  // Setup button event listener
  audioToggle.addEventListener('click', toggleAudio);
  
  // Show the button in muted state initially
  audioToggle.style.display = 'flex';
  updateButton(); // Initialize as muted/off
  
  return { toggleAudio, updateButton };
};

/**
 * Start audio playback
 * @param {Object} state - Game state object
 */
const startAudio = (state) => {
  if (!state.audio) return;

  // Setup audio toggle button (starts as off/muted)
  const audioControls = setupAudioToggle(state);

  // Don't attempt autoplay - let user control audio via button
  console.log('Audio loaded. Use the audio button to start playback.');
};

/**
 * Create animated character sprite
 * @param {Object} state - Game state object
 * @returns {Object} Updated state
 */
const createCharacter = (state) => {
  const texture = PIXI.Assets.get('aarbon');
  const frameWidth = 78;
  const frameHeight = 100;
  const frames = [];

  // Create animation frames
  for (let i = 0; i < 6; i++) {
    const rect = new PIXI.Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
    const frame = new PIXI.Texture({ source: texture.source, frame: rect });
    frames.push(frame);
  }

  // Create animated sprite with PIXI v8 syntax
  const character = new PIXI.AnimatedSprite(frames);
  character.position.set(GAME_CONFIG.width / 2 - 50, 250);
  character.animationSpeed = 0.2; // Optimized for 60fps (12fps animation)
  character.loop = true;
  character.autoUpdate = true;
  character.play();
  state.app.stage.addChild(character);

  return { ...state, character };
};

/**
 * Setup CRT scanlines effect and bloom filter
 * @param {Object} state - Game state object
 * @returns {Promise<Object>} Updated state
 */
const setupCRTEffect = async (state) => {
  // Load filters dynamically
  const filters = await loadFilters();

  // Create CRT filter from pixi-filters
  const crtFilter = new filters.CRTFilter(CRT_FILTER_OPTIONS);

  // Apply both bloom and CRT filters to the entire stage
  state.app.stage.filters = [state.filters.bloom];

  return {
    ...state,
    filters: {
      ...state.filters,
      crt: crtFilter
    }
  };
};

/**
 * Create parallax layer sprite
 * @param {string} textureName - PIXI texture name
 * @param {number} y - Y position
 * @param {number} speed - Scroll speed
 * @param {number} blur - Blur amount (0 = no blur)
 * @param {Object} filters - Loaded filters object
 * @returns {Object} Layer configuration
 */
const createParallaxLayer = (textureName, y, speed, blur = 0, filters = null) => {
  const texture = PIXI.Assets.get(textureName);

  const sprite = new PIXI.TilingSprite({
    texture: texture,
    width: GAME_CONFIG.width * 2, // Make wider for seamless scrolling
    height: texture.height
  });
  sprite.position.set(-GAME_CONFIG.width * 0.5, y); // Center wider sprite
  sprite.tilePosition.x = 0; // Initialize tilePosition

  // Apply KawaseBlurFilter for depth effect - more blur = more distant
  if (blur > 0 && filters) {
    const kawaseBlur = new filters.KawaseBlurFilter({
      blur,
      quality: 3
    });
    sprite.filters = [kawaseBlur];
  }

  return { sprite, speed };
};

/**
 * Create the main game scene with parallax layers
 * @param {Object} state - Game state object
 * @returns {Promise<Object>} Updated state
 */
const createScene = async (state) => {
  // Verify critical assets are loaded
  const requiredAssets = ['sky', 'moon', 'aarbon', 'montagne', 'barriere'];
  for (const asset of requiredAssets) {

    const texture = PIXI.Assets.get(asset);
    if (!texture) {
      console.error(`Asset '${asset}' not loaded or not found`);
      return state;
    }
  }

  // Load filters for use in layers
  const filters = await loadFilters();

  // Create BloomFilter for stage-wide glow effect
  const bloomFilter = new filters.BloomFilter({
    quality: 4,
    strength: 1,
    threshold: 1
  });

  // Sky background - ensure full coverage without Y repeat
  const skyLayer = createParallaxLayer('sky', 0, 60);
  skyLayer.sprite.height = GAME_CONFIG.height * 1.0; // Override height for sky
  state.app.stage.addChild(skyLayer.sprite);

  // Moon with bloom effect
  const moon = new PIXI.Sprite(PIXI.Assets.get('moon'));
  moon.position.set(500, 10);
  moon.blendMode = 'lighten';
  state.app.stage.addChild(moon);

  // Cloud layers - INVERTED: top faster, bottom slower
  const cloudLayers = [
    { name: 'nuv0', y: 0, speed: state.gameSpeed + 160, blur: 0 },      // Top - fastest
    { name: 'nuv1', y: 42, speed: state.gameSpeed + 60, blur: 0.5 },    // 
    { name: 'nuv2', y: 102, speed: state.gameSpeed - 20, blur: 1 },     //
    { name: 'nuv3', y: 140, speed: state.gameSpeed - 80, blur: 1.5 },   //
    { name: 'nuv4', y: 150, speed: state.gameSpeed - 140, blur: 2 }     // Bottom - slowest
  ];

  const parallaxLayers = { sky: skyLayer };

  cloudLayers.forEach((layer) => {
    const layerConfig = createParallaxLayer(layer.name, layer.y, layer.speed, layer.blur, filters);
    state.app.stage.addChild(layerConfig.sprite);
    parallaxLayers[layer.name] = layerConfig;
  });

  // Mountains
  const montagneLayer = createParallaxLayer('montagne', 194, state.gameSpeed * 0.6);
  state.app.stage.addChild(montagneLayer.sprite);
  parallaxLayers.montagne = montagneLayer;

  // Grass layers - CORRECT parallax: layers closer to barrier = faster
  const grassLayers = [
    { name: 'erba4', y: 378, speed: state.gameSpeed * 2.5 }, // Closest to barrier = fastest
    { name: 'erba3', y: 364, speed: state.gameSpeed * 2.0 },
    { name: 'erba2', y: 350, speed: state.gameSpeed * 1.6 },
    { name: 'erba1', y: 344, speed: state.gameSpeed * 1.3 },
    { name: 'erba0', y: 340, speed: state.gameSpeed * 1.0 }  // Farthest from barrier = slowest
  ];

  grassLayers.forEach((layer) => {
    const layerConfig = createParallaxLayer(layer.name, layer.y, layer.speed);
    state.app.stage.addChild(layerConfig.sprite);
    parallaxLayers[layer.name] = layerConfig;
  });

  // Barrier
  const barriereLayer = createParallaxLayer('barriere', 358, state.gameSpeed * 1.2);
  state.app.stage.addChild(barriereLayer.sprite);
  parallaxLayers.barriere = barriereLayer;

  return {
    ...state,
    parallaxLayers,
    filters: {
      ...state.filters,
      bloom: bloomFilter
    }
  };
};

/**
 * Game update loop
 * @param {Object} state - Game state object
 * @param {PIXI.Ticker} ticker - PIXI Ticker object
 */
const updateGame = (state, ticker) => {
  // Get delta from ticker object (PIXI v8 syntax)
  const deltaTime = ticker.deltaTime / 60; // Convert to frame-independent time

  // Update parallax layers with frame-independent movement
  Object.values(state.parallaxLayers).forEach(layer => {
    if (layer.speed > 0) {
      // Speed is in pixels per second, deltaTime normalizes for consistent movement
      layer.sprite.tilePosition.x -= layer.speed * deltaTime;
    }
  });

  // Update CRT filter animation
  if (state.filters.crt) {
    state.filters.crt.time = performance.now() * 0.001;
  }
};

/**
 * Initialize and start the game
 */
const initGame = async () => {
  try {
    // Create initial game state
    let gameState = createGameState();

    // Initialize PIXI application
    gameState = await initializeApp(gameState);

    // Setup fullscreen resize system
    gameState = setupResize(gameState);

    // Load assets
    gameState = await loadAssets(gameState);

    // Create game scene
    gameState = await createScene(gameState);

    // Create character
    gameState = createCharacter(gameState);

    // Setup CRT effect
    gameState = await setupCRTEffect(gameState);

    // Start audio playback
    startAudio(gameState);

    // Start game loop
    gameState.app.ticker.add((ticker) => updateGame(gameState, ticker));

    // Hide loading message
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }

    console.log('Game initialized successfully');
    return gameState;

  } catch (error) {
    console.error('Failed to initialize game:', error);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.textContent = 'Error loading game. Please check console for details.';
      loadingEl.style.color = '#ff6b6b';
    }
    throw error;
  }
};

// Initialize and start the game
initGame();