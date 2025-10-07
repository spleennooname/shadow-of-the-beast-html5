import * as PIXI from 'pixi.js';
import { CRTFilter, BloomFilter, KawaseBlurFilter } from 'pixi-filters';

/**
 * Shadow of the Beast HTML5 - PIXI.js version
 * Migration from custom PandaJS engine to PIXI.js
 */


// Game configuration
const GAME_CONFIG = {
    width: 640,
    height: 400,
    backgroundColor: '#000000'
};

// Asset paths
const BASE_ASSETS = "./public/";
const BASE_SPRITES = BASE_ASSETS + "sprites/1280x800/";

/**
 * Main Game Application class
 */
class ShadowOfTheBeast {
    constructor() {
        this.app = null;
        this.parallaxLayers = {};
        this.character = null;
        this.gameSpeed = 200; // Increased base speed for faster scrolling
        this.crtFilter = null; // CRT scanlines filter
        this.bloomFilter = null; // Bloom filter for glow effects
        this.audio = null; // Audio instance
        this.resizeObserver = null; // ResizeObserver instance
        this.resizeTimeout = null; // Debounce timeout for resize
    }

    /**
     * Initialize the game
     */
    async init() {
        // Create PIXI Application optimized for 60fps with fullscreen capability
        this.app = new PIXI.Application();

        await this.app.init({
            width: GAME_CONFIG.width,
            height: GAME_CONFIG.height,
            backgroundColor: GAME_CONFIG.backgroundColor,
            antialias: true,
            preference: 'webgl2',
            resizeTo: window // Enable auto-resize to window
        });

        // Configure ticker for 60fps
        this.app.ticker.maxFPS = 60;
        this.app.ticker.minFPS = 30;

        // Add canvas to DOM
        document.body.appendChild(this.app.canvas);

        // Setup fullscreen resize system
        this.setupResize();

        // Load assets
        await this.loadAssets();

        // Create game scene
        this.createScene();

        // Start game loop
        this.app.ticker.add((ticker) => this.update(ticker));

        // Hide loading message
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Setup fullscreen resize system using ResizeObserver
     */
    setupResize() {
        // Calculate scale to fit screen while maintaining aspect ratio
        this.resize();

        // Use ResizeObserver for better performance than window resize events
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver((entries) => {
                // Debounce resize calls for performance
                if (this.resizeTimeout) {
                    clearTimeout(this.resizeTimeout);
                }
                this.resizeTimeout = setTimeout(() => {
                    this.resize();
                }, 16); // ~60fps
            });
            
            // Observe document body for size changes
            this.resizeObserver.observe(document.body);
        } else {
            // Fallback to window resize event for older browsers
            window.addEventListener('resize', () => {
                this.resize();
            });
        }
    }

    /**
     * Handle window resize - scale game to fit screen
     */
    resize() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Calculate scale factors
        const scaleX = screenWidth / GAME_CONFIG.width;
        const scaleY = screenHeight / GAME_CONFIG.height;
        
        // Use the smaller scale to maintain aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        // Apply scaling to the main stage
        this.app.stage.scale.set(scale);
        
        // Center the game on screen
        this.app.stage.position.set(
            (screenWidth - GAME_CONFIG.width * scale) / 2,
            (screenHeight - GAME_CONFIG.height * scale) / 2
        );
        
        // Update renderer size
        this.app.renderer.resize(screenWidth, screenHeight);
        
