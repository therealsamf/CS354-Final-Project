
/**
 * Subclass of the tiny-ecs world object 'specific' for
 * this project
 */

import { TextureLoader } from 'three';
import { World } from '../dependencies/tiny-ecs';

class DynamicLightingWorld extends World {
	constructor() {
		super();
		this._textureLoader = new TextureLoader();
	}

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
	 * @description - Accessor for the renderer
	 * @returns {WebGLRenderer}
	 */
	getRenderer() {
		return this._renderer;
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

	/**
	 * @description - Mutator for the renderer. Should
	 * really only be called by the DrawingSystem
	 * @param {WebGLRenderer} renderer
	 */
	setRenderer(renderer) {
		this._renderer = renderer;
	}

	/**
	 * @description - Used for getting images. Acts sort fo like a cache
	 * @param {String} imageURI
	 * @returns {Promise}
	 */
	getImage(imageURI) {
		if (this._images && this._images[imageURI])
			return Promise.resolve(this._images[imageURI]);

		let self = this;
		return new Promise((resolve, reject) => {
			let img = new Image();

			img.onload = () => {
				if (!self._images)
					self._images = {};

				if (!self._images[imageURI])
					self._images[imageURI] = img;
				
				resolve(img);
			};
			img.onerror = (err) => {
				reject(err);
			};

			img.src = imageURI;
		});
	}

	/**
	 * @description - Used for getting textures
	 * @param {String} textureURI
	 * @returns {Promise}
	 */
	getTexture(textureURI) {
		if (!this.textures) {
			this.textures = {};
		}

		if (this.textures[textureURI]) {
			return Promise.resolve(this.textures[textureURI]);
		}
		else {
			let texture = this._textureLoader.load(textureURI);
			this.textures[textureURI] = texture;
			return Promise.resolve(texture);
		}
	}

	/**
	 * @description - Used for getting textures WITHOUT the promise
	 * @param {String} textureURI
	 * @returns {Texture}
	 */
	_getTexture(textureURI) {
		if (!this.textures) {
			this.textures = {};
		}

		if (this.textures[textureURI]) {
			return this.textures[textureURI];
		}
		else {
			let texture = this._textureLoader.load(textureURI);
			this.textures[textureURI] = texture;
			return texture;
		}
	}

	/**
	 * @description - Mutator for the internal cache
	 * of textures that the World uses
	 * @param {String} textureURI
	 * @param {Texture} texture - THREE created texture object
	 */
	setTexture(textureURI, texture) {
		if (!this.textures)
			this.textures = {};

		this.textures[textureURI] = texture;
	}
}

export default DynamicLightingWorld;