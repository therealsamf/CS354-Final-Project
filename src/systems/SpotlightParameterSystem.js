

/**
 * A system for messing with the pointlight parameters
 */

import { Vector3 } from 'three';
import { ProcessingSystem } from '../../dependencies/tiny-ecs';

class SpotlightParameterSystem extends ProcessingSystem {
	/**
	 * @constructor
	 */
	constructor() {
		super();

		this.interval = 50;
		this.blink = false;
		this.random = false;
		this.numSpotLights = 0;
	}

	/**
	 * @description - Called when the system is added to the world. Used to add controls to the
	 * world's gui
	 * @param {World} world
	 */
	onAddToWorld(world) {
		this.guiFolder = world.gui.addFolder('Spotlights');
		this.guiFolder.add(this, 'interval', 0.0, 1000 / 10);
		this.guiFolder.add(this, 'blink');
		this.guiFolder.add(this, 'random');
	}

	/**
	 * @description - Called when an entity is added to the system
	 * @param {Entity}
	 */
	onAdd(entity) {
		
		this[this.numSpotLights + 'spotLightColor'] = [
			Math.floor(entity.LightComponent.color.x * 256),
			Math.floor(entity.LightComponent.color.y * 256),
			Math.floor(entity.LightComponent.color.z * 256),
		];
		this[this.numSpotLights + 'spotLightAttenuation_a'] = entity.LightComponent.aAttenuation;
		this[this.numSpotLights + 'spotLightAttenuation_b'] = entity.LightComponent.bAttenuation;
		this[this.numSpotLights + 'spotLightAngle'] = entity.LightComponent.direction.x;

		let self = this;
		this.guiFolder.addColor(this, this.numSpotLights + 'spotLightColor').onChange((value) => {
			entity.LightComponent.color = new Vector3(
				value[0] / 256,
				value[1] / 256,
				value[2] / 256
			);
			entity.LightComponent.dirty = true;
		});
		this.guiFolder.add(this, this.numSpotLights + 'spotLightAttenuation_a').min(0.0).onChange((value) => {
			entity.LightComponent.aAttenuation = value;
			entity.LightComponent.dirty = true;
		});
		this.guiFolder.add(this, this.numSpotLights + 'spotLightAttenuation_b').min(0.0).onChange((value) => {
			entity.LightComponent.bAttenuation = value;
			entity.LightComponent.dirty = true;
		});

		this.guiFolder.add(this, this.numSpotLights + 'spotLightAngle').min(-1.0).max(1.0).onChange((value) => {
			entity.LightComponent.direction.x = value;
			entity.LightComponent.dirty = true;
		});
		
		this.numSpotLights += 1;
	}

	/**
	 * @description - Filters out the entities in order to only have to deal with
	 * the pointlights
	 * @param {Entity} entity
	 */
	filter(entity) {
		return entity.LightComponent && entity.LightComponent.type === 'spot';
	}

	/**
	 * @description - Updates each point light within the world
	 * @param {Entity} entity
	 * @param {Number} delta
	 */
	process(entity, delta) {
		if (this.blink) {
			if (!this.random) {
				entity.LightComponent.off = !entity.LightComponent.off;
			}
			else
				entity.LightComponent.off = Math.random() > 0.5;
		}
	}
}

export default SpotlightParameterSystem;