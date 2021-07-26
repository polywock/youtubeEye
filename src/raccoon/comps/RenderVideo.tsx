import { VideoInfo } from "../types"

export const RenderVideo = (props: {info: VideoInfo}) => {
  const { info } = props
  return <a target="_blank" href={`https://www.youtube.com/watch?v=${encodeURI(info.videoId)}`} className="RenderVideo">
      <div className="thumb-wrapper">
          <img draggable={false} src={`https://i.ytimg.com/vi/${info.videoId}/hqdefault.jpg`}/>
          {info.likeRatio != null && (
              <div style={{color: getRatingColor(info.likeRatio)}} className="rating">{`${Math.round(info.likeRatio * 100)}%`}</div>
          )}
          {info.duration != null && (
              <div className="duration">{info.duration}</div>
          )}
      </div>
      <div className="meta">
          <div title={info.title} className="title">{info.title}</div>
          <div className="detail">{`${formatViews(info.viewCount)} • ${info.publishedAt ? (new Date(info.publishedAt).toDateString().split(" ").slice(1).join(" ")) : "--"}`}</div>
      </div>
  </a>
}

function selectiveToFixed(x: number) {
  if (x >= 10) return x.toFixed(0) 
  return x.toFixed(1) 
}

function formatViews(views: number) {
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

function lerp(lb: number, rb: number, scalar: number) {
  return lb + (rb - lb) * scalar
}


function getRatingColor(rating: number) {
  rating = Math.max(0, rating - 0.6) * (1 / 0.4)
  const good = [150, 255, 150]
  const bad = [255, 180, 180]
  return `rgb(${lerp(bad[0], good[0], rating).toFixed(0)}, ${lerp(bad[1], good[1], rating).toFixed(0)}, ${lerp(bad[2], good[2], rating).toFixed(0)})`
}