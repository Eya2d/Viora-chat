const state = {
  user: null,
  users: new Map(),
  messages: new Map(),
  events: null,
  mediaFile: null,
  activeChat: { type: "general", user: null },
  search: "",
  messageSearch: "",
  selectedMessage: null,
  selectedShareUsers: new Set(),
  unread: new Map(),
  typing: new Map(),
  typingTimers: new Map(),
  typingSendTimer: null,
  typingStopTimer: null,
  audioContext: null,
  keepScrollBottomUntil: 0,
  recorder: null,
  recorderStream: null,
  recorderChunks: [],
  recorderStartedAt: 0,
  recorderAnimation: null,
  recorderAnalyser: null,
  recordingCancelled: false,
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
  messageSearchButton: document.querySelector("#messageSearchButton"),
  openMessageSearch: document.querySelector("#openMessageSearch"),
  scrollBottomButton: document.querySelector("#scrollBottomButton"),
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
  messageOverlay: document.querySelector("#messageOverlay"),
  messageContextMenu: document.querySelector("#messageContextMenu"),
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
  viewerModal: document.querySelector("#viewerModal"),
  viewerTitle: document.querySelector("#viewerTitle"),
  viewerOpenLink: document.querySelector("#viewerOpenLink"),
  viewerBody: document.querySelector("#viewerBody"),
  closeViewerModal: document.querySelector("#closeViewerModal")
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

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options
  });
  const payload = await response.json().catch(() => ({}));
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

