
/**
 * A system for primarily directional lights
 * and passing them to object's shaders
 */

import LightingSystem from './LightingSystem';
import { requireAny } from '../../dependencies/tiny-ecs/filters';

const directionalLightingSystemFilter = requireAny('LightComponent', 'ShaderComponent');

class DirectionalLightingSystem extends LightingSystem {

	/**
	 * @description - Determines the kind of entities that will
	 * be placed within the system
	 * @param {Entity} entity
	 */
	filter(entity) {
		return directionalLightingSystemFilter(entity);
	}

	/**
	 * @description - Called every frame, used to update the ShaderComponents' uniforms
	 * @param {Number} delta
	 */
	update(delta) {

		let updatedLights = [];

		for (let lightEntity of this._lights) {
			if (lightEntity.LightComponent.dirty && lightEntity.LightComponent.type === 'directional')
				updatedLights.push(lightEntity);
		}

		if (updatedLights.length <= 0)
			return;

		let shaderComponent,
			material,
			uniforms;
		for (let entity of this._shaderObjects) {
			shaderComponent = entity.ShaderComponent;
			if (shaderComponent.material && 
				shaderComponent.material.uniforms) {

				material = shaderComponent.material;
				uniforms = material.uniforms;

				if (!uniforms.directionalLights)
					uniforms.directionalLights = { value: [], properties: {
						direction: {},
						color: {}
					}};

				for (let light of updatedLights) {
					//let index = uniforms.directionalLights.value.indexOf(light.LightComponent);

					
					uniforms.directionalLights.value.splice(light.LightComponent.index, 1, light.LightComponent);
					
				}
				
			}
		}
	}
}

export default DirectionalLightingSystem;