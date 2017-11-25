
/**
 * Orthographic cammera with some project specific methods
 */

import { OrthographicCamera } from 'three';

class DynamicLightingOrthographicCamera extends OrthographicCamera {

	/**
	 * @description - Returns the current frustum position of the camera
	 * @returns {Object}
	 */
	getFrustum() {
		return {
			top: this.position.y + this.top,
			right: this.position.x + this.right,
			bottom: this.position.y + this.bottom,
			left: this.position.x + this.left
		}
	}
}

export default DynamicLightingOrthographicCamera;