/**
    @module renderer.fastcontainer
**/
game.module(
    'engine.renderer.fastcontainer'
)
.require(
    'engine.renderer.container'
)
.body(function() {

/**
    @class FastContainer
    @extends Container
**/
game.createClass('FastContainer', 'Container', {
    /**
        @property {Boolean} _isRotated
        @private
    **/
    _isRotated: true,

    _getBounds: function() {
        this._worldBounds.x = 0;
        this._worldBounds.y = 0;
        this._worldBounds.width = 0;
        this._worldBounds.height = 0;
        return this._worldBounds;
    },

    /**
        @method _renderBatch
        @param {Sprite} child
        @param {CanvasRenderingContext2D} context
        @private
    **/
    _renderBatch: function(child, context) {
        context.globalAlpha = this._worldAlpha * child.alpha;

        var wt = this._worldTransform;
        var texture = child.texture;
        var tx = texture.position.x;
        var ty = texture.position.y;
        var tw = texture.width * game.scale;
        var th = texture.height * game.scale;

        if (child.rotation % (Math.PI * 2) === 0) {
            if (this._isRotated) {
                context.setTransform(wt.a, wt.b, wt.c, wt.d, wt.tx, wt.ty);
                this._isRotated = false;
            }

            var x = (child.position.x - child.anchor.x * child.scale.x) * game.scale;
            var y = (child.position.y - child.anchor.y * child.scale.y) * game.scale;

            context.drawImage(texture.baseTexture.source, tx, ty, tw, th, x, y, tw * child.scale.x, th * child.scale.y);
        }
        else {
            this._isRotated = true;

            child.updateTransform();
            var cwt = child._worldTransform;
            var x = cwt.tx * game.scale;
            var y = cwt.ty * game.scale;

            if (game.Renderer.roundPixels) {
                x = x | 0;
                y = y | 0;
            }

            context.setTransform(cwt.a, cwt.b, cwt.c, cwt.d, x, y);
            context.drawImage(texture.baseTexture.source, tx, ty, tw, th, 0, 0, tw, th);
        }
    },

    _renderChildren: function(context) {
        this._isRotated = true;

        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            var texture = child.texture;
            if (!child.visible || child.alpha <= 0 || !child.renderable || !texture) continue;

            this._renderBatch(child, context);
        }
    },

    _updateChildTransform: function() {
    }
});

});
