import { describe, expect, it } from 'vitest'
import { adaptCamera, BOARD_HEIGHT, BOARD_WIDTH, cameraTransform, constrainCamera, MAX_SCALE, MIN_SCALE, normalizeWheelDelta, zoomCameraAt } from './camera'

describe('evidence wall camera', () => {
  it('preserves the board point beneath the pointer while zooming', () => {
    const camera = { x: -600, y: -300, scale: 0.8 }
    const pointer = { x: 700, y: 420 }
    const before = { x: (pointer.x - camera.x) / camera.scale, y: (pointer.y - camera.y) / camera.scale }
    const zoomed = zoomCameraAt(camera, pointer.x, pointer.y, 1.1)
    expect((pointer.x - zoomed.x) / zoomed.scale).toBeCloseTo(before.x)
    expect((pointer.y - zoomed.y) / zoomed.scale).toBeCloseTo(before.y)
  })

  it('normalizes trackpad, wheel-line, and page deltas without unbounded jumps', () => {
    expect(normalizeWheelDelta(2.5, 0, 800)).toBe(2.5)
    expect(normalizeWheelDelta(3, 1, 800)).toBe(48)
    expect(normalizeWheelDelta(1, 2, 800)).toBe(100)
    expect(normalizeWheelDelta(-1000, 0, 800)).toBe(-100)
  })

  it('clamps zoom and keeps the board reachable after extreme movement', () => {
    const topLeft = constrainCamera({ x: 999999, y: 999999, scale: 99 }, 1366, 768)
    expect(topLeft.scale).toBe(MAX_SCALE)
    expect(topLeft.x).toBeLessThanOrEqual(120)
    expect(topLeft.y).toBeLessThanOrEqual(115.2)

    const bottomRight = constrainCamera({ x: -999999, y: -999999, scale: 0 }, 1366, 1080)
    expect(bottomRight.scale).toBe(MIN_SCALE)
    expect(bottomRight.x).toBeGreaterThanOrEqual(1366 - BOARD_WIDTH * MIN_SCALE - 120)
    expect(bottomRight.y).toBe((1080 - BOARD_HEIGHT * MIN_SCALE) / 2)
  })

  it('adapts case framing to the viewport and emits a composited transform', () => {
    const camera = adaptCamera({ x: -340, y: -140, scale: 0.92 }, 1366, 768)
    expect(camera).toEqual({ x: -617, y: -296, scale: 0.92 })
    expect(cameraTransform(camera)).toBe('translate3d(-617px, -296px, 0) scale(0.92)')
  })
})
