import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_STRING_CONNECTION)
        console.log("MongoDataBase connection Succesfully✅.");
    } catch (error) {
        console.log(`MongoDataBase connection failed. ${error}`);
    }

}
export default connectDB;