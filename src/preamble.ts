let popularButton: HTMLDivElement
let commentButton: HTMLDivElement
let addedButtonStyle = false 

function main() {
    window.addEventListener("keydown", handleKey, {capture: true})
    window.addEventListener("keyup", handleKey, {capture: true})
    window.addEventListener("keypress", handleKey, {capture: true})

    window.addEventListener("yt-navigate-finish", () => setTimeout(handleNavigate, 500), true)
    window.addEventListener("yt-action", (e: CustomEvent) => {
        if (["yt-service-request", "yt-reload-continuation-items-command", "yt-store-grafted-ve-action"].includes(e.detail?.actionName)) {
            setTimeout(handleNavigate, 500)
        }
    }, true)

    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => handleNavigate(), {capture: true, once: true}) : handleNavigate()
}

function handleKey(e: KeyboardEvent) {
    if (window.raccoonBlockKeys) {
        e.stopImmediatePropagation()
    }
}

function createButton(forComments?: boolean) {
    const button = document.createElement("div")
    button.classList.add("raccoon")
    button.style.backgroundColor = "var(--yt-spec-badge-chip-background)"
    button.style.color = "var(--yt-spec-text-secondary)"
    button.style.fontSize = forComments ? "16px" : "inherit"
    button.style.padding = forComments ? "5px" : "0 5px"
    button.style.userSelect = "none"
    button.style.fontWeight = "bolder"
    button.style.borderRadius = "5px"

    if (!addedButtonStyle) {
        addedButtonStyle = true 
        const style = document.createElement("style")
        style.textContent = `div.raccoon:hover {cursor: pointer; background-color: blue !important; color: white !important}`
        document.head.appendChild(style)
    }

    return button 
}

function ensureButtons() {
    if (popularButton) return 

    // popular 
    popularButton = createButton()
    popularButton.innerText = "Find popular"
    popularButton.style.marginLeft = "10px"

    popularButton.addEventListener("click", e => {
        window.raccoonComments = false
        chrome.runtime.sendMessage({type: "TRIGGER"})
    })

    // comments 
    commentButton = createButton(true)
    commentButton.innerText = "Search"
    commentButton.style.marginLeft = "15px"
    
    commentButton.addEventListener("click", e => {
        window.raccoonComments = true 
        chrome.runtime.sendMessage({type: "TRIGGER"})
    })
}

function handleNavigate() {
    ensureButtons()
    tryIntegrate(popularButton, "ytd-video-owner-renderer.ytd-video-secondary-info-renderer ytd-channel-name", 5)
    tryIntegrate(commentButton, "ytd-comments-header-renderer > div#title.ytd-comments-header-renderer", 5)
}

function tryIntegrate(element: HTMLDivElement, selector: string, repeat: number) {
    const base = document.querySelector(selector)
    if (base) {
        base.appendChild(element)
    } else {
        element?.remove()
        if (repeat >= 1) {
            setTimeout(() => {
                tryIntegrate(element, selector, repeat - 1)
            }, 500)
        }
    }
}

main()