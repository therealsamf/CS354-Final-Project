
/**
 * System responsible for culling and drawing tiles
 */

import { 
	BufferGeometry, 
	InstancedBufferGeometry,
	PlaneGeometry,
	BufferAttribute, 
	InstancedBufferAttribute,
	Mesh,
	ClampToEdgeWrapping,
	NearestFilter,
	UVMapping,
	Texture,
	CanvasTexture,
	MeshBasicMaterial,
	RawShaderMaterial,
	Vector3
} from 'three';

import { System } from '../../dependencies/tiny-ecs';
import { requireAll } from '../../dependencies/tiny-ecs/filters';
import TileVertexShader from '../shaders/TileVertex';
import TileFragmentShader from '../shaders/TileFragment';

const tileSystemFilter = requireAll('TileComponent', 'TileTransform');

const CHUNK_SIZE = 8,
	TILE_SIZE = 30,
	TILE_Z_INDEX = 1,
	TILE_LAYER = 2;

class TileSystem extends System {
	constructor() {
		super();

		this.chunks = [];

		this.drawDebugChunks = false;
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

		if (!world.gui)
			world.gui = new dat.GUI();

		var self = this;
		world.gui.add(this, 'drawDebugChunks').onChange((value) => {
			for (let chunk of self.chunks) {
				chunk._dirty = true;
				chunk.drawDebugChunks = value;
			}
		});
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

		this._tiles = [];
	}

