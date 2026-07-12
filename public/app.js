const REMOTE_ORIGIN = "https://viora-chat.onrender.com";
const IS_LOCAL_APP = window.location.protocol === "file:";
const PENDING_MEDIA_DB = "viora-pending-media";
const PENDING_MEDIA_STORE = "files";
const RTC_CONFIGURATION = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ],
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require"
};

function serverUrl(path) {
  if (!IS_LOCAL_APP || !path || !String(path).startsWith("/")) return path;
  return `${REMOTE_ORIGIN}${path}`;
}

function mediaUrl(path) {
  return serverUrl(path);
}

const state = {
  user: null,
  users: new Map(),
  messages: new Map(),
  events: null,
  mediaFiles: [],
  attachmentPreviewUrls: [],
  pendingObjectUrls: [],
  messageLoadId: 0,
  renderedConversationId: "",
  renderedMessagesSignature: "",
  isSending: false,
  activeChat: { type: "general", user: null },
  search: "",
  messageSearch: "",
  selectedMessage: null,
  selectionMode: false,
  selectedMessageIds: new Set(),
  selectedShareUsers: new Set(),
  unread: new Map(),
  typing: new Map(),
  typingTimers: new Map(),
  typingSendTimer: null,
  typingStopTimer: null,
  calls: [],
  activeCall: null,
  localVideoStream: null,
  cameraOn: false,
  pendingCallSignals: new Map(),
  audioContext: null,
  keepScrollBottomUntil: 0,
  syncTimer: null,
  syncing: false,
  deleteSyncTimer: null,
  deleteSyncing: false,
  reconnectTimer: null,
  reconnecting: false,
  recorder: null,
  recorderStream: null,
  recorderChunks: [],
  recorderStartedAt: 0,
  recorderAnimation: null,
  recorderAnalyser: null,
  recordingCancelled: false,
  recordingStopResolve: null,
  fallbackRecorder: null,
  confirmAction: null,
  pendingClearChat: null,
  language: localStorage.getItem("vioraLanguage") || "ar",
  deviceId: getDeviceId()
};

