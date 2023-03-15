import * as THREE from 'three'

class Light {
    constructor(scene) {
        this.scene = scene
        this.lights = []
        this.addLight()
    }

    addLight() {
        const ambLight = new THREE.AmbientLight(0xffff0f, 0.5)
        this.scene.add(ambLight)
        this.lights.push(ambLight)

        const dirLight = new THREE.DirectionalLight(0xddffdd, 0.5)
        dirLight.position.set(1, 100, 1)
        dirLight.castShadow = true
        dirLight.shadow.mapSize.width = 1024
        dirLight.shadow.mapSize.height = 1024

        const d = 10

        dirLight.shadow.camera.left = -d
        dirLight.shadow.camera.right = d
        dirLight.shadow.camera.top = d
        dirLight.shadow.camera.bottom = -d
        dirLight.shadow.camera.far = 1000

        this.scene.add(dirLight)
        this.lights.push(dirLight)
    }
}

export default Light
