import ReactDOM from "react-dom"
import { App } from "./App"
import styles from "./index.scss"
import { Modal } from "./Modal"
import { Config } from "./types";
import { getDefaultConfig, persistConfig } from "./utils";

const CHANNEL_URL_REGEX = /channel\/([A-Za-z0-9_-]{24})$/;

function main(config: Config) {
    const id = [...document.querySelectorAll(`ytd-video-owner-renderer.ytd-video-secondary-info-renderer ytd-channel-name yt-formatted-string.ytd-channel-name a`) as NodeListOf<HTMLAnchorElement>].map(v => CHANNEL_URL_REGEX.exec(v.href)?.[1]).filter(v => v)[0]
    if (!id) return alert("Channel ID not found!")

    // block keys 
    window.raccoonBlockKeys = true 

    window.addEventListener("unload", () => {
        persistConfig.flush()
    })

    // prepare app. 
    const host = document.createElement("div")
    host.id = "raccoon"
    const shadow = host.attachShadow({mode: "open"})
    const appRoot = document.createElement("div")
    const appStyles = document.createElement("style")
    appStyles.textContent = `${styles}`
    shadow.appendChild(appRoot)
    shadow.appendChild(appStyles)
    document.body.appendChild(host)

    ReactDOM.render(<Modal onExit={() => {
        persistConfig.flush()
        ReactDOM.unmountComponentAtNode(appRoot)
        host.remove()
        delete window.raccoonBlockKeys 
    }}>
        <App channelId={id} config={config} dark={document.documentElement.hasAttribute("dark")}/>
    </Modal>, appRoot)
}

chrome.storage.local.get(["config"], ({config}) => {
    main(config || getDefaultConfig())
})

