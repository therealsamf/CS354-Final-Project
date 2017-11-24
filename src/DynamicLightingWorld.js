
/**
 * Subclass of the tiny-ecs world object 'specific' for
 * this project
 */

import { World } from '../dependencies/tiny-ecs';

class DynamicLightingWorld extends World {

	/**
	 * @description - Accessor for the camera
	 * @returns {Camera}
	 */
	getCamera() {
		return this._camera;
	}

	/**
	 * @description - Accessor for the scene
	 * @returns {Scene}
	 */
	getScene() {
		return this._scene;
	}

	/**
	 * @description - Mutator for the camera. Should
	 * really only be called by the DrawingSystem
	 * @param {Camera}
	 */
	setCamera(camera) {
		this._camera = camera;
	}

	/**
	 * @description - Mutator for the scene. Should
	 * really only be called by the DrawingSystem
	 * @param {Scene}
	 */
	setScene(scene) {
		this._scene = scene;
	}
}

export default DynamicLightingWorld;