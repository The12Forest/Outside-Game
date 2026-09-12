let loadingTitlesInterval
let loadingTitleTimeout
let timeSubTitleStart
let loadingTitlesShown = false

const loadingTitles = [
    // Deadpan Anti-Advice
    "Tip: Avoid bullets by occupying different coordinates.",
    "Drowning? Discontinue inhaling water.",
    "Tip: Explosions are easiest avoided by being somewhere else.",
    "On fire? Stop, drop, and consider your choices.",
    "Tip: Decapitation significantly hinders forward visibility.",
    "Out of ammo? Try asking nicely.",
    "Bleeding out? Keep the red fluids inside.",

    // Absurdist Bureaucracy
    "Permit required prior to scheduled demise.",
    "Fainting during work hours requires a doctor's note in advance.",
    "Register all panic attacks 48 hours prior.",
    "Severed limbs remain company property.",
    "Submit Form 4-B to validate incoming fire.",
    "Dying on duty is considered an unexcused absence.",
    "Screaming requires Facilities approval.",

    // Chilly Indifference
    "Please expire over the designated drain.",
    "Your replacement is already on the elevator.",
    "Do not bleed on the lobby carpet.",
    "Your badge outvalues your biomass.",
    "Clean your desk before your heart stops.",
    "Janitorial drones are tracking your coordinates.",
    "Your output will be missed; you will not.",
    // Deadpan Anti-Advice

    "Tip: Falling objects have the right-of-way.",
    "Poisoned? Try simply rejecting the premise.",
    "Tip: Bullets travel faster if you run toward them.",
    "Suffocating? Budget your remaining breaths wisely.",
    "Tip: The safest place during a blast is elsewhere.",
    "Stalked by predators? Act confident and indigestible.",
    "Crushed by heavy machinery? Maintain good posture.",
    "Tip: Closing your eyes renders the threat unverified.",
    "Freezing? Increase internal friction by working harder.",
    "Tip: High-voltage cables are spicy, not friendly.",

    // Absurdist Bureaucracy
    "Surrender requests require supervisor sign-off.",
    "Oxygen beyond quota will be billed hourly.",
    "File Form 9-C to authorize reflexive flinching.",
    "Loss of consciousness is an unbilled break.",
    "All spontaneous combustion requires prior approval.",
    "Tears on company hardware violate warranty terms.",
    "Submit incident report before succumbing to wounds.",
    "Unlicensed blinking docks your annual bonus.",
    "Heart failure during meetings requires agenda item.",
    "Post-mortem disputes must be filed in person.",
    
    // Deadpan Anti-Advice
    "Tip: Being disintegrated permanently clears your schedule.",
    "Blinded by flashbangs? Simply recall what the room looked like.",
    "Tip: To avoid landmines, step strictly on the un-mined soil.",
    "Mauled by wildlife? Do not reward their aggression with a reaction.",
    "Tip: Sharp debris enters the body faster than it leaves.",
    "Impaled? Leave the spike inserted to prevent rapid leakage.",
    "Tip: Armor functions best when placed between yourself and damage.",
    "Radiation leak? Absorb less ambient ionization through sheer will.",
    "Tip: Panic uses precious calories best reserved for running.",
    "Trapped in vacuum? Retain your lung air to create personal ballast.",
    "Tip: Acid only burns the parts of you that touch it.",
    "Swallowed whole? Enjoy the complimentary digestive shelter.",
    "Tip: Hostile turrets cannot target what they refuse to acknowledge.",
    "Sinking in quicksand? Try standing on your own shoulders.",
    "Tip: Free-fall turbulence can be mitigated by not looking down.",
    "Targeted by an orbital strike? Move two meters to the left.",
    "Tip: Broken bones are simply improvised internal levers.",
    "Freezing in cryo-sleep? Think intensely warm thoughts.",
    "Tip: Knives are just non-ballistic close-range bullets.",
    "Lost in toxic fog? Inhale shallowly and prioritize optimism.",
    "Tip: The safest reload is not emptying the magazine first.",
    "Suffering blood loss? Focus only on your vital organs.",
    "Tip: Kinetic impacts stop hurting once velocity reaches zero.",
    "Submerged in cooling fluid? Act like an inert mechanical rod.",
    "Tip: Flame damage is easily cured by extinguishing the flame.",
    "Engaged by an elite squad? Politely decline the encounter.",
    "Tip: Concussions are just unprompted neuro-restructures.",
    "Electrocuted? Disconnect your central nervous system promptly.",
    "Tip: Sound travels slowly; outrun the blast alarm.",
    "Punctured lungs? Shift respiration duties to the backup lung.",

    // Absurdist Bureaucracy
    "Decapitation must be stamped by a notary before burial.",
    "File Form 12-K to acknowledge incoming shrapnel.",
    "Unscheduled fainting will be billed as loitering.",
    "Notify Human Resources three weeks before vital failure.",
    "Bleeding onto company paper invalidates the form.",
    "Terminal shrieks must stay under sixty-five decibels.",
    "Damaged ribcages must be returned in their original packaging.",
    "Submit receipt for consumed emergency rations within the hour.",
    "Unauthorized resuscitation violates site trespass policies.",
    "Eye loss does not waive reading safety disclaimers.",
    "Survival of catastrophic drills requires written justification.",
    "Please register secondary amputations under miscellaneous assets.",
    "Hazardous exposure claims require pristine physical proof.",
    "Do not bleed on the requisition forms you are submitting.",
    "Corridor collapse disputes must be delivered via corridor.",
    "Breathing outside shifts counts as unauthorized perks.",
    "Request permit 77 before initiating emergency triage.",
    "Defective clones must self-report to recycling desks.",
    "Asphyxiation during work hours requires an exit pass.",
    "All spontaneous necrosis must be pre-cleared by shift leads.",
    "Verify identity via fingerprint using the severed digit.",
    "Evacuation without an escort incurs an abandonment fine.",
    "Post-mortem pension appeals require in-person signatures.",
    "Submit a two-part voucher to authorize survival instinct.",
    "Involuntary trembling wastes company kinetic energy.",
    "Loss of operational sanity voids your transit voucher.",
    "Organ retrieval costs will be deducted from your final pay.",
    "Surviving a designated fatal sector violates work protocols.",
    "Corpse collection requires two weeks advance reservation.",
    "Failing to report your own death incurs a suspension."
]
   


function startLoadingTitles(timeSubTitleStart) {
    const el = document.getElementById("countodwn_subtitle")
    if (!el) return

    stopLoadingTitles()

    el.innerText = isRunner ? "Time you have to send the next Image!u have to send the next Image!" : "Get ready, the next Image is ccoming!"

    loadingTitleTimeout = setTimeout(() => {
        loadingTitlesInterval = setInterval(() => {
            el.innerText = loadingTitles[Math.floor(Math.random() * loadingTitles.length)]
        }, 5000)
    }, 10000)

    //Whaits 10 sec then shows a new message every 5 sec
    
    // Show the message only once per game, not on every countdown restart.
    if (loadingTitlesShown) return
    loadingTitlesShown = true

    el.innerText = isRunner
        ? "You are the Runner, send the next Image before the time runs out!"
        : "You are the Catcher, you can start once the Runner's lead time is over!"
    
}


function resetLoadingTitles() {
    loadingTitlesShown = false
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
