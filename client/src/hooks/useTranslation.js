import { useLanguage } from '../context/LanguageContext';
import { t as translate } from '../utils/translations';

export const useTranslation = () => {
  const { language, easyLanguage } = useLanguage();
  
  const t = (key) => {
    return translate(key, language, easyLanguage);
  };
  
  return { t, language, easyLanguage };
};
