
import http from "node:http";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = "https://espofy.onrender.com";

const server = http.createServer(async (req, res) => {
  if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => body += chunk);

    req.on("end", async () => {
      try {
        const update = JSON.parse(body);
        const message = update.message;

        if (message?.text?.startsWith("/start")) {
          const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: message.chat.id,
                text: "🎵 Сәлем! Espofiy ботына қош келдіңіз!\n\nМұнда сүйікті әндеріңізді тыңдап, жаңа музыкаларды тауып, өз плейлисттеріңізді жасай аласыз. 🎧",
                reply_markup: {
                  inline_keyboard: [[
                    {
                      text: "🎧 Музыка тыңдау",
                      web_app: { url: WEB_APP_URL }
                    }
                  ]]
                }
              })
            }
          );

          console.log(await response.text());
        }
      } catch (error) {
        console.error(error);
      }

      res.writeHead(200);
      res.end("OK");
    });

    return;
  }

  res.writeHead(200);
  res.end("Espofiy bot ishlayapti!");
});

server.listen(process.env.PORT || 3000);
