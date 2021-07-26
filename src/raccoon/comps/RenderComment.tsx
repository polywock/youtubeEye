import produce from "immer"
import { useState } from "react"
import { CommentInfo } from "../types"
import { fetchComments } from "../utils"

export const RenderComment = (props: {info: CommentInfo, apiKey: string}) => {
  const { info } = props

  const [state, setState] = useState(null as {replies: CommentInfo[], nextPageToken?: string})

  return <div className={`RenderComment ${info?.lastLoaded ? "last" : ""}`}>
      <a target="_blank" href={`https://www.youtube.com/channel/${info.authorId}`}>
          <img width="60px" height="60px" src={info.authorImageUrl}/>
      </a>
      <div className="inner">
          <div className="header">
              <a target="_blank" className="author" href={`https://www.youtube.com/channel/${info.authorId}`}>{`+${info.likeCount || 0}  ${info.author}`}</a>
              <a target="_blank" className="date" href={`https://www.youtube.com/watch?v=${info.videoId}&lc=${info.commentId}`}>{info.publishedAt ? (new Date(info.publishedAt).toDateString().split(" ").slice(1).join(" ")) : "--"}</a>
          </div>
          <div className="body" dangerouslySetInnerHTML={{__html: info.text}}></div>
          {state?.replies.length > 0 && (
              <div className="replies">
                  {state.replies.map(v => (
                      <RenderComment key={v.commentId} apiKey={props.apiKey || ""} info={v}/>
                  ))}
              </div>
          )}
        {!!(info.replyCount && (state == null || state.nextPageToken)) && <a onClick={e => {
            fetchComments(info.videoId, info.commentId, props.apiKey, state?.nextPageToken).then(res => {
                setState(produce(state ?? {replies: []}, d => {
                    d.replies = [...d.replies, ...res.items]
                    d.nextPageToken = res.nextPageToken
                }))
            }, err => {
                setState(produce(state ?? {replies: []}, d => {
                    d.nextPageToken = null 
                }))
            })
        }} href="javascript:void(0)" className="loadReplies">{state?.nextPageToken ? `> Show more replies` : (info.replyCount === 1 ? "> View reply" : `> View ${info.replyCount} replies`)}</a>}
      </div>
  </div>
}