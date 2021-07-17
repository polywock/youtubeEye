import debounce from "lodash.debounce";
import { Config, VideoInfo, YearMonth } from "./types";

export function getDefaultConfig(): Config {
    const now = new Date() 
    return {
        version: 1,
        rangeType: "PAST_MONTH",
        from: `${now.getFullYear() - 1}-01-01`,
        to: `${now.getFullYear()}-01-01`,
        duration: "ANY"
    }
}


export const persistConfig = debounce((config: Config) => {
    chrome.storage.local.set({config})
}, 3000, {trailing: true, leading: true})


export function isInteger(text: string) {
    return /^\d+$/.test(text?.trim())
}

export function apiKeyLooksValid(key: string) {
    return key?.length === 39
}

function pad(text: string | number, length = 2) {
    return text.toString().padStart(length, "0")
}

export function generateSearchUrl(channelId: string, config: Config, pageToken?: string) {
    if (!config.apiKey) {
        throw Error("API key required")
    }
    if (!apiKeyLooksValid(config.apiKey)) {
        throw Error("invalid API key")
    }
    const now = new Date()
    let publishedAfter = new Date("2010-01-01").toISOString()
    let publishedBefore = now.toISOString()

    if (config.rangeType === "PAST_WEEK") {
        publishedAfter = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 7)).toISOString()
    } else if (config.rangeType === "PAST_14") {
        publishedAfter = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 14)).toISOString()
    } else if (config.rangeType === "PAST_MONTH") {
        publishedAfter = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 31)).toISOString()
    } else if (config.rangeType === "PAST_60") {
        publishedAfter = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 60)).toISOString()
    } else if (config.rangeType === "PAST_90") {
        publishedAfter = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 90)).toISOString()
    } else if (config.rangeType === "PAST_180") {
        publishedAfter = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 180)).toISOString()
    } else if (config.rangeType === "PAST_YEAR") {
        publishedAfter = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 365)).toISOString()
    } else if (config.rangeType === "CUSTOM") {
        publishedBefore = new Date(config.to).toISOString()
        publishedAfter = new Date(config.from).toISOString()
    } else if ((config.rangeType as YearMonth)?.year) {
        const year = config.rangeType.year
        const month = parseInt(config.rangeType.month ?? "0")
        publishedAfter = new Date(`${year}-${pad(month >= 1 ? month : "01")}-01Z`).toISOString()
        publishedBefore = new Date(`${year}-${pad(month >= 1 ? month : "12")}-31T23:59:59.999Z`).toISOString()
    } else {
        throw Error("Could not parse dates.")
    }

    const url = new URL(`https://www.googleapis.com/youtube/v3/search`)
    const search = new URLSearchParams({
        key: config.apiKey,
        channelId,
        part: "id",
        maxResults: "50",
        order: "viewCount",
        type: "video",
        publishedAfter,
        publishedBefore
    })
    config.query && search.set("q", config.query)
    if (config.duration && config.duration != "ANY") {
        search.set("videoDuration", config.duration.toLowerCase())
    }
    if (pageToken) {
        search.set("pageToken", pageToken)
    }
    url.search = search.toString()
    return url.toString()
}

