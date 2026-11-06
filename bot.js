import http from "node:http";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = "https://espofy.onrender.com";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "https://espofy-new.onrender.com/";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN topilmadi!");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase URL yoki SERVICE_ROLE_KEY topilmadi!");
}

// Foydalanuvchini Supabase bazasida saqlash va oxirgi kirishini yangilash
async function saveUser(user) {
  if (!user?.id) return;

  const userId = String(user.id);
  const displayName = [
    user.first_name,
    user.last_name
  ].filter(Boolean).join(" ") || "Noma'lum";

  const userData = {
    username: user.username || null,
    display_name: displayName,
    last_seen: new Date().toISOString()
  };

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };

  try {
    // Avval mavjud foydalanuvchini yangilaymiz
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(userData)
      }
    );

    if (!updateResponse.ok) {
      throw new Error(await updateResponse.text());
    }

    const updatedUsers = await updateResponse.json();

    // Agar foydalanuvchi hali bazada bo'lmasa, yangisini qo'shamiz
    if (!updatedUsers.length) {
      const insertResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: userId,
            ...userData
          })
        }
      );

      if (!insertResponse.ok) {
        throw new Error(await insertResponse.text());
      }

      console.log("Yangi foydalanuvchi qo'shildi:", userId);
    } else {
      console.log("Foydalanuvchi faolligi yangilandi:", userId);
    }
  } catch (error) {
    console.error("Supabase foydalanuvchi xatosi:", error.message);
  }
}

async function sendStartMessage(chatId) {
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text:
          "🎵 Сәлем! Espofiy ботына қош келдіңіз!\n\n" +
          "Мұнда сүйікті әндеріңізді тыңдап, жаңа музыкаларды тауып, " +
          "өз плейлисттеріңізді жасай аласыз. 🎧",
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🎧 Музыка тыңдау",
              web_app: {
                url: WEB_APP_URL
              }
            }
          ]]
        }
      })
    }
  );

  console.log("Telegram:", await response.text());
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const update = JSON.parse(body);

        const message = update.message;
        const user =
          message?.from ||
          update.callback_query?.from;

        // Har qanday bot xabarida foydalanuvchi faolligini yangilash
        if (user) {
          await saveUser(user);
        }

        // /start buyrug'i
        if (message?.text?.startsWith("/start")) {
          await sendStartMessage(message.chat.id);
        }
      } catch (error) {
        console.error("Xatolik:", error);
      }

      res.writeHead(200);
      res.end("OK");
    });

    return;
  }

  res.writeHead(200);
  res.end("Espofiy bot ishlayapti!");
});

server.listen(process.env.PORT || 3000, async () => {
  console.log("Espofiy bot ishga tushdi!");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: WEBHOOK_URL
        })
      }
    );

    console.log("Webhook:", await response.text());
  } catch (error) {
    console.error("Webhook xatosi:", error);
  }
});
