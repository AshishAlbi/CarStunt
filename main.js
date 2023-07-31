import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
// camera.position.z = 60;
// camera.position.y = 4;
// camera.position.x = 4;
// const chasingCamera = camera.clone()
const offset = new THREE.Vector3(10, 2, 0);

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 50)
const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(directionalLight)

// Rendere
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(size.width, size.height)

const controls = new OrbitControls(camera, canvas);
// controls.enableZoom = false;
controls.enablePan = false;

// Ground
const groundGeo = new THREE.PlaneGeometry(30, 100);
const groundMat = new THREE.MeshBasicMaterial({
  wireframe: true,
  // color:'green',
  side: THREE.DoubleSide,
  // transparent
})
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
// groundMesh.rotation.x=1.570
// groundMesh.position.y = -1;
scene.add(groundMesh)



// cubes
const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
const cubeMaterial = new THREE.MeshStandardMaterial({
  color: 'red',
  roughness: 1,
  // wireframe: true
})
// const cube1 = new THREE.Mesh(cubeGeo, cubeMaterial)
// const cube2 = new THREE.Mesh(cubeGeo, cubeMaterial)
// cube2.rotation.y = .4
// const cube3 = new THREE.Mesh(cubeGeo, cubeMaterial)
// const cube4 = new THREE.Mesh(cubeGeo, cubeMaterial)
// cube4.rotation.y = -.4
// scene.add(cube1, cube2, cube3, cube4)

// // Ball
// const ballGeo = new THREE.SphereGeometry(2);
// const ballMaterial = new THREE.MeshStandardMaterial({
//   color: 'red',
//   roughness: 1,
//   // wireframe: true
// })
// const ball = new THREE.Mesh(ballGeo, ballMaterial)
// ball.position.z = 40;
// scene.add(ball)

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
physicalWorld.defaultContactMaterial.friction = 0
// object physics 
// const groundPhyMaterial = new CANNON.Material();
const groundMaterial = new CANNON.Material('ground')
const ground = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
  material: groundMaterial
});
ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
ground.position.set(0, 0, 0)
physicalWorld.addBody(ground)


// const ballPhyMaterial = new CANNON.Material()
// const ballBody = new CANNON.Body({
//   mass: 5,
//   shape: new CANNON.Sphere(2),
//   material: ballPhyMaterial
// })
// ballBody.position.set(0, 1, 40)
// ballBody.linearDamping = 0.3
// physicalWorld.addBody(ballBody)

// const groundBallcontact = new CANNON.ContactMaterial(groundPhyMaterial, ballPhyMaterial, { restitution: 0.9 });
// physicalWorld.addContactMaterial(groundBallcontact)

// const boxbody1 = new CANNON.Body({
//   mass: 1,
//   shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
// })
// physicalWorld.addBody(boxbody1)

// const boxbody2 = new CANNON.Body({
//   mass: 1,
//   shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
// })
// boxbody2.position.y = 2
// physicalWorld.addBody(boxbody2)

// const boxbody3 = new CANNON.Body({
//   mass: 1,
//   shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
// })
// boxbody3.position.x = 3
// physicalWorld.addBody(boxbody3)

// const boxbody4 = new CANNON.Body({
//   mass: 1,
//   shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
// })
// boxbody4.position.y = 2
// boxbody4.position.x = 3
// physicalWorld.addBody(boxbody4)

const CannonDebugg = new CannonDebugger(scene, physicalWorld, {})
// window.addEventListener('keydown', (event) => {
//   if (event.key === 'w' || event.key === 'W') {
//     ballBody.applyForce(new CANNON.Vec3(0, 0, -100))
//   }
//   else if (event.key === 's' || event.key === 'S') {
//     ballBody.applyForce(new CANNON.Vec3(0, 0, 100))
//   }
//   else if (event.key === 'a' || event.key === 'A') {
//     ballBody.applyForce(new CANNON.Vec3(-100, 0, 0))
//   }
//   else if (event.key === 'd' || event.key === 'D') {
//     ballBody.applyForce(new CANNON.Vec3(100, 0, 0))
//   }
//   else if(event.key === ' '){
//     ballBody.applyForce(new CANNON.Vec3(0, 150, 0))
//   }
// })

// Bmw 
const loader = new GLTFLoader();
let textrLoader = new THREE.TextureLoader()
let bmw
let alloyWheels
loader.load('./models/GH8KD3R6HV8Y5VHWXT3CVAF7Z.gltf', function (texture) {
  // loadWheels()
  bmw = texture.scene
  bmw.scale.set(2, 2, 2)
  console.log("texture", color)
  bmw.add(camera)
  camera.position.copy(offset);
  camera.lookAt(bmw.position);
  scene.add(bmw);
  animate()
})

// wheels
function loadWheels() {
  loader.load('./models/GFH6KIREXIT36D0CGBV1LEHFG.gltf', function (texture) {
    alloyWheels = texture.scene
    scene.add(alloyWheels)
    alloyWheels.scale.set(.3, .3, .3)
  })
}


// vehiclePhysics
const chassisShape = new CANNON.Box(new CANNON.Vec3(2.5, 0.5, 1))
const chassisBody = new CANNON.Body({ mass: 150, shape: chassisShape })
chassisBody.position.set(0, 1, -5)
chassisBody.quaternion.set(0, 5, .5, 5)
// chassisBody.angularVelocity.set(0, 0.5, 0)
physicalWorld.addBody(chassisBody)

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

wheelOptions.chassisConnectionPointLocal.set(-1.7, -0.2, 1)
vehicle.addWheel(wheelOptions)

wheelOptions.chassisConnectionPointLocal.set(-1.7, -0.2, -1)
vehicle.addWheel(wheelOptions)

wheelOptions.chassisConnectionPointLocal.set(1.3, -0.3, 1)
vehicle.addWheel(wheelOptions)

wheelOptions.chassisConnectionPointLocal.set(1.3, -0.3, -1)
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

const wheelMaterial = new CANNON.Material('wheel')
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
  // demo.addVisual(wheelBody)
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
          // child.material.emissive = new THREE.Color('green')
          // child.material.metalness = 1
          // textrLoader.load("./redtexture.jpg",function(texture){
          //   child.material.map = texture
          //   console.log("Car material",child)
          // })
        }
      });
      break

    case ' ':
      vehicle.setBrake(30, 2)
      vehicle.setBrake(30, 3)
      break
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
  groundMesh.position.copy(ground.position)
  groundMesh.quaternion.copy(ground.quaternion)
  bmw.position.copy(chassisBody.position)
  bmw.quaternion.copy(chassisBody.quaternion)
  wheelsOg.forEach((wheel, index) => {
    wheel.position.copy(vehicle.wheelInfos[index].worldTransform.position)
    wheel.quaternion.copy(vehicle.wheelInfos[index].worldTransform.quaternion)
  })
  // alloyWheels.position.copy(wheelBodies[0].position)
  // alloyWheels.quaternion.copy(wheelBodies[0].quaternion)
  controls.update();
  camera.position.copy(offset);
  camera.lookAt(bmw.position);
  physicalWorld.fixedStep()
  CannonDebugg.update();
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate();

