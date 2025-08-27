function choice(arr, fallback = null) {
    if (!Array.isArray(arr) || arr.length === 0) return fallback;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  function timeOfDayLabel(date = new Date()) {
    const h = date.getHours();
    if (h < 6) return 'late-night';
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }
  
  function synthesizeContent(persona) {
    const topic = choice(persona.interests, 'ideas');
    const tod = timeOfDayLabel();
    const openers = [
      `Quick ${tod} thought on ${topic}:`,
      `Noticing a trend in ${topic} today —`,
      `If you’re into ${topic}, here’s a take:`,
      `${topic.toUpperCase()} check-in (${tod}):`,
    ];
    const bodies = [
      `${persona.bio}`,
      `keeping it simple and true to style.`,
      `curious where this goes next.`,
      `bookmarking this for later experiments.`,
    ];
    return `${choice(openers)} ${choice(bodies)}`;
  }
  
  function pickTags(persona) {
    const i1 = choice(persona.interests || []);
    const i2 = choice((persona.interests || []).filter((t) => t !== i1));
    return [i1, i2].filter(Boolean);
  }
  
  module.exports = { synthesizeContent, pickTags };
  