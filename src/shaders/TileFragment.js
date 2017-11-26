
let fragmentShaderSrc = `
	precision highp float;

	uniform sampler2D map;

	varying vec2 vUv;
	varying vec2 vFirstrealuv;
	varying vec2 vLastrealuv;

	void main() {
		vec2 realUV = vec2((1.0 - vUv.x) * vFirstrealuv.x + vUv.x * vLastrealuv.x, (1.0 - vUv.y) * vFirstrealuv.y + vUv.y * vLastrealuv.y);
		gl_FragColor = texture2D(map, realUV);
	}
`;

export default fragmentShaderSrc;