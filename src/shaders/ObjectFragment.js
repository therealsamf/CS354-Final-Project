
let fragmentShaderSrc = `

	#define NUM_DIRECTIONAL_LIGHTS 1

	precision highp float;

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform sampler2D map;
	uniform sampler2D normal_map;
	uniform DirectionalLight directionalLights[NUM_DIRECTIONAL_LIGHTS];

	varying vec2 vDiffuseUVs;
	varying vec2 vNormalUVs;

	varying float vAmbientReflectionConstant;

	void main() {
		// vec2 diffuseUV = vec2((1.0 - vUv.x) * vDiffuseUVs.x + vUv.x * vDiffuseUVs.z, (1.0 - vUv.y) * vDiffuseUVs.y + vUv.y * vDiffuseUVs.w);
		// vec2 normalUV = vec2((1.0 - vUv.x) * vNormalUVs.x + vUv.x * vNormalUVs.z, (1.0 - vUv.y) * vNormalUVs.y + vUv.y * vNormalUVs.w);

		vec4 diffuseColor = texture2D(map, vDiffuseUVs);
		vec4 normalColor = texture2D(normal_map, vNormalUVs);

		vec3 normal = vec3(normalColor);
		normal = normalize(normal - vec3(0.5, 0.5, 0.5));

		vec3 resultingColor = vec3(0.0, 0.0, 0.0);

		for (int i = 0; i < NUM_DIRECTIONAL_LIGHTS; i++) {
			vec3 lightDirection = normalize(directionalLights[i].direction);
			float lambertianReflectance = max(dot(normal, lightDirection), 0.0);

			resultingColor += lambertianReflectance * vec3(diffuseColor) * directionalLights[i].color;
		}

		vec4 ambientLighting = vec4(0.15, 0.15, 0.15, 0.0);

		gl_FragColor = vec4(resultingColor, 1.0) + vAmbientReflectionConstant * ambientLighting;
	}
`;

export default fragmentShaderSrc;