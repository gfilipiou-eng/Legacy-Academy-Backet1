import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  if (req.headers.accept?.includes("application/json") || req.query.json === 'true') {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const posts = await Post.find()
        .populate('author', 'username profilePic role isPrivate')
        .sort({ createdAt: -1 })
        .limit(limit);
      return res.status(200).json(posts);
    } catch (err) { return res.status(500).json(err); }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Legacy Academy</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    
    /* LIQUID GLASS 4.0 - PREMIUM 4K READY */
    :root { 
      --bg: #000; 
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-bg: rgba(10, 10, 10, 0.82);
      --accent: #eab308; 
      --accent-glow: rgba(234, 179, 8, 0.3);
      --text: #ffffff; 
      --card-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
    }
    
    [data-theme='cobalt'] { --accent: #3b82f6; --accent-glow: rgba(59, 130, 246, 0.3); }
    [data-theme='crimson'] { --accent: #ef4444; --accent-glow: rgba(239, 68, 68, 0.3); }
    [data-theme='emerald'] { --accent: #10b981; --accent-glow: rgba(16, 185, 129, 0.3); }
    [data-theme='violet'] { --accent: #8b5cf6; --accent-glow: rgba(139, 92, 246, 0.3); }

    body { 
      background-color: var(--bg);
      color: var(--text); 
      font-family: 'Inter', sans-serif; 
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    
    .liquid-bg {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: -1;
      background: radial-gradient(circle at 50% 0%, #1a1a1a 0%, #000 70%);
      pointer-events: none;
    }

    .glass-3d {
      background: var(--glass-bg);
      backdrop-filter: blur(30px) saturate(200%);
      -webkit-backdrop-filter: blur(30px) saturate(200%);
      border: 1px solid var(--glass-border);
      border-radius: 32px;
      box-shadow: var(--card-shadow), inset 0 1px 1px rgba(255, 255, 255, 0.05);
      position: relative;
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    }
    
    .menu-liquid {
      background: rgba(15, 15, 15, 0.9);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid var(--glass-border);
      box-shadow: 0 40px 80px rgba(0,0,0,0.8);
    }

    .shock-click:active { transform: scale(0.96); }
    
    .pulse-gold {
      animation: pulse-gold 3s infinite;
    }
    @keyframes pulse-gold {
      0% { box-shadow: 0 0 0 0 var(--accent-glow); }
      70% { box-shadow: 0 0 0 20px rgba(0, 0, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
    }

    .highlights-container {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding: 10px 5px 25px 5px;
      scroll-snap-type: x mandatory;
      mask-image: linear-gradient(to right, black 85%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    }
    .highlights-container::-webkit-scrollbar { display: none; }
    
    .highlight-item {
      scroll-snap-align: start;
      flex-shrink: 0;
      transition: transform 0.3s ease;
    }
    .highlight-item:active { transform: scale(0.92); }

    .cyber-input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 24px;
      padding: 20px 24px;
      width: 100%;
      outline: none;
      transition: all 0.3s ease;
      font-weight: 600;
    }
    .cyber-input:focus { 
      border-color: var(--accent); 
      background: rgba(255, 255, 255, 0.07);
      box-shadow: 0 0 0 5px var(--accent-glow); 
    }
    
    .founder-glow {
      box-shadow: 0 0 40px rgba(234, 179, 8, 0.15), var(--card-shadow);
      border-color: rgba(234, 179, 8, 0.3);
    }

    .ios-btn {
      transition: all 0.4s cubic-bezier(0.15, 0, 0.2, 1);
    }
    .ios-btn:active { transform: scale(0.9); opacity: 0.7; }

    /* Utilities */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .animate-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div class="liquid-bg"></div>
<div id="root"></div>
<script type="text/babel">
const { useState, useEffect, useRef, useMemo } = React;
const motion = (window.Motion && window.Motion.motion) ? window.Motion.motion : (window.framerMotion && window.framerMotion.motion) ? window.framerMotion.motion : null;
const AnimatePresence = (window.Motion && window.Motion.AnimatePresence) ? window.Motion.AnimatePresence : (window.framerMotion && window.framerMotion.AnimatePresence) ? window.framerMotion.AnimatePresence : React.Fragment;
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : 'https://legacy-academy-backet1.onrender.com/api';

const TRANSLATIONS = {
  en: {
    HOME: 'HOME', SEARCH: 'SEARCH', ALERTS: 'ALERTS', PROFILE: 'PROFILE', SETTINGS: 'SETTINGS', CHAT: 'CHAT',
    LOGOUT: 'DISCONNECT', FOUNDER_PANEL: 'FOUNDER PANEL', LOGIN: 'ENTER SYSTEM', REGISTER: 'CREATE ACCOUNT',
    USERNAME: 'USERNAME', EMAIL: 'EMAIL', PASSWORD: 'PASSWORD', FORGOT: 'FORGOT PASSWORD?',
    POSTS: 'POSTS', FOLLOWERS: 'FOLLOWERS', FOLLOWING: 'FOLLOWING', EDIT: 'EDIT',
    FOLLOW: 'FOLLOW', UNFOLLOW: 'UNFOLLOW', REQUESTED: 'REQUESTED',
    DELETE: 'DELETE', CANCEL: 'CANCEL', SAVE: 'SAVE',
    THEME: 'THEME', NO_NOTIFS: 'NO NEW DIRECTIVES',
    PRIVACY_PUBLIC: 'PUBLIC', PRIVACY_ELITE: 'FOLLOWERS ONLY', PRIVACY_HIDDEN: 'HIDDEN',
    DELETE_ACCOUNT: 'DELETE ACCOUNT', CHANGE_USERNAME: 'CHANGE USERNAME',
    INTEL: 'INTEL', ADD_INTEL: 'ADD INTEL', PUBLISH_INTEL: 'PUBLISH INTEL', GENERATE_INTEL: 'GENERATE INTEL',
    SCANNING: 'SCANNING NETWORK', ZERO_AGENTS: 'ZERO AGENTS DETECTED', RETURN: 'RETURN',
    TRENDING: 'TRENDING NOW', JOIN_ELITE: 'Join the legacy elite.', POPULAR: 'POPULAR TOPICS',
    EXPLORE: 'EXPLORE THE LEGACY...', RESULTS_FOR: 'RESULTS FOR', NO_INTEL: 'No intelligence found',
    UPDATE_IDENTITY: 'UPDATE IDENTITY', DELETE_FOREVER: 'DELETE FOREVER', DANGER_ZONE: 'DANGER ZONE',
    GENERAL: 'GENERAL', APPEARANCE: 'APPEARANCE', ACCOUNT: 'ACCOUNT', COGNITION: 'COGNITION',
    DELETE_AGENT: 'DELETE AGENT', EDIT_INTEL: 'EDIT INTEL', SAVE_CHANGES: 'SAVE CHANGES',
    CONFIRM_DELETE: 'Are you sure? This is permanent.', WAIT_DAYS: 'WAIT {n} DAYS',
    MESSAGES: 'MESSAGES', SECURE_LINE: 'SECURE LINE', ENTER_COMMAND: 'ENTER COMMAND...',
    AWAITING_PROTOCOL: 'Awaiting protocol initialization', SECURE_COMMS: 'SECURE COMMS',
    SYSTEM_CORE: 'SYSTEM CORE', ENCRYPTION_ACTIVE: 'ENCRYPTION ACTIVE', PROTOCOL_VERSION: 'Legacy Protocol v4.0.2',
    ALPHA_ACCESS: 'Level Alpha Access', SECURED_FEED: 'SECURED FEED', RELEASE: 'RELEASE',
    NO_INTEL_FOUND: 'NO INTEL FOUND', TRY_ALT_ENCRYPTION: 'Try alternative encryption keys',
    INTEL_ACTIVITY: 'INTELLIGENCE ACTIVITY', CHECKING_TERMINAL: 'Checking terminal for new directives...',
    LOADING_CORE: 'LOADING COMMAND CENTER...', AGENT: 'AGENT'
  },
  el: {
    HOME: 'ΑΡΧΙΚΗ', SEARCH: 'ΑΝΑΖΗΤΗΣΗ', ALERTS: 'ΕΙΔΟΠΟΙΗΣΕΙΣ', PROFILE: 'ΠΡΟΦΙΛ', SETTINGS: 'ΡΥΘΜΙΣΕΙΣ', CHAT: 'ΣΥΖΗΤΗΣΗ',
    LOGOUT: 'ΑΠΟΣΥΝΔΕΣΗ', FOUNDER_PANEL: 'ΠΑΝΕΛ ΙΔΡΥΤΗ', LOGIN: 'ΕΙΣΟΔΟΣ', REGISTER: 'ΕΓΓΡΑΦΗ',
    USERNAME: 'ΟΝΟΜΑ ΧΡΗΣΤΗ', EMAIL: 'EMAIL', PASSWORD: 'ΚΩΔΙΚΟΣ', FORGOT: 'ΞΕΧΑΣΑΤΕ ΤΟΝ ΚΩΔΙΚΟ;',
    POSTS: 'ΔΗΜΟΣΙΕΥΣΕΙΣ', FOLLOWERS: 'ΑΚΟΛΟΥΘΟΙ', FOLLOWING: 'ΑΚΟΛΟΥΘΕΙ', EDIT: 'ΕΠΕΞΕΡΓΑΣΙΑ',
    FOLLOW: 'ΑΚΟΛΟΥΘΗΣΤΕ', UNFOLLOW: 'ΔΙΑΓΡΑΦΗ', REQUESTED: 'ΣΤΑΛΘΗΚΕ',
    DELETE: 'ΔΙΑΓΡΑΦΗ', CANCEL: 'ΑΚΥΡΩΣΗ', SAVE: 'ΑΠΟΘΗΚΕΥΣΗ',
    THEME: 'ΘΕΜΑ', NO_NOTIFS: 'ΚΑΜΙΑ ΕΙΔΟΠΟΙΗΣΗ',
    PRIVACY_PUBLIC: 'ΔΗΜΟΣΙΟ', PRIVACY_ELITE: 'ΑΚΟΛΟΥΘΟΙ ΜΟΝΟ', PRIVACY_HIDDEN: 'ΚΡΥΦΟ',
    DELETE_ACCOUNT: 'ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ', CHANGE_USERNAME: 'ΑΛΛΑΓΗ ΟΝΟΜΑΤΟΣ',
    INTEL: 'ΠΛΗΡΟΦΟΡΙΕΣ', ADD_INTEL: 'ΠΡΟΣΘΗΚΗ', PUBLISH_INTEL: 'ΔΗΜΟΣΙΕΥΣΗ', GENERATE_INTEL: 'ΔΗΜΙΟΥΡΓΙΑ',
    SCANNING: 'ΑΝΑΖΗΤΗΣΗ ΣΤΟ ΔΙΚΤΥΟ', ZERO_AGENTS: 'ΔΕΝ ΒΡΕΘΗΚΑΝ ΠΡΑΚΤΟΡΕΣ', RETURN: 'ΕΠΙΣΤΡΟΦΗ',
    TRENDING: 'ΤΩΡΑ TRENDING', JOIN_ELITE: 'Γίνε μέλος της ελίτ.', POPULAR: 'ΔΗΜΟΦΙΛΗ ΘΕΜΑΤΑ',
    EXPLORE: 'ΕΞΕΡΕΥΝΗΣΤΕ ΤΟ LEGACY...', RESULTS_FOR: 'ΑΠΟΤΕΛΕΣΜΑΤΑ ΓΙΑ', NO_INTEL: 'Δεν βρέθηκαν πληροφορίες',
    UPDATE_IDENTITY: 'ΕΝΗΜΕΡΩΣΗ ΣΤΟΙΧΕΙΩΝ', DELETE_FOREVER: 'ΟΡΙΣΤΙΚΗ ΔΙΑΓΡΑΦΗ', DANGER_ZONE: 'ΕΠΙΚΙΝΔΥΝΗ ΖΩΝΗ',
    GENERAL: 'ΓΕΝΙΚΑ', APPEARANCE: 'ΕΜΦΑΝΙΣΗ', ACCOUNT: 'ΛΟΓΑΡΙΑΣΜΟΣ', COGNITION: 'ΓΝΩΣΗ',
    DELETE_AGENT: 'ΔΙΑΓΡΑΦΗ ΠΡΑΚΤΟΡΑ', EDIT_INTEL: 'ΕΠΕΞΕΡΓΑΣΙΑ', SAVE_CHANGES: 'ΑΠΟΘΗΚΕΥΣΗ',
    CONFIRM_DELETE: 'Είστε σίγουροι; Αυτό είναι μόνιμο.', WAIT_DAYS: 'ΠΕΡΙΜΕΝΕΤΕ {n} ΜΕΡΕΣ',
    MESSAGES: 'ΜΗΝΥΜΑΤΑ', SECURE_LINE: 'ΑΣΦΑΛΗΣ ΓΡΑΜΜΗ', ENTER_COMMAND: 'ΕΙΣΑΓΕΤΕ ΕΝΤΟΛΗ...',
    AWAITING_PROTOCOL: 'Αναμονή αρχικοποίησης πρωτοκόλλου', SECURE_COMMS: 'ΑΣΦΑΛΕΙΣ ΕΠΙΚΟΙΝΩΝΙΕΣ',
    SYSTEM_CORE: 'ΠΥΡΗΝΑΣ ΣΥΣΤΗΜΑΤΟΣ', ENCRYPTION_ACTIVE: 'ΚΡΥΠΤΟΓΡΑΦΗΣΗ ΕΝΕΡΓΗ', PROTOCOL_VERSION: 'Πρωτόκολλο Legacy v4.0.2',
    ALPHA_ACCESS: 'Πρόσβαση Επιπέδου Alpha', SECURED_FEED: 'ΑΣΦΑΛΗΣ ΡΟΗ', RELEASE: 'ΑΠΟΔΕΣΜΕΥΣΗ',
    NO_INTEL_FOUND: 'ΔΕΝ ΒΡΕΘΗΚΑΝ ΠΛΗΡΟΦΟΡΙΕΣ', TRY_ALT_ENCRYPTION: 'Δοκιμάστε εναλλακτικά κλειδιά',
    INTEL_ACTIVITY: 'ΔΡΑΣΤΗΡΙΟΤΗΤΑ ΠΛΗΡΟΦΟΡΙΩΝ', CHECKING_TERMINAL: 'Έλεγχος τερματικού για οδηγίες...',
    LOADING_CORE: 'ΦΟΡΤΩΣΗ ΚΕΝΤΡΟΥ ΕΛΕΓΧΟΥ...', AGENT: 'ΠΡΑΚΤΟΡΑΣ'
  },
  cy: {
    HOME: 'ΑΡΧΙΚΗ', SEARCH: 'ΨΑΞΙΜΟ', ALERTS: 'MISHISHIA', PROFILE: 'ΠΡΟΦΙΛ', SETTINGS: 'ΡΥΘΜΙΣΕΙΣ', CHAT: 'ΚΟΥΒΕΝΤΑ',
    LOGOUT: 'ΦΕΥΚΩ', FOUNDER_PANEL: 'PANEL TATE', LOGIN: 'EMPA MESA', REGISTER: 'ENGRAPHU',
    USERNAME: 'ONOMA', EMAIL: 'EMAIL', PASSWORD: 'KODIKOS', FORGOT: 'EN THIMASE?',
    POSTS: 'POSTS', FOLLOWERS: 'FOLLOWERS', FOLLOWING: 'FOLLOWING', EDIT: 'ALLAXE TO',
    FOLLOW: 'AKOLUTHA', UNFOLLOW: 'STOP', REQUESTED: 'ESTILES',
    DELETE: 'SVISTO', CANCEL: 'AKYRO', SAVE: 'FULA KATO',
    THEME: 'XRWMA', NO_NOTIFS: 'TIPOTA RE',
    PRIVACY_PUBLIC: 'ULOI', PRIVACY_ELITE: 'MONO AKOLUTHI', PRIVACY_HIDDEN: 'KRYMENO',
    DELETE_ACCOUNT: 'SVISE PROFIL', CHANGE_USERNAME: 'ALLAXE ONOMA',
    INTEL: 'INTEL', ADD_INTEL: 'VALE POST', PUBLISH_INTEL: 'VALTO', GENERATE_INTEL: 'KAMETO',
    SCANNING: 'PSAXNO PANTU', ZERO_AGENTS: 'EN ESXI KANEΝΑ', RETURN: 'PISW',
    TRENDING: 'TRENDING TORA', JOIN_ELITE: 'Ela me tous pextes.', POPULAR: 'TOP THEΜΑΤΑ',
    EXPLORE: 'PSAXE TO LEGACY...', RESULTS_FOR: 'EVRIKA GIA', NO_INTEL: 'Tipota re pexti',
    UPDATE_IDENTITY: 'ALLAXE ONOMA', DELETE_FOREVER: 'SVISE TA OULLA', DANGER_ZONE: 'PROSOXΗ',
    GENERAL: 'GENIKA', APPEARANCE: 'XRWMATA', ACCOUNT: 'ESY', COGNITION: 'GLOSSA',
    DELETE_AGENT: 'SVISE TON', EDIT_INTEL: 'DIORTHOSE TO', SAVE_CHANGES: 'OK',
    CONFIRM_DELETE: 'Sigura? Svinonte oulla.', WAIT_DAYS: 'PERIMENE {n} MERES',
    MESSAGES: 'MESSAGES', SECURE_LINE: 'SECURE LINE', ENTER_COMMAND: 'VALE ENTOLES...',
    AWAITING_PROTOCOL: 'Perimene t lio', SECURE_COMMS: 'SECURE COMMS',
    SYSTEM_CORE: 'SYSTEM CORE', ENCRYPTION_ACTIVE: 'KRYPTOGRAPHIA ON', PROTOCOL_VERSION: 'Protocol v4.0.2',
    ALPHA_ACCESS: 'Level Alpha', SECURED_FEED: 'SECURED FEED', RELEASE: 'AFISTO',
    NO_INTEL_FOUND: 'TIPOTA EN IVRIKA', TRY_ALT_ENCRYPTION: 'Dokimase allo tropo',
    INTEL_ACTIVITY: 'INTEL ACTIVITY', CHECKING_TERMINAL: 'Vlepw to terminal...',
    LOADING_CORE: 'LOADING COMMAND CENTER...', AGENT: 'PEXTIS'
  },
  de: {
    HOME: 'STARTSEITE', SEARCH: 'SUCHE', ALERTS: 'ALARME', PROFILE: 'PROFIL', SETTINGS: 'EINSTELLUNGEN', CHAT: 'CHAT',
    LOGOUT: 'ABMELDEN', FOUNDER_PANEL: 'GRÜNDER PANEL', LOGIN: 'ANMELDEN', REGISTER: 'REGISTRIEREN',
    USERNAME: 'BENUTZERNAME', EMAIL: 'E-MAIL', PASSWORD: 'PASSWORT', FORGOT: 'PASSWORT VERGESSEN?',
    POSTS: 'BEITRÄGE', FOLLOWER: 'FOLLOWER', FOLLOWING: 'GEFOLGT', EDIT: 'BEARBEITEN',
    FOLLOW: 'FOLGEN', UNFOLLOW: 'ENTFOLGEN', REQUESTED: 'ANGEFRAGT',
    DELETE: 'LÖSCHEN', CANCEL: 'ABBRECHEN', SAVE: 'SPEICHERN',
    THEME: 'THEMA', NO_NOTIFS: 'KEINE NACHRICHTEN',
    PRIVACY_PUBLIC: 'ÖFFENTLICH', PRIVACY_ELITE: 'NUR FOLLOWER', PRIVACY_HIDDEN: 'VERSTECKT',
    DELETE_ACCOUNT: 'KONTO LÖSCHEN', CHANGE_USERNAME: 'NAME ÄNDERN',
    INTEL: 'INTEL', ADD_INTEL: 'INTEL HINZUFÜGEN', PUBLISH_INTEL: 'VERÖFFENTLICHEN', GENERATE_INTEL: 'ERSTELLEN',
    SCANNING: 'NETZWERK SQUANNEN', ZERO_AGENTS: 'KEINE AGENTEN GEFUNDEN', RETURN: 'ZURÜCK',
    TRENDING: 'TRENDING JETZT', JOIN_ELITE: 'Werde Teil der Elite.', POPULAR: 'BELIEBTE THEMEN',
    EXPLORE: 'LEGACY ERKUNDEN...', RESULTS_FOR: 'ERGEBNISSE FÜR', NO_INTEL: 'Keine Intel gefunden',
    UPDATE_IDENTITY: 'IDENTITÄT AKTUALISIEREN', DELETE_FOREVER: 'ENDGÜLTIG LÖSCHEN', DANGER_ZONE: 'GEFAHRENZONE',
    GENERAL: 'ALLGEMEIN', APPEARANCE: 'AUSSEHEN', ACCOUNT: 'KONTO', COGNITION: 'KOGNITION',
    DELETE_AGENT: 'AGENT LÖSCHEN', EDIT_INTEL: 'BEARBEITEN', SAVE_CHANGES: 'SPEICHERN',
    CONFIRM_DELETE: 'Bist du sicher? Das ist endgültig.', WAIT_DAYS: 'WARTEN {n} TAGE',
    MESSAGES: 'NACHRICHTEN', SECURE_LINE: 'SICHERE LEITUNG', ENTER_COMMAND: 'BEFEHL EINGEBEN...',
    AWAITING_PROTOCOL: 'Warten auf Protokollinitialisierung', SECURE_COMMS: 'SICHERE KOMMUNIKATION',
    SYSTEM_CORE: 'SYSTEMKERN', ENCRYPTION_ACTIVE: 'VERSCHLÜSSELUNG AKTIV', PROTOCOL_VERSION: 'Legacy Protokoll v4.0.2',
    ALPHA_ACCESS: 'Alpha-Level-Zugriff', SECURED_FEED: 'SICHERER FEED', RELEASE: 'FREIGEBEN',
    NO_INTEL_FOUND: 'KEINE INTEL GEFUNDEN', TRY_ALT_ENCRYPTION: 'Alternative Schlüssel versuchen',
    INTEL_ACTIVITY: 'INTEL-AKTIVITÄT', CHECKING_TERMINAL: 'Terminal auf Anweisungen prüfen...',
    LOADING_CORE: 'KOMMANDOZENTRALE LÄDT...', AGENT: 'AGENT'
  },
  fr: {
    HOME: 'ACCUEIL', SEARCH: 'RECHERCHE', ALERTS: 'ALERTE', PROFILE: 'PROFIL', SETTINGS: 'PARAMÈTRES', CHAT: 'CHAT',
    LOGOUT: 'DÉCONNEXION', FOUNDER_PANEL: 'PANNEAU FONDATEUR', LOGIN: 'CONNEXION', REGISTER: 'INSCRIPTION',
    USERNAME: "NOM D'UTILISATEUR", EMAIL: 'EMAIL', PASSWORD: 'MOT DE PASSE', FORGOT: 'OUBLIÉ?',
    POSTS: 'POSTS', FOLLOWERS: 'ABONNÉS', FOLLOWING: 'ABONNEMENTS', EDIT: 'MODIFIER',
    FOLLOW: 'SUIVRE', UNFOLLOW: 'NE PLUS SUIVRE', REQUESTED: 'DEMANDÉ',
    DELETE: 'SUPPRIMER', CANCEL: 'ANNULER', SAVE: 'ENREGISTRER',
    THEME: 'THÈME', NO_NOTIFS: 'AUCUNE NOTIFICATION',
    PRIVACY_PUBLIC: 'PUBLIC', PRIVACY_ELITE: 'ABONNÉS SEULEMENT', PRIVACY_HIDDEN: 'CACHÉ',
    DELETE_ACCOUNT: 'SUPPRIMER COMPTE', CHANGE_USERNAME: 'CHANGER NOM',
    INTEL: 'INTEL', ADD_INTEL: 'AJOUTER INTEL', PUBLISH_INTEL: 'PUBLIER', GENERATE_INTEL: 'GÉNÉRER',
    SCANNING: 'SCAN DU RÉSEAU', ZERO_AGENTS: 'AUCUN AGENT DÉTECTÉ', RETURN: 'RETOUR',
    TRENDING: 'TENDANCE', JOIN_ELITE: "Rejoignez l'élite.", POPULAR: 'SUJETS POPULAIRES',
    EXPLORE: 'EXPLOREZ LEGACY...', RESULTS_FOR: 'RÉSULTATS POUR', NO_INTEL: 'Aucune intel trouvée',
    UPDATE_IDENTITY: 'METTRE À JOUR', DELETE_FOREVER: 'SUPPRIMER DÉFINITIVEMENT', DANGER_ZONE: 'ZONE DE DANGER',
    GENERAL: 'GÉNÉRAL', APPEARANCE: 'APPARENCE', ACCOUNT: 'COMPTE', COGNITION: 'COGNITION',
    DELETE_AGENT: 'SUPPRIMER AGENT', EDIT_INTEL: 'MODIFIER', SAVE_CHANGES: 'ENREGISTRER',
    CONFIRM_DELETE: "Êtes-vous sûr ? C'est irréversible.", WAIT_DAYS: 'ATTENDRE {n} JOURS',
    MESSAGES: 'MESSAGES', SECURE_LINE: 'LIGNE SÉCURISÉE', ENTER_COMMAND: 'ENTRER COMMANDE...',
    AWAITING_PROTOCOL: 'Attente initialisation protocole', SECURE_COMMS: 'COMMS SÉCURISÉES',
    SYSTEM_CORE: 'CŒUR DU SYSTÈME', ENCRYPTION_ACTIVE: 'CHIFFREMENT ACTIF', PROTOCOL_VERSION: 'Protocole Legacy v4.0.2',
    ALPHA_ACCESS: 'Accès Niveau Alpha', SECURED_FEED: 'FLUX SÉCURISÉ', RELEASE: 'LIBÉRER',
    NO_INTEL_FOUND: 'AUCUNE INTEL TROUVÉE', TRY_ALT_ENCRYPTION: "Essayer d'autres clés",
    INTEL_ACTIVITY: 'ACTIVITÉ DU RENSEIGNEMENT', CHECKING_TERMINAL: 'Vérification du terminal...',
    LOADING_CORE: 'CHARGEMENT DU CENTRE DE COMMANDE...', AGENT: 'AGENT'
  },
  es: {
    HOME: 'INICIO', SEARCH: 'BUSCAR', ALERTS: 'ALERTAS', PROFILE: 'PERFIL', SETTINGS: 'AJUSTES', CHAT: 'CHAT',
    LOGOUT: 'DESCONECTAR', FOUNDER_PANEL: 'PANEL FUNDADOR', LOGIN: 'ENTRAR', REGISTER: 'REGISTRO',
    USERNAME: 'USUARIO', EMAIL: 'EMAIL', PASSWORD: 'CONTRASEÑA', FORGOT: '¿OLVIDADO?',
    POSTS: 'PUBLICACIONES', FOLLOWERS: 'SEGUIDORES', FOLLOWING: 'SIGUIENDO', EDIT: 'EDITAR',
    FOLLOW: 'SEGUIR', UNFOLLOW: 'DEJAR DE SEGUIR', REQUESTED: 'SOLICITADO',
    DELETE: 'ELIMINAR', CANCEL: 'CANCELAR', SAVE: 'GUARDAR',
    THEME: 'TEMA', NO_NOTIFS: 'SIN NOTIFICACIONES',
    PRIVACY_PUBLIC: 'PÚBLICO', PRIVACY_ELITE: 'SOLO SEGUIDORES', PRIVACY_HIDDEN: 'OCULTO',
    DELETE_ACCOUNT: 'BORRAR CUENTA', CHANGE_USERNAME: 'CAMBIAR NOMBRE',
    INTEL: 'INTEL', ADD_INTEL: 'AÑADIR INTEL', PUBLISH_INTEL: 'PUBLICAR', GENERATE_INTEL: 'GENERAR',
    SCANNING: 'ESCANEO DE RED', ZERO_AGENTS: 'NO SE DETECTΑΝ AGENTES', RETURN: 'VOLVER',
    TRENDING: 'TENDENCIAS', JOIN_ELITE: 'Únete a la élite.', POPULAR: 'TEMAS POPULARES',
    EXPLORE: 'EXPLORA EL LEGADO...', RESULTS_FOR: 'RESULTADOS PARA', NO_INTEL: 'No se encontró intel',
    UPDATE_IDENTITY: 'ACTUALIZAR IDENTIDAD', DELETE_FOREVER: 'ELIMINAR PARA SIEMPRE', DANGER_ZONE: 'ZONA DE PELIGRO',
    GENERAL: 'GENERAL', APPEARANCE: 'APARIENCIA', ACCOUNT: 'CUENTA', COGNITION: 'COGNICIÓN',
    DELETE_AGENT: 'ELIMINAR AGENTE', EDIT_INTEL: 'EDITAR', SAVE_CHANGES: 'GUARDAR',
    CONFIRM_DELETE: '¿Estás seguro? Es permanente.', WAIT_DAYS: 'ESPERAR {n} DÍAS',
    MESSAGES: 'MENSAJES', SECURE_LINE: 'LÍNEA SEGURA', ENTER_COMMAND: 'INTRODUCIR COMANDO...',
    AWAITING_PROTOCOL: 'Esperando inicialización de protocolo', SECURE_COMMS: 'COMUNICACIONES SEGURAS',
    SYSTEM_CORE: 'NÚCLEO DEL SISTEMA', ENCRYPTION_ACTIVE: 'CIFRADO ACTIVO', PROTOCOL_VERSION: 'Protocolo Legacy v4.0.2',
    ALPHA_ACCESS: 'Acceso Nivel Alpha', SECURED_FEED: 'FEED SEGURO', RELEASE: 'LIBERAR',
    NO_INTEL_FOUND: 'NO SE ENCONTRÓ INTEL', TRY_ALT_ENCRYPTION: 'Prueba otras claves',
    INTEL_ACTIVITY: 'ACTIVIDAD DE INTELIGENCIA', CHECKING_TERMINAL: 'Comprobando terminal...',
    LOADING_CORE: 'CARGANDO CENTRO DE MANDO...', AGENT: 'AGENTE'
  }
};

const useTranslation = (user) => {
  const lang = user?.settings?.language || localStorage.getItem('language') || 'en';
  const t = (key, params = {}) => {
    let text = TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
    Object.keys(params).forEach(p => {
      text = text.replace('{' + p + '}', params[p]);
    });
    return text;
  };
  return { t, lang };
};



// Initialize sound enabled from localStorage
window.SOUND_ENABLED = localStorage.getItem('soundEnabled') !== 'false';

const playSound = (type) => {
  // Check if sound is enabled
  if (!window.SOUND_ENABLED) return;
  
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Sword Swish / Click
  if (type === 'pop' || type === 'click') {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2400, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.08);
  }
  
  // Sword Whoosh / Swipe
  else if (type === 'whoosh' || type === 'swipe') {
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1);
    filter.Q.value = 2;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }
  
  // Sword Strike / Delete
  else if (type === 'delete' || type === 'strike') {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(600, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  }
  
  // Magic / Success
  else if (type === 'magic' || type === 'success') {
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 200, ctx.currentTime + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(800 + i * 300, ctx.currentTime + i * 0.08 + 0.15);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    }
  }
  
  // Error / Block
  else if (type === 'error') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
};

const explodeEffect = () => confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 }, colors: ['#ff4444', '#ff6666', '#ffd700'], gravity: 1.2, scalar: 0.9 });

const Icons = {
  Menu: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" x2="20" y1="7" y2="7"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="17" y2="17"/></svg>,
  X: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Plus: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Heart: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.7 7.8l1.1 1 7.7 7.8 7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>,
  Comment: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>,
  Trash: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Search: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Image: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  Shield: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
  Settings: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Logout: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>,
  ThumbDown: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>,
  User: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Users: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Back: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Grid: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Home: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  MessageCircle: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>,
  Bell: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Mail: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Lock: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Zap: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  Globe: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Camera: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Volume2: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  ChevronRight: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="hashtag text-yellow-500 font-bold">{part}</span> : part) : text;

// User List Component (Followers/Following)
const UserList = ({ userId, type = 'followers', onViewProfile, currentUser }) => {
  const { t } = useTranslation(currentUser);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      try {
        const endpoint = type === 'following' ? '/following' : '/followers';
        const res = await axios.get(API + '/users/' + userId + endpoint, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
        setList(res.data);
      } catch(e) { console.error("Network sync failed:", e); }
      setLoading(false);
    };
    fetchUsers();
  }, [userId, type]);

  if (loading) return <div className="text-center py-10"><div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-2" /><span className="text-gray-500 text-[10px] font-black tracking-widest uppercase">{t('SCANNING')}</span></div>;
  if (list.length === 0) return <div className="text-center py-20 opacity-30"><Icons.Users className="w-12 h-12 mx-auto mb-4" /><p className="text-[10px] text-gray-400 font-black tracking-[0.4em] italic uppercase">{t('ZERO_AGENTS')}</p></div>;

  return (
    <div className="space-y-3">
      {list.map(u => (
        <button key={u._id} onClick={() => { playSound('pop'); onViewProfile(u); }} className="w-full p-5 glass-3d flex items-center gap-4 hover:border-yellow-500/30 active:scale-95 transition-all border-none group">
          <div className={"w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 shadow-2xl overflow-hidden transition-transform group-hover:scale-105 " + (u.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-tr from-gray-800 to-black border-white/5')}>
            {u.profilePic ? <img src={u.profilePic.replaceAll('\\\\', '/')} className="w-full h-full object-cover" alt={u.username} /> : u.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2"><span className="font-black italic text-white tracking-tight">{u.username.toUpperCase()}</span>{u.role === 'Founder' && <Icons.Shield className="w-4 h-4 text-yellow-500" />}</div>
            <span className="text-[9px] text-yellow-500/50 font-black tracking-[0.2em] uppercase">{u.role || 'AGENT'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-yellow-500/10 transition-colors">
            <Icons.ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-500" />
          </div>
        </button>
      ))}
    </div>
  );
};

// Profile Modal - Enhanced Privacy & Tabs
const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers, onViewProfile, onUpdate }) => {
  const { t } = useTranslation(currentUser);
  const [tab, setTab] = useState('posts'); 
  const [following, setFollowing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isRequested, setIsRequested] = useState(false);
  const userPosts = posts.filter(p => p.username === profileUser?.username);
  const isOwnProfile = profileUser?.username === currentUser?.username;
  const isFounder = (currentUser?.role === 'Founder');

  useEffect(() => {
    if (profileUser?.username) {
      fetchUserData();
      setTab('posts'); 
    }
  }, [profileUser]);

  const fetchUserData = async () => {
    try {
      const res = await axios.get(API + '/users/username/' + profileUser.username);
      setUserData(res.data);
      const currentId = currentUser?._id || currentUser?.id;
      setFollowing(res.data.followers?.includes(currentId));
      setIsRequested(res.data.followRequests?.includes(currentId));
    } catch(e) { setUserData(profileUser); }
  };

  const handleFollow = async () => {
    if (!userData?._id) return;
    playSound('pop');
    try {
      const res = await axios.put(API + '/users/' + userData._id + '/follow', {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      if (res.data.isFollowing !== undefined) setFollowing(res.data.isFollowing);
      if (res.data.isRequested !== undefined) setIsRequested(res.data.isRequested);
      
      if (res.data.isFollowing) {
        setUserData({...userData, followers: [...(userData.followers || []), currentUser?._id]});
        confetti({particleCount:30,spread:50});
      } else if (res.data.isFollowing === false) {
        setUserData({...userData, followers: (userData.followers || []).filter(f => f !== currentUser?._id)});
      }
    } catch(e) {}
  };

  const handleDeleteAgent = async () => {
    if (!confirm(t('CONFIRM_DELETE'))) return;
    playSound('delete');
    try {
      await axios.delete(API + '/users/' + userData._id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      onClose();
      if (onUpdate) onUpdate();
      confetti({ particleCount: 100, colors: ['#ff0000', '#000000'] });
    } catch(e) { alert('Unauthorized'); }
  };

  const profileFileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    playSound('whoosh');
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await axios.post(API + '/users/profile-pic', fd, { 
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'multipart/form-data' }
      });
      if (isOwnProfile) {
        localStorage.setItem('user', JSON.stringify(res.data));
        setUserData(res.data);
      }
      playSound('magic');
      confetti({ particleCount: 50, spread: 60 });
    } catch(e) { alert('UPLOAD FAILED'); }
    setUploading(false);
  };

  const isPrivate = userData?.isPrivate;
  const isElite = userData?.isFollowersOnly;
  const canView = isOwnProfile || following || isFounder || (!isPrivate && !isElite);

  if (!isOpen || !profileUser) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" />
      <motion.div 
        initial={{opacity:0,y:100}} 
        animate={{opacity:1,y:0}} 
        exit={{opacity:0,y:100}}
        transition={{type:'spring',damping:25,stiffness:300}}
        className="fixed inset-x-0 bottom-0 top-16 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl sm:top-[5%] sm:bottom-[5%] menu-liquid z-[101] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl border-none"
      >
        <div className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4 border-b border-white/5 bg-black/40 backdrop-blur-2xl shrink-0">
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all"><Icons.Back className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" /></button>
          <div className="flex-1">
            <span className="font-black italic tracking-tighter text-base sm:text-lg block">{profileUser.username.toUpperCase()}</span>
            {isPrivate && <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">🔒 {t('PRIVACY_HIDDEN')}</span>}
            {isElite && !isPrivate && <span className="text-[9px] sm:text-[10px] text-yellow-500 font-bold flex items-center gap-1 mt-0.5"><Icons.Shield className="w-3 h-3"/> {t('PRIVACY_ELITE')}</span>}
          </div>
          {(userData?.role || profileUser.role) === 'Founder' && <Icons.Shield className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />}
        </div>
        
        <div className="p-6 sm:p-8 text-center border-b border-white/5 bg-white/5 backdrop-blur-3xl shrink-0">
          <div 
            onClick={() => isOwnProfile && profileFileRef.current?.click()}
            className={"w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full flex items-center justify-center text-3xl sm:text-4xl font-black shadow-2xl mb-4 sm:mb-6 relative group overflow-hidden border-2 " + (isOwnProfile ? 'cursor-pointer hover:border-yellow-500' : 'border-transparent') + " " + ((userData?.role || profileUser.role) === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500')}
          >
             {userData?.profilePic || profileUser.profilePic ? (
               <img src={(userData?.profilePic || profileUser.profilePic).replaceAll('\\\\', '/')} className="w-full h-full object-cover" alt={profileUser.username} />
             ) : (
               profileUser.username?.[0]?.toUpperCase()
             )}
             
             {isOwnProfile && (
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 {uploading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icons.Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" />}
               </div>
             )}
             <input type="file" ref={profileFileRef} hidden accept="image/*" onChange={handleProfilePicUpload} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter flex items-center justify-center gap-2 flex-wrap">
            {profileUser.username.toUpperCase()}
            {(userData?.role || profileUser.role) === 'Founder' && <span className="px-2 sm:px-3 py-1 bg-yellow-500/20 rounded-lg sm:rounded-xl text-yellow-500 text-[9px] sm:text-[10px] font-black tracking-widest border border-yellow-500/30 uppercase">{t('FOUNDER_PANEL')}</span>}
          </h2>
          <p className="text-gray-500 text-[10px] sm:text-xs font-bold mt-1 sm:mt-2 tracking-widest uppercase">{userData?.role || profileUser.role || 'AGENT'}</p>
          
          <div className="flex justify-center gap-6 sm:gap-10 mt-6 sm:mt-8">
            <div onClick={() => setTab('posts')} className="text-center group cursor-pointer"><span className="font-black text-lg sm:text-xl block group-hover:scale-110 transition-transform">{userPosts.length}</span><p className="text-[8px] sm:text-[9px] text-gray-500 font-black tracking-widest uppercase">{t('POSTS')}</p></div>
            <div onClick={() => setTab('followers')} className="text-center group cursor-pointer"><span className="font-black text-lg sm:text-xl block group-hover:scale-110 transition-transform">{userData?.followers?.length || 0}</span><p className="text-[8px] sm:text-[9px] text-gray-500 font-black tracking-widest uppercase">{t('FOLLOWERS')}</p></div>
            <div onClick={() => setTab('following')} className="text-center group cursor-pointer"><span className="font-black text-lg sm:text-xl block group-hover:scale-110 transition-transform">{userData?.following?.length || 0}</span><p className="text-[8px] sm:text-[9px] text-gray-500 font-black tracking-widest uppercase">{t('FOLLOWING')}</p></div>
          </div>
          
          <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3">
            {!isOwnProfile && (
              <>
                <button onClick={handleFollow}
                  className={"flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm tracking-widest transition-all shadow-xl " + (following ? 'bg-white/5 border border-white/10 text-gray-400' : isRequested ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500' : 'bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-800 text-black shadow-yellow-500/20')}>
                  {following ? t('UNFOLLOW') : isRequested ? t('REQUESTED') : t('FOLLOW')}
                </button>
                <button className="px-4 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                  <Icons.MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            )}
            {isFounder && !isOwnProfile && (
              <button 
                onClick={handleDeleteAgent}
                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs tracking-[0.2em] bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase"
              >
                {t('DELETE_AGENT')}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex p-2 bg-black/20 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={() => setTab('posts')} className={"flex-1 p-2 sm:p-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl transition-all font-black text-[9px] sm:text-[10px] tracking-widest whitespace-nowrap " + (tab === 'posts' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5')}>
            <Icons.Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('POSTS')}
          </button>
          <button onClick={() => setTab('followers')} className={"flex-1 p-2 sm:p-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl transition-all font-black text-[9px] sm:text-[10px] tracking-widest whitespace-nowrap " + (tab === 'followers' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5')}>
            <Icons.Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('FOLLOWERS')}
          </button>
          <button onClick={() => setTab('following')} className={"flex-1 p-2 sm:p-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl transition-all font-black text-[9px] sm:text-[10px] tracking-widest whitespace-nowrap " + (tab === 'following' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5')}>
            <Icons.User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('FOLLOWING')}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
          {!canView ? (
            <div className="text-center py-16 sm:py-20 px-6 sm:px-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-2xl sm:text-3xl">
                {isPrivate ? '🔒' : <Icons.Shield className="w-8 h-8 text-yellow-500" />}
              </div>
              <p className="text-sm sm:text-base font-black italic tracking-tight mb-2 uppercase">{isPrivate ? t('PRIVACY_HIDDEN') : t('PRIVACY_ELITE')}</p>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{isPrivate ? 'Follow to see their posts and circle intel.' : 'This intellligence is restricted to elite followers.'}</p>
            </div>
          ) : (
            <>
              {tab === 'posts' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {userPosts.map(post => (
                    <div key={post._id} className="aspect-square bg-white/5 rounded-lg sm:rounded-[20px] overflow-hidden border border-white/5 hover:scale-105 transition-transform cursor-pointer group relative">
                      {post.image ? <img src={post.image} className="w-full h-full object-cover" alt="Post" /> : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] sm:text-[10px] text-gray-500 font-bold p-2 sm:p-3 text-center uppercase tracking-tighter leading-tight">{post.title || post.desc?.slice(0,30)}</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-0.5 sm:gap-1"><Icons.Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-white" /> <span className="text-[9px] sm:text-[10px] font-black">{post.likes?.length || 0}</span></div>
                      </div>
                    </div>
                  ))}
                  {userPosts.length === 0 && <p className="col-span-2 sm:col-span-3 text-center py-16 sm:py-20 text-gray-600 font-black italic tracking-widest text-xs uppercase">{t('NO_INTEL')}</p>}
                </div>
              )}
              {tab === 'followers' && (
                <UserList userId={userData?._id || profileUser._id} type="followers" onViewProfile={onViewProfile} currentUser={currentUser} />
              )}
              {tab === 'following' && (
                <UserList userId={userData?._id || profileUser._id} type="following" onViewProfile={onViewProfile} currentUser={currentUser} />
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Search Modal with Users
const SearchModal = ({ isOpen, onClose, users, onViewProfile, currentUser }) => {
  const [query, setQuery] = useState('');
  const filtered = users.filter(u => {
    const matchesQuery = u.username?.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    
    // Privacy Logic: HIDDEN users only show to followers or themselves
    if (u.isPrivate) {
      const isMe = u._id === currentUser?._id || u.id === currentUser?.id;
      const isFollowing = u.followers?.includes(currentUser?._id || currentUser?.id);
      return isMe || isFollowing;
    }
    return true;
  });
  
  if (!isOpen) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" />
      <motion.div initial={{opacity:0,y:-50}} animate={{opacity:1,y:0}} className="fixed inset-x-4 top-20 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg glass-3d p-4 z-[101] max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-full px-4 py-3 border border-white/10">
            <Icons.Search className="w-5 h-5 text-gray-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users..." autoFocus className="flex-1 bg-transparent outline-none" />
          </div>
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2"><Icons.X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.map((u, i) => (
            <button key={i} onClick={() => { playSound('pop'); onViewProfile(u); onClose(); }} className="w-full p-3 bg-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition">
              <div className={"w-12 h-12 rounded-full flex items-center justify-center font-bold " + (u.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-purple-500 to-pink-500')}>
                {u.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5"><span className="font-semibold">{u.username}</span>{u.role === 'Founder' && <Icons.Shield className="w-3.5 h-3.5 text-yellow-500" />}</div>
                <span className="text-xs text-gray-500">{u.role || 'Member'}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center py-10 text-gray-500">No users found</p>}
        </div>
      </motion.div>
    </>
  );
};

const PostCard = React.forwardRef(({ post, user, onDelete, onViewProfile, onUpdate }, ref) => {
  const { t } = useTranslation(user);
  const userId = user?._id || user?.id;
  const [liked, setLiked] = useState(post.likes?.includes(userId));
  const [disliked, setDisliked] = useState(post.dislikes?.includes(userId));
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [dislikes, setDislikes] = useState(post.dislikes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isFounder = user?.role === 'Founder';
  const canDelete = isFounder || post.username === user?.username;

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: post.title || '', desc: post.desc || '', visibility: post.visibility || 'public' });
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const editFileRef = useRef();

  const handleLike = async () => {
    playSound('pop');
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(l => newLiked ? l + 1 : l - 1);
    try {
      const r = await axios.put(API + '/posts/' + post._id + '/like', {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      if (newLiked && isFounder) confetti({ particleCount: 50, spread: 60, colors: ['#ffd700', '#ff8c00'] });
      if (onUpdate) onUpdate(r.data);
    } catch(e) { 
      setLiked(!newLiked);
      setLikes(l => !newLiked ? l + 1 : l - 1);
    }
  };

  const handleDislike = async () => {
    playSound('pop');
    const newDisliked = !disliked;
    setDisliked(newDisliked);
    setDislikes(d => newDisliked ? d + 1 : d - 1);
    try { await axios.put(API + '/posts/' + post._id + '/dislike', {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }}); } catch(e) {
      setDisliked(!newDisliked);
      setDislikes(d => !newDisliked ? d + 1 : d - 1);
    }
  };

  const handleDelete = async () => { if (!confirm(t('CONFIRM_DELETE'))) return; setDeleting(true); playSound('delete'); explodeEffect(); try { await axios.delete(API + '/posts/' + post._id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }); setTimeout(() => onDelete(post._id), 500); } catch (e) { setDeleting(false); } };

  const handleSaveEdit = async () => {
    playSound('whoosh');
    const fd = new FormData();
    fd.append('title', editForm.title);
    fd.append('desc', editForm.desc);
    fd.append('visibility', editForm.visibility);
    if (editFile) fd.append('image', editFile);

    try {
      const res = await axios.put(API + '/posts/' + post._id, fd, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'multipart/form-data' }
      });
      setIsEditing(false);
      playSound('magic');
      if (onUpdate) onUpdate(res.data);
      // Force refresh data in local state or parent
      location.reload(); // Simplest way to ensure all components sync
    } catch(e) { alert('Update failed'); }
  };

  const deleteComment = async (commentId) => {
    playSound('delete'); explodeEffect();
    try {
      await axios.delete(API + '/posts/' + post._id + '/comment/' + commentId, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      setComments(comments.filter(c => c._id !== commentId));
    } catch(e) {}
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const text = newComment;
    setNewComment('');
    playSound('whoosh');
    try {
      const res = await axios.post(API + '/posts/' + post._id + '/comment', { text }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      setComments(res.data);
    } catch(e) {
      setNewComment(text);
      alert(e.response?.data || 'Intel rejected by policy.');
    }
  };

  return (
    <motion.div 
      ref={ref} 
      initial={{opacity:0, y:30}} 
      animate={{opacity:1, y:0}} 
      exit={{opacity:0, scale:0.9, y:20}} 
      className={"glass-3d mb-6 overflow-hidden " + (post.role === 'Founder' ? 'founder-glow' : '') + (deleting ? ' explode' : '')}
    >
      <div className="p-4 flex items-center justify-between bg-black/5">
        <button onClick={() => onViewProfile({ username: post.username, role: post.role })} className="flex items-center gap-3 hover:opacity-80 transition min-w-0 flex-1">
          <div className={"w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 " + (post.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-gray-700 to-black border border-white/10')}>
            {post.profilePic ? <img src={post.profilePic} className="w-full h-full object-cover rounded-xl" /> : (post.username?.[0]?.toUpperCase())}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-black italic tracking-tight text-white truncate">{post.username}</span>
              {post.role === 'Founder' && <Icons.Shield className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </button>
        <div className="flex gap-2">
           {canDelete && !isEditing && (
             <button onClick={() => setIsEditing(true)} className="w-10 h-10 bg-white/5 rounded-full text-gray-400 hover:text-white flex items-center justify-center transition-all">
               <Icons.Settings className="w-4 h-4" />
             </button>
           )}
           {canDelete && (
             <button 
               onClick={handleDelete} 
               className="delete-btn flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all"
             >
               <Icons.Trash className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>

      {isEditing ? (
        <div className="p-6 space-y-4 bg-white/5 border-y border-white/5">
           <input 
             className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-yellow-500/50"
             placeholder={t('TITLE')}
             value={editForm.title}
             onChange={e => setEditForm({...editForm, title: e.target.value})}
           />
           <textarea 
             className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-sm font-bold text-white outline-none focus:border-yellow-500/50 resize-none"
             placeholder={t('DESCRIPTION')}
             value={editForm.desc}
             rows={3}
             onChange={e => setEditForm({...editForm, desc: e.target.value})}
           />
           <div className="flex items-center gap-3">
             <button onClick={() => editFileRef.current.click()} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10">CHANGE MEDIA</button>
             <select 
               value={editForm.visibility}
               onChange={e => setEditForm({...editForm, visibility: e.target.value})}
               className="bg-black/40 border border-white/10 p-3 rounded-xl text-[10px] font-black text-yellow-500 outline-none"
             >
               <option value="public">PUBLIC</option>
               <option value="followers">ELITE</option>
               <option value="private">ALPHA</option>
             </select>
           </div>
            <input type="file" ref={editFileRef} hidden onChange={e => { setEditFile(e.target.files[0]); setEditPreview(URL.createObjectURL(e.target.files[0])); }} />
            {editPreview ? (
              <div className="relative mt-2">
                <img src={editPreview} className="w-full h-32 object-cover rounded-xl border border-yellow-500/50" />
                <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-md text-[8px] font-black">NEW MEDIA</div>
              </div>
            ) : (post.image || post.videoUrl) ? (
              <div className="relative mt-2 opacity-50">
                {post.image ? <img src={post.image} className="w-full h-32 object-cover rounded-xl" /> : (
                  <div className="w-full h-32 bg-black rounded-xl flex items-center justify-center border border-white/5">
                    <Icons.Zap className="w-8 h-8 text-yellow-500/30" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-black/80 px-3 py-1.5 rounded-xl text-[9px] font-black text-white border border-white/10">CURRENT MEDIA</span>
                </div>
              </div>
            ) : null}
           
           <div className="flex gap-2 pt-2">
             <button onClick={handleSaveEdit} className="flex-1 py-4 bg-yellow-500 text-black font-black italic rounded-2xl shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest">{t('SAVE_CHANGES')}</button>
             <button onClick={() => setIsEditing(false)} className="px-6 py-4 bg-white/5 text-gray-500 font-black rounded-2xl hover:text-white transition-all uppercase text-[10px] tracking-widest">{t('CANCEL')}</button>
           </div>
        </div>
      ) : (
        <>
          {post.visibility !== 'public' && (
            <div className="px-6 py-2 bg-yellow-500/10 border-y border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-black tracking-[0.2em] text-yellow-500 uppercase flex items-center gap-2">
                {post.visibility === 'followers' ? <><Icons.Shield className="w-3 h-3" /> {t('ENCRYPTED_INTEL')} • {t('ELITE_ONLY')}</> : <><Icons.Lock className="w-3 h-3" /> {t('PRIVATE_INTEL')} • {t('ALPHA_ONLY')}</>}
              </span>
              <div className="status-badge">{post.visibility.toUpperCase()}</div>
            </div>
          )}

          {post.image && <img src={post.image} className="w-full aspect-square object-cover" />}
          {post.videoUrl && (
            <div className="relative aspect-video bg-black/60 overflow-hidden group/vid">
              <video src={post.videoUrl} className="w-full h-full object-contain" controls loop muted autoPlay playsInline />
              <div className="absolute top-4 left-4 pointer-events-none">
                <span className="px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border border-yellow-500/20 text-yellow-500 shadow-xl shadow-black">{t('LEGACY_INTEL')}</span>
              </div>
            </div>
          )}
        </>
      )}

      {!isEditing && (
        <div className="p-5">
          <div className="flex items-center gap-6 mb-5">
            <button onClick={handleLike} className={"flex items-center gap-2 transition-all " + (liked ? 'text-yellow-500 scale-110' : 'text-gray-500 hover:text-white')}>
              <Icons.Heart className={"w-7 h-7 " + (liked ? 'fill-yellow-500' : '')} />
              <span className="font-black italic text-sm">{likes}</span>
            </button>
            <button onClick={handleDislike} className={"flex items-center gap-2 transition-all " + (disliked ? 'text-red-500 scale-110' : 'text-gray-500 hover:text-white')}>
              <Icons.ThumbDown className={"w-7 h-7 " + (disliked ? 'fill-red-500' : '')} />
              <span className="font-black italic text-sm">{dislikes}</span>
            </button>
            <button onClick={() => { setShowComments(!showComments); playSound('pop'); }} className="text-gray-500 hover:text-white flex items-center gap-2 transition-all">
              <Icons.Comment className="w-7 h-7" />
              <span className="font-black italic text-sm">{comments.length}</span>
            </button>
            <button className="text-gray-700 hover:text-white ml-auto transition-all"><Icons.Send className="w-6 h-6" /></button>
          </div>

          {post.title && <h3 className="font-black italic text-xl mb-2 tracking-tighter text-white uppercase">{post.title}</h3>}
          <p className="text-sm text-gray-400 leading-relaxed font-bold tracking-tight">{parseHashtags(post.desc)}</p>

          <AnimatePresence>
            {showComments && (
              <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="mt-6 border-t border-white/5 pt-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">{t('INTEL_COMMS')}</h4>
                   <button onClick={() => setShowComments(false)} className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors">{t('CLOSE')}</button>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {comments.map(c => {
                    const isCommentAuthor = (c.authorId === userId) || (c.user === user?.username);
                    const isPostAuthor = (post.author?._id === userId) || (post.author === userId);
                    const canDeleteComment = isCommentAuthor || isFounder || isPostAuthor;
                    
                    return (
                      <motion.div key={c._id || c.id} layout className="flex items-start gap-3 group relative pr-6">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black border border-white/10 overflow-hidden shrink-0">
                          {c.authorProfilePic ? <img src={c.authorProfilePic.replaceAll('\\\\', '/')} className="w-full h-full object-cover" alt="User" /> : (c.authorName || c.user)?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-black italic text-xs text-white tracking-tight">{c.authorName || c.user}</span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase">{new Date(c.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-sm text-gray-400 font-medium leading-snug">{parseHashtags(c.text)}</p>
                        </div>
                        {canDeleteComment && (
                          <button 
                            onClick={() => deleteComment(c._id)} 
                            className="absolute right-0 top-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Comment"
                          >
                            <Icons.X className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex gap-2 bg-black/20 p-2 rounded-[24px] border border-white/5 focus-within:border-yellow-500/30 transition-all">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('ADD_COMMENT')} className="flex-1 bg-transparent px-4 py-2 text-sm outline-none font-bold text-white placeholder:text-gray-700" onKeyPress={e => e.key === 'Enter' && addComment()} />
                  <button onClick={addComment} className="p-3 bg-yellow-500 rounded-2xl text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"><Icons.Send className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
});
PostCard.displayName = "PostCard";

const CreateModal = ({ isOpen, onClose, onSuccess, user }) => {
  const { t } = useTranslation(user);
  const [title, setTitle] = useState(''); 
  const [desc, setDesc] = useState(''); 
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [visibility, setVisibility] = useState('public');
  const fileRef = useRef();

  const submit = async e => { 
    e.preventDefault(); 
    if (!desc && !image) return; 
    setLoading(true); 
    playSound('whoosh'); 

    const fd = new FormData(); 
    if (title) fd.append('title', title); 
    fd.append('desc', desc); 
    if (image) fd.append('image', image);
    fd.append('visibility', visibility);
    
    try { 
      const res = await axios.post(API + '/posts', fd, { 
        headers: { 
          Authorization: 'Bearer ' + localStorage.getItem('token'), 
          'Content-Type': 'multipart/form-data' 
        }
      }); 
      playSound('magic');
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } }); 
      setTitle(''); 
      setDesc(''); 
      setImage(null); 
      setPreview(null); 
      setVisibility('public');
      onSuccess(); 
      onClose(); 
    } catch (e) { 
      console.error('Post error:', e);
      playSound('error');
      alert(e.response?.data?.message || 'Failed to generate intel. Check content policy.');
    } 
    setLoading(false); 
  };
  
  if (!isOpen) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[100]" />
      <motion.div 
        initial={{opacity:0, scale:0.9, y:50}} 
        animate={{opacity:1, scale:1, y:0}} 
        className="fixed inset-x-4 top-[5%] bottom-[5%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg md:h-auto md:max-h-[85vh] menu-liquid z-[101] shadow-2xl border-none flex flex-col overflow-hidden rounded-[32px]"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
          <h2 className="text-xl font-black italic tracking-tighter text-white">{t('EDIT_INTEL')}</h2>
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={submit} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5 pb-24">
          <div className="space-y-4">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder={t('TITLE')} 
              className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/5 focus:border-yellow-500/50 transition-all font-bold tracking-tight text-white placeholder:text-gray-600 text-sm" 
            />
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              placeholder={t('DESCRIPTION')} 
              rows={3} 
              className="w-full p-4 bg-white/5 rounded-[24px] outline-none border border-white/5 resize-none focus:border-yellow-500/50 transition-all font-bold tracking-tight text-white placeholder:text-gray-600 custom-scrollbar text-sm" 
            />
          </div>

          {preview && (
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="relative group shrink-0">
              {mediaType === 'video' ? (
                <video src={preview} className="w-full h-40 object-cover rounded-[24px] border border-white/10 shadow-lg shadow-black/40" autoPlay muted loop />
              ) : (
                <img src={preview} className="w-full h-40 object-cover rounded-[24px] border border-white/10 shadow-lg shadow-black/40" />
              )}
              <button 
                type="button" 
                onClick={() => {setImage(null);setPreview(null);}} 
                className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-xl rounded-xl text-white hover:bg-red-500 transition-colors"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          <input ref={fileRef} type="file" hidden accept="image/*,video/*" onChange={e => {const f=e.target.files[0];if(f){setImage(f);setPreview(URL.createObjectURL(f));setMediaType(f.type.startsWith('video') ? 'video' : 'image');}}} />
          
          <button 
            type="button" 
            onClick={() => fileRef.current?.click()} 
            className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:bg-white/10 transition-all group shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-xl group-hover:scale-110 transition-transform">
                {mediaType === 'video' ? <span className="text-lg">🎬</span> : <Icons.Image className="w-5 h-5 text-yellow-500" />}
              </div>
              <span className="font-bold tracking-widest text-[10px] text-gray-400 group-hover:text-white uppercase">UPLOAD MEDIA</span>
            </div>
            <span className="text-[9px] text-gray-600 font-black italic">MAX 10MB</span>
          </button>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            {[
              { id: 'public', label: t('PRIVACY_PUBLIC'), icon: Icons.Globe },
              { id: 'followers', label: t('PRIVACY_ELITE'), icon: Icons.Shield },
              { id: 'private', label: t('PRIVACY_HIDDEN'), icon: Icons.Lock }
            ].map(v => (
              <button 
                key={v.id}
                type="button"
                onClick={() => { setVisibility(v.id); playSound('pop'); }}
                className={"p-3 rounded-[16px] border transition-all flex flex-col items-center gap-1.5 " + (visibility === v.id ? 'bg-yellow-500/10 border-yellow-500 shadow-xl shadow-yellow-500/10 text-yellow-500 scale-105' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10')}
              >
                <v.icon className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-tighter">{v.label}</span>
              </button>
            ))}
          </div>

          <motion.button 
            whileHover={{scale:1.02}} 
            whileTap={{scale:0.95}} 
            onClick={submit}
            disabled={loading} 
            className="w-full py-5 bg-yellow-500 rounded-2xl text-black font-black italic tracking-widest text-lg uppercase shadow-lg shadow-yellow-500/20 active:scale-95 transition-all mt-4"
          >
            {loading ? 'SYNCHRONIZING...' : t('PUBLISH')}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
};

// Settings Modal - Full Featured
const SettingsModal = ({ isOpen, onClose, user, logout }) => {
  const { t } = useTranslation(user);
  const [activeTab, setActiveTab] = useState('general'); // general, account, cognition
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') !== 'false');
  const [privacyMode, setPrivacyMode] = useState(() => localStorage.getItem('privacyMode') || 'public');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'gold');
  const [showLanguages, setShowLanguages] = useState(false);
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  // Account States
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  
  const privacyOptions = [
    { value: 'public', label: t('PRIVACY_PUBLIC'), desc: 'Everyone can see' },
    { value: 'elite', label: t('PRIVACY_ELITE'), desc: 'Internal network only' },
    { value: 'hidden', label: t('PRIVACY_HIDDEN'), desc: 'Stealth mode active' }
  ];
  
  const languages = [
    { code: 'en', name: 'ENGLISH', icon: '🇺🇸' },
    { code: 'el', name: 'GREEK', icon: '🇬🇷' },
    { code: 'cy', name: 'CYPRUS', icon: '🇨🇾' },
    { code: 'de', name: 'GERMAN', icon: '🇩🇪' },
    { code: 'fr', name: 'FRENCH', icon: '🇫🇷' },
    { code: 'es', name: 'SPANISH', icon: '🇪🇸' },
  ];

  const themes = [
    { id: 'gold', name: 'GOLD', color: '#eab308' },
    { id: 'cobalt', name: 'COBALT', color: '#3b82f6' },
    { id: 'crimson', name: 'CRIMSON', color: '#ef4444' },
    { id: 'emerald', name: 'EMERALD', color: '#10b981' },
    { id: 'violet', name: 'VIOLET', color: '#8b5cf6' }
  ];
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('soundEnabled', newValue);
    window.SOUND_ENABLED = newValue;
    playSound(newValue ? 'pop' : 'error');
  };
  
  const toggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', newValue);
    playSound('pop');
  };
  
  const changePrivacy = async (mode) => {
    setPrivacyMode(mode);
    localStorage.setItem('privacyMode', mode);
    setShowPrivacyOptions(false);
    playSound('magic');
    try {
      const isPrivate = mode === 'hidden';
      const isFollowersOnly = mode === 'elite';
      await axios.put(API + '/users/settings', { isPrivate, isFollowersOnly }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
    } catch(e) {}
  };
  
  const changeLanguage = async (code) => {
    setLanguage(code);
    localStorage.setItem('language', code);
    setShowLanguages(false);
    playSound('magic');
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center transition-opacity duration-500';
    flash.innerHTML = '<div class="relative">' +
      '<div class="w-24 h-24 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>' +
      '<div class="absolute inset-0 flex items-center justify-center">' +
        '<div class="w-12 h-12 bg-yellow-500/10 rounded-full animate-pulse"></div>' +
      '</div>' +
    '</div>' +
    '<div class="mt-8 text-center">' +
      '<div class="text-[10px] font-black tracking-[0.5em] text-yellow-500/50 uppercase mb-2">Neural Link Re-routing</div>' +
      '<div class="text-2xl font-black italic text-white uppercase tracking-widest animate-pulse">Syncing Cognition...</div>' +
    '</div>';
    document.body.appendChild(flash);
    setTimeout(() => { 
      flash.style.opacity = '0'; 
      setTimeout(() => flash.remove(), 600); 
    }, 1200);
    try {
      await axios.put(API + '/users/settings', { settings: { language: code } }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      location.reload();
    } catch(e) { console.error("Neural sync failed:", e); }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername === user.username) return;
    setIsUpdatingUsername(true);
    playSound('whoosh');
    try {
      const res = await axios.put(API + '/users/' + user._id, { username: newUsername }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      localStorage.setItem('user', JSON.stringify(res.data));
      playSound('magic');
      confetti({ particleCount: 100, spread: 70 });
      location.reload();
    } catch(e) { 
      alert(e.response?.data?.message || 'Update failed. Check protocol.');
      playSound('error');
    }
    setIsUpdatingUsername(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('CONFIRM_DELETE'))) return;
    playSound('delete');
    try {
      await axios.delete(API + '/users/' + user._id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      logout();
      location.reload();
    } catch(e) { alert('Deletion failed.'); }
  };
  
  const currentLang = languages.find(l => l.code === language) || languages[0];
  const currentPrivacy = privacyOptions.find(p => p.value === privacyMode) || privacyOptions[0];
  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  
  if (!isOpen) return null;

  const SettingRow = ({ icon: Icon, title, subtitle, onClick, right }) => (
    <div onClick={onClick} className="w-full p-6 glass-3d rounded-[28px] flex items-center justify-between group cursor-pointer border-none mb-4 active:scale-95 transition-all shock-click">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-yellow-500/10 shadow-inner">
          <Icon className="w-6 h-6 text-white/40 group-hover:text-yellow-500 transition-colors" />
        </div>
        <div className="text-left">
          <span className="block font-black italic text-sm uppercase tracking-[0.15em] text-white group-hover:text-yellow-500 transition-colors">{title}</span>
          {subtitle && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{subtitle}</span>}
        </div>
      </div>
      {right}
    </div>
  );

  const Toggle = ({ enabled, onChange }) => (
    <div onClick={(e) => { e.stopPropagation(); onChange(); }} className={"w-12 h-7 rounded-full transition-all relative cursor-pointer " + (enabled ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/10')}>
      <motion.div layout className={"absolute top-1 w-5 h-5 bg-black rounded-full " + (enabled ? 'left-6' : 'left-1')} />
    </div>
  );
  
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[120]" />
      <motion.div 
        initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
        transition={{type:'spring',damping:30,stiffness:300}}
        className="fixed inset-y-0 right-0 w-full max-w-md menu-liquid z-[121] rounded-l-3xl flex flex-col border-l border-white/10 shadow-2xl"
      >
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
          <h2 className="text-3xl font-black italic tracking-tighter text-yellow-500">{t('SETTINGS')}</h2>
          <button onClick={onClose} className="p-3 ios-btn shock-click"><Icons.X className="w-6 h-6 text-white" /></button>
        </div>
        
        <div className="flex p-2 bg-black/20 gap-2 shrink-0">
          {[
            { id: 'general', label: t('GENERAL'), icon: Icons.Settings },
            { id: 'account', label: t('ACCOUNT'), icon: Icons.User },
            { id: 'cognition', label: t('APPEARANCE'), icon: Icons.Zap }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={"flex-1 p-4 rounded-xl flex flex-col items-center gap-1.5 transition-all " + (activeTab === tab.id ? 'bg-yellow-500/10 text-yellow-500 font-black' : 'text-gray-500 hover:bg-white/5')}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[8px] tracking-widest uppercase">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 p-8 space-y-6 overflow-y-auto no-scrollbar">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <SettingRow icon={Icons.Shield} title={t('PRIVACY_PUBLIC')} subtitle={currentPrivacy.label} onClick={() => setShowPrivacyOptions(!showPrivacyOptions)} right={<Icons.ChevronRight className={"w-5 h-5 transition-transform " + (showPrivacyOptions ? 'rotate-90' : '')} />} />
              <AnimatePresence>{showPrivacyOptions && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="space-y-2 p-4 bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                  {privacyOptions.map(p => (
                    <button key={p.value} onClick={() => changePrivacy(p.value)} className={"w-full p-4 rounded-xl flex items-center justify-between transition-all " + (privacyMode === p.value ? 'bg-yellow-500 text-black font-black' : 'bg-white/5 text-gray-400 hover:text-white')}>
                      <div className="text-left">
                        <div className="text-xs uppercase tracking-widest font-black">{p.label}</div>
                        <div className="text-[9px] tracking-wide opacity-70">{p.desc}</div>
                      </div>
                      {privacyMode === p.value && <Icons.Shield className="w-4 h-4" />}
                    </button>
                  ))}</motion.div>
              )}</AnimatePresence>
              
              <SettingRow icon={Icons.Bell} title="Neural Alerts" subtitle={notifications ? "ENGAGED" : "SILENCED"} onClick={toggleNotifications} right={<Toggle enabled={notifications} onChange={toggleNotifications} />} />
              <SettingRow icon={Icons.Volume2} title="Sonic Feedback" subtitle={soundEnabled ? "RESONATING" : "DORMANT"} onClick={toggleSound} right={<Toggle enabled={soundEnabled} onChange={toggleSound} />} />
              <SettingRow icon={Icons.Globe} title={t('COGNITION')} subtitle={currentLang.name} onClick={() => setShowLanguages(!showLanguages)} right={<Icons.ChevronRight className={"w-5 h-5 transition-transform " + (showLanguages ? 'rotate-90' : '')} />} />
              <AnimatePresence>{showLanguages && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                  {languages.map(l => (
                    <button key={l.code} onClick={() => changeLanguage(l.code)} className={"p-4 rounded-xl flex items-center justify-center transition-all " + (language === l.code ? 'bg-yellow-500 text-black font-black' : 'bg-white/5 text-gray-500 hover:text-white')}>
                      <span className="text-xs font-black uppercase tracking-widest">{l.name}</span>
                    </button>
                  ))}</motion.div>
              )}</AnimatePresence>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="p-6 glass-3d rounded-[32px] space-y-4">
                <h3 className="text-xs font-black text-gray-500 tracking-[0.3em] uppercase">{t('UPDATE_IDENTITY')}</h3>
                <div className="space-y-3">
                   <input 
                     value={newUsername} onChange={e => setNewUsername(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-black italic outline-none focus:border-yellow-500/50 transition-all"
                   />
                   {user.lastUsernameChange && (
                     <p className="text-[10px] text-yellow-500/50 font-bold uppercase tracking-widest">
                       {t('WAIT_DAYS', { n: Math.max(0, 3 - Math.floor((Date.now() - new Date(user.lastUsernameChange)) / (1000 * 60 * 60 * 24))) })}
                     </p>
                   )}
                   <button 
                     onClick={handleUpdateUsername} disabled={isUpdatingUsername || newUsername === user.username}
                     className="w-full py-4 bg-yellow-500 text-black font-black italic rounded-2xl shadow-xl shadow-yellow-500/20 active:scale-95 transition-all text-sm tracking-widest disabled:opacity-30"
                   >
                     {isUpdatingUsername ? 'UPDATING...' : t('SAVE_CHANGES')}
                   </button>
                </div>
              </div>

              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[32px] space-y-4">
                <h3 className="text-xs font-black text-red-500/50 tracking-[0.3em] uppercase">{t('DANGER_ZONE')}</h3>
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all uppercase"
                >
                  {t('DELETE_FOREVER')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cognition' && (
             <div className="space-y-4">
               <SettingRow icon={Icons.Zap} title={t('APPEARANCE')} subtitle={currentTheme.name} onClick={() => setShowThemes(!showThemes)} right={<Icons.ChevronRight className={"w-5 h-5 transition-transform " + (showThemes ? 'rotate-90' : '')} />} />
               <AnimatePresence>{showThemes && (
                 <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                   {themes.map(t => (
                     <button key={t.id} onClick={() => { setTheme(t.id); playSound('magic'); }} className={"p-4 rounded-xl flex flex-col items-center gap-2 transition-all border " + (theme === t.id ? 'border-yellow-500 bg-yellow-500/10 scale-105' : 'border-white/5 bg-white/5 hover:bg-white/10')}>
                       <div className="w-6 h-6 rounded-full" style={{ background: t.color }} />
                       <span className="text-[10px] font-black tracking-widest uppercase">{t.name}</span>
                     </button>
                   ))}</motion.div>
               )}</AnimatePresence>
             </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 flex flex-col gap-3">
          <button onClick={onClose} className="w-full py-4 bg-white/5 hover:bg-white/10 transition-all rounded-2xl text-[10px] text-gray-400 hover:text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Icons.Back className="w-4 h-4 rotate-180" /> {t('CANCEL')}
          </button>
          <button onClick={() => { playSound('delete'); logout(); }} className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shock-click">
            <Icons.Logout className="w-5 h-5" />
            <span className="font-black italic tracking-[0.2em] text-[10px]">{t('LOGOUT')}</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

const SideMenu = ({ isOpen, onClose, user, logout, onViewProfile, onOpenSettings, onOpenNotifications, setActiveTab }) => {
  const { t } = useTranslation(user);
  if (!isOpen) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-[120]" />
      <motion.div 
        initial={{x:'-100%'}} 
        animate={{x:0}} 
        exit={{x:'-100%'}}
        transition={{type:'spring',damping:30,stiffness:300}} 
        onAnimationStart={() => playSound('whoosh')} 
        className="fixed left-0 top-0 h-full w-full sm:w-[85vw] sm:max-w-[320px] menu-liquid z-[121] p-4 sm:p-6 sm:rounded-r-3xl flex flex-col border-r border-white/10 shadow-[5px_0_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex justify-between items-center mb-6 sm:mb-8 relative z-10">
          <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">{t('SYSTEM_CORE').split(' ')[0]} <span className="text-yellow-500">{t('SYSTEM_CORE').split(' ')[1] || 'CORE'}</span></span>
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2 sm:p-3 ios-btn"><Icons.X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
        </div>
        
        <button onClick={() => { playSound('pop'); onViewProfile(user); onClose(); }} className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 glass-3d rounded-2xl sm:rounded-[28px] mb-6 relative z-10 border-none group">
          <div className={"w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 text-xl sm:text-2xl font-black shadow-2xl transition-transform group-hover:scale-105 overflow-hidden border-2 " + (user?.role === 'Founder' ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-600 via-yellow-500 to-orange-500' : 'border-white/10 bg-gradient-to-tr from-yellow-500 to-orange-600')}>
            {user?.profilePic ? <img src={user.profilePic.replaceAll('\\\\', '/')} className="w-full h-full object-cover" alt={user.username} /> : user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black italic text-base sm:text-lg text-white tracking-tight truncate">{user?.username}</span>
              {user?.role === 'Founder' && <Icons.Shield className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />}
            </div>
            <span className="text-[9px] sm:text-[10px] text-yellow-500/60 font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase block">{user?.role === 'Founder' ? t('FOUNDER_PANEL') : t('AGENT')}</span>
          </div>
        </button>
        
        <div className="flex-1 space-y-2 sm:space-y-3 relative z-10 overflow-y-auto no-scrollbar">
          <button onClick={() => { setActiveTab('notifications'); onClose(); }} className="menu-item w-full p-4 sm:p-5 rounded-2xl sm:rounded-[28px] flex items-center justify-between group hover:bg-white/5 transition-all shock-click">
             <div className="flex items-center gap-3 sm:gap-4">
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center shadow-inner group-hover:bg-yellow-500/10 group-hover:text-yellow-500 transition-all flex-shrink-0"><Icons.Bell className="w-5 h-5 sm:w-6 sm:h-6" /></div>
               <span className="font-black italic text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-white/80 group-hover:text-white transition-colors uppercase">{t('ALERTS')}</span>
             </div>
             {user?.followRequests?.length > 0 && <div className="px-2 sm:px-3 py-1 bg-yellow-500 rounded-lg text-[9px] sm:text-[10px] font-black text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]">+{user.followRequests.length}</div>}
          </button>
          
          <button onClick={() => { setActiveTab('messages'); onClose(); }} className="menu-item w-full p-4 sm:p-5 rounded-2xl sm:rounded-[28px] flex items-center justify-between group hover:bg-white/5 transition-all shock-click">
             <div className="flex items-center gap-3 sm:gap-4">
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center shadow-inner group-hover:bg-yellow-500/10 group-hover:text-yellow-500 transition-all flex-shrink-0"><Icons.MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" /></div>
               <span className="font-black italic text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-white/80 group-hover:text-white transition-colors uppercase">{t('CHAT')}</span>
             </div>
          </button>

          <button onClick={() => { playSound('pop'); onViewProfile(user); onClose(); }} className="menu-item w-full p-4 sm:p-5 rounded-2xl sm:rounded-[28px] flex items-center gap-3 sm:gap-4 hover:bg-white/5 transition-all shock-click">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center shadow-inner group-hover:bg-yellow-500/10 group-hover:text-yellow-500 transition-all flex-shrink-0"><Icons.User className="w-5 h-5 sm:w-6 sm:h-6" /></div>
            <span className="font-black italic text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-white/80 group-hover:text-white transition-colors uppercase">{t('PROFILE')}</span>
          </button>

          <button onClick={() => { onOpenSettings(); onClose(); }} className="menu-item w-full p-4 sm:p-5 rounded-2xl sm:rounded-[28px] flex items-center justify-between group hover:bg-white/5 transition-all shock-click">
             <div className="flex items-center gap-3 sm:gap-4">
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center shadow-inner group-hover:bg-yellow-500/10 group-hover:text-yellow-500 transition-all flex-shrink-0"><Icons.Grid className="w-5 h-5 sm:w-6 sm:h-6" /></div>
               <span className="font-black italic text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-white/80 group-hover:text-white transition-colors uppercase">{t('SETTINGS')}</span>
             </div>
          </button>

          {user?.role === 'Founder' && (
            <div className="pt-4 sm:pt-6 border-t border-white/5 mt-4 sm:mt-6">
              <span className="px-4 sm:px-5 mb-2 sm:mb-4 block text-[8px] sm:text-[9px] font-black text-gray-500 tracking-[0.3em] uppercase">{t('ALPHA_ACCESS')}</span>
              <button onClick={() => { setActiveTab('search'); onClose(); }} className="menu-item w-full p-4 sm:p-5 rounded-2xl sm:rounded-[28px] bg-yellow-500/5 border border-yellow-500/10 flex items-center gap-3 sm:gap-4 hover:bg-yellow-500/10 transition-all group shock-click">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0"><Icons.Shield className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                <span className="font-black italic text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] text-yellow-500 uppercase">{t('FOUNDER_PANEL')}</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="pt-6 sm:pt-8 border-t border-white/5 relative z-10 flex justify-center">
          <button onClick={() => { playSound('delete'); logout(); }} className="w-20 h-20 rounded-[28px] flex items-center justify-center text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white transition-all group shock-click border border-red-500/10">
            <Icons.Logout className="w-8 h-8 sm:w-10 sm:h-10 group-hover:rotate-12 transition-transform" />
          </button>
        </div>  
        
        <div className="mt-6 sm:mt-8 p-4 sm:p-5 glass-3d rounded-2xl sm:rounded-[28px] border-none bg-white/5">
          <p className="text-[7px] sm:text-[8px] font-black text-gray-600 tracking-[0.4em] uppercase text-center mb-1">{t('PROTOCOL_VERSION')}</p>
          <div className="flex justify-center gap-1">
             <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
             <p className="text-[7px] font-black text-green-500/50 tracking-widest uppercase">{t('ENCRYPTION_ACTIVE')}</p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const Auth = ({ setUser }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('login'); 
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [registerImage, setRegisterImage] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  
  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    playSound('whoosh');
    
    try {
      if (mode === 'forgot') {
        await axios.post(API + '/auth/forgot-password', { email: form.email });
        setResetSent(true);
      } else {
        let r;
        if (mode === 'register') {
           const fd = new FormData();
           fd.append('username', form.username);
           fd.append('email', form.email);
           fd.append('password', form.password);
           
           // Privacy Logic
           if (privacy === 'hidden') fd.append('isPrivate', 'true');
           if (privacy === 'elite') fd.append('isFollowersOnly', 'true');
           
           if (registerImage) fd.append('image', registerImage);
           r = await axios.post(API + '/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
           r = await axios.post(API + '/auth/login', form);
        }

        if (mode === 'login' || r.data.token) { // Auto login after register if backend returns token, else alert
          if (r.data.token) {
             localStorage.setItem('token', r.data.token);
             localStorage.setItem('user', JSON.stringify(r.data.user));
             setUser(r.data.user);
             confetti({ particleCount: 150, spread: 100 });
          } else {
             alert('Registration successful. Please login.');
             setMode('login');
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black italic tracking-tighter text-white mb-2">LEGACY</h1>
          <div className="h-1 w-12 bg-yellow-500 mx-auto rounded-full" />
        </div>

        <div className="cyber-card p-8 bg-zinc-900/50 border-zinc-800">
          {mode === 'forgot' && resetSent ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                <Icons.Mail className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
                <p className="text-zinc-400 text-sm">We've sent a recovery link to your email.</p>
              </div>
              <button onClick={() => { setResetSent(false); setMode('login'); }} className="cyber-btn cyber-ghost">{t('RETURN')}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {mode !== 'forgot' && (
                <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-black rounded-xl border border-zinc-800">
                  {['login', 'register'].map(m => (
                    <button 
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={"py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all " + (mode === m ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300')}
                    >
                      {m === 'login' ? t('LOGIN') : t('REGISTER')}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-4">
                   <div className="flex justify-center mb-4">
                      <div className="relative group cursor-pointer w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden hover:border-yellow-500 transition-colors">
                        {registerImage ? <img src={URL.createObjectURL(registerImage)} className="w-full h-full object-cover" /> : <Icons.Camera className="w-8 h-8 text-zinc-500" />}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => setRegisterImage(e.target.files[0])} />
                      </div>
                   </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">{t('USERNAME')}</label>
                    <input className="cyber-input" placeholder={t('USERNAME')} value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                  </div>
                  
                  {/* Privacy Mode Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Privacy Level</label>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { value: 'public', label: t('PRIVACY_PUBLIC'), desc: 'Everyone can see' },
                            { value: 'elite', label: t('PRIVACY_ELITE'), desc: 'Internal network only' },
                            { value: 'hidden', label: t('PRIVACY_HIDDEN'), desc: 'Stealth mode active' }
                        ].map(p => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setPrivacy(p.value)}
                                className={"w-full p-3 rounded-xl flex items-center justify-between border transition-all " + (privacy === p.value ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white')}
                            >
                                <div className="text-left">
                                    <div className="text-xs font-black uppercase tracking-widest">{p.label}</div>
                                    <div className={"text-[9px] font-bold uppercase tracking-wide opacity-70 " + (privacy === p.value ? 'text-black' : 'text-gray-500')}>{p.desc}</div>
                                </div>
                                {privacy === p.value && <Icons.Shield className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">{t('EMAIL')}</label>
                <input className="cyber-input" type="email" placeholder="name@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">{t('PASSWORD')}</label>
                  <input className="cyber-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
              )}

              <button 
                disabled={loading} 
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-black font-black italic tracking-widest uppercase shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm mt-6 flex items-center justify-center gap-2"
              >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                    mode === 'login' ? t('LOGIN') : mode === 'register' ? t('REGISTER') : 'SEND RECOVERY LINK'
                )}
              </button>

              {mode === 'login' && (
                <button type="button" onClick={() => setMode('forgot')} className="w-full text-center text-xs text-zinc-500 mt-4 hover:text-yellow-500 transition-colors font-medium">{t('FORGOT')}</button>
              )}
              {mode === 'forgot' && (
                <button type="button" onClick={() => setMode('login')} className="w-full text-center text-xs text-zinc-500 mt-4 hover:text-white transition-colors">{t('CANCEL')}</button>
              )}

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Hashtags Explore Tab (Moved outside App to fix focus issues)
const HashtagsExplore = ({ hashtagSearch, setHashtagSearch, setActiveTab, allHashtags, posts, extractHashtags, filtered, user, deletePost, viewProfile }) => {
  const { t } = useTranslation(user);
  return (
  <div className="p-6 space-y-6">
    <div className="notif-morph p-6 flex items-center justify-between shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">🔥</div>
        <div>
          <h4 className="text-white font-black italic tracking-tighter">{t('TRENDING')}</h4>
          <p className="text-xs text-white/60 font-medium">{t('JOIN_ELITE')}</p>
        </div>
      </div>
      <Icons.Back className="w-5 h-5 text-white/40 rotate-180" />
    </div>

    <div className="relative group">
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
        <Icons.Search className="w-5 h-5 text-gray-400 group-focus-within:text-purple-400" />
      </div>
      <input
        value={hashtagSearch}
        onChange={(e) => setHashtagSearch(e.target.value)}
        placeholder={t('EXPLORE')}
        className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[30px] outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-bold tracking-tight text-white placeholder:text-gray-600"
      />
    </div>

    <div>
      <h3 className="text-xs font-black text-gray-500 mb-4 tracking-[0.2em] flex items-center gap-3">
        <div className="h-px bg-gray-800 flex-1" />
        {t('POPULAR')}
        <div className="h-px bg-gray-800 flex-1" />
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {allHashtags.slice(0, 15).map((tag, i) => (
          <motion.button
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => { setHashtagSearch(tag); setActiveTab('home'); playSound('pop'); }}
            className={"px-5 py-2.5 rounded-2xl text-xs font-black transition-all border border-white/5 " + (hashtagSearch === tag ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white')}
          >
            {tag.toUpperCase()}
            <span className="ml-2 py-0.5 px-1.5 bg-white/10 rounded-md text-[9px] text-gray-300">
              {posts.filter(p => extractHashtags(p.desc || p.title).includes(tag)).length}
            </span>
          </motion.button>
        ))}
      </div>
    </div>

    {hashtagSearch && (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-300 px-2 italic">
          {t('RESULTS_FOR')} {hashtagSearch.toUpperCase()}
        </h3>
        <AnimatePresence>
          {filtered.slice(0, 10).map(post => (
            <PostCard key={post._id} post={post} user={user} onDelete={deletePost} onViewProfile={viewProfile} />
          ))}
        </AnimatePresence>
      </div>
    )}
  </div>
);
};

const App = () => {
  const [user, setUser] = useState(null);
  const { t } = useTranslation(user);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // home, search, messages, profile
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [hashtagSearch, setHashtagSearch] = useState('');

  useEffect(() => { const u = localStorage.getItem('user'); if(u) setUser(JSON.parse(u)); }, []);
  useEffect(() => { if(user) { fetchPosts(); fetchUsers(); } }, [user]);

  const fetchPosts = async () => { try { const r = await axios.get(API + '/posts?json=true'); setPosts(r.data); } catch(e){} };
  const fetchUsers = async () => { try { const r = await axios.get(API + '/users', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }}); setUsers(r.data); } catch(e){ setUsers([{username:'LegacyFounder',role:'Founder'},{username:'Member1',role:'User'},{username:'Member2',role:'User'}]); } };
  
  const refreshUser = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(API + '/users/find/' + user._id);
      // Determine what fields to update to avoid full overwrite if needed, but full update is safer for sync
      // The endpoint /users/find/:id returns a user object (without password)
      // Check if notifications are included. The route in users.js selects (-password) which implies all other fields including notifications are there.
      // Wait, users.js route 20 returns 'others'.
      // However the schema has notifications.
      // Let's ensure local storage is also updated.
      const updated = { ...user, ...res.data };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    } catch(e) { console.error("Sync failed", e); }
  };

  const logout = () => { localStorage.clear(); setUser(null); };
  const deletePost = id => setPosts(posts.filter(p => p._id !== id));
  const viewProfile = (u) => { setProfileUser(u); setProfileOpen(true); };

  // Sync user data periodically to ensure notifications are up to date
  useEffect(() => {
    if (user) {
      const interval = setInterval(refreshUser, 10000); // Sync every 10s
      return () => clearInterval(interval);
    }
  }, [user?._id]); 

  // Extract hashtags from post descriptions
  const extractHashtags = (text) => {
    if (!text) return [];
    // Enhanced regex for Greek and other unicode characters
    const regex = /#[\p{L}\p{N}_]+/gu;
    return text.match(regex) || [];
  };

  // Get all unique hashtags from posts
  const allHashtags = [...new Set(posts.flatMap(p => extractHashtags(p.desc || p.title)))];

  const filtered = posts.filter(p => { 
    const isPostAuthor = p.username === user?.username;
    const isFollowing = user?.following?.includes(p.author?._id || p.author);
    const isFounder = user?.role === 'Founder';

    // Visibility Logic
    if (p.visibility === 'private' && !isPostAuthor) return false;
    if (p.visibility === 'followers' && !isPostAuthor && !isFollowing && !isFounder) return false;

    // Ghost Mode (isPrivate) Logic
    if (p.author?.isPrivate && !isPostAuthor && !isFollowing && !isFounder && activeTab === 'home' && !hashtagSearch) {
      return false;
    }

    if (hashtagSearch) {
      const searchLower = hashtagSearch.toLowerCase();
      // Improved: Check if hashtags include the search term OR if description/title includes the hashtag term
      const postHashtags = extractHashtags(p.desc || p.title);
      return postHashtags.some(tag => tag.toLowerCase().includes(searchLower)) || 
             (p.desc || '').toLowerCase().includes('#' + searchLower) || 
             (p.title || '').toLowerCase().includes('#' + searchLower);
    }
    if (!search) return true; 
    const s = search.toLowerCase(); 
    return p.title?.toLowerCase().includes(s) || p.desc?.toLowerCase().includes(s) || p.username?.toLowerCase().includes(s); 
  });

  if (!user) return <Auth setUser={setUser} />;

  // Dynamic Highlights / Top Intel Component - FIXED LAYOUT
  const Highlights = React.memo(({ onAdd, posts, viewProfile }) => {
    const { t } = useTranslation(user);
    const mediaPosts = posts.filter(p => p.image || p.videoUrl).slice(0, 10);

    return (
      <div className="highlights-container no-scrollbar mb-8">
        <div className="highlight-item">
          <button onClick={onAdd} className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] sm:rounded-[32px] ios-btn flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-yellow-500/10 group-hover:border-yellow-500/40 transition-all duration-500 pulse-gold">
              <Icons.Plus className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 group-hover:rotate-180 transition-all duration-700" />
            </div>
            <span className="text-[8px] sm:text-[9px] text-gray-500 font-black tracking-widest uppercase">{t('ADD_INTEL')}</span>
          </button>
        </div>
        
        {mediaPosts.map(p => (
          <div key={p._id} className="highlight-item">
            <button onClick={() => viewProfile({ username: p.username })} className="flex flex-col items-center gap-3 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] sm:rounded-[32px] p-[2px] bg-gradient-to-tr from-yellow-400 via-yellow-600 to-yellow-800 shadow-2xl group-hover:scale-105 transition-all duration-500 ring-2 ring-black">
                <div className="w-full h-full rounded-[26px] sm:rounded-[30px] bg-black overflow-hidden border border-white/10 flex items-center justify-center">
                  {p.image ? (
                    <img src={p.image.replaceAll('\\\\', '/')} className="w-full h-full object-cover group-hover:rotate-6 group-hover:scale-125 transition-transform duration-700" alt="Intel" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900"><Icons.Zap className="w-8 h-8 text-yellow-500/30" /></div>
                  )}
                </div>
              </div>
              <span className="text-[8px] sm:text-[9px] text-white/50 font-black tracking-widest uppercase max-w-[64px] sm:max-w-[80px] truncate group-hover:text-yellow-500 transition-colors">{p.username}</span>
            </button>
          </div>
        ))}
      </div>
    );
  });
  Highlights.displayName = 'Highlights';

  // Bottom Navigation Component
  const BottomNav = React.memo(({ activeTab, setActiveTab, user, viewProfile, setSearchOpen, setCreateOpen }) => {
    const { t } = useTranslation(user);
    const NavButton = ({ icon: Icon, label, tab, onClick }) => (
      <button 
        onClick={() => { 
          if (onClick) onClick();
          else setActiveTab(tab); 
          playSound('pop');
        }} 
        className="flex-1 flex flex-col items-center gap-1.5 py-4 relative group shrink-0"
      >
        <div className={"relative transition-all duration-500 " + (activeTab === tab ? 'text-yellow-500 scale-125 mb-1' : 'text-gray-600 group-hover:text-gray-400')}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <span className={"text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all " + (activeTab === tab ? 'text-yellow-500 opacity-100 font-black' : 'text-gray-700 opacity-50 group-hover:opacity-100')}>{label}</span>
        {activeTab === tab && (
          <motion.div layoutId="navActive" className="absolute bottom-1 w-6 sm:w-8 h-1 bg-yellow-500 rounded-full shadow-[0_0_20px_#eab308]" />
        )}
      </button>
    );

    return (
      <div className="fixed bottom-0 inset-x-0 p-3 sm:p-5 z-50 md:hidden pointer-events-none">
        <div className="menu-liquid flex items-center px-4 py-1 border-white/10 rounded-[32px] pointer-events-auto max-w-lg mx-auto">
          <NavButton icon={Icons.Home} label={t('HOME')} tab="home" />
          <NavButton icon={Icons.Search} label={t('INTEL')} tab="search" />
          
          <div className="flex-1 flex justify-center">
            <button onClick={() => { setCreateOpen(true); playSound('magic'); }} className="w-14 h-14 sm:w-16 sm:h-16 -mt-10 sm:-mt-12 bg-gradient-to-tr from-yellow-400 via-yellow-600 to-yellow-800 rounded-2xl flex items-center justify-center shadow-[0_15px_45px_rgba(234,179,8,0.4)] border-none hover:scale-110 active:scale-90 transition-all group pulse-gold">
              <Icons.Plus className="w-8 h-8 sm:w-9 sm:h-9 text-black group-hover:rotate-180 transition-transform duration-700" />
            </button>
          </div>

          <NavButton icon={Icons.MessageCircle} label={t('CHAT')} tab="messages" onClick={() => setActiveTab('messages')} />
          <NavButton icon={Icons.User} label={t('PROFILE')} tab="profile" onClick={() => { viewProfile(user); setActiveTab('home'); }} />
        </div>
      </div>
    );
  });
  BottomNav.displayName = 'BottomNav';

  // Notifications & Follow Requests Modal
  const NotificationsModal = React.memo(({ isOpen, onClose, user, onUpdate }) => {
    const { t } = useTranslation(user);
    const [requests, setRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (isOpen) fetchData();
    }, [isOpen]);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [reqs, notifs] = await Promise.all([
          axios.get(API + '/users/requests/pending', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }}),
          axios.get(API + '/users/notifications', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }})
        ]);
        setRequests(reqs.data);
        setNotifications(notifs.data);
        setTimeout(() => axios.put(API + '/users/notifications/read', {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }}), 2000);
      } catch(e) {}
      setLoading(false);
    };

    const handleAction = async (id, action) => {
      playSound('pop');
      try {
        await axios.post(API + '/users/requests/' + id + '/' + action, {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
        setRequests(requests.filter(r => r._id !== id));
        if (action === 'accept') { 
          playSound('magic');
          if (onUpdate) onUpdate();
          setNotifications(prev => [{ _id: Date.now(), type: 'system', text: 'New agent authorized.', createdAt: new Date(), read: true }, ...prev]);
        }
      } catch(e) {}
    };

    const clearAll = async () => {
      playSound('delete');
      try {
         await axios.delete(API + '/users/notifications', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
         setNotifications([]);
         if (onUpdate) onUpdate();
         confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
      } catch(e) {}
    };

    const deleteOne = async (e, id) => {
      e.stopPropagation();
      playSound('delete');
      try {
        await axios.delete(API + '/users/notifications/' + id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
        setNotifications(notifications.filter(n => n._id !== id));
        if (onUpdate) onUpdate();
      } catch(e) {}
    };

    if (!isOpen) return null;

    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-[110]" />
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed inset-y-0 right-0 w-full max-w-sm menu-liquid z-[111] rounded-none rounded-l-[40px] flex flex-col border-yellow-500/20 shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
            <h2 className="text-3xl font-black italic tracking-tighter text-yellow-500">{t('ACTIVITY')}</h2>
            <div className="flex items-center gap-2">
               {notifications.length > 0 && (
                 <button onClick={clearAll} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all mr-2" title="Clear All Log">
                   <Icons.Trash className="w-5 h-5" />
                 </button>
               )}
               <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><Icons.X className="w-6 h-6" /></button>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {requests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-yellow-500/50 tracking-[0.3em] ml-2 mb-2 uppercase">{t('PENDING_APPROVAL')}</h3>
                {requests.map(req => (
                  <div key={req._id} className="p-4 glass-3d flex items-center gap-4 border-yellow-500/30 bg-yellow-500/5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-600 to-black flex items-center justify-center font-black text-black shadow-lg">{req.username[0].toUpperCase()}</div>
                    <div className="flex-1">
                      <span className="block font-black italic text-sm text-white">{req.username}</span>
                      <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest">{t('AWAITING_AUTH')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(req._id, 'accept')} className="p-3 bg-yellow-500 text-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-yellow-500/20"><Icons.Plus className="w-4 h-4" /></button>
                      <button onClick={() => handleAction(req._id, 'reject')} className="p-3 bg-black/40 text-gray-400 border border-white/10 rounded-xl hover:text-red-500 hover:border-red-500/30 transition-all"><Icons.X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
               <h3 className="text-[10px] font-black text-gray-500 tracking-[0.3em] ml-2 mb-2 uppercase">{t('NEURAL_LOGS')}</h3>
               {notifications.length > 0 ? notifications.map((notif, i) => (
                 <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}} key={i} className={"group relative p-4 rounded-3xl flex items-start gap-4 transition-all " + (notif.read ? 'bg-white/5 border border-white/5' : 'bg-white/10 border-l-4 border-l-yellow-500 border-white/10')}>
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                     {notif.fromProfilePic ? (
                       <img src={notif.fromProfilePic.replaceAll('\\\\', '/')} className="w-full h-full object-cover" alt="User" />
                     ) : (
                       <>
                         {notif.type === 'follow' && <Icons.User className="w-5 h-5 text-blue-400" />}
                         {notif.type === 'comment' && <Icons.MessageCircle className="w-5 h-5 text-purple-400" />}
                         {notif.type === 'mention' && <Icons.Zap className="w-5 h-5 text-yellow-500" />}
                         {notif.type === 'system' && <Icons.Shield className="w-5 h-5 text-green-400" />}
                       </>
                     )}
                   </div>
                   <div className="flex-1">
                     <p className="text-xs font-bold text-gray-300 leading-relaxed">
                       {notif.fromUsername && <span className="text-white font-black italic mr-1">{notif.fromUsername}</span>}
                       {notif.type === 'follow' && t('FOLLOWED_YOU')}
                       {notif.type === 'comment' && t('COMMENTED') + ": "}
                       {notif.type === 'mention' && t('MENTIONED_YOU')}
                       {notif.text}
                     </p>
                     <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mt-2 block">{new Date(notif.createdAt).toLocaleDateString()}</span>
                   </div>
                   <button onClick={(e) => deleteOne(e, notif._id)} className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Icons.X className="w-4 h-4" />
                   </button>
                   {!notif.read && <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />}
                 </motion.div>
               )) : (
                 <div className="py-20 text-center opacity-10">
                   <Icons.Bell className="w-16 h-16 mx-auto mb-4" />
                   <p className="text-xs font-black tracking-widest uppercase">{t('NO_ACTIVITY')}</p>
                 </div>
               )}
            </div>
          </div>
        </motion.div>
      </>
    );
  });
NotificationsModal.displayName = 'NotificationsModal';

// Messages Modal - Real Terminal Chat & AI Assistant
const MessagesModal = React.memo(({ isOpen, onClose, user }) => {
  const { t } = useTranslation(user);
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState([
    { id: 'ai', name: 'AI GUARDIAN', lastMsg: 'System online. Profile sync active.', time: 'Online', online: true, messages: [{ text: 'Deep Learning Core Initialized.', me: false }] },
    { id: 1, name: 'EMPIRE SUPPORT', lastMsg: 'Gateway secure. Welcome to the Network.', time: '12:45', online: true, messages: [{ text: 'System initialized. Encryption 256-bit active.', me: false }] },
    { id: 2, name: 'LEGACY FOUNDER', lastMsg: 'The agenda is moving forward.', time: '09:20', online: false, messages: [{ text: 'Stay focused on the mission.', me: false }] },
  ]);

  // Chat Persistence
  useEffect(() => {
    const savedChats = localStorage.getItem('legacy_chats');
    if (savedChats) {
      try { setChats(JSON.parse(savedChats)); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('legacy_chats', JSON.stringify(chats));
  }, [chats]);

  const processAI = (input) => {
    const text = input.toLowerCase();
    if (text === 'clear' || text === 'reset') {
       // Reset chat logic if needed, or just clear locally
       return 'Memory core wiped. Ready for new intel.';
    }
    if (text.includes('weather')) return 'Current weather in the Matrix: Solar flare detected. Temperature optimal for deep-web operations. 32°C Cyber-Scale.';
    if (text.includes('hi') || text.includes('hello')) return 'Greetings, Legacy Agent. How shall we secure the empire today?';
    if (text.includes('founder') || text.includes('tate')) return 'The Founder is observing. Every action must be elite.';
    if (text.includes('help')) return 'I can provide weather updates, mission directives, and secure terminal status. Just ask. Type "clear" to reset.';
    return 'Directive processed. Analysis suggests continuing current growth trajectory. Intel suggests success is inevitable.';
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;
    const msg = newMessage;
    
    if (msg.toLowerCase() === 'clear' && activeChat.id === 'ai') {
        setChats(c => c.map(chat => chat.id === 'ai' ? {...chat, messages: []} : chat));
        setNewMessage('');
        return;
    }

    playSound('whoosh');
    const updatedChats = chats.map(c => {
      if (c.id === activeChat.id) {
        return { ...c, lastMsg: msg, time: 'Now', messages: [...c.messages, { text: msg, me: true }] };
      }
      return c;
    });
    setChats(updatedChats);
    setActiveChat(updatedChats.find(c => c.id === activeChat.id));
    setNewMessage('');
    
    if (activeChat.id === 'ai') {
      setIsTyping(true);
      setTimeout(() => {
        const reply = processAI(msg);
        playSound('pop');
        setIsTyping(false);
        const aiChats = updatedChats.map(c => {
          if (c.id === 'ai') {
            return { ...c, lastMsg: reply, time: 'Now', messages: [...c.messages, { text: reply, me: false }] };
          }
          return c;
        });
        setChats(aiChats);
        setActiveChat(aiChats.find(c => c.id === 'ai'));
      }, 1500);
    } else {
      setTimeout(() => {
        playSound('pop');
        const repliedChats = updatedChats.map(c => {
          if (c.id === activeChat.id) {
            return { ...c, lastMsg: 'Directive received.', time: 'Now', messages: [...c.messages, { text: 'Directive received. Processing...', me: false }] };
          }
          return c;
        });
        setChats(repliedChats);
        setActiveChat(repliedChats.find(c => c.id === activeChat.id));
      }, 2000);
    }
  };

  if (!isOpen) return null;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-[120]" />
      <motion.div
        initial={{ y: '100%', scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.9 }}
        className="fixed inset-x-0 bottom-0 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl menu-liquid z-[121] flex overflow-hidden rounded-t-[50px] border-yellow-500/20 shadow-[0_-20px_100px_rgba(0,0,0,1)]"
      >
        <div className={"w-full md:w-80 border-r border-white/5 flex flex-col transition-all " + (activeChat ? 'hidden md:flex' : 'flex')}>
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
            <h2 className="text-2xl font-black italic tracking-tighter text-yellow-500">{t('MESSAGES')}</h2>
            <button onClick={onClose} className="md:hidden p-3 ios-btn"><Icons.X /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
            {chats.map(chat => (
              <button key={chat.id} onClick={() => { setActiveChat(chat); playSound('pop'); }} className={"w-full p-5 rounded-[28px] flex items-center gap-4 transition-all " + (activeChat?.id === chat.id ? 'bg-yellow-500/10 border border-yellow-500/30 shadow-lg' : 'hover:bg-white/5')}>
                <div className="relative">
                  <div className={"w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border " + (chat.id === 'ai' ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-gradient-to-br from-gray-800 to-black border-white/10')}>
                    {chat.id === 'ai' ? <Icons.Zap className="w-8 h-8 text-white animate-pulse" /> : chat.name[0]}
                  </div>
                  {chat.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-black" />}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-black italic text-xs tracking-tight text-white">{chat.name}</span>
                    <span className="text-[9px] text-gray-600 font-bold">{chat.time}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate font-medium">{chat.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={"flex-1 flex flex-col bg-black/20 " + (!activeChat ? 'hidden md:flex' : 'flex')}>
          {activeChat ? (
            <>
              <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/60 backdrop-blur-3xl">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-3 ios-btn"><Icons.Back /></button>
                <div className={"w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 " + (activeChat.id === 'ai' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30')}>
                  {activeChat.id === 'ai' ? <Icons.Zap className="w-6 h-6" /> : activeChat.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-black italic text-base text-white tracking-tight">{activeChat.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-500 font-black tracking-widest uppercase">{t('SECURE_LINE')}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                {activeChat.messages.map((m, i) => (
                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={i} className={"flex " + (m.me ? 'justify-end' : 'justify-start')}>
                    <div className={"max-w-[75%] p-5 rounded-[32px] text-sm font-semibold shadow-2xl " + (m.me ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-tr-none' : 'bg-white/5 text-white rounded-tl-none border border-white/10 backdrop-blur-xl')}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-5 rounded-[32px] rounded-tl-none border border-white/10 flex gap-1.5">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-3xl flex gap-3">
                <input
                  value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder={t('ENTER_COMMAND')} onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-[20px] px-5 py-4 text-sm font-bold text-white outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                />
                <button onClick={sendMessage} className="w-14 h-14 bg-yellow-500 rounded-[20px] text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center"><Icons.Send className="w-6 h-6" /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30">
              <div className="w-32 h-32 bg-yellow-500/5 rounded-full flex items-center justify-center border-2 border-dashed border-yellow-500/20">
                <Icons.MessageCircle className="w-16 h-16 text-yellow-500" />
              </div>
              <div>
                <p className="font-black italic tracking-[0.3em] uppercase text-lg text-white">{t('SECURE_COMMS')}</p>
                <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">{t('AWAITING_PROTOCOL')}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
});
MessagesModal.displayName = 'MessagesModal';

// Hashtags Explore Tab


return (
  <div className="min-h-screen max-w-xl mx-auto border-x border-white/5 pb-32">
    <SideMenu 
      isOpen={menuOpen} 
      onClose={() => setMenuOpen(false)} 
      user={user} 
      logout={logout} 
      onViewProfile={viewProfile} 
      onOpenSettings={() => setSettingsOpen(true)} 
      onOpenNotifications={() => setActiveTab('notifications')}
      setActiveTab={setActiveTab} 
    />
    <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchPosts(); }} user={user} />
    <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} users={users} onViewProfile={viewProfile} currentUser={user} />
    <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} />
    <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} logout={logout} />
    <NotificationsModal isOpen={activeTab === 'notifications'} onClose={() => setActiveTab('home')} user={user} onUpdate={refreshUser} />
    {activeTab === 'messages' && <MessagesModal isOpen={true} onClose={() => setActiveTab('home')} user={user} />}

    <header className="sticky top-0 p-4 z-40 bg-black/60 backdrop-blur-lg border-b border-white/5 flex items-center gap-4">
      <button onClick={() => { setMenuOpen(true); playSound('pop'); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 shadow-xl"><Icons.Menu className="w-5 h-5 text-yellow-500/50" /></button>
      <span className="flex-1 text-3xl font-black italic tracking-tighter text-white gotham-text">LEGACY <span className="text-yellow-500">INTEL</span></span>
      <div className="flex items-center gap-2">
        <button onClick={() => { setSearchOpen(true); playSound('pop'); }} className="p-3 bg-white/5 hover:bg-yellow-500/10 rounded-2xl transition-all group"><Icons.Search className="w-5 h-5 text-gray-600 group-hover:text-yellow-500" /></button>
        <button
          onClick={() => { setActiveTab('notifications'); playSound('pop'); }}
          className="p-3 bg-white/5 hover:bg-yellow-500/10 rounded-2xl transition-all relative group"
        >
          <Icons.Bell className="w-5 h-5 text-gray-600 group-hover:text-yellow-500" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full border border-black shadow-[0_0_8px_#eab308]"></div>
        </button>
      </div>
    </header>

    <main>
      {activeTab === 'home' && (
        <div className="p-4">
          <Highlights onAdd={() => { setCreateOpen(true); playSound('magic'); }} posts={posts} viewProfile={viewProfile} onAction={() => { playSound('pop'); explodeEffect(); }} />

          {hashtagSearch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="notif-morph p-6 mb-8 flex items-center justify-between border-yellow-500/30 shadow-2xl"
            >
              <div>
                <span className="text-[10px] font-black text-yellow-500/50 uppercase tracking-[0.3em]">{t('SECURED_FEED')}</span>
                <span className="block text-2xl font-black text-white italic tracking-tight uppercase">#{hashtagSearch}</span>
              </div>
              <button onClick={() => { setHashtagSearch(''); playSound('pop'); }} className="px-6 py-3 bg-yellow-500 text-black rounded-2xl text-[10px] font-black tracking-widest transition-all shadow-lg shadow-yellow-500/20 active:scale-95">
                {t('RELEASE')}
              </button>
            </motion.div>
          )}

          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div key="no-intel" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="text-center py-40 text-gray-700">
                  <Icons.Shield className="w-20 h-20 mx-auto mb-6 opacity-10" />
                  <p className="text-3xl font-black italic tracking-tighter uppercase opacity-30">{t('NO_INTEL_FOUND')}</p>
                  {hashtagSearch && <p className="text-[10px] mt-4 font-black tracking-[0.4em] text-yellow-500/40 uppercase">{t('TRY_ALT_ENCRYPTION')}</p>}
                </motion.div>
              ) : (
                filtered.map(post => <PostCard key={post._id} post={post} user={user} onDelete={deletePost} onViewProfile={viewProfile} />)
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <HashtagsExplore
          hashtagSearch={hashtagSearch}
          setHashtagSearch={setHashtagSearch}
          setActiveTab={setActiveTab}
          allHashtags={allHashtags}
          posts={posts}
          extractHashtags={extractHashtags}
          filtered={filtered}
          user={user}
          deletePost={deletePost}
          viewProfile={viewProfile}
        />
      )}
      {activeTab === 'notifications' && (
        <div className="p-8 text-center text-gray-700 py-40">
          <Icons.Bell className="w-16 h-16 mx-auto mb-6 opacity-10" />
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">{t('INTEL_ACTIVITY')}</h2>
          <p className="text-xs font-bold tracking-widest text-gray-500">{t('CHECKING_TERMINAL')}</p>
        </div>
      )}
      {activeTab === 'profile' && <div className="p-4 text-center text-gray-500 py-20 font-bold italic uppercase tracking-widest">{t('LOADING_CORE')}</div>}
    </main>

    <BottomNav
      activeTab={activeTab === 'notifications' ? 'home' : activeTab}
      setActiveTab={setActiveTab}
      user={user}
      viewProfile={viewProfile}
      setSearchOpen={setSearchOpen}
      setCreateOpen={setCreateOpen}
    />

    {/* Global 3D Liquid Layer */}
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[150px] rounded-full" />
    </div>
    
      {/* Google Translate Mount Point */}
      <div id="google_translate_element" style={{ position: 'fixed', bottom: '0', left: '0', opacity: '0', pointerEvents: 'none', zIndex: -100 }}></div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
</script>
</body>
</html>`;
  res.send(html);
});



// Content Moderation Helper
const moderateContent = (text) => {
  const blacklist = [/scam/i, /crypto-scam/i, /offensiveWord1/i, /offensiveWord2/i, /spam-link-pattern/i];
  const urlPattern = /https?:\/\/(?!legacy-academy|onrender\.com)[^\s]+/gi;

  if (blacklist.some(regex => regex.test(text))) return { error: "Inappropriate content detected." };
  if ((text.match(urlPattern) || []).length > 2) return { error: "Too many external links (potential spam)." };
  return { success: true };
};

// CREATE POST
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, desc, description, visibility } = req.body;
    const contentText = (title || "") + " " + (desc || description || "");
    const mod = moderateContent(contentText);
    if (!mod.success) return res.status(400).json(mod.error);

    console.log("Creating post. Body:", req.body, "User:", req.user?.username, "File:", req.file?.filename);

    if (!req.file && !desc && !title) {
      return res.status(400).json("Intel content required.");
    }

    const isVideo = req.file?.mimetype?.includes("video") || req.file?.path?.match(/\.(mp4|mov|avi|webm)$|video\/upload/i);

    const author = await User.findById(req.user.id || req.user.userId);

    const newPost = new Post({
      title: title || '',
      desc: desc || description || '',
      image: !isVideo ? req.file?.path || "" : "",
      videoUrl: isVideo ? req.file?.path || "" : "",
      author: req.user.id || req.user.userId,
      username: req.user.username,
      profilePic: author?.profilePic || "",
      role: req.user.role,
      visibility: visibility || 'public'
    });

    const savedPost = await newPost.save();

    // HANDLE MENTIONS IN POSTS
    const fullText = (title || '') + ' ' + (desc || description || '');
    const mentionRegex = /@([\w.]+)/g;
    const mentions = [...new Set((fullText.match(mentionRegex) || []).map(m => m.slice(1)))];

    if (mentions.length > 0) {
      for (const username of mentions) {
        const mentionedUser = await User.findOne({ username });
        if (mentionedUser && mentionedUser._id.toString() !== (req.user.id || req.user.userId)) {
          await mentionedUser.updateOne({
            $push: {
              notifications: {
                type: 'mention',
                from: req.user.id || req.user.userId,
                fromUsername: req.user.username,
                fromProfilePic: author?.profilePic || '',
                post: savedPost._id,
                text: `Mentioned you in intel: ${title || 'New Post'}`,
                read: false,
                createdAt: new Date()
              }
            }
          });
        }
      }
    }

    console.log("Intel Deployed:", savedPost._id);
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("DEPLOYMENT FAILED:", err);
    res.status(500).json({ message: "SYSTEM ERROR: Deployment failed. Check file size/format." });
  }
});

// UPDATE POST
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Not found");
    if (post.username !== req.user.username && req.user.role !== "Founder") return res.status(403).json("Forbidden");

    // Update fields
    if (req.body.title) post.title = req.body.title;
    if (req.body.desc) post.desc = req.body.desc;
    if (req.body.visibility) post.visibility = req.body.visibility;

    // Handle new media upload
    if (req.file) {
      const isVideo = req.file.mimetype.includes("video");
      if (isVideo) {
        post.videoUrl = req.file.path;
        post.image = "";
      } else {
        post.image = req.file.path;
        post.videoUrl = "";
      }
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (e) {
    console.error("Update failed", e);
    res.status(500).json(e);
  }
});

// DELETE POST
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Not found");
    if (post.username !== req.user.username && req.user.role !== "Founder") return res.status(403).json("Forbidden");
    await post.deleteOne();
    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

// LIKE POST
router.put("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id || req.user.userId;
    if (!post.likes.includes(userId)) {
      await post.updateOne({ $push: { likes: userId }, $pull: { dislikes: userId } });
      res.status(200).json({ message: "Liked", likes: post.likes.length + 1, dislikes: Math.max(0, (post.dislikes?.length || 0) - (post.dislikes?.includes(userId) ? 1 : 0)) });
    } else {
      await post.updateOne({ $pull: { likes: userId } });
      res.status(200).json({ message: "Unliked", likes: post.likes.length - 1, dislikes: post.dislikes?.length || 0 });
    }
  } catch (e) { res.status(500).json(e); }
});

// DISLIKE POST
router.put("/:id/dislike", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id || req.user.userId;
    if (!post.dislikes?.includes(userId)) {
      await post.updateOne({ $push: { dislikes: userId }, $pull: { likes: userId } });
      res.status(200).json({ message: "Disliked" });
    } else {
      await post.updateOne({ $pull: { dislikes: userId } });
      res.status(200).json({ message: "Removed dislike" });
    }
  } catch (e) { res.status(500).json(e); }
});

// ADD COMMENT
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const currentUserId = req.user.id || req.user.userId;
    const currentUser = await User.findById(currentUserId);

    const newComment = {
      text: req.body.text,
      authorName: req.user.username,
      authorId: currentUserId,
      authorProfilePic: currentUser?.profilePic || '',
      createdAt: new Date()
    };
    post.comments.push(newComment);
    await post.save();

    // Send notification to post author if commenter is not the author
    if (post.author.toString() !== currentUserId) {
      await User.findByIdAndUpdate(post.author, {
        $push: {
          notifications: {
            type: 'comment',
            from: currentUserId,
            fromUsername: req.user.username,
            fromProfilePic: currentUser?.profilePic || '',
            post: post._id,
            text: req.body.text.substring(0, 50),
            read: false,
            createdAt: new Date()
          }
        }
      });
    }

    // HANDLE MENTIONS IN COMMENTS
    const mentionRegex = /@([\w.]+)/g;
    const mentions = [...new Set((req.body.text.match(mentionRegex) || []).map(m => m.slice(1)))];

    for (const username of mentions) {
      const mentionedUser = await User.findOne({ username });
      if (mentionedUser && mentionedUser._id.toString() !== currentUserId && mentionedUser._id.toString() !== post.author.toString()) {
        await mentionedUser.updateOne({
          $push: {
            notifications: {
              type: 'mention',
              from: currentUserId,
              fromUsername: req.user.username,
              fromProfilePic: currentUser?.profilePic || '',
              post: post._id,
              text: `Mentioned you in a comment: ${req.body.text.substring(0, 30)}...`,
              read: false,
              createdAt: new Date()
            }
          }
        });
      }
    }

    res.status(200).json(post.comments);
  } catch (e) {
    console.error("Add comment error:", e);
    res.status(500).json(e);
  }
});

// DELETE COMMENT
router.delete("/:id/comment/:commentId", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json("Comment not found");
    const userId = req.user.id || req.user.userId;
    if (comment.authorId?.toString() !== userId && req.user.role !== "Founder" && post.author.toString() !== userId) {
      return res.status(403).json("Forbidden");
    }
    post.comments.pull(req.params.commentId);
    await post.save();
    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

// GET FILTERED FEED (respects privacy settings)
router.get("/feed", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user.userId;
    const currentUser = await User.findById(currentUserId);

    // Get all posts
    const allPosts = await Post.find().sort({ createdAt: -1 }).lean();

    // Filter based on privacy
    const filteredPosts = [];

    for (const post of allPosts) {
      const postAuthor = await User.findById(post.author);

      if (!postAuthor) {
        // If author deleted, show public posts only
        if (post.visibility === 'public') filteredPosts.push(post);
        continue;
      }

      // Own posts - always show
      if (post.author.toString() === currentUserId) {
        filteredPosts.push(post);
        continue;
      }

      // HIDDEN mode (isPrivate = true)
      if (postAuthor.isPrivate) {
        // Only show if currentUser is a follower
        if (postAuthor.followers?.includes(currentUserId)) {
          filteredPosts.push(post);
        }
        continue;
      }

      // ELITE mode (isFollowersOnly = true)
      if (postAuthor.isFollowersOnly) {
        // Only show if currentUser is a follower
        if (postAuthor.followers?.includes(currentUserId)) {
          filteredPosts.push(post);
        }
        continue;
      }

      // PUBLIC mode - everyone can see
      filteredPosts.push(post);
    }

    res.status(200).json(filteredPosts);
  } catch (e) {
    console.error("Feed error:", e);
    res.status(500).json(e);
  }
});

// Export
export default router;