const els = {
  loadingPage: document.querySelector("#loadingPage"),
  authPage: document.querySelector("#authPage"),
  accountsPage: document.querySelector("#accountsPage"),
  chatPage: document.querySelector("#chatPage"),
  settingsPage: document.querySelector("#settingsPage"),
  accountLabel: document.querySelector("#accountLabel"),
  authNotice: document.querySelector("#authNotice"),
  settingsNotice: document.querySelector("#settingsNotice"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  profileForm: document.querySelector("#profileForm"),
  logoutButton: document.querySelector("#logoutButton"),
  refreshButton: document.querySelector("#refreshButton"),
  menuButton: document.querySelector("#menuButton"),
  overflowMenu: document.querySelector("#overflowMenu"),
  searchInput: document.querySelector("#searchInput"),
  generalChatButton: document.querySelector("#generalChatButton"),
  usersList: document.querySelector("#usersList"),
  backToAccounts: document.querySelector("#backToAccounts"),
  backFromSettings: document.querySelector("#backFromSettings"),
  chatAvatar: document.querySelector("#chatAvatar"),
  chatTitle: document.querySelector("#chatTitle"),
  chatMenuButton: document.querySelector("#chatMenuButton"),
  chatMenu: document.querySelector("#chatMenu"),
  callsTabButton: document.querySelector("#callsTabButton"),
  voiceCallButton: document.querySelector("#voiceCallButton"),
  messageSearchButton: document.querySelector("#messageSearchButton"),
  openMessageSearch: document.querySelector("#openMessageSearch"),
  scrollBottomButton: document.querySelector("#scrollBottomButton"),
  clearChatButton: document.querySelector("#clearChatButton"),
  messageSearchBar: document.querySelector("#messageSearchBar"),
  messageSearchInput: document.querySelector("#messageSearchInput"),
  closeMessageSearch: document.querySelector("#closeMessageSearch"),
  statusLine: document.querySelector("#statusLine"),
  settingsAvatar: document.querySelector("#settingsAvatar"),
  settingsName: document.querySelector("#settingsName"),
  settingsUsername: document.querySelector("#settingsUsername"),
  themeToggle: document.querySelector("#themeToggle"),
  themeActionButton: document.querySelector("#themeActionButton"),
  editProfileToggle: document.querySelector("#editProfileToggle"),
  profileEditSection: document.querySelector("#profileEditSection"),
  languageToggle: document.querySelector("#languageToggle"),
  languagePanel: document.querySelector("#languagePanel"),
  languageLabel: document.querySelector("#languageLabel"),
  avatarInput: document.querySelector("#avatarInput"),
  avatarButton: document.querySelector("#avatarButton"),
  avatarFileName: document.querySelector("#avatarFileName"),
  messages: document.querySelector("#messages"),
  composer: document.querySelector("#composer"),
  selectionComposer: document.querySelector("#selectionComposer"),
  selectedCountLabel: document.querySelector("#selectedCountLabel"),
  bulkDeleteButton: document.querySelector("#bulkDeleteButton"),
  bulkForwardButton: document.querySelector("#bulkForwardButton"),
  messageInput: document.querySelector("#messageInput"),
  mediaInput: document.querySelector("#mediaInput"),
  attachButton: document.querySelector("#attachButton"),
  recordButton: document.querySelector("#recordButton"),
  composerMenuButton: document.querySelector("#composerMenuButton"),
  composerMenu: document.querySelector("#composerMenu"),
  composerSearchButton: document.querySelector("#composerSearchButton"),
  clearDraftButton: document.querySelector("#clearDraftButton"),
  clearAttachmentButton: document.querySelector("#clearAttachmentButton"),
  mediaPreview: document.querySelector("#mediaPreview"),
  toast: document.querySelector("#toast"),
  menuOverlay: document.querySelector("#menuOverlay"),
  messageOverlay: document.querySelector("#messageOverlay"),
  messageContextMenu: document.querySelector("#messageContextMenu"),
  selectMessageButton: document.querySelector("#selectMessageButton"),
  closeConversationButton: document.querySelector("#closeConversationButton"),
  forwardMessageButton: document.querySelector("#forwardMessageButton"),
  editMessageButton: document.querySelector("#editMessageButton"),
  deleteMessageButton: document.querySelector("#deleteMessageButton"),
  shareModal: document.querySelector("#shareModal"),
  shareUsers: document.querySelector("#shareUsers"),
  closeShareModal: document.querySelector("#closeShareModal"),
  shareSelectedButton: document.querySelector("#shareSelectedButton"),
  editModal: document.querySelector("#editModal"),
  closeEditModal: document.querySelector("#closeEditModal"),
  editMessageInput: document.querySelector("#editMessageInput"),
  saveEditButton: document.querySelector("#saveEditButton"),
  confirmModal: document.querySelector("#confirmModal"),
  closeConfirmModal: document.querySelector("#closeConfirmModal"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmText: document.querySelector("#confirmText"),
  cancelConfirmButton: document.querySelector("#cancelConfirmButton"),
  deleteForMeButton: document.querySelector("#deleteForMeButton"),
  deleteForEveryoneButton: document.querySelector("#deleteForEveryoneButton"),
  confirmActionButton: document.querySelector("#confirmActionButton"),
  viewerModal: document.querySelector("#viewerModal"),
  viewerTitle: document.querySelector("#viewerTitle"),
  viewerOpenLink: document.querySelector("#viewerOpenLink"),
  viewerBody: document.querySelector("#viewerBody"),
  closeViewerModal: document.querySelector("#closeViewerModal"),
  callsModal: document.querySelector("#callsModal"),
  closeCallsModal: document.querySelector("#closeCallsModal"),
  clearCallsButton: document.querySelector("#clearCallsButton"),
  callUsers: document.querySelector("#callUsers"),
  callHistory: document.querySelector("#callHistory"),
  callWindow: document.querySelector("#callWindow"),
  callAvatar: document.querySelector("#callAvatar"),
  callTitle: document.querySelector("#callTitle"),
  callStatus: document.querySelector("#callStatus"),
  closeCallWindow: document.querySelector("#closeCallWindow"),
  acceptCallButton: document.querySelector("#acceptCallButton"),
  rejectCallButton: document.querySelector("#rejectCallButton"),
  videocamButton: document.querySelector("#videocam"),
  endCallButton: document.querySelector("#endCallButton"),
  remoteCallAudio: document.querySelector("#remoteCallAudio"),
  remoteCallVideo: document.querySelector("#remoteCallVideo")
};

const transitionTimers = new WeakMap();

const LANGUAGES = [
  ["ar", "العربية", "rtl"],
  ["en", "English", "ltr"],
  ["fr", "Français", "ltr"],
  ["es", "Español", "ltr"],
  ["de", "Deutsch", "ltr"],
  ["tr", "Türkçe", "ltr"],
  ["hi", "हिन्दी", "ltr"],
  ["ur", "اردو", "rtl"],
  ["zh", "中文", "ltr"],
  ["id", "Indonesia", "ltr"]
];

const TR = {
  ar: {
    loading: "جاري فتح Viora...", heroText: "تواصل، صور، فيديو، صوت، ومحادثات خاصة.", loginTab: "تسجيل الدخول", registerTab: "إنشاء حساب", identifier: "البريد أو اسم المستخدم", password: "كلمة المرور", loginButton: "دخول", displayName: "الاسم الظاهر", username: "اسم المستخدم", email: "البريد الإلكتروني", createAccountButton: "إنشاء الحساب", authNotice: "حساب واحد لكل بريد، اسم مستخدم، وجهاز.", connected: "متصل", refresh: "تحديث", menu: "القائمة", settings: "الإعدادات", logout: "تسجيل الخروج", searchAccounts: "بحث في الحسابات", chats: "الدردشات", status: "الحالات", calls: "المكالمات", generalChat: "المحادثة العامة", generalChatDesc: "مجموعة عامة لكل المستخدمين", now: "الآن", accounts: "الحسابات", back: "رجوع", search: "بحث", more: "مزيد", searchMessages: "بحث في الرسائل", lastMessage: "آخر رسالة", close: "إغلاق", attachFile: "إرفاق ملف", writeMessage: "اكتب رسالة", recordAudio: "تسجيل صوت", sendOptions: "خيارات الإرسال", clearDraft: "مسح الكتابة", removeAttachment: "إزالة المرفق", send: "إرسال", editPersonalInfo: "تعديل المعلومات الشخصية", editPersonalInfoDesc: "الصورة، الاسم، البريد، والنبذة", nightDayMode: "الوضع الليلي والنهاري", themeDesc: "تبديل مظهر التطبيق", language: "اللغة", editInfo: "تعديل المعلومات", changeAvatar: "تغيير صورة الحساب", noImageSelected: "لم يتم اختيار صورة", about: "النبذة", available: "متاح", currentPassword: "كلمة المرور الحالية", newPasswordOptional: "كلمة مرور جديدة اختيارية", saveChanges: "حفظ التعديلات", settingsNotice: "يجب إدخال كلمة المرور الحالية قبل تعديل المعلومات.", forward: "إرسال لشخص آخر", editMessage: "تعديل الرسالة", deleteMessage: "حذف الرسالة", sendTo: "إرسال إلى", shareSelected: "مشاركة مع الحسابات المحددة", saveEdit: "حفظ التعديل", viewFile: "عرض الملف", downloadFile: "تنزيل الملف", noResults: "لا توجد نتائج مطابقة", noOtherAccounts: "لا توجد حسابات أخرى بعد", allUsers: "كل المستخدمين", user: "مستخدم", forwarded: "مُعاد توجيهها", noShareUsers: "لا توجد حسابات متاحة للمشاركة.", file: "ملف", image: "صورة", audioClip: "مقطع صوتي", viewVideo: "عرض الفيديو", playAudio: "تشغيل المقطع الصوتي", playVideo: "تشغيل الفيديو", fullscreen: "ملء الشاشة", textLoading: "جاري تحميل النص...", textLoadFail: "تعذر عرض الملف النصي. استخدم زر التنزيل بالأعلى.", browserFrameFail: "لا يدعم المتصفح عرض هذا النوع داخل الإطار، استخدم زر التنزيل بالأعلى.", privateViewerFail: "عارض Viora الخاص يعرض تفاصيل هذا الملف بدون iframe على الأجهزة اللمسية. استخدم زر التنزيل بالأعلى للحصول على الملف.", loggedIn: "تم تسجيل الدخول.", accountCreated: "تم إنشاء الحساب.", savedProfile: "تم حفظ التعديلات بنجاح.", accountUpdated: "تم تحديث الحساب.", loggedOut: "تم تسجيل الخروج.", accountsUpdated: "تم تحديث الحسابات.", imageOnly: "اختر ملف صورة فقط.", messageDeleted: "تم حذف الرسالة.", sharedSelected: "تمت المشاركة مع الحسابات المحددة.", messageEdited: "تم تعديل الرسالة.", loginFirst: "سجّل الدخول أولًا.", fullscreenFail: "تعذر تفعيل ملء الشاشة في هذا المتصفح.", reconnecting: "يعيد الاتصال...", noSavedSession: "هذا المتصفح أو الدومين لا يملك جلسة محفوظة. سجّل الدخول مرة واحدة وسيتم حفظ الدخول بعدها.", removeFile: "إزالة", selectedImage: "تم اختيار الصورة"
  },
  en: {
    loading: "Opening Viora...", heroText: "Chat, photos, video, audio, and private conversations.", loginTab: "Log in", registerTab: "Create account", identifier: "Email or username", password: "Password", loginButton: "Log in", displayName: "Display name", username: "Username", email: "Email", createAccountButton: "Create account", authNotice: "One account per email, username, and device.", connected: "Connected", refresh: "Refresh", menu: "Menu", settings: "Settings", logout: "Log out", searchAccounts: "Search accounts", chats: "Chats", status: "Status", calls: "Calls", generalChat: "General chat", generalChatDesc: "Public group for all users", now: "Now", accounts: "Accounts", back: "Back", search: "Search", more: "More", searchMessages: "Search messages", lastMessage: "Last message", close: "Close", attachFile: "Attach file", writeMessage: "Write a message", recordAudio: "Record audio", sendOptions: "Send options", clearDraft: "Clear draft", removeAttachment: "Remove attachment", send: "Send", editPersonalInfo: "Edit personal info", editPersonalInfoDesc: "Photo, name, email, and about", nightDayMode: "Dark and light mode", themeDesc: "Change app appearance", language: "Language", editInfo: "Edit information", changeAvatar: "Change profile photo", noImageSelected: "No image selected", about: "About", available: "Available", currentPassword: "Current password", newPasswordOptional: "New password optional", saveChanges: "Save changes", settingsNotice: "Enter your current password before editing information.", forward: "Forward to someone", editMessage: "Edit message", deleteMessage: "Delete message", sendTo: "Send to", shareSelected: "Share with selected accounts", saveEdit: "Save edit", viewFile: "View file", downloadFile: "Download file", noResults: "No matching results", noOtherAccounts: "No other accounts yet", allUsers: "All users", user: "User", forwarded: "Forwarded", noShareUsers: "No accounts available to share.", file: "File", image: "Image", audioClip: "Audio clip", viewVideo: "View video", playAudio: "Play audio clip", playVideo: "Play video", fullscreen: "Fullscreen", textLoading: "Loading text...", textLoadFail: "Could not show the text file. Use the download button above.", browserFrameFail: "This browser cannot show this file type in the frame. Use the download button above.", privateViewerFail: "Viora private viewer shows this file without an iframe on touch devices. Use the download button above.", loggedIn: "Logged in.", accountCreated: "Account created.", savedProfile: "Changes saved successfully.", accountUpdated: "Account updated.", loggedOut: "Logged out.", accountsUpdated: "Accounts refreshed.", imageOnly: "Choose an image file only.", messageDeleted: "Message deleted.", sharedSelected: "Shared with selected accounts.", messageEdited: "Message edited.", loginFirst: "Log in first.", fullscreenFail: "Fullscreen could not be enabled in this browser.", reconnecting: "Reconnecting...", noSavedSession: "This browser or domain has no saved session. Log in once and it will be remembered.", removeFile: "Remove", selectedImage: "Image selected"
  }
};

const EXTRA_TRANSLATIONS = {
  fr: ["Ouverture de Viora...", "Communiquez avec texte, photos, vidéos, audio et conversations privées.", "Connexion", "Créer un compte", "E-mail ou nom d'utilisateur", "Mot de passe", "Entrer", "Nom affiché", "Nom d'utilisateur", "E-mail", "Créer le compte", "Un compte par e-mail, nom d'utilisateur et appareil.", "Connecté", "Actualiser", "Menu", "Paramètres", "Déconnexion", "Rechercher des comptes", "Discussions", "Statut", "Appels", "Discussion générale", "Groupe public pour tous les utilisateurs", "Maintenant", "Comptes", "Retour", "Rechercher", "Plus", "Rechercher dans les messages", "Dernier message", "Fermer", "Joindre un fichier", "Écrire un message", "Enregistrer audio", "Options d'envoi", "Effacer le brouillon", "Retirer la pièce jointe", "Envoyer", "Modifier les informations personnelles", "Photo, nom, e-mail et bio", "Mode nuit et jour", "Changer l'apparence", "Langue", "Modifier les informations", "Changer la photo du compte", "Aucune image choisie", "Bio", "Disponible", "Mot de passe actuel", "Nouveau mot de passe facultatif", "Enregistrer", "Entrez le mot de passe actuel avant de modifier.", "Transférer à quelqu'un", "Modifier le message", "Supprimer le message", "Envoyer à", "Partager avec les comptes sélectionnés", "Enregistrer la modification", "Afficher le fichier", "Télécharger le fichier", "Aucun résultat", "Aucun autre compte", "Tous les utilisateurs", "Utilisateur", "Transféré", "Aucun compte disponible.", "Fichier", "Image", "Clip audio", "Voir la vidéo", "Lire l'audio", "Lire la vidéo", "Plein écran", "Chargement du texte...", "Impossible d'afficher le texte. Utilisez le téléchargement.", "Ce navigateur ne peut pas afficher ce type dans le cadre.", "Le visualiseur privé Viora affiche ce fichier sans iframe sur tactile.", "Connecté.", "Compte créé.", "Modifications enregistrées.", "Compte mis à jour.", "Déconnecté.", "Comptes actualisés.", "Choisissez seulement une image.", "Message supprimé.", "Partagé avec les comptes sélectionnés.", "Message modifié.", "Connectez-vous d'abord.", "Plein écran indisponible.", "Reconnexion...", "Aucune session enregistrée. Connectez-vous une fois.", "Retirer", "Image choisie"],
  es: ["Abriendo Viora...", "Comunícate con texto, fotos, video, audio y chats privados.", "Iniciar sesión", "Crear cuenta", "Correo o usuario", "Contraseña", "Entrar", "Nombre visible", "Usuario", "Correo", "Crear cuenta", "Una cuenta por correo, usuario y dispositivo.", "Conectado", "Actualizar", "Menú", "Ajustes", "Cerrar sesión", "Buscar cuentas", "Chats", "Estados", "Llamadas", "Chat general", "Grupo público para todos", "Ahora", "Cuentas", "Atrás", "Buscar", "Más", "Buscar mensajes", "Último mensaje", "Cerrar", "Adjuntar archivo", "Escribe un mensaje", "Grabar audio", "Opciones de envío", "Borrar borrador", "Quitar adjunto", "Enviar", "Editar información personal", "Foto, nombre, correo y biografía", "Modo oscuro y claro", "Cambiar apariencia", "Idioma", "Editar información", "Cambiar foto de perfil", "No hay imagen seleccionada", "Acerca de", "Disponible", "Contraseña actual", "Nueva contraseña opcional", "Guardar cambios", "Ingresa la contraseña actual antes de editar.", "Enviar a otra persona", "Editar mensaje", "Eliminar mensaje", "Enviar a", "Compartir con cuentas seleccionadas", "Guardar edición", "Ver archivo", "Descargar archivo", "Sin resultados", "Aún no hay otras cuentas", "Todos los usuarios", "Usuario", "Reenviado", "No hay cuentas para compartir.", "Archivo", "Imagen", "Audio", "Ver video", "Reproducir audio", "Reproducir video", "Pantalla completa", "Cargando texto...", "No se pudo mostrar el texto. Usa descargar.", "El navegador no muestra este tipo en el marco.", "El visor privado de Viora lo muestra sin iframe en táctil.", "Sesión iniciada.", "Cuenta creada.", "Cambios guardados.", "Cuenta actualizada.", "Sesión cerrada.", "Cuentas actualizadas.", "Elige solo una imagen.", "Mensaje eliminado.", "Compartido con cuentas seleccionadas.", "Mensaje editado.", "Inicia sesión primero.", "No se pudo activar pantalla completa.", "Reconectando...", "No hay sesión guardada. Inicia sesión una vez.", "Quitar", "Imagen seleccionada"],
  de: ["Viora wird geöffnet...", "Chatte mit Fotos, Videos, Audio und privaten Gesprächen.", "Anmelden", "Konto erstellen", "E-Mail oder Benutzername", "Passwort", "Anmelden", "Anzeigename", "Benutzername", "E-Mail", "Konto erstellen", "Ein Konto pro E-Mail, Benutzername und Gerät.", "Verbunden", "Aktualisieren", "Menü", "Einstellungen", "Abmelden", "Konten suchen", "Chats", "Status", "Anrufe", "Allgemeiner Chat", "Öffentliche Gruppe für alle Benutzer", "Jetzt", "Konten", "Zurück", "Suchen", "Mehr", "Nachrichten suchen", "Letzte Nachricht", "Schließen", "Datei anhängen", "Nachricht schreiben", "Audio aufnehmen", "Sendeoptionen", "Entwurf löschen", "Anhang entfernen", "Senden", "Persönliche Daten bearbeiten", "Foto, Name, E-Mail und Info", "Dunkel- und Hellmodus", "App-Darstellung ändern", "Sprache", "Informationen bearbeiten", "Profilfoto ändern", "Kein Bild ausgewählt", "Info", "Verfügbar", "Aktuelles Passwort", "Neues Passwort optional", "Änderungen speichern", "Geben Sie das aktuelle Passwort ein.", "An jemanden weiterleiten", "Nachricht bearbeiten", "Nachricht löschen", "Senden an", "Mit ausgewählten Konten teilen", "Bearbeitung speichern", "Datei anzeigen", "Datei herunterladen", "Keine Treffer", "Noch keine anderen Konten", "Alle Benutzer", "Benutzer", "Weitergeleitet", "Keine Konten zum Teilen verfügbar.", "Datei", "Bild", "Audioaufnahme", "Video ansehen", "Audio abspielen", "Video abspielen", "Vollbild", "Text wird geladen...", "Textdatei konnte nicht angezeigt werden.", "Dieser Browser kann diesen Typ nicht im Rahmen anzeigen.", "Viora zeigt diese Datei auf Touch-Geräten ohne iframe.", "Angemeldet.", "Konto erstellt.", "Änderungen gespeichert.", "Konto aktualisiert.", "Abgemeldet.", "Konten aktualisiert.", "Wählen Sie nur ein Bild.", "Nachricht gelöscht.", "Mit ausgewählten Konten geteilt.", "Nachricht bearbeitet.", "Bitte zuerst anmelden.", "Vollbild konnte nicht aktiviert werden.", "Verbindung wird wiederhergestellt...", "Keine gespeicherte Sitzung. Melden Sie sich einmal an.", "Entfernen", "Bild ausgewählt"],
  tr: ["Viora açılıyor...", "Sohbet, fotoğraf, video, ses ve özel konuşmalar.", "Giriş yap", "Hesap oluştur", "E-posta veya kullanıcı adı", "Şifre", "Giriş", "Görünen ad", "Kullanıcı adı", "E-posta", "Hesap oluştur", "Her e-posta, kullanıcı adı ve cihaz için bir hesap.", "Bağlı", "Yenile", "Menü", "Ayarlar", "Çıkış yap", "Hesaplarda ara", "Sohbetler", "Durum", "Aramalar", "Genel sohbet", "Tüm kullanıcılar için genel grup", "Şimdi", "Hesaplar", "Geri", "Ara", "Daha fazla", "Mesajlarda ara", "Son mesaj", "Kapat", "Dosya ekle", "Mesaj yaz", "Ses kaydet", "Gönderme seçenekleri", "Taslağı temizle", "Eki kaldır", "Gönder", "Kişisel bilgileri düzenle", "Fotoğraf, ad, e-posta ve hakkında", "Gece ve gündüz modu", "Görünümü değiştir", "Dil", "Bilgileri düzenle", "Profil fotoğrafını değiştir", "Resim seçilmedi", "Hakkında", "Uygun", "Mevcut şifre", "Yeni şifre isteğe bağlı", "Kaydet", "Bilgileri düzenlemeden önce mevcut şifreyi girin.", "Birine ilet", "Mesajı düzenle", "Mesajı sil", "Gönderilecek kişi", "Seçilen hesaplarla paylaş", "Düzenlemeyi kaydet", "Dosyayı görüntüle", "Dosyayı indir", "Sonuç yok", "Henüz başka hesap yok", "Tüm kullanıcılar", "Kullanıcı", "İletildi", "Paylaşılacak hesap yok.", "Dosya", "Resim", "Ses klibi", "Videoyu görüntüle", "Sesi oynat", "Videoyu oynat", "Tam ekran", "Metin yükleniyor...", "Metin gösterilemedi. İndir düğmesini kullanın.", "Tarayıcı bu türü çerçevede gösteremez.", "Viora özel görüntüleyici dokunmatik cihazlarda iframe olmadan gösterir.", "Giriş yapıldı.", "Hesap oluşturuldu.", "Değişiklikler kaydedildi.", "Hesap güncellendi.", "Çıkış yapıldı.", "Hesaplar yenilendi.", "Yalnızca resim seçin.", "Mesaj silindi.", "Seçilen hesaplarla paylaşıldı.", "Mesaj düzenlendi.", "Önce giriş yapın.", "Tam ekran açılamadı.", "Yeniden bağlanıyor...", "Kayıtlı oturum yok. Bir kez giriş yapın.", "Kaldır", "Resim seçildi"],
  hi: ["Viora खुल रहा है...", "चैट, फोटो, वीडियो, ऑडियो और निजी बातचीत।", "लॉग इन", "खाता बनाएं", "ईमेल या उपयोगकर्ता नाम", "पासवर्ड", "प्रवेश", "दिखने वाला नाम", "उपयोगकर्ता नाम", "ईमेल", "खाता बनाएं", "हर ईमेल, नाम और डिवाइस पर एक खाता।", "कनेक्टेड", "रीफ्रेश", "मेन्यू", "सेटिंग्स", "लॉग आउट", "खाते खोजें", "चैट", "स्टेटस", "कॉल", "सामान्य चैट", "सभी उपयोगकर्ताओं का सार्वजनिक समूह", "अभी", "खाते", "वापस", "खोज", "अधिक", "संदेश खोजें", "अंतिम संदेश", "बंद करें", "फ़ाइल जोड़ें", "संदेश लिखें", "ऑडियो रिकॉर्ड करें", "भेजने के विकल्प", "ड्राफ्ट साफ़ करें", "अटैचमेंट हटाएं", "भेजें", "व्यक्तिगत जानकारी बदलें", "फोटो, नाम, ईमेल और परिचय", "रात और दिन मोड", "ऐप रूप बदलें", "भाषा", "जानकारी बदलें", "प्रोफ़ाइल फोटो बदलें", "कोई छवि नहीं चुनी", "परिचय", "उपलब्ध", "वर्तमान पासवर्ड", "नया पासवर्ड वैकल्पिक", "बदलाव सहेजें", "जानकारी बदलने से पहले वर्तमान पासवर्ड डालें।", "किसी को भेजें", "संदेश संपादित करें", "संदेश हटाएं", "किसे भेजें", "चुने खातों से साझा करें", "संपादन सहेजें", "फ़ाइल देखें", "फ़ाइल डाउनलोड करें", "कोई परिणाम नहीं", "अभी कोई दूसरा खाता नहीं", "सभी उपयोगकर्ता", "उपयोगकर्ता", "फॉरवर्ड किया गया", "साझा करने को खाते नहीं।", "फ़ाइल", "छवि", "ऑडियो क्लिप", "वीडियो देखें", "ऑडियो चलाएं", "वीडियो चलाएं", "पूर्ण स्क्रीन", "टेक्स्ट लोड हो रहा है...", "टेक्स्ट नहीं दिखा। डाउनलोड करें।", "ब्राउज़र फ्रेम में यह प्रकार नहीं दिखा सकता।", "Viora निजी व्यूअर टच डिवाइस पर iframe बिना दिखाता है।", "लॉग इन हुआ।", "खाता बना।", "बदलाव सहेजे गए।", "खाता अपडेट हुआ।", "लॉग आउट हुआ।", "खाते रीफ्रेश हुए।", "सिर्फ छवि फ़ाइल चुनें।", "संदेश हटाया गया।", "चुने खातों से साझा हुआ।", "संदेश संपादित हुआ।", "पहले लॉग इन करें।", "पूर्ण स्क्रीन चालू नहीं हुई।", "फिर से जुड़ रहा है...", "कोई सहेजा सत्र नहीं। एक बार लॉग इन करें।", "हटाएं", "छवि चुनी गई"],
  ur: ["Viora کھل رہا ہے...", "چیٹ، تصاویر، ویڈیو، آڈیو اور نجی گفتگو۔", "لاگ اِن", "اکاؤنٹ بنائیں", "ای میل یا صارف نام", "پاس ورڈ", "داخل ہوں", "ظاہری نام", "صارف نام", "ای میل", "اکاؤنٹ بنائیں", "ہر ای میل، نام اور ڈیوائس کے لیے ایک اکاؤنٹ۔", "منسلک", "تازہ کریں", "مینو", "ترتیبات", "لاگ آؤٹ", "اکاؤنٹس تلاش کریں", "چیٹس", "اسٹیٹس", "کالز", "عام چیٹ", "تمام صارفین کے لیے عوامی گروپ", "ابھی", "اکاؤنٹس", "واپس", "تلاش", "مزید", "پیغامات تلاش کریں", "آخری پیغام", "بند کریں", "فائل منسلک کریں", "پیغام لکھیں", "آڈیو ریکارڈ", "بھیجنے کے اختیارات", "مسودہ صاف کریں", "منسلک فائل ہٹائیں", "بھیجیں", "ذاتی معلومات بدلیں", "تصویر، نام، ای میل اور تعارف", "رات اور دن موڈ", "ایپ کی شکل بدلیں", "زبان", "معلومات بدلیں", "پروفائل تصویر بدلیں", "کوئی تصویر منتخب نہیں", "تعارف", "دستیاب", "موجودہ پاس ورڈ", "نیا پاس ورڈ اختیاری", "تبدیلیاں محفوظ کریں", "معلومات بدلنے سے پہلے موجودہ پاس ورڈ درج کریں۔", "کسی اور کو بھیجیں", "پیغام بدلیں", "پیغام حذف کریں", "بھیجیں به", "منتخب اکاؤنٹس سے شیئر کریں", "ترمیم محفوظ کریں", "فائل دیکھیں", "فائل ڈاؤن لوڈ", "کوئی نتیجہ نہیں", "ابھی کوئی دوسرا اکاؤنٹ نہیں", "تمام صارفین", "صارف", "آگے بھیجا گیا", "شیئر کے لیے اکاؤنٹس نہیں۔", "فائل", "تصویر", "آڈیو کلپ", "ویڈیو دیکھیں", "آڈیو چلائیں", "ویڈیو چلائیں", "فل سکرین", "متن لوڈ ہو رہا ہے...", "متن نہیں دکھا۔ ڈاؤن لوڈ کریں۔", "براؤزر اس قسم کو فریم میں نہیں دکھا سکتا۔", "Viora نجی ویور ٹچ ڈیوائسز پر iframe کے بغیر دکھاتا ہے۔", "لاگ اِن ہو گیا۔", "اکاؤنٹ بن گیا۔", "تبدیلیاں محفوظ ہوئیں۔", "اکاؤنٹ اپڈیٹ ہوا۔", "لاگ آؤٹ ہو گیا۔", "اکاؤنٹس تازہ ہوئے۔", "صرف تصویر منتخب کریں۔", "پیغام حذف ہوا۔", "منتخب اکاؤنٹس سے شیئر ہوا۔", "پیغام بدل گیا۔", "پہلے لاگ اِن کریں۔", "فل سکرین فعال نہ ہو سکی۔", "دوبارہ جڑ رہا ہے...", "محفوظ سیشن نہیں۔ ایک بار لاگ اِن کریں۔", "ہٹائیں", "تصویر منتخب ہوئی"],
  zh: ["正在打开 Viora...", "聊天、照片、视频、音频和私密对话。", "登录", "创建账户", "邮箱或用户名", "密码", "登录", "显示名称", "用户名", "邮箱", "创建账户", "每个邮箱、用户名和设备只能一个账户。", "已连接", "刷新", "菜单", "设置", "退出登录", "搜索账户", "聊天", "状态", "通话", "公共聊天", "所有用户的公共群组", "现在", "账户", "返回", "搜索", "更多", "搜索消息", "最后一条消息", "关闭", "附加文件", "输入消息", "录制音频", "发送选项", "清空草稿", "移除附件", "发送", "编辑个人信息", "头像、姓名、邮箱和简介", "夜间和日间模式", "更改应用外观", "语言", "编辑信息", "更改头像", "未选择图片", "简介", "可用", "当前密码", "新密码可选", "保存更改", "编辑信息前请输入当前密码。", "转发给他人", "编辑消息", "删除消息", "发送给", "分享给选中账户", "保存编辑", "查看文件", "下载文件", "没有匹配结果", "还没有其他账户", "所有用户", "用户", "已转发", "没有可分享账户。", "文件", "图片", "音频片段", "查看视频", "播放音频", "播放视频", "全屏", "正在加载文本...", "无法显示文本，请使用下载按钮。", "此浏览器无法在框架中显示此类型。", "Viora 私有查看器在触控设备上无 iframe 显示。", "已登录。", "账户已创建。", "更改已保存。", "账户已更新。", "已退出。", "账户已刷新。", "只能选择图片文件。", "消息已删除。", "已分享给选中账户。", "消息已编辑。", "请先登录。", "无法启用全屏。", "正在重新连接...", "没有保存的会话，请登录一次。", "移除", "已选择图片"],
  id: ["Membuka Viora...", "Chat, foto, video, audio, dan percakapan pribadi.", "Masuk", "Buat akun", "Email atau nama pengguna", "Kata sandi", "Masuk", "Nama tampilan", "Nama pengguna", "Email", "Buat akun", "Satu akun per email, nama pengguna, dan perangkat.", "Terhubung", "Segarkan", "Menu", "Pengaturan", "Keluar", "Cari akun", "Chat", "Status", "Panggilan", "Chat umum", "Grup publik untuk semua pengguna", "Sekarang", "Akun", "Kembali", "Cari", "Lainnya", "Cari pesan", "Pesan terakhir", "Tutup", "Lampirkan file", "Tulis pesan", "Rekam audio", "Opsi kirim", "Hapus draf", "Hapus lampiran", "Kirim", "Edit info pribadi", "Foto, nama, email, dan tentang", "Mode malam dan siang", "Ubah tampilan aplikasi", "Bahasa", "Edit informasi", "Ganti foto profil", "Tidak ada gambar dipilih", "Tentang", "Tersedia", "Kata sandi saat ini", "Kata sandi baru opsional", "Simpan perubahan", "Masukkan kata sandi saat ini sebelum mengedit.", "Teruskan ke seseorang", "Edit pesan", "Hapus pesan", "Kirim ke", "Bagikan ke akun terpilih", "Simpan edit", "Lihat file", "Unduh file", "Tidak ada hasil", "Belum ada akun lain", "Semua pengguna", "Pengguna", "Diteruskan", "Tidak ada akun untuk berbagi.", "File", "Gambar", "Klip audio", "Lihat video", "Putar audio", "Putar video", "Layar penuh", "Memuat teks...", "Tidak dapat menampilkan teks. Gunakan unduh.", "Browser tidak dapat menampilkan tipe ini dalam frame.", "Viewer privat Viora menampilkan tanpa iframe pada perangkat sentuh.", "Berhasil masuk.", "Akun dibuat.", "Perubahan disimpan.", "Akun diperbarui.", "Berhasil keluar.", "Akun disegarkan.", "Pilih file gambar saja.", "Pesan dihapus.", "Dibagikan ke akun terpilih.", "Pesan diedit.", "Masuk dulu.", "Tidak dapat mengaktifkan layar penuh.", "Menghubungkan ulang...", "Tidak ada sesi tersimpan. Masuk sekali.", "Hapus", "Gambar dipilih"]
};

TR.ar.unexpectedError = "حدث خطأ غير متوقع.";
TR.en.unexpectedError = "An unexpected error occurred.";
TR.ar.private = "خاص";
TR.en.private = "Private";
TR.ar.edited = "تم التعديل";
TR.en.edited = "Edited";
TR.ar.privateViewer = "عارض Viora الخاص";
TR.en.privateViewer = "Viora private viewer";
TR.ar.seekAudio = "تحريك شريط الصوت";
TR.en.seekAudio = "Seek audio";
TR.ar.seekVideo = "تحريك شريط الفيديو";
TR.en.seekVideo = "Seek video";
TR.ar.today = "اليوم";
TR.en.today = "Today";
TR.ar.yesterday = "أمس";
TR.en.yesterday = "Yesterday";
TR.ar.typing = "يكتب...";
TR.en.typing = "typing...";
TR.ar.uploading = "يرفع ملفًا...";
TR.en.uploading = "uploading a file...";
TR.ar.sent = "تم الإرسال";
TR.en.sent = "Sent";
TR.ar.delivered = "تم التسليم";
TR.en.delivered = "Delivered";
TR.ar.read = "تمت القراءة";
TR.en.read = "Read";
TR.ar.pendingSync = "بانتظار المزامنة";
TR.en.pendingSync = "Waiting to sync";
TR.ar.messageQueuedOffline = "تم حفظ الرسالة، وسيتم إرسالها عند عودة الإنترنت.";
TR.en.messageQueuedOffline = "Message saved and will be sent when the internet returns.";
TR.ar.attachmentsNeedOnline = "يجب الاتصال بالإنترنت لإرسال المرفقات.";
TR.en.attachmentsNeedOnline = "Connect to the internet to send attachments.";
TR.ar.newMessages = "رسائل جديدة";
TR.en.newMessages = "new messages";
TR.ar.recording = "جاري التسجيل...";
TR.en.recording = "Recording...";
TR.ar.tapToStop = "اضغط لإيقاف التسجيل";
TR.en.tapToStop = "Tap to stop recording";
TR.ar.recordedAudio = "تسجيل صوتي";
TR.en.recordedAudio = "Voice recording";
TR.ar.microphoneError = "تعذر تشغيل الميكروفون.";
TR.en.microphoneError = "Could not start the microphone.";
TR.ar.clearChat = "مسح محتوى الدردشة";
TR.en.clearChat = "Clear chat";
TR.ar.confirmDelete = "تأكيد الحذف";
TR.en.confirmDelete = "Confirm delete";
TR.ar.deleteConfirm = "حذف";
TR.en.deleteConfirm = "Delete";
TR.ar.selectMessage = "تحديد";
TR.en.selectMessage = "Select";
TR.ar.closeConversation = "إغلاق المحادثة";
TR.en.closeConversation = "Close chat";
TR.ar.closeSelection = "إغلاق التحديد";
TR.en.closeSelection = "Close selection";
TR.ar.deleteSelected = "حذف المحدد";
TR.en.deleteSelected = "Delete selected";
TR.ar.forwardSelected = "إرسال المحدد";
TR.en.forwardSelected = "Forward selected";
TR.ar.confirmDeleteSelectedText = "اختر طريقة حذف الرسائل المحددة.";
TR.en.confirmDeleteSelectedText = "Choose how to delete the selected messages.";
TR.ar.deleteForMe = "الحذف لدي";
TR.en.deleteForMe = "Delete for me";
TR.ar.deleteForEveryone = "الحذف لدى الجميع";
TR.en.deleteForEveryone = "Delete for everyone";
TR.ar.cancel = "تراجع";
TR.en.cancel = "Cancel";
TR.ar.confirmDeleteMessageText = "اختر طريقة حذف الرسالة.";
TR.en.confirmDeleteMessageText = "Choose how to delete this message.";
TR.ar.confirmClearChatText = "هل تريد مسح محتوى هذه الدردشة كاملة؟ لا يمكن التراجع بعد المسح.";
TR.en.confirmClearChatText = "Clear all content in this chat? This cannot be undone.";
TR.ar.chatCleared = "تم مسح محتوى الدردشة.";
TR.en.chatCleared = "Chat content cleared.";
TR.ar.clearChatPending = "سيتم مسح محتوى الدردشة خلال 5 ثوانٍ.";
TR.en.clearChatPending = "Chat content will be cleared in 5 seconds.";
TR.ar.undoClearChat = "تراجع";
TR.en.undoClearChat = "Undo";
TR.ar.clearChatCanceled = "تم التراجع عن مسح الدردشة.";
TR.en.clearChatCanceled = "Chat clearing canceled.";
TR.ar.maxAttachments = "لا يمكن إرسال أكثر من 10 عناصر في المرة الواحدة.";
TR.en.maxAttachments = "You can send up to 10 items at once.";
TR.ar.sendingInProgress = "انتظر حتى ينتهي إرسال المرفقات الحالية.";
TR.en.sendingInProgress = "Wait until the current attachments finish sending.";
TR.ar.serverNeedsRestart = "أعد تشغيل الخادم لتفعيل تحديثات إرسال الصور.";
TR.en.serverNeedsRestart = "Restart the server to enable the new photo sending updates.";
Object.assign(TR.ar, {
  offline: "غير متصل",
  voiceCall: "مكالمة صوتية",
  acceptCall: "قبول",
  rejectCall: "رفض",
  endCall: "إنهاء الاتصال",
  calling: "جاري الاتصال...",
  incomingCall: "مكالمة واردة",
  callConnected: "المكالمة متصلة",
  callEnded: "انتهت المكالمة",
  callRejected: "تم رفض المكالمة",
  callMissed: "مكالمة فائتة",
  noCalls: "لا توجد مكالمات بعد.",
  callToday: "اليوم",
  callThisMonth: "هذا الشهر",
  callOlder: "أقدم",
  microphonePermission: "اسمح باستخدام الميكروفون لإجراء المكالمة.",
  callUnavailable: "المكالمات متاحة في المحادثات الخاصة فقط.",
  clearCallHistory: "حذف سجل المكالمات",
  callHistoryCleared: "تم حذف سجل المكالمات.",
  callAudioBlocked: "اضغط على نافذة الاتصال لتشغيل الصوت.",
  callClosedBy: "{name} قام بإغلاق المكالمة."
});
Object.assign(TR.en, {
  offline: "Offline",
  voiceCall: "Voice call",
  acceptCall: "Accept",
  rejectCall: "Reject",
  endCall: "End call",
  calling: "Calling...",
  incomingCall: "Incoming call",
  callConnected: "Call connected",
  callEnded: "Call ended",
  callRejected: "Call rejected",
  callMissed: "Missed call",
  noCalls: "No calls yet.",
  callToday: "Today",
  callThisMonth: "This month",
  callOlder: "Older",
  microphonePermission: "Allow microphone access to make the call.",
  callUnavailable: "Calls are available in private chats only.",
  clearCallHistory: "Clear call history",
  callHistoryCleared: "Call history cleared.",
  callAudioBlocked: "Tap the call window to play audio.",
  callClosedBy: "{name} ended the call."
});
const translationKeys = Object.keys(TR.ar);
Object.entries(EXTRA_TRANSLATIONS).forEach(([lang, values]) => {
  TR[lang] = Object.fromEntries(translationKeys.map((key, index) => [key, values[index] || TR.en[key] || TR.ar[key]]));
});
Object.assign(TR.fr, { unexpectedError: "Une erreur inattendue est survenue.", private: "Privé", edited: "Modifié", privateViewer: "Visualiseur privé Viora", seekAudio: "Parcourir l'audio", seekVideo: "Parcourir la vidéo" });
Object.assign(TR.es, { unexpectedError: "Ocurrió un error inesperado.", private: "Privado", edited: "Editado", privateViewer: "Visor privado de Viora", seekAudio: "Mover audio", seekVideo: "Mover video" });
Object.assign(TR.de, { unexpectedError: "Ein unerwarteter Fehler ist aufgetreten.", private: "Privat", edited: "Bearbeitet", privateViewer: "Privater Viora-Viewer", seekAudio: "Audio suchen", seekVideo: "Video suchen" });
Object.assign(TR.tr, { unexpectedError: "Beklenmeyen bir hata oluştu.", private: "Özel", edited: "Düzenlendi", privateViewer: "Viora özel görüntüleyici", seekAudio: "Sesi kaydır", seekVideo: "Videoyu kaydır" });
Object.assign(TR.hi, { unexpectedError: "अनपेक्षित त्रुटि हुई।", private: "निजी", edited: "संपादित", privateViewer: "Viora निजी व्यूअर", seekAudio: "ऑडियो चलाएं", seekVideo: "वीडियो चलाएं" });
Object.assign(TR.ur, { unexpectedError: "غیر متوقع خرابی ہوئی۔", private: "نجی", edited: "ترمیم شدہ", privateViewer: "Viora نجی ویور", seekAudio: "آڈیو آگے پیچھے کریں", seekVideo: "ویڈیو آگے پیچھے کریں" });
Object.assign(TR.zh, { unexpectedError: "发生意外错误。", private: "私密", edited: "已编辑", privateViewer: "Viora 私有查看器", seekAudio: "拖动音频", seekVideo: "拖动视频" });
Object.assign(TR.id, { unexpectedError: "Terjadi kesalahan tidak terduga.", private: "Pribadi", edited: "Diedit", privateViewer: "Viewer privat Viora", seekAudio: "Geser audio", seekVideo: "Geser video" });
Object.assign(TR.fr, { deleteForMe: "Supprimer pour moi", deleteForEveryone: "Supprimer pour tout le monde", confirmDeleteMessageText: "Choisissez comment supprimer ce message." });
Object.assign(TR.es, { deleteForMe: "Eliminar para mí", deleteForEveryone: "Eliminar para todos", confirmDeleteMessageText: "Elige cómo eliminar este mensaje." });
Object.assign(TR.de, { deleteForMe: "Für mich löschen", deleteForEveryone: "Für alle löschen", confirmDeleteMessageText: "Wählen Sie, wie diese Nachricht gelöscht wird." });
Object.assign(TR.tr, { deleteForMe: "Benim için sil", deleteForEveryone: "Herkes için sil", confirmDeleteMessageText: "Bu mesajın nasıl silineceğini seçin." });
Object.assign(TR.hi, { deleteForMe: "मेरे लिए हटाएं", deleteForEveryone: "सभी के लिए हटाएं", confirmDeleteMessageText: "यह संदेश कैसे हटाना है चुनें।" });
Object.assign(TR.ur, { deleteForMe: "میرے لیے حذف کریں", deleteForEveryone: "سب کے لیے حذف کریں", confirmDeleteMessageText: "پیغام حذف کرنے کا طریقہ منتخب کریں۔" });
Object.assign(TR.zh, { deleteForMe: "为我删除", deleteForEveryone: "为所有人删除", confirmDeleteMessageText: "选择删除这条消息的方式。" });
Object.assign(TR.id, { deleteForMe: "Hapus untuk saya", deleteForEveryone: "Hapus untuk semua", confirmDeleteMessageText: "Pilih cara menghapus pesan ini." });
Object.assign(TR.fr, { selectMessage: "Sélectionner", deleteSelected: "Supprimer la sélection", forwardSelected: "Transférer la sélection", confirmDeleteSelectedText: "Choisissez comment supprimer les messages sélectionnés." });
Object.assign(TR.es, { selectMessage: "Seleccionar", deleteSelected: "Eliminar selección", forwardSelected: "Reenviar selección", confirmDeleteSelectedText: "Elige cómo eliminar los mensajes seleccionados." });
Object.assign(TR.de, { selectMessage: "Auswählen", deleteSelected: "Auswahl löschen", forwardSelected: "Auswahl weiterleiten", confirmDeleteSelectedText: "Wählen Sie, wie die ausgewählten Nachrichten gelöscht werden." });
Object.assign(TR.tr, { selectMessage: "Seç", deleteSelected: "Seçileni sil", forwardSelected: "Seçileni ilet", confirmDeleteSelectedText: "Seçilen mesajların nasıl silineceğini seçin." });
Object.assign(TR.hi, { selectMessage: "चुनें", deleteSelected: "चुने हुए हटाएं", forwardSelected: "चुने हुए भेजें", confirmDeleteSelectedText: "चुने गए संदेश कैसे हटाने हैं चुनें।" });
Object.assign(TR.ur, { selectMessage: "منتخب کریں", deleteSelected: "منتخب حذف کریں", forwardSelected: "منتخب آگے بھیجیں", confirmDeleteSelectedText: "منتخب پیغامات حذف کرنے کا طریقہ منتخب کریں۔" });
Object.assign(TR.zh, { selectMessage: "选择", deleteSelected: "删除所选", forwardSelected: "转发所选", confirmDeleteSelectedText: "选择删除所选消息的方式。" });
Object.assign(TR.id, { selectMessage: "Pilih", deleteSelected: "Hapus pilihan", forwardSelected: "Teruskan pilihan", confirmDeleteSelectedText: "Pilih cara menghapus pesan yang dipilih." });
Object.assign(TR.fr, { closeConversation: "Fermer la discussion" });
Object.assign(TR.es, { closeConversation: "Cerrar chat" });
Object.assign(TR.de, { closeConversation: "Chat schließen" });
Object.assign(TR.tr, { closeConversation: "Sohbeti kapat" });
Object.assign(TR.hi, { closeConversation: "चैट बंद करें" });
Object.assign(TR.ur, { closeConversation: "چیٹ بند کریں" });
Object.assign(TR.zh, { closeConversation: "关闭聊天" });
Object.assign(TR.id, { closeConversation: "Tutup chat" });
Object.assign(TR.fr, { closeSelection: "Fermer la sélection" });
Object.assign(TR.es, { closeSelection: "Cerrar selección" });
Object.assign(TR.de, { closeSelection: "Auswahl schließen" });
Object.assign(TR.tr, { closeSelection: "Seçimi kapat" });
Object.assign(TR.hi, { closeSelection: "चयन बंद करें" });
Object.assign(TR.ur, { closeSelection: "انتخاب بند کریں" });
Object.assign(TR.zh, { closeSelection: "关闭选择" });
Object.assign(TR.id, { closeSelection: "Tutup pilihan" });

function t(key) {
  return TR[state.language]?.[key] || TR.en[key] || TR.ar[key] || key;
}

function languageInfo(code = state.language) {
  return LANGUAGES.find(([lang]) => lang === code) || LANGUAGES[0];
}

function applyLanguage(language = state.language) {
  state.language = TR[language] ? language : "ar";
  localStorage.setItem("vioraLanguage", state.language);
  const [, label, dir] = languageInfo(state.language);
  document.documentElement.lang = state.language;
  document.documentElement.dir = dir;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  if (els.languageLabel) els.languageLabel.textContent = label;
  renderLanguagePanel();
  if (state.user) {
    setAuthenticated(state.user);
    renderUsers();
    rerenderMessages();
  }
}

function renderLanguagePanel() {
  if (!els.languagePanel) return;
  els.languagePanel.textContent = "";
  LANGUAGES.forEach(([code, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = code === state.language ? "active" : "";
    button.textContent = label;
    button.addEventListener("click", () => {
      applyLanguage(code);
      hideFloatingElement(els.languagePanel);
    });
    els.languagePanel.appendChild(button);
  });
}

applyTheme(localStorage.getItem("vioraTheme") || "light");
applyLanguage(state.language);

document.addEventListener("fullscreenchange", () => {
  document.body.classList.toggle("ccvve", document.fullscreenElement?.classList?.contains("video-player"));
});

document.addEventListener("webkitfullscreenchange", () => {
  document.body.classList.toggle("ccvve", document.webkitFullscreenElement?.classList?.contains("video-player"));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations?.()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});
  });
}

