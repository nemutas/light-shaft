import * as THREE from 'three'
import { RawShaderMaterial } from './core/ExtendedMaterials'
import vertexShader from './shader/depth.vs'
import fragmentShader from './shader/depth.fs'

export class Light {
  private readonly renderTarget: THREE.WebGLRenderTarget
  private readonly depthMaterial: RawShaderMaterial

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private camera: THREE.Camera,
    mapSize: [number, number],
  ) {
    this.renderTarget = this.createRenderTarget(mapSize)
    this.depthMaterial = this.createDepthMaterial()
  }

  private createRenderTarget(mapSize: [number, number]) {
    return new THREE.WebGLRenderTarget(mapSize[0], mapSize[1], { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter })
  }

  private createDepthMaterial() {
    return new RawShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      glslVersion: '300 es',
    })
  }

  get uniforms() {
    return {
      depthMap: this.renderTarget.texture,
      position: this.camera.position,
      projectionMatrix: this.camera.projectionMatrix,
      viewMatrix: this.camera.matrixWorldInverse,
    }
  }

  render(scene: THREE.Scene) {
    scene.overrideMaterial = this.depthMaterial

    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(scene, this.camera)

    scene.overrideMaterial = null
  }
}