	/**
	 * @description - Adds a tile to the chunk at the given position and
	 * fixes the chunk's texture
	 * @param {Entity} tileEntity
	 */
	addTile(tileEntity) {

		this._tiles.push(Object.assign({}, tileEntity));

		// retrieve the tile's texture, potentially from an atlas
		let tileTextureURI = tileEntity.TileComponent.diffuse.texture,


			xCoords = tileEntity.TileComponent.xTextureCoords,
			yCoords = tileEntity.TileComponent.yTextureCoords,
			destX = (tileEntity.TileTransform.x - this.getX()) * 16,
			destY = (CHUNK_SIZE - tileEntity.TileTransform.y + this.getY() - 1) * 16;

		

		
		if (!this.canvas)
			this.canvas = Chunk.createChunkCanvas(this.getX(), this.getY());

		let self = this;

		return this.world.getTexture(tileTextureURI)
			// place the tile within the chunk's texture
			.then((image) => {
				// let ctx = self.canvas.getContext('2d');
				// ctx.drawImage(image, 
				// 	xCoords, yCoords, 16, 16,
				// 	destX, destY, 16, 16
				// );
				
				self._image = image;
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
			this.disposeChunkObject();
		}
		if (this.debugObject) {
			scene.remove(this.debugObject);
			this.disposeDebugObject();
		}
		if (this.worldObject) {
			this.world.removeEntity(this.worldObject);
		}

		// no image yet
		if (!this._image)
			return;

		// create geometry
		let geometry = this.createInstancedGeometry();

		// create material and mesh with CanvasTexture
		let material = this.getShaderMaterial();
		this.chunkObject = new Mesh(geometry, material);
		this.worldObject = {
			ShaderComponent: {
				material: this.chunkObject.material
			}
		};

		// translate mesh to the given spot
		this.chunkObject.translateX(this.getX() * TILE_SIZE + 0.5 * CHUNK_SIZE * TILE_SIZE);
		this.chunkObject.translateY(this.getY() * TILE_SIZE + 0.5 * CHUNK_SIZE * TILE_SIZE);

		// add it to the scene
		scene.add(this.chunkObject);
		// add the 'world object' to the world
		this.world.addEntity(this.worldObject);

		if (this.drawDebugChunks) {
			this.debugObject = this.createDebugObject();
			scene.add(this.debugObject);
		}

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
	 * @description - Creates the material using shaders
	 * @returns {Material}
	 */
	getShaderMaterial() {
		let texture = this._image;
		texture.magFilter = NearestFilter;

		let material = new RawShaderMaterial({
			uniforms: {
				map: { value: texture },
				directionalLights: {
					value: [],
					properties: {
						direction: {},
						color: {}
					}
				}
			},
			vertexShader: TileVertexShader,
			fragmentShader: TileFragmentShader
		});

		let dummyDirectionalLight = {};
		dummyDirectionalLight.direction = new Vector3(0.0, 0.0, 0.0);
		dummyDirectionalLight.color = new Vector3(0.0, 0.0, 0.0);

		material.uniforms.directionalLights.value.push(dummyDirectionalLight);

		return material;
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
	 * @description - Returns a debug object used for determining 
	 * chunk boundaries
	 * @returns {Mesh}
	 */
	createDebugObject() {
		let geometry = new PlaneGeometry(CHUNK_SIZE * TILE_SIZE, CHUNK_SIZE * TILE_SIZE);

		let canvas = document.createElement('canvas');
		canvas.width = 16 * CHUNK_SIZE;
		canvas.height = 16 * CHUNK_SIZE;

		let context = canvas.getContext('2d');
		context.strokeStyle = 'pink';
		context.rect(0, 0, canvas.width, canvas.height);
		context.stroke();

		let material = new MeshBasicMaterial({map: new CanvasTexture(canvas), transparent: true});

		let mesh = new Mesh(geometry, material);
		mesh.translateX(this.getX() * TILE_SIZE + 0.5 * CHUNK_SIZE * TILE_SIZE);
		mesh.translateY(this.getY() * TILE_SIZE + 0.5 * CHUNK_SIZE * TILE_SIZE);

		mesh.translateZ(TILE_Z_INDEX + 1);

		return mesh;
	}

	/**
	 * @description - Used to dispose the debug mesh so that we don't waste resources
	 */
	disposeDebugObject() {
		if (!this.debugObject)
			return;

		this.debugObject.material.map.dispose();
		this.debugObject.material.dispose();
		this.debugObject.geometry.dispose();
	}

	/**
	 * @description - Used to dispose the chunk object in order to avoid wasting memory
	 */
	disposeChunkObject() {
		if (!this.chunkObject)
			return;

		this.chunkObject.material.dispose();
		this.chunkObject.geometry.dispose();
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
	 * @description - Returns an intanced buffer geometry. As the instances
	 * are highly dependent on the current state of the tiles within the 
	 * chunk, this method isn't static
	 * @returns {InstancedBufferGeometry}
	 */
	createInstancedGeometry() {
		const { BoxBufferGeometry } = require('three');

		let halfTileLength = TILE_SIZE * 0.5,
			tileOffset = - 0.5 * CHUNK_SIZE * TILE_SIZE + halfTileLength;

		let positions = new Float32Array([
			-halfTileLength, -halfTileLength, TILE_Z_INDEX,
			halfTileLength, -halfTileLength, TILE_Z_INDEX,
			halfTileLength, halfTileLength, TILE_Z_INDEX,
			-halfTileLength, halfTileLength, TILE_Z_INDEX
		]),
			indices = new Uint8Array([
				0, 1, 2,
				2, 3, 0
			]);

		let geometry = new InstancedBufferGeometry();
		geometry.addAttribute('position', new BufferAttribute(positions, 3));
		geometry.setIndex(new BufferAttribute(indices, 1));

		let offsets = [],
			uvs = [],
			diffuseUVs = [],
			normalUVs = [],
			ambientReflectionConstant = [];

		for (let tile of this._tiles) {

			let transform = tile.TileTransform,
				offsetX = ((transform.x - this.getX())) * TILE_SIZE,
				offsetY = ((transform.y - this.getY())) * TILE_SIZE;

			offsetX = (transform.x - this.getX()) * TILE_SIZE + tileOffset;
			offsetY = (transform.y - this.getY()) * TILE_SIZE + tileOffset;

			let diffuseUVBottomLeft = tile.TileComponent.diffuse.uvBottomLeft,
				diffuseUVTopRight = tile.TileComponent.diffuse.uvTopRight;
			let normalUVBottomLeft = tile.TileComponent.normal.uvBottomLeft,
				normalUVTopRight = tile.TileComponent.normal.uvTopRight;

			offsets.push(offsetX);
			offsets.push(offsetY);

			diffuseUVs.push(diffuseUVBottomLeft[0]);
			diffuseUVs.push(diffuseUVBottomLeft[1]);
			diffuseUVs.push(diffuseUVTopRight[0]);
			diffuseUVs.push(diffuseUVTopRight[1]);

			normalUVs.push(normalUVBottomLeft[0])
			normalUVs.push(normalUVBottomLeft[1])
			normalUVs.push(normalUVTopRight[0])
			normalUVs.push(normalUVTopRight[1])

			for (let value of [
				0.0, 0.0,
				1.0, 0.0,
				1.0, 1.0,

				0.0, 1.0,
				0.0, 0.0,
				1.0, 1.0
				])
				uvs.push(value);

			ambientReflectionConstant.push(tile.TileComponent.material.ambientCoefficient);
		}

		geometry.addAttribute('offset', new InstancedBufferAttribute(new Float32Array(offsets), 2));
		let uvsAttribute = new BufferAttribute(new Float32Array(uvs), 2);
		let diffuseUVsAttribute = new InstancedBufferAttribute(new Float32Array(diffuseUVs), 4);
		let normalUVsAttribute = new InstancedBufferAttribute(new Float32Array(normalUVs), 4);
		let ambientReflectionConstantAttribute = new InstancedBufferAttribute(new Float32Array(ambientReflectionConstant), 1);

		geometry.addAttribute('uv', uvsAttribute);
		geometry.addAttribute('diffuseuvs', diffuseUVsAttribute);
		geometry.addAttribute('normaluvs', normalUVsAttribute);
		geometry.addAttribute('ambientreflectionconstant', ambientReflectionConstantAttribute);

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
