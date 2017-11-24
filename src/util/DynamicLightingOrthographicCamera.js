
/**
 * Orthographic cammera with some project specific methods
 */

import { OrthographicCamera } from 'three';

class DynamicLightingOrthographicCamera extends OrthographicCamera {

	/**
	 * @description - Returns the frustum of the camera, mapped from 0 to windowWidth/windowHeight
	 * rather than - 1/2 * windowWidth/windowHeight to 1/2 * windowWidth/windowHeight
	 * @returns {Object}
	 */
	getFrustum() {
		
	}
}

export default DynamicLightingOrthographicCamera;