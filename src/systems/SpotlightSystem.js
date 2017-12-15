
/**
 * A system for managing spotlights
 */

import LightSystem from './LightingSystem';

class SpotlightSystem extends LightSystem {
	/**
	 * @description - Filters out entities that will be placed within the world
	 * that have no bearing with this system
	 * @param {Entity} entity
	 */
	filter(entity) {
		return entity.ShaderComponent || (entity.LightComponent && entity.LightComponent.type === 'spot')
	}

	/**
	 * @description - Called every frame, used to update the uniforms within ShaderComponents
	 * @param {Number} delta
	 */
	update(delta) {
		let updatedLights = [];

		for (let lightEntity of this._lights) {
			if (lightEntity.LightComponent.dirty && lightEntity.LightComponent.type === 'spot') {
				updatedLights.push(lightEntity);
			}
		}

		if (updatedLights.length <= 0) {
			return;
		}
		

		let shaderComponent,
			material,
			uniforms;
		for (let entity of this._shaderObjects) {
			shaderComponent = entity.ShaderComponent;

			if (shaderComponent.material && 
				shaderComponent.material.uniforms) {

				material = shaderComponent.material;
				uniforms = material.uniforms;

				if (!uniforms.spotLights) {
					uniforms.spotLights = { value: [], properties: {
						direction: {},
						angle: 0.0,
						color: {},
						position: {},
						aAttenuation: 0.0,
						bAttenuation: 0.0
					}};
				}

				for (let light of updatedLights) {
					
					uniforms.spotLights.value.splice(light.LightComponent.index, 1, light.LightComponent);

					light.LightComponent.dirty = true;
				}

				if (!uniforms.num_spotlights && updatedLights.length > 0) {
					uniforms.num_spotlights = updatedLights.length;
				}
			}
		}
	}
}

export default SpotlightSystem;