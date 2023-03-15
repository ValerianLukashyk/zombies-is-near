import * as THREE from 'three'
import CANNON from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

class Ground {
    constructor(scene, world, ww, wd) {
        this.scene = scene
        this.world = world
        this.loader = new GLTFLoader()
        this.drakoLoader = new DRACOLoader()
        // this.drakoLoader.preload()

        this.loader.setDRACOLoader(this.drakoLoader)

        this.options = {
            segments: 100,
            worldWidth: ww,
            worldDepth: wd,
        }

        this.init()
        this.loadModel(this.scene)
    }

    init() {
        const { segments, worldWidth, worldDepth } = this.options
        const geometry = new THREE.PlaneGeometry(segments, segments, worldWidth - 1, worldDepth - 1)
        geometry.rotateX(-Math.PI / 2)
        const material = new THREE.MeshBasicMaterial({ color: 0x004e35f99, transparent: true })
        const ground = new THREE.Mesh(geometry, material)
        ground.position.y -= 0.1
        this.scene.add(ground)

        const groundShape = new CANNON.Plane(new CANNON.Vec3(0, 0, 0))

        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            position: new CANNON.Vec3(ground.position.x, ground.position.y, ground.position.z),
        })
        this.world.addBody(groundBody)
    }
    loadModel(scene) {
        const downloadUrl = new URL('../models/island.gltf', import.meta.url)
        this.loader.load(
            downloadUrl.href,
            function (gltf) {
                console.log('GLTF: ', gltf)
                let island = gltf.scenes[0]
                island.scale.set(10, 10, 10)
                island.position.set(0, -5, 0)
                console.log('GLTF.Scenes[0]: ', island)
                console.log('island is mesh?  ', island.isObject3D)
                console.log('scene is a scene?  ', scene.isScene)

                if (scene.isScene) {
                    console.log('done!')
                    scene.add(island)
                }
            },
            // called as loading progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            }
            // called when loading has errors
            // function (error) {
            //     console.log('An error happened', error)
            // }
        )
    }
}

export default Ground
