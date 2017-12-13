
/**
 * Reads the map and transforms the data into entities before inserting them
 * into the world
 */

import {
	CanvasTexture,
	NearestFilter
} from 'three';

import { 
 RawShaderMaterial,
 BufferGeometry,
 BufferAttribute,
 Vector3,
 Mesh
} from 'three';

import ObjectVertexShader from '../shaders/ObjectVertex.js';
import ObjectFragmentShader from '../shaders/ObjectFragment.js';

// hard coded for now
const TILE_SIZE = 16,
	TEXTURE_NAME = 'TEXTURE_NAME';

class MapReader {
	/**
	 * @constructor
	 * @param {World} world - used to add entities
	 */
	constructor(world) {
		this.world = world;
	}

	/**
	 * @description - The starting point for reading in maps. 
	 * Takes a URI to a JSON file with map data that can be read
	 * @param {String} dataURI
	 * @returns {Promise}
	 */
	readMap(dataURI) {
		let xhr = new XMLHttpRequest();

		
		let scriptElement = document.createElement('script');
		scriptElement.type = 'application/json';

		let returnPromise = new Promise((resolve, reject) => {
			xhr.open('GET', encodeURI(dataURI));

			xhr.onreadystatechange = () => {
				if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
					resolve(xhr.responseText);
				}
				else if (xhr.readyState == XMLHttpRequest.DONE) {
					reject();
				}
			}

			xhr.send();
		});

