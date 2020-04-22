export async function readStream(stream, callBack) {
  const reader = stream.getReader()
  const decoder = new TextDecoder("utf-8")

  let lastLine = ""
  async function readNext() {
    const { done, value } = await reader.read()

    if (done) return
    const decoded = decoder.decode(value).split("\n")
    decoded[0] = lastLine + decoded[0]
    lastLine = decoded.pop()
    for (const line of decoded) {
      const tx = JSON.parse(line)
      callBack(tx)
    }
    readNext()
  }
  readNext()
}
