import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import fragment from './shaders/stroke.frag'
import vertex from './shaders/stroke.vert'
const bombSize = 0.4

class Drone {
    constructor() {
        this.scale = 0.5
        this.propSpeed = 11.4 * Math.PI
        this.loader = new GLTFLoader()
        this.dracoLoader = new DRACOLoader()
        this.object = null
        this.bombs = []
        this.uniforms = null
        this.crosshair = null
        this.targetCircle = null
        this.addBomb()
        this.addBomb()
        this.addBomb()
        this.initCrossHair()
    }

    addBomb() {
        if (this.bombs.length < this.maxBombs) {
            const bombGeometry = new THREE.SphereGeometry(bombSize)
            const bombMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
            let bomb = new THREE.Mesh(bombGeometry, bombMaterial)
            let dronePosition = this.drone.object.position.clone()
            dronePosition.y -= 4
            bomb.position.copy(dronePosition)
            this.scene.add(bomb)
            this.bombs.push({ mesh: bomb, dropped: false })
        }
    }
    initCrossHair() {
        const geometry = new THREE.CylinderGeometry(0.5, 1, 100, 32)
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff0f,
            transparent: true,
            opacity: 0.17,
            // wireframe: true,
        })
        geometry.translate(0, -50, 0)
        this.crosshair = new THREE.LineSegments(geometry, material)
        // this.crosshair.computeLineDistances()
        this.targetCircle = new THREE.Mesh(
            new THREE.SphereGeometry(5, 9, 7, 0, Math.PI * 2, 2.2, Math.PI / 2),
            new THREE.MeshToonMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.5,
                // wireframe: true,
            })
        )
        this.targetCircle.scale.y = -1
        this.targetCircle.position.y -= 102
        this.targetCircle.name = 'target_circle'
    }
    loadModel(callback) {
        const downloadUrl = new URL('models/drone_model2.gltf', import.meta.url)
        this.uniforms = {
            cameraPosition: { value: new THREE.Vector3(0, 100, 0) },
            time: { value: 0 },
            color: { value: new THREE.Color(0x000) },
        }
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertex,
            fragmentShader: fragment,
        })
        this.loader.setDRACOLoader(this.dracoLoader)
        this.loader.load(downloadUrl.href, (gltf) => {
            this.object = gltf.scene
            this.object.children[4].children.forEach((part) => (part.material = material))
            this.object.scale.set(this.scale, this.scale, this.scale)
            this.object.position.set(0, 100, 0)
            // this.object.rotation.set(0, Math.PI / 2, 0)
            this.object.add(this.crosshair)
            this.object.add(this.targetCircle)
            callback(this.object)
        })
    }

    animatePropellers(clock) {
        const delta = clock.getDelta()
        if (this.object !== null) {
            this.object.children.forEach((prop) => {
                if (prop.name.startsWith('propeller_')) {
                    prop.rotation.y += delta * this.propSpeed
                }
            })
        }
    }

    update() {
        console.log('\t👌 Updated succesfully')
    }
}

export default Drone
