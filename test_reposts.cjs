const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://tate:Nrg86m2lWqE0g9eA@cluster0.bnd1m.mongodb.net/tate?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI).then(async () => {
  const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));
  const post = await Post.findOne({ reposts: { $exists: true, $not: { $size: 0 } } });
  console.log(post ? post.reposts : 'No reposts found');
  if (post && post.reposts.length > 0) {
    console.log('Type of first element:', typeof post.reposts[0], post.reposts[0].constructor.name);
  }
  mongoose.disconnect();
});