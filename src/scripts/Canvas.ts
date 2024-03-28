import * as THREE from 'three'
import { RawShaderMaterial } from './core/ExtendedMaterials'
import { Three } from './core/Three'
import modelVs from './shader/model.vs'
import modelFs from './shader/model.fs'
import renderVs from './shader/render.vs'
import renderFs from './shader/render.fs'
import { Light } from './Light'

export class Canvas extends Three {
  private readonly postScene: THREE.Scene
  private mrt: THREE.WebGLRenderTarget
  private light: Light

  private model: THREE.Mesh
  private screen: THREE.Mesh<THREE.PlaneGeometry, RawShaderMaterial>

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)

    this.init()
    this.postScene = new THREE.Scene()
    this.mrt = this.createMultipleRenderTarget()
    this.light = this.createLight()

    this.model = this.createModel()
    this.screen = this.createScreen(this.mrt)

    this.renderer.setAnimationLoop(this.anime.bind(this))
    window.addEventListener('resize', this.resize.bind(this))
  }

  private init() {
    this.scene.background = new THREE.Color('#fff')
    this.camera.position.z = 7

    // this.controls.enabled = true
  }

  private createLight() {
    const f = 2.5
    const camera = new THREE.OrthographicCamera(-f, f, f, -f, 1, 10)
    camera.position.set(-0.5, 2, -2.5)
    camera.lookAt(this.scene.position)
    return new Light(this.renderer, camera, [2048, 2048])
  }

  private createMultipleRenderTarget() {
    const dpr = this.renderer.getPixelRatio()
    const rt = new THREE.WebGLRenderTarget(this.size.width * dpr, this.size.height * dpr, {
      // type: THREE.FloatType,
      type: THREE.HalfFloatType,
      count: 3,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    })
    rt.textures[0].name = 'diffuse'
    rt.textures[1].name = 'normal-depth'
    rt.textures[2].name = 'position'
    return rt
  }

  private createModel() {
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 300, 30)
    const material = new RawShaderMaterial({
      uniforms: {},
      vertexShader: modelVs,
      fragmentShader: modelFs,
      glslVersion: '300 es',
    })
    // const material = new THREE.MeshNormalMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y += 0.5
    this.scene.add(mesh)
    return mesh
  }

  private createScreen(mrt: THREE.WebGLRenderTarget) {
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new RawShaderMaterial({
      uniforms: {
        uResolution: { value: [this.size.width, this.size.height] },
        tDiffuse: { value: mrt.textures.find((t) => t.name === 'diffuse') },
        tNormalDepth: { value: mrt.textures.find((t) => t.name === 'normal-depth') },
        tPosition: { value: mrt.textures.find((t) => t.name === 'position') },
        uLight: {
          value: this.light.uniforms,
        },
        uCamera: {
          value: {
            position: this.camera.position,
            projectionMatrixInverse: this.camera.projectionMatrixInverse,
            viewMatrixInverse: this.camera.matrixWorld,
          },
        },
      },
      vertexShader: renderVs,
      fragmentShader: renderFs,
      glslVersion: '300 es',
    })
    const mesh = new THREE.Mesh(geometry, material)
    this.postScene.add(mesh)
    return mesh
  }

  private resize() {
    const dpr = this.renderer.getPixelRatio()
    this.mrt.setSize(this.size.width * dpr, this.size.height * dpr)
    this.screen.material.uniforms.uResolution.value = [this.size.width, this.size.height]
  }

  private anime() {
    this.updateTime()

    this.model.rotation.x += this.time.delta * 0.5
    this.model.rotation.y += this.time.delta * 0.5
    this.model.rotation.z += this.time.delta * 0.5

    this.light.render(this.scene)

    this.renderer.setRenderTarget(this.mrt)
    this.renderer.render(this.scene, this.camera)

    this.renderer.setRenderTarget(null)
    this.renderer.render(this.postScene, this.camera)
  }
}
