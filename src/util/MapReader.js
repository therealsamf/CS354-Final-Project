
/**
 * Reads the map and transforms the data into entities before inserting them
 * into the world
 */

import {
	CanvasTexture,
	NearestFilter 
} from 'three';

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

		let tiles = [];

		for (let tileRow of mapData.tiles) {
			columnIndex = 0;
			for (let tile of tileRow) {

				if (tile in mapData.tileTypes) {
					let newTile = this.getTile(Math.floor(columnIndex - 0.5 * maxColumns), Math.floor(0.5 * maxRows - rowIndex), mapData.tileTypes[tile]);
					tiles.push(newTile);
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
		}

		let numberTextures = Object.keys(uniqueTextures).length,
			canvasLength = (numberTextures % 2 == 0 ? numberTextures : numberTextures + 1) * TILE_SIZE,
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
	 * @description - Adds a tile to the world from the given 
	 * data
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Object} data
	 */
	addTile(x, y, data) {
		let entity = {
			TileTransform: {
				x: x,
				y: y
			},
			TileComponent: {
				atlas: data.texture,
				xTextureCoords: data.xTextureCoords,
				yTextureCoords: data.yTextureCoords,

				uvBottomLeft: data.uvBottomLeft,
				uvBottomRight: data.uvBottomRight,
				uvTopRight: data.uvTopRight,
				uvTopLeft: data.uvTopLeft
			}
		};

		this.world.addEntity(entity);
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