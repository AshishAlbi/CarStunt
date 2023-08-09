import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let color = 'white'
// scene 
const scene = new THREE.Scene;

// sizes
const size = {
  width: window.innerWidth,
  height: window.innerHeight
}

// camera
const camera = new THREE.PerspectiveCamera(50, size.width / size.height)
const offset = new THREE.Vector3(10, 2, 0);

// light
const ambientLight = new THREE.AmbientLight(0xffffff, .8)
// ambientLight.castShadow = true
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 50)
const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
directionalLight.castShadow = true
scene.add(directionalLight)

// Rendere
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(size.width, size.height)

const controls = new OrbitControls(camera, canvas);
// controls.enableZoom = false;
controls.enablePan = false;

// Ground
const groundGeo = new THREE.PlaneGeometry(50, 100);
const groundMat = new THREE.MeshStandardMaterial({
  // wireframe: true,
  color:'grey',
  side: THREE.DoubleSide,
  metalness:.5,
  roughness:.5
})
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true
scene.add(groundMesh)



// cubes
const cubeGeo = new THREE.SphereGeometry(1,64, 64);
const cubeMaterial = new THREE.MeshStandardMaterial({
  color: 'red',
  roughness: .5,
  wireframe: true
})
const testCube = new THREE.Mesh(cubeGeo,cubeMaterial)
scene.add(testCube)

window.addEventListener("resize", () => {
  size.width = window.innerWidth
  size.height = window.innerHeight
  camera.aspect = size.width / size.height
  camera.updateProjectionMatrix()
  renderer.setSize(size.width, size.height)
})

// Physical world
const physicalWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});
physicalWorld.defaultContactMaterial.friction = 5
const groundMaterial = new CANNON.Material()
const world = new CANNON.Body({
  mass:0,
  shape: new CANNON.Plane(),
  material: groundMaterial
});
physicalWorld.broadphase = new CANNON.SAPBroadphase(physicalWorld)
world.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physicalWorld.addBody(world)
// world.position.set(0,0,0)

// Testcube Physics
const testCubeShape = new CANNON.Body({
  mass:5,
  shape: new CANNON.Sphere(1)
})
testCubeShape.position.set(0,5,-10)
physicalWorld.addBody(testCubeShape)


// Bmw 
const loader = new GLTFLoader();
let bmw
let alloyWheels
loader.load('./models/GH8KD3R6HV8Y5VHWXT3CVAF7Z.gltf', function (texture) {
  bmw = texture.scene
  bmw.scale.set(2.5, 2.5, 2.5)
  bmw.traverse(function(model){
    if(model.isMesh){
      model.castShadow= true
      model.receiveShadow = true
    }
  })
  console.log("texture", color)
  bmw.add(camera)
  camera.position.copy(offset);
  camera.lookAt(bmw.position);
  scene.add(bmw);
  animate()
})

// vehiclePhysics
const chassisShape = new CANNON.Box(new CANNON.Vec3(2.5, 0.5, 1))
const chassisBody = new CANNON.Body({ mass: 150, shape: chassisShape })
chassisBody.position.set(0, 1, -5)
chassisBody.quaternion.set(0, 5, .5, 5)
physicalWorld.addBody(chassisBody)

// const CannonDebugg = new CannonDebugger(scene,physicalWorld)

const vehicle = new CANNON.RaycastVehicle({ chassisBody, })

const wheelOptions = {
  radius: 0.3,
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
}

wheelOptions.chassisConnectionPointLocal.set(-2, -0.4, 1)
vehicle.addWheel(wheelOptions)

wheelOptions.chassisConnectionPointLocal.set(-2, -0.4, -1)
vehicle.addWheel(wheelOptions)

wheelOptions.chassisConnectionPointLocal.set(1.7, -0.4, 1)
vehicle.addWheel(wheelOptions)

wheelOptions.chassisConnectionPointLocal.set(1.7, -0.4, -1)
vehicle.addWheel(wheelOptions)
vehicle.addToWorld(physicalWorld)

function getRandomColorHex() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const wheelBodies = []
const wheelsOg = []