function getDeviceId() {
  const existing = localStorage.getItem("vioraDeviceId");
  if (existing) return existing;
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  localStorage.setItem("vioraDeviceId", id);
  return id;
}

function storeRememberSession(user, rememberToken) {
  if (!user || !rememberToken) return;
  localStorage.setItem("vioraRememberUserId", user.id);
  localStorage.setItem("vioraRememberToken", rememberToken);
}

function clearRememberSession() {
  localStorage.removeItem("vioraRememberUserId");
  localStorage.removeItem("vioraRememberToken");
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function cacheKey(name, userId = state.user?.id || "guest") {
  return `vioraOffline:${userId}:${name}`;
}

function cachedCurrentUser() {
  return safeJsonParse(localStorage.getItem("vioraOffline:currentUser"), null);
}

function cacheCurrentUser(user) {
  if (!user) return;
  localStorage.setItem("vioraOffline:currentUser", JSON.stringify(user));
}

function cacheUsers() {
  if (!state.user) return;
  localStorage.setItem(cacheKey("users"), JSON.stringify(Array.from(state.users.values())));
}

function cachedUsers() {
  return safeJsonParse(localStorage.getItem(cacheKey("users")), []);
}

function cacheMessages(conversationId = conversationIdFor()) {
  if (!state.user || !conversationId) return;
  const messages = Array.from(state.messages.values())
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-300);
  localStorage.setItem(cacheKey(`messages:${conversationId}`), JSON.stringify(messages));
}

function cachedMessages(conversationId = conversationIdFor()) {
  return safeJsonParse(localStorage.getItem(cacheKey(`messages:${conversationId}`)), []);
}

function messagesContentSignature(messages = []) {
  return JSON.stringify([...messages]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((message) => ({
      id: message.id,
      createdAt: message.createdAt,
      text: message.text || "",
      pending: Boolean(message.pending),
      media: message.media ? {
        url: message.media.url || "",
        name: message.media.name || "",
        mime: message.media.mime || "",
        size: message.media.size || 0
      } : null,
      mediaGroup: Array.isArray(message.mediaGroup) ? message.mediaGroup.map((item) => ({
        url: item.url || "",
        name: item.name || "",
        mime: item.mime || "",
        size: item.size || 0
      })) : null
    })));
}

function updateRenderedMessagesSignature(conversationId = conversationIdFor()) {
  state.renderedConversationId = conversationId;
  state.renderedMessagesSignature = messagesContentSignature(Array.from(state.messages.values()));
}

function pendingQueue() {
  return safeJsonParse(localStorage.getItem(cacheKey("pending")), []);
}

function savePendingQueue(queue) {
  if (!state.user) return;
  localStorage.setItem(cacheKey("pending"), JSON.stringify(queue));
}

function pendingDeleteQueue() {
  return safeJsonParse(localStorage.getItem(cacheKey("pendingDeletes")), []);
}

function savePendingDeleteQueue(queue) {
  if (!state.user) return;
  localStorage.setItem(cacheKey("pendingDeletes"), JSON.stringify(queue));
}

function schedulePendingDeleteSync(delay = 0) {
  if (!state.user) return;
  clearTimeout(state.deleteSyncTimer);
  state.deleteSyncTimer = setTimeout(syncPendingDeletes, delay);
}

function isPendingDeleted(messageId) {
  return pendingDeleteQueue().some((item) => item.messageId === messageId);
}

function openPendingMediaDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PENDING_MEDIA_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PENDING_MEDIA_STORE)) db.createObjectStore(PENDING_MEDIA_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB error"));
  });
}

async function pendingMediaStore(mode, callback) {
  const db = await openPendingMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PENDING_MEDIA_STORE, mode);
    const store = transaction.objectStore(PENDING_MEDIA_STORE);
    const result = callback(store);
    transaction.oncomplete = () => {
      db.close();
      resolve(result?.result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB error"));
    };
  });
}

function pendingFileId(localId, index) {
  return `${state.user?.id || "guest"}:${localId}:${index}`;
}

async function savePendingFile(id, file) {
  await pendingMediaStore("readwrite", (store) => store.put({
    id,
    blob: file,
    name: file.name || "attachment",
    type: file.type || "application/octet-stream",
    size: file.size || 0
  }));
}

async function getPendingFile(id) {
  const record = await pendingMediaStore("readonly", (store) => store.get(id));
  if (!record?.blob) return null;
  return new File([record.blob], record.name || "attachment", { type: record.type || record.blob.type || "application/octet-stream" });
}

async function deletePendingFiles(fileIds = []) {
  if (!fileIds.length) return;
  await pendingMediaStore("readwrite", (store) => {
    fileIds.forEach((id) => store.delete(id));
  });
}

async function removeQueuedOutgoingMessage(localId) {
  const queue = pendingQueue();
  const item = queue.find((entry) => entry.localId === localId);
  if (!item) return false;
  savePendingQueue(queue.filter((entry) => entry.localId !== localId));
  if (item.kind === "media") await deletePendingFiles(item.fileIds || []);
  return true;
}

function isOfflineError(error) {
  return error instanceof TypeError || !navigator.onLine || /Failed to fetch|NetworkError|Load failed/i.test(error?.message || "");
}

async function api(path, options = {}) {
  const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  const response = await fetch(serverUrl(path), {
    credentials: IS_LOCAL_APP ? "include" : "same-origin",
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    if (String(path).startsWith("/api/")) throw new Error(t("serverNeedsRestart"));
  }
  if (!response.ok) throw new Error(payload.error || t("unexpectedError"));
  return payload;
}

function showPage(name) {
  els.loadingPage.classList.toggle("hidden", name !== "loading");
  els.authPage.classList.toggle("hidden", name !== "auth");
  els.accountsPage.classList.toggle("hidden", name !== "accounts");
  els.chatPage.classList.toggle("hidden", name !== "chat");
  els.settingsPage.classList.toggle("hidden", name !== "settings");
  hideFloatingElement(els.overflowMenu);
  closeFloatingMenus();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add("hidden"), 3200);
}

function handleConnectionLabelChange(wasOnline, isOnlineNow) {
  if (!wasOnline && isOnlineNow) window.vioraNetworkBack?.();
}

function updateAccountLabel() {
  if (!state.user || !els.accountLabel) return;
  const wasOnline = els.accountLabel.dataset.online === "true";
  const isOnlineNow = navigator.onLine;
  els.accountLabel.dataset.online = isOnlineNow ? "true" : "false";
  els.accountLabel.textContent = `@${state.user.username} · ${isOnlineNow ? t("connected") : t("offline")}`;
  handleConnectionLabelChange(wasOnline, isOnlineNow);
}

function setNotice(node, message, isError = false) {
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function conversationIdFor(type = state.activeChat.type, user = state.activeChat.user) {
  if (type === "general") return "general";
  return user?.id && state.user?.id ? directConversationId(state.user.id, user.id) : "";
}

function messageConversationId(message) {
  if (!message) return "general";
  return message.conversationId || "general";
}

function canSeeRealtimeMessage(message) {
  if (!state.user || !message) return false;
  if (messageConversationId(message) === "general") return true;
  return message.userId === state.user.id || message.recipientId === state.user.id;
}

function isChatPageVisible() {
  return !els.chatPage.classList.contains("hidden");
}

function formatDateSeparator(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startToday - startDate) / 86400000);
  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("yesterday");
  return date.toLocaleDateString(state.language || "ar", { day: "numeric", month: "long", year: "numeric" });
}

function playTone(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = state.audioContext || new AudioContext();
    state.audioContext = ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = type === "send" ? 620 : 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(type === "send" ? 0.045 : 0.06, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (type === "send" ? 0.11 : 0.18));
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + (type === "send" ? 0.12 : 0.19));
  } catch {
    // Audio is best-effort; browsers may block it until the first user gesture.
  }
}

function callPeerUser(call) {
  if (!call || !state.user) return null;
  if (call.otherUser) return call.otherUser;
  const otherId = call.fromId === state.user.id ? call.toId : call.fromId;
  return state.users.get(otherId) || null;
}

function callStatusText(call) {
  if (!call) return t("calling");
  if (call.status === "active") return t("callConnected");
  if (call.status === "rejected") return t("callRejected");
  if (call.status === "missed") return t("callMissed");
  if (call.status === "ended") return t("callEnded");
  return call.toId === state.user?.id ? t("incomingCall") : t("calling");
}

function showCallWindow(user, status, incoming = false) {
  els.callTitle.textContent = user?.name || t("voiceCall");
  els.callStatus.textContent = status;
  if (els.callAvatar) setAvatar(els.callAvatar, user);
  state.cameraOn = false;
  updateVideoButton();
  els.callWindow.classList.remove("has-remote-video");
  els.callWindow.classList.toggle("incoming-call", incoming);
  els.callWindow.classList.toggle("active-call", !incoming);
  els.acceptCallButton.classList.toggle("hidden", !incoming);
  els.rejectCallButton.classList.toggle("hidden", !incoming);
  els.endCallButton.classList.toggle("hidden", incoming);
  closeAllMenus();
  closeAllModals(els.callWindow);
  showOverlay();
  showFloatingElement(els.callWindow);
}

function closeCallWindowOnly() {
  hideFloatingElement(els.callWindow);
  hideOverlay();
}

async function sendCallAction(callId, action, extra = {}) {
  return api(`/api/calls/${encodeURIComponent(callId)}`, {
    method: "POST",
    body: JSON.stringify({ action, ...extra })
  });
}

async function sendCallSignal(callId, signal) {
  try {
    await sendCallAction(callId, "signal", { signal });
  } catch {
    // Signaling is best-effort while the peer connection is closing.
  }
}

async function getCallStream() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error(t("microphonePermission"));
  const attempts = [
    {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      },
      video: false
    },
    { audio: true, video: false }
  ];
  let lastError;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(lastError?.message || t("microphonePermission"));
}

