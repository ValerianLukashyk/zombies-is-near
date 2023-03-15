import { GUI } from 'dat.gui'

class DevUI {
    constructor(pp) {
        this.postProcessing = pp
        this.gui = new GUI({ width: 420 })
        
    }

    initGui() {
        const cameraFolder = this.gui.addFolder('Camera')
        this.guiX = cameraFolder.add(this.postProcessing.camera.position, 'x', -100, 100)
        this.guiY = cameraFolder.add(this.postProcessing.camera.position, 'y', -100, 100)
        this.guiZ = cameraFolder.add(this.postProcessing.camera.position, 'z', -100, 100)
        cameraFolder.close()
        this.postProcessingFolder = this.gui.addFolder('Post-processing')
        this.postProcessingFolder.open()

        this.guiX.getValue()
        
        this.renderGui(this.guiX, this.guiY, this.guiZ)
    }
    renderGui(x, y, z) {
        this.gui.listen(x)
        this.gui.listen(y)
        this.gui.listen(z)

        this.postProcessing.addConfigToGui(this.postProcessingFolder)
    }
}

export default DevUI
