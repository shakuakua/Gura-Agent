import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import model from './model.js'

const scene = new THREE.Scene()
scene.add(model)

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 3000)
camera.position.set(0, 0.65, 11.4)
camera.lookAt(0, -0.2, 0)

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000, 0)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.15

const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

scene.add(new THREE.HemisphereLight(0xffe0b8, 0x1b2540, 1.35))

const keyLight = new THREE.DirectionalLight(0xffd9a8, 2.2)
keyLight.position.set(3.5, 6, 7)
scene.add(keyLight)

const rimLight = new THREE.DirectionalLight(0x49e4dc, 1.5)
rimLight.position.set(-5, 3.5, -4)
scene.add(rimLight)

const fillLight = new THREE.DirectionalLight(0xffffff, 0.7)
fillLight.position.set(0, -1.5, 5)
scene.add(fillLight)

const starCount = 240
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i += 1) {
  starPositions[i * 3] = (Math.random() - 0.5) * 16
  starPositions[i * 3 + 1] = (Math.random() - 0.35) * 10
  starPositions[i * 3 + 2] = -2 - Math.random() * 8
}

const starGeometry = new THREE.BufferGeometry()
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xcfe4ff,
    size: 0.045,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    depthWrite: false
  })
)
scene.add(stars)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enablePan = false
controls.enableZoom = false
controls.enableRotate = false

function render() {
  renderer.render(scene, camera)
  stars.rotation.y += 0.0004
  requestAnimationFrame(render)
}
render()

export function resizeRenderer(nextWidth, nextHeight) {
  const width = Math.max(1, Math.floor(nextWidth))
  const height = Math.max(1, Math.floor(nextHeight))
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

export { camera, scene }
export default renderer
