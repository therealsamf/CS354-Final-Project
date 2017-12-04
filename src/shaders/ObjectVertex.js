
let vertexShaderSrc = `
	precision highp float;

	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;

	attribute vec3 position;
	attribute vec2 uv;

	attribute float ambientreflectionconstant;

	varying vec2 vDiffuseUVs;
	varying vec2 vNormalUVs;

	varying float vAmbientReflectionConstant;

	void main() {
		vec3 vPosition = position;
		// vPosition.x = vPosition.x + offset.x;
		// vPosition.y = vPosition.y + offset.y;

		// vUv = uv;
		vDiffuseUVs = uv;
		vNormalUVs = uv;
		vAmbientReflectionConstant = ambientreflectionconstant;
		
		gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
	}

`;

export default vertexShaderSrc;