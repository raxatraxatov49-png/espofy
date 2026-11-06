const BOT_TOKEN = process.env.BOT_TOKEN;

const WEB_APP_URL = "https://espofy.netlify.app/";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot ishlayapti");
  }

  const message = req.body?.message;

  if (!message?.text) {
    return res.status(200).send("OK");
  }

  if (message.text.startsWith("/start")) {
    const text =
      "🎵 Сәлем! Espofiy ботына қош келдіңіз!\n\n" +
      "Мұнда сүйікті әндеріңізді тыңдап, жаңа музыкаларды тауып, өз плейлисттеріңізді жасай аласыз. 🎧";

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text,
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🎧 Музыка тыңдау",
              web_app: { url: WEB_APP_URL }
            }
          ]]
        }
      })
    });
  }

  return res.status(200).send("OK");
}
