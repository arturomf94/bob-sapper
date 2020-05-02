import marked from "marked"

const renderer = new marked.Renderer()
renderer.paragraph = function (text) {
  return text
}
marked.use({ renderer })

export default marked