const wheelMaterial = new CANNON.Material()
vehicle.wheelInfos.forEach((wheel) => {
  const cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20)
  const wheelBody = new CANNON.Body({
    mass: 0,
    material: wheelMaterial,
  })
  wheelBody.type = CANNON.Body.KINEMATIC
  wheelBody.collisionFilterGroup = 0 // turn off collisions
  const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0)
  wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion)
  wheelBodies.push(wheelBody)
  physicalWorld.addBody(wheelBody)
  const wheelGeo = new THREE.CylinderGeometry(wheel.radius, wheel.radius, wheel.radius / 2, 20)
  const wheelMaterials = new THREE.MeshStandardMaterial({
    color: 'black',
    roughness: 1
  })
  const wheels = new THREE.Mesh(wheelGeo, wheelMaterials)
  wheelsOg.push(wheels)
  scene.add(wheels)
})
const wheel_ground = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
  friction: 0.3,
  restitution: 0,
  contactEquationStiffness: 1000,
})
physicalWorld.addContactMaterial(wheel_ground)

physicalWorld.addEventListener('postStep', () => {
  for (let i = 0; i < vehicle.wheelInfos.length; i++) {
    vehicle.updateWheelTransform(i)
    const transform = vehicle.wheelInfos[i].worldTransform
    const wheelBody = wheelBodies[i]
    wheelBody.position.copy(transform.position)
    wheelBody.quaternion.copy(transform.quaternion)
  }
})

document.addEventListener('keydown', (event) => {
  const maxSteerVal = 0.5
  const maxForce = 1000
  const brakeForce = 100
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
      vehicle.applyEngineForce(-maxForce, 2)
      vehicle.applyEngineForce(-maxForce, 3)
      break

    case 's':
    case 'ArrowDown':
      vehicle.applyEngineForce(maxForce, 2)
      vehicle.applyEngineForce(maxForce, 3)
      break

    case 'a':
    case 'ArrowLeft':
      vehicle.setSteeringValue(maxSteerVal, 0)
      vehicle.setSteeringValue(maxSteerVal, 1)
      break

    case 'd':
    case 'ArrowRight':
      vehicle.setSteeringValue(-maxSteerVal, 0)
      vehicle.setSteeringValue(-maxSteerVal, 1)
      break

    case 'b':
      vehicle.setBrake(20, 0)
      vehicle.setBrake(20, 1)
      vehicle.setBrake(brakeForce, 2)
      vehicle.setBrake(brakeForce, 3)
      break
    case 'r':
      color = getRandomColorHex()
      console.log(color);
      bmw.traverse((child) => {
        if (child.isMesh) {
          child.material.color = new THREE.Color(color);
        }
      });
      break

    case ' ':
      vehicle.setBrake(30, 2)
      vehicle.setBrake(30, 3)
      break
    case 'h':
      testCubeShape.applyImpulse(new CANNON.Vec3(5,0,0))
  }
})

// Reset force on keyup
document.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
      vehicle.applyEngineForce(0, 2)
      vehicle.applyEngineForce(0, 3)
      break

    case 's':
    case 'ArrowDown':
      vehicle.applyEngineForce(0, 2)
      vehicle.applyEngineForce(0, 3)
      break

    case 'a':
    case 'ArrowLeft':
      vehicle.setSteeringValue(0, 0)
      vehicle.setSteeringValue(0, 1)
      break

    case 'd':
    case 'ArrowRight':
      vehicle.setSteeringValue(0, 0)
      vehicle.setSteeringValue(0, 1)
      break

    case 'b':
      vehicle.setBrake(0, 0)
      vehicle.setBrake(0, 1)
      vehicle.setBrake(0, 2)
      vehicle.setBrake(0, 3)
      break

    case ' ':
      vehicle.setBrake(0, 2)
      vehicle.setBrake(0, 3)
      break
  }
})



const animate = () => {
  groundMesh.position.copy(world.position)
  groundMesh.quaternion.copy(world.quaternion)
  bmw.position.copy(chassisBody.position)
  testCube.position.copy(testCubeShape.position)
  testCube.quaternion.copy(testCubeShape.quaternion)
  bmw.quaternion.copy(chassisBody.quaternion)
  wheelsOg.forEach((wheel, index) => {
    wheel.position.copy(vehicle.wheelInfos[index].worldTransform.position)
    wheel.quaternion.copy(vehicle.wheelInfos[index].worldTransform.quaternion)
    wheel.rotateX(-Math.PI / 2);
  })
  controls.update();
  camera.lookAt(bmw.position);
  physicalWorld.fixedStep()
  // CannonDebugg.update();
  renderer.shadowMap.enabled = true
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate();