		let self = this;
		return returnPromise
			.then((responseText) => self.parseMap(responseText));
	}

	/**
	 * @description - Parses and reads the data and populates the world
	 * @param {String} mapData
	 * @
	 */
	parseMap(mapData) {
		mapData = JSON.parse(mapData);

		let maxRows = mapData.tiles.length,
			// assume we have at least one row
			maxColumns = mapData.tiles[0].length;

		let rowIndex = 0,
			columnIndex = 0;

		let tiles = [],
			objects = [];

		for (let tileRow of mapData.tiles) {
			columnIndex = 0;
			for (let tile of tileRow) {

				if (tile in mapData.tileTypes) {
					let newTile = this.getTile(Math.floor(columnIndex - 0.5 * maxColumns), Math.floor(0.5 * maxRows - rowIndex), mapData.tileTypes[tile]);
					tiles.push(newTile);
				}
				else if (tile in mapData.objectTypes) {
					let object = this.findObject(objects, tile);
					if (!object) {
						object = this.createObject(mapData.objectTypes[tile], tile);
						objects.push(object);
					}

					this.addTileToObject(Math.floor(columnIndex - 0.5 * maxColumns), Math.floor(0.5 * maxRows - rowIndex), object);


				}

				columnIndex += 1;
			}

			rowIndex += 1;
		}

		let self = this;
		this.packTextures(tiles)
			.then((texture) => {
				self.world.setTexture(TEXTURE_NAME, texture);

				for (let tile of tiles) {
					self.world.addEntity(tile);
				}
			})
			.then(() => {
				for (let object of objects) {
					self.parseObject(object);
				}
			});
	}

	/**
	 * @description - Looks through the list of tiles and packs all relevant textures
	 * while modifying locations of UV coordinates so that they're still correct
	 * @param {Array} tiles
	 * @returns {Promise}
	 */
	packTextures(tiles) {
		let uniqueTextures = {};

		for (let tile of tiles) {
			/* we know that every tile has a TileTransform
			 * and a TileComponent. We only care about the latter
			 */

			let tileComponent = tile.TileComponent;
			if (tileComponent.normal) {
				if (!uniqueTextures[tileComponent.normal.texture]) {
					uniqueTextures[tileComponent.normal.texture] = [];
					
				}
				uniqueTextures[tileComponent.normal.texture].push(tileComponent.normal);
			}

			if (tileComponent.diffuse) {
				if (!uniqueTextures[tileComponent.diffuse.texture]) {
					uniqueTextures[tileComponent.diffuse.texture] = [];
					
				}
				uniqueTextures[tileComponent.diffuse.texture].push(tileComponent.diffuse);
			}

			if (tileComponent.height) {
				if (!uniqueTextures[tileComponent.height.texture]) {
					uniqueTextures[tileComponent.height.texture] = [];
				}
				uniqueTextures[tileComponent.height.texture].push(tileComponent.height);
			}
		}

		let numberTextures = Object.keys(uniqueTextures).length,
			canvasLength = 8 * TILE_SIZE,
			textureWidth = canvasLength,
			textureHeight = TILE_SIZE;

		let canvas = document.createElement('canvas');
		canvas.width = textureWidth;
		canvas.height = textureHeight;

		let context = canvas.getContext('2d'),
			currentX = 0,
			currentY = 0,
			promise = Promise.resolve();

		for (let uniqueTexture in uniqueTextures) {
			let img;

			promise = promise.then(() => {
				return new Promise((resolve, reject) => {
					img = new Image();
					img.onload = () => resolve();
					img.src = uniqueTexture;
				})
					.then(() => {
						context.drawImage(img, 
							0, 0, TILE_SIZE, TILE_SIZE,
							currentX, currentY, TILE_SIZE, TILE_SIZE
						);

						// adjust the uvs to reflect the different position of the tile
						let top = (textureHeight - currentY) / textureHeight,
							right = (currentX + TILE_SIZE) / textureWidth,
							bottom = (textureHeight - currentY - TILE_SIZE) / textureHeight,
							left = currentX / textureWidth;

						for (let individualTexture of uniqueTextures[uniqueTexture]) {
							individualTexture.uvBottomLeft = [left, bottom];
							individualTexture.uvTopRight = [right, top];
							individualTexture.texture = TEXTURE_NAME;
						}

						currentX += TILE_SIZE;
					});
			});

		}

		return promise
			.then(() => {
				let canvasTexture = new CanvasTexture(canvas);
				canvasTexture.magFilter = NearestFilter;

				return Promise.resolve(canvasTexture);
			});
	}

	/**
	 * @description - Helper method to determine if 
	 * the object the given tile is referring to
	 * is already within the given list. This is a
	 * separate method not only for readablility and code-separation
	 * concerns but also because this method will probably change
	 * @param {Array} objects - list of objects currently being parsed from the map
	 * @param {String} tile - the tile that the map parsed from the map JSON file
	 * @param {Object=} objectData - the data that accompanied the tile string from the JSON file
	 * @returns {Object} the object from within `objects` or null
	 */
	findObject(objects, tile, objectData) {
		// most likely to change because now it only supports one object per unique character
		for (let object of objects) {
			if (object.string && object.string === tile)
				return object;
		}
		return null;
	}

	/**
	 * @description - Creates and returns a javascript object based on the data retrieved from
	 * the map JSON file
	 * @param {Object} objectData
	 * @param {String} tile
	 * @returns {Object}
	 */
	createObject(objectData, tile) {
		// this is likely to change, as more meta-data may be required to use the newly created object
		return Object.assign({}, objectData, {string: tile});
	}

	/**
	 * @description - Adds the given tile coordinates to the given object. This is used to track the 
	 * objects location, as it may span over multiple tiles
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Object} object
	 */
	addTileToObject(x, y, object) {

		// simple, perhaps memory wasting implementation, but good enough to work for now
		if (!object.tiles) {
			object.tiles = [];
		}

		object.tiles.push([x, y]);
	}

	/**
	 * @description - Takes a completely parsed object and transforms the javascript data
	 * structure into an entity that the tiny-ecs world can load
	 * @param {Object} object
	 * @param {Number} maxRows
	 * @param {Number} maxColumns
	 * @returns {Object} this object should be able to be directly fed into the tiny-ecs world
	 */
	parseObject(object, maxRows, maxColumns) {
		
		// world coordinates of the object
		let objectX,
			objectY;

		// bottomleft-most tile and topright-most tile of the object
		let bottomLeft,
			topRight;

		if (!object.tiles) {
			console.error('Can\'t parse an object with no `tiles` array');
			return;
		}

		for (let tile of object.tiles) {
			if (!bottomLeft || (tile[0] <= bottomLeft[0] && tile[1] <= bottomLeft[1])) {
				bottomLeft = tile;
			}

			if (!topRight || (tile[0] >= topRight[0] && tile[1] >= topRight[1])) {
				topRight = tile;
			}
		}


		let objectTileWidth = topRight[0] - bottomLeft[0] + 1,
			objectTileHeight = topRight[1] - bottomLeft[1] + 1;
		objectX = (bottomLeft[0] + topRight[0] + 1) * 0.5 * 30;
		objectY = (bottomLeft[1] + topRight[1] + 1) * 0.5 * 30;

		let material = new RawShaderMaterial({
			uniforms: {
				map: { value: this.world._getTexture(object.diffuse.texture)},
				normal_map: {value: this.world._getTexture(object.normal.texture)},
				height_map: {value: this.world._getTexture(object.height.texture)},
				directionalLights: {
					value: [],
					properties: {
						direction: {},
						color: {}
					}
				},
				pointLights: {
					value: [],
					properties: {
						position: {},
						color: {},
						aAttenuation: 0.0,
						bAttenuation: 0.0
					}
				}
			},
			vertexShader: ObjectVertexShader,
			fragmentShader: ObjectFragmentShader
		});

		let geometry = new BufferGeometry();

		geometry.addAttribute('position', new BufferAttribute(new Float32Array([
			-0.5 * objectTileWidth * 30, -0.5 * objectTileHeight * 30, 2,
			0.5 * objectTileWidth * 30, -0.5 * objectTileHeight * 30, 2,
			0.5 * objectTileWidth * 30, 0.5 * objectTileHeight * 30, 2,
			-0.5 * objectTileWidth * 30, 0.5 * objectTileHeight * 30, 2
		]), 3));
		geometry.setIndex(new BufferAttribute(new Uint8Array([
			0, 1, 2,
			2, 3, 0
		]), 1));
		geometry.addAttribute('uv', new BufferAttribute(new Float32Array([
			object.diffuse.uvBottomLeft[0], object.diffuse.uvBottomLeft[1],
			object.diffuse.uvTopRight[0], object.diffuse.uvBottomLeft[1],
			object.diffuse.uvTopRight[0], object.diffuse.uvTopRight[1],
			object.diffuse.uvBottomLeft[0], object.diffuse.uvTopRight[1],
			object.diffuse.uvBottomLeft[0], object.diffuse.uvBottomLeft[1],
			object.diffuse.uvTopRight[0], object.diffuse.uvTopRight[1],
		]), 2));
		geometry.addAttribute('ambientreflectionconstant', new BufferAttribute(new Float32Array([
			object.material.ambientCoefficient, object.material.ambientCoefficient,
			object.material.ambientCoefficient, object.material.ambientCoefficient,
			object.material.ambientCoefficient, object.material.ambientCoefficient
		]), 1));

		let dummyDirectionalLight = {};
		dummyDirectionalLight.direction = new Vector3(0.0, 0.0, 0.0);
		dummyDirectionalLight.color = new Vector3(0.0, 0.0, 0.0);

		let dummyPointLight = {};
		dummyPointLight.position = new Vector3(0.0, 0.0, 10.0);
		dummyPointLight.color = new Vector3(0.0, 0.0, 0.0);
		dummyPointLight.aAttenuation = 0.0;
		dummyPointLight.bAttenuation = 0.0;


		material.uniforms.directionalLights.value.push(dummyDirectionalLight);
		material.uniforms.pointLights.value.push(Object.assign({}, dummyPointLight));
		material.uniforms.pointLights.value.push(Object.assign({}, dummyPointLight));

		let mesh = new Mesh(geometry, material);
		mesh.translateX(objectX);
		mesh.translateY(objectY);

		this.world.getScene().add(mesh);
		if (!object.pointLight)
			this.world.addEntity({
				ShaderComponent: {
					material: material
				},
				TransformComponent: {
					x: objectX,
					y: objectY
				}
			});
		else {
			this.world.addEntity({
				ShaderComponent: {
					material: material
				},
				TransformComponent: {
					x: objectX,
					y: objectY
				},
				LightComponent: {
					dirty: true,
					type: 'point',
					position: new Vector3(objectX, objectY, object.pointLight.height),
					color: new Vector3(object.pointLight.color[0], object.pointLight.color[1], object.pointLight.color[2]),
					aAttenuation: object.pointLight.aAttenuation,
					bAttenuation: object.pointLight.bAttenuation,
					index: object.pointLight.index
				}
			});
		}
	}

	/**
	 * @description - Returns an entity used for adding to 
	 * the world object from the given data
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Object} data
	 */
	getTile(x, y, data) {
		let entity = {
			TileTransform: {
				x: x,
				y: y
			},
			TileComponent: Object.assign({}, data)
		};

		return entity;
	}


}

export default MapReader;