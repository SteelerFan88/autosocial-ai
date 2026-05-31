function g(p) {
  const t = (p.business_type || '').toLowerCase();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const platformList = ['Instagram', 'Facebook', 'TikTok'];
  const types = t.includes('fitness') ? ['Workout Tip','Nutrition','Transformation','Motivation','Educational','Promotional','Tips']
    : t.includes('restaurant') ? ['Food Feature','Behind Scenes','Specials','Culture','Educational','Promotional','Engagement']
    : t.includes('pt') || t.includes('physical') ? ['Exercise','Injury Prevention','Success Story','Tips','Educational','Promotional','Inspirational']
    : ['Educational','Promotional','Behind Scenes','Inspirational','Testimonial','Tips','Engagement'];

  const posts = [];
  for (let i = 0; i < 7; i++) {
    const pt = types[i % types.length];
    const platform = platformList[i % platformList.length];
    let caption = 'Post from ' + p.business_name + ' (' + pt + ')';
    let hashtags = '#' + p.business_name.replace(/\\s/g,'');
    let image_prompt = 'Generic post';
    posts.push({ platform, post_type: pt, caption, hashtags, image_prompt });
  }
  return posts;
}
module.exports = { generateContent: g };
