import * as THREE from 'three'
import CANNON from 'cannon'
import Stats from 'three/examples/jsm/libs/stats.module'
import Drone from './Drone.js'
import Interface from './components/UI/Interface.js'
import Helpers from './components/Helpers.js'
import Ground from './components/Ground.js'
import Light from './components/Light.js'
import PostProcessing from './postprocessing/PostProcessing'

const worldWidth = 512
const worldDepth = 512

class Game {
    constructor() {
        this.container = document.getElementById('mainscene')
        this.stats = Stats()
        document.body.appendChild(this.stats.dom)
        this.clock = new THREE.Clock()

        this.ui = new Interface(this.clock)
        this.time = 0
        this.timeStep = 1 / 60
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.drone = null
        this.droneModel = null
        this.crosshair = null
        this.bombs = []
        this.maxBombs = 3
        this.enemies = []
        this.isBombDropping = false
        this.score = 0
        this.gameOver = false
        this.keyState = {}
        this.camera = null
        this.cameraAngle = Math.PI / 4
        this.speed = 0.2
        this.initCamera('perspect')

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x4b4b74)
        this.scene.fog = new THREE.FogExp2(0xff006e, 0.005)

        this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true, precision: 'highp' })
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.setPixelRatio(2)
        this.renderer.shadowMap.enabled = true

        this.helpers = new Helpers(this.scene)
        this.world = new CANNON.World()
        this.light = new Light(this.scene)
        this.ground = new Ground(this.scene, this.world, worldWidth, worldDepth)
        this.postProcess = new PostProcessing(this.scene, this.renderer, this.camera)
    }
    init() {
        let isReady = this.ui.init()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        // this.postProcess = )
        if (isReady) this.startGame()
    }
    initCamera(type = 'perspect') {
        let width = window.innerWidth
        let height = window.innerHeight
        let aspect = width / height
        let D = 12

        if (type == 'perspect') {
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 100000)
            this.camera.position.set(
                40 * Math.sin(this.cameraAngle),
                60,
                40 * Math.cos(this.cameraAngle)
            )
            this.camera.lookAt(new THREE.Vector3(0, 0, 0))
        } else if (type == 'ortho') {
            this.camera = new THREE.OrthographicCamera(-D * aspect, D * aspect, D, -D, 0.01, 100000)
            this.camera.position.set(30, 50, 30)
            this.camera.lookAt(this.scene.position)
        }
    }

    startGame() {
        // this.initSound()
        this.addDrone()

        this.loadEnemies()
        this.initPhysics()

        this.addEventListeners()

        if (this.drone.object) this.initCrossHair()
        this.animate()
        // this.initGui()
    }

    initSound() {
        this.audioListener = new THREE.AudioListener()
        this.camera.add(this.audioListener)
        this.sound = new THREE.Audio(this.audioListener)
        const bgSound = document.getElementById('background_sound')
        this.sound.setMediaElementSource(bgSound)
        this.sound.setVolume(0)
        this.sound.setLoop(true)
        bgSound.play()

        this.soundFlying = new THREE.PositionalAudio(this.audioListener)
        const flySound = document.getElementById('flying_sound')
        this.soundFlying.setMediaElementSource(flySound)
        this.soundFlying.setRefDistance(20)
        this.soundFlying.setVolume(1)
        this.soundFlying.setLoop(true)
        flySound.play()
    }
    initPhysics() {
        const nutonLaw1 = -9.82
        this.world.gravity.set(0, nutonLaw1, 0)
        this.world.broadphase = new CANNON.NaiveBroadphase()
        this.world.solver.iterations = 10
    }

    addDrone() {
        this.drone = new Drone(this.bombs)
        this.drone.loadModel((d) => {
            this.scene.add(d)
            this.droneModel = d.children[4]
            // this.droneModel.add(this.soundFlying)    // TODO: COMPLETE SOUND SYSTEM
        })
    }

    addEventListeners() {
        window.addEventListener('keydown', (event) => {
            this.keyState[event.code] = true
        })

        window.addEventListener('keyup', (event) => {
            this.keyState[event.code] = false
        })
        window.addEventListener('resize', this.onWindowResize.bind(this))
    }
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.composer.setSize(window.innerWidth, window.innerHeight)
        effectFXAA.setSize(window.innerWidth, window.innerHeight)
        customOutline.setSize(window.innerWidth, window.innerHeight)

        effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight)
        // this.controls.handleResize()
    }
    loadEnemies() {
        const enemyGeometry = new THREE.BoxGeometry(1, 2, 1)
        const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0x00f000 })
        const numEnemies = 8

        for (let i = 0; i < numEnemies; i++) {
            const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial)
            enemy.position.x = Math.random() * 100 - 50
            enemy.position.y = 1
            enemy.position.z = Math.random() * 100
            this.enemies.push(enemy)
            this.scene.add(enemy)
        }
    }

    render() {
        this.stats.update()
        if (typeof this.postProcess !== undefined || null) {
            this.drone.uniforms.cameraPosition.value = this.camera.position
            let delta = this.clock.getDelta()
            this.postProcess.update(delta)
            // this.renderer.render(this.scene, this.camera)
            this.drone.object && this.updateCamera()
            if(this.nitro) this.speed
        }
    }

    animate() {
        if (this.gameOver) {
            return
        }
        requestAnimationFrame(() => this.animate())

        if (this.drone && this.drone.object !== null) {
            this.drone.animatePropellers(this.clock)
            this.moveDrone()
            this.checkCollisions()
            this.updateScore()
            this.checkGameOver()
            this.updatePhysics()
            this.drone.uniforms.time = this.time
        }
        if (this.isBombDropping) this.updateBombDropTime()
        this.render()
        this.time += 0.001
    }
    updateCamera() {
        this.camera.position.set(
            this.drone.object.position.x + 40 * Math.sin(this.cameraAngle),
            this.drone.object.position.y + 60,
            this.drone.object.position.z + 40 * Math.cos(this.cameraAngle)
        )
        this.camera.lookAt(this.drone.object.position)
    }

    updatePhysics() {
        // Step the physics world
        this.world.step(this.timeStep)
        this.bombs.forEach((b) => {
            b.mesh.position.copy(b.body.position)
            b.mesh.quaternion.copy(b.body.quaternion)
        })
    }

    moveDrone() {
        
        const rotateAngle = Math.PI / 4 // 45 градусів

        if (this.keyState['KeyW']) {
            this.drone.object.rotation.y = 0
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, this.speed)
        }
        else if (this.keyState['KeyS']) {
            this.drone.object.rotation.y = Math.PI
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, this.speed)
        }
        else if (this.keyState['KeyA']) {
            this.drone.object.rotation.y = 2 * rotateAngle
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, this.speed)
        }
        else if (this.keyState['KeyD']) {
            this.drone.object.rotation.y = -2 * rotateAngle
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, this.speed)
        }

        if(this.keyState['Shift']) {
            this.nitro = true
            // speed = 0.4
        }
        if (this.keyState['Space']) {
            this.dropBomb()
        }
    }
    checkCollisions() {
        for (let i = 0; i < this.bombs.length; i++) {
            const bomb = this.bombs[i]
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j]
                const enemyBox = new THREE.Box3().setFromObject(enemy)
                const bombBox = new THREE.Box3().setFromObject(bomb.mesh)
                if (bombBox.intersectsBox(enemyBox)) {
                    this.scene.remove(bomb.mesh)
                    this.bombs.splice(i, 1)
                    this.scene.remove(enemy)
                    this.enemies.splice(j, 1)
                    this.score++
                    break
                }
            }
            if (bomb.mesh.position.y < 0) {
                this.scene.remove(bomb.mesh)
                this.bombs.splice(i, 1)
                break
            }
        }
    }

    updateScore() {
        const scoreElem = document.getElementById('score')
        scoreElem.innerHTML = `Score: ${this.score}`
    }

    checkGameOver() {
        if (this.enemies.length === 0) {
            this.gameOver = true
            const messageElem = document.getElementById('message')
            messageElem.innerHTML = 'You Win!'
            messageElem.style.display = 'block'
            messageElem.style.pointerEvents = 'none'
            messageElem.style.userSelect = 'none'
        }
    }

    dropBomb() {
        if (!this.isBombDropping) {
            if (this.bombs.length !== 0) {
            }
            const bombGeometry = new THREE.SphereGeometry(0.4)
            const bombMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
            const bomb = new THREE.Mesh(bombGeometry, bombMaterial)
            bomb.position.copy(this.drone.object.position)
            this.scene.add(bomb)

            const bombShape = new CANNON.Sphere(0.4)
            const bombBody = new CANNON.Body({
                mass: 5,
                shape: bombShape,
                position: new CANNON.Vec3(
                    this.drone.object.position.x,
                    this.drone.object.position.y,
                    this.drone.object.position.z
                ),
            })
            this.world.add(bombBody)
            this.bombs.push({ mesh: bomb, body: bombBody })

            this.isBombDropping = true
            this.bombStartTime = Date.now()
        }
    }

    updateBombDropTime() {
        if (this.isBombDropping) {
            const currentTime = Date.now()
            if (currentTime - this.bombStartTime > 2000) {
                this.isBombDropping = false
            }
        }
    }
}

const game = new Game()
game.init()
