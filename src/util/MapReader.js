
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
	 */
	parseMap(mapData) {
		mapData = JSON.parse(mapData);

		let maxRows = mapData.tiles.length,
			// assume we have at least one row
			maxColumns = mapData.tiles[0].length;

		let rowIndex = 0,
			columnIndex = 0;

		for (let tileRow of mapData.tiles) {
			columnIndex = 0;
			for (let tile of tileRow) {

				if (tile in mapData.tileTypes) {
					this.addTile(Math.floor(columnIndex - 0.5 * maxColumns), Math.floor(0.5 * maxRows - rowIndex), mapData.tileTypes[tile]);
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
	addTile(x, y, data) {
		let entity = {
			TileTransform: {
				x: x,
				y: y
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