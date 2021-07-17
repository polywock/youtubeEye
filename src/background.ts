import { fetchVideos } from "./raccoon/utils"

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg.type === "TRIGGER") {
        if (chrome.scripting?.executeScript) {
            chrome.scripting?.executeScript({
                target: {tabId: sender.tab.id},
                files: ["./raccoon.js"]
            })
        } else {
            chrome.tabs.executeScript(sender.tab.id, {
                file: "./raccoon.js"
            })
        }
        reply(true)
    } else if (msg.type === "FETCH_VIDEOS") {
        fetchVideos(msg.channelId, msg.config, msg.pageToken).then(result => {
            reply(result)
        }, error => {
            reply({error})
        })
        return true 
    }
})