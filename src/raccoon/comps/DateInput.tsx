import { useEffect, useRef } from "react"

export function DateInput(props: {value: string, onChange: (newValue: string) => void}) {
  const ref = useRef<HTMLInputElement>()

  useEffect(() => {
      if (ref.current) {
          ref.current.value = props.value 
          ref.current.classList.remove("error")
      }
  }, [props.value])


  return (
      <input ref={ref} onBlur={() => {
          if (ref.current) {
              ref.current.value = props.value
              ref.current.classList.remove("error")
          }
      }} defaultValue={props.value} type={"text"} onChange={e => {
          if (isNaN(new Date(e.target.value).getTime())) {
              ref.current.classList.add("error")
              return
          } 
          ref.current?.classList.remove("error")
          props.onChange(e.target.value)
      }}/>
  )
}
