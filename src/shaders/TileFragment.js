
let fragmentShaderSrc = `
	precision highp float;

	uniform sampler2D map;

	varying vec2 vUv;
	varying vec4 vDiffuseUVs;
	varying vec4 vNormalUVs;

	varying float vAmbientReflectionConstant;

	void main() {
		vec2 diffuseUV = vec2((1.0 - vUv.x) * vDiffuseUVs.x + vUv.x * vDiffuseUVs.z, (1.0 - vUv.y) * vDiffuseUVs.y + vUv.y * vDiffuseUVs.w);
		vec2 normalUV = vec2((1.0 - vUv.x) * vNormalUVs.x + vUv.x * vNormalUVs.z, (1.0 - vUv.y) * vNormalUVs.y + vUv.y * vNormalUVs.w);

		vec4 diffuseColor = texture2D(map, diffuseUV);
		vec4 normalColor = texture2D(map, normalUV);

		vec3 normal = vec3(normalColor);
		normal = normalize(normal - vec3(0.5, 0.5, 0.5));
		vec3 lightDirection = normalize(vec3(1.0, 0.5, 1.0));

		float lambertianReflectance = max(dot(normal, lightDirection), 0.0);


		vec4 ambientLighting = vec4(0.15, 0.15, 0.15, 0.0);

		gl_FragColor = lambertianReflectance * diffuseColor + vAmbientReflectionConstant * ambientLighting;
	}
`;

export default fragmentShaderSrc;