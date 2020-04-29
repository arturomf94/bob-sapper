export function gt(v1, v2) {
  let a1 = v1.split(".")
  let a2 = v2.split(".")

  let pos = 0
  while (true) {
    const a = a1[pos]
    const b = a2[pos]

    if (a === undefined && b === undefined) return false

    const dif = (a || 0) - (b || 0)

    if (dif > 0) {
      return true
    } else if (dif < 0) {
      return false
    }

    pos += 1
  }
}
