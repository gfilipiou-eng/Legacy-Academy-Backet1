import mongoose from 'mongoose';
import User from './models/User.js';

mongoose.connect("mongodb+srv://bagugan2009_db_user:kokops1213A@cluster0.kcjblbq.mongodb.net/legacyacademy?retryWrites=true&w=majority").then(async () => {
  const user = await User.findOne({});
  console.log("Settings:", JSON.stringify(user.settings, null, 2));
  process.exit(0);
}).catch(console.error);
