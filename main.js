import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let color = ''
const txtrLoader = new THREE.TextureLoader()
const RgbeLoader = new RGBELoader()
const scene = new THREE.Scene();
RgbeLoader.load('./models/envmap.hdr', (texture) => {

  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.background = texture
})
// scene 
// sizes
const size = {
  width: window.innerWidth,
  height: window.innerHeight
}

// camera
const camera = new THREE.PerspectiveCamera(40, size.width / size.height)
const offset = new THREE.Vector3(0, 7, -20);

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 50);
const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
directionalLight.castShadow = true;
// scene.add(helper)
scene.add(directionalLight);

// Rendere
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(size.width, size.height);

const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;

// Ground
const groundGeo = new THREE.CylinderGeometry(50, 50, 0.1, 64);
const grid = txtrLoader.load("./models/grid.png");
const alphaMap = txtrLoader.load("./models/alpha-map.png");
const groundMat = new THREE.MeshStandardMaterial({
  alphaMap: alphaMap,
  map: grid,
  color: "grey",
  side: THREE.DoubleSide,
  envMapIntensity: 0.35,
  transparent: true,
  dithering: true,
  metalness: 0.05,
  roughness: 0.4,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// car
const loader = new GLTFLoader();
let bmw, track;
loader.load("./models/volkswagen_golf_mk.i_low_poly.glb", function (texture) {
  bmw = texture.scene;
  bmw.scale.set(0.5, 0.5, 0.5);
  bmw.traverse(function (model) {
    if (model.isMesh) {
      model.castShadow = true;
      model.receiveShadow = true;
    }
  });
  bmw.add(camera);
  camera.position.copy(offset);
  camera.lookAt(bmw.position);
  scene.add(bmw);
  loadProps();
});
function loadProps() {
  const trackTexture = txtrLoader.load("./models/track.png");
  trackTexture.anisotropy = 16;
  loader.load("./models/track.glb", function (texture) {
    track = texture.scene;
    track.children[0].material.map = trackTexture;
    track.scale.set(10, 10, 10);
    track.position.set(23, 0, 8);
    track.castShadow = true;
    track.receiveShadow = true;
    scene.add(track);
    animate();
  });
}

window.addEventListener("resize", () => {
  size.width = window.innerWidth;
  size.height = window.innerHeight;
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

// ______________Physical world
const physicalWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});
physicalWorld.defaultContactMaterial.friction = 5;

const groundMaterial = new CANNON.Material("ground");
const groundShape = new CANNON.Cylinder(50, 50, 0.1, 64);
const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
groundBody.addShape(groundShape);
groundBody.position.set(0, 0, 0);
physicalWorld.addBody(groundBody);

physicalWorld.broadphase = new CANNON.SAPBroadphase(physicalWorld);

// vehiclePhysics
const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.3, 0.5));
const chassisBody = new CANNON.Body({ mass: 200, shape: chassisShape });
chassisBody.position.set(10, 1, 0);
chassisBody.quaternion.set(0, 0, 0, 1);
physicalWorld.addBody(chassisBody);

const CannonDebugg = new CannonDebugger(scene, physicalWorld);

const vehicle = new CANNON.RaycastVehicle({ chassisBody });

const wheelOptions = {
  radius: 0.2,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 30,
  suspensionRestLength: 0.3,
  frictionSlip: 1.4,
  dampingRelaxation: 2.3,
  dampingCompression: 4.4,
  maxSuspensionForce: 100000,
  rollInfluence: 0.01,
  axleLocal: new CANNON.Vec3(0, 0, 1),
  chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
  maxSuspensionTravel: 0.3,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};
// frontLeft Wheel
wheelOptions.chassisConnectionPointLocal.set(-0.85, -0.05, 0.5);
vehicle.addWheel(wheelOptions);

// frontRight Wheel
wheelOptions.chassisConnectionPointLocal.set(-0.85, -0.05, -0.5);
vehicle.addWheel(wheelOptions);

// BackLeft Wheel
wheelOptions.chassisConnectionPointLocal.set(0.65, -0.1, 0.5);
vehicle.addWheel(wheelOptions);

// BackRight Wheel
wheelOptions.chassisConnectionPointLocal.set(0.65, -0.1, -0.5);
vehicle.addWheel(wheelOptions);
vehicle.addToWorld(physicalWorld);

function getRandomColorHex() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const wheelBodies = [];

const wheelMaterial = new CANNON.Material();
vehicle.wheelInfos.forEach((wheel) => {
  const cylinderShape = new CANNON.Cylinder(
    wheel.radius,
    wheel.radius,
    wheel.radius / 2,
    64
  );
  const wheelBody = new CANNON.Body({
    mass: 1,
    material: wheelMaterial,
  });
  wheelBody.type = CANNON.Body.KINEMTIC;
  wheelBody.collisionFilterGroup = 0; // turn off collisions
  const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0);
  wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
  wheelBodies.push(wheelBody);
  physicalWorld.addBody(wheelBody);
});
const wheel_ground = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
  friction: 0.3,
  restitution: 0,
  contactEquationStiffness: 1000,
});
physicalWorld.addContactMaterial(wheel_ground);

physicalWorld.addEventListener("postStep", () => {
  for (let i = 0; i < vehicle.wheelInfos.length; i++) {
    vehicle.updateWheelTransform(i);
    const transform = vehicle.wheelInfos[i].worldTransform;
    const wheelBody = wheelBodies[i];
    wheelBody.position.copy(transform.position);
    wheelBody.quaternion.copy(transform.quaternion);
  }
});

