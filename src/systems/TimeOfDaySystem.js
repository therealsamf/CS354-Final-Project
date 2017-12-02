
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
		world.gui.add(this, 'updateTimeManually').onChange(() => {
			self.currentDelta = 0;
		});
		world.gui.add(this, 'timeOfDay', 0, FULL_DAY * 2).listen();
		world.gui.add(this, 'timeSpeed', 1, 25);

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


		// right now, 12 hour days of pure sunlight.
		let yComponent = -0.2;

		// these values hard-coded for 720 minute days
		let xComponent = Math.sin((timeOfDay / FULL_DAY) * Math.PI) * 0.8;
		let zComponent = Math.sin((timeOfDay / (2 * FULL_DAY)) * Math.PI) * 1.0 - .5;

		return new Vector3(xComponent, yComponent, zComponent);
	}
}

export default TimeOfDaySystem;