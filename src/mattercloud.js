import axios from "axios"

export async function fetchApiKey() {
  const response = await axios.post(
    "https://api.bitindex.network/api/v2/registration/account?secret=secretkey"
  )
  const apiKey = response.data && response.data.apiKey
  if (!apiKey) {
    throw new Error("Failed to request MatterCloud API key.")
  }
  return apiKey
}
