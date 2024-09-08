import produce from "immer"
import { Config, RangeType, VideoDuration, YearMonth } from "../types"
import { DateInput } from "./DateInput"

const currentYear = new Date().getFullYear()
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type Props = {
  config: Config,
  updateConfig: (newConfig: Config) => void 
}

export function FieldsPopular(props: Props) {
  const { config, updateConfig } = props
  const rangeYear = (config.rangeType as YearMonth)?.year

  return <>
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
              <option value={"PAST_DAY"}>Past day</option>
              <option value={"PAST_WEEK"}>Past week</option>
              <option value={"PAST_14"}>Past 2 weeks</option>
              <option value={"PAST_MONTH"}>Past month</option>
              <option value={"PAST_60"}>Past 2 months</option>
              <option value={"PAST_90"}>Past 3 months</option>
              <option value={"PAST_180"}>Past 6 months</option>
              <option value={"PAST_YEAR"}>Past year</option>
              <option value={"PAST_YEAR2"}>Past 2 years</option>
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
              <DateInput value={config.from ?? ""} onChange={v => updateConfig(produce(config, d => {
                  d.from = v 
              }))}/>
          </div>
          <div className="field">
              <div>To</div>
              <DateInput value={config.to ?? ""} onChange={v => updateConfig(produce(config, d => {
                  d.to = v 
              }))}/>
          </div>
      </>}
      <div className="field">
          <div>Query</div>
          <input value={config.query ?? ""} type="text" placeholder="Optional keywords" onChange={e => {
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
  </>
}

function isInteger(text: string) {
    return /^\d+$/.test(text?.trim())
}