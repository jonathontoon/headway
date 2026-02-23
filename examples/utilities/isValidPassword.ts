const isValidPassword = (password: string): boolean => {
  if (!password || password.length === 0) {
    return false;
  }

  const minLength = 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};":\\|,.<>/?]+/.test(password);
  const hasLetters = /[a-zA-Z]/.test(password);

  return (
    password.length >= minLength && hasNumber && hasSpecialChar && hasLetters
  );
};

export default isValidPassword;
