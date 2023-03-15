import * as THREE from 'three'

class Helpers {
    constructor(scene) {
        this.scene = scene
        this.activeHelpers = []
    
        this.execute(this.activeHelpers)
    
    
    }

    gridHelper() {
        const size = 100
        const divisions = 100

        const gridHelper = new THREE.GridHelper(size, divisions)
        this.scene.add(gridHelper)
    }
    axesHelper() {
        const axesHelper = new THREE.AxesHelper(100)
        this.scene.add(axesHelper)
    }

    execute() {
        // this.activeHelpers.push(()=>this.gridHelper())
        this.activeHelpers.push(()=>this.axesHelper())
        this.activeHelpers.forEach(func => func())
    }
}

export default Helpers
