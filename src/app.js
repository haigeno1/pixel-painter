const fs = require("fs")
const path = require("path")
const http = require("http")
const express = require("express")
const ws = require("ws")
const jimp = require("jimp")

const port = 9095
const app = express()
const server = http.createServer(app)
const wss = new ws.Server({server})
const width = 256
const height = 256
let img
let onlineCount = 0

// try{
//     img = await jimp.read(path.join(__dirname,"./pixelData.png"))
// } catch(e){
//     img = new jimp(256, 256, "0x00ff00ff") 
// }

// jimp.read(path.join(__dirname,"./pixelData.png")).then(v=> img = v).catch(e=>{
//     return img = new jimp(256, 256, "0x00ff00ff")
// })

jimp.read(path.join(__dirname,"./pixelData.png"),(e,v)=>{
    if(e){
        img = new jimp(256, 256, 0x00ff00ff)
    } else {
        img = v
    }
})

setInterval(()=>{
    img.write(path.join(__dirname,"./pixelData.png"),()=>{
        console.log("png saved......")
    })
},5000)

wss.on("connection", (ws, req)=>{
    var lastDraw = 0
    onlineCount++
    ws.send(JSON.stringify({onlineCount}))
    img.getBuffer(jimp.MIME_PNG,(err,buf)=>{
        if(err){
            console.log("get buffer err" + err)
        } else {
            ws.send(buf)
        }
    })
    ws.on("close", ()=>{
        onlineCount--
        ws.send(JSON.stringify({onlineCount}))
    })
    ws.on("message", (msg)=>{
        //console.log("msg", msg)
        //msg {"type":"drawDot","x":2,"y":0,"color":"green"}
        if(Date.now() - lastDraw < 500){
            return
        } 
        msg = JSON.parse(msg)
        var {x,y,color} = msg
        if(x > 0 && y > 0 && x < width && y < height){
            lastDraw = Date.now()
            if (msg.type === "drawDot"){
                img.setPixelColor(jimp.cssColorToHex(color), x, y)
            }
            wss.clients.forEach((client) => {
                client.send(JSON.stringify({
                    type: "updateDot",
                    x,y,color,onlineCount
                }))
            })
        }
    })
})

app.use(express.static(path.join(__dirname,"./static")))
server.listen(port, ()=>{
    console.log("listening on " + port)
})