function setNotice(node, message, isError = false) {
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function conversationIdFor(type = state.activeChat.type, user = state.activeChat.user) {
  if (type === "general") return "general";
  return user?.id && state.user?.id ? directConversationId(state.user.id, user.id) : "";
}

function messageConversationId(message) {
  return message.conversationId || "general";
}

function canSeeRealtimeMessage(message) {
  if (!state.user || !message) return false;
  if (messageConversationId(message) === "general") return true;
  return message.userId === state.user.id || message.recipientId === state.user.id;
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

function hideOverlay() {
  if (isShown(els.messageContextMenu) || isShown(els.shareModal) || isShown(els.editModal) || isShown(els.viewerModal)) return;
  hideFloatingElement(els.messageOverlay);
}

function closeAllMenus(except) {
  [els.overflowMenu, els.chatMenu, els.composerMenu].forEach((menu) => {
    if (menu !== except) hideFloatingElement(menu);
  });
}

function closeAllModals(except) {
  [els.shareModal, els.editModal, els.viewerModal].forEach((modal) => {
    if (modal !== except) hideFloatingElement(modal);
  });
}

function toggleMenu(menu) {
  if (isShown(menu)) {
    hideFloatingElement(menu);
    return;
  }
  closeAllMenus(menu);
  closeMessageContextMenu();
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

  els.accountLabel.textContent = `@${user.username} · ${t("connected")}`;
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
  renderUsers();
}

function renderUsers() {
  els.usersList.textContent = "";
  if (!state.user) return;
  const generalUnread = state.unread.get("general") || 0;
  const generalBadge = els.generalChatButton.querySelector("em");
  if (generalBadge) {
    generalBadge.classList.toggle("unread-dot", generalUnread > 0);
    generalBadge.textContent = generalUnread > 0 ? String(generalUnread) : t("now");
    generalBadge.title = generalUnread > 0 ? `${generalUnread} ${t("newMessages")}` : t("now");
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
    const unread = state.unread.get(directConversationId(state.user.id, user.id)) || 0;
    const row = document.createElement("button");
    row.className = `chat-row user-row${unread ? " has-unread" : ""}`;
    row.type = "button";
    row.innerHTML = `
      <span class="avatar" data-avatar-user="${escapeHtml(user.id)}">${escapeHtml(initials(user.name))}</span>
      <span>
        <strong>${escapeHtml(user.name)}</strong>
        <small>@${escapeHtml(user.username)} · ${escapeHtml(user.about || t("available"))}</small>
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
    return;
  }
  state.typing.set(conversationId, payload);
  state.typingTimers.set(conversationId, setTimeout(() => {
    state.typing.delete(conversationId);
    updateChatHeader();
  }, 3500));
  updateChatHeader();
}

function addMessage(message) {
  if (!messageBelongsToActiveChat(message) || state.messages.has(message.id)) return;
  state.messages.set(message.id, message);
  rerenderMessages();
}

function upsertMessage(message) {
  if (!messageBelongsToActiveChat(message)) return;
  state.messages.set(message.id, message);
  rerenderMessages();
}

function updateMessageStatus(payload) {
  const message = state.messages.get(payload.id);
  if (!message) return;
  message.deliveredAt = payload.deliveredAt || message.deliveredAt || null;
  message.readAt = payload.readAt || message.readAt || null;
  state.messages.set(message.id, message);
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
  const status = message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent";
  const icon = status === "sent" ? "✓" : "✓✓";
  return ` <span class="ticks ${status}" title="${escapeHtml(t(status))}">${icon}</span>`;
}

function renderMessage(message, previousMessage = null) {
  const node = document.createElement("article");
  const mine = message.mine || message.userId === state.user?.id;
  const hasTail = shouldShowMessageTail(message, previousMessage);
  const date = new Date(message.createdAt);
  const dateKey = Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
  node.className = `message${mine ? " mine" : ""}${hasTail ? " with-tail" : " xoox"}`;
  node.dataset.messageId = message.id;
  node.dataset.dateKey = dateKey;
  node.innerHTML = `
    <div class="meta">
      <span>${escapeHtml(message.author || t("user"))}</span>
      <span>@${escapeHtml(message.username || "")}</span>
    </div>
    <div class="body"></div>
    <time>${formatTime(message.createdAt)}${message.editedAt ? ` · ${escapeHtml(t("edited"))}` : ""}${messageTickHtml(message)}</time>
  `;
  const body = node.querySelector(".body");
  if (message.forwardedFrom) {
    const forwarded = document.createElement("span");
    forwarded.className = "forwarded-label";
    forwarded.textContent = t("forwarded");
    body.appendChild(forwarded);
  }
  if (message.media) body.appendChild(renderMedia(message.media));
  if (message.text) {
    const text = document.createElement("p");
    text.textContent = message.text;
    body.appendChild(text);
  }
  node.addEventListener("contextmenu", (event) => openMessageContextMenu(event, message));
  els.messages.appendChild(node);
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
  const haystack = normalizeForSearch(`${message.author || ""} ${message.username || ""} ${message.text || ""} ${message.media?.name || ""} ${message.media?.mime || ""}`);
  return haystack.includes(query);
}

function removeMessage(messageId) {
  state.messages.delete(messageId);
  rerenderMessages();
}

function canEditClient(message) {
  if (!message || message.userId !== state.user?.id || message.media?.type === "video") return false;
  const createdAt = new Date(message.createdAt).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt <= 5 * 60 * 1000;
}

function openMessageContextMenu(event, message) {
  event.preventDefault();
  state.selectedMessage = message;
  closeAllMenus();
  showOverlay();
  showFloatingElement(els.messageContextMenu);
  els.editMessageButton.classList.toggle("hidden", !canEditClient(message));
  els.deleteMessageButton.classList.toggle("hidden", message.userId !== state.user?.id);
  const menuWidth = 210;
  const menuHeight = 142;
  const isLtr = document.documentElement.dir === "ltr";
  const preferredX = isLtr ? event.clientX : event.clientX - menuWidth;
  const x = Math.min(Math.max(8, preferredX), window.innerWidth - menuWidth - 8);
  const y = Math.min(event.clientY, window.innerHeight - menuHeight - 8);
  els.messageContextMenu.style.left = `${x}px`;
  els.messageContextMenu.style.top = `${Math.max(8, y)}px`;
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
  if (state.recorder) {
    stopRecording(true);
    return;
  }
  state.mediaFile = null;
  els.mediaInput.value = "";
  els.mediaPreview.classList.add("hidden");
  els.mediaPreview.textContent = "";
}

function openShareModal() {
  if (!state.selectedMessage) return;
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

function closeViewerModal() {
  pauseAllMedia();
  hideFloatingElement(els.viewerModal);
  els.viewerBody.textContent = "";
  els.viewerOpenLink.removeAttribute("href");
  els.viewerOpenLink.removeAttribute("download");
  hideOverlay();
}

function canUseBrowserFrameViewer() {
  const maxTouchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints || 0;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches && maxTouchPoints === 0;
}

async function openAttachmentViewer(media) {
  els.viewerTitle.textContent = media.name || t("viewFile");
  els.viewerOpenLink.href = media.url;
  els.viewerOpenLink.download = media.name || "attachment";
  els.viewerBody.textContent = "";
  pauseAllMedia();
  closeAllMenus();
  hideFloatingElement(els.messageContextMenu);
  closeAllModals(els.viewerModal);
  showOverlay();
  showFloatingElement(els.viewerModal);

  if (media.type === "image") {
    const image = document.createElement("img");
    image.className = "viewer-image";
    image.src = media.url;
    image.alt = media.name || t("image");
    els.viewerBody.appendChild(image);
    return;
  }

  if (media.type === "video") {
    els.viewerBody.appendChild(createCustomVideoPlayer(media));
    return;
  }

  if (canUseBrowserFrameViewer() && (media.mime === "application/pdf" || media.mime === "text/plain")) {
    const frame = document.createElement("iframe");
    frame.className = "viewer-frame";
    frame.src = media.url;
    frame.title = media.name || t("file");
    els.viewerBody.appendChild(frame);
    return;
  }

  if (media.mime === "text/plain") {
    const wrap = document.createElement("div");
    wrap.className = "private-text-viewer";
    const heading = document.createElement("div");
    heading.className = "private-viewer-heading";
    heading.innerHTML = `
      <strong>${escapeHtml(media.name || "TXT")}</strong>
      <small>${escapeHtml(t("privateViewer"))} · ${formatSize(media.size)}</small>
    `;
    const pre = document.createElement("pre");
    pre.className = "viewer-text";
    pre.textContent = t("textLoading");
    wrap.appendChild(heading);
    wrap.appendChild(pre);
    els.viewerBody.appendChild(wrap);
    try {
      const response = await fetch(media.url);
      pre.textContent = await response.text();
    } catch {
      pre.textContent = t("textLoadFail");
    }
    return;
  }

  const card = document.createElement("div");
  card.className = "document-view-card";
  card.innerHTML = `
    <b>${escapeHtml(documentIcon(media.mime))}</b>
    <strong>${escapeHtml(media.name || t("file"))}</strong>
    <small>${escapeHtml(media.mime || t("file"))} · ${formatSize(media.size)}</small>
    <span>${canUseBrowserFrameViewer() ? t("browserFrameFail") : t("privateViewerFail")}</span>
  `;
  els.viewerBody.appendChild(card);
}

function messageBelongsToActiveChat(message) {
  if (state.activeChat.type === "general") return (message.conversationId || "general") === "general";
  const otherId = state.activeChat.user?.id;
  return message.conversationId === directConversationId(state.user.id, otherId);
}

function directConversationId(userA, userB) {
  return `direct:${[userA, userB].sort().join(":")}`;
}

function renderMedia(media) {
  const wrapper = document.createElement("div");
  let mediaNode;
  if (media.type === "image") {
    mediaNode = document.createElement("img");
    mediaNode.alt = media.name || t("image");
    mediaNode.addEventListener("click", () => openAttachmentViewer(media));
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
    mediaNode.addEventListener("click", () => openAttachmentViewer(media));
  }
  if (mediaNode.tagName !== "BUTTON" && !mediaNode.dataset.customMedia) mediaNode.src = media.url;
  wrapper.appendChild(mediaNode);
  const name = document.createElement("span");
  name.className = "media-name";
  name.textContent = `${media.name || t("file")} · ${formatSize(media.size)}`;
  wrapper.appendChild(name);
  return wrapper;
}

function pauseAllMedia(except) {
  document.querySelectorAll("audio, video").forEach((media) => {
    if (media !== except && !media.paused) media.pause();
  });
}

document.addEventListener("play", (event) => {
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
    if (!mediaElement.duration) return;
    mediaElement.currentTime = (Number(timeline.value) / 1000) * mediaElement.duration;
  };
  const updateFromPointer = (event) => {
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
  audio.src = media.url;
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
  video.src = media.url;
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
  button.addEventListener("click", () => openAttachmentViewer(media));
  return button;
}

function createCustomVideoPlayer(media) {
  const player = document.createElement("div");
  player.className = "video-player";
  player.dataset.customMedia = "true";

  const video = document.createElement("video");
  video.src = media.url;
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
    if (video.paused) {
      pauseAllMedia(video);
      await video.play();
    } else {
      video.pause();
    }
  });
  video.addEventListener("click", () => play.click());
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
  const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
  const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: blob.type || "audio/webm" });
  state.mediaFile = file;
  els.mediaInput.value = "";
  els.mediaPreview.classList.remove("hidden");
  els.mediaPreview.innerHTML = `
    <span>${escapeHtml(t("recordedAudio"))} · ${formatSize(file.size)}</span>
    <button type="button" aria-label="${escapeHtml(t("removeFile"))}">${escapeHtml(t("removeFile"))}</button>
  `;
  els.mediaPreview.querySelector("button").addEventListener("click", clearAttachment);
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showToast(t("microphoneError"));
    return;
  }
  try {
    pauseAllMedia();
    clearAttachment();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    state.recorder = recorder;
    state.recorderStream = stream;
    state.recorderChunks = [];
    state.recorderStartedAt = Date.now();
    els.recordButton.classList.add("recording");
    els.recordButton.innerHTML = '<ion-icon name="stop"></ion-icon>';
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) state.recorderChunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      const blob = new Blob(state.recorderChunks, { type: recorder.mimeType || "audio/webm" });
      const cancelled = state.recordingCancelled;
      stopRecordingPreview();
      stream.getTracks().forEach((track) => track.stop());
      state.recorder = null;
      state.recorderStream = null;
      state.recorderChunks = [];
      state.recordingCancelled = false;
      els.recordButton.classList.remove("recording");
      els.recordButton.innerHTML = '<ion-icon name="mic"></ion-icon>';
      if (!cancelled && blob.size) finishRecording(blob);
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
  if (!state.recorder) return;
  state.recordingCancelled = cancel;
  sendTyping(false, "upload");
  state.recorder.stop();
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

async function loadMe() {
  const { user, rememberToken } = await api(`/api/me?deviceId=${encodeURIComponent(state.deviceId)}`);
  if (user) {
    storeRememberSession(user, rememberToken);
    setAuthenticated(user);
    await loadUsers();
    return;
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
  } catch {
    setAuthenticated(null);
    setNotice(els.authNotice, t("noSavedSession"), true);
  }
}

async function loadUsers() {
  const { users } = await api("/api/users");
  setUsers(users);
}

async function loadMessages() {
  const recipientId = currentRecipientId();
  const path = recipientId ? `/api/messages?with=${encodeURIComponent(recipientId)}` : "/api/messages";
  const { messages } = await api(path);
  els.messages.textContent = "";
  state.messages.clear();
  messages.forEach((message) => state.messages.set(message.id, message));
  rerenderMessages({ forceBottom: true });
  markActiveChatRead();
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
  state.events = new EventSource("/api/events");
  state.events.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!canSeeRealtimeMessage(message)) return;
    const mine = message.userId === state.user?.id;
    const conversationId = messageConversationId(message);
    if (messageBelongsToActiveChat(message)) {
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
  state.events.addEventListener("user", (event) => {
    addOrUpdateUser(JSON.parse(event.data));
  });
  state.events.addEventListener("userUpdate", (event) => {
    addOrUpdateUser(JSON.parse(event.data));
  });
  state.events.addEventListener("typing", (event) => {
    handleTyping(JSON.parse(event.data));
  });
  state.events.onerror = () => {
    if (!els.chatPage.classList.contains("hidden")) els.statusLine.textContent = t("reconnecting");
  };
  state.events.addEventListener("ready", () => updateChatHeader());
}

async function submitText(text) {
  sendTyping(false, "typing");
  const { message } = await api("/api/messages", {
    method: "POST",
    body: JSON.stringify({ text, recipientId: currentRecipientId() })
  });
  addMessage(message);
  playTone("send");
}

async function submitMedia(caption) {
  sendTyping(true, "upload");
  const formData = new FormData();
  formData.append("media", state.mediaFile);
  formData.append("caption", caption);
  formData.append("recipientId", currentRecipientId());
  try {
    const { message } = await api("/api/upload", {
      method: "POST",
      body: formData
    });
    addMessage(message);
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
  await api("/api/logout", { method: "POST", body: JSON.stringify({}) });
  clearRememberSession();
  setAuthenticated(null);
  showToast(t("loggedOut"));
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

els.refreshButton.addEventListener("click", async () => {
  await loadUsers();
  showToast(t("accountsUpdated"));
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value;
  renderUsers();
});

els.generalChatButton.addEventListener("click", () => openChat("general"));
els.backToAccounts.addEventListener("click", () => showPage("accounts"));
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
  if (els.languagePanel.classList.contains("hidden")) showFloatingElement(els.languagePanel);
  else hideFloatingElement(els.languagePanel);
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
  closeViewerModal();
}

els.messageOverlay.addEventListener("pointerdown", closeOverlayPanels);
els.messageOverlay.addEventListener("click", closeOverlayPanels);

els.forwardMessageButton.addEventListener("click", openShareModal);

els.deleteMessageButton.addEventListener("click", async () => {
  if (!state.selectedMessage) return;
  const messageId = state.selectedMessage.id;
  try {
    await api(`/api/messages/${encodeURIComponent(messageId)}/delete`, { method: "POST", body: JSON.stringify({}) });
    removeMessage(messageId);
    closeMessageContextMenu();
    showToast(t("messageDeleted"));
  } catch (error) {
    showToast(error.message);
  }
});

els.editMessageButton.addEventListener("click", openEditModal);
els.closeShareModal.addEventListener("click", closeShareModal);
els.closeEditModal.addEventListener("click", closeEditModal);
els.closeViewerModal.addEventListener("click", closeViewerModal);

els.shareSelectedButton.addEventListener("click", async () => {
  if (!state.selectedMessage || state.selectedShareUsers.size === 0) return;
  try {
    await api(`/api/messages/${encodeURIComponent(state.selectedMessage.id)}/forward`, {
      method: "POST",
      body: JSON.stringify({ recipientIds: Array.from(state.selectedShareUsers) })
    });
    closeShareModal();
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
  state.mediaFile = els.mediaInput.files[0] || null;
  if (!state.mediaFile) {
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
    return;
  }
  sendTyping(true, "upload");
  setTimeout(() => sendTyping(false, "upload"), 1600);
  els.mediaPreview.innerHTML = `
    <span>${escapeHtml(state.mediaFile.name)} · ${formatSize(state.mediaFile.size)}</span>
    <button type="button" aria-label="${escapeHtml(t("removeFile"))}">${escapeHtml(t("removeFile"))}</button>
  `;
  els.mediaPreview.querySelector("button").addEventListener("click", () => {
    state.mediaFile = null;
    els.mediaInput.value = "";
    els.mediaPreview.classList.add("hidden");
    els.mediaPreview.textContent = "";
  });
  els.mediaPreview.classList.remove("hidden");
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
  const text = els.messageInput.value.trim();
  if (!text && !state.mediaFile) return;
  els.composer.querySelector(".send-button").disabled = true;
  try {
    if (state.mediaFile) await submitMedia(text);
    else await submitText(text);
    els.messageInput.value = "";
    els.messageInput.style.height = "auto";
    clearAttachment();
  } catch (error) {
    showToast(error.message);
  } finally {
    els.composer.querySelector(".send-button").disabled = false;
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

loadMe().catch(() => setAuthenticated(null));
