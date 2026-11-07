
import http from "node:http";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = "https://espofy.onrender.com";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "https://espofy-new.onrender.com/";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN topilmadi!");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase URL yoki SERVICE_ROLE_KEY topilmadi!");
}

// CORS
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, POST"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
}

// YOUTUBE QIDIRUV API
async function searchYouTube(query) {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY sozlanmagan!");
  }

  const url = new URL(
    "https://www.googleapis.com/youtube/v3/search"
  );

  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("safeSearch", "moderate");
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "YouTube qidiruv xatosi"
    );
  }

  return (data.items || []).map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail:
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      item.snippet.thumbnails?.default?.url,
    publishedAt: item.snippet.publishedAt
  }));
}

// FOYDALANUVCHINI SUPABASE'DA SAQLASH
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

      console.log("Yangi foydalanuvchi:", userId);
    } else {
      console.log("Foydalanuvchi faolligi:", userId);
    }
  } catch (error) {
    console.error("Supabase xatosi:", error.message);
  }
}

// TELEGRAM START XABARI
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

// SERVER
const server = http.createServer(async (req, res) => {
  setCors(res);

  // CORS tekshiruvi
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // YOUTUBE QIDIRUV
  if (
    req.method === "GET" &&
    req.url.startsWith("/api/youtube-search")
  ) {
    try {
      const requestUrl = new URL(
        req.url,
        `http://${req.headers.host}`
      );

      const query = (
        requestUrl.searchParams.get("q") || ""
      ).trim();

      if (query.length < 2) {
        res.writeHead(400, {
          "Content-Type": "application/json"
        });
        res.end(JSON.stringify({
          error: "Kamida 2 ta harf yozing."
        }));
        return;
      }

      if (query.length > 150) {
        res.writeHead(400, {
          "Content-Type": "application/json"
        });
        res.end(JSON.stringify({
          error: "Qidiruv matni juda uzun."
        }));
        return;
      }

      const results = await searchYouTube(query);

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        results
      }));
    } catch (error) {
      console.error("YouTube qidiruv:", error.message);

      res.writeHead(500, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        error: "YouTube qidiruvida xatolik yuz berdi."
      }));
    }

    return;
  }

  // TELEGRAM WEBHOOK
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

        if (user) {
          await saveUser(user);
        }

        if (message?.text?.startsWith("/start")) {
          await sendStartMessage(message.chat.id);
        }
      } catch (error) {
        console.error("Telegram xatosi:", error);
      }

      res.writeHead(200);
      res.end("OK");
    });

    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

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
