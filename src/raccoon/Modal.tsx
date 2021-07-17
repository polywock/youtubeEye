import { useEffect } from "react"

type Props = {
    children: React.ReactElement,
    onExit: () => void,
    exitOnScroll?: boolean,
    color?: string
}

export const Modal = (props: Props) => {
    useEffect(() => {
        if (!props.exitOnScroll) {
          return 
        }
    
        document.addEventListener("scroll",  props.onExit, {passive: true, capture: true})
        return () => {
          document.removeEventListener("scroll", props.onExit, true)
        }
      }, [props.exitOnScroll, props.onExit])

    return <div className="Modal" style={props.color ? {backgroundColor: props.color} : null} onClick={e => {e.currentTarget === e.target && props.onExit()}}>
        {props.children}
    </div>  
}