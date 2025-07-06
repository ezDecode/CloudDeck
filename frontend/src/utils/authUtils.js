export const getStoredCredentials = () => {
  const stored = localStorage.getItem("awsCredentials");
  return stored ? JSON.parse(stored) : null;
};

export const clearStoredCredentials = () => {
  localStorage.removeItem("awsCredentials");
};