function playRemoteCallAudio(stream) {
  if (!els.remoteCallAudio || !stream) return;
  els.remoteCallAudio.srcObject = stream;
  els.remoteCallAudio.muted = false;
  els.remoteCallAudio.volume = 1;
  els.remoteCallAudio.play?.().catch(() => showToast(t("callAudioBlocked")));
}

function playRemoteCallVideo(stream) {
  if (!els.remoteCallVideo || !stream) return;
  els.remoteCallVideo.srcObject = stream;
  els.remoteCallVideo.play?.().catch(() => {});
  els.callWindow.classList.add("has-remote-video");
}

function updateVideoButton() {
  if (!els.videocamButton) return;
  els.videocamButton.classList.toggle("active", state.cameraOn);
  els.videocamButton.innerHTML = `<ion-icon name="${state.cameraOn ? "videocam" : "videocam-outline"}"></ion-icon>`;
  els.callWindow?.classList.toggle("local-camera-on", state.cameraOn);
}

async function renegotiateActiveCall() {
  const active = state.activeCall;
  const pc = active?.peerConnection;
  if (!active?.id || !pc) return;
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await sendCallSignal(active.id, { description: pc.localDescription });
}

async function toggleCallCamera() {
  const active = state.activeCall;
  const pc = active?.peerConnection;
  if (!active || !pc) return;
  if (state.cameraOn) {
    state.localVideoStream?.getTracks().forEach((track) => {
      track.stop();
      const sender = pc.getSenders().find((item) => item.track === track);
      if (sender) pc.removeTrack(sender);
    });
    state.localVideoStream = null;
    state.cameraOn = false;
    updateVideoButton();
    await sendCallSignal(active.id, { camera: false });
    await renegotiateActiveCall();
    return;
  }
  const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  videoStream.getVideoTracks().forEach((track) => pc.addTrack(track, videoStream));
  state.localVideoStream = videoStream;
  state.cameraOn = true;
  updateVideoButton();
  await sendCallSignal(active.id, { camera: true });
  await renegotiateActiveCall();
}

function setupPeerConnection(callId, peerId, stream) {
  const pc = new RTCPeerConnection(RTC_CONFIGURATION);
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  pc.onicecandidate = (event) => {
    if (event.candidate) sendCallSignal(callId, { candidate: event.candidate });
  };
  pc.ontrack = (event) => {
    if (event.track.kind === "video") playRemoteCallVideo(event.streams[0]);
    else playRemoteCallAudio(event.streams[0]);
  };
  pc.onconnectionstatechange = () => {
    if (!state.activeCall || state.activeCall.id !== callId) return;
    if (pc.connectionState === "connected") els.callStatus.textContent = t("callConnected");
    if (["failed", "closed", "disconnected"].includes(pc.connectionState)) els.callStatus.textContent = t("callEnded");
  };
  state.activeCall.peerConnection = pc;
  state.activeCall.peerId = peerId;
  return pc;
}

async function applyCallSignal(signal) {
  const active = state.activeCall;
  if (!active?.peerConnection || !signal) return false;
  if (signal.camera === false) {
    if (els.remoteCallVideo) {
      els.remoteCallVideo.pause();
      els.remoteCallVideo.srcObject = null;
    }
    els.callWindow?.classList.remove("has-remote-video");
    return true;
  }
  const pc = active.peerConnection;
  if (signal.description) {
    await pc.setRemoteDescription(signal.description);
    const queued = state.pendingCallSignals.get(active.id) || [];
    state.pendingCallSignals.delete(active.id);
    if (signal.description.type === "offer") {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendCallSignal(active.id, { description: pc.localDescription });
    }
    for (const queuedSignal of queued) await applyCallSignal(queuedSignal);
    return true;
  }
  if (signal.candidate) {
    if (!pc.remoteDescription) {
      const queued = state.pendingCallSignals.get(active.id) || [];
      queued.push(signal);
      state.pendingCallSignals.set(active.id, queued);
      return false;
    }
    await pc.addIceCandidate(signal.candidate);
    return true;
  }
  return false;
}

async function flushPendingCallSignals(callId) {
  const signals = state.pendingCallSignals.get(callId) || [];
  state.pendingCallSignals.delete(callId);
  for (const signal of signals) await applyCallSignal(signal);
}

async function beginVoiceCall(user) {
  if (!user) return showToast(t("callUnavailable"));
  if (state.activeCall) return showToast(t("calling"));
  try {
    const stream = await getCallStream();
    const { call } = await api("/api/calls", {
      method: "POST",
      body: JSON.stringify({ recipientId: user.id })
    });
    state.activeCall = { ...call, peerUser: user, localStream: stream, direction: "outgoing" };
    showCallWindow(user, t("calling"), false);
    const pc = setupPeerConnection(call.id, user.id, stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendCallSignal(call.id, { description: pc.localDescription });
  } catch (error) {
    showToast(error.message || t("microphonePermission"));
    endLocalCall(false);
  }
}

function receiveIncomingCall(call) {
  if (!state.user || call.toId !== state.user.id || call.status !== "ringing") return;
  if (state.activeCall) {
    sendCallAction(call.id, "reject").catch(() => {});
    return;
  }
  const user = call.fromUser || state.users.get(call.fromId);
  state.activeCall = { ...call, peerUser: user, direction: "incoming" };
  showCallWindow(user, t("incomingCall"), true);
  playTone("receive");
}

async function acceptIncomingCall() {
  const active = state.activeCall;
  if (!active) return;
  try {
    const stream = await getCallStream();
    state.activeCall.localStream = stream;
    await sendCallAction(active.id, "accept");
    els.acceptCallButton.classList.add("hidden");
    els.rejectCallButton.classList.add("hidden");
    els.endCallButton.classList.remove("hidden");
    els.callWindow.classList.remove("incoming-call");
    els.callWindow.classList.add("active-call");
    els.callStatus.textContent = t("callConnected");
    setupPeerConnection(active.id, active.fromId, stream);
    await flushPendingCallSignals(active.id);
  } catch (error) {
    showToast(error.message || t("microphonePermission"));
    await endLocalCall(true, "reject");
  }
}

async function endLocalCall(send = true, action = "end") {
  const active = state.activeCall;
  state.activeCall = null;
  if (active?.peerConnection) active.peerConnection.close();
  active?.localStream?.getTracks().forEach((track) => track.stop());
  state.localVideoStream?.getTracks().forEach((track) => track.stop());
  state.localVideoStream = null;
  state.cameraOn = false;
  updateVideoButton();
  if (els.remoteCallAudio) {
    els.remoteCallAudio.pause();
    els.remoteCallAudio.srcObject = null;
  }
  if (els.remoteCallVideo) {
    els.remoteCallVideo.pause();
    els.remoteCallVideo.srcObject = null;
  }
  els.callWindow?.classList.remove("has-remote-video");
  closeCallWindowOnly();
  if (send && active?.id) {
    try {
      await sendCallAction(active.id, action);
    } catch (error) {
      showToast(error.message);
    }
  }
  loadCalls().catch(() => {});
}

async function handleCallSignal(payload) {
  if (!state.user || payload.toId !== state.user.id) return;
  if (!state.activeCall || state.activeCall.id !== payload.callId || !state.activeCall.peerConnection) {
    const queued = state.pendingCallSignals.get(payload.callId) || [];
    queued.push(payload.signal);
    state.pendingCallSignals.set(payload.callId, queued);
    return;
  }
  try {
    await applyCallSignal(payload.signal);
  } catch {
    els.callStatus.textContent = t("callEnded");
  }
}

function handleCallUpdate(payload) {
  const call = payload.call;
  if (!state.user || !call || (call.fromId !== state.user.id && call.toId !== state.user.id)) return;
  state.calls = [call, ...state.calls.filter((item) => item.id !== call.id)];
  renderCalls();
  if (!state.activeCall || state.activeCall.id !== call.id) return;
  els.callStatus.textContent = callStatusText(call);
  if (["ended", "missed", "rejected"].includes(call.status)) {
    const closedByOther = payload.actor?.id && payload.actor.id !== state.user.id;
    const actorName = payload.actor?.name || callPeerUser(call)?.name || t("user");
    endLocalCall(false);
    if (closedByOther) {
      openConfirmModal({
        title: t("callEnded"),
        text: t("callClosedBy").replace("{name}", actorName),
        mode: "notification"
      });
    }
  }
}

function renderCalls() {
  if (!els.callUsers || !els.callHistory) return;
  const users = Array.from(state.users.values());
  els.callUsers.innerHTML = users.length ? users.map((user) => `
    <div class="call-row">
      <span class="avatar" data-avatar-user="${escapeHtml(user.id)}">${escapeHtml(initials(user.name))}</span>
      <span><strong>${escapeHtml(user.name)}</strong><small>@${escapeHtml(user.username)}</small></span>
      <button type="button" data-call-user="${escapeHtml(user.id)}" aria-label="${escapeHtml(t("voiceCall"))}"><ion-icon name="call-outline"></ion-icon></button>
    </div>
  `).join("") : `<p class="empty-users">${escapeHtml(t("noOtherAccounts"))}</p>`;
  els.callUsers.querySelectorAll("[data-avatar-user]").forEach((node) => setAvatar(node, state.users.get(node.dataset.avatarUser)));
  els.callUsers.querySelectorAll("[data-call-user]").forEach((button) => {
    button.addEventListener("click", () => beginVoiceCall(state.users.get(button.dataset.callUser)));
  });
  if (!state.calls.length) {
    els.callHistory.innerHTML = `<p class="empty-users">${escapeHtml(t("noCalls"))}</p>`;
    return;
  }
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const groups = new Map();
  state.calls.forEach((call) => {
    const date = new Date(call.startedAt);
    const key = date.toDateString() === now.toDateString() ? t("callToday") : `${date.getFullYear()}-${date.getMonth()}` === monthKey ? t("callThisMonth") : t("callOlder");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(call);
  });
  els.callHistory.innerHTML = Array.from(groups.entries()).map(([title, calls]) => `
    <div class="call-section-title">${escapeHtml(title)}</div>
    ${calls.map((call) => {
      const user = callPeerUser(call);
      const date = new Date(call.startedAt);
      return `<div class="call-row">
        <span class="avatar">${escapeHtml(initials(user?.name || t("user")))}</span>
        <span><strong>${escapeHtml(user?.name || t("user"))}</strong><small>${escapeHtml(callStatusText(call))} · ${date.toLocaleTimeString(state.language || "ar", { hour: "2-digit", minute: "2-digit" })}</small></span>
        <button type="button" data-call-user="${escapeHtml(user?.id || "")}" aria-label="${escapeHtml(t("voiceCall"))}"><ion-icon name="call-outline"></ion-icon></button>
      </div>`;
    }).join("")}
  `).join("");
  els.callHistory.querySelectorAll("[data-call-user]").forEach((button) => {
    button.addEventListener("click", () => beginVoiceCall(state.users.get(button.dataset.callUser)));
  });
}

async function loadCalls() {
  const { calls } = await api("/api/calls");
  state.calls = calls || [];
  renderCalls();
}

async function clearCallHistory() {
  await api("/api/calls", { method: "DELETE" });
  state.calls = [];
  renderCalls();
  showToast(t("callHistoryCleared"));
}

async function openCallsModal() {
  closeAllMenus();
  closeAllModals(els.callsModal);
  showOverlay();
  showFloatingElement(els.callsModal);
  await loadCalls();
}

function isShown(node) {
  return node && !node.classList.contains("hidden") && !node.classList.contains("is-closing");
}

function showFloatingElement(node) {
  if (!node) return;
  clearTimeout(transitionTimers.get(node));
  node.classList.remove("hidden", "is-closing");
}

function hideFloatingElement(node) {
  if (!node || node.classList.contains("hidden")) return;
  clearTimeout(transitionTimers.get(node));
  node.classList.add("is-closing");
  transitionTimers.set(node, setTimeout(() => {
    node.classList.add("hidden");
    node.classList.remove("is-closing");
  }, 220));
}

function showOverlay(clear = false) {
  els.messageOverlay.classList.toggle("clear-overlay", clear);
  showFloatingElement(els.messageOverlay);
}

function setViewerOverlay(active) {
  els.messageOverlay.classList.toggle("viewer-overlay", active);
}

function hideOverlay() {
  if (isShown(els.messageContextMenu) || isShown(els.shareModal) || isShown(els.editModal) || isShown(els.confirmModal) || isShown(els.viewerModal) || isShown(els.callsModal) || isShown(els.callWindow)) return;
  setViewerOverlay(false);
  hideFloatingElement(els.messageOverlay);
}

function closeAllMenus(except) {
  [els.overflowMenu, els.chatMenu, els.composerMenu, els.languagePanel].forEach((menu) => {
    if (menu !== except) hideFloatingElement(menu);
  });
  if (!except) hideFloatingElement(els.menuOverlay);
}

function closeAllModals(except) {
  [els.shareModal, els.editModal, els.confirmModal, els.viewerModal, els.callsModal, els.callWindow].forEach((modal) => {
    if (modal !== except) hideFloatingElement(modal);
  });
}

function toggleMenu(menu) {
  if (isShown(menu)) {
    hideFloatingElement(menu);
    hideFloatingElement(els.menuOverlay);
    return;
  }
  closeAllMenus(menu);
  closeMessageContextMenu();
  showFloatingElement(els.menuOverlay);
  showFloatingElement(menu);
}

function closeFloatingMenus() {
  closeAllMenus();
  closeMessageContextMenu();
}

function setAuthenticated(user) {
  state.user = user;
  if (!user) {
    state.users.clear();
    state.messages.clear();
    if (state.events) state.events.close();
    renderUsers();
    showPage("auth");
    return;
  }

  cacheCurrentUser(user);
  updateAccountLabel();
  els.settingsName.textContent = user.name;
  els.settingsUsername.textContent = `@${user.username}`;
  setAvatar(els.settingsAvatar, user);
  fillProfileForm(user);
  startEvents();
  showPage("accounts");
}

function fillProfileForm(user) {
  els.profileForm.name.value = user.name || "";
  els.profileForm.username.value = user.username || "";
  els.profileForm.email.value = user.email || "";
  els.profileForm.about.value = user.about || t("available");
  els.profileForm.password.value = "";
  els.profileForm.newPassword.value = "";
  if (els.avatarInput) els.avatarInput.value = "";
  if (els.avatarFileName) els.avatarFileName.textContent = t("noImageSelected");
}

function switchAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  els.loginForm.classList.toggle("hidden", tab !== "login");
  els.registerForm.classList.toggle("hidden", tab !== "register");
  setNotice(els.authNotice, t("authNotice"));
}

function setUsers(users) {
  state.users.clear();
  users.forEach((user) => state.users.set(user.id, user));
  cacheUsers();
  renderUsers();
}

function addOrUpdateUser(user) {
  if (!state.user || user.id === state.user.id) {
    if (state.user && user.id === state.user.id) {
      state.user = user;
      setAuthenticated(user);
    }
    return;
  }
  state.users.set(user.id, user);
  if (state.activeChat.user?.id === user.id) {
    state.activeChat.user = user;
    updateChatHeader();
  }
  cacheUsers();
  renderUsers();
}

