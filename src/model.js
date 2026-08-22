import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()
const model = new THREE.Group()

const ACTION_NAMES = [
  'idle',
  'ParadeWalk',
  'GuraRun',
  'GuraShake',
  'GuraJump',
  'Shy',
  'Gura Around'
]

let mixer = null
let gltfScene = null
let actionTimer = null
let readyResolve = null
const ready = new Promise((resolve) => {
  readyResolve = resolve
})

const actions = {}
const ACTION_DURATIONS = {
  idle: Infinity
}

function normalizeModel() {
  if (!gltfScene) return

  gltfScene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(gltfScene)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const targetHeight = 3.2
  const scale = targetHeight / Math.max(size.y, 0.001)

  model.scale.set(scale, scale, scale)
  model.position.set(
    -center.x * scale,
    -center.y * scale - 0.55,
    -center.z * scale
  )
}

function fadeToActive(name) {
  if (!mixer || !actions.idle) return

  Object.values(actions).forEach((action) => {
    if (action) action.fadeOut(0.35)
  })

  if (actions[name]) {
    actions[name].reset().fadeIn(0.35)
  }

  if (actionTimer) window.clearTimeout(actionTimer)
  if (name !== 'idle') {
    actionTimer = window.setTimeout(() => fadeToActive('idle'), ACTION_DURATIONS[name])
  }
}

loader.load('古拉_actions.glb', (gltf) => {
  gltfScene = gltf.scene
  gltfScene.traverse((object) => {
    if (object.isMesh) {
      object.frustumCulled = false
    }
  })
  model.add(gltfScene)
  normalizeModel()

  mixer = new THREE.AnimationMixer(gltfScene)
  const clips = new Map(gltf.animations.map((clip) => [clip.name, clip]))

  ACTION_NAMES.forEach((name) => {
    actions[name] = mixer.clipAction(clips.get(name))
  })

  ACTION_NAMES.forEach((name) => {
    if (name === 'idle') return
    actions[name].setLoop(THREE.LoopOnce, 1)
    actions[name].clampWhenFinished = true
    ACTION_DURATIONS[name] = actions[name].getClip().duration * 1000 + 300
  })

  Object.values(actions).forEach((action) => {
    if (action) action.play()
  })
  actions.idle.setEffectiveWeight(1)

  const clock = new THREE.Clock()
  const loop = () => {
    requestAnimationFrame(loop)
    mixer.update(clock.getDelta())
  }
  loop()

  readyResolve(gltf)
}, undefined, (error) => {
  console.error('模型加载失败:', error)
  readyResolve(null)
})

export function triggerAction(name) {
  fadeToActive(name)
}

export function activetailAction() {
  fadeToActive('idle')
}

export function activeheadAction() {
  fadeToActive('Shy')
}

export function activeMovehandAction() {
  fadeToActive('GuraShake')
}

export function activeshakehandAction() {
  fadeToActive('GuraShake')
}

export function reset() {
  fadeToActive('idle')
}

export function getModelHeadPosition(target = new THREE.Vector3()) {
  if (!gltfScene) {
    return target.set(0, 0.55, 0)
  }

  const head =
    gltfScene.getObjectByName('spine.006_07') ||
    gltfScene.getObjectByName('hat_08') ||
    gltfScene.getObjectByName('hairF_00')

  if (head) {
    head.getWorldPosition(target)
    target.y += 0.12
  } else {
    target.set(0, 0.55, 0)
  }
  return target
}

export function waitForModel() {
  return ready
}

export default model
