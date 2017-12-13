
let vertexShaderSrc = `
	precision highp float;

	uniform mat4 modelViewMatrix;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;

	attribute vec3 position;
	attribute vec2 offset;
	attribute vec2 uv;
	attribute vec4 diffuseuvs;
	attribute vec4 normaluvs;
	attribute vec4 heightuvs;

	attribute float ambientreflectionconstant;

	varying vec2 vUv;
	varying vec4 vDiffuseUVs;
	varying vec4 vNormalUVs;
	varying vec4 vHeightUVs;
	varying vec3 vPosition;

	varying float vAmbientReflectionConstant;

	void main() {
		vPosition = position;
		vPosition.x = vPosition.x + offset.x;
		vPosition.y = vPosition.y + offset.y;

		vUv = uv;
		vDiffuseUVs = diffuseuvs;
		vNormalUVs = normaluvs;
		vHeightUVs = heightuvs;
		vAmbientReflectionConstant = ambientreflectionconstant;
		
		gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
		vPosition = vec3(modelMatrix * vec4(vPosition, 1.0));
	}

`;

export default vertexShaderSrc;