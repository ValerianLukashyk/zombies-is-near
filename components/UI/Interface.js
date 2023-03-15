class Interface {
    constructor(clock) {
        this.clock = clock
        this.screen = document.body
        this.isUiReady = false
        this.timerBeforeStart = null
        this.tickInterval = null

        // this.init().then(console.log).catch(console.error)
    }

    async init() {
        try {
            let isStoreReady = await this.initStore()
            if(isStoreReady) return isStoreReady
            else if(!isStoreReady) return {error: 'some error with store initializing'}
        } catch (e) {
            console.error(e)
        }
    }

    async initMenu() {
        let autoStartOffset = 5 // seconds
        const menuDiv = document.createElement('div')
        menuDiv.styles = {
            ...menuDiv.styles,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            backgroundColor: 'white',
            border: '2px solid black',
            borderRadius: '10px',
        }

        const startButton = document.createElement('button')
        startButton.textContent = `START (${autoStartOffset})`
        startButton.style.fontSize = '24px'
        startButton.style.padding = '10px 20px'
        startButton.style.borderRadius = '5px'
        startButton.style.backgroundColor = '#4CAF50'
        startButton.style.color = 'white'
        startButton.style.border = '1px blue dashed'
        startButton.style.cursor = 'pointer'

        let result

        this.tickInterval = setInterval(() => {
            startButton.textContent = `START (${(autoStartOffset -= 1)})`
        }, 1000)

        this.timerBeforeStart = setTimeout(async () => {
            menuDiv.style.display = 'none'
            result = await Promise.resolve(true).then(() => {
                clearTimeout(this.tickInterval)
                clearTimeout(this.timerBeforeStart)
            })
        }, 5000)

        menuDiv.appendChild(startButton)

        document.body.appendChild(menuDiv)
        console.log(result)
        return result
    }

    async initStore() {
        const bombsDiv = document.createElement('div')
        const singleBombDiv1 = document.createElement('button')
        const singleBombDiv2 = document.createElement('button')
        const singleBombDiv3 = document.createElement('button')
        const totalBombs = [singleBombDiv1, singleBombDiv2, singleBombDiv3]
        bombsDiv.style.position = 'absolute'
        bombsDiv.style.top = '3rem'
        bombsDiv.style.padding = '0.5rem 1rem'

        totalBombs.forEach((b) => {
            b.style.fontSize = '2.5rem'
            b.style.marginRight = '0.5rem'
            b.style.opacity = '0.3'
            b.innerText = '💣️'
            bombsDiv.appendChild(b)
        })

        document.body.appendChild(bombsDiv)
        let objRes = {ready: true, message: "store initialized"}
        return objRes
    }
}

export default Interface
