game.module(
        'game.main'
    )
    .body(function() {

        var baseAssets = "https://spleennooname.github.io/shadow-of-the-beast-html5/media/";
        var baseSprites = baseAssets + "sprites/640x400/";

        game.addAsset(baseSprites + 'aarbonRun.png', 'aarbon');
        game.addAsset(baseSprites + 'sky.png', 'sky')
        game.addAsset(baseSprites + 'luna.png', 'moon');
        game.addAsset(baseSprites + 'barriere.png', 'barriere');

        game.addAsset(baseSprites + 'herbe0.png', 'erba0');
        game.addAsset(baseSprites + 'herbe1.png', 'erba1');
        game.addAsset(baseSprites + 'herbe2.png', 'erba2');
        game.addAsset(baseSprites + 'herbe3.png', 'erba3');
        game.addAsset(baseSprites + 'herbe4.png', 'erba4');

        game.addAsset(baseSprites + 'nuages0.png', 'nuv0');
        game.addAsset(baseSprites + 'nuages1.png', 'nuv1');
        game.addAsset(baseSprites + 'nuages2.png', 'nuv2');
        game.addAsset(baseSprites + 'nuages3.png', 'nuv3');
        game.addAsset(baseSprites + 'nuages4.png', 'nuv4');

        game.addAsset(baseSprites + 'montagnes.png', 'montagne');

        game.addAudio(baseAssets + 'audio/sotb.mp3', 'ost');

        game.createScene('Main', {
            backgroundColor: '#F77384',
            init: function() {

                this.sky = new game.TilingSprite('sky', game.width, game.height);
                this.sky.tilePosition.x = 0;
                this.sky.addTo(this.stage);

                this.moon = new game.Sprite('moon');
                this.moon.position.set(500, 10);
                this.moon.blendMode = 'lighten';
                this.moon.addTo(this.stage);

                this.erba4 = new game.TilingSprite('erba4');
                this.erba4.position.set(0, 378)
                this.erba4.addTo(this.stage);


                this.erba3 = new game.TilingSprite('erba3');
                this.erba3.position.set(0, 364)
                this.erba3.addTo(this.stage);

                this.erba2 = new game.TilingSprite('erba2');
                this.erba2.position.set(0, 350)
                this.erba2.addTo(this.stage);

                this.erba1 = new game.TilingSprite('erba1');
                this.erba1.position.set(0, 344)
                this.erba1.addTo(this.stage);

                this.erba0 = new game.TilingSprite('erba0');
                this.erba0.position.set(0, 340)
                this.erba0.addTo(this.stage);

                this.barr = new game.TilingSprite('barriere');
                this.barr.position.set(0, 358)
                this.barr.addTo(this.stage);

                this.montagne = new game.TilingSprite('montagne');
                this.montagne.position.set(0, 194)
                this.montagne.addTo(this.stage);


                this.nuv0 = new game.TilingSprite('nuv0');
                this.nuv0.blendMode = 'lighten';
                this.nuv0.position.set(0, 0);
                this.nuv0.addTo(this.stage);


                this.nuv1 = new game.TilingSprite('nuv1');;
                this.nuv1.position.set(0, 42)
                this.nuv1.addTo(this.stage);

                this.nuv2 = new game.TilingSprite('nuv2');
                this.nuv2.position.set(0, 102)
                this.nuv2.addTo(this.stage);

                this.nuv3 = new game.TilingSprite('nuv3');
                this.nuv3.position.set(0, 140)
                this.nuv3.addTo(this.stage);

                this.nuv4 = new game.TilingSprite('nuv4');
                this.nuv4.position.set(0, 150)

                this.nuv4.addTo(this.stage);

                this.aarbon = new game.SpriteSheet('aarbon', 78, 100).anim(6, 0);
                this.aarbon.position.set(game.width / 2 - 50, 250);
                this.aarbon.addAnim('run', [0, 1, 2, 3, 4, 5], {
                    loop: true,
                    speed: 12
                });
                this.aarbon.addTo(this.stage);
                this.aarbon.play("run");

                game.audio.playSound('ost');

            },

            update: function() {

                var base = 150;

                if (typeof this.montagne !== 'undefined') {
                    this.montagne.tilePosition.x -= base * game.delta;
                }

                for (var i = 4; i >= 0; i--) {
                    if (typeof this["erba" + i] !== 'undefined') {
                        this["erba" + i].tilePosition.x -= ( (40 * i) + base) * game.delta;
                    }
                }

                if (typeof this.barr !== 'undefined') {
                    this.barr.tilePosition.x -= (base) * game.delta;
                }

                for (var i = 0, k = 4; i <= 4; i++) {
                    if (typeof this["nuv" + i] !== 'undefined') {
                        this["nuv" + i].tilePosition.x -= (base + (40 * k--)) * game.delta;
                    }
                }
            }
        })
    });