document.addEventListener("keydown", (event) => {
  const maxSteerVal = 0.5;
  const maxForce = 500;
  const brakeForce = 100;
  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.applyEngineForce(-maxForce, 2);
      vehicle.applyEngineForce(-maxForce, 3);
      break;

    case "s":
    case "ArrowDown":
      vehicle.applyEngineForce(maxForce, 2);
      vehicle.applyEngineForce(maxForce, 3);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(maxSteerVal, 0);
      vehicle.setSteeringValue(maxSteerVal, 1);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(-maxSteerVal, 0);
      vehicle.setSteeringValue(-maxSteerVal, 1);
      break;

    case "b":
      vehicle.setBrake(20, 0);
      vehicle.setBrake(20, 1);
      vehicle.setBrake(brakeForce, 2);
      vehicle.setBrake(brakeForce, 3);
      break;
    // case 'r':
    //   color = getRandomColorHex()
    //   console.log(color);
    //   bmw.traverse((child) => {
    //     if (child.isMesh) {
    //       child.material.color = new THREE.Color(color);
    //     }
    //   });
    //   break

    case " ":
      vehicle.setBrake(30, 2);
      vehicle.setBrake(30, 3);
      break;
    case "f":
      chassisBody.quaternion.set(0, 0, 0, 1);
      break;
  }
});

// Reset force on keyup
document.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.applyEngineForce(0, 2);
      vehicle.applyEngineForce(0, 3);
      break;

    case "s":
    case "ArrowDown":
      vehicle.applyEngineForce(0, 2);
      vehicle.applyEngineForce(0, 3);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;

    case "b":
      vehicle.setBrake(0, 0);
      vehicle.setBrake(0, 1);
      vehicle.setBrake(0, 2);
      vehicle.setBrake(0, 3);
      break;

    case " ":
      vehicle.setBrake(0, 2);
      vehicle.setBrake(0, 3);
      break;
  }
});

// Objects physics
// Trees
let treeBodies = [];
for (let i = 0; i < 10; i++) {
  const treeShape = new CANNON.Box(new CANNON.Vec3(1.5, 2, 1.5));
  const treeBody = new CANNON.Body({
    mass: 0,
  });
  treeBodies.push(treeBody);
  treeBody.addShape(treeShape);
  physicalWorld.addBody(treeBody);
}

const stadiumShape = new CANNON.Box(new CANNON.Vec3(7,3,5.5))
const stadiumBody = new CANNON.Body({mass: 0})
stadiumBody.addShape(stadiumShape)
physicalWorld.addBody(stadiumBody)
stadiumBody.position.set(0, 3, -19.5)
// Ramp Physics
// const rampShape = new CANNON.Box(new CANNON.Vec3(2,2,2))
// const rampBody = new CANNON.Body({
//   mass:0,
//   position:new CANNON.Vec3(13,-1.3,1)
// })
// const quaternion = new CANNON.Quaternion().setFromEuler(Math.PI / 9, 0, 0)
// rampBody.addShape(rampShape,new CANNON.Vec3(),quaternion)
// physicalWorld.addBody(rampBody)

const rampWidth = 2.2; // Adjust as needed
const rampHeight = 1.5;
const rampLength = 2.3;
const rampAngle = Math.PI / 8; // Adjust the angle of the ramp
const rampX = 13.1;
const rampY = -1;
const rampZ = 13.5;

// Create the ramp components
// const rampBaseShape = new CANNON.Box(new CANNON.Vec3(rampWidth, rampHeight, rampLength));
// const rampBaseBody = new CANNON.Body({ mass: 0, shape: rampBaseShape });
// rampBaseBody.position.set(rampX, rampY, rampZ);
// // physicalWorld.addBody(rampBaseBody);

const rampTopShape = new CANNON.Box(
  new CANNON.Vec3(rampWidth, rampHeight, rampLength)
);
const rampTopBody = new CANNON.Body({ mass: 0 });
rampTopBody.addShape(rampTopShape);
rampTopBody.position.set(
  rampX,
  rampY + rampHeight * Math.sin(rampAngle),
  rampZ + rampLength * 0.5 - rampHeight * Math.cos(rampAngle)
);
rampTopBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), rampAngle);
physicalWorld.addBody(rampTopBody);

function animate() {
  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);
  bmw.position.copy(chassisBody.position);
  bmw.position.y = bmw.position.y - 0.2;
  bmw.position.x = bmw.position.x + 0.2;
  bmw.quaternion.copy(chassisBody.quaternion);
  bmw.rotateY(-Math.PI / 2);
  treeBodies[0].position.set(48, 2, -6);
  treeBodies[1].position.set(29, 2, -30);
  treeBodies[2].position.set(3.5, 2, -44);
  treeBodies[3].position.set(-47, 2, 0.6);
  treeBodies[4].position.set(-21, 2, -9.5);
  treeBodies[5].position.set(-32.5, 2, -23);
  treeBodies[6].position.set(-24, 2, 35);
  treeBodies[7].position.set(-7.5, 2, 42.3);
  treeBodies[8].position.set(15, 2, 40);
  treeBodies[9].position.set(40.5, 2, 13);
  controls.update();
  camera.lookAt(bmw.position);
  if (bmw.position.y <= -20) {
    chassisBody.quaternion.set(0, 0, 0, 1);
    chassisBody.position.set(10, 1, 0);
  }
  physicalWorld.fixedStep();
  // CannonDebugg.update();
  renderer.shadowMap.enabled = true;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

