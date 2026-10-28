import mongoose from "mongoose";

const connectToDataBase = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_DB_URL)

        console.log(`DataBase is connected ${mongoose.connection.name}`)
    } catch (err) {
        // console.log(err)
        console.log(err.message)
        console.log(`DataBase connection failed ${err}`)
    }
}


export default connectToDataBase
