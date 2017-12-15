
/**
 * A fun system to rotate the direction on the spotlights
 */

import { Vector3, Euler } from 'three';
import { ProcessingSystem } from '../../dependencies/tiny-ecs';

class SpotlightRotationSystem extends ProcessingSystem {
	/**
	 * @constructor
	 */
	constructor() {
		super();

		this.interval = 1000 / 30;
		this.isDrawingSystem = false;
		this.lastUpdate = 0;
		this.euler = new Euler(0, 0, 0.025);
	}
	/**
	 * @description - Filters out non-entity spotlights
	 * @param {Entity} entity
	 */
	filter(entity) {
		return entity.LightComponent && entity.LightComponent.type === 'spot';
	}

	/**
	 * @description - Processes a single spotlight entity
	 * @param {Entity} entity
	 * @param {Number} delta
	 */
	process(entity, delta) {
		

		entity.LightComponent.direction.applyEuler(this.euler);

		entity.LightComponent.dirty = true;
	}
}

export default SpotlightRotationSystem;