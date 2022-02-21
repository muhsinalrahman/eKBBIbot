
/**
 * Request ke telegram bot api
 */

class Telegram {
    constructor(token) {
        this.token = token;
        this.apiUrl = "https://api.telegram.org"
    }

    callApi(method, data) {
        let payload = Object.entries(data)
            .filter(([_, v]) => v != null)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

        let params = {
            "method": "POST",
            "contentType": "application/json",
            "payload": JSON.stringify({
                "method": method,
                ...payload
            })
        }

        try {
            let response = UrlFetchApp.fetch(`${this.apiUrl}/bot${this.token}/`, params);
            if (response.getResponseCode() == 200) {
                let result = response.getContentText();
                return JSON.parse(result);
            }
        } catch (e) {
            return false;
        }
    }

    setWebhook(url = "") {
        console.log(this.callApi("setWebhook", {
            url: url
        }));
        return;
    }

    sendMessage(chat_id, text, reply_to_message_id = false, reply_markup = {}) {
        return this.callApi("sendMessage", {
            chat_id,
            text,
            reply_to_message_id,
            reply_markup,
            "parse_mode": "HTML",
            "disable_web_page_preview": true,
            "allow_sending_without_reply": true
        });
    }

    editMessageText(chat_id, message_id, inline_message_id, text, reply_markup = {}) {
        return this.callApi("editMessageText", {
            chat_id,
            message_id,
            inline_message_id,
            text,
            reply_markup,
            "parse_mode": "HTML",
            "disable_web_page_preview": true
        });
    }

    answerInlineQuery(inline_query_id, results) {
        return this.callApi("answerInlineQuery", {
            inline_query_id,
            results,
            "cache_time": 3600
        });
    }
}

/**
 * KBBI API
 * 
 * Main request ke https://kbbi.web.id/
 */

class KBBI {
    constructor() { }

    get session() {
        let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";

        for (var i = 0, n = charset.length; i < 5; ++i) {
            result += charset.charAt(Math.floor(Math.random() * n));
        }

        return result;
    }

    find(text) {
        let url = `https://kbbi.web.id/${text}`;

        try {
            let result = [];
            let response = UrlFetchApp.fetch(`${url}/ajax_submit${this.session}`);
            let data = JSON.parse(response.getContentText());

            for (let i = 0; i < data.length; i++) {
                let regex = /<sup>(\d+)<\/sup>/gi;
                let ok, head, body;

                if (data[i].x == 1) {
                    ok = true;
                    head = data[i].w.replace(regex, "-$1");
                    let temp = data[i].d
                        .replace(regex, " (makna ke-$1)")
                        .replace(/<br\/?>/g, "\n")
                        .replace(/&#183;/g, "·")
                        .replace(/&#(\d+);/g, "--");

                    body = this.removeBreakLine(temp);

                    result.push({ ok, head, body });
                }

                if (data[i].x == 5) {
                    ok = false;
                    head = data[i].w.replace(regex, "");
                    body = "";

                    result.push({ ok, head, body });
                }
            }

            return result.filter(x => x.ok === true).length > 0
                ? result.filter(x => x.ok === true)
                : this.removeDuplicate(result.filter(x => x.ok === false));
        } catch (e) {
            return false;
        }
    }

    // hapus kata turunan
    removeBreakLine(data) {
        let index = data.search(/\n\n+/g);
        if (index < 0) return data;

        return data.slice(0, index);
    }

    // menghapus hasil duplikat
    removeDuplicate(array, fn) {
        let seen = new Set();
        let key = fn || (x => x);

        if (typeof key === "function") {
            return array.filter(data => {
                let item = key(data.head);
                return seen.has(item) ? false : seen.add(item);
            });
        }

        return false;
    }
}

// membuat keyboard inline
function keyboardGenerator(data) {
    const number = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    if (data.every(x => x.ok === true)) {

        const text = data[0].head.replace(/([^a-zAZ ])/g, "");

        let keyboard = [];
        if (data.length > 1) {
            for (let i = 0; i < data.length; i++) {
                keyboard.push({
                    "text": number[i],
                    "callback_data": data[i].head
                });
            }
        }

        let result = [
            keyboard,
            [{ "text": "🌐 " + text, "url": `https://kbbi.web.id/${text}` }]
        ];

        return { "inline_keyboard": result }
    }

    return false;
}
