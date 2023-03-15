import * as THREE from 'three'
import CANNON from 'cannon'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import Drone from './Drone.js'
import Interface from './components/UI/Interface.js'
import Helpers from './components/Helpers.js'
import Ground from './components/Ground.js'

const speed = 0.3
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
        this.cameraAngle = Math.PI / 4 // 45 градусів

        this.initCamera('perspect')

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x00d1b5)
        this.scene.fog = new THREE.FogExp2(0x000000, 0.0015)
        this.helpers = new Helpers(this.scene)
        // this.data = this.generateHeight(worldWidth, worldDepth)

        this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true })
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.world = new CANNON.World()

        this.ground = new Ground(this.scene, this.world, worldWidth, worldDepth)
    }
    init() {
        this.initGui()
        let isReady = this.ui.init()
        this.renderer.setSize(window.innerWidth, window.innerHeight)

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

    initGui() {
        this.gui = new GUI()
        const cameraFolder = this.gui.addFolder('Camera')
        this.guiX = cameraFolder.add(this.camera.position, 'x', -100, 100)
        this.guiY = cameraFolder.add(this.camera.position, 'y', -100, 100)
        this.guiZ = cameraFolder.add(this.camera.position, 'z', -100, 100)
        cameraFolder.open()

        this.guiX.getValue()

        this.renderGui(this.guiX, this.guiY, this.guiZ)
    }
    renderGui(x, y, z) {
        this.gui.listen(x)
        this.gui.listen(y)
        this.gui.listen(z)
    }
    startGame() {
        this.addLight()
        // this.addTiles()

        // this.initSound()
        this.addDrone()

        this.loadEnemies()
        this.initPhysics()

        this.addEventListeners()

        if (this.drone.object) this.initCrossHair()
        this.animate()
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

    addLight() {
        const light = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(light)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(0, 1, 0)
        this.scene.add(directionalLight)
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
    animate() {
        if (this.gameOver) {
            return
        }
        requestAnimationFrame(() => this.animate())
        this.render()
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

        this.time += 0.001
    }

    render() {
        this.stats.update()
        this.drone.uniforms.cameraPosition.value = this.camera.position;


        this.renderer.render(this.scene, this.camera)
        this.drone.object && this.updateCamera()
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

    addTiles() {
        this.scene.add(new THREE.AxesHelper(100))

        var TILE_W = 2,
            TILE_W_HALF = TILE_W / 2

        for (var z = 0; z < this.worldData.numRows; z++) {
            var offsetX = 0

            for (var x = 0; x < this.worldData.numCols; x++) {
                var rand = Math.floor(Math.random() * 5),
                    randColor = null

                switch (rand) {
                    case 0:
                        randColor = 0xff0000
                        break
                    case 1:
                        randColor = 0x00ff00
                        break
                    case 2:
                        randColor = 0x0000ff
                        break
                    case 3:
                        randColor = 0xffff00
                        break
                    case 4:
                        randColor = 0x00ffff
                        break
                }

                const geometry = new THREE.BufferGeometry()

                const vertexPositions = [
                    [-TILE_W / 2, -TILE_W / 2, TILE_W / 2],
                    [TILE_W / 2, -TILE_W / 2, TILE_W / 2],
                    [TILE_W / 2, TILE_W / 2, TILE_W / 2],

                    [TILE_W / 2, TILE_W / 2, TILE_W / 2],
                    [-TILE_W / 2, TILE_W / 2, TILE_W / 2],
                    [-TILE_W / 2, -TILE_W / 2, TILE_W / 2],
                ]
                const vertices = new Float32Array(vertexPositions.length * 3)

                for (let i = 0; i < vertexPositions.length; i++) {
                    vertices[i * 3 + 0] = vertexPositions[i][0]
                    vertices[i * 3 + 1] = vertexPositions[i][1]
                    vertices[i * 3 + 2] = vertexPositions[i][2]
                }

                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
                const tileXPos = x * TILE_W + offsetX + TILE_W * 0.4 * x
                const tileZPos = z * TILE_W - TILE_W_HALF * 0.4 * z

                const material = new THREE.MeshLambertMaterial({
                    color: randColor,
                    side: THREE.FrontSide,
                })
                material.shading = THREE.SmoothShading
                geometry.rotateX(-Math.PI / 2)
                geometry.computeVertexNormals()
                const tilePlane = new THREE.Mesh(geometry, material)

                tilePlane.position.set(tileXPos, 0, tileZPos)
                tilePlane.rotation.y = (45 * Math.PI) / 180

                this.scene.add(tilePlane)
            }
        }
    }

    moveDrone() {
        const speed = 0.1
        const rotateAngle = Math.PI / 4 // 45 градусів

        if (this.keyState['KeyW']) {
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, speed)
        }
        if (this.keyState['KeyS']) {
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, speed)
        }
        if (this.keyState['KeyA']) {
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, speed)
        }
        if (this.keyState['KeyD']) {
            const direction = new THREE.Vector3(0, 0, -1)
            this.drone.object.translateOnAxis(direction, speed)
        }

        if (this.keyState['KeyW']) {
            this.drone.object.rotation.y = 0
        } else if (this.keyState['KeyS']) {
            this.drone.object.rotation.y = Math.PI
        } else if (this.keyState['KeyA']) {
            this.drone.object.rotation.y = 2 * rotateAngle
        } else if (this.keyState['KeyD']) {
            this.drone.object.rotation.y = -2 * rotateAngle
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
