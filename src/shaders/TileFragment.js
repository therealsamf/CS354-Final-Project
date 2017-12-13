
let fragmentShaderSrc = `

	#define NUM_DIRECTIONAL_LIGHTS 1
	#define NUM_POINt_LIGHTS 2

	precision highp float;

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	struct PointLight {
		vec3 position;
		vec3 color;
		float aAttenuation;
		float bAttenuation;
	};

	uniform sampler2D map;
	uniform DirectionalLight directionalLights[NUM_DIRECTIONAL_LIGHTS];
	uniform PointLight pointLights[NUM_POINt_LIGHTS];

	varying vec2 vUv;
	varying vec4 vDiffuseUVs;
	varying vec4 vNormalUVs;
	varying vec4 vHeightUVs;
	varying vec3 vPosition;

	varying float vAmbientReflectionConstant;

	void main() {
		vec2 diffuseUV = vec2((1.0 - vUv.x) * vDiffuseUVs.x + vUv.x * vDiffuseUVs.z, (1.0 - vUv.y) * vDiffuseUVs.y + vUv.y * vDiffuseUVs.w);
		vec2 normalUV = vec2((1.0 - vUv.x) * vNormalUVs.x + vUv.x * vNormalUVs.z, (1.0 - vUv.y) * vNormalUVs.y + vUv.y * vNormalUVs.w);
		vec2 heightUV = vec2((1.0 - vUv.x) * vHeightUVs.x + vUv.x * vHeightUVs.z, (1.0 - vUv.y) * vHeightUVs.y + vUv.y * vHeightUVs.w);

		vec4 diffuseColor = texture2D(map, diffuseUV);
		vec4 normalColor = texture2D(map, normalUV);

		vec3 normal = vec3(normalColor);
		normal = normalize(normal - vec3(0.5, 0.5, 0.5));

		vec3 resultingColor = vec3(0.0, 0.0, 0.0);

		vec4 heightColor = texture2D(map, heightUV);
		// only using the red channel but it doesn't matter as the map is grayscale
		float height = 255.0 - heightColor.r;

		// fix the bogus height value on the position as its only a z-index
		vec3 realPosition = vPosition.xyz;
		realPosition.z = height;

		for (int i = 0; i < NUM_DIRECTIONAL_LIGHTS; i++) {
			vec3 lightDirection = normalize(directionalLights[i].direction);
			float lambertianReflectance = max(dot(normal, lightDirection), 0.0);

			resultingColor += lambertianReflectance * vec3(diffuseColor) * directionalLights[i].color;
		}

		for (int i = 0; i < NUM_POINt_LIGHTS; i++) {
			vec3 lightPosition = pointLights[i].position;
			vec3 direction = realPosition - lightPosition;
			float distance = length(direction);
			float attenuation = clamp(1.0 / (1.0 + pointLights[i].aAttenuation * distance + pointLights[i].bAttenuation * distance * distance), 0.0, 1.0);
			if (attenuation == 0.0)
				continue;

			float lambertianReflectance = max(dot(normal, normalize(direction)), 0.0);
			resultingColor += lambertianReflectance * vec3(diffuseColor) * attenuation * pointLights[i].color;
		}

		vec4 ambientLighting = vec4(0.15, 0.15, 0.15, 0.0);

		gl_FragColor = vec4(resultingColor, 1.0) + vAmbientReflectionConstant * ambientLighting;
	}
`;

export default fragmentShaderSrc;