function renderUsers() {
  els.usersList.textContent = "";
  if (!state.user) return;
  const generalUnread = state.unread.get("general") || 0;
  const generalTyping = state.typing.get("general");
  const generalBadge = els.generalChatButton.querySelector("em");
  const generalSmall = els.generalChatButton.querySelector("small");
  if (generalBadge) {
    generalBadge.classList.toggle("unread-dot", generalUnread > 0);
    generalBadge.textContent = generalUnread > 0 ? String(generalUnread) : t("now");
    generalBadge.title = generalUnread > 0 ? `${generalUnread} ${t("newMessages")}` : t("now");
  }
  if (generalSmall) {
    generalSmall.textContent = generalTyping ? (generalTyping.kind === "upload" ? t("uploading") : t("typing")) : t("generalChatDesc");
  }

  const query = normalizeForSearch(state.search);
  const users = Array.from(state.users.values())
    .filter((user) => {
      const haystack = normalizeForSearch(`${user.name} ${user.username} ${user.about || ""}`);
      return !query || haystack.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  if (!users.length) {
    const empty = document.createElement("p");
    empty.className = "empty-users";
    empty.textContent = state.search ? t("noResults") : t("noOtherAccounts");
    els.usersList.appendChild(empty);
    return;
  }

  users.forEach((user) => {
    const conversationId = directConversationId(state.user.id, user.id);
    const unread = state.unread.get(conversationId) || 0;
    const typing = state.typing.get(conversationId);
    const row = document.createElement("button");
    row.className = `chat-row user-row${unread ? " has-unread" : ""}${typing ? " is-typing" : ""}`;
    row.type = "button";
    row.innerHTML = `
      <span class="avatar" data-avatar-user="${escapeHtml(user.id)}">${escapeHtml(initials(user.name))}</span>
      <span>
        <strong>${escapeHtml(user.name)}</strong>
        <small>${typing ? escapeHtml(typing.kind === "upload" ? t("uploading") : t("typing")) : `@${escapeHtml(user.username)} · ${escapeHtml(user.about || t("available"))}`}</small>
      </span>
      <em class="${unread ? "unread-dot" : ""}" title="${unread ? `${unread} ${t("newMessages")}` : escapeHtml(t("private"))}">${unread ? unread : escapeHtml(t("private"))}</em>
    `;
    setAvatar(row.querySelector(".avatar"), user);
    row.addEventListener("click", () => openChat("direct", user));
    els.usersList.appendChild(row);
  });
}

async function openChat(type, user = null) {
  state.activeChat = { type, user };
  state.unread.delete(conversationIdFor(type, user));
  state.messageSearch = "";
  state.selectionMode = false;
  state.selectedMessageIds.clear();
  els.messageSearchInput.value = "";
  els.messageSearchBar.classList.add("hidden");
  updateChatHeader();
  renderUsers();
  showPage("chat");
  await loadMessages();
  scrollMessagesToBottom(3000);
}

function updateChatHeader() {
  const conversationId = conversationIdFor();
  const typing = state.typing.get(conversationId);
  if (typing) {
    els.statusLine.textContent = typing.kind === "upload" ? t("uploading") : t("typing");
    return;
  }
  if (state.activeChat.type === "general") {
    els.chatAvatar.textContent = t("generalChat").charAt(0);
    els.chatAvatar.classList.add("group");
    els.chatTitle.textContent = t("generalChat");
    els.statusLine.textContent = t("allUsers");
    return;
  }
  const user = state.activeChat.user;
  els.chatAvatar.classList.remove("group");
  setAvatar(els.chatAvatar, user);
  els.chatTitle.textContent = user.name;
  els.statusLine.textContent = `@${user.username} · ${user.about || t("available")}`;
}

function handleTyping(payload) {
  if (!state.user || payload.userId === state.user.id) return;
  const conversationId = payload.conversationId || "general";
  clearTimeout(state.typingTimers.get(conversationId));
  if (!payload.active) {
    state.typing.delete(conversationId);
    updateChatHeader();
    renderUsers();
    return;
  }
  state.typing.set(conversationId, payload);
  state.typingTimers.set(conversationId, setTimeout(() => {
    state.typing.delete(conversationId);
    updateChatHeader();
    renderUsers();
  }, 3500));
  updateChatHeader();
  renderUsers();
}

function addMessage(message) {
  if (!message?.id) return;
  if (!messageBelongsToActiveChat(message) || state.messages.has(message.id)) return;
  const previousMessages = Array.from(state.messages.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const previousMessage = previousMessages[previousMessages.length - 1] || null;
  state.messages.set(message.id, message);
  cacheMessages();
  if (previousMessage && new Date(previousMessage.createdAt) > new Date(message.createdAt)) {
    rerenderMessages();
    updateRenderedMessagesSignature();
    return;
  }
  appendRenderedMessage(message, previousMessage);
  updateRenderedMessagesSignature();
}

function upsertMessage(message) {
  if (!message?.id) return;
  if (!messageBelongsToActiveChat(message)) return;
  state.messages.set(message.id, message);
  cacheMessages();
  rerenderMessages();
  updateRenderedMessagesSignature();
}

function updateMessageStatus(payload) {
  const message = state.messages.get(payload.id);
  if (!message) return;
  message.deliveredAt = payload.deliveredAt || message.deliveredAt || null;
  message.readAt = payload.readAt || message.readAt || null;
  state.messages.set(message.id, message);
  cacheMessages();
  rerenderMessages();
}

function shouldShowMessageTail(message, previousMessage) {
  if (!previousMessage) return true;
  if (previousMessage.userId !== message.userId) return true;
  const current = new Date(message.createdAt).getTime();
  const previous = new Date(previousMessage.createdAt).getTime();
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return true;
  const currentDay = new Date(current).toISOString().slice(0, 10);
  const previousDay = new Date(previous).toISOString().slice(0, 10);
  return currentDay !== previousDay || current - previous > 5 * 60 * 1000;
}

function messageTickHtml(message) {
  if (!(message.mine || message.userId === state.user?.id)) return "";
  if (message.pending) return ` <span class="ticks pending" title="${escapeHtml(t("pendingSync"))}">✓</span>`;
  const status = message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent";
  const icon = status === "sent" ? "✓" : "✓✓";
  return ` <span class="ticks ${status}" title="${escapeHtml(t(status))}">${icon}</span>`;
}

function updateSelectionUi() {
  const count = state.selectedMessageIds.size;
  state.selectionMode = count > 0 || state.selectionMode;
  if (state.selectionMode) pauseAllMedia();
  els.messages.classList.toggle("selection-mode", state.selectionMode);
  els.chatPage.classList.toggle("selection-mode", state.selectionMode);
  els.selectionComposer?.classList.toggle("hidden", count === 0);
  if (els.selectedCountLabel) els.selectedCountLabel.textContent = String(count);
  els.bulkDeleteButton?.setAttribute("title", `${t("deleteSelected")} (${count})`);
  els.bulkForwardButton?.setAttribute("title", `${t("forwardSelected")} (${count})`);
}

function setMessageSelected(messageId, selected) {
  if (selected) state.selectedMessageIds.add(messageId);
  else state.selectedMessageIds.delete(messageId);
  if (state.selectedMessageIds.size === 0) state.selectionMode = false;
  const node = els.messages.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
  if (node) {
    node.classList.toggle("is-selected", selected);
    const checkbox = node.querySelector(".message-select input");
    if (checkbox) checkbox.checked = selected;
  }
  updateSelectionUi();
}

function startMessageSelection(message) {
  if (!message) return;
  state.selectionMode = true;
  pauseAllMedia();
  setMessageSelected(message.id, true);
  closeMessageContextMenu();
}

function selectedMessages() {
  return Array.from(state.selectedMessageIds)
    .map((id) => state.messages.get(id))
    .filter(Boolean)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function canDeleteSelectionForEveryone() {
  const messages = selectedMessages();
  return messages.length > 0 && messages.every((message) => message.userId === state.user?.id);
}

function clearMessageSelection({ rerender = true } = {}) {
  const selectedIds = Array.from(state.selectedMessageIds);
  state.selectionMode = false;
  state.selectedMessageIds.clear();
  if (rerender) {
    rerenderMessages();
    return;
  }
  selectedIds.forEach((messageId) => {
    const node = els.messages.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`);
    if (!node) return;
    node.classList.remove("is-selected");
    const checkbox = node.querySelector(".message-select input");
    if (checkbox) checkbox.checked = false;
  });
  updateSelectionUi();
}

function handleBackFromChat() {
  if (state.selectionMode || state.selectedMessageIds.size > 0) {
    clearMessageSelection({ rerender: false });
    return;
  }
  showPage("accounts");
}

function closeTopLayer() {
  if (isShown(els.messageContextMenu)) {
    closeMessageContextMenu();
    return true;
  }
  if (isShown(els.viewerModal)) {
    closeViewerModal();
    return true;
  }
  if (isShown(els.confirmModal)) {
    closeConfirmModal();
    return true;
  }
  if (isShown(els.editModal)) {
    closeEditModal();
    return true;
  }
  if (isShown(els.shareModal)) {
    closeShareModal();
    return true;
  }
  if (isShown(els.callsModal)) {
    hideFloatingElement(els.callsModal);
    hideOverlay();
    return true;
  }
  if (isShown(els.callWindow)) {
    closeCallWindowOnly();
    return true;
  }
  if (isShown(els.overflowMenu) || isShown(els.chatMenu) || isShown(els.composerMenu) || isShown(els.languagePanel)) {
    closeAllMenus();
    return true;
  }
  return false;
}

function handleAppBack() {
  if (closeTopLayer()) return true;
  if (!els.chatPage.classList.contains("hidden")) {
    handleBackFromChat();
    return true;
  }
  if (!els.settingsPage.classList.contains("hidden")) {
    showPage("accounts");
    return true;
  }
  return false;
}

function primeBackNavigation() {
  if (!window.history?.pushState) return;
  if (!history.state?.vioraApp) history.replaceState({ vioraApp: true }, "", location.href);
  history.pushState({ vioraApp: true }, "", location.href);
}

function closeConversationView() {
  state.selectionMode = false;
  state.selectedMessageIds.clear();
  state.selectedMessage = null;
  updateSelectionUi();
  closeMessageContextMenu();
  showPage("accounts");
}

function renderMessage(message, previousMessage = null) {
  const row = document.createElement("div");
  const mine = message.mine || message.userId === state.user?.id;
  const hasTail = shouldShowMessageTail(message, previousMessage);
  const selected = state.selectedMessageIds.has(message.id);
  const date = new Date(message.createdAt);
  const dateKey = Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
  row.className = `message-row${mine ? " mine" : " message-row-white other-message-row"}${selected ? " is-selected" : ""}`;
  row.dataset.messageId = message.id;
  row.dataset.dateKey = dateKey;
  row.innerHTML = `
    <article class="message${mine ? " mine" : ""}${hasTail ? " with-tail" : " xoox"}">
      <div class="message-content">
      <div class="meta">
        <span>${escapeHtml(message.author || t("user"))}</span>
        <span>@${escapeHtml(message.username || "")}</span>
      </div>
      <div class="body"></div>
      <time>${formatTime(message.createdAt)}${message.editedAt ? ` · ${escapeHtml(t("edited"))}` : ""}${messageTickHtml(message)}</time>
      </div>
    </article>
    <label class="message-select" aria-label="${escapeHtml(t("selectMessage"))}">
      <input type="checkbox" ${selected ? "checked" : ""}>
      <span></span>
    </label>
  `;
  const body = row.querySelector(".body");
  if (message.forwardedFrom) {
    const forwarded = document.createElement("span");
    forwarded.className = "forwarded-label";
    forwarded.textContent = t("forwarded");
    body.appendChild(forwarded);
  }
  if (Array.isArray(message.mediaGroup) && message.mediaGroup.length) body.appendChild(renderMediaGroup(message.mediaGroup));
  if (message.media) body.appendChild(renderMedia(message.media));
  if (message.text) {
    const text = document.createElement("p");
    text.textContent = message.text;
    body.appendChild(text);
  }
  const bubble = row.querySelector(".message");
  const selectLabel = row.querySelector(".message-select");
  const checkbox = row.querySelector(".message-select input");
  checkbox.addEventListener("change", () => setMessageSelected(message.id, checkbox.checked));
  checkbox.addEventListener("click", (event) => event.stopPropagation());
  selectLabel.addEventListener("click", (event) => event.stopPropagation());
  row.addEventListener("click", (event) => {
    if (!state.selectionMode) return;
    if (event.target.closest(".message-select")) return;
    event.preventDefault();
    event.stopPropagation();
    setMessageSelected(message.id, !state.selectedMessageIds.has(message.id));
  }, true);
  bubble.addEventListener("contextmenu", (event) => {
    if (state.selectionMode) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    openMessageContextMenu(event, message);
  });
  row.addEventListener("contextmenu", (event) => {
    if (state.selectionMode) {
      event.preventDefault();
      return;
    }
    if (event.target.closest(".message")) return;
    openMessageRowContextMenu(event, message);
  });
  els.messages.appendChild(row);
}

function finalizePendingMessage(localId, messages = []) {
  if (!localId || !messages.length || !state.messages.has(localId)) return false;
  const firstMessage = messages[0];
  const existing = state.messages.get(localId);
  const merged = {
    ...existing,
    ...firstMessage,
    id: firstMessage.id || localId,
    pending: false,
    mine: true,
    media: existing.media || firstMessage.media || null,
    mediaGroup: existing.mediaGroup || firstMessage.mediaGroup || null,
    text: existing.text || firstMessage.text || ""
  };
  state.messages.delete(localId);
  state.messages.set(merged.id, merged);
  const node = els.messages.querySelector(`[data-message-id="${CSS.escape(localId)}"]`);
  if (node) {
    node.dataset.messageId = merged.id;
    const time = node.querySelector("time");
    if (time) time.innerHTML = `${formatTime(merged.createdAt)}${merged.editedAt ? ` · ${escapeHtml(t("edited"))}` : ""}${messageTickHtml(merged)}`;
  }
  messages.slice(1).forEach((message) => {
    if (message?.id) state.messages.set(message.id, message);
  });
  updateRenderedMessagesSignature();
  return true;
}

function appendRenderedMessage(message, previousMessage = null) {
  const nearBottom = els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight < 120;
  const date = new Date(message.createdAt);
  const dateKey = Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
  const separators = Array.from(els.messages.querySelectorAll(".date-separator"));
  const lastDateKey = separators[separators.length - 1]?.dataset.dateKey || "";
  if (dateKey && dateKey !== lastDateKey) {
    const separator = document.createElement("div");
    separator.className = "date-separator";
    separator.dataset.dateKey = dateKey;
    separator.textContent = formatDateSeparator(message.createdAt);
    els.messages.appendChild(separator);
  }
  renderMessage(message, previousMessage);
  updateMessageSearchVisibility();
  updateSelectionUi();
  if (nearBottom) scrollMessagesToBottom(1600);
}

function rerenderMessages(options = {}) {
  const nearBottom = els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight < 120;
  let lastDateKey = "";
  els.messages.textContent = "";
  let previousRenderedMessage = null;
  Array.from(state.messages.values())
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((message) => {
      const date = new Date(message.createdAt);
      const dateKey = Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
      if (dateKey && dateKey !== lastDateKey) {
        const separator = document.createElement("div");
        separator.className = "date-separator";
        separator.dataset.dateKey = dateKey;
        separator.textContent = formatDateSeparator(message.createdAt);
        els.messages.appendChild(separator);
        lastDateKey = dateKey;
      }
      renderMessage(message, previousRenderedMessage);
      previousRenderedMessage = message;
    });
  updateMessageSearchVisibility();
  updateSelectionUi();
  if (state.pendingClearChat?.conversationId === conversationIdFor()) renderPendingClearChatNotice(false);
  if (options.forceBottom || nearBottom) scrollMessagesToBottom(options.forceBottom ? 3000 : 1600);
}

function updateMessageSearchVisibility() {
  const messages = Array.from(state.messages.values());
  const visibleDateKeys = new Set();
  messages.forEach((message) => {
    const node = els.messages.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`);
    if (!node) return;
    const visible = matchesMessageSearch(message);
    node.classList.toggle("search-hidden", !visible);
    if (visible && node.dataset.dateKey) visibleDateKeys.add(node.dataset.dateKey);
  });
  els.messages.querySelectorAll(".date-separator").forEach((separator) => {
    separator.classList.toggle("search-hidden", !visibleDateKeys.has(separator.dataset.dateKey));
  });
}

function setMessagesBottom() {
  const bottom = Math.max(0, els.messages.scrollHeight - els.messages.clientHeight);
  els.messages.scrollTop = bottom;
  els.messages.scrollTo?.({ top: bottom, behavior: "auto" });
}

function scrollMessagesToBottom(duration = 1600) {
  state.keepScrollBottomUntil = Math.max(state.keepScrollBottomUntil, Date.now() + duration);
  const jump = () => {
    setMessagesBottom();
  };
  jump();
  requestAnimationFrame(jump);
  setTimeout(jump, 80);
  setTimeout(jump, 220);
  setTimeout(jump, 600);
  setTimeout(jump, 1200);
  els.messages.querySelectorAll("img, video").forEach((media) => {
    if (media.complete || media.readyState >= 1) return;
    media.addEventListener("load", jump, { once: true });
    media.addEventListener("loadedmetadata", jump, { once: true });
    media.addEventListener("loadeddata", jump, { once: true });
  });
}

function matchesMessageSearch(message) {
  const query = normalizeForSearch(state.messageSearch);
  if (!query) return true;
  const groupText = Array.isArray(message.mediaGroup) ? message.mediaGroup.map((item) => `${item.name || ""} ${item.mime || ""}`).join(" ") : "";
  const haystack = normalizeForSearch(`${message.author || ""} ${message.username || ""} ${message.text || ""} ${message.media?.name || ""} ${message.media?.mime || ""} ${groupText}`);
  return haystack.includes(query);
}

function removeMessage(messageId) {
  state.messages.delete(messageId);
  state.selectedMessageIds.delete(messageId);
  if (state.selectedMessageIds.size === 0) state.selectionMode = false;
  cacheMessages();
  rerenderMessages();
  updateRenderedMessagesSignature();
}

function clearActiveMessages() {
  state.messages.clear();
  state.selectionMode = false;
  state.selectedMessageIds.clear();
  cacheMessages();
  rerenderMessages({ forceBottom: true });
  updateRenderedMessagesSignature();
}

async function clearCurrentChat() {
  scheduleClearCurrentChat();
}

function removePendingClearChatNotice() {
  els.messages.querySelector(".clear-chat-pending")?.remove();
}

function cancelPendingClearChat(showMessage = true) {
  if (state.pendingClearChat?.timer) clearTimeout(state.pendingClearChat.timer);
  state.pendingClearChat = null;
  removePendingClearChatNotice();
  if (showMessage) showToast(t("clearChatCanceled"));
}

function renderPendingClearChatNotice(shouldScroll = true) {
  const pending = state.pendingClearChat;
  if (!pending) return;
  removePendingClearChatNotice();
  const elapsed = Date.now() - pending.startedAt;
  const duration = pending.duration || 5000;
  const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));
  const remaining = Math.max(80, duration - elapsed);
  const notice = document.createElement("div");
  notice.className = "clear-chat-pending";
  notice.setAttribute("role", "status");
  notice.innerHTML = `
    <div class="clear-chat-pending-row">
      <span>${escapeHtml(t("clearChatPending"))}</span>
      <button type="button">${escapeHtml(t("undoClearChat"))}</button>
    </div>
    <span class="clear-chat-progress"><span></span></span>
  `;
  const progressBar = notice.querySelector(".clear-chat-progress span");
  progressBar.style.width = `${progress}%`;
  progressBar.style.animationDuration = `${remaining}ms`;
  notice.querySelector("button").addEventListener("click", () => cancelPendingClearChat(true));
  els.messages.appendChild(notice);
  if (shouldScroll) scrollMessagesToBottom(5200);
}

async function executePendingClearChat(pending) {
  if (state.pendingClearChat !== pending) return;
  state.pendingClearChat = null;
  removePendingClearChatNotice();
  await api("/api/conversation/clear", {
    method: "POST",
    body: JSON.stringify({ recipientId: pending.recipientId })
  });
  if (pending.conversationId === conversationIdFor()) clearActiveMessages();
  showToast(t("chatCleared"));
}

function scheduleClearCurrentChat() {
  cancelPendingClearChat(false);
  const pending = {
    conversationId: conversationIdFor(),
    recipientId: currentRecipientId(),
    startedAt: Date.now(),
    duration: 5000,
    timer: null
  };
  state.pendingClearChat = pending;
  closeConfirmModal();
  renderPendingClearChatNotice();
  pending.timer = setTimeout(() => {
    executePendingClearChat(pending).catch((error) => showToast(error.message));
  }, 5000);
}

function canEditClient(message) {
  if (!message || message.userId !== state.user?.id || message.media?.type === "video") return false;
  const createdAt = new Date(message.createdAt).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt <= 5 * 60 * 1000;
}

function positionMessageContextMenu(event, menuHeight = 184) {
  const menuWidth = 210;
  const isLtr = document.documentElement.dir === "ltr";
  const preferredX = isLtr ? event.clientX : event.clientX - menuWidth;
  const x = Math.min(Math.max(8, preferredX), window.innerWidth - menuWidth - 8);
  const y = Math.min(event.clientY, window.innerHeight - menuHeight - 8);
  els.messageContextMenu.style.left = `${x}px`;
  els.messageContextMenu.style.top = `${Math.max(8, y)}px`;
}

function openMessageContextMenu(event, message) {
  event.preventDefault();
  if (state.selectionMode) return;
  state.selectedMessage = message;
  closeAllMenus();
  showOverlay();
  showFloatingElement(els.messageContextMenu);
  els.selectMessageButton.classList.remove("hidden");
  els.closeConversationButton?.classList.add("hidden");
  els.forwardMessageButton.classList.remove("hidden");
  els.editMessageButton.classList.toggle("hidden", !canEditClient(message));
  els.deleteMessageButton.classList.remove("hidden");
  positionMessageContextMenu(event, 184);
}

function openMessageRowContextMenu(event, message) {
  event.preventDefault();
  if (state.selectionMode) return;
  state.selectedMessage = message;
  closeAllMenus();
  showOverlay();
  showFloatingElement(els.messageContextMenu);
  els.selectMessageButton.classList.remove("hidden");
  els.closeConversationButton?.classList.remove("hidden");
  els.forwardMessageButton.classList.add("hidden");
  els.editMessageButton.classList.add("hidden");
  els.deleteMessageButton.classList.add("hidden");
  positionMessageContextMenu(event, 96);
}

function closeMessageContextMenu() {
  hideFloatingElement(els.messageContextMenu);
  hideOverlay();
}

function openMessageSearchBar() {
  closeAllMenus();
  els.messageSearchBar.classList.remove("hidden");
  els.messageSearchInput.focus();
}

function clearAttachment() {
  if (state.recorder || state.fallbackRecorder) {
    stopRecording(true);
    return;
  }
  state.mediaFiles = [];
  els.mediaInput.value = "";
  clearAttachmentPreviewUrls();
  els.mediaPreview.classList.add("hidden");
  els.mediaPreview.textContent = "";
}

function openShareModal() {
  if (!state.selectedMessage && state.selectedMessageIds.size === 0) return;
  state.selectedShareUsers.clear();
  renderShareUsers();
  hideFloatingElement(els.messageContextMenu);
  closeAllMenus();
  closeAllModals(els.shareModal);
  showOverlay(true);
  showFloatingElement(els.shareModal);
}

function closeShareModal() {
  hideFloatingElement(els.shareModal);
  state.selectedShareUsers.clear();
  hideOverlay();
}

function renderShareUsers() {
  els.shareUsers.textContent = "";
  const users = Array.from(state.users.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  if (!users.length) {
    const empty = document.createElement("p");
    empty.className = "empty-users";
    empty.textContent = t("noShareUsers");
    els.shareUsers.appendChild(empty);
  }
  users.forEach((user) => {
    const label = document.createElement("label");
    label.className = "share-user-row";
    label.innerHTML = `
      <input type="checkbox" value="${escapeHtml(user.id)}">
      <span class="avatar">${escapeHtml(initials(user.name))}</span>
      <span>
        <strong>${escapeHtml(user.name)}</strong>
        <small>@${escapeHtml(user.username)}</small>
      </span>
    `;
    const checkbox = label.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.selectedShareUsers.add(user.id);
      else state.selectedShareUsers.delete(user.id);
      els.shareSelectedButton.classList.toggle("hidden", state.selectedShareUsers.size === 0);
    });
    els.shareUsers.appendChild(label);
  });
  els.shareSelectedButton.classList.toggle("hidden", state.selectedShareUsers.size === 0);
}

function openEditModal() {
  if (!state.selectedMessage || !canEditClient(state.selectedMessage)) return;
  els.editMessageInput.value = state.selectedMessage.text || "";
  hideFloatingElement(els.messageContextMenu);
  closeAllMenus();
  closeAllModals(els.editModal);
  showOverlay();
  showFloatingElement(els.editModal);
  els.editMessageInput.focus();
}

function closeEditModal() {
  hideFloatingElement(els.editModal);
  els.editMessageInput.value = "";
  hideOverlay();
}

function setConfirmButtons(mode = "single", message = null) {
  const messageDeleteMode = mode === "message-delete";
  const bulkDeleteMode = mode === "bulk-delete";
  const deleteChoiceMode = messageDeleteMode || bulkDeleteMode;
  const notificationMode = mode === "notification";
  els.confirmActionButton?.classList.toggle("hidden", deleteChoiceMode || notificationMode);
  els.deleteForMeButton?.classList.toggle("hidden", !deleteChoiceMode);
  els.deleteForEveryoneButton?.classList.toggle("hidden", !deleteChoiceMode || (bulkDeleteMode ? !canDeleteSelectionForEveryone() : message?.userId !== state.user?.id));
  if (els.cancelConfirmButton) els.cancelConfirmButton.textContent = notificationMode ? t("close") : t("cancel");
}

function openConfirmModal({ title = t("confirmDelete"), text, action, mode = "single", message = null }) {
  state.confirmAction = action;
  closeAllMenus();
  hideFloatingElement(els.messageContextMenu);
  closeAllModals(els.confirmModal);
  els.confirmTitle.textContent = title;
  els.confirmText.textContent = text;
  setConfirmButtons(mode, message);
  showOverlay();
  showFloatingElement(els.confirmModal);
}

