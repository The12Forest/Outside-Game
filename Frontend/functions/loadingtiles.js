let loadingTitlesInterval
let loadingTitleTimeout
let timeSubTitleStart

const loadingTitles = [
    "Overthrowing the government...",
    "Starting nuclear_operation.bat...",
    "Calibrating the FICSIT coffee machine...",
    "Convincing the space elevator to cooperate...",
    "Reassembling the assembler...",
    "Paving over the wildlife...",
    "Bribing the lizard doggos...",
    "Spinning up the hypertubes...",
    "Untangling the conveyor spaghetti...",
    "Waking up the pioneers...",
    "Handshaking with the nearest hub...",
    "Compiling the laws of physics...",
    "Feeding the biomass burners...",
    "Negotiating with the stingers...",
    "Overthrowing the local government...",
    "Filing for bankruptcy in advance...",
    "Convincing the AI that humans are still useful...",
    "Untangling the spaghetti code...",
    "Aggressively optimizing unnecessary features...",
    "Hiding bugs under a tiny virtual rug...",
    "Negotiating with hostile wildlife...",
    "Bribing the physics engine to behave...",
    "Generating plausible excuses for server lag...",
    "Converting coffee directly into source code...",
    "Rerouting power from life support to cosmetic lighting...",
    "Deleting the 'Do Not Delete' folder...",
    "Consulting the legal team regarding war crimes...",
    "Pretending this loading screen is doing complex math...",
    "Summoning the Eldritch horrors of memory leaks...",
    "Calibrating conveyor belt speed to maximum chaos...",
    "Ignoring safety regulations for shareholder value...",
    "Warming up the fans to mimic jet engines...",
    "Replacing competent staff with cheaper algorithms...",
    "Blaming the player's hardware...",
    "Polishing pixels until they shine...",
    "Re-evaluating life choices at 3:00 AM...",
    "Baking ambient occlusion into bad decisions...",
    "Synthesizing artificial sense of accomplishment...",
    "Suppressing unionization attempts among factory drones...",
    "Reticulating splines...",
    "Deploying questionable engineering practices...",
    "Warming up the microwave...",
    "Sharpening the chainsaw...",
    "Polishing the factory floor...",
    "Requesting permission from the FICSIT overlords...",
    "Refusing to take responsibility...",
    "Counting to a very large number...",
    "Downloading more RAM...",
    "Aligning the satellite dish...",
    "Ignoring the safety manual...",
    "Brewing an unhealthy amount of coffee...",
    "Filing the paperwork for world domination...",
    "Reheating yesterday's spaghetti...",
    "Sending thoughts and prayers to the servers...",
    "Consulting the magic 8-ball...",
    "Poking the server with a stick...",
    "Removing bugs (adding new bugs)...",
    "Generating breathtaking vistas...",
    "Overclocking the toaster...",
    "Losing the game...",
    "Tripping over a cable...",
    "Pretending to know what we are doing...",
    "Awakening the ancient conveyor gods...",
    "Scheduling a meeting that could have been an email...",
    "Loading quantum tunnel #42...",
    "Reverse-engineering the rules of fun...",
    "Sharpening the shovel of destiny...",
    "Tuning the gravity slider...",
    "Begging the GPS for a signal...",
    "Encrypting your secrets with duct tape...",
    "Charging the crystals...",
    "Asking the player to please wait...",
    "Summoning the loading screen...",
    "Doing absolutely nothing, but slowly...",
    "Almost there (this is a lie)...",
]
   


function startLoadingTitles(timeSubTitleStart) {
    const el = document.getElementById("countodwn_subtitle")
    if (!el) return

    stopLoadingTitles()

    el.innerText = isRunner ? "Time you have to send the next Image!" : "Get ready, the next Image is coming!"

    loadingTitleTimeout = setTimeout(() => {
        loadingTitlesInterval = setInterval(() => {
            el.innerText = loadingTitles[Math.floor(Math.random() * loadingTitles.length)]
        }, 5000)
    }, 10000)
    //Whaits 10 sec then shows a new message every 5 sec
}

function stopLoadingTitles() {
    if (loadingTitleTimeout) {
        clearTimeout(loadingTitleTimeout)
        loadingTitleTimeout = undefined
    }
    if (loadingTitlesInterval) {
        clearInterval(loadingTitlesInterval)
        loadingTitlesInterval = undefined
    }
}
