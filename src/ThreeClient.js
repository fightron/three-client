import { Client } from '@fightron/core/client'
import { WebGLRenderer, PerspectiveCamera, Scene, Color, PCFSoftShadowMap } from 'three'
import { GeometryInjector } from './injectors/GeometryInjector'
import { ItemInjector } from './injectors/ItemInjector'
import { RigInjector } from './injectors/RigInjector'
import { OutlineEffect } from './effects/OutlineEffect'

export class ThreeClient extends Client {
  constructor (canvas) {
    if (!canvas) {
      throw new Error('FATAL-TC-C')
    }
    super()
    this.canvas = canvas
    this.initialize()
  }

  initializeCollections () {
    super.initializeCollections()
    this.geometries.injector = new GeometryInjector(this)
    this.items.injector = new ItemInjector(this)
    this.rigs.injector = new RigInjector(this)
  }

  initializeScene () {
    this.scene = new Scene()
    this.scene.background = new Color(this.color)
  }

  initialize () {
    this.document = this.canvas.ownerDocument
    if (!this.document) {
      throw new Error('FATAL-TC-CD')
    }
    this.window = this.document.defaultView
    if (!this.window) {
      throw new Error('FATAL-TC-CW')
    }
    var rAF = this.window.requestAnimationFrame
    if (rAF) {
      this.nextFrameFn = rAF.bind(this.window)
    }
    var performance = this.window.performance
    if (performance) {
      this.fps.now = performance.now.bind(performance)
    }
    // WebGL options
    this.alpha = false
    this.antialias = true
    this.power = 'default' // 'high-performance', 'low-power' or 'default'
    // Stylize canvas to fill container
    var s = this.canvas.style
    s.position = 'absolute'
    // s.top = s.bottom = s.left = s.right = 0
    // s.border = '5px dashed red'
    this.initializeRenderer()
    this.camera = new PerspectiveCamera(
      20 /* FOV angle */,
      1 /* aspect ratio - will be updated by resize() */,
      1 /* near */,
      100000 /* far */
    )
    this.camera.position.z = 1200
    this.camera.position.y = 170
    this.resize = this.resize.bind(this)
    this.resizeStart = this.resizeStart.bind(this)
    this.render = this.render.bind(this)
    this.window.addEventListener('resize', this.resizeStart, false)
    this.resize()
  }

  // Must be called after changing certain options.
  initializeRenderer () {
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    try {
      this.renderer = new WebGLRenderer({
        canvas: this.canvas,
        alpha: this.alpha,
        antialias: this.antialias,
        powerPreference: this.power
      })
      this.renderer.info.autoReset = false
      this.renderer.shadowMap.enabled = this.shadows
      this.renderer.shadowMap.type = PCFSoftShadowMap
      this.effect = new OutlineEffect(this.renderer)
      // this.effect = null
      return true
    } catch (error) {
      console.warn('E-TC-R', error.message)
      return false
    }
  }

  resizeStart () {
    if (this.resizing) {
      return
    }
    this.resizing = true
    setTimeout(this.resize, 100)
  }

  resize () {
    var window = this.window
    var width = window.innerWidth
    var height = window.innerHeight
    if (width === 0 || height === 0) {
      this.resizing = false
      return
    }
    if (this.renderer) {
      this.renderer.setSize(width, height)
    }
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.resizing = false
  }

  renderFrame () {
    if (this.effect) {
      this.effect.render(this.scene, this.camera)
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  dispose () {
    this.rendering = false
    this.window.removeEventListener('resize', this.resizeStart, false)
    this.renderer.dispose()
    this.effect = null
    super.dispose()
  }
}
