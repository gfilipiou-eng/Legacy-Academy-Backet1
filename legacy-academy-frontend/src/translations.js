import { useTranslation as useI18n } from 'react-i18next';

export const useTranslation = () => {
    const { t, i18n } = useI18n();
    return { t, i18n, lang: i18n.language };
};