        // Update CRT filter time for animation
        if (this.crtFilter) {
            this.crtFilter.time = performance.now() * 0.001;
        }
    }

    /**
     * Load all game assets including audio
     */
    async loadAssets() {
        const assetManifest = {
            'aarbon': BASE_SPRITES + 'aarbonRun@2x.png',
            'sky': BASE_SPRITES + 'sky@2x.png',
            'moon': BASE_SPRITES + 'luna@2x.png',
            'barriere': BASE_SPRITES + 'barriere@2x.png',
            'erba0': BASE_SPRITES + 'herbe0@2x.png',
            'erba1': BASE_SPRITES + 'herbe1@2x.png',
            'erba2': BASE_SPRITES + 'herbe2@2x.png',
            'erba3': BASE_SPRITES + 'herbe3@2x.png',
            'erba4': BASE_SPRITES + 'herbe4@2x.png',
            'nuv0': BASE_SPRITES + 'nuages0@2x.png',
            'nuv1': BASE_SPRITES + 'nuages1@2x.png',
            'nuv2': BASE_SPRITES + 'nuages2@2x.png',
            'nuv3': BASE_SPRITES + 'nuages3@2x.png',
            'nuv4': BASE_SPRITES + 'nuages4@2x.png',
            'montagne': BASE_SPRITES + 'montagnes@2x.png'
        };

        // Validate and add assets to loader
        for (const [alias, src] of Object.entries(assetManifest)) {
            if (typeof src === 'string' && src.length > 0) {
                PIXI.Assets.add({ alias, src });
            } else {
                console.warn(`Invalid asset src for ${alias}:`, src);
            }
        }

        // Load all assets
        try {
            await PIXI.Assets.load(Object.keys(assetManifest));
            console.log('Assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
            throw error;
        }

        // Load and setup audio separately using HTML5 Audio API
        await this.loadAudio();
    }

    /**
     * Load and setup game audio
     */
    async loadAudio() {
        try {
            this.audio = new Audio(`${BASE_ASSETS}audio/sotb.mp3`);
            this.audio.loop = true;
            this.audio.volume = 0.7;
            
            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
                this.audio.addEventListener('canplaythrough', resolve, { once: true });
                this.audio.addEventListener('error', reject, { once: true });
                this.audio.load();
            });
            
            console.log('Audio loaded successfully');
        } catch (error) {
            console.warn('Audio loading failed:', error);
        }
    }

    /**
     * Create the main game scene with parallax layers
     */
    createScene() {
        // Verify critical assets are loaded
        const requiredAssets = ['sky', 'moon', 'aarbon', 'montagne', 'barriere'];
        for (const asset of requiredAssets) {
            const texture = PIXI.Assets.get(asset);
            if (!texture) {
                console.error(`Asset '${asset}' not loaded or not found`);
                return;
            }
        }

        // Sky background - ensure full coverage without Y repeat
        const sky = new PIXI.TilingSprite({ 
            texture: PIXI.Assets.get('sky'), 
            width: GAME_CONFIG.width * 2, // X repeat for scrolling
            height: GAME_CONFIG.height * 0.5     // Full height - no Y repeat
        });
        sky.tilePosition.x = 0;
        sky.position.set(-GAME_CONFIG.width * 0.5, 0); // Center the wider sprite
        this.app.stage.addChild(sky);
        this.parallaxLayers.sky = { sprite: sky, speed: 60 }; // Increased base speed for continuity

        // Moon with bloom effect
        const moon = new PIXI.Sprite(PIXI.Assets.get('moon'));
        moon.position.set(500, 10);
        moon.blendMode = 'lighten'; // PIXI equivalent of 'lighten'
        
        // Create BloomFilter for stage-wide glow effect
        this.bloomFilter = new BloomFilter({
            blur: 1.5,
            quality: 4,
            strength: 1,
            threshold: 1
        });
        
        this.app.stage.addChild(moon);

        // Cloud layers - INVERTED: top faster, bottom slower (decreasing speed from top to bottom)
        const cloudLayers = [
            { name: 'nuv0', y: 0, speed: 160, blur: 0 },      // Top - 360 px/s (fastest, no blur - closest)
            { name: 'nuv1', y: 42, speed: 60, blur: 0.5 },    // 260 px/s (-100 like grass pattern, slight blur)
            { name: 'nuv2', y: 102, speed: -20, blur: 1 },    // 180 px/s (-80, medium blur)
            { name: 'nuv3', y: 140, speed: -80, blur: 1.5 },  // 120 px/s (-60, more blur - distant)
            { name: 'nuv4', y: 150, speed: -140, blur: 2 }    // Bottom - 60 px/s (slowest, most blur - farthest)
        ];

        cloudLayers.forEach((layer) => {
            // Calculate appropriate height based on texture to avoid Y repeats
            const texture = PIXI.Assets.get(layer.name);
            const textureHeight = texture.height;
            
            const sprite = new PIXI.TilingSprite({
                texture: texture,
                width: GAME_CONFIG.width * 2, // Make wider for seamless scrolling
                height: textureHeight
            });
            sprite.position.set(-GAME_CONFIG.width * 0.5, layer.y); // Center wider sprite
            sprite.tilePosition.x = 0; // Initialize tilePosition
            
            // Apply KawaseBlurFilter for depth effect - more blur = more distant
            if (layer.blur > 0) {
                const kawaseBlur = new KawaseBlurFilter({
                    blur: layer.blur,
                    quality: 3
                });
                sprite.filters = [kawaseBlur];
            }
            
            this.app.stage.addChild(sprite);

            this.parallaxLayers[layer.name] = { sprite, speed: this.gameSpeed + layer.speed };
        });

        // Mountains
        const montagneTexture = PIXI.Assets.get('montagne');
        const montagne = new PIXI.TilingSprite({
            texture: montagneTexture,
            width: GAME_CONFIG.width * 2, // Make wider for seamless scrolling
        });
        montagne.position.set(-GAME_CONFIG.width * 0.5, 194); // Center wider sprite
        montagne.tilePosition.x = 0; // Initialize tilePosition
       
        this.app.stage.addChild(montagne);

        this.parallaxLayers.montagne = { sprite: montagne, speed: this.gameSpeed * 0.6 }; // Mountains - medium speed

        // Grass layers - CORRECT parallax: layers closer to barrier (bottom/higher Y) = faster
        const grassLayers = [
            { name: 'erba4', y: 378, speed: this.gameSpeed * 2.5 }, // Closest to barrier (bottom) = fastest (250 px/s)
            { name: 'erba3', y: 364, speed: this.gameSpeed * 2.0 }, // (200 px/s)
            { name: 'erba2', y: 350, speed: this.gameSpeed * 1.6 }, // (160 px/s)  
            { name: 'erba1', y: 344, speed: this.gameSpeed * 1.3 }, // (130 px/s)
            { name: 'erba0', y: 340, speed: this.gameSpeed * 1.0 }  // Farthest from barrier (top) = slowest (100 px/s)
        ];

        grassLayers.forEach((layer) => {
            const texture = PIXI.Assets.get(layer.name);
            const sprite = new PIXI.TilingSprite({
                texture: texture,
                width: GAME_CONFIG.width * 2, // Make wider for seamless scrolling
                height: texture.height // Use exact texture height to prevent Y repeat
            });
            sprite.position.set(-GAME_CONFIG.width * 0.5, layer.y); // Center wider sprite
            sprite.tilePosition.x = 0; // Initialize tilePosition
            this.app.stage.addChild(sprite);
            this.parallaxLayers[layer.name] = { 
                sprite, 
                speed: layer.speed // Use specific speed for each layer
            };
        });

        // Barrier
        const barriereTexture = PIXI.Assets.get('barriere');
        const barriere = new PIXI.TilingSprite({
            texture: barriereTexture,
            width: GAME_CONFIG.width * 2, // Make wider for seamless scrolling
            height: barriereTexture.height // Use exact texture height to prevent Y repeat
        });
        barriere.position.set(-GAME_CONFIG.width * 0.5, 358); // Center wider sprite
        barriere.tilePosition.x = 0; // Initialize tilePosition
        this.app.stage.addChild(barriere);
        this.parallaxLayers.barriere = { sprite: barriere, speed: this.gameSpeed * 1.2 }; // Barrier - fast

        // Character animation
        this.createCharacter();
        
        // Start audio playback
        this.startAudio();
        
        // Apply CRT scanlines filter
        this.setupCRTEffect();
    }

    /**
     * Start audio playback
     */
    startAudio() {
        if (this.audio) {
            // Modern browsers require user interaction to play audio
            // Try to play automatically, fallback to user interaction
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Audio playback started');
                }).catch(() => {
                    console.log('Auto-play prevented. Adding click listener for audio start.');
                    // Add click listener to start audio on first user interaction
                    const startAudio = () => {
                        this.audio.play();
                        document.removeEventListener('click', startAudio);
                        document.removeEventListener('keydown', startAudio);
                    };
                    document.addEventListener('click', startAudio);
                    document.addEventListener('keydown', startAudio);
                });
            }
        }
    }

    /**
     * Setup CRT scanlines effect and bloom filter
     */
    setupCRTEffect() {
        // Create CRT filter from pixi-filters
        this.crtFilter = new CRTFilter({
            curvature: 1.0,
            lineWidth: 3.0,
            lineContrast: 0.3,
            verticalLine: false,
            noise: 0.25,
            noiseSize: 1.0,
            seed: Math.random(),
            vignetting: 0.2,
            vignettingAlpha: 0.4,
            vignettingBlur: 0.8,
            time: 0.5,
            alpha: 0.1
        });
        
        // Apply both bloom and CRT filters to the entire stage
        this.app.stage.filters = [this.bloomFilter, this.crtFilter];
    }

    /**
     * Create animated character sprite
     */
    createCharacter() {
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
        this.character = new PIXI.AnimatedSprite(frames);
        this.character.position.set(GAME_CONFIG.width / 2 - 50, 250);
        this.character.animationSpeed = 0.2; // Optimized for 60fps (12fps animation)
        this.character.loop = true;
        this.character.autoUpdate = true;
        this.character.play();
        this.app.stage.addChild(this.character);
        
    }

    /**
     * Game update loop
     * @param {Ticker} ticker - PIXI Ticker object
     */
    update(ticker) {
        // Get delta from ticker object (PIXI v8 syntax)
        // ticker.deltaTime is the ratio between target FPS and actual FPS
        // For 60fps: deltaTime = 1.0 when running at 60fps, >1.0 when slower, <1.0 when faster
        const deltaTime = ticker.deltaTime / 60; // Convert to frame-independent time (seconds)

        // Update parallax layers with frame-independent movement
        Object.values(this.parallaxLayers).forEach(layer => {
            if (layer.speed > 0) {
                // Speed is in pixels per second, deltaTime normalizes for consistent movement at any fps
                layer.sprite.tilePosition.x -= layer.speed * deltaTime;
            }
        });
        
        // Update CRT filter animation
        if (this.crtFilter) {
            this.crtFilter.time = performance.now() * 0.001;
        }
    }
}

// Initialize and start the game
const game = new ShadowOfTheBeast();
game.init().catch(error => {
    console.error('Failed to initialize game:', error);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.textContent = 'Error loading game. Please check console for details.';
        loadingEl.style.color = '#ff6b6b';
    }
});