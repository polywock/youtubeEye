import { produce } from "immer"
import { Config } from "../types"

type Props = {
  config: Config,
  updateConfig: (newConfig: Config) => void 
}

export function FieldsComments(props: Props) {
  const { config, updateConfig } = props

  return <>
      <div className="field">
          <div>Search all videos from this channel</div>
          <input type="checkbox" checked={!!config.forAllChannel} onChange={e => {
            updateConfig(produce(config, d => {
                d.forAllChannel = !d.forAllChannel
            }))
        }}/>
      </div>
      <div className="field">
          <div>Search</div>
          <input value={config.searchTerms ?? ""} type="text" placeholder={"Search here"} onChange={e => {
              updateConfig(produce(config, d => {
                  d.searchTerms = e.target.value
              }))
          }}/>
      </div>
  </>
}