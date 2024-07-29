import mongoose from 'mongoose';

let connected = false;

const connectDB = async () => {
    mongoose.set('strictQuery',true);

    // if the database is already conected, don't connect again
    if (connected) {
        console.log('mongoDB is already connected...');
        return;
    }

    // connect to mongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        connected = true;
        console.log('mongoDB connected...');
    } catch (error) {
        console.log(error);
    }
};

export default connectDB;