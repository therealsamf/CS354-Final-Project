
let vertexShaderSrc = `
	precision highp float;

	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;

	attribute vec3 position;
	attribute vec2 offset;
	attribute vec2 uv;
	attribute vec4 diffuseuvs;
	attribute vec4 normaluvs;

	attribute float ambientreflectionconstant;

	varying vec2 vUv;
	varying vec4 vDiffuseUVs;
	varying vec4 vNormalUVs;

	varying float vAmbientReflectionConstant;

	void main() {
		vec3 vPosition = position;
		vPosition.x = vPosition.x + offset.x;
		vPosition.y = vPosition.y + offset.y;

		vUv = uv;
		vDiffuseUVs = diffuseuvs;
		vNormalUVs = normaluvs;
		vAmbientReflectionConstant = ambientreflectionconstant;
		
		gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
	}

`;

export default vertexShaderSrc;