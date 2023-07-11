//Many thanks to wacaine ----> https://github.com/decentraland-scenes/cube-jumper-colyesus-sdk7

const CLASSNAME = "XMLHttpRequest"
export class XMLHttpRequest {
  ontimeout?: (err: any) => void
  onerror?: (err: any) => void
  onload?: () => void
  withCredentials: any//???
  requestHeaders: Record<string, any> = {}
  timeout?: number

  //responseHeaders:Record<string,any>={}
  responseHeadersRaw?: string
  status?: number
  statusText?: string
  response?: any
  url?: string
  method?: string
  constructor() {
    const METHOD_NAME = "constructor"
    console.log(CLASSNAME, METHOD_NAME, "ENTRY")
  }

  getAllResponseHeaders() {
    return this.responseHeadersRaw
  }

  setRequestHeader(key: string, val: any) {
    const METHOD_NAME = "setRequestHeader"
    console.log(CLASSNAME, METHOD_NAME, "ENTRY", key, val)
    this.requestHeaders[key] = val
  }

  open(method: string, url: string) {
    const METHOD_NAME = "open"
    console.log(CLASSNAME, METHOD_NAME, "ENTRY", method, url)
    //prepares open
    this.method = method
    this.url = url
  }

  send(data: any) {
    const METHOD_NAME = "send"
    console.log(CLASSNAME, METHOD_NAME, "ENTRY", data)
    if (!this.url) {
      throw new Error("url is required")
    }
    if (!this.method) {
      throw new Error("method is required")
    }
    //does the actual open
    fetch(this.url, {
      method: this.method,
      headers: this.requestHeaders, //pretty sure Record<string,string> == { [index: string]: string }
      body: data,
      timeout: this.timeout
    }).then(async (val: Response) => {
      console.log(CLASSNAME, METHOD_NAME, "PROMISE.ENTRY", val)

      this.status = val.status
      this.statusText = val.statusText
      this.response = await val.text() //need to do async
      //must turn this into raw version

      this.responseHeadersRaw = ""
      val.headers.forEach((value: string, key: string) => {
        this.responseHeadersRaw += key + ": " + value + "\r\n"
      })
      console.log(CLASSNAME, METHOD_NAME, "PROMISE.RESULT", "this.status", this.status
        , "this.responseHeadersRaw"
        , this.responseHeadersRaw)
      if (this.onload) this.onload()
    }).catch((reason: any) => {
      //colysesus wanted this 'err.timeout = err.type == 'timeout';'
      //20 == abort, 23 == timeout
      if (reason.code && (reason.code == 20 || reason.code == 23)) reason.type = 'timeout'

      if (this.onerror) this.onerror(reason)
    })
  }

}