import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { CustomOutlinePass } from './CustomOutlinePass.js'
import DevUI from '../DevUI.js'

const config = {
    biasDepth: 5,
    multDepth: 20,
    biasNormal: 20,
    multNormal: 10,
    cameraNear: 0.1,
    cameraFar: 255,
}
class PostProcessing {
    constructor(scene, renderer, camera) {
        this.scene = scene
        this.renderer = renderer
        this.camera = camera

        this.gui = new DevUI(this)
        this.procGuiDir = null
        this.uniforms = null

        this.depthTexture = new THREE.DepthTexture()
        this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            depthTexture: this.depthTexture,
            depthBuffer: true,
        })

        this.composer = new EffectComposer(this.renderer, this.renderTarget)
        this.renderPass = new RenderPass(this.scene, this.camera)
        this.outlinePass = new CustomOutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.scene,
            this.camera
        )
        this.effectFXAA = new ShaderPass(FXAAShader)
        this.effectFXAA.uniforms['resolution'].value.set(
            1 / window.innerWidth,
            1 / window.innerHeight
        )

        this.initPostProcessing()
    }

    initPostProcessing() {
        this.composer.addPass(this.renderPass)
        this.composer.addPass(this.outlinePass)
        this.composer.addPass(this.effectFXAA)

        this.gui.initGui()
    }
    configure() {
        this.uniforms.outlineColor.value.set(0xffff00)
        // Bias Depth
        this.uniforms.multiplierParameters.value.x = config.biasDepth
        // Mult Depth
        this.uniforms.multiplierParameters.value.y = config.multDepth
        // Bias Normal
        this.uniforms.multiplierParameters.value.z = config.biasNormal
        // Mult Normal
        this.uniforms.multiplierParameters.value.w = config.multNormal
        // Camera Near
        this.camera.near = config.cameraNear
        this.camera.updateProjectionMatrix()
        this.uniforms.cameraNear.value = this.camera.near
        // Camera Far
        this.camera.far = config.cameraFar
        this.camera.updateProjectionMatrix()
        this.uniforms.cameraFar.value = this.camera.far
    }
    addConfigToGui(processingFolder) {
        this.procGuiDir = processingFolder
        if (!this.outlinePass) return
        this.uniforms = this.outlinePass.fsQuad.material.uniforms
        this.configure()
        // const params = {
        //     mode: { Mode: 0 },
        //     FXAA: true,
        //     outlineColor: 0xffff00,
        //     depthBias: this.uniforms.multiplierParameters.value.x,
        //     depthMult: this.uniforms.multiplierParameters.value.y,
        //     normalBias: this.uniforms.multiplierParameters.value.z,
        //     normalMult: this.uniforms.multiplierParameters.value.w,
        //     cameraNear: this.camera.near,
        //     cameraFar: this.camera.far,
        // }

        // const changeColorUniform = (value) => {
        //     this.uniforms.outlineColor.value.set(value)
        // }
        // const changeDepthBiasUniform = (value) => {
        //     this.uniforms.multiplierParameters.value.x = value
        // }
        // const changeDepthMultUniform = (value) => {
        //     this.uniforms.multiplierParameters.value.y = value
        // }
        // const changeNormalBiasUniform = (value) => {
        //     this.uniforms.multiplierParameters.value.z = value
        // }
        // const changeNormalMultUniform = (value) => {
        //     this.uniforms.multiplierParameters.value.w = value
        // }
        // const changeCameraNearUniform = (value) => {
        //     this.camera.near = value
        //     this.camera.updateProjectionMatrix()
        //     this.uniforms.cameraNear.value = this.camera.near
        // }
        // const changeCameraFarUniform = (value) => {
        //     this.camera.far = value
        //     this.camera.updateProjectionMatrix()
        //     this.uniforms.cameraFar.value = this.camera.far
        // }
        // processingFolder.addColor(params, 'outlineColor').onChange(changeColorUniform.bind(this))

        // processingFolder
        //     .add(params, 'depthBias', 0.0, 5)
        //     .onChange(changeDepthBiasUniform.bind(this))
        // processingFolder
        //     .add(params, 'depthMult', 0.0, 20)
        //     .onChange(changeDepthMultUniform.bind(this))
        // processingFolder
        //     .add(params, 'normalBias', 0.0, 20)
        //     .onChange(changeNormalBiasUniform.bind(this))
        // processingFolder
        //     .add(params, 'normalMult', 0.0, 10)
        //     .onChange(changeNormalMultUniform.bind(this))
        // processingFolder
        //     .add(params, 'cameraNear', 0.1, 1)
        //     .onChange(changeCameraNearUniform.bind(this))
        // processingFolder
        //     .add(params, 'cameraFar', 1, 1000)
        //     .onChange(changeCameraFarUniform.bind(this))
    }

    update(delta) {
        this.composer.render(delta)
    }
}

export default PostProcessing
