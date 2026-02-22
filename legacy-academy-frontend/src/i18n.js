import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import el from './locales/el.json';
import de from './locales/de.json';
import ru from './locales/ru.json';
import cy from './locales/cy.json';
import es from './locales/es.json';
import tr from './locales/tr.json';
import fr from './locales/fr.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            el: { translation: el },
            de: { translation: de },
            ru: { translation: ru },
            cy: { translation: cy },
            es: { translation: es },
            tr: { translation: tr },
            fr: { translation: fr }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage', 'cookie']
        }
    });

export default i18n;
