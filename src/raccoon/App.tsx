import produce from "immer"
import { useEffect, useRef, useState } from "react"
import { Config, RangeType, VideoDuration, VideoInfo, YearMonth } from "./types"
import { fetchVideosAware, FetchVideosResult, formatViews, getDefaultConfig, getRatingColor, isInteger, persistConfig } from "./utils"
const currentYear = new Date().getFullYear()
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export const App = (props: {config: Config, dark: boolean, channelId: string}) => {
    const [config, setConfig] = useState(props.config)
    const [blur, setBlur] = useState(!!props.config?.apiKey)
    const [fromError, setFromError] = useState(false)
    const [toError, setToError] = useState(false)
    const [result, setResult] = useState(null as FetchVideosResult)

    const apiRef = useRef<HTMLInputElement>()
    const queryRef = useRef<HTMLInputElement>()
    const fromRef = useRef<HTMLInputElement>()
    const toRef = useRef<HTMLInputElement>()

    const rangeYear = (config.rangeType as YearMonth)?.year
    
    const updateConfig = (config: Config, reset = false) => {
        setConfig(config) 
        persistConfig(config)
        if (reset) {
            if (apiRef.current) apiRef.current.value = config.apiKey ?? ""
            if (queryRef.current) queryRef.current.value = config.query ?? ""
            setResult(null)
        }
    }

    const handleFind = () => {
        fetchVideosAware(props.channelId, config).then(res => {
            setResult(res)
        }, err => {
            alert(err)
            setResult(null)
        })
    }

    const handleLoadMore = () => {
        fetchVideosAware(props.channelId, config, result.nextPageToken).then(res => {
            setResult(produce(result, d => {
                d.videos = [...d.videos, ...res.videos]
                d.nextPageToken = res.nextPageToken
            }))
        }, err => {
            alert(err)
        })
    }

    useEffect(() => {
        if (!config.apiKey) {
            apiRef.current?.focus()
        }
    }, [])

    return <div id="App" className={props.dark ? "dark" : ""}>
        <a target="_blank" href="https://github.com/polywock/youtubeEye" className="header">
            Youtube Eye
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="0.8em" width="0.8em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
        </a>
        <a target="_blank" href="https://www.youtube.com/watch?v=FpXkDHNyMrE">
            <span>How to get a Youtube Data API key?</span>
            <svg style={{marginLeft: "5px"}} stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg>
        </a>
        <div className="fields">
            <div className="field">
                <div>API key</div>
                <input ref={apiRef} required onFocus={e => setBlur(false)} defaultValue={config.apiKey ?? ""} type={blur ? "password" : "text"} placeholder="Youtube Data API key required" onChange={e => {
                    updateConfig(produce(config, d => {
                        d.apiKey = e.target.value
                    }))
                }}/>
            </div>
            <div className={`field ${rangeYear ? "year" : ""}`}>
                <div>Range</div>
                <select value={rangeYear ?? (config.rangeType as string)} onChange={e => {
                    updateConfig(produce(config, d => {
                        if (isInteger(e.target.value)) {
                            d.rangeType = {year: e.target.value}
                        } else {
                            d.rangeType = e.target.value as RangeType
                        }
                    }))
                }}>
                    <option value={"CUSTOM"}>Custom range</option>
                    <option value={"PAST_WEEK"}>Past week</option>
                    <option value={"PAST_14"}>Past 2 weeks</option>
                    <option value={"PAST_MONTH"}>Past month</option>
                    <option value={"PAST_60"}>Past 2 months</option>
                    <option value={"PAST_90"}>Past 3 months</option>
                    <option value={"PAST_180"}>Past 6 months</option>
                    <option value={"PAST_YEAR"}>Past year</option>
                    <optgroup label="Year">
                        {Array(11).fill(0).map((v, i) => (currentYear - i).toFixed(0).toString()).map(v => (
                            <option value={v}>{v}</option>
                        ))}
                    </optgroup>
                </select>
                {rangeYear && (
                    <select value={(config.rangeType as YearMonth)?.month ?? 0} onChange={e => {
                        updateConfig(produce(config, d => {
                            d.rangeType = {year: rangeYear, month: e.target.value}
                        }))
                    }}>
                        <option value={"0"}>Any month</option>
                        {MONTHS.map((v, i) => (
                            <option key={i} value={(i + 1).toFixed(0)}>{v}</option>
                        ))}
                    </select>
                )}
            </div>
            {config.rangeType !== "CUSTOM" ? null : <>
                <div className="field">
                    <div>From</div>
                    <input onBlur={() => {
                        setFromError(false)
                        fromRef.current.value = config.from
                    }} ref={fromRef} className={fromError ? "error" : ""} defaultValue={config.from ?? ""} type={"text"} onChange={e => {
                        if (isNaN(new Date(e.target.value).getTime())) {
                            setFromError(true)
                            return
                        } 
                        setFromError(false)
                        updateConfig(produce(config, d => {
                            d.from = e.target.value
                        }))
                    }}/>
                </div>
                <div className="field">
                    <div>To</div>
                    <input onBlur={() => {
                        setToError(false)
                        toRef.current.value = config.to
                    }} ref={toRef} className={toError ? "error" : ""} defaultValue={config.to ?? ""} type={"text"} onChange={e => {
                        if (isNaN(new Date(e.target.value).getTime())) {
                            setToError(true)
                            return
                        } 
                        setToError(false)
                        updateConfig(produce(config, d => {
                            d.to = e.target.value
                        }))
                    }}/>
                </div>
            </>}
            <div className="field">
                <div>Query</div>
                <input ref={queryRef} defaultValue={config.query ?? ""} type="text" placeholder="Optional keywords" onChange={e => {
                    updateConfig(produce(config, d => {
                        d.query = e.target.value
                    }))
                }}/>
            </div>
            <div className="field">
                <div>Duration</div>
                <select value={config.duration} onChange={e => {
                    updateConfig(produce(config, d => {
                        d.duration = e.target.value as VideoDuration
                    }))
                }}>
                    <option value={"ANY"}>Any</option>
                    <option value={"SHORT"}>Under 4 minutes</option>
                    <option value={"MEDIUM"}>4 - 20 minutes</option>
                    <option value={"LONG"}>Over 20 minutes</option>
                </select>
            </div>
        </div>

        <div className="tos">
            <input id="tos" type="checkbox" checked={!!config.agreed} onChange={e => {
                updateConfig(produce(config, d => {
                    d.agreed = !d.agreed
                }))
            }}/>
            <label htmlFor="tos">I agree to the <a target="_blank" href="https://github.com/polywock/youtubeEye/blob/main/TERMS_OF_SERVICE.md">terms of service</a> and <a target="_blank" href="https://github.com/polywock/youtubeEye/blob/main/PRIVACY_POLICY.md">privacy policy</a>.</label>
        </div>
        <div className="controls">
            <button disabled={!config.agreed} onClick={handleFind}>{"Find popular"}</button>
            <button onClick={() => updateConfig({...getDefaultConfig(), apiKey: config.apiKey, agreed: config.agreed}, true)}>{"Reset"}</button>
        </div>
        {result?.videos?.length === 0 && (
            <p>No videos found</p>   
        )}
        {!!result?.videos?.length && (
            <div className="videos">
                {result.videos.map(info => (
                    <VideoRender info={info}/>
                ))}
            </div>
        )}
        {!!result?.nextPageToken && (
            <div className="loadMore">
                <button onClick={handleLoadMore}>load more</button>
            </div>    
        )}
    </div>
}

const VideoRender = (props: {info: VideoInfo}) => {
    const { info } = props
    const openVideo = () => {
        window.open(`https://www.youtube.com/watch?v=${encodeURI(info.videoId)}`, "_blank")
    }

    return <div className="VideoRender" onClick={openVideo} onMouseUp={openVideo}>
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
    </div>
}

