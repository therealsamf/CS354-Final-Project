
/**
 * System that delivers directional lights to shaders
 */

import { System } from '../../dependencies/tiny-ecs';

class LightingSystem extends System {

	/**
	 * @constructor
	 */
	constructor() {
		super();

		// list of light objects
		this._lights = [];

		// list of shader objects
		this._shaderObjects = [];

		this.isDrawingSystem = false;
	}

	/**
	 * @description - Called whenever an entity is added to the world
	 * that passes the filter. Used to collect all the lights and shader
	 * objects within the world.
	 * @param {Object} entity
	 */
	onAdd(entity) {
		if (entity.ShaderComponent) {
			this._shaderObjects.push(entity);
		}
		/* assuming that sub classes of this system 
		 * will specify the kind of lights they want to manage
		 */
		else {
			this._lights.push(entity);
		}
	}

	/**
	 * @description - Called whenever an entity is removed from the system.
	 * Used to keep the system's state in-tact
	 * @param {Entity}
	 */
	onRemove(entity) {
		let shaderObjectIndex = this._shaderObjects.indexOf(entity),
			lightIndex = this._lights.indexOf(entity);

		if (shaderObjectIndex >= 0) {
			this._shaderObjects.splice(shaderObjectIndex, 1);
		}
		else if (lightIndex >= 0) {
			this._lights.splice(lightIndex, 1);
		}
	}

}

export default LightingSystem;