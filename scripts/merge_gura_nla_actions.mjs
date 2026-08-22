/* global Buffer */

import fs from 'node:fs'

const SOURCE = 'public/古拉_actions.glb'
const TARGET = 'public/smoller_gura_-_gawr_gura_holomyth.glb'
const OUTPUT = 'public/古拉_actions.glb'
const ACTION_NAMES = [
  'idle',
  'ParadeWalk',
  'GuraRun',
  'GuraShake',
  'GuraJump',
  'Shy',
  'Gura Around'
]

function readGlb(path) {
  const buffer = fs.readFileSync(path)
  let offset = 12
  let json = null
  let bin = null

  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8).replace(/\0/g, '').trim()
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'JSON') {
      json = JSON.parse(data.toString('utf8').replace(/\0+$/, ''))
    } else if (type === 'BIN') {
      bin = data
    }
    offset += 8 + length
  }

  return { json, bin }
}

function writeGlb(path, json, bin) {
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4
  const binPadding = (4 - (bin.length % 4)) % 4
  const total = 12 + 8 + jsonBuffer.length + jsonPadding + 8 + bin.length + binPadding
  const output = Buffer.alloc(total)

  output.write('glTF', 0)
  output.writeUInt32LE(2, 4)
  output.writeUInt32LE(total, 8)
  output.writeUInt32LE(jsonBuffer.length + jsonPadding, 12)
  output.write('JSON', 16)
  jsonBuffer.copy(output, 20)
  output.fill(0x20, 20 + jsonBuffer.length, 20 + jsonBuffer.length + jsonPadding)

  const binHeaderOffset = 20 + jsonBuffer.length + jsonPadding
  output.writeUInt32LE(bin.length + binPadding, binHeaderOffset)
  output.write('BIN', binHeaderOffset + 4)
  bin.copy(output, binHeaderOffset + 8)

  fs.writeFileSync(path, output)
}

const source = readGlb(SOURCE)
const target = readGlb(TARGET)

const targetNodeByName = new Map()
target.json.nodes.forEach((node, index) => {
  if (node.name && !targetNodeByName.has(node.name)) {
    targetNodeByName.set(node.name, index)
  }
})

const sourceNodeNames = source.json.nodes.map((node) => node?.name)
let appendedBin = Buffer.concat([target.bin])
const bufferViewMap = new Map()
const accessorMap = new Map()

function copyBufferView(sourceIndex) {
  if (bufferViewMap.has(sourceIndex)) return bufferViewMap.get(sourceIndex)

  const sourceView = source.json.bufferViews[sourceIndex]
  const start = sourceView.byteOffset || 0
  const data = source.bin.subarray(start, start + sourceView.byteLength)

  while (appendedBin.length % 4 !== 0) {
    appendedBin = Buffer.concat([appendedBin, Buffer.from([0])])
  }

  const newView = {
    buffer: 0,
    byteLength: sourceView.byteLength,
    byteOffset: appendedBin.length
  }
  if (sourceView.byteStride !== undefined) {
    newView.byteStride = sourceView.byteStride
  }

  target.json.bufferViews.push(newView)
  bufferViewMap.set(sourceIndex, target.json.bufferViews.length - 1)
  appendedBin = Buffer.concat([appendedBin, data])
  return bufferViewMap.get(sourceIndex)
}

function copyAccessor(sourceIndex) {
  if (accessorMap.has(sourceIndex)) return accessorMap.get(sourceIndex)

  const sourceAccessor = source.json.accessors[sourceIndex]
  const newAccessor = { ...sourceAccessor }
  if (sourceAccessor.bufferView !== undefined) {
    newAccessor.bufferView = copyBufferView(sourceAccessor.bufferView)
  }

  target.json.accessors.push(newAccessor)
  accessorMap.set(sourceIndex, target.json.accessors.length - 1)
  return accessorMap.get(sourceIndex)
}

for (const animation of source.json.animations) {
  if (!ACTION_NAMES.includes(animation.name)) continue

  const newAnimation = { name: animation.name, channels: [], samplers: [] }
  const samplerMap = new Map()

  animation.channels.forEach((channel) => {
    if (channel.target.path !== 'rotation') return

    const sourceNodeName = sourceNodeNames[channel.target.node]
    const targetNodeIndex = sourceNodeName
      ? targetNodeByName.get(sourceNodeName)
      : undefined
    if (targetNodeIndex === undefined) return

    const sourceSampler = animation.samplers[channel.sampler]
    const samplerKey = `${channel.sampler}:${sourceSampler.input}:${sourceSampler.output}`

    if (!samplerMap.has(samplerKey)) {
      newAnimation.samplers.push({
        input: copyAccessor(sourceSampler.input),
        output: copyAccessor(sourceSampler.output),
        interpolation: sourceSampler.interpolation
      })
      samplerMap.set(samplerKey, newAnimation.samplers.length - 1)
    }

    newAnimation.channels.push({
      sampler: samplerMap.get(samplerKey),
      target: {
        node: targetNodeIndex,
        path: channel.target.path
      }
    })
  })

  if (newAnimation.channels.length > 0) {
    target.json.animations.push(newAnimation)
  }
}

target.json.buffers[0].byteLength = appendedBin.length
writeGlb(OUTPUT, target.json, appendedBin)
console.log('MERGED', OUTPUT, fs.statSync(OUTPUT).size)
