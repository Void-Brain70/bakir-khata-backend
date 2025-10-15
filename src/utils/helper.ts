export const generateOTP = (length: number = 4): object => {
  const characters = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return {
    otp: result,
    validTill: new Date(Date.now() + 3 * 60 * 1000),
  };
};

export const setRandomNumber = (length: number): string => {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
};
