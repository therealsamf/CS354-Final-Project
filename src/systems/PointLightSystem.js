
/**
 * A system for managing point lights
 */

import LightingSystem from './LightingSystem';
import { requireAny } from '../../dependencies/tiny-ecs/filters';

class PointLightSystem extends LightingSystem {


	/**
	 * @description - Filters out entities that will be placed within the world
	 * that have no bearing with this system
	 * @param {Entity} entity
	 */
	filter(entity) {
		return entity.ShaderComponent || (entity.LightComponent && entity.LightComponent.type === 'point')
	}

	/**
	 * @description - Called every frame, used to update the uniforms within ShaderComponents
	 * @param {Number} delta
	 */
	update(delta) {
		let updatedLights = [];

		for (let lightEntity of this._lights) {
			if (lightEntity.LightComponent.dirty && lightEntity.LightComponent.type === 'point')
				updatedLights.push(lightEntity);
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

				if (!uniforms.pointLights)
					uniforms.pointLights = { value: [], properties: {
						position: {},
						color: {},
						aAttenuation: 0.0,
						bAttenuation: 0.0
					}};

				for (let light of updatedLights) {
					uniforms.pointLights.value.splice(light.LightComponent.index, 1, light.LightComponent);
					

					light.LightComponent.dirty = true;
				}
				
			}
		}
	}


}

export default PointLightSystem;