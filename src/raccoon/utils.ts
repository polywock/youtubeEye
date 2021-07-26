import debounce from "lodash.debounce";
import { CommentInfo, Config, VideoInfo, YearMonth } from "./types";

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


export function apiKeyLooksValid(key: string) {
    return key?.length === 39
}

function assertApiKey(apiKey: string) {
    if (!apiKey) {
        throw Error("API key required")
    }
    if (!apiKeyLooksValid(apiKey)) {
        throw Error("invalid API key")
    }
}

function pad(text: string | number, length = 2) {
    return text.toString().padStart(length, "0")
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

const ALLOWED_TAGS = ["A", "BR", "HR", "B", "I", "DEL"]
let sanitizeDummy: HTMLDivElement

function getRedirectLink(dirty: string) {
    const r = new URL("https://www.youtube.com/redirect")
    r.searchParams.set("q", dirty)
    return r.toString()
}

function sanitizeAttributes(elem: Element) {
    const hrefAttribute = elem.attributes.getNamedItem("href");
    [...elem.attributes].forEach(v => elem.attributes.removeNamedItem(v.name))
    if (elem.tagName === "A" && hrefAttribute) {
        if (hrefAttribute.value.toUpperCase().includes("JAVASCRIPT")) return 
        if (!hrefAttribute.value.toUpperCase().trimStart().startsWith("HTTP")) return 
        hrefAttribute.value = getRedirectLink(hrefAttribute.value)
        elem.attributes.setNamedItem(hrefAttribute)
    }
}

// Youtube's Data v3 API likely returns safe HTML data, but just in case do some light sanitization. 
function sanitize(dirty: string) {
    sanitizeDummy = sanitizeDummy ?? document.createElement("div")
    sanitizeDummy.innerHTML = ""
    try {
        sanitizeDummy.innerHTML = dirty || ""
        sanitizeDummy.querySelectorAll("*").forEach(v => {
            if (!ALLOWED_TAGS.includes(v.tagName.toUpperCase())) {
                v.remove() 
                return 
            }
            sanitizeAttributes(v)
        })
        return sanitizeDummy.innerHTML
    } catch (err) {}

    return "" 
}

export function generateSearchUrl(channelId: string, config: Config, pageToken?: string) {
    assertApiKey(config.apiKey)
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

export function generateThreadsURL(channelOrVideoId: string, config: Config, pageToken?: string) {
    assertApiKey(config.apiKey)
    
    const url = new URL(`https://www.googleapis.com/youtube/v3/commentThreads`)
    const search = new URLSearchParams({
        key: config.apiKey,
        maxResults: "100",
        order: "time",
        textFormat: "html",
        part: "snippet"
    })
    search.set(config.forAllChannel ? "allThreadsRelatedToChannelId" : "videoId", channelOrVideoId)

    if (config.searchTerms) {
        if (config.matchMode === "EXACT") {
            search.set("searchTerms", (config.searchTerms ?? "").replace(/["']/g, ""))
        } else if (config.matchMode === "ANY")  {
            search.set("searchTerms", (config.searchTerms ?? "").replace(/\s+/, ",").split(",").map(v => v.trim()).filter(v => v).join("|"))
        } else {
            search.set("searchTerms", (config.searchTerms ?? "").replace(/\s+/, ",").split(",").map(v => v.trim()).filter(v => v).join(","))
        }
    }
    
    if (pageToken) {
        search.set("pageToken", pageToken)
    }
    url.search = search.toString()
    return url.toString()
}

export function generateCommentsURL(parentId: string, apiKey: string, pageToken?: string) {
    assertApiKey(apiKey)
    
    const url = new URL(`https://www.googleapis.com/youtube/v3/comments`)
    const search = new URLSearchParams({
        key: apiKey,
        maxResults: "10",
        order: "time",
        textFormat: "html",
        parentId,
        part: "snippet"
    })
    
    if (pageToken) {
        search.set("pageToken", pageToken)
    }
    url.search = search.toString()
    return url.toString()
}


export type FetchVideosResult = {type: "VIDEOS", items: VideoInfo[], nextPageToken?: string}


export async function fetchVideos(channelId: string, config: Config, pageToken?: string): Promise<FetchVideosResult> {
    let url = generateSearchUrl(channelId, config, pageToken)
    const {items, nextPageToken} = await fetchItemsAware(url)
    if (items.length === 0) return {type: "VIDEOS", items: []}
    url = generateVideosUrl(config.apiKey, items.map(item => item?.id?.videoId).filter(v => v))
    const {items: infos} = await fetchItemsAware(url)
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
    return {type: "VIDEOS", items: videos, nextPageToken}
}


export type fetchCommentResults = {type: "COMMENTS", items: CommentInfo[], nextPageToken?: string}

export async function fetchThreads(videoOrChannelId: string, config: Config, pageToken?: string): Promise<fetchCommentResults> {
    let url = generateThreadsURL(videoOrChannelId, config, pageToken)
    const {items, nextPageToken} = await fetchItemsAware(url)
    if (items.length === 0) return {type: "COMMENTS", items: []}
    const comments = items.map(item => {
        try {
            const snippet =  item.snippet.topLevelComment.snippet
            return {
                commentId: item.snippet.topLevelComment.id,
                videoId: item.snippet.videoId,
                replyCount: item.snippet.totalReplyCount,
                text: snippet.textDisplay?.length > 400 ? sanitize(snippet.textDisplay?.trim() ?? "").substr(0, 400).concat("...") : sanitize(snippet.textDisplay?.trim() ?? ""),
                author: snippet.authorDisplayName,
                authorId:  snippet.authorChannelId?.value,
                authorImageUrl: snippet.authorProfileImageUrl,
                publishedAt: snippet.publishedAt,
                updatedAt: snippet.updatedAt,
                likeCount: snippet.likeCount,
                replies: []
            } as CommentInfo
        } catch (err) {
            return null 
        }
    }).filter(v => v)

    comments.sort((a, b) => b.likeCount - a.likeCount)

    return {type: "COMMENTS", items: comments, nextPageToken}
}

export async function fetchComments(videoId: string, parentId: string, apiKey: string, pageToken?: string): Promise<fetchCommentResults> {
    let url = generateCommentsURL(parentId, apiKey, pageToken)
    const {items, nextPageToken} = await fetchItemsAware(url)
    if (items.length === 0) return {type: "COMMENTS", items: []}
    const comments = items.map(item => {
        try {
            const snippet =  item.snippet
            return {
                commentId: item.id,
                videoId,
                text: snippet.textDisplay?.length > 400 ? sanitize(snippet.textDisplay?.trim() ?? "").substr(0, 400).concat("...") : sanitize(snippet.textDisplay?.trim() ?? ""),
                author: snippet.authorDisplayName,
                authorId:  snippet.authorChannelId?.value,
                authorImageUrl: snippet.authorProfileImageUrl,
                publishedAt: snippet.publishedAt,
                updatedAt: snippet.updatedAt,
                likeCount: snippet.likeCount,
                replies: []
            } as CommentInfo
        } catch (err) {
            return null 
        }
    }).filter(v => v)

    return {type: "COMMENTS", items: comments, nextPageToken}
}

//#region FetchItems 
type FetchItemsResponse = {items: any[], nextPageToken?: string}

export async function fetchItemsAware(url: string): Promise<FetchItemsResponse> {
    if (isFirefox()) return requestFetchItems(url)
    return fetchItems(url)
}


export async function requestFetchItems(url: string): Promise<FetchItemsResponse> {
    return new Promise((res, rej) => {
        chrome.runtime.sendMessage({type: "FETCH_ITEMS", url}, resp => {
            if (resp?.error) {
                rej(resp.error)
                return 
            }
            res(resp)
        })
    })
}

export async function fetchItems(url: string): Promise<FetchItemsResponse> {
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

