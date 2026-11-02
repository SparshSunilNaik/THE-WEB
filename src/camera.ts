import type { CameraState } from './types'

export const BOARD_WIDTH = 19500
export const BOARD_HEIGHT = 4300
export const MIN_SCALE = 0.2
export const MAX_SCALE = 1.25

export function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function adaptCamera(initialCamera: CameraState, viewportWidth: number, viewportHeight: number): CameraState {
  const boardCenterX = (1920 / 2 - initialCamera.x) / initialCamera.scale
  const boardCenterY = (1080 / 2 - initialCamera.y) / initialCamera.scale
  return {
    scale: clampScale(initialCamera.scale),
    x: viewportWidth / 2 - boardCenterX * initialCamera.scale,
    y: viewportHeight / 2 - boardCenterY * initialCamera.scale,
  }
}

export function constrainCamera(camera: CameraState, viewportWidth: number, viewportHeight: number): CameraState {
  const scale = clampScale(camera.scale)
  const scaledWidth = BOARD_WIDTH * scale
  const scaledHeight = BOARD_HEIGHT * scale
  const marginX = Math.min(120, viewportWidth * 0.15)
  const marginY = Math.min(120, viewportHeight * 0.15)
  const constrainAxis = (position: number, viewport: number, content: number, margin: number) => {
    if (content <= viewport) return (viewport - content) / 2
    return Math.min(margin, Math.max(viewport - content - margin, position))
  }
  return {
    scale,
    x: constrainAxis(camera.x, viewportWidth, scaledWidth, marginX),
    y: constrainAxis(camera.y, viewportHeight, scaledHeight, marginY),
  }
}

export function normalizeWheelDelta(deltaY: number, deltaMode: number, viewportHeight: number) {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * viewportHeight : deltaY
  return Math.min(100, Math.max(-100, pixels))
}

export function zoomCameraAt(camera: CameraState, pointerX: number, pointerY: number, requestedScale: number): CameraState {
  const scale = clampScale(requestedScale)
  const boardX = (pointerX - camera.x) / camera.scale
  const boardY = (pointerY - camera.y) / camera.scale
  return { scale, x: pointerX - boardX * scale, y: pointerY - boardY * scale }
}

export function cameraTransform(camera: CameraState) {
  return `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.scale})`
}
