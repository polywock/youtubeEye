import produce from "immer"
import { Config } from "../types"

type Props = {
  config: Config,
  updateConfig: (newConfig: Config) => void 
}

export function FieldsComments(props: Props) {
  const { config, updateConfig } = props

  return <>
      <div className="field">
          <div>Mode</div>
          <select value={config.matchMode ?? "ALL"} onChange={e => {
              updateConfig(produce(config, d => {
                  d.matchMode = e.target.value as Config["matchMode"]
              }))
          }}>
              <option value={"ALL"}>Match all terms</option>
              <option value={"ANY"}>Match any term</option>
              <option value={"EXACT"}>Match exact phrase</option>
          </select>
      </div>
      <div className="field">
          <div>Search terms</div>
          <input value={config.searchTerms ?? ""} type="text" placeholder={config.matchMode === "EXACT" ? "Some phrase" : "apples, bananas, etc"} onChange={e => {
              updateConfig(produce(config, d => {
                  d.searchTerms = e.target.value
              }))
          }}/>
      </div>
      <div className="field">
          <div>Target</div>
          <select value={config.forAllChannel ? "CHANNEL" : "VIDEO"} onChange={e => {
              updateConfig(produce(config, d => {
                  d.forAllChannel = e.target.value === "CHANNEL" ? true : false 
              }))
          }}>
              <option value={"VIDEO"}>This video</option>
              <option value={"CHANNEL"}>All videos from channel</option>
          </select>
      </div>
  </>
}