class countdown {
    deadline
    timer
    updater
    fired
    container_name
    callback

    constructor(container_name, callback) {
        this.callback = callback
        this.container_name = container_name
        this.update()
    }

    remaining() {
        return Math.max(0, this.deadline - serverNow())
    }

    format(time) {
        const min = Math.floor(time / 60_000)
        const sec = Math.floor((time % 60_000) / 1_000)
        const ms = Math.floor((time % 1_000) / 10)
        return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}:${String(ms).padStart(2, "0")}`
    }

    start() {
        this.stop()
        this.fired = false
        this.render(this.remaining())
        if (!this.timer) this.timer = setInterval(() => this.count(), 10)
        if (!this.updater) this.updater = setInterval(() => this.update(), 500)
        reDraw("countdown")
        startLoadingTitles()
        stopVibrating()
    }

    count() {
        const remaining = this.remaining()
        this.render(remaining)
        if (remaining === 0 && !this.fired) {
            this.fired = true
            if (typeof this.callback === "function") this.callback()
            this.stop()
        }
    }

    render(time) {
        if (!this.container_name) return
        const el = document.getElementById(this.container_name)
        if (el) el.textContent = this.format(time)
    }

    stop() {
        if (this.timer) clearInterval(this.timer)
        // if (this.updater) clearInterval(this.updater)
        reDraw("positon_shown")
        this.timer = null
        this.updater = null
    }

    async update() {
        const deadline = await getDeadline()
        if (!deadline) return
        if (deadline === this.deadline) return
        this.deadline = deadline
        this.fired = false
        this.start()
    }
}