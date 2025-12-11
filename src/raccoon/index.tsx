import { createRoot } from "react-dom/client"
import { App } from "./App"
import styles from "./index.css"
import { Modal } from "./comps/Modal"
import { Config } from "./types";
import { getDefaultConfig, persistConfig, getChannelId } from "./utils";

const CHANNEL_URL_REGEX = /channel\/([A-Za-z0-9_-]{24})$/;
const SHORTS_URL_VIDEO_ID = /\/shorts\/([A-Za-z0-9_-]{11})$/

async function main(config: Config) {
    const url = new URL(location.href)
    let videoId = url.searchParams.get("v") || SHORTS_URL_VIDEO_ID.exec(location.pathname)?.[1]
    if (!videoId) {
        return alert("Video ID not found!")
    }
    let channelId = [...document.querySelectorAll(`ytd-video-owner-renderer.ytd-video-secondary-info-renderer ytd-channel-name yt-formatted-string.ytd-channel-name a`) as NodeListOf<HTMLAnchorElement>].map(v => CHANNEL_URL_REGEX.exec(v.href)?.[1]).filter(v => v)[0]
    if (!channelId) {
        try {
            channelId = await getChannelId(videoId, window.API_KEY)
        } catch (err) {
            return alert(err) 
        }
    }

    if (window.raccoonComments) {
        if (!channelId && !videoId) return alert("Channel ID or the video ID not found!")
    } else {
        if (!channelId) return alert("Channel ID not found!")
    }


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

    const root = createRoot(appRoot)
    root.render(<Modal onExit={() => {
        persistConfig.flush()
        root.unmount()
        host.remove()
        delete window.raccoonBlockKeys 
    }}>
        <App forComments={window.raccoonComments} channelId={channelId} videoId={videoId} config={config} dark={document.documentElement.hasAttribute("dark")}/>
    </Modal>)
}

chrome.storage.local.get(["config"], ({config}) => {
    main((config as Config) || getDefaultConfig())
})