function closeConfirmModal() {
  hideFloatingElement(els.confirmModal);
  state.confirmAction = null;
  setConfirmButtons();
  hideOverlay();
}

function closeViewerModal() {
  pauseAllMedia();
  hideFloatingElement(els.viewerModal);
  setViewerOverlay(false);
  els.viewerBody.textContent = "";
  els.viewerOpenLink.removeAttribute("href");
  els.viewerOpenLink.removeAttribute("download");
  hideOverlay();
}

function canUseBrowserFrameViewer() {
  const maxTouchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints || 0;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches && maxTouchPoints === 0;
}

async function openAttachmentViewer(media, options = {}) {
  if (state.selectionMode) return;
  const viewerGroup = Array.isArray(options.group) ? options.group : null;
  let viewerIndex = Number.isInteger(options.index) ? options.index : viewerGroup?.findIndex((item) => item.url === media.url) ?? -1;
  if (viewerGroup && (viewerIndex < 0 || viewerIndex >= viewerGroup.length)) viewerIndex = 0;
  const activeMedia = viewerGroup ? viewerGroup[viewerIndex] : media;
  const setViewerDownloadTarget = (item) => {
    els.viewerTitle.textContent = item.name || t("viewFile");
    els.viewerOpenLink.href = mediaUrl(item.url);
    els.viewerOpenLink.download = item.name || "attachment";
    els.viewerOpenLink.dataset.currentUrl = mediaUrl(item.url);
  };
  setViewerDownloadTarget(activeMedia);
  els.viewerBody.textContent = "";
  pauseAllMedia();
  closeAllMenus();
  hideFloatingElement(els.messageContextMenu);
  closeAllModals(els.viewerModal);
  showOverlay();
  setViewerOverlay(true);
  showFloatingElement(els.viewerModal);

  if (activeMedia.type === "image") {
    const renderViewerImage = (index, direction = "") => {
      const current = viewerGroup ? viewerGroup[index] : activeMedia;
      setViewerDownloadTarget(current);
      els.viewerBody.textContent = "";
      const image = document.createElement("img");
      image.className = `viewer-image${direction ? ` viewer-image-enter-${direction}` : ""}`;
      image.src = mediaUrl(current.url);
      image.alt = current.name || t("image");
      els.viewerBody.appendChild(image);
      if (!viewerGroup || viewerGroup.length < 2) return;
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "viewer-nav viewer-nav-prev";
      previous.setAttribute("aria-label", t("back"));
      previous.innerHTML = '<ion-icon name="chevron-back-outline"></ion-icon>';
      const next = document.createElement("button");
      next.type = "button";
      next.className = "viewer-nav viewer-nav-next";
      next.setAttribute("aria-label", t("forward"));
      next.innerHTML = '<ion-icon name="chevron-forward-outline"></ion-icon>';
      previous.addEventListener("click", () => {
        viewerIndex = (viewerIndex - 1 + viewerGroup.length) % viewerGroup.length;
        renderViewerImage(viewerIndex, "left");
      });
      next.addEventListener("click", () => {
        viewerIndex = (viewerIndex + 1) % viewerGroup.length;
        renderViewerImage(viewerIndex, "right");
      });
      els.viewerBody.append(previous, next);
    };
    renderViewerImage(viewerIndex);
    return;
  }

  if (activeMedia.type === "video") {
    els.viewerBody.appendChild(createCustomVideoPlayer(activeMedia));
    return;
  }

  if (canUseBrowserFrameViewer() && (activeMedia.mime === "application/pdf" || activeMedia.mime === "text/plain")) {
    const frame = document.createElement("iframe");
    frame.className = "viewer-frame";
    frame.src = mediaUrl(activeMedia.url);
    frame.title = activeMedia.name || t("file");
    els.viewerBody.appendChild(frame);
    return;
  }

  if (activeMedia.mime === "text/plain") {
    const wrap = document.createElement("div");
    wrap.className = "private-text-viewer";
    const heading = document.createElement("div");
    heading.className = "private-viewer-heading";
    heading.innerHTML = `
      <strong>${escapeHtml(activeMedia.name || "TXT")}</strong>
      <small>${escapeHtml(t("privateViewer"))} · ${formatSize(activeMedia.size)}</small>
    `;
    const pre = document.createElement("pre");
    pre.className = "viewer-text";
    pre.textContent = t("textLoading");
    wrap.appendChild(heading);
    wrap.appendChild(pre);
    els.viewerBody.appendChild(wrap);
    try {
      const response = await fetch(mediaUrl(activeMedia.url));
      pre.textContent = await response.text();
    } catch {
      pre.textContent = t("textLoadFail");
    }
    return;
  }

  const card = document.createElement("div");
  card.className = "document-view-card";
  card.innerHTML = `
    <b>${escapeHtml(documentIcon(activeMedia.mime))}</b>
    <strong>${escapeHtml(activeMedia.name || t("file"))}</strong>
    <small>${escapeHtml(activeMedia.mime || t("file"))} · ${formatSize(activeMedia.size)}</small>
    <span>${canUseBrowserFrameViewer() ? t("browserFrameFail") : t("privateViewerFail")}</span>
  `;
  els.viewerBody.appendChild(card);
}

function messageBelongsToActiveChat(message) {
  if (!message) return false;
  if (state.activeChat.type === "general") return (message.conversationId || "general") === "general";
  const otherId = state.activeChat.user?.id;
  return message.conversationId === directConversationId(state.user.id, otherId);
}

function directConversationId(userA, userB) {
  return `direct:${[userA, userB].sort().join(":")}`;
}

function renderMedia(media) {
  const wrapper = document.createElement("div");
  wrapper.className = "media-wrapper";
  let mediaNode;
  if (media.type === "image") {
    mediaNode = createImageNode(media);
  } else if (media.type === "video") {
    mediaNode = createVideoThumb(media);
  } else if (media.type === "audio") {
    mediaNode = createCustomAudioPlayer(media);
  } else {
    mediaNode = document.createElement("button");
    mediaNode.type = "button";
    mediaNode.className = "document-chip";
    mediaNode.innerHTML = `
      <span>${documentIcon(media.mime)}</span>
      <strong>${escapeHtml(media.name || t("file"))}</strong>
      <small>${escapeHtml(media.mime || t("file"))} · ${formatSize(media.size)}</small>
    `;
    mediaNode.addEventListener("click", () => {
      if (state.selectionMode) return;
      openAttachmentViewer(media);
    });
  }
  if (mediaNode.tagName !== "BUTTON" && !mediaNode.dataset.customMedia) mediaNode.src = mediaUrl(media.url);
  if (media.type === "image" || media.type === "video") {
    bindMediaLoading(wrapper, mediaNode, media.type);
  } else {
    wrapper.appendChild(mediaNode);
  }
  const name = document.createElement("span");
  name.className = "media-name";
  name.textContent = `${media.name || t("file")} · ${formatSize(media.size)}`;
  wrapper.appendChild(name);
  return wrapper;
}

function bindMediaLoading(wrapper, mediaNode, type) {
  wrapper.classList.add("media-loading");
  const shell = document.createElement("span");
  shell.className = "media-load-shell";
  const loader = document.createElement("span");
  loader.className = "media-circular-loader";
  shell.append(mediaNode, loader);
  wrapper.appendChild(shell);
  const loadedTarget = type === "video" ? mediaNode.querySelector("video") : mediaNode;
  const markLoaded = () => wrapper.classList.add("media-loaded");
  loadedTarget?.addEventListener("load", markLoaded, { once: true });
  loadedTarget?.addEventListener("loadedmetadata", markLoaded, { once: true });
  loadedTarget?.addEventListener("loadeddata", markLoaded, { once: true });
  if (loadedTarget?.complete || loadedTarget?.readyState >= 1) requestAnimationFrame(markLoaded);
}

function createImageNode(media, className = "") {
  const image = document.createElement("img");
  image.alt = media.name || t("image");
  if (className) image.className = className;
  image.addEventListener("click", () => {
    if (state.selectionMode) return;
    openAttachmentViewer(media);
  });
  image.src = mediaUrl(media.url);
  return image;
}

function renderMediaGroup(group) {
  const wrapper = document.createElement("div");
  wrapper.className = "image-group media-loading";
  const visible = group.slice(0, 4);
  visible.forEach((media, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "image-group-item";
    item.addEventListener("click", () => {
      if (state.selectionMode) return;
      openAttachmentViewer(media, { group, index });
    });
    const image = document.createElement("img");
    image.alt = media.name || t("image");
    image.src = mediaUrl(media.url);
    const markLoaded = () => {
      item.classList.add("media-loaded");
      if (wrapper.querySelectorAll(".image-group-item.media-loaded").length === visible.length) wrapper.classList.add("media-loaded");
    };
    image.addEventListener("load", markLoaded, { once: true });
    item.appendChild(image);
    if (image.complete) requestAnimationFrame(markLoaded);
    if (index === 3 && group.length > 4) {
      const more = document.createElement("span");
      more.className = "image-group-more";
      more.textContent = `+${group.length - 4}`;
      item.appendChild(more);
    }
    wrapper.appendChild(item);
  });
  const loader = document.createElement("span");
  loader.className = "media-circular-loader";
  wrapper.appendChild(loader);
  return wrapper;
}

function pauseAllMedia(except) {
  document.querySelectorAll("audio, video").forEach((media) => {
    if (media !== except && !media.paused) media.pause();
  });
}

document.addEventListener("play", (event) => {
  if (state.selectionMode && event.target instanceof HTMLMediaElement) {
    event.target.pause();
    return;
  }
  if (event.target instanceof HTMLMediaElement) pauseAllMedia(event.target);
}, true);

function formatMediaTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function bindMediaScrubber(timeline, mediaElement) {
  const updateFromValue = () => {
    if (state.selectionMode) return;
    if (!mediaElement.duration) return;
    mediaElement.currentTime = (Number(timeline.value) / 1000) * mediaElement.duration;
  };
  const updateFromPointer = (event) => {
    if (state.selectionMode) {
      event.preventDefault();
      return;
    }
    if (!mediaElement.duration) return;
    const rect = timeline.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    timeline.value = String(Math.round(ratio * 1000));
    updateFromValue();
  };
  timeline.addEventListener("input", updateFromValue);
  timeline.addEventListener("change", updateFromValue);
  timeline.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    timeline.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  });
  timeline.addEventListener("pointermove", (event) => {
    if (event.buttons !== 1 && event.pointerType !== "touch") return;
    updateFromPointer(event);
  });
  timeline.addEventListener("pointerup", (event) => {
    timeline.releasePointerCapture?.(event.pointerId);
    updateFromPointer(event);
  });
  return updateFromValue;
}

function createCustomAudioPlayer(media) {
  const player = document.createElement("div");
  player.className = "audio-player";
  player.dataset.customMedia = "true";

  const audio = document.createElement("audio");
  audio.src = mediaUrl(media.url);
  audio.preload = "metadata";

  const play = document.createElement("button");
  play.type = "button";
  play.className = "media-play-button";
  play.innerHTML = '<ion-icon name="play"></ion-icon>';
  play.setAttribute("aria-label", t("playAudio"));

  const info = document.createElement("div");
  info.className = "audio-info";
  const title = document.createElement("strong");
  title.textContent = media.name || t("audioClip");
  const timeline = document.createElement("input");
  timeline.type = "range";
  timeline.min = "0";
  timeline.max = "1000";
  timeline.step = "1";
  timeline.value = "0";
  timeline.setAttribute("aria-label", t("seekAudio"));
  const time = document.createElement("small");
  time.textContent = `0:00 · ${formatSize(media.size)}`;
  info.append(title, timeline, time);

  play.addEventListener("click", async () => {
    if (state.selectionMode) return;
    if (audio.paused) {
      pauseAllMedia(audio);
      await audio.play();
    } else {
      audio.pause();
    }
  });
  audio.addEventListener("play", () => {
    play.innerHTML = '<ion-icon name="pause"></ion-icon>';
  });
  audio.addEventListener("pause", () => {
    play.innerHTML = '<ion-icon name="play"></ion-icon>';
  });
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) timeline.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    time.textContent = `${formatMediaTime(audio.currentTime)} / ${formatMediaTime(audio.duration)} · ${formatSize(media.size)}`;
  });
  audio.addEventListener("loadedmetadata", () => {
    time.textContent = `0:00 / ${formatMediaTime(audio.duration)} · ${formatSize(media.size)}`;
  });
  audio.addEventListener("ended", () => {
    timeline.value = "0";
  });
  bindMediaScrubber(timeline, audio);

  player.append(audio, play, info);
  return player;
}

function createVideoThumb(media) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "video-thumb";
  button.dataset.customMedia = "true";
  button.setAttribute("aria-label", t("viewVideo"));

  const video = document.createElement("video");
  video.src = mediaUrl(media.url);
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.addEventListener("loadeddata", () => {
    video.currentTime = 0.01;
  }, { once: true });

  const play = document.createElement("span");
  play.className = "video-thumb-play";
  play.innerHTML = '<ion-icon name="play"></ion-icon>';

  button.append(video, play);
  button.addEventListener("click", () => {
    if (state.selectionMode) return;
    openAttachmentViewer(media);
  });
  return button;
}

function createCustomVideoPlayer(media) {
  const player = document.createElement("div");
  player.className = "video-player";
  player.dataset.customMedia = "true";

  const video = document.createElement("video");
  video.src = mediaUrl(media.url);
  video.preload = "metadata";
  video.playsInline = true;

  const controls = document.createElement("div");
  controls.className = "video-controls";
  const play = document.createElement("button");
  play.type = "button";
  play.className = "media-play-button";
  play.innerHTML = '<ion-icon name="play"></ion-icon>';
  play.setAttribute("aria-label", t("playVideo"));
  const timeline = document.createElement("input");
  timeline.type = "range";
  timeline.min = "0";
  timeline.max = "1000";
  timeline.step = "1";
  timeline.value = "0";
  timeline.setAttribute("aria-label", t("seekVideo"));
  const time = document.createElement("small");
  time.textContent = "0:00";
  const fullscreen = document.createElement("button");
  fullscreen.type = "button";
  fullscreen.className = "media-fullscreen-button";
  fullscreen.innerHTML = '<ion-icon name="expand-outline"></ion-icon>';
  fullscreen.setAttribute("aria-label", t("fullscreen"));
  controls.append(play, timeline, time, fullscreen);

  play.addEventListener("click", async () => {
    if (state.selectionMode) return;
    if (video.paused) {
      pauseAllMedia(video);
      await video.play();
    } else {
      video.pause();
    }
  });
  video.addEventListener("click", () => {
    if (state.selectionMode) return;
    play.click();
  });
  video.addEventListener("play", () => {
    play.innerHTML = '<ion-icon name="pause"></ion-icon>';
  });
  video.addEventListener("pause", () => {
    play.innerHTML = '<ion-icon name="play"></ion-icon>';
  });
  video.addEventListener("timeupdate", () => {
    if (video.duration) timeline.value = String(Math.round((video.currentTime / video.duration) * 1000));
    time.textContent = `${formatMediaTime(video.currentTime)} / ${formatMediaTime(video.duration)}`;
  });
  video.addEventListener("loadedmetadata", () => {
    time.textContent = `0:00 / ${formatMediaTime(video.duration)}`;
  });
  bindMediaScrubber(timeline, video);
  fullscreen.addEventListener("click", async () => {
    if (state.selectionMode) return;
    try {
      const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      if (fullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await document.webkitExitFullscreen?.();
        return;
      }
      if (player.requestFullscreen) await player.requestFullscreen();
      else await player.webkitRequestFullscreen?.();
    } catch {
      showToast(t("fullscreenFail"));
    }
  });

  player.append(video, controls);
  return player;
}

function renderRecordingPreview(levels = []) {
  const bars = levels.map((level) => `<i style="height:${Math.max(6, Math.round(level * 34))}px"></i>`).join("");
  els.mediaPreview.classList.remove("hidden");
  els.mediaPreview.innerHTML = `
    <div class="recording-preview">
      <span class="recording-dot"></span>
      <strong>${escapeHtml(t("recording"))}</strong>
      <div class="recording-bars">${bars}</div>
      <small>${escapeHtml(t("tapToStop"))}</small>
    </div>
  `;
}

function stopRecordingPreview() {
  cancelAnimationFrame(state.recorderAnimation);
  state.recorderAnimation = null;
  state.recorderAnalyser = null;
}

function startRecordingMeter(stream) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = state.audioContext || new AudioContext();
  state.audioContext = ctx;
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  state.recorderAnalyser = analyser;
  const data = new Uint8Array(analyser.frequencyBinCount);
  const levels = Array.from({ length: 22 }, () => 0.18);
  const tick = () => {
    analyser.getByteFrequencyData(data);
    const average = data.reduce((sum, value) => sum + value, 0) / data.length / 255;
    levels.shift();
    levels.push(Math.min(1, Math.max(0.12, average * 2.2)));
    renderRecordingPreview(levels);
    state.recorderAnimation = requestAnimationFrame(tick);
  };
  tick();
}

function finishRecording(blob) {
  const type = blob.type || "audio/webm";
  const extension = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "m4a" : type.includes("mpeg") ? "mp3" : "webm";
  const file = new File([blob], `voice-${Date.now()}.${extension}`, { type });
  state.mediaFiles = [file];
  els.mediaInput.value = "";
  renderAttachmentPreviews();
}

function encodeWav(chunks, sampleRate) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const samples = new Float32Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    samples.set(chunk, offset);
    offset += chunk.length;
  });
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (position, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(position + i, value.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let index = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    index += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function setRecordingUi(active) {
  els.recordButton.classList.toggle("recording", active);
  els.recordButton.innerHTML = active ? '<ion-icon name="stop"></ion-icon>' : '<ion-icon name="mic"></ion-icon>';
}

function cleanupRecording(stream) {
  stopRecordingPreview();
  stream?.getTracks().forEach((track) => track.stop());
  setRecordingUi(false);
}

function startFallbackRecording(stream) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error("No audio context");
  const ctx = state.audioContext || new AudioContext();
  state.audioContext = ctx;
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const chunks = [];
  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(ctx.destination);
  state.fallbackRecorder = { stream, source, processor, chunks, sampleRate: ctx.sampleRate };
  state.recorderStream = stream;
  state.recordingCancelled = false;
  setRecordingUi(true);
  renderRecordingPreview();
  startRecordingMeter(stream);
  sendTyping(true, "upload");
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast(t("microphoneError"));
    return;
  }
  try {
    pauseAllMedia();
    clearAttachment();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!window.MediaRecorder) {
      startFallbackRecording(stream);
      return;
    }
    const preferredTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4"
    ];
    const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported?.(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    state.recorder = recorder;
    state.recorderStream = stream;
    state.recorderChunks = [];
    state.recorderStartedAt = Date.now();
    state.recordingCancelled = false;
    setRecordingUi(true);
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) state.recorderChunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      const blob = new Blob(state.recorderChunks, { type: recorder.mimeType || "audio/webm" });
      const cancelled = state.recordingCancelled;
      cleanupRecording(stream);
      state.recorder = null;
      state.recorderStream = null;
      state.recorderChunks = [];
      state.recordingCancelled = false;
      if (cancelled) {
        els.mediaPreview.classList.add("hidden");
        els.mediaPreview.textContent = "";
      } else if (blob.size) {
        finishRecording(blob);
      }
      state.recordingStopResolve?.();
      state.recordingStopResolve = null;
    });
    recorder.start();
    renderRecordingPreview();
    startRecordingMeter(stream);
    sendTyping(true, "upload");
  } catch {
    showToast(t("microphoneError"));
  }
}

function stopRecording(cancel = false) {
  if (state.fallbackRecorder) {
    state.recordingCancelled = cancel;
    sendTyping(false, "upload");
    const fallback = state.fallbackRecorder;
    state.fallbackRecorder = null;
    fallback.processor.disconnect();
    fallback.source.disconnect();
    const blob = encodeWav(fallback.chunks, fallback.sampleRate);
    cleanupRecording(fallback.stream);
    state.recorderStream = null;
    if (cancel) {
      els.mediaPreview.classList.add("hidden");
      els.mediaPreview.textContent = "";
    } else if (blob.size) {
      finishRecording(blob);
    }
    state.recordingCancelled = false;
    return Promise.resolve();
  }
  if (!state.recorder) return Promise.resolve();
  state.recordingCancelled = cancel;
  sendTyping(false, "upload");
  const done = new Promise((resolve) => {
    state.recordingStopResolve = resolve;
  });
  state.recorder.stop();
  return done;
}

function toggleRecording() {
  if (state.recorder) stopRecording();
  else startRecording();
}

