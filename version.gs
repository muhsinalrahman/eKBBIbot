/**
 * Kamus Besar Bahasa Indonesia
 * 
 * berdasarkan https://kbbi.web.id/
 * 
 * merupakan KBBI Daring (Dalam Jaringan / Online tidak resmi) yang dibuat untuk memudahkan pencarian,
 * penggunaan dan pembacaan arti kata (lema/sub lema)
 * 
 * Kota Palembang, 06 Februari 2022
 */

/**
 * Version
 */

const app = {
    "name": "Kamus Besar Bahasa Indonesia",          // ganti nama bot
    "username": "eKBBIbot",                          // ganti username bot
    "version": "2.15",                               // ganti versi bot
    "site": "https://kbbi.web.id/",
    "author": "@kreasisaya"
}

const env = {
    "token": "BOT_API_TOKEN",                        // bot api token
    "username": app.username,
    "admin": "USER_LOG_ID",                          // user id
    "webhook": "WEB_APP_URL"                         // web app url dari deployment
}

function doGet(e) {
    HtmlService.createHtmlOutput("e-KBBI Bot Active!");
}
