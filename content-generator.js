function generateSinglePost(businessName, businessType, platform, dayIndex) {
  const bType = (businessType || "").toLowerCase();
  let types = ['Educational', 'Promotional', 'Behind the Scenes', 'Inspirational', 'Testimonial', 'Tips', 'Engagement'];
  if (bType.includes('fitness')) types = ['Workout Tip', 'Nutrition', 'Transformation', 'Motivation', 'Educational', 'Promotional', 'Tips'];
  else if (bType.includes('restaurant') || bType.includes('ramen')) types = ['Food Feature', 'Behind the Scenes', 'Specials', 'Culture', 'Educational', 'Promotional', 'Engagement'];
  else if (bType.includes('physical therapy') || bType.includes('pt')) types = ['Exercise', 'Injury Prevention', 'Success Story', 'Tips', 'Educational', 'Promotional', 'Inspirational'];
  const postType = types[dayIndex % types.length];

  if (bType.includes('fitness')) {
    if (postType === 'Workout Tip') return { platform, post_type: postType, caption: `Struggling with your form? Quality beats quantity. At ${businessName}, we prioritize safety.`, hashtags: '#fitness #workouttips #gymmotivation', image_prompt: 'Fitness coach demonstrating proper form' };
    if (postType === 'Nutrition') return { platform, post_type: postType, caption: `Fuel your body right! At ${businessName}, balanced nutrition is key.`, hashtags: '#nutrition #healthyeating #fitness', image_prompt: 'Colorful healthy meal' };
    if (postType === 'Transformation') return { platform, post_type: postType, caption: `Check out this progress! Consistency is everything at ${businessName}.`, hashtags: '#transformation #fitnessgoals #results', image_prompt: 'Split screen fitness progress' };
    return { platform, post_type: postType, caption: `Motivation from ${businessName}! The best time to start was yesterday.`, hashtags: '#motivation #fitness #nodaysoff', image_prompt: 'Person tying running shoes' };
  }
  if (bType.includes('restaurant') || bType.includes('ramen')) {
    if (postType === 'Food Feature') return { platform, post_type: postType, caption: `Have you tried our signature dish? At ${businessName}, every ingredient counts.`, hashtags: '#foodie #restaurant #delicious', image_prompt: 'Steaming bowl of ramen' };
    if (postType === 'Behind the Scenes') return { platform, post_type: postType, caption: `Behind the scenes at ${businessName}! Our team starts early for perfection.`, hashtags: '#behindthescenes #kitchen #chef', image_prompt: 'Chef preparing ingredients' };
    if (postType === 'Specials') return { platform, post_type: postType, caption: `New specials at ${businessName}! Limited time flavors.`, hashtags: '#specials #limitedtime #foodlovers', image_prompt: 'Beautiful plate of food' };
    return { platform, post_type: postType, caption: `${businessName} is more than food - it is community.`, hashtags: '#restaurant #community #foodculture', image_prompt: 'Friends laughing over dinner' };
  }
  if (bType.includes('physical therapy') || bType.includes('pt')) {
    if (postType === 'Exercise') return { platform, post_type: postType, caption: `Mobility is key! Try this from ${businessName}. Your joints will thank you!`, hashtags: '#physicaltherapy #mobility #rehab', image_prompt: 'PT guiding patient' };
    if (postType === 'Injury Prevention') return { platform, post_type: postType, caption: `Prevention is better than cure. At ${businessName}, we help you stay active.`, hashtags: '#injuryprevention #wellness #physio', image_prompt: 'Person stretching' };
    if (postType === 'Success Story') return { platform, post_type: postType, caption: `From pain to progress! Another success at ${businessName}.`, hashtags: '#recovery #physicaltherapy #success', image_prompt: 'Smiling patient' };
    return { platform, post_type: postType, caption: `Posture tip from ${businessName}: Small changes, big results!`, hashtags: '#posture #backpain #physiotips', image_prompt: 'Proper sitting posture' };
  }
  return { platform, post_type: postType, caption: `Welcome to ${businessName}! We provide top-tier ${businessType} services.`, hashtags: `#${businessName.replace(/\s+/g,'')} #${businessType.replace(/\s+/g,'')} #localbusiness`, image_prompt: `Representation of a ${businessType} business` };
}

function generateContent(profile) {
  const { business_name, business_type, platforms } = profile;
  const platformList = platforms ? platforms.split(',').map(p => p.trim()) : ['Instagram', 'Facebook', 'TikTok'];
  const posts = [];
  for (let i = 0; i < 7; i++) posts.push(generateSinglePost(business_name, business_type, platformList[i % platformList.length], i));
  return posts;
}

module.exports = { generateContent };
