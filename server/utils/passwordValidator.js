const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Passwort muss mindestens 8 Zeichen lang sein');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Passwort muss mindestens eine Zahl enthalten');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*(),.?":{}|<>)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validatePassword };
