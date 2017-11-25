
import World from './DynamicLightingWorld';
import TileSystem from './systems/TileSystem';
import DrawingSystem from './systems/DrawingSystem';
import MapReader from './util/MapReader';

import { requireAll, rejectAny } from '../dependencies/tiny-ecs/filters';

import path from 'path';

const drawingSystemFilter = requireAll('isDrawingSystem'),
	notDrawingSystemFilter = rejectAny('isDrawingSystem');

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

document.body.appendChild(stats.domElement);
stats.domElement.style.position = 'absolute';

let world = new World(),
	drawingSystem = new DrawingSystem(),
	tileSystem = new TileSystem(),
	mapReader = new MapReader(world);

world.addSystem(drawingSystem);
world.addSystem(tileSystem);



let currentDrawTime = new Date().getTime(),
	lastDrawTime,
	elapsedDrawTime;

function animate() {
	requestAnimationFrame(animate);

	lastDrawTime = currentDrawTime;
	currentDrawTime = new Date().getTime();
	elapsedDrawTime = currentDrawTime - lastDrawTime;

	stats.begin();
	world.update(elapsedDrawTime, drawingSystemFilter);
	stats.end();
}

let currentUpdateTime = new Date().getTime(),
	lastUpdateTime,
	elapsedUpdateTime,
	updateInterval;

function update() {

	lastUpdateTime = currentUpdateTime;
	currentUpdateTime = new Date().getTime();
	elapsedUpdateTime = currentUpdateTime - lastUpdateTime;

	try {
		world.update(elapsedUpdateTime, notDrawingSystemFilter);
	}
	catch (e) {

		clearInterval(updateInterval);
		throw e;
	}
}

setInterval(update, 60 / 1000);
animate();

mapReader.readMap(path.resolve(__dirname, '..', 'assets', 'maps', 'map1.json'))