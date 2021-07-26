import produce from "immer"
import { useState } from "react"
import { RenderComment } from "./comps/RenderComment"
import { FieldsPopular } from "./comps/FieldsPopular"
import { FieldsComments } from "./comps/FieldsComments"
import { RenderVideo } from "./comps/RenderVideo"
import { Config, VideoInfo } from "./types"
import { fetchThreads, fetchCommentResults, fetchVideos, FetchVideosResult, getDefaultConfig, persistConfig } from "./utils"

type AppProps = {
    forComments: boolean, 
    videoId: string, 
    config: Config, 
    dark: boolean, 
    channelId: string
}

export const App = (props: AppProps) => {
    const [config, setConfig] = useState(props.config)
    const [blur, setBlur] = useState(!!props.config?.apiKey)
    const [result, setResult] = useState(null as FetchVideosResult | fetchCommentResults)
    const [loading, setLoading] = useState(false)

    const updateConfig = (config: Config, reset = false) => {
        setConfig(config) 
        persistConfig(config)
        if (reset) {
            setResult(null)
        }
    }

    const handleFind = () => {
        setLoading(true);

        (props.forComments ? (
            fetchThreads(config.forAllChannel ? props.channelId : props.videoId, config)
        ) : (
            fetchVideos(props.channelId, config)
        )).then(res => {
            setResult(res)
        }, err => {
            alert(err)
            setResult(null)
        }).finally(() => setLoading(false))
    }

    const handleLoadMore = () => {
        setLoading(true);

        (props.forComments ? (
            fetchThreads(config.forAllChannel ? props.channelId : props.videoId, config, result.nextPageToken)
        ) : (
            fetchVideos(props.channelId, config, result.nextPageToken)
        )).then(res => {
            setResult(produce(result, d => {
                d.nextPageToken = res.nextPageToken
                d.items = [...(d.items as VideoInfo[]), ...(res.items as VideoInfo[])]
            }))
        }, err => {
            alert(err)
        }).finally(() => setLoading(false))
    }

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
                <input {...(config.apiKey ? {} : {autoFocus: true})} required onFocus={e => setBlur(false)} value={config.apiKey ?? ""} type={blur ? "password" : "text"} placeholder="Youtube Data API key required" onChange={e => {
                    updateConfig(produce(config, d => {
                        d.apiKey = e.target.value
                    }))
                }}/>
            </div>
            {props.forComments ? <FieldsComments config={config} updateConfig={updateConfig}/> : <FieldsPopular config={config} updateConfig={updateConfig}/>}
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
            <button className={loading ? "invert" : ""} disabled={!config.agreed} onClick={handleFind}>{props.forComments ? "Search comments" : "Find popular"}</button>
            <button onClick={() => updateConfig({...getDefaultConfig(), apiKey: config.apiKey, agreed: config.agreed}, true)}>{"Reset"}</button>
        </div>
        {result?.type === "VIDEOS" && <>
            {result.items.length === 0 && (
                <p>{`No videos found`}</p>   
            )}
            {!!result.items.length && (
                <div className="videos">
                    {result.items.map(info => (
                        <RenderVideo key={info.videoId} info={info}/>
                    ))}
                </div>
            )}    
        </>}
        {result?.type === "COMMENTS" && <>
            <p>{`${result.items.length ? `${result.items.length}${result.nextPageToken ? "+" : ""}` : "no"} comments`}</p>
            {!!result.items.length && (
                <div className="comments">
                    {result.items.map(info => (
                        <RenderComment key={info.commentId} apiKey={config.apiKey || ""} info={info}/>
                    ))}
                </div>
            )}    
        </>}
        {!!result?.nextPageToken && (
            <div className="loadMore">
                <button className={loading ? "invert" : ""} onClick={handleLoadMore}>LOAD MORE</button>
            </div>    
        )}
    </div>
}