function documentIcon(mime = "") {
  if (mime === "application/pdf") return "PDF";
  if (mime === "text/plain") return "TXT";
  if (mime.includes("word")) return "DOC";
  return "FILE";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function normalizeForSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function formatTime(value) {
  return new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function filePreviewKind(file) {
  const type = file?.type || "";
  const name = file?.name || "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return documentIcon(type || name);
}

function removeAttachment(index) {
  const removedUrl = state.attachmentPreviewUrls[index];
  state.mediaFiles.splice(index, 1);
  state.attachmentPreviewUrls.splice(index, 1);
  if (removedUrl) URL.revokeObjectURL(removedUrl);
  els.mediaInput.value = "";
  const card = els.mediaPreview.querySelector(`.attachment-preview-card[data-index="${index}"]`);
  if (card) card.remove();
  if (!state.mediaFiles.length) {
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
    return;
  }
  els.mediaPreview.querySelectorAll(".attachment-preview-card").forEach((item, nextIndex) => {
    item.dataset.index = String(nextIndex);
    const button = item.querySelector(".attachment-remove");
    if (button) button.dataset.index = String(nextIndex);
  });
}

function clearAttachmentPreviewUrls() {
  state.attachmentPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  state.attachmentPreviewUrls = [];
}

function attachmentPreviewHtml(file) {
  const kind = filePreviewKind(file);
  const url = URL.createObjectURL(file);
  let mediaHtml = "";
  if (kind === "image") {
    mediaHtml = `<img src="${url}" alt="${escapeHtml(file.name)}">`;
  } else if (kind === "video") {
    mediaHtml = `<video src="${url}" muted preload="metadata"></video><span class="preview-play"><ion-icon name="play"></ion-icon></span>`;
  } else if (kind === "audio") {
    mediaHtml = '<span class="preview-file-icon"><ion-icon name="mic"></ion-icon></span>';
  } else {
    mediaHtml = `<span class="preview-file-icon">${escapeHtml(kind)}</span>`;
  }
  return { url, html: `<span class="preview-thumb">${mediaHtml}</span>` };
}

function renderAttachmentPreviews() {
  const files = state.mediaFiles || [];
  clearAttachmentPreviewUrls();
  if (!files.length) {
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
    return;
  }
  const previews = files.map(attachmentPreviewHtml);
  state.attachmentPreviewUrls = previews.map((preview) => preview.url);
  els.mediaPreview.classList.remove("hidden");
  els.mediaPreview.innerHTML = previews.map((preview, index) => `
    <div class="attachment-preview-card" data-index="${index}">
      ${preview.html}
      <button class="attachment-remove" type="button" data-index="${index}" aria-label="${escapeHtml(t("removeFile"))}">
        <ion-icon name="close"></ion-icon>
      </button>
    </div>
  `).join("");
  els.mediaPreview.querySelectorAll(".attachment-remove").forEach((button) => {
    button.addEventListener("click", () => removeAttachment(Number(button.dataset.index)));
  });
}

function initials(name) {
  const parts = String(name || "U").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function setAvatar(node, user) {
  node.textContent = "";
  node.style.backgroundImage = "";
  node.classList.toggle("has-image", Boolean(user?.avatar));
  if (user?.avatar) {
    node.style.backgroundImage = `url("${user.avatar}")`;
  } else {
    node.textContent = initials(user?.name || "U");
  }
}

function currentRecipientId() {
  return state.activeChat.type === "direct" ? state.activeChat.user.id : "";
}

function waitForNextMessageLoad() {
  return new Promise((resolve) => setTimeout(resolve, 1));
}

async function renderMessagesOneByOne(messages, loadId) {
  const orderedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let previousMessage = null;
  for (const message of orderedMessages) {
    if (loadId !== state.messageLoadId) return false;
    state.messages.set(message.id, message);
    appendRenderedMessage(message, previousMessage);
    previousMessage = message;
    await waitForNextMessageLoad();
  }
  if (loadId !== state.messageLoadId) return false;
  scrollMessagesToBottom(3000);
  return true;
}

function refreshRenderedMessageMeta(messages = []) {
  state.messages.clear();
  messages.forEach((message) => {
    if (!message?.id) return;
    state.messages.set(message.id, message);
    const node = els.messages.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`);
    const time = node?.querySelector("time");
    if (time) time.innerHTML = `${formatTime(message.createdAt)}${message.editedAt ? ` · ${escapeHtml(t("edited"))}` : ""}${messageTickHtml(message)}`;
  });
  updateSelectionUi();
}

async function loadMe() {
  try {
    const { user, rememberToken } = await api(`/api/me?deviceId=${encodeURIComponent(state.deviceId)}`);
    if (user) {
      storeRememberSession(user, rememberToken);
      setAuthenticated(user);
      await loadUsers();
      syncPendingMessages();
      return;
    }
  } catch (error) {
    const cachedUser = cachedCurrentUser();
    if (isOfflineError(error) && cachedUser) {
      setAuthenticated(cachedUser);
      setUsers(cachedUsers());
      schedulePendingDeleteSync(0);
      schedulePendingSync(0);
      return;
    }
  }

  const userId = localStorage.getItem("vioraRememberUserId");
  const storedRememberToken = localStorage.getItem("vioraRememberToken");

  if (userId && storedRememberToken) {
    try {
      const remembered = await api("/api/remember", {
        method: "POST",
        body: JSON.stringify({ userId, rememberToken: storedRememberToken })
      });
      setAuthenticated(remembered.user);
      await loadUsers();
      syncPendingMessages();
      return;
    } catch {
      clearRememberSession();
    }
  }

  try {
    const deviceSession = await api("/api/device-login", {
      method: "POST",
      body: JSON.stringify({ deviceId: state.deviceId })
    });
    storeRememberSession(deviceSession.user, deviceSession.rememberToken);
    setAuthenticated(deviceSession.user);
    await loadUsers();
    syncPendingMessages();
  } catch {
    const cachedUser = cachedCurrentUser();
    if (cachedUser) {
      setAuthenticated(cachedUser);
      setUsers(cachedUsers());
      schedulePendingDeleteSync(0);
      schedulePendingSync(0);
      return;
    }
    setAuthenticated(null);
    setNotice(els.authNotice, t("noSavedSession"), true);
  }
}

async function loadUsers() {
  try {
    const { users } = await api("/api/users");
    setUsers(users);
  } catch (error) {
    const users = cachedUsers();
    if (!isOfflineError(error) || !users.length) throw error;
    setUsers(users);
  }
}

async function loadMessages() {
  const loadId = ++state.messageLoadId;
  const recipientId = currentRecipientId();
  const path = recipientId ? `/api/messages?with=${encodeURIComponent(recipientId)}` : "/api/messages";
  const conversationId = conversationIdFor();
  let messages = [];
  try {
    ({ messages } = await api(path));
  } catch (error) {
    if (!isOfflineError(error)) throw error;
    messages = cachedMessages(conversationId);
  }
  const pendingMessages = await pendingMessagesForConversation(conversationId);
  if (pendingMessages.length) {
    const merged = new Map(messages.map((message) => [message.id, message]));
    pendingMessages.forEach((message) => merged.set(message.id, message));
    messages = Array.from(merged.values());
  }
  messages = messages.filter((message) => !isPendingDeleted(message.id));
  if (loadId !== state.messageLoadId) return;
  const contentSignature = messagesContentSignature(messages);
  if (state.renderedConversationId === conversationId && state.renderedMessagesSignature === contentSignature && els.messages.childElementCount) {
    refreshRenderedMessageMeta([...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    cacheMessages(conversationId);
    if (state.pendingClearChat?.conversationId === conversationIdFor()) renderPendingClearChatNotice(false);
    if (navigator.onLine) markActiveChatRead();
    return;
  }
  els.messages.textContent = "";
  state.messages.clear();
  state.selectionMode = false;
  state.selectedMessageIds.clear();
  const completed = await renderMessagesOneByOne(messages, loadId);
  if (!completed) return;
  state.renderedConversationId = conversationId;
  state.renderedMessagesSignature = contentSignature;
  cacheMessages(conversationId);
  if (state.pendingClearChat?.conversationId === conversationIdFor()) renderPendingClearChatNotice(false);
  if (navigator.onLine) markActiveChatRead();
}

function markActiveChatRead() {
  if (!state.user) return;
  api("/api/read", {
    method: "POST",
    body: JSON.stringify({ recipientId: currentRecipientId() })
  }).catch(() => {});
}

function sendTyping(active, kind = "typing") {
  if (!state.user) return;
  api("/api/typing", {
    method: "POST",
    body: JSON.stringify({ recipientId: currentRecipientId(), kind, active })
  }).catch(() => {});
}

function scheduleTyping() {
  if (!state.user) return;
  clearTimeout(state.typingSendTimer);
  clearTimeout(state.typingStopTimer);
  state.typingSendTimer = setTimeout(() => sendTyping(true, "typing"), 120);
  state.typingStopTimer = setTimeout(() => sendTyping(false, "typing"), 1800);
}

function startEvents() {
  if (state.events) state.events.close();
  if (!navigator.onLine) return;
  state.events = new EventSource(serverUrl("/api/events"), IS_LOCAL_APP ? { withCredentials: true } : undefined);
  state.events.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!canSeeRealtimeMessage(message)) return;
    const mine = message.userId === state.user?.id;
    const conversationId = messageConversationId(message);
    if (isChatPageVisible() && messageBelongsToActiveChat(message)) {
      addMessage({ ...message, mine });
      if (!mine) markActiveChatRead();
      if (!mine) playTone("receive");
    } else if (!mine) {
      state.unread.set(conversationId, (state.unread.get(conversationId) || 0) + 1);
      renderUsers();
      playTone("receive");
    }
  });
  state.events.addEventListener("messageUpdate", (event) => {
    upsertMessage(JSON.parse(event.data));
  });
  state.events.addEventListener("messageStatus", (event) => {
    updateMessageStatus(JSON.parse(event.data));
  });
  state.events.addEventListener("messageDelete", (event) => {
    const payload = JSON.parse(event.data);
    removeMessage(payload.id);
  });
  state.events.addEventListener("conversationClear", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.conversationId === conversationIdFor()) clearActiveMessages();
    state.unread.delete(payload.conversationId);
    renderUsers();
  });
  state.events.addEventListener("user", (event) => {
    addOrUpdateUser(JSON.parse(event.data));
  });
  state.events.addEventListener("userUpdate", (event) => {
    addOrUpdateUser(JSON.parse(event.data));
  });
  state.events.addEventListener("typing", (event) => {
    handleTyping(JSON.parse(event.data));
  });
  state.events.addEventListener("call", (event) => {
    const payload = JSON.parse(event.data);
    receiveIncomingCall(payload.call);
  });
  state.events.addEventListener("callSignal", (event) => {
    handleCallSignal(JSON.parse(event.data));
  });
  state.events.addEventListener("callUpdate", (event) => {
    handleCallUpdate(JSON.parse(event.data));
  });
  state.events.onerror = () => {
    if (!els.chatPage.classList.contains("hidden")) els.statusLine.textContent = t("reconnecting");
    if (state.events) state.events.close();
    state.events = null;
    scheduleReconnect(2000);
  };
  state.events.addEventListener("ready", () => updateChatHeader());
}

function stopEvents() {
  if (state.events) state.events.close();
  state.events = null;
}

async function reconnectToServer() {
  if (!state.user || state.reconnecting) return;
  state.reconnecting = true;
  try {
    startEvents();
    await loadUsers();
    await syncPendingDeletes();
    await syncPendingMessages();
    if (!els.chatPage.classList.contains("hidden")) {
      await loadMessages();
    }
    updateChatHeader();
  } catch {
    scheduleReconnect(5000);
  } finally {
    state.reconnecting = false;
  }
}

function scheduleReconnect(delay = 1500) {
  if (!state.user) return;
  clearTimeout(state.reconnectTimer);
  state.reconnectTimer = setTimeout(() => reconnectToServer(), delay);
}

function schedulePendingSync(delay = 0) {
  if (!state.user) return;
  clearTimeout(state.syncTimer);
  state.syncTimer = setTimeout(syncPendingMessages, delay);
}

function hasPendingSyncWork() {
  return pendingQueue().length > 0 || pendingDeleteQueue().length > 0;
}

function runPendingSyncNow() {
  if (!state.user) {
    const cachedUser = cachedCurrentUser();
    if (cachedUser) {
      setAuthenticated(cachedUser);
      setUsers(cachedUsers());
    }
  }
  if (!state.user || !hasPendingSyncWork()) return;
  schedulePendingDeleteSync(0);
  schedulePendingSync(0);
}

window.vioraNetworkBack = () => {
  updateAccountLabel();
  runPendingSyncNow();
  scheduleReconnect(0);
};

function watchAccountConnectionLabel() {
  if (!window.MutationObserver || !els.accountLabel) return;
  let lastOnline = els.accountLabel.dataset.online === "true" || els.accountLabel.textContent.includes(t("connected"));
  new MutationObserver(() => {
    const text = els.accountLabel.textContent || "";
    const isOnlineNow = text.includes(t("connected")) && !text.includes(t("offline"));
    if (!lastOnline && isOnlineNow) runPendingSyncNow();
    lastOnline = isOnlineNow;
    els.accountLabel.dataset.online = isOnlineNow ? "true" : "false";
  }).observe(els.accountLabel, { childList: true, characterData: true, subtree: true });
}

watchAccountConnectionLabel();

async function ensureServerSessionForSync() {
  if (!state.user) return false;
  try {
    const { user, rememberToken } = await api(`/api/me?deviceId=${encodeURIComponent(state.deviceId)}`);
    if (user) {
      storeRememberSession(user, rememberToken);
      state.user = user;
      cacheCurrentUser(user);
      return true;
    }
  } catch (error) {
    if (isOfflineError(error)) return false;
  }

  const userId = localStorage.getItem("vioraRememberUserId") || state.user.id;
  const storedRememberToken = localStorage.getItem("vioraRememberToken") || "";
  if (userId && storedRememberToken) {
    try {
      const { user } = await api("/api/remember", {
        method: "POST",
        body: JSON.stringify({ userId, rememberToken: storedRememberToken })
      });
      if (user) {
        state.user = user;
        cacheCurrentUser(user);
        return true;
      }
    } catch (error) {
      if (isOfflineError(error)) return false;
    }
  }

  try {
    const { user, rememberToken } = await api("/api/device-login", {
      method: "POST",
      body: JSON.stringify({ deviceId: state.deviceId })
    });
    if (user) {
      storeRememberSession(user, rememberToken);
      state.user = user;
      cacheCurrentUser(user);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function createPendingTextMessage(text, recipientId = "", options = {}) {
  const createdAt = options.createdAt || new Date().toISOString();
  const conversationId = recipientId ? directConversationId(state.user.id, recipientId) : "general";
  return {
    id: options.localId || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: state.user.id,
    recipientId: recipientId || null,
    conversationId,
    author: state.user.name,
    username: state.user.username,
    avatar: state.user.avatar || "",
    text,
    media: null,
    mediaGroup: null,
    createdAt,
    deliveredAt: null,
    readAt: null,
    mine: true,
    pending: true
  };
}

function mediaFromPendingFile(file, url) {
  const kind = filePreviewKind(file);
  const mediaType = kind === "image" || kind === "video" || kind === "audio" ? kind : "document";
  return {
    type: mediaType,
    mime: file.type || "application/octet-stream",
    name: file.name || "attachment",
    url,
    size: file.size || 0,
    local: true
  };
}

function createPendingMediaMessage(files, caption = "", recipientId = "", localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`, options = {}) {
  const createdAt = options.createdAt || new Date().toISOString();
  const conversationId = recipientId ? directConversationId(state.user.id, recipientId) : "general";
  const urls = files.map((file) => URL.createObjectURL(file));
  state.pendingObjectUrls.push(...urls);
  const mediaItems = files.map((file, index) => mediaFromPendingFile(file, urls[index]));
  const imagesOnlyGroup = files.length > 1 && files.every((file) => filePreviewKind(file) === "image");
  return {
    id: localId,
    userId: state.user.id,
    recipientId: recipientId || null,
    conversationId,
    author: state.user.name,
    username: state.user.username,
    avatar: state.user.avatar || "",
    text: String(caption || "").trim(),
    media: imagesOnlyGroup ? null : mediaItems[0] || null,
    mediaGroup: imagesOnlyGroup ? mediaItems : null,
    createdAt,
    deliveredAt: null,
    readAt: null,
    mine: true,
    pending: true
  };
}

async function pendingMessagesForConversation(conversationId) {
  if (!state.user) return [];
  const messages = [];
  for (const item of pendingQueue()) {
    if (item.conversationId !== conversationId) continue;
    if (item.kind === "media") {
      const files = [];
      for (const fileId of item.fileIds || []) {
        const file = await getPendingFile(fileId).catch(() => null);
        if (file) files.push(file);
      }
      if (!files.length) continue;
      messages.push(createPendingMediaMessage(files, item.caption || "", item.recipientId || "", item.localId, { createdAt: item.createdAt }));
    } else {
      messages.push(createPendingTextMessage(item.text || "", item.recipientId || "", {
        localId: item.localId,
        createdAt: item.createdAt
      }));
    }
  }
  return messages;
}

async function uploadPendingMediaItem(item) {
  const files = [];
  for (const fileId of item.fileIds || []) {
    const file = await getPendingFile(fileId);
    if (!file) throw new Error(t("unexpectedError"));
    files.push(file);
  }
  if (!files.length) throw new Error(t("unexpectedError"));
  const imagesOnly = files.every((file) => filePreviewKind(file) === "image");
  const imagesOnlyGroup = files.length > 1 && imagesOnly;
  const uploadedMessages = [];
  if (imagesOnlyGroup) {
    const formData = new FormData();
    files.forEach((file) => formData.append("media", file));
    formData.append("caption", item.caption || "");
    formData.append("recipientId", item.recipientId || "");
    formData.append("clientId", item.localId || "");
    const { message } = await api("/api/upload-group", { method: "POST", body: formData });
    if (!message?.id) throw new Error(t("unexpectedError"));
    uploadedMessages.push(message);
    return uploadedMessages;
  }
  for (const [index, file] of files.entries()) {
    const formData = new FormData();
    formData.append("media", file);
    formData.append("caption", imagesOnly && index === 0 ? item.caption || "" : "");
    formData.append("recipientId", item.recipientId || "");
    formData.append("clientId", `${item.localId || "pending"}:${index}`);
    const { message } = await api("/api/upload", { method: "POST", body: formData });
    if (!message?.id) throw new Error(t("unexpectedError"));
    uploadedMessages.push(message);
    if (index < files.length - 1) await waitForNextMessageLoad();
  }
  if (!imagesOnly && item.caption) {
    await waitForNextMessageLoad();
    const { message } = await api("/api/messages", {
      method: "POST",
      body: JSON.stringify({ text: item.caption, recipientId: item.recipientId || "", clientId: `${item.localId || "pending"}:caption` })
    });
    uploadedMessages.push(message);
  }
  return uploadedMessages;
}

async function syncPendingMessages() {
  if (!state.user || state.syncing) return;
  const queue = pendingQueue();
  if (!queue.length) return;
  state.syncing = true;
  const remaining = [];
  let sentCount = 0;
  try {
    const hasSession = await ensureServerSessionForSync();
    if (!hasSession) {
      remaining.push(...queue);
      return;
    }
    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index];
      try {
        const messages = [];
        if (item.kind === "media") {
          messages.push(...await uploadPendingMediaItem(item));
          await deletePendingFiles(item.fileIds);
        } else {
          const { message } = await api("/api/messages", {
            method: "POST",
            body: JSON.stringify({ text: item.text, recipientId: item.recipientId || "", clientId: item.localId })
          });
          messages.push(message);
        }
        if (messages.length) {
          const finalized = finalizePendingMessage(item.localId, messages);
          if (!finalized) {
            for (const message of messages) {
              if (message?.id) state.messages.set(message.id, message);
            }
          }
          cacheMessages(item.conversationId);
        }
        sentCount += 1;
      } catch (error) {
        remaining.push(...queue.slice(index));
        break;
      }
    }
  } finally {
    state.syncing = false;
    savePendingQueue(remaining);
  }
}

async function syncPendingDeletes() {
  if (!state.user || state.deleteSyncing) return;
  const queue = pendingDeleteQueue();
  if (!queue.length) return;
  state.deleteSyncing = true;
  const remaining = [];
  try {
    const hasSession = await ensureServerSessionForSync();
    if (!hasSession) {
      remaining.push(...queue);
      return;
    }
    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index];
      try {
        await api(`/api/messages/${encodeURIComponent(item.messageId)}/delete`, {
          method: "POST",
          body: JSON.stringify({ mode: item.mode || "me" })
        });
      } catch (error) {
        if (/الرسالة غير موجودة|not found/i.test(error.message || "")) continue;
        remaining.push(...queue.slice(index));
        break;
      }
    }
  } finally {
    state.deleteSyncing = false;
    savePendingDeleteQueue(remaining);
  }
}

async function queuePendingDelete(messageId, mode = "me") {
  if (!messageId) return;
  if (await removeQueuedOutgoingMessage(messageId)) return;
  const queue = pendingDeleteQueue();
  if (!queue.some((item) => item.messageId === messageId && item.mode === mode)) {
    queue.push({ messageId, mode, createdAt: new Date().toISOString() });
    savePendingDeleteQueue(queue);
  }
  schedulePendingDeleteSync(250);
}

function queuePendingTextMessage(text, recipientId = currentRecipientId()) {
  const message = createPendingTextMessage(text, recipientId);
  const queue = pendingQueue();
  if (queue.some((item) => item.localId === message.id)) return message;
  queue.push({
    kind: "text",
    localId: message.id,
    text,
    recipientId: message.recipientId || "",
    conversationId: message.conversationId,
    createdAt: message.createdAt
  });
  savePendingQueue(queue);
  addMessage(message);
  showToast(t("messageQueuedOffline"));
  schedulePendingSync(250);
  return message;
}

async function queuePendingMediaMessage(files, caption = "", recipientId = currentRecipientId()) {
  if (!window.indexedDB) throw new Error(t("attachmentsNeedOnline"));
  if (files.length > 10) throw new Error(t("maxAttachments"));
  const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const message = createPendingMediaMessage(files, caption, recipientId, localId);
  const fileIds = [];
  for (const [index, file] of files.entries()) {
    const id = pendingFileId(localId, index);
    await savePendingFile(id, file);
    fileIds.push(id);
  }
  const queue = pendingQueue();
  queue.push({
    kind: "media",
    localId,
    caption: String(caption || "").trim(),
    recipientId: message.recipientId || "",
    conversationId: message.conversationId,
    fileIds,
    createdAt: message.createdAt
  });
  savePendingQueue(queue);
  addMessage(message);
  showToast(t("messageQueuedOffline"));
  schedulePendingSync(250);
  return message;
}

async function submitText(text) {
  sendTyping(false, "typing");
  if (!navigator.onLine) {
    queuePendingTextMessage(text);
    playTone("send");
    return;
  }
  try {
    const { message } = await api("/api/messages", {
      method: "POST",
      body: JSON.stringify({ text, recipientId: currentRecipientId() })
    });
    addMessage(message);
    playTone("send");
  } catch (error) {
    if (!isOfflineError(error)) throw error;
    queuePendingTextMessage(text);
    playTone("send");
  }
}

async function submitMedia(caption) {
  sendTyping(true, "upload");
  const files = [...state.mediaFiles];
  const recipientId = currentRecipientId();
  const captionText = String(caption || "").trim();
  let uploadedAny = false;
  try {
    if (!navigator.onLine) {
      await queuePendingMediaMessage(files, captionText, recipientId);
      playTone("send");
      return;
    }
    if (files.length > 10) throw new Error(t("maxAttachments"));
    const imagesOnly = files.every((file) => filePreviewKind(file) === "image");
    const imagesOnlyGroup = files.length > 1 && imagesOnly;
    if (imagesOnlyGroup) {
      const formData = new FormData();
      files.forEach((file) => formData.append("media", file));
      formData.append("caption", captionText);
      formData.append("recipientId", recipientId);
      const { message } = await api("/api/upload-group", {
        method: "POST",
        body: formData
      });
      if (!message?.id) throw new Error(t("unexpectedError"));
      uploadedAny = true;
      addMessage(message);
      playTone("send");
      return;
    }
    for (const [index, file] of files.entries()) {
      const formData = new FormData();
      formData.append("media", file);
      formData.append("caption", imagesOnly && index === 0 ? captionText : "");
      formData.append("recipientId", recipientId);
      const { message } = await api("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!message?.id) throw new Error(t("unexpectedError"));
      uploadedAny = true;
      addMessage(message);
      if (index < files.length - 1) await waitForNextMessageLoad();
    }
    if (!imagesOnly && captionText) {
      await waitForNextMessageLoad();
      await submitText(captionText);
    } else if (files.length) {
      playTone("send");
    }
  } catch (error) {
    if (!isOfflineError(error) || uploadedAny) throw error;
    await queuePendingMediaMessage(files, captionText, recipientId);
    playTone("send");
  } finally {
    sendTyping(false, "upload");
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("vioraTheme", theme);
  if (els.themeToggle) els.themeToggle.checked = theme === "dark";
}

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
});

document.querySelectorAll("[data-open-settings]").forEach((button) => {
  button.addEventListener("click", () => {
    fillProfileForm(state.user);
    els.profileEditSection?.classList.add("hidden");
    hideFloatingElement(els.languagePanel);
    showPage("settings");
  });
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(els.loginForm));
    data.deviceId = state.deviceId;
    const { user, rememberToken } = await api("/api/login", { method: "POST", body: JSON.stringify(data) });
    storeRememberSession(user, rememberToken);
    setAuthenticated(user);
    await loadUsers();
    showToast(t("loggedIn"));
  } catch (error) {
    setNotice(els.authNotice, error.message, true);
  }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(els.registerForm));
    data.deviceId = state.deviceId;
    const { user, rememberToken } = await api("/api/register", { method: "POST", body: JSON.stringify(data) });
    storeRememberSession(user, rememberToken);
    setAuthenticated(user);
    await loadUsers();
    showToast(t("accountCreated"));
  } catch (error) {
    setNotice(els.authNotice, error.message, true);
  }
});

