
/**
 * A system for manipulating the time of day
 */

import { System } from '../../dependencies/tiny-ecs';
import {
	Vector3,
	Color
} from 'three';

const FULL_DAY = 12 * 60,
	TICKS_TO_MINUTE = 5;

class TimeOfDaySystem extends System {
	/**
	 * @constructor
	 */
	constructor() {
		super();

		this.timeOfDay = 0;

		this.currentDelta = 0;
		this.sunYComponent = 0.3;
		this.dawn = 240;
		this.dusk = 1320;
		this.lightSpeed = 20;
		this.lightThreshold = 1.0;

		this.calculateSunFunction();

		this.isDrawingSystem = false;
	}

	/**
	 * @description - Creates and adds a 'Sun' object to 
	 * the world. This is necessary because the sun's light
	 * will be used by other systems so there has to be a sun
	 * object
	 * @param {World} world
	 */
	onAddToWorld(world) {
		let sun = {
			SunComponent: {
				timeOfDay: this.timeOfDay
			},
			LightComponent: {
				direction: this.calculateSunDirection(),
				// sun's color should be whitish
				color: new Color(0xFFFFFF),
				dirty: true
			}
		};

		this.updateTimeManually = false;
		this.sun = sun;
		this.timeSpeed = TICKS_TO_MINUTE;
		world.addEntity(sun);

		if (!world.gui)
			world.gui = new dat.GUI();

		var self = this;
		let lightFolder = world.gui.addFolder('Sunlight');
		lightFolder.add(this, 'updateTimeManually').onChange(() => {
			self.currentDelta = 0;
		});



		lightFolder.add(this, 'timeOfDay', 0, FULL_DAY * 2).listen();
		lightFolder.add(this, 'timeSpeed', 1, 25);
		lightFolder.add(this, 'sunYComponent', -1.0, 1.0);
		this.thresholdController = lightFolder.add(this, 'lightThreshold', 0, this.thresholdMax);

		lightFolder.add(this, 'dawn', 0, FULL_DAY).onChange(() => {
			self.calculateSunFunction();
		});
		lightFolder.add(this, 'dusk', FULL_DAY, FULL_DAY * 2).onChange(() => {
			self.calculateSunFunction();
		});
		lightFolder.add(this, 'lightSpeed', 0, 50).onChange(() => {
			self.calculateSunFunction();
		});

	}

	/**
	 * @description - Processes the 'Sun' object
	 * @param {Number} delta
	 */
	update(delta) {
		if (this.sun)
			this.sun.LightComponent.dirty = false;

		this.currentDelta += delta;

		let minutesDelta = Math.floor(this.currentDelta / this.timeSpeed);

		if (minutesDelta >= 1 && !this.updateTimeManually) {
			this.currentDelta -= minutesDelta * this.timeSpeed;

			this.timeOfDay += minutesDelta;
			this.timeOfDay %= (2 * FULL_DAY);
			if (this.sun)
				this.sun.LightComponent.dirty = true;

		}

		if (this.sun) {
			this.sun.LightComponent.direction = this.calculateSunDirection();
			this.sun.LightComponent.color = this.calculateSunColor();
		}
	}

	/**
	 * @description - Calculcates the direction of the sun's light
	 * based on the given time of day
	 * @param {Number=} timeOfDay
	 * @returns {Vector3}
	 */
	calculateSunDirection(timeOfDay) {
		if (timeOfDay === undefined) {
			timeOfDay = this.timeOfDay;
		}

		let yComponent = this.sunYComponent;

		// these values hard-coded for 720 minute days
		let xComponent = Math.sin((timeOfDay / FULL_DAY) * Math.PI) * 0.8;
		let zComponent = Math.sin((timeOfDay / (2 * FULL_DAY)) * Math.PI) - .5;

		return new Vector3(xComponent, yComponent, zComponent);
	}

	/**
	 * @description - Calculates the sun's color based on the time of day.
	 * This color will be from black to white
	 * @param {Number=} timeOfDay
	 * @returns {Color}
	 */
	calculateSunColor(timeOfDay) {
		if (timeOfDay === undefined) {
			timeOfDay = this.timeOfDay;
		}

		if (timeOfDay <= this.dawn || timeOfDay >= this.dusk) {
			return new Color('black');
		}

		let input = timeOfDay / (2 * FULL_DAY);

		let color = new Color('white');
		// console.log('value', this.getColorMultiplier(input));
		return color.multiplyScalar(this.getColorMultiplier(input) );
	}

	/**
	 * @description - Calculates the function used to determine the amount of sunlight to cast
	 */
	calculateSunFunction() {
		let dawn = this.dawn / (FULL_DAY * 2),
			dusk = this.dusk / (FULL_DAY * 2);
		let maximumInput = (dawn + dusk) / 2,
			maximumValue = - this.lightSpeed * (maximumInput - dawn) * (maximumInput - dusk);

		this.thresholdMax = maximumValue;


		if (this.thresholdController) {
			this.thresholdController.__max = this.thresholdMax;
			this.thresholdController.updateDisplay();
		}

		let self = this;
		this.getColorMultiplier = (value) => {
			let lightValue = - self.lightSpeed * (value - dawn) * (value - dusk);
			if (lightValue > self.lightThreshold) {
				return 1;
			}
			else
				return lightValue / self.lightThreshold;
		};
	}
}

export default TimeOfDaySystem;