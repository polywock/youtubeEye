
declare global {
    interface Window {
        raccoonBlockKeys: boolean,
        raccoonComments: boolean
    }    
}

export type YearMonth = {year: string, month?: string}
export type RangeType = "PAST_DAY" | "PAST_WEEK" | "PAST_MONTH" | "PAST_14" | "PAST_60" | "PAST_90" | "PAST_180" | "PAST_YEAR" | "PAST_YEAR2" | "CUSTOM" | YearMonth

export type VideoDuration = "ANY" | "SHORT" | "MEDIUM" | "LONG"

export type Config = {
    version: number,
    apiKey?: string,
    rangeType: RangeType,
    duration: VideoDuration,
    from: string,
    to: string,
    query?: string,
    sortBy?: "VIEW_COUNT" | "RELEVANCE" | "RATING",
    searchTerms?: string,
    forAllChannel?: boolean

}

export type VideoInfo = {
    videoId: string,
    title: string,
    publishedAt: string,
    viewCount: number,
    likeRatio: number,
    duration: string 
}

export type CommentInfo = {
    commentId: string,
    videoId?: string,
    replyCount?: number,
    text: string,
    author: string,
    authorId?: string,
    authorImageUrl?: string,
    publishedAt: string,
    updatedAt: string,
    likeCount: number,
    replies: CommentInfo[],
    lastLoaded?: boolean
}