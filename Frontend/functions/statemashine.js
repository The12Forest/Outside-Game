//This file provides an api to hide or unhide objects on the DOM
let image_active
let state
let all_elements = [
    "camera",
    "countdown_div",
    "linkToMaps",
    "image",
    "Capture_image",
    "startCameraBtn",
    "showImageBtn",
    "hideImageBtn",
    "linkToMaps_a"
]

function getDOMObj(DOM_ID) {
    return document.getElementById(DOM_ID)
}

function setImage(img_state) {
    image_active = img_state
    reDraw()
}

/**
 * @param {"camera_active" | "countdown" | "positon_shown"} i_state
 */
async function reDraw(i_state) {
    let toEnable = []
    if (i_state) state = i_state

    if (!isRunner) {
        if (image_active) {
            toEnable.push("image")
            toEnable.push("hideImageBtn")
        } else {
            toEnable.push("showImageBtn")
        }
    }

    switch(state) {
        case "camera_active":
            stopLoadingTitles()
            toEnable.push("camera")
            toEnable.push("Capture_image")
            break;
        case "countdown":
            startLoadingTitles()
            if (isRunner) toEnable.push("startCameraBtn")
            toEnable.push("countdown_div")
            break;

        case "positon_shown":
            stopLoadingTitles()
            toEnable.push("linkToMaps")
            if (!isRunner) {
                toEnable.push("linkToMaps_a")
            } else {
                toEnable.push("startCameraBtn")
            }
            break;

        default:
            console.error("There was an internal error, wrong state set!")
    }


    let toDisable = all_elements.filter(id => !toEnable.includes(id))

    toEnable.forEach(id => {
        let el = getDOMObj(id)
        if (el) el.classList.remove("invisible")
    })
    toDisable.forEach(id => {
        let el = getDOMObj(id)
        if (el) el.classList.add("invisible")
    })
}
