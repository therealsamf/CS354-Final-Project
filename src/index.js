
import { Scene, OrthographicCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh } from 'three';

let scene = new Scene(),
	camera = new OrthographicCamera(
		window.innerWidth * -0.5, 
		window.innerWidth * 0.5, 
		window.innerHeight * 0.5, 
		window.innerHeight * -0.5,
		1, 
		10
	),
	renderer = new WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

let geometry = new BoxGeometry(100, 100, 1),
	material = new MeshBasicMaterial({color: 0x00FF00}),
	cube = new Mesh(geometry, material);

scene.add(cube);

camera.position.z = 5;

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);


	cube.rotation.z += .1;
}

animate();