
/**
 * Reads the map and transforms the data into entities before inserting them
 * into the world
 */

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
		let scriptElement = document.createElement('script');
		scriptElement.type = 'application/json';

		let returnPromise = new Promise((resolve, reject) => {
			scriptElement.onload = () => {
				resolve();
			}
			scriptElement.onerror = (error) => {
				reject(error);
			}
		});

		scriptElement.src = dataURI;

		let self = this;
		return returnPromise
			.then(() => self.parseMap(scriptElement.textContent));
	}

	/**
	 * @description - Parses and reads the data and populates the world
	 * @param {String} mapData
	 */
	parseMap(mapData) {
		mapData = JSON.parse(mapData);

		let rowIndex = 0,
			columnIndex = 0;

		for (let tileRow of mapData.tiles) {
			for (let tile of tileRow) {

				if (tile in mapData.tileTypes) {
					this.addTile(rowIndex, columnIndex, mapData.tileTypes[tile]);
				}

				columnIndex += 1;
			}

			rowIndex += 1;
		}
	}

	/**
	 * @description - Adds a tile to the world from the given 
	 * data
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Object} data
	 */
	addTile(row, column, data) {
		let entity = {
			TileTransform: {
				x: row,
				y: column
			},
			TileComponent: {
				atlas: data.texture,
				xTextureCoords: data.xTextureCoords,
				yTextureCoords: data.yTextureCoords
			}
		};

		this.world.addEntity(entity);
	}
}

export default MapReader;