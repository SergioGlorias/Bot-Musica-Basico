const Discord = require("discord.js")
const client = new Discord.Client()
const urlValid = require("valid-url")
const ytdl = require("ytdl-core")
const YouTube = require("simple-youtube-api") 
let youtube



const { prefix, token, ytAPI } = require("./config.json")
if (!prefix) {
    console.log("Não encontrei o prefix do Bot!\nPor favor verique o config.json!!")
    process.exit()
}
if (!token) {
    console.log("Não encontrei o token do seu Bot!\nSem ele não posso iniciar o seu bot!\nPor favor verique o config.json!!")
    process.exit()
}
if (!ytAPI) console.log("Não encontrei o token de API do youtube!\nSem ela não vou poder fazer pesquisas no youtube!!\nMas posso continuar a aceitar link!!\nPor favor verique o config.json!!\nPara saber como obtela: https://developers.google.com/youtube/v3/getting-started")
else youtube = new YouTube(ytAPI)

var connect = {}
var dispatcher = {}

async function join(message) {
    if (!message.member.voice.channel) {
        message.reply("Você precisa estar em um canal primeiro!")
        return
    } else if (message.guild.me.voice.channel && message.member.voice.channel !== message.guild.me.voice.channel) {
        message.reply("Você tem que estar em o mesmo canal que!")
        return
    } else if (!message.guild.me.voice.channel || !connect[message.guild.id]) {
        if (!message.member.voice.channel.joinable) return message.reply("Não tenho permição de entrar no canal")
        try {
            connect[message.guild.id] = await message.member.voice.channel.join()
        } catch (error) {
            console.log("Erro ao entrar bo canal")
            message.reply("Por algum motivo não consegui entrar no canal! :(")
            console.log(error)
            return
        }
        return connect[message.guild.id]
    } else {
        return connect[message.guild.id]
    }

}

client.on("ready", () => {
    console.log("Bot Online")
})

client.on("message", async (message) => {
    if (message.author.bot || message.channel.type === "dm") return
    if (!message.guild.me.permissionsIn(message.channel).has(2048)) return
    if (message.content.startsWith(prefix)) {
        const fullCmd = message.content.replace(prefix, '').split(' ')
        let cmd = fullCmd.shift()
        const args = fullCmd

        if (cmd === "play") {
            try {
                if (!args.join(" ")) return message.reply("Você deve fornecer dados do que eu devo pesquisar!")
                let idYt
                console.log("[Comando Play] Iniciado pesquisa de videos!!")
                if (urlValid.isUri(args[0])) {
                    console.log("[Comando Play] Link detado!!")
                    const url =new URL(args[0])
                    if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com" || url.hostname === "music.youtube.com") {
                        if (url.pathname !== "/watch") return message.reply("Esse link do youtube não é valido!!")
                        idYt = url.searchParams.get("v")
                        if (!idYt) return message.reply("Esse link do youtube não é valido!!")
                    } else if (url.hostname === "youtu.be") {
                        if (!url.pathname) return message.reply("Esse link do youtube não é valido!!")
                        idYt = url.pathname
                    } else return message.reply("Esse link não é do youtube!!")
                    console.log("[Comando Play] Link validado!!")
                } else { 
                    if (!youtube) return message.reply("Lamento de momento só aceito tocar videos do youtube via link!!")
                    console.log("[Comando Play] Pesquisa inicida!!")
                    let results = await youtube.searchVideos(args.join(" "), 1)
                    if (!results[0]) return message.reply("Lamento mas não encontrei nenhum video do youtube")
                    idYt = results[0].id
                    console.log("[Comando Play] Pesquisa terminada!!")
                }

                console.log("[Comando Play] Agora obtendo dados do ytdl!!")

                let data = await ytdl.getBasicInfo(`https://youtu.be/${idYt}`)

                console.log("[Comando Play] Dados do youtube obtidos!!")

                if (data.status !== "ok") {
                    await message.channel.send(`${message.author} parece que estou tendo problemas com o youtube desculpe!!`)
                    return
                }

                console.log("[Comando Play] Entrando no canal!!")
                const connection = await join(message)
                if (!connection) return

                console.log("[Comando Play] entrou no canal!!")

                let url = `https://youtu.be/${idYt}`
                dispatcher[message.guild.id] = await connection.play(ytdl(url, { filter: 'audioonly' }), {
                    highWaterMark: 512,
                    bitrate: 'auto'
                })

                console.log(`[Comando Play] Tocando ${data.title} :)`)
                message.reply(`Tocando ${data.title} :)`)

                dispatcher[message.guild.id].on('finish', async () => connection.disconnect())

            } catch (error) {
                console.log("Falha num comando play!!")
                console.log(error)
            }
        }
    }
})

client.on("messageUpdate", async (oldMsg, newMsg) => {
    if (oldMsg.content === newMsg.content) return
    client.emit("message", newMsg)
})

client.login(token)
