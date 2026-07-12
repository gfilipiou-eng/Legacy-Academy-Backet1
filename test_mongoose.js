const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  settings: {
    theme: { type: String, default: 'purple' },
    favoritePlayer: { type: Object }
  }
});

const User = mongoose.model('TestUser', UserSchema);

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_legacy');
  
  let u = new User();
  await u.save();
  console.log("Created user:", u);
  
  const updated = await User.findByIdAndUpdate(
    u._id,
    { $set: { "settings.favoritePlayer": { id: "123", name: "Messi" } } },
    { new: true }
  );
  
  console.log("Updated user:", updated);
  
  await mongoose.disconnect();
}

test().catch(console.error);
