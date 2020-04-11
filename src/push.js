import datapay from "datapay"

export async function sendMessage(message, apiKey, privateKey) {
  // const signature = Message.sign(message, $privateKey);

  datapay.connect({
    baseURL: "https://api.bitindex.network/api/v3/test",
    headers: { api_key: apiKey }
  })

  await datapay.send(
    {
      data: ["13N6yAoibzWQ6MZPeoroeMAE8NRviupB74", message],
      pay: { key: privateKey }
    },
    (err, res) => console.log(message, res)
  )
}
