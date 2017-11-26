
let vertexShaderSrc = `
	precision highp float;

	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;

	attribute vec3 position;
	attribute vec2 offset;
	attribute vec2 uv;
	attribute vec2 firstrealuv;
	attribute vec2 lastrealuv;

	varying vec2 vUv;
	varying vec2 vFirstrealuv;
	varying vec2 vLastrealuv;

	void main() {
		vec3 vPosition = position;
		vPosition.x = vPosition.x + offset.x;
		vPosition.y = vPosition.y + offset.y;

		vUv = uv;
		vFirstrealuv = firstrealuv;
		vLastrealuv = lastrealuv;
		
		gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
	}

`;

export default vertexShaderSrc;