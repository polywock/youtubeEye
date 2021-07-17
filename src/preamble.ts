
let button: HTMLDivElement

function main() {
    window.addEventListener("keydown", handleKey, {capture: true})
    window.addEventListener("keyup", handleKey, {capture: true})
    window.addEventListener("keypress", handleKey, {capture: true})

    window.addEventListener("yt-navigate-finish", () => setTimeout(handleNavigate, 300), true)

    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => handleNavigate(), {capture: true, once: true}) : handleNavigate()
}

function handleKey(e: KeyboardEvent) {
    if (window.raccoonBlockKeys) {
        e.stopImmediatePropagation()
    }
}

function ensureButton() {
    if (button) return 
    button = document.createElement("div")
    button.id = "raccoon"
    button.innerText = "Find popular"

    button.style.backgroundColor = "var(--yt-spec-badge-chip-background)"
    button.style.color = "var(--yt-spec-text-secondary)"
    button.style.fontSize = "inherit"
    button.style.fontWeight = "bolder"
    button.style.marginLeft = "10px"
    button.style.padding = "0 5px"
    button.style.userSelect = "none"
    
    const style = document.createElement("style")
    style.textContent = `div#raccoon:hover {cursor: pointer; background-color: blue !important; color: white !important}`
    document.head.appendChild(style)

    button.addEventListener("click", e => {
        chrome.runtime.sendMessage({type: "TRIGGER"})
    })
}

function handleNavigate(repeat = 5) {
    console.log("REPEAT")
    const base = document.querySelector("ytd-video-owner-renderer.ytd-video-secondary-info-renderer ytd-channel-name")
    if (base) {
        ensureButton()
        base.appendChild(button)
    } else {
        button?.remove()
        if (repeat >= 1) {
            setTimeout(() => {
                handleNavigate(repeat - 1)
            }, 500)
        }
    }
}

main()