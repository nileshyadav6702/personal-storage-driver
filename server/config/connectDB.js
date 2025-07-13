import { MongoClient } from "mongodb"

let url = "mongodb://127.0.0.1:27017/Personal-driver"
let client = new MongoClient(url)
async function connectDB() {
    try {
        await client.connect()
        console.log("Database connected successfully")
        let db = client.db()
        return db
    }   
    catch(error) {
        console.log("Error occured in connecting database")
    }
}

process.on("SIGINT", async () => {
    await client.close()
    console.log("Client Disconnected!")
    process.exit(0)
})

export  {connectDB, client}