els.profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(els.profileForm);
    const hasAvatar = els.avatarInput?.files?.length > 0;
    const requestBody = hasAvatar ? formData : JSON.stringify(Object.fromEntries(formData));
    const { user } = await api("/api/profile", { method: "POST", body: requestBody });
    state.user = user;
    setAuthenticated(user);
    await loadUsers();
    setNotice(els.settingsNotice, t("savedProfile"));
    showToast(t("accountUpdated"));
    showPage("accounts");
  } catch (error) {
    setNotice(els.settingsNotice, error.message, true);
  }
});

els.logoutButton.addEventListener("click", async () => {
  try {
    await api("/api/logout", {
      method: "POST",
      body: JSON.stringify({
        userId: state.user?.id || localStorage.getItem("vioraRememberUserId") || "",
        rememberToken: localStorage.getItem("vioraRememberToken") || "",
        deviceId: state.deviceId
      })
    });
    clearRememberSession();
    localStorage.removeItem("vioraOffline:currentUser");
    setAuthenticated(null);
    showToast(t("loggedOut"));
  } catch (error) {
    showToast(error.message || t("unexpectedError"));
  }
});

els.menuButton.addEventListener("click", () => {
  toggleMenu(els.overflowMenu);
});

function closeMenusFromOutside(event) {
  if (!els.overflowMenu.contains(event.target) && !els.menuButton.contains(event.target)) {
    hideFloatingElement(els.overflowMenu);
  }
  if (!els.chatMenu.contains(event.target) && !els.chatMenuButton.contains(event.target)) {
    hideFloatingElement(els.chatMenu);
  }
  if (!els.composerMenu.contains(event.target) && !els.composerMenuButton.contains(event.target)) {
    hideFloatingElement(els.composerMenu);
  }
}

document.addEventListener("pointerdown", closeMenusFromOutside);
document.addEventListener("click", closeMenusFromOutside);
els.menuOverlay?.addEventListener("pointerdown", closeFloatingMenus);
els.menuOverlay?.addEventListener("click", closeFloatingMenus);

els.refreshButton.addEventListener("click", async () => {
  await loadUsers();
  showToast(t("accountsUpdated"));
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value;
  renderUsers();
});

els.generalChatButton.addEventListener("click", () => openChat("general"));
els.backToAccounts.addEventListener("click", handleBackFromChat);
els.backFromSettings.addEventListener("click", () => showPage("accounts"));
els.themeToggle.addEventListener("change", () => applyTheme(els.themeToggle.checked ? "dark" : "light"));
els.themeToggle.closest(".switch")?.addEventListener("click", (event) => event.stopPropagation());
els.themeActionButton?.addEventListener("click", (event) => {
  if (event.target === els.themeToggle) return;
  els.themeToggle.checked = !els.themeToggle.checked;
  applyTheme(els.themeToggle.checked ? "dark" : "light");
});
els.themeActionButton?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  els.themeToggle.checked = !els.themeToggle.checked;
  applyTheme(els.themeToggle.checked ? "dark" : "light");
});
els.editProfileToggle?.addEventListener("click", () => {
  els.profileEditSection.classList.toggle("hidden");
  if (!els.profileEditSection.classList.contains("hidden")) {
    fillProfileForm(state.user);
    els.profileEditSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
els.languageToggle?.addEventListener("click", () => {
  if (els.languagePanel.classList.contains("hidden")) {
    closeAllMenus(els.languagePanel);
    showFloatingElement(els.menuOverlay);
    showFloatingElement(els.languagePanel);
  } else {
    closeAllMenus();
  }
});
els.avatarButton?.addEventListener("click", () => els.avatarInput.click());

els.avatarInput.addEventListener("change", () => {
  const file = els.avatarInput.files[0];
  if (!file) {
    setAvatar(els.settingsAvatar, state.user);
    if (els.avatarFileName) els.avatarFileName.textContent = t("noImageSelected");
    return;
  }
  if (!file.type.startsWith("image/")) {
    els.avatarInput.value = "";
    showToast(t("imageOnly"));
    if (els.avatarFileName) els.avatarFileName.textContent = t("noImageSelected");
    return;
  }
  if (els.avatarFileName) els.avatarFileName.textContent = `${t("selectedImage")}: ${file.name}`;
  els.settingsAvatar.textContent = "";
  els.settingsAvatar.classList.add("has-image");
  els.settingsAvatar.style.backgroundImage = `url("${URL.createObjectURL(file)}")`;
});

els.chatMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  els.voiceCallButton?.classList.toggle("hidden", state.activeChat.type !== "direct");
  toggleMenu(els.chatMenu);
});

els.messageSearchButton.addEventListener("click", openMessageSearchBar);
els.openMessageSearch.addEventListener("click", openMessageSearchBar);
els.composerSearchButton.addEventListener("click", openMessageSearchBar);
els.scrollBottomButton.addEventListener("click", () => {
  hideFloatingElement(els.chatMenu);
  scrollMessagesToBottom();
});

els.messageSearchInput.addEventListener("input", () => {
  state.messageSearch = els.messageSearchInput.value;
  updateMessageSearchVisibility();
});

els.closeMessageSearch.addEventListener("click", () => {
  const previousScrollTop = els.messages.scrollTop;
  state.messageSearch = "";
  els.messageSearchInput.value = "";
  els.messageSearchBar.classList.add("hidden");
  updateMessageSearchVisibility();
  els.messages.scrollTop = previousScrollTop;
});

els.composerMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenu(els.composerMenu);
});

els.clearDraftButton.addEventListener("click", () => {
  els.messageInput.value = "";
  els.messageInput.style.height = "auto";
  hideFloatingElement(els.composerMenu);
});

els.clearAttachmentButton.addEventListener("click", () => {
  clearAttachment();
  hideFloatingElement(els.composerMenu);
});

function closeOverlayPanels() {
  closeMessageContextMenu();
  closeShareModal();
  closeEditModal();
  closeConfirmModal();
  closeViewerModal();
  hideFloatingElement(els.callsModal);
}

els.messageOverlay.addEventListener("pointerdown", closeOverlayPanels);
els.messageOverlay.addEventListener("click", closeOverlayPanels);

els.forwardMessageButton.addEventListener("click", openShareModal);
els.closeConversationButton?.addEventListener("click", closeConversationView);

async function deleteMessageWithOfflineSupport(messageId, mode = "me") {
  if (!messageId) return;
  if (await removeQueuedOutgoingMessage(messageId)) {
    removeMessage(messageId);
    return;
  }
  if (!navigator.onLine) {
    await queuePendingDelete(messageId, mode);
    removeMessage(messageId);
    return;
  }
  try {
    await api(`/api/messages/${encodeURIComponent(messageId)}/delete`, { method: "POST", body: JSON.stringify({ mode }) });
    removeMessage(messageId);
  } catch (error) {
    if (!isOfflineError(error)) throw error;
    await queuePendingDelete(messageId, mode);
    removeMessage(messageId);
  }
}

async function deleteSelectedMessage(mode = "me") {
  if (!state.selectedMessage) return;
  const messageId = state.selectedMessage.id;
  try {
    await deleteMessageWithOfflineSupport(messageId, mode);
    closeMessageContextMenu();
    closeConfirmModal();
    showToast(t("messageDeleted"));
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteSelectedMessages(mode = "me") {
  const messages = selectedMessages();
  if (!messages.length) return;
  try {
    for (const message of messages) {
      await deleteMessageWithOfflineSupport(message.id, mode);
      state.selectedMessageIds.delete(message.id);
    }
    state.selectionMode = false;
    closeConfirmModal();
    rerenderMessages();
    showToast(t("messageDeleted"));
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteCurrentDeleteTarget(mode = "me") {
  if (state.selectedMessageIds.size > 0) return deleteSelectedMessages(mode);
  return deleteSelectedMessage(mode);
}

els.deleteMessageButton.addEventListener("click", () => {
  if (!state.selectedMessage) return;
  openConfirmModal({
    title: t("deleteMessage"),
    text: t("confirmDeleteMessageText"),
    mode: "message-delete",
    message: state.selectedMessage
  });
});

els.selectMessageButton?.addEventListener("click", () => startMessageSelection(state.selectedMessage));
els.bulkDeleteButton?.addEventListener("click", () => {
  if (state.selectedMessageIds.size === 0) return;
  openConfirmModal({
    title: t("deleteSelected"),
    text: t("confirmDeleteSelectedText"),
    mode: "bulk-delete"
  });
});

els.bulkForwardButton?.addEventListener("click", () => {
  if (state.selectedMessageIds.size === 0) return;
  openShareModal();
});

els.clearChatButton?.addEventListener("click", () => {
  hideFloatingElement(els.chatMenu);
  openConfirmModal({
    title: t("clearChat"),
    text: t("confirmClearChatText"),
    action: clearCurrentChat
  });
});

els.editMessageButton.addEventListener("click", openEditModal);
els.closeShareModal.addEventListener("click", closeShareModal);
els.closeEditModal.addEventListener("click", closeEditModal);
els.closeConfirmModal?.addEventListener("click", closeConfirmModal);
els.cancelConfirmButton?.addEventListener("click", closeConfirmModal);
els.deleteForMeButton?.addEventListener("click", () => deleteCurrentDeleteTarget("me"));
els.deleteForEveryoneButton?.addEventListener("click", () => deleteCurrentDeleteTarget("everyone"));
els.confirmActionButton?.addEventListener("click", async () => {
  const action = state.confirmAction;
  if (!action) return closeConfirmModal();
  els.confirmActionButton.disabled = true;
  try {
    await action();
  } finally {
    els.confirmActionButton.disabled = false;
  }
});
els.closeViewerModal.addEventListener("click", closeViewerModal);
els.callsTabButton?.addEventListener("click", openCallsModal);
els.closeCallsModal?.addEventListener("click", () => {
  hideFloatingElement(els.callsModal);
  hideOverlay();
});
els.clearCallsButton?.addEventListener("click", clearCallHistory);
els.voiceCallButton?.addEventListener("click", () => {
  hideFloatingElement(els.chatMenu);
  if (state.activeChat.type !== "direct" || !state.activeChat.user) return showToast(t("callUnavailable"));
  beginVoiceCall(state.activeChat.user);
});
els.closeCallWindow?.addEventListener("click", closeCallWindowOnly);
els.callWindow?.addEventListener("click", () => els.remoteCallAudio?.play?.().catch(() => {}));
els.videocamButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleCallCamera().catch((error) => showToast(error.message || t("unexpectedError")));
});
els.acceptCallButton?.addEventListener("click", acceptIncomingCall);
els.rejectCallButton?.addEventListener("click", () => endLocalCall(true, "reject"));
els.endCallButton?.addEventListener("click", () => endLocalCall(true, "end"));

els.shareSelectedButton.addEventListener("click", async () => {
  const messages = state.selectedMessageIds.size > 0 ? selectedMessages() : [state.selectedMessage].filter(Boolean);
  if (!messages.length || state.selectedShareUsers.size === 0) return;
  try {
    const recipientIds = Array.from(state.selectedShareUsers);
    for (const message of messages) {
      await api(`/api/messages/${encodeURIComponent(message.id)}/forward`, {
        method: "POST",
        body: JSON.stringify({ recipientIds })
      });
    }
    closeShareModal();
    if (state.selectedMessageIds.size > 0) clearMessageSelection();
    showToast(t("sharedSelected"));
  } catch (error) {
    showToast(error.message);
  }
});

els.saveEditButton.addEventListener("click", async () => {
  if (!state.selectedMessage) return;
  try {
    const { message } = await api(`/api/messages/${encodeURIComponent(state.selectedMessage.id)}/edit`, {
      method: "POST",
      body: JSON.stringify({ text: els.editMessageInput.value })
    });
    upsertMessage(message);
    closeEditModal();
    showToast(t("messageEdited"));
  } catch (error) {
    showToast(error.message);
  }
});

els.attachButton.addEventListener("click", () => els.mediaInput.click());
els.recordButton?.addEventListener("click", toggleRecording);

els.mediaInput.addEventListener("change", () => {
  if (state.isSending) {
    els.mediaInput.value = "";
    showToast(t("sendingInProgress"));
    return;
  }
  const nextFiles = [...state.mediaFiles, ...Array.from(els.mediaInput.files || [])];
  if (nextFiles.length > 10) showToast(t("maxAttachments"));
  state.mediaFiles = nextFiles.slice(0, 10);
  els.mediaInput.value = "";
  if (!state.mediaFiles.length) {
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
    return;
  }
  sendTyping(true, "upload");
  setTimeout(() => sendTyping(false, "upload"), 1600);
  renderAttachmentPreviews();
});

els.messageInput.addEventListener("input", () => {
  els.messageInput.style.height = "auto";
  els.messageInput.style.height = `${Math.min(120, els.messageInput.scrollHeight)}px`;
  if (els.messageInput.value.trim()) scheduleTyping();
  else sendTyping(false, "typing");
});

els.composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.user) return showToast(t("loginFirst"));
  if (state.isSending) return showToast(t("sendingInProgress"));
  if (state.recorder || state.fallbackRecorder) await stopRecording();
  const text = els.messageInput.value.trim();
  if (!text && !state.mediaFiles.length) return;
  if (state.mediaFiles.length > 10) return showToast(t("maxAttachments"));
  state.isSending = true;
  els.composer.querySelector(".send-button").disabled = true;
  els.messageInput.disabled = true;
  els.attachButton.disabled = true;
  if (els.recordButton) els.recordButton.disabled = true;
  try {
    if (state.mediaFiles.length) await submitMedia(text);
    else await submitText(text);
    els.messageInput.value = "";
    els.messageInput.style.height = "auto";
    clearAttachment();
  } catch (error) {
    showToast(error.message);
  } finally {
    state.isSending = false;
    els.composer.querySelector(".send-button").disabled = false;
    els.messageInput.disabled = false;
    els.attachButton.disabled = false;
    if (els.recordButton) els.recordButton.disabled = false;
  }
});

if (window.MutationObserver && els.messages) {
  new MutationObserver(() => {
    if (Date.now() <= state.keepScrollBottomUntil) setMessagesBottom();
  }).observe(els.messages, { childList: true, subtree: true, attributes: true });
}

if (window.ResizeObserver && els.messages) {
  new ResizeObserver(() => {
    if (Date.now() <= state.keepScrollBottomUntil) setMessagesBottom();
  }).observe(els.messages);
}

window.addEventListener("online", () => {
  window.vioraNetworkBack();
});

window.addEventListener("offline", () => {
  updateAccountLabel();
  stopEvents();
  if (!els.chatPage.classList.contains("hidden")) updateChatHeader();
});

window.addEventListener("popstate", () => {
  if (handleAppBack()) primeBackNavigation();
});

setInterval(() => {
  if (!state.user || state.reconnecting) return;
  if (!state.events || state.events.readyState === EventSource.CLOSED) {
    scheduleReconnect(100);
  }
}, 7000);

loadMe().catch(() => {
  const cachedUser = cachedCurrentUser();
  if (cachedUser) {
    setAuthenticated(cachedUser);
    setUsers(cachedUsers());
    schedulePendingDeleteSync(0);
    schedulePendingSync(0);
  } else {
    setAuthenticated(null);
  }
});

primeBackNavigation();
