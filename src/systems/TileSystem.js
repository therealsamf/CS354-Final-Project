
/**
 * System responsible for culling and drawing tiles
 */

import { 
	BufferGeometry, 
	BufferAttribute, 
	Mesh,
	ClampToEdgeWrapping,
	NearestFilter,
	UVMapping,
	CanvasTexture,
	MeshBasicMaterial
} from 'three';

import { System } from '../../dependencies/tiny-ecs';
import { requireAll } from '../../dependencies/tiny-ecs/filters';

const tileSystemFilter = requireAll('TileComponent', 'TileTransform');

const CHUNK_SIZE = 8,
	TILE_SIZE = 30,
	TILE_Z_INDEX = 1,
	TILE_LAYER = 2;

class TileSystem extends System {
	constructor() {
		super();

		this.chunks = [];
	}
	/**
	 * @description - Filters the correct entities into the system
	 * @param {Entity} entity
	 * @returns {Boolean}
	 */
	filter(entity) {
		return tileSystemFilter(entity);
	}

	/**
	 * @description - Called when an entity is added to the system
	 * @param {Entity} entity
	 * @returns {Promise}
	 */
	onAdd(entity) {

		// determine what chunk the tile should reside
		let chunk = this.findChunk(entity.TileTransform);
		if (!chunk) {
			chunk = this.createChunkWithPoint(entity.TileTransform.x, entity.TileTransform.y);
		}

		// add the tile to the chunk
		return chunk.addTile(entity);
	}

	/**
	 * @description - Called when the system is added to the world
	 * @param {World} world
	 */
	onAddToWorld(world) {
		// make sure the camera is aware of the tile layer
		world.getCamera().layers.enable(TILE_LAYER);

		this.scene = world.getScene();
	}

	/**
	 * @description - Called every frame, updates the system
	 * @param {Number} delta
	 */
	update(delta) {
		
		let clippingRect = this.world.getCamera().getFrustum();

		for (let chunk of this.chunks) {
			if (chunk.dirty()) {
				chunk.update(this.scene);
			}

			if (chunk.collide(clippingRect.x, clippingRect.y, clippingRect.top, clippingRect.bottom)) {
				chunk.show();
			}
			else {
				chunk.hide();
			}
		}
	}

	/**
	 * @description - Locates and returns the chunk given the
	 * tile component
	 * @param {Object} tileTransform
	 * @returns {Chunk}
	 */
	findChunk(tileTransform) {
		return this.retrieveChunkAtPoint(tileTransform.x, tileTransform.y);
	}

	/**
	 * @description - Return the chunk that collides with the given point
	 * @param {Number} x
	 * @param {Number} y
	 * @returns {Chunk}
	 */
	retrieveChunkAtPoint(x, y) {

		// simple collision testing, optimization could utilize a spatial data structure
		for (let chunk of this.chunks) {
			let chunkX = chunk.getX(),
				chunkY = chunk.getY();

			let collidesX = chunkX <= x && x < chunkX + CHUNK_SIZE,
				collidesY = chunkY <= y && y < chunkY + CHUNK_SIZE;

			if (collidesX && collidesY) {
				return chunk;
			}
		}

	}

	/**
	 * @description - Creates a new chunk that encompasses the given coordinates before
	 * adding said chunk to the system's list of chunks
	 * @param {Number} x
	 * @param {Number} y
	 * @returns {Chunk
	 */
	createChunkWithPoint(x, y) {

		// Want to create chunks at boundaries of CHUNK_SIZE
		let chunkX = Math.floor(x / CHUNK_SIZE),
			chunkY = Math.floor(y / CHUNK_SIZE);

		let newChunk = new Chunk(chunkX * CHUNK_SIZE, chunkY * CHUNK_SIZE, this.world);
		this.chunks.push(newChunk);

		return newChunk;
	}
};

class Chunk {
	/**
	 * @constructor
	 * @param {Number} x
	 * @param {Number} y
	 */
	constructor(x, y, world) {
		this._x = x;
		this._y = y;

		// ideally, this doesn't change
		this.world = world;

		this._dirty = true;
	}

	/**
	 * @description - Adds a tile to the chunk at the given position and
	 * fixes the chunk's texture
	 * @param {Entity} tileEntity
	 */
	addTile(tileEntity) {

		// retrieve the tile's texture, potentially from an atlas
		let tileTextureURI = tileEntity.TileComponent.atlas,
			xCoords = tileEntity.TileComponent.xTextureCoords,
			yCoords = tileEntity.TileComponent.yTextureCoords,
			destX = (tileEntity.TileTransform.x - this.getX()) * 16,
			destY = (CHUNK_SIZE - tileEntity.TileTransform.y + this.getY() - 1) * 16;

		

		
		if (!this.canvas)
			this.canvas = Chunk.createChunkCanvas(this.getX(), this.getY());

		this._dirty = true;
		let self = this;

		return this.world.getImage(tileTextureURI)
			// place the tile within the chunk's texture
			.then((image) => {
				let ctx = self.canvas.getContext('2d');
				ctx.drawImage(image, 
					xCoords, yCoords, 16, 16,
					destX, destY, 16, 16
				);
				
				self._dirty = true;
			});
	}

	/**
	 * @description - Creates a new THREE scene object with
	 * correct geometry and texture applied, ready to be added
	 * to the scene to be blitted
	 * @param {Scene} scene
	 */
	update(scene) {
		if (this.chunkObject) {
			scene.remove(this.chunkObject);
		}

		// create geometry
		let geometry = Chunk.createChunkGeometry();

		// create material and mesh with CanvasTexture
		let material = this.getMaterial();
		this.chunkObject = new Mesh(geometry, material);

		// translate mesh to the given spot
		this.chunkObject.translateX(this.getX() * TILE_SIZE);
		this.chunkObject.translateY(this.getY() * TILE_SIZE);

		// add it to the scene
		scene.add(this.chunkObject);

		this._dirty = false;
	}

	/**
	 * @description - Creates the material to be used with the chunk
	 * @returns {Material}
	 */
	getMaterial() {
		// create a CanvasTexture
		let texture = new CanvasTexture(this.canvas, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, NearestFilter);

		// create and return a material using the texture as the color map
		return new MeshBasicMaterial({map: texture});
	}

	/**
	 * @description - Tests if the given rectangle (in pixel coordinates) collides with
	 * the chunk
	 * @param {Number} leftX
	 * @param {Number} rightX
	 * @param {Number} topY
	 * @param {Number} bottomY
	 * @returns {Boolean}
	 */
	collide(leftX, rightX, topY, bottomY) {
		if ((this.getX() + CHUNK_SIZE) * TILE_SIZE < leftX)
			return false;
		if (this.getX() * TILE_SIZE > rightX)
			return false;

		if ((this.getY() + CHUNK_SIZE) * TILE_SIZE < bottomY)
			return false;
		if (this.getY() * TILE_SIZE > topY)
			return false;

		return true;
	}

	/**
	 * @description - Creates and returns a correctly sized canvas
	 * @param {Number=} x
	 * @param {Number=} y
	 * @returns {Canvas}
	 */
	static createChunkCanvas(x, y) {
		let canvas = document.createElement('canvas');

		canvas.width = CHUNK_SIZE * 16;
		canvas.height = CHUNK_SIZE * 16;

		return canvas;
	}

	/**
	 * @description - Returns the geometry for a chunk, two triangles
	 * correctly sized according to the constants for chunk sizes
	 * @static
	 * @returns {BufferGeometry}
	 */
	static createChunkGeometry() {
		let halfChunkLength = CHUNK_SIZE * TILE_SIZE * 0.5;
		let vertices = new Float32Array([
			-halfChunkLength, -halfChunkLength, TILE_Z_INDEX,
			halfChunkLength, -halfChunkLength, TILE_Z_INDEX,
			halfChunkLength, halfChunkLength, TILE_Z_INDEX,

			-halfChunkLength, halfChunkLength, TILE_Z_INDEX,
		]),
			indices = new Uint8Array([
				0, 1, 2,
				2, 3, 0
			]),
			uvs = new Float32Array([
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,

				0.0, 1.0,
				0.0, 0.0,
				1.0, 1.0				
			]);

		let geometry = new BufferGeometry();
		geometry.addAttribute('position', new BufferAttribute(vertices, 3));
		geometry.setIndex(new BufferAttribute(indices, 1));
		geometry.addAttribute('uv', new BufferAttribute(uvs, 2));

		return geometry;
	}

	/**
	 * @description - Accessor for the chunk's leftmost x coordinate
	 * @returns {Number}
	 */
	getX() {
		return this._x;
	}

	/**
	 * @description - Accessor for the chunk's topmost y coordinate
	 * @returns {Number}
	 */
	getY() {
		return this._y;
	}

	/**
	 * @description - Accessor for the chunk's `dirty` property
	 * @returns {Boolean}
	 */
	dirty() {
		return this._dirty;
	}

	/**
	 * @description - Sets the chunk mesh's layers object
	 * to the constant tile layer, which makes it visible to 
	 * the camera
	 */
	show() {
		if (!this.chunkObject)
			return;

		this.chunkObject.layers.set(TILE_LAYER);
	}

	/**
	 * @description - Removes the chunk's mesh's layers object
	 * to the constant tile layer, which makes it invisible to
	 * the camera
	 */
	hide() {
		if (!this.chunkObject)
			return;

		this.chunkObject.layers.disable(TILE_LAYER);
	}
}

export default TileSystem;
