let popularButton: HTMLDivElement
let commentButton: HTMLDivElement
let shortsCommentButton: HTMLDivElement
let addedButtonStyle = false 


function main() {
    window.addEventListener("EYE-I", e => {
        const { key } = (e as CustomEvent).detail
        window.API_KEY = key 
        e.stopImmediatePropagation()
    }, true)

    const s = document.createElement("script")
    s.src = chrome.runtime.getURL("main.js")
    document.documentElement.appendChild(s)


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

    addFilters()
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
        window.dispatchEvent(new CustomEvent("EYE-M"))
        if (window.API_KEY) {
            window.raccoonComments = false
            chrome.runtime.sendMessage({type: "TRIGGER"})
        } else {
            alert("Channel ID not found!")
        }
    })

    // comments 
    commentButton = createButton(true)
    commentButton.innerText = "Search"
    commentButton.style.marginLeft = "15px"
    
    commentButton.addEventListener("click", e => {
        window.raccoonComments = true 
        chrome.runtime.sendMessage({type: "TRIGGER"})
    })

    // shorts comments 
    shortsCommentButton = createButton(true)
    shortsCommentButton.innerText = "Search"
    shortsCommentButton.style.marginLeft = "15px"
    
    shortsCommentButton.addEventListener("click", e => {
        window.raccoonComments = true 
        chrome.runtime.sendMessage({type: "TRIGGER"})
    })
}

function handleNavigate() {
    ensureButtons()
    tryIntegrate(popularButton, "ytd-video-owner-renderer ytd-channel-name", 5)
    tryIntegrate(commentButton, "ytd-comments-header-renderer > div#title.ytd-comments-header-renderer", 5)
    tryIntegrate(shortsCommentButton, "#shorts-panel-container #title-container #title", 5)
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


function addFilters() {
   window.addEventListener('click', async e => {
      if (!(e.target instanceof HTMLElement && e.target.closest('#filter-button'))) return 
      await timeout(5)
      let url = new URL(location.href)
      const query = url.searchParams.get('search_query')
      if (!query) return
      const popup = document.querySelector('body > ytd-app > ytd-popup-container > tp-yt-paper-dialog > ytd-search-filter-options-dialog-renderer.ytd-popup-container')
      if (!popup) return
      let uploadGroup = popup.querySelector('#options > ytd-search-filter-group-renderer')
      if (!uploadGroup) return
      if (uploadGroup.querySelector('.bloomm')) return
      
      uploadGroup.appendChild(createButton('→ Quarter-year', 90))
      uploadGroup.appendChild(createButton('→ Half-year', 180))
      uploadGroup.appendChild(createButton('→ X Days', null, 'D'))
      uploadGroup.appendChild(createButton('→ X Weeks', null, 'W'))
      uploadGroup.appendChild(createButton('→ X Months', null, 'M'))
      uploadGroup.appendChild(createButton('→ X Years', null, 'Y'))
   })

   const MODE_TO_TEXT = {
      D: 'days',
      W: 'weeks',
      M: 'months',
      Y: 'years'
   }

   const MODE_TO_FACTOR = {
      D: 1,
      W: 7,
      M: 30,
      Y: 365
   }

   function createButton(label: string, days: number, mode?: keyof typeof MODE_TO_TEXT) {
      let b = document.createElement('button')
      b.textContent = label
      b.classList.add('bloomm')
      b.style.backgroundColor = 'inherit'
      b.style.color = '#aaaaaa'
      b.style.padding = '0px'
      b.style.border = 'none'
      b.style.marginTop = '18px'
      b.style.width = 'fit-content'
      b.style.cursor = "pointer"

      b.addEventListener('click', e => {
         let url = new URL(location.href)
         let query = url.searchParams.get('search_query')
         if (!query) return
         let isNegative = false 

         if (!days) {
            let amount = parseFloat(prompt(`Find videos from the past X ${MODE_TO_TEXT[mode]}? Use a negative number to exclude videos from the past X ${MODE_TO_TEXT[mode]}.`))
            if (!(amount > -99999)) return
            if (amount === 0) return 
            if (amount < 0) {
               isNegative = true 
               amount = Math.abs(amount)
            }
            days = amount * MODE_TO_FACTOR[mode]
         }

         query = query.replaceAll(/\s?(before|after):[\d\-]+/g, '')
         url.searchParams.delete('search_query')
         const filter = new Date(Date.now() - (1000 * 60 * 60 * 24 * days)).toISOString().split('T')[0]
         url.searchParams.set('search_query', `${query} ${isNegative ? 'before' : 'after'}:${filter}`)
         location.href = url.toString()
      })
      return b
   }

   
}

function timeout(ms: number) {
    return new Promise((res, rej) => {
        setTimeout(() => res(true), ms)
    })
}