export function generateVideosUrl(apiKey: string, ids: string[]) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/videos`)
    const search = new URLSearchParams({
        key: apiKey,
        part: "id,snippet,statistics,contentDetails",
        maxResults: "50",
        id: ids.join(",")
    })
    url.search = search.toString()
    return url.toString()
}

export type FetchVideosResult = {videos: VideoInfo[], nextPageToken?: string}

export async function fetchVideosAware(channelId: string, config: Config, pageToken?: string): Promise<FetchVideosResult> {
    if (isFirefox()) return requestFetchVideos(channelId, config, pageToken)
    return fetchVideos(channelId, config, pageToken)
}


export async function requestFetchVideos(channelId: string, config: Config, pageToken?: string): Promise<FetchVideosResult> {
    return new Promise((res, rej) => {
        chrome.runtime.sendMessage({type: "FETCH_VIDEOS", channelId, config, pageToken}, resp => {
            if (resp?.error) {
                rej(resp.error)
                return 
            }
            res(resp)
        })
    })
}

export async function fetchVideos(channelId: string, config: Config, pageToken?: string): Promise<FetchVideosResult> {
    let url = generateSearchUrl(channelId, config, pageToken)
    const {items, nextPageToken} = await fetchYoutubeItems(url)
    if (items.length === 0) return {videos: []}
    url = generateVideosUrl(config.apiKey, items.map(item => item?.id?.videoId).filter(v => v))
    const {items: infos} = await fetchYoutubeItems(url)
    const videos = infos.map(item => {
        try {
            const likeCount = parseInt(item.statistics.likeCount)
            const dislikeCount = parseInt(item.statistics.dislikeCount)
            const totalCount = likeCount + dislikeCount
            const likeRatio = totalCount ? likeCount / totalCount : 0.5
            return {
                title: item.snippet.title,
                videoId: item.id,
                publishedAt: item.snippet.publishedAt,
                viewCount: parseInt(item.statistics.viewCount),
                likeRatio,
                duration: parseISO8601(item.contentDetails?.duration)
            } as VideoInfo
        } catch (err) {
            return null
        }
    }).filter(v => v)
    videos.sort((a, b) => b.viewCount - a.viewCount)
    return {videos, nextPageToken}
}


export async function fetchYoutubeItems(url: string): Promise<{items: any[], nextPageToken?: string}> {
    const now = new Date()
    let resp: Response
    try {
        resp = await fetch(url)
    } catch (err) {
        console.log(err)
        throw "EROR"
    }
    let json; 
    let jsonError; 
    try {
        json = await resp.json()
        jsonError = json.error?.errors?.map((error: any) => `${error.reason || ""} ${error.message || ""}`).join(", ")
    } catch (err) {}

    if (jsonError?.includes("quotaExceeded")) {
        const resetTime = new Date(now.getTime()) 
        resetTime.setUTCHours(resetTime.getUTCHours() < 7 ? 7 : 7 + 24, 0, 0, 0)

        const deltaMinutes = (resetTime.getTime() - now.getTime()) / 1000 / 60
        const hours = Math.floor(deltaMinutes / 60)
        const minutes = Math.floor(deltaMinutes % 60)
        throw `Youtube API quota exceeded! Quota will reset in ${hours} hour${hours === 1 ? "" : "s"} and ${minutes} minute${minutes === 1 ? "" : "s"}. To avoid waiting, you can setup a new Google Cloud project, enable the Youtube Data API, and create a new API key credential.`
    }

    if (resp.status !== 200 || jsonError || !json) {
        throw `${resp.status} ${resp.statusText ? `(${resp.statusText})` : ""} ${jsonError || ""}`
    }
    const items = json.items || []
    return {items, nextPageToken: json.nextPageToken} 
}

function lerp(lb: number, rb: number, scalar: number) {
    return lb + (rb - lb) * scalar
}


export function getRatingColor(rating: number) {
    rating = Math.max(0, rating - 0.6) * (1 / 0.4)
    const good = [150, 255, 150]
    const bad = [255, 180, 180]
    return `rgb(${lerp(bad[0], good[0], rating).toFixed(0)}, ${lerp(bad[1], good[1], rating).toFixed(0)}, ${lerp(bad[2], good[2], rating).toFixed(0)})`
}

    function selectiveToFixed(x: number) {
        if (x >= 10) return x.toFixed(0) 
        return x.toFixed(1) 
    }

    export function formatViews(views: number) {
        if (views >= 1E9) {
            return `${selectiveToFixed(views / 1E9)}B views`
        } else if (views >= 1E6) {
            return `${selectiveToFixed(views / 1E6)}M views`
        } else if (views >= 1E3) {
            return `${selectiveToFixed(views / 1E3)}K views`
        } else {
            return `${Math.floor(views)} views`
        }
    }

let isFirefoxResult: boolean
function isFirefox() {
  isFirefoxResult = isFirefoxResult ?? navigator.userAgent.includes("Firefox/")
  return isFirefoxResult
}

const ISO8601_REGEX = /PT(\d+(?=H))?H?(\d+(?=M))?M?(\d+(?=S))?S??/
function parseISO8601(text: string) {
    const match = ISO8601_REGEX.exec(text || "")
    if (!match) return null
    if (match[1]) {
        return `${match[1]}:${pad(match[2] || "00")}:${pad(match[3] || "00")}`
    } else if (match[2]) {
        return `${match[2] || "0"}:${pad(match[3] || "00")}`
    } else if (match[3]) {
        return `0:${pad(match[3])}`
    }
}
