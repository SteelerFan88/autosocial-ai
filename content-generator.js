const { exec } = require('child_process');

async function generateContent(clientId, profile) {
  const { business_name, business_type, platforms } = profile;
  const platformList = platforms ? platforms.split(',').map(p => p.trim()) : ['Instagram', 'Facebook', 'TikTok'];
  const posts = [];

  for (let i = 0; i < 7; i++) {
    const platform = platformList[i % platformList.length];
    const post = generateSinglePost(business_name, business_type, platform, i);
    posts.push(post);
  }

  for (const post of posts) {
    const sql = `INSERT INTO content_posts (client_id, platform, post_type, caption, hashtags, image_prompt, status) VALUES (${clientId}, '${post.platform}', '${post.post_type}', '${post.caption.replace(/'/g, "''")}', '${post.hashtags}', '${post.image_prompt}', 'draft')`;
    await new Promise(r => exec(`team-db "${sql}"`, () => r()));
  }
  return posts;
}

function generateSinglePost(name, type, platform, day) {
  const t = (type || '').toLowerCase();
  const types = t.includes('fitness') ?
    ['Workout Tip','Nutrition','Transformation','Motivation','Educational','Promotional','Tips'] :
    t.includes('restaurant') || t.includes('ramen') ?
    ['Food Feature','Behind Scenes','Specials','Culture','Educational','Promotional','Engagement'] :
    t.includes('physical therapy') || t.includes('pt') ?
    ['Exercise','Injury Prevention','Success Story','Tips','Educational','Promotional','Inspirational'] :
    ['Educational','Promotional','Behind Scenes','Inspirational','Testimonial','Tips','Engagement'];
  const pt = types[day % types.length];

  if (t.includes('fitness')) {
    if (pt === 'Workout Tip') return { platform, post_type: pt, caption: `Struggling with your form? Quality beats quantity. At ${name}, we prioritize safety. What exercise are you working on?`, hashtags: '#fitness #workouttips #gymmotivation', image_prompt: 'A fitness coach demonstrating proper form' };
    if (pt === 'Nutrition') return { platform, post_type: pt, caption: `Fuel your body right! At ${name}, we believe balanced nutrition is key. What's your go-to post-workout snack?`, hashtags: '#nutrition #healthyeating #fitness', image_prompt: 'A colorful healthy meal' };
    if (pt === 'Transformation') return { platform, post_type: pt, caption: `Check out this progress! Consistency is everything at ${name}. Ready to start your journey? DM us!`, hashtags: '#transformation #fitnessgoals #results', image_prompt: 'Split screen fitness progress photo' };
    return { platform, post_type: pt, caption: `Motivation from ${name}! The best time to start was yesterday. The second best is NOW. Let's go!`, hashtags: '#motivation #fitness #nodaysoff', image_prompt: 'Person tying running shoes' };
  }

  if (t.includes('restaurant') || t.includes('ramen')) {
    if (pt === 'Food Feature') return { platform, post_type: pt, caption: `Have you tried our signature dish? At ${name}, every ingredient counts. Come taste the difference!`, hashtags: '#foodie #restaurant #delicious', image_prompt: 'Steaming bowl of ramen' };
    if (pt === 'Behind Scenes') return { platform, post_type: pt, caption: `Behind the scenes at ${name}! Our team starts early to bring you perfection in every bite.`, hashtags: '#behindthescenes #kitchen #chef', image_prompt: 'Chef preparing ingredients' };
    if (pt === 'Specials') return { platform, post_type: pt, caption: `New specials at ${name}! Limited time flavors you don't want to miss. Tag a friend to bring!`, hashtags: '#specials #limitedtime #foodlovers', image_prompt: 'Beautiful plate of food with chalkboard sign' };
    return { platform, post_type: pt, caption: `${name} is more than food - it's community. What's your favorite memory with us?`, hashtags: '#restaurant #community #foodculture', image_prompt: 'Friends laughing over dinner' };
  }

  if (t.includes('physical therapy') || t.includes('pt')) {
    if (pt === 'Exercise') return { platform, post_type: pt, caption: `Mobility is key! Try this exercise from ${name}. 3 sets of 10 - your joints will thank you!`, hashtags: '#physicaltherapy #mobility #rehab', image_prompt: 'PT guiding patient through exercise' };
    if (pt === 'Injury Prevention') return { platform, post_type: pt, caption: `Prevention is better than cure. At ${name}, we help you stay healthy and active.`, hashtags: '#injuryprevention #wellness #physio', image_prompt: 'Person stretching properly' };
    if (pt === 'Success Story') return { platform, post_type: pt, caption: `From pain to progress! Another success story at ${name}. Your goals are our goals.`, hashtags: '#recovery #physicaltherapy #success', image_prompt: 'Smiling patient giving thumbs up' };
    return { platform, post_type: pt, caption: `Posture tip from ${name}: Keep shoulders back and down. Small changes, big results!`, hashtags: '#posture #backpain #physiotips', image_prompt: 'Infographic of proper sitting posture' };
  }

  return { platform, post_type: pt, caption: `Welcome to ${name}! We provide top-tier ${type} services. How can we help you today?`, hashtags: `#${name.replace(/\s+/g,'')} #${type.replace(/\s+/g,'')} #localbusiness`, image_prompt: `Professional representation of a ${type} business` };
}

module.exports = { generateContent };
