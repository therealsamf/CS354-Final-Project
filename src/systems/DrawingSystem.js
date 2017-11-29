
/**
 * System responsible for drawing the scene
 */

import { WebGLRenderer, Scene } from 'three';
import DynamicLightingOrthographicCamera from '../util/DynamicLightingOrthographicCamera';
import { System } from '../../dependencies/tiny-ecs';

const Z_NEAR = 1,
	Z_FAR = 100;

class DrawingSystem extends System {
	/**
	 * @constructor
	 */
	constructor() {
		super();

		// construct the necessary items used by this system
		this.renderer = new WebGLRenderer();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.scene = new Scene();
		this.camera = new DynamicLightingOrthographicCamera(
			window.innerWidth * -0.5, 
			window.innerWidth * 0.5, 
			window.innerHeight * 0.5, 
			window.innerHeight * -0.5,
			Z_NEAR, 
			Z_FAR
		);

		this.camera.position.z = 50;

		// used to filter the systems
		this.isDrawingSystem = true;
	}

	/**
	 * @description - Called when the system is added to the world.
	 * Used to give the world access to some of the system's properties
	 * @param {World} world
	 */
	onAddToWorld(world) {

		// use sanity checks to make sure the methods exist on the world
		if (world.setCamera)
			world.setCamera(this.camera);
		if (world.setScene)
			world.setScene(this.scene);
		if (world.setRenderer)
			world.setRenderer(this.renderer);

	}

	/**
	 * @description - Called every frame. Renders the scene
	 * @param {Number} delta
	 */
	update(delta) {
		this.renderer.render(this.scene, this.camera);
	}
}

export default DrawingSystem;