// Function to check if a string contains emojis
export const containsEmoji = (str) => {
  // Regular expression that matches emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu;
  return emojiRegex.test(str);
};

// Function to validate input fields against emojis
export const validateNoEmoji = (value, fieldName) => {
  if (containsEmoji(value)) {
    return `${fieldName} should not contain emojis`;
  }
  return '';
};
