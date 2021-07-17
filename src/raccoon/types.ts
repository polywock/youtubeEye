
declare global {
    interface Window {
        raccoonBlockKeys: boolean
    }    
}

export type YearMonth = {year: string, month?: string}
export type RangeType = "PAST_WEEK" | "PAST_MONTH" | "PAST_14" | "PAST_60" | "PAST_90" | "PAST_180" | "PAST_YEAR" | "CUSTOM" | YearMonth

export type VideoDuration = "ANY" | "SHORT" | "MEDIUM" | "LONG"

export type Config = {
    version: number,
    apiKey?: string,
    rangeType: RangeType,
    agreed?: boolean,
    duration: VideoDuration,
    from: string,
    to: string,
    query?: string,
    sortBy?: "VIEW_COUNT" | "RELEVANCE" | "RATING"
}

export type VideoInfo = {
    videoId: string,
    title: string,
    publishedAt: string,
    viewCount: number,
    likeRatio: number,
    duration: string 
}