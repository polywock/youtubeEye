
window.addEventListener("EYE-M", e => {
    const key = (window as any).ytcfg?.data_?.INNERTUBE_API_KEY
    window.dispatchEvent(new CustomEvent("EYE-I", {detail: {key}}))
    e.stopImmediatePropagation()
}, true)