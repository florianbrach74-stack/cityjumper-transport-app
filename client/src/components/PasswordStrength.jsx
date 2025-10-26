import { useState, useEffect } from 'react';

export default function PasswordStrength({ password }) {
  const [strength, setStrength] = useState({ score: 0, feedback: [], isValid: false });

  useEffect(() => {
    const checkStrength = () => {
      const feedback = [];
      let score = 0;

      if (password.length >= 8) {
        score++;
      } else {
        feedback.push('Mindestens 8 Zeichen');
      }

      if (/[A-Z]/.test(password)) {
        score++;
      } else {
        feedback.push('Mindestens ein Großbuchstabe');
      }

      if (/[a-z]/.test(password)) {
        score++;
      } else {
        feedback.push('Mindestens ein Kleinbuchstabe');
      }

      if (/[0-9]/.test(password)) {
        score++;
      } else {
        feedback.push('Mindestens eine Zahl');
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score++;
      } else {
        feedback.push('Mindestens ein Sonderzeichen');
      }

      setStrength({
        score,
        feedback,
        isValid: score === 5
      });
    };

    if (password) {
      checkStrength();
    } else {
      setStrength({ score: 0, feedback: [], isValid: false });
    }
  }, [password]);

  if (!password) return null;

  const getColor = () => {
    if (strength.score <= 2) return 'bg-red-500';
    if (strength.score <= 3) return 'bg-yellow-500';
    if (strength.score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getLabel = () => {
    if (strength.score <= 2) return 'Schwach';
    if (strength.score <= 3) return 'Mittel';
    if (strength.score <= 4) return 'Gut';
    return 'Sehr sicher';
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getColor()}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium">{getLabel()}</span>
      </div>
      {strength.feedback.length > 0 && (
        <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
          {strength.feedback.map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
