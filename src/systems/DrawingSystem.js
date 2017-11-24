
/**
 * System responsible for drawing the scene
 */

import { WebGLRenderer, Scene, OrthographicCamera } from 'three';
import { System } from '../../dependencies/tiny-ecs';

const Z_NEAR = 1,
	Z_FAR = 10;

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
		this.camera = new OrthographicCamera(
			window.innerWidth * -0.5, 
			window.innerWidth * 0.5, 
			window.innerHeight * 0.5, 
			window.innerHeight * -0.5,
			Z_NEAR, 
			Z_FAR
		);

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

		// really no need to expose the renderer to the world
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