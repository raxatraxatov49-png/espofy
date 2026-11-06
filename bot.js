
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL =
  process.env.WEB_APP_URL || "https://espofy.netlify.app/";

const server = http.createServer(async (req, res) => {
  if (req.method === "GET") {
    res.writeHead(200);
    return res.end("Espofiy bot ishlayapti! 🎵");
  }

  if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const update = JSON.parse(body);
        const message = update.message;

        if (message?.text?.startsWith("/start")) {
          const text =
            "🎵 Сәлем! Espofiy ботына қош келдіңіз!\n\n" +
            "Мұнда сүйікті әндеріңізді тыңдап, жаңа музыкаларды тауып, өз плейлисттеріңізді жасай аласыз. 🎧";

          await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
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
            }
          );
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
  res.end("OK");
});

server.listen(process.env.PORT || 3000);
