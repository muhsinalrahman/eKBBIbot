const bot = new Telegram(env.token);

function setWebhook() {
    let url = env.webhook;
    bot.setWebhook(url)
}

const doPost = e => {
    try {
        let update = JSON.parse(e.postData.contents);
        if (typeof update.inline_query !== "undefined") {
            return inlineQuery(update.inline_query);
        }

        if (typeof update.callback_query !== "undefined") {
            return callbackQuery(update.callback_query);
        }

        if (typeof update.message !== "undefined") {
            return message(update.message);
        }
    } catch (e) {
        bot.sendMessage(env.admin, e.message);
    }
}

const inlineQuery = update => {
    let inline_query_id = update.id;
    let text = update.query;
    if (text === "") return false;

    let result = [];

    let data = new KBBI().find(text);
    if (!data) {
        let reply = `Kata <code>${text}</code> tidak ditemukan!`;
        result.push({
            "type": "article",
            "id": `error-input`,
            "title": text,
            "message_text": reply,
            "parse_mode": "HTML",
            "description": `arti kata ${text}`,
            "disable_web_page_preview": true
        });

        return bot.answerInlineQuery(inline_query_id, result);
    }

    if (!data[0].ok) {
        let suggest = "";
        for (let i = 0; i < data.length; i++) {
            suggest += `<code>${data[i].head}</code> `;
        }

        let reply = `🔍 Kata <code>${text}</code> tidak ditemukan!\n\n`;
        reply += "💡 <b>Tips</b>: gunakan kata dasar\n\n";
        reply += `📑 <b>Saran</b>: ${suggest.trim()}`;

        result.push({
            "type": "article",
            "id": data[0].head,
            "title": text,
            "message_text": reply,
            "parse_mode": "HTML",
            "description": `arti kata ${text}`,
            "disable_web_page_preview": true
        });

        return bot.answerInlineQuery(inline_query_id, result);
    }

    let title = data[0].head.replace(/([^a-zA-Z ]+)/g, "");
    let reply_markup = keyboardGenerator(data);

    result.push({
        "type": "article",
        "id": data[0].head,
        "title": title,
        "message_text": data[0].body,
        "parse_mode": "HTML",
        "description": `arti kata ${title}`,
        "disable_web_page_preview": true,
        "reply_markup": reply_markup
    });

    return bot.answerInlineQuery(inline_query_id, result);
}

const callbackQuery = update => {
    let text = update.data.replace(/([^a-zA-Z ]+)/g, "");
    let index = parseFloat(update.data.replace(/([^0-9]+)/g, "")) - 1;
    let data = new KBBI().find(text);
    let reply = data[index].body;
    let reply_markup = keyboardGenerator(data);

    if (update.message) {
        let chat_id = update.message.chat.id;
        let message_id = update.message.message_id;
        return bot.editMessageText(chat_id, message_id, null, reply, reply_markup);
    }

    return bot.editMessageText(null, null, update.inline_message_id, reply, reply_markup);
}

const message = update => {
    if (update.text) {
        let match;
        let text = update.text;

        let chat_id = update.chat.id;
        let message_id = update.message_id;

        if (new RegExp(`^\/(start|help|bantuan)(?:@${env.username})?$`, "i").exec(text)) {
            let reply = "<b>🤖Kamus Besar Bahasa Indonesia</b>\n";
            reply += `<code>versi ${app.version}</code>\n\n`;
            reply += "merupakan KBBI Daring (Dalam Jaringan / Online tidak resmi)";
            reply += "yang dibuat untuk memudahkan pencarian, penggunaan dan pembacaan arti kata (lema/sub lema)\n\n";
            reply += "Penggunaan:\n\n";
            reply += "<code>/kbbi kata</code>\n";
            reply += "contoh: <code>/kbbi sayang</code>\n\n";
            reply += "Mode <em>Inline</em> (bisa darimana saja)\n\n";
            reply += "<code>@eKBBIbot kata</code>\n";
            reply += "contoh: <code>@eKBBIbot cinta</code>\n\n";
            reply += "🔖 sumber: https://kbbi.web.id/";

            return bot.sendMessage(chat_id, reply);
        }

        if (new RegExp(`^\/ping(?:@${env.username})?$`, "i").exec(text)) {
            let start = +new Date();
            let ping = UrlFetchApp.fetch(app.site);
            let end = +new Date();
            let result = Math.abs(start - end);
            let reply = `<b>PING❗️❗️❗️</b>\n⏳ <code>${result}ms</code>`;

            return bot.sendMessage(chat_id, reply, message_id);
        }

        if (match = new RegExp(`^\/kbbi(?:@${env.username})?\\s(.+)`, "i").exec(text)) {
            let payload = match[1];
            if (typeof payload === "undefined") return false;

            let data = new KBBI().find(payload);
            if (!data) return bot.sendMessage(chat_id, `Kata <code>${payload}</code> tidak ditemukan!`);
            if (!data[0].ok) {
                let suggest = "";
                for (let i = 0; i < data.length; i++) {
                    suggest += `<code>${data[i].head}</code> `;
                }

                let reply = `🔍 Kata <code>${payload}</code> tidak ditemukan!\n\n`;
                reply += "💡 <b>Tips</b>: gunakan kata dasar\n\n";
                reply += `📑 <b>Saran</b>: ${suggest.trim()}`;

                return bot.sendMessage(chat_id, reply)
            }

            let reply = data[0].body;
            let reply_markup = keyboardGenerator(data);

            return bot.sendMessage(chat_id, reply, false, reply_markup);
        }
    }

    return false;
}
