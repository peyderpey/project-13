import { Language } from './index';

export interface Translations {
  // App metadata
  app: {
    title: string;
    subtitle: string;
    tagline: string;
  };
  
  // Navigation and common actions
  common: {
    back: string;
    next: string;
    previous: string;
    start: string;
    stop: string;
    pause: string;
    continue: string;
    retry: string;
    save: string;
    cancel: string;
    close: string;
    settings: string;
    loading: string;
    error: string;
    success: string;
    completed: string;
    or: string;
    warning: string;
    info: string;
    confirm: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    sort: string;
    refresh: string;
    forward: string;
    home: string;
    menu: string;
    help: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    system: string;
    auto: string;
    manual: string;
    automatic: string;
    manual_advance: string;
    auto_advance: string;
  };
  
  // Authentication
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    confirmPassword: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    forgotPassword: string;
    resetPassword: string;
    sendResetEmail: string;
    backToSignIn: string;
    noAccount: string;
    hasAccount: string;
    signupSuccess: string;
    resetEmailSent: string;
    errors: {
      passwordMismatch: string;
    };
  };

  // Script Library
  library: {
    title: string;
    subtitle: string;
    demoScripts: string;
    myScripts: string;
    characters: string;
    lines: string;
    startRehearsing: string;
    signInRequired: string;
    signInDescription: string;
    loading: string;
    noScripts: string;
    uploadFirst: string;
    deleteScript: string;
    confirmDelete: string;
    continueRehearsing: string;
    progress: string;
    quality: string;
    continue: string;
  };
  
  // Script upload
  upload: {
    title: string;
    subtitle: string;
    dropZone: string;
    browseFiles: string;
    processing: string;
    supportedFormats: string;
    saveToLibrary: string;
    saveToLibraryDescription: string;
    formatTips: {
      title: string;
      tip1: string;
      tip2: string;
      tip3: string;
      tip4: string;
      tip5: string;
    };
    errors: {
      title: string;
      noCharacters: string;
      invalidFormat: string;
      fileTooBig: string;
    };
  };
  
  // Character selection
  characterSelection: {
    title: string;
    subtitle: string;
    linesCount: string;
    startRehearsing: string;
  };
  
  // Practice session
  practice: {
    title: string;
    subtitle: string;
    backToCharacters: string;
    linesCompleted: string;
    autoAdvance: string;
    lineView: {
      label: string;
      full: string;
      partial: string;
      hidden: string;
    };
    recording: {
      recording: string;
      readyToSpeak: string;
      speaking: string;
      starting: string;
      playLine: string;
    };
    accuracy: {
      label: string;
      greatJob: string;
      tryAgain: string;
    };
    transcript: {
      label: string;
    };
    completion: {
      title: string;
      subtitle: string;
      finalScore: string;
      newSession: string;
    };
    status: {
      lineSpeaking: string;
      startingTTS: string;
      showingResult: string;
      autoAdvanceActive: string;
      manualAdvance: string;
    };
    yourLine: string;
    you: string;
  };
  
  // Settings
  settings: {
    title: string;
    timeout: {
      title: string;
      description: string;
      label: string;
      fast: string;
      medium: string;
      slow: string;
    };
    language: {
      title: string;
      description: string;
    };
    accuracy: {
      title: string;
      description: string;
      exact: {
        label: string;
        description: string;
      };
      semantic: {
        label: string;
        description: string;
      };
      loose: {
        label: string;
        description: string;
      };
    };
    voice: {
      title: string;
      description: string;
      voiceLabel: string;
      available: string;
      noVoice: string;
      speed: string;
      volume: string;
      testVoice: string;
    };
    saveSettings: string;
  };
  
  // Script parsing terms
  script: {
    character: string;
    scene: string;
    line: string;
    dialogue: string;
    stage: string;
    act: string;
  };
  
  // Speech recognition
  speech: {
    notSupported: string;
    permissionDenied: string;
    noMicrophone: string;
    networkError: string;
  };
  
  // Time units
  time: {
    seconds: string;
    minutes: string;
    hours: string;
  };

  // Drawer menu
  drawer: {
    title: string;
    description: string;
  };


}

const translations: Record<Language, Translations> = {
  en: {
    app: {
      title: 'Rehearsify',
      subtitle: 'Professional Script Rehearsal',
      tagline: 'Own The Role'
    },
    common: {
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      start: 'Start',
      stop: 'Stop',
      pause: 'Pause',
      continue: 'Continue',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      settings: 'Settings',
      loading: 'Loading',
      error: 'Error',
      success: 'Success',
      completed: 'Completed',
      or: 'or'
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      confirmPasswordPlaceholder: 'Confirm your password',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      sendResetEmail: 'Send Reset Email',
      backToSignIn: 'Back to Sign In',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signupSuccess: 'Account created! Please check your email to verify your account.',
      resetEmailSent: 'Password reset email sent! Check your inbox.',
      errors: {
        passwordMismatch: 'Passwords do not match'
      }
    },
    library: {
      title: 'Script Library',
      subtitle: 'Choose from demo scripts or your saved scripts to start rehearsing',
      demoScripts: 'Demo Scripts',
      myScripts: 'My Scripts',
      characters: 'characters',
      lines: 'lines',
      startRehearsing: 'Start Rehearsing',
      signInRequired: 'Sign in to save scripts',
      signInDescription: 'Create an account to save your uploaded scripts and track your rehearsal progress.',
      loading: 'Loading your scripts...',
      noScripts: 'No scripts yet',
      uploadFirst: 'Upload your first script to get started with personalized rehearsals.',
      deleteScript: 'Delete script',
      confirmDelete: 'Are you sure you want to delete this script? This action cannot be undone.',
      continueRehearsing: "Continue Rehearsing",
      progress: "Progress",
      quality: "Quality",
      continue: "Continue",
    },
    upload: {
      title: 'Upload Your Script',
      subtitle: 'Upload a script file to begin rehearsing. We support TXT, DOCX, PDF, and RTF files with automatic text extraction and intelligent script classification.',
      dropZone: 'Drop your script here',
      browseFiles: 'browse files',
      processing: 'Processing script...',
      supportedFormats: 'TXT, DOCX, PDF, RTF files',
      saveToLibrary: 'Save to my library',
      saveToLibraryDescription: 'Save this script to your personal library for future rehearsals',
      formatTips: {
        title: 'Script Format Tips',
        tip1: 'Character names should be in ALL CAPS or followed by a colon',
        tip2: 'Example: "HAMLET: To be or not to be, that is the question."',
        tip3: 'Or: "HAMLET" on one line, dialogue on the next',
        tip4: 'Clear formatting helps us identify characters and lines accurately',
        tip5: 'International characters are supported'
      },
      errors: {
        title: 'Upload Error',
        noCharacters: 'No characters found in the script. Please ensure your script format includes character names.',
        invalidFormat: 'Please upload a supported file format (TXT, DOCX, PDF, RTF)',
        fileTooBig: 'File is too large. Please upload a file smaller than 10MB.'
      }
    },
    characterSelection: {
      title: 'Select Your Character',
      subtitle: 'Choose the character you\'d like to rehearse from',
      linesCount: 'lines to rehearse',
      startRehearsing: 'Start Rehearsing'
    },
    practice: {
      title: 'Practice Session',
      subtitle: 'Rehearsing as',
      backToCharacters: 'Back to Characters',
      linesCompleted: 'lines completed',
      autoAdvance: 'Auto Advance',
      lineView: {
        label: 'Line View',
        full: 'Full',
        partial: 'Partial',
        hidden: 'Hidden'
      },
      recording: {
        recording: 'Recording...',
        readyToSpeak: 'Ready to speak',
        speaking: 'Speaking...',
        starting: 'Starting...',
        playLine: 'Play'
      },
      accuracy: {
        label: 'Accuracy',
        greatJob: 'Great job!',
        tryAgain: 'Try again for better accuracy'
      },
      transcript: {
        label: 'What you said'
      },
      completion: {
        title: 'Rehearsal Complete!',
        subtitle: 'You\'ve completed all lines for',
        finalScore: 'Final Score',
        newSession: 'Start New Session'
      },
      status: {
        lineSpeaking: 'Line being spoken...',
        startingTTS: 'Starting TTS...',
        showingResult: 'Showing result...',
        autoAdvanceActive: 'Auto advance active',
        manualAdvance: 'Manual advance - press Next button'
      },
      yourLine: 'Your line (hidden)',
      you: 'YOU'
    },
    settings: {
      title: 'Settings',
      timeout: {
        title: 'Auto-Record Timeout',
        description: 'Set how long to wait before showing your line',
        label: 'Timeout',
        fast: 'Fast',
        medium: 'Medium',
        slow: 'Slow'
      },
      language: {
        title: 'Language',
        description: 'Select language for speech recognition and synthesis'
      },
      accuracy: {
        title: 'Accuracy Level',
        description: 'Choose how strictly your spoken lines are evaluated',
        exact: {
          label: 'Exact Match',
          description: 'Every word must match perfectly'
        },
        semantic: {
          label: 'Semantic Match',
          description: 'Meaning and key words must match'
        },
        loose: {
          label: 'Loose Match',
          description: 'General similarity is acceptable'
        }
      },
      voice: {
        title: 'Voice Settings',
        description: 'Customize how other characters\' lines are spoken',
        voiceLabel: 'Voice',
        available: 'available',
        noVoice: 'No voice found for selected language',
        speed: 'Speed',
        volume: 'Volume',
        testVoice: 'Test Voice'
      },
      saveSettings: 'Save Settings'
    },
    script: {
      character: 'Character',
      scene: 'Scene',
      line: 'Line',
      dialogue: 'Dialogue',
      stage: 'Stage Direction',
      act: 'Act'
    },
    speech: {
      notSupported: 'Speech recognition not supported',
      permissionDenied: 'Microphone permission denied',
      noMicrophone: 'No microphone found',
      networkError: 'Network error during speech recognition'
    },
    time: {
      seconds: 'seconds',
      minutes: 'minutes',
      hours: 'hours'
    },
,

    // Drawer menu
    drawer: {
      title: 'Menu & Settings',
      description: 'Choose an action or adjust your settings.'
    }
  },
  
  tr: {
    app: {
      title: 'Rehearsify',
      subtitle: 'Profesyonel Senaryo Provası',
      tagline: 'Own The Role'
    },
    common: {
      back: 'Geri',
      next: 'Sonraki',
      previous: 'Önceki',
      start: 'Başlat',
      stop: 'Durdur',
      pause: 'Duraklat',
      continue: 'Devam Et',
      retry: 'Tekrar Dene',
      save: 'Kaydet',
      cancel: 'İptal',
      close: 'Kapat',
      settings: 'Ayarlar',
      loading: 'Yükleniyor',
      error: 'Hata',
      success: 'Başarılı',
      completed: 'Tamamlandı',
      or: 'veya'
    },
    auth: {
      signIn: 'Giriş Yap',
      signUp: 'Kayıt Ol',
      signOut: 'Çıkış Yap',
      email: 'E-posta',
      password: 'Şifre',
      confirmPassword: 'Şifreyi Onayla',
      emailPlaceholder: 'E-posta adresinizi girin',
      passwordPlaceholder: 'Şifrenizi girin',
      confirmPasswordPlaceholder: 'Şifrenizi onaylayın',
      forgotPassword: 'Şifremi unuttum?',
      resetPassword: 'Şifre Sıfırla',
      sendResetEmail: 'Sıfırlama E-postası Gönder',
      backToSignIn: 'Giriş sayfasına dön',
      noAccount: 'Hesabınız yok mu?',
      hasAccount: 'Zaten hesabınız var mı?',
      signupSuccess: 'Hesap oluşturuldu! Hesabınızı doğrulamak için e-postanızı kontrol edin.',
      resetEmailSent: 'Şifre sıfırlama e-postası gönderildi! Gelen kutunuzu kontrol edin.',
      errors: {
        passwordMismatch: 'Şifreler eşleşmiyor'
      }
    },
    library: {
      title: 'Senaryo Kütüphanesi',
      subtitle: 'Prova yapmaya başlamak için demo senaryolardan veya kayıtlı senaryolarınızdan birini seçin',
      demoScripts: 'Demo Senaryolar',
      myScripts: 'Senaryolarım',
      characters: 'karakter',
      lines: 'replik',
      startRehearsing: 'Provaya Başla',
      signInRequired: 'Senaryoları kaydetmek için giriş yapın',
      signInDescription: 'Yüklediğiniz senaryoları kaydetmek ve prova ilerlemenizi takip etmek için hesap oluşturun.',
      loading: 'Senaryolarınız yükleniyor...',
      noScripts: 'Henüz senaryo yok',
      uploadFirst: 'Kişiselleştirilmiş provalara başlamak için ilk senaryonuzu yükleyin.',
      deleteScript: 'Senaryoyu sil',
      confirmDelete: 'Bu senaryoyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      continueRehearsing: "Provaya Devam Et",
      progress: "İlerleme",
      quality: "Kalite",
      continue: "Devam Et",
    },
    upload: {
      title: 'Senaryonuzu Yükleyin',
      subtitle: 'Prova yapmaya başlamak için bir senaryo dosyası yükleyin. TXT, DOCX, PDF ve RTF dosyalarını otomatik metin çıkarma ve akıllı senaryo sınıflandırması ile destekliyoruz.',
      dropZone: 'Senaryonuzu buraya bırakın',
      browseFiles: 'dosyalara göz atın',
      processing: 'Senaryo işleniyor...',
      supportedFormats: 'TXT, DOCX, PDF, RTF dosyaları',
      saveToLibrary: 'Kütüphaneme kaydet',
      saveToLibraryDescription: 'Bu senaryoyu gelecekteki provalar için kişisel kütüphanenize kaydedin',
      formatTips: {
        title: 'Senaryo Format İpuçları',
        tip1: 'Karakter isimleri BÜYÜK HARFLERLE veya iki nokta üst üste ile yazılmalı',
        tip2: 'Örnek: "HAMLET: Olmak ya da olmamak, işte bütün mesele bu."',
        tip3: 'Veya: "HAMLET" bir satırda, diyalog bir sonraki satırda',
        tip4: 'Açık formatlama karakterleri ve satırları doğru tanımamıza yardımcı olur',
        tip5: 'Türkçe karakterler desteklenir'
      },
      errors: {
        title: 'Yükleme Hatası',
        noCharacters: 'Senaryoda karakter bulunamadı. Senaryo formatınızın karakter isimlerini içerdiğinden emin olun.',
        invalidFormat: 'Lütfen desteklenen bir dosya formatı yükleyin (TXT, DOCX, PDF, RTF)',
        fileTooBig: 'Dosya çok büyük. Lütfen 10MB\'dan küçük bir dosya yükleyin.'
      }
    },
    characterSelection: {
      title: 'Karakterinizi Seçin',
      subtitle: 'Prova yapmak istediğiniz karakteri seçin',
      linesCount: 'replik var',
      startRehearsing: 'Provaya Başla'
    },
    practice: {
      title: 'Prova Oturumu',
      subtitle: 'olarak prova yapıyorsunuz',
      backToCharacters: 'Karakterlere Dön',
      linesCompleted: 'replik tamamlandı',
      autoAdvance: 'Otomatik İlerleme',
      lineView: {
        label: 'Replik Görünümü',
        full: 'Tam',
        partial: 'Kısmi',
        hidden: 'Gizli'
      },
      recording: {
        recording: 'Kayıt yapılıyor...',
        readyToSpeak: 'Konuşmaya hazır',
        speaking: 'Okunuyor...',
        starting: 'Başlatılıyor...',
        playLine: 'Seslendir'
      },
      accuracy: {
        label: 'Doğruluk',
        greatJob: 'Harika iş!',
        tryAgain: 'Daha iyi doğruluk için tekrar deneyin'
      },
      transcript: {
        label: 'Söyledikleriniz'
      },
      completion: {
        title: 'Prova Tamamlandı!',
        subtitle: 'karakteri için tüm replikleri tamamladınız',
        finalScore: 'Final Skoru',
        newSession: 'Yeni Oturum Başlat'
      },
      status: {
        lineSpeaking: 'Replik okunuyor...',
        startingTTS: 'TTS başlatılıyor...',
        showingResult: 'Sonuç gösteriliyor...',
        autoAdvanceActive: 'Otomatik ilerleme aktif',
        manualAdvance: 'Manuel ilerleme - Sonraki butonuna basın'
      },
      yourLine: 'Repliğiniz (gizli)',
      you: 'SİZ'
    },
    settings: {
      title: 'Ayarlar',
      timeout: {
        title: 'Otomatik Kayıt Zaman Aşımı',
        description: 'Repliğiniz gösterilmeden önce ne kadar beklenileceğini ayarlayın',
        label: 'Zaman Aşımı',
        fast: 'Hızlı',
        medium: 'Orta',
        slow: 'Yavaş'
      },
      language: {
        title: 'Dil',
        description: 'Konuşma tanıma ve ses sentezi için dil seçin'
      },
      accuracy: {
        title: 'Doğruluk Seviyesi',
        description: 'Konuşulan repliklerinizin ne kadar sıkı değerlendirileceğini seçin',
        exact: {
          label: 'Tam Eşleşme',
          description: 'Her kelime mükemmel eşleşmeli'
        },
        semantic: {
          label: 'Anlamsal Eşleşme',
          description: 'Anlam ve anahtar kelimeler eşleşmeli'
        },
        loose: {
          label: 'Gevşek Eşleşme',
          description: 'Genel benzerlik kabul edilebilir'
        }
      },
      voice: {
        title: 'Ses Ayarları',
        description: 'Diğer karakterlerin repliklerinin nasıl okunacağını özelleştirin',
        voiceLabel: 'Ses',
        available: 'mevcut',
        noVoice: 'Seçili dil için ses bulunamadı',
        speed: 'Hız',
        volume: 'Ses Seviyesi',
        testVoice: 'Sesi Test Et'
      },
      saveSettings: 'Ayarları Kaydet'
    },
    script: {
      character: 'Karakter',
      scene: 'Sahne',
      line: 'Replik',
      dialogue: 'Diyalog',
      stage: 'Sahne Yönergesi',
      act: 'Perde'
    },
    speech: {
      notSupported: 'Konuşma tanıma desteklenmiyor',
      permissionDenied: 'Mikrofon izni reddedildi',
      noMicrophone: 'Mikrofon bulunamadı',
      networkError: 'Konuşma tanıma sırasında ağ hatası'
    },
    time: {
      seconds: 'saniye',
      minutes: 'dakika',
      hours: 'saat'
    },
    common: {
      settings: 'Ayarlar',
      previous: 'Önceki',
      next: 'Sonraki',
      start: 'Başlat',
      pause: 'Duraklat',
      stop: 'Durdur',
      close: 'Kapat',
      save: 'Kaydet',
      cancel: 'İptal',
      loading: 'Yükleniyor...',
      error: 'Hata',
      success: 'Başarılı',
      warning: 'Uyarı',
      info: 'Bilgi',
      confirm: 'Onayla',
      delete: 'Sil',
      edit: 'Düzenle',
      add: 'Ekle',
      search: 'Ara',
      filter: 'Filtrele',
      sort: 'Sırala',
      refresh: 'Yenile',
      back: 'Geri',
      forward: 'İleri',
      home: 'Ana Sayfa',
      menu: 'Menü',
      help: 'Yardım',
      about: 'Hakkımızda',
      contact: 'İletişim',
      privacy: 'Gizlilik',
      terms: 'Kullanım Koşulları',
      language: 'Dil',
      theme: 'Tema',
      light: 'Aydınlık',
      dark: 'Koyu',
      system: 'Sistem',
      auto: 'Otomatik',
      manual: 'Manuel',
      automatic: 'Otomatik',
      manual_advance: 'Manuel İlerleme',
      auto_advance: 'Otomatik İlerleme'
    },

    // Drawer menu
    drawer: {
      title: 'Menü & Ayarlar',
      description: 'Bir işlem seçin veya ayarlarınızı ayarlayın.'
    }
  },
  
  de: {
    app: {
      title: 'Rehearsify',
      subtitle: 'Professionelle Skript-Probe',
      tagline: 'Own The Role'
    },
    common: {
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Vorherige',
      start: 'Start',
      stop: 'Stopp',
      pause: 'Pause',
      continue: 'Fortfahren',
      retry: 'Wiederholen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      close: 'Schließen',
      settings: 'Einstellungen',
      loading: 'Laden',
      error: 'Fehler',
      success: 'Erfolg',
      completed: 'Abgeschlossen',
      or: 'oder'
    },
    auth: {
      signIn: 'Anmelden',
      signUp: 'Registrieren',
      signOut: 'Abmelden',
      email: 'E-Mail',
      password: 'Passwort',
      confirmPassword: 'Passwort bestätigen',
      emailPlaceholder: 'E-Mail eingeben',
      passwordPlaceholder: 'Passwort eingeben',
      confirmPasswordPlaceholder: 'Passwort bestätigen',
      forgotPassword: 'Passwort vergessen?',
      resetPassword: 'Passwort zurücksetzen',
      sendResetEmail: 'Reset-E-Mail senden',
      backToSignIn: 'Zurück zur Anmeldung',
      noAccount: 'Noch kein Konto?',
      hasAccount: 'Bereits ein Konto?',
      signupSuccess: 'Konto erstellt! Bitte überprüfen Sie Ihre E-Mail zur Verifizierung.',
      resetEmailSent: 'Passwort-Reset-E-Mail gesendet! Überprüfen Sie Ihren Posteingang.',
      errors: {
        passwordMismatch: 'Passwörter stimmen nicht überein'
      }
    },
    library: {
      title: 'Skript-Bibliothek',
      subtitle: 'Wählen Sie aus Demo-Skripten oder Ihren gespeicherten Skripten zum Proben',
      demoScripts: 'Demo-Skripte',
      myScripts: 'Meine Skripte',
      characters: 'Charaktere',
      lines: 'Zeilen',
      startRehearsing: 'Probe beginnen',
      signInRequired: 'Anmelden zum Speichern von Skripten',
      signInDescription: 'Erstellen Sie ein Konto, um Ihre hochgeladenen Skripte zu speichern und Ihren Probenfortschritt zu verfolgen.',
      loading: 'Ihre Skripte werden geladen...',
      noScripts: 'Noch keine Skripte',
      uploadFirst: 'Laden Sie Ihr erstes Skript hoch, um mit personalisierten Proben zu beginnen.',
      deleteScript: 'Skript löschen',
      confirmDelete: 'Sind Sie sicher, dass Sie dieses Skript löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
      continueRehearsing: "Probe fortsetzen",
      progress: "Fortschritt",
      quality: "Qualität",
      continue: "Fortfahren",
    },
    upload: {
      title: 'Skript hochladen',
      subtitle: 'Laden Sie eine Skriptdatei hoch, um mit dem Proben zu beginnen. Wir unterstützen TXT-, DOCX-, PDF- und RTF-Dateien mit automatischer Textextraktion und intelligenter Skriptklassifizierung.',
      dropZone: 'Skript hier ablegen',
      browseFiles: 'Dateien durchsuchen',
      processing: 'Skript wird verarbeitet...',
      supportedFormats: 'TXT-, DOCX-, PDF-, RTF-Dateien',
      saveToLibrary: 'In meiner Bibliothek speichern',
      saveToLibraryDescription: 'Speichern Sie dieses Skript in Ihrer persönlichen Bibliothek für zukünftige Proben',
      formatTips: {
        title: 'Skript-Format-Tipps',
        tip1: 'Charakternamen sollten in GROSSBUCHSTABEN oder gefolgt von einem Doppelpunkt stehen',
        tip2: 'Beispiel: "HAMLET: Sein oder nicht sein, das ist hier die Frage."',
        tip3: 'Oder: "HAMLET" in einer Zeile, Dialog in der nächsten',
        tip4: 'Klare Formatierung hilft uns, Charaktere und Zeilen genau zu identifizieren',
        tip5: 'Internationale Zeichen werden unterstützt'
      },
      errors: {
        title: 'Upload-Fehler',
        noCharacters: 'Keine Charaktere im Skript gefunden. Stellen Sie sicher, dass Ihr Skriptformat Charakternamen enthält.',
        invalidFormat: 'Bitte laden Sie ein unterstütztes Dateiformat hoch (TXT, DOCX, PDF, RTF)',
        fileTooBig: 'Datei ist zu groß. Bitte laden Sie eine Datei kleiner als 10MB hoch.'
      }
    },
    characterSelection: {
      title: 'Charakter auswählen',
      subtitle: 'Wählen Sie den Charakter aus, den Sie proben möchten',
      linesCount: 'Zeilen zu proben',
      startRehearsing: 'Probe beginnen'
    },
    practice: {
      title: 'Probe-Sitzung',
      subtitle: 'Proben als',
      backToCharacters: 'Zurück zu Charakteren',
      linesCompleted: 'Zeilen abgeschlossen',
      autoAdvance: 'Auto-Fortschritt',
      lineView: {
        label: 'Zeilen-Ansicht',
        full: 'Vollständig',
        partial: 'Teilweise',
        hidden: 'Versteckt'
      },
      recording: {
        recording: 'Aufnahme...',
        readyToSpeak: 'Bereit zu sprechen',
        speaking: 'Sprechen...',
        starting: 'Starten...',
        playLine: 'Abspielen'
      },
      accuracy: {
        label: 'Genauigkeit',
        greatJob: 'Großartige Arbeit!',
        tryAgain: 'Versuchen Sie es erneut für bessere Genauigkeit'
      },
      transcript: {
        label: 'Was Sie gesagt haben'
      },
      completion: {
        title: 'Probe abgeschlossen!',
        subtitle: 'Sie haben alle Zeilen für abgeschlossen',
        finalScore: 'Endpunktzahl',
        newSession: 'Neue Sitzung starten'
      },
      status: {
        lineSpeaking: 'Zeile wird gesprochen...',
        startingTTS: 'TTS wird gestartet...',
        showingResult: 'Ergebnis wird angezeigt...',
        autoAdvanceActive: 'Auto-Fortschritt aktiv',
        manualAdvance: 'Manueller Fortschritt - Weiter-Taste drücken'
      },
      yourLine: 'Ihre Zeile (versteckt)',
      you: 'SIE'
    },
    settings: {
      title: 'Einstellungen',
      timeout: {
        title: 'Auto-Aufnahme-Timeout',
        description: 'Stellen Sie ein, wie lange gewartet wird, bevor Ihre Zeile angezeigt wird',
        label: 'Timeout',
        fast: 'Schnell',
        medium: 'Mittel',
        slow: 'Langsam'
      },
      language: {
        title: 'Sprache',
        description: 'Sprache für Spracherkennung und Synthese auswählen'
      },
      accuracy: {
        title: 'Genauigkeitsstufe',
        description: 'Wählen Sie, wie streng Ihre gesprochenen Zeilen bewertet werden',
        exact: {
          label: 'Exakte Übereinstimmung',
          description: 'Jedes Wort muss perfekt übereinstimmen'
        },
        semantic: {
          label: 'Semantische Übereinstimmung',
          description: 'Bedeutung und Schlüsselwörter müssen übereinstimmen'
        },
        loose: {
          label: 'Lockere Übereinstimmung',
          description: 'Allgemeine Ähnlichkeit ist akzeptabel'
        }
      },
      voice: {
        title: 'Spracheinstellungen',
        description: 'Anpassen, wie die Zeilen anderer Charaktere gesprochen werden',
        voiceLabel: 'Stimme',
        available: 'verfügbar',
        noVoice: 'Keine Stimme für ausgewählte Sprache gefunden',
        speed: 'Geschwindigkeit',
        volume: 'Lautstärke',
        testVoice: 'Stimme testen'
      },
      saveSettings: 'Einstellungen speichern'
    },
    script: {
      character: 'Charakter',
      scene: 'Szene',
      line: 'Zeile',
      dialogue: 'Dialog',
      stage: 'Bühnenanweisung',
      act: 'Akt'
    },
    speech: {
      notSupported: 'Spracherkennung nicht unterstützt',
      permissionDenied: 'Mikrofon-Berechtigung verweigert',
      noMicrophone: 'Kein Mikrofon gefunden',
      networkError: 'Netzwerkfehler bei der Spracherkennung'
    },
    time: {
      seconds: 'Sekunden',
      minutes: 'Minuten',
      hours: 'Stunden'
    },
    common: {
      settings: 'Einstellungen',
      previous: 'Vorherige',
      next: 'Weiter',
      start: 'Start',
      pause: 'Pause',
      stop: 'Stopp',
      close: 'Schließen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      warning: 'Warnung',
      info: 'Information',
      confirm: 'Bestätigen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      add: 'Hinzufügen',
      search: 'Suchen',
      filter: 'Filtern',
      sort: 'Sortieren',
      refresh: 'Aktualisieren',
      back: 'Zurück',
      forward: 'Vorwärts',
      home: 'Startseite',
      menu: 'Menü',
      help: 'Hilfe',
      about: 'Über',
      contact: 'Kontakt',
      privacy: 'Datenschutz',
      terms: 'Nutzungsbedingungen',
      language: 'Sprache',
      theme: 'Thema',
      light: 'Hell',
      dark: 'Dunkel',
      system: 'System',
      auto: 'Automatisch',
      manual: 'Manuelle',
      automatic: 'Automatisch',
      manual_advance: 'Manuelle Fortsetzung',
      auto_advance: 'Automatische Fortsetzung'
    },

    // Drawer menu
    drawer: {
      title: 'Menü & Einstellungen',
      description: 'Wählen Sie eine Aktion aus oder passen Sie Ihre Einstellungen an.'
    }
  },
  
  fr: {
    app: {
      title: 'Rehearsify',
      subtitle: 'Répétition de Script Professionnelle',
      tagline: 'Own The Role'
    },
    common: {
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      start: 'Commencer',
      stop: 'Arrêter',
      pause: 'Pause',
      continue: 'Continuer',
      retry: 'Réessayer',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      close: 'Fermer',
      settings: 'Paramètres',
      loading: 'Chargement',
      error: 'Erreur',
      success: 'Succès',
      completed: 'Terminé',
      or: 'ou'
    },
    auth: {
      signIn: 'Se connecter',
      signUp: 'S\'inscrire',
      signOut: 'Se déconnecter',
      email: 'E-mail',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      emailPlaceholder: 'Entrez votre e-mail',
      passwordPlaceholder: 'Entrez votre mot de passe',
      confirmPasswordPlaceholder: 'Confirmez votre mot de passe',
      forgotPassword: 'Mot de passe oublié?',
      resetPassword: 'Réinitialiser le mot de passe',
      sendResetEmail: 'Envoyer l\'e-mail de réinitialisation',
      backToSignIn: 'Retour à la connexion',
      noAccount: 'Pas de compte?',
      hasAccount: 'Déjà un compte?',
      signupSuccess: 'Compte créé! Veuillez vérifier votre e-mail pour confirmer votre compte.',
      resetEmailSent: 'E-mail de réinitialisation envoyé! Vérifiez votre boîte de réception.',
      errors: {
        passwordMismatch: 'Les mots de passe ne correspondent pas'
      }
    },
    library: {
      title: 'Bibliothèque de Scripts',
      subtitle: 'Choisissez parmi les scripts de démonstration ou vos scripts sauvegardés pour commencer à répéter',
      demoScripts: 'Scripts de Démonstration',
      myScripts: 'Mes Scripts',
      characters: 'personnages',
      lines: 'lignes',
      startRehearsing: 'Commencer la répétition',
      signInRequired: 'Connectez-vous pour sauvegarder les scripts',
      signInDescription: 'Créez un compte pour sauvegarder vos scripts téléchargés et suivre vos progrès de répétition.',
      loading: 'Chargement de vos scripts...',
      noScripts: 'Aucun script encore',
      uploadFirst: 'Téléchargez votre premier script pour commencer avec des répétitions personnalisées.',
      deleteScript: 'Supprimer le script',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce script? Cette action ne peut pas être annulée.',
      continueRehearsing: "Continuer la répétition",
      progress: "Progression",
      quality: "Qualité",
      continue: "Continuer",
    },
    upload: {
      title: 'Télécharger votre script',
      subtitle: 'Téléchargez un fichier de script pour commencer à répéter. Nous supportons les fichiers TXT, DOCX, PDF et RTF avec extraction automatique de texte et classification intelligente de script.',
      dropZone: 'Déposez votre script ici',
      browseFiles: 'parcourir les fichiers',
      processing: 'Traitement du script...',
      supportedFormats: 'Fichiers TXT, DOCX, PDF, RTF',
      saveToLibrary: 'Sauvegarder dans ma bibliothèque',
      saveToLibraryDescription: 'Sauvegardez ce script dans votre bibliothèque personnelle pour de futures répétitions',
      formatTips: {
        title: 'Conseils de format de script',
        tip1: 'Les noms de personnages doivent être en MAJUSCULES ou suivis de deux-points',
        tip2: 'Exemple: "HAMLET: Être ou ne pas être, telle est la question."',
        tip3: 'Ou: "HAMLET" sur une ligne, dialogue sur la suivante',
        tip4: 'Un formatage clair nous aide à identifier précisément les personnages et les lignes',
        tip5: 'Les caractères internationaux sont supportés'
      },
      errors: {
        title: 'Erreur de téléchargement',
        noCharacters: 'Aucun personnage trouvé dans le script. Assurez-vous que votre format de script inclut des noms de personnages.',
        invalidFormat: 'Veuillez télécharger un format de fichier supporté (TXT, DOCX, PDF, RTF)',
        fileTooBig: 'Le fichier est trop volumineux. Veuillez télécharger un fichier de moins de 10MB.'
      }
    },
    characterSelection: {
      title: 'Sélectionnez votre personnage',
      subtitle: 'Choisissez le personnage que vous souhaitez répéter',
      linesCount: 'lignes à répéter',
      startRehearsing: 'Commencer la répétition'
    },
    practice: {
      title: 'Session de répétition',
      subtitle: 'Répétition en tant que',
      backToCharacters: 'Retour aux personnages',
      linesCompleted: 'lignes terminées',
      autoAdvance: 'Avancement automatique',
      lineView: {
        label: 'Vue des lignes',
        full: 'Complète',
        partial: 'Partielle',
        hidden: 'Cachée'
      },
      recording: {
        recording: 'Enregistrement...',
        readyToSpeak: 'Prêt à parler',
        speaking: 'Parole...',
        starting: 'Démarrage...',
        playLine: 'Jouer'
      },
      accuracy: {
        label: 'Précision',
        greatJob: 'Excellent travail!',
        tryAgain: 'Réessayez pour une meilleure précision'
      },
      transcript: {
        label: 'Ce que vous avez dit'
      },
      completion: {
        title: 'Répétition terminée!',
        subtitle: 'Vous avez terminé toutes les lignes pour',
        finalScore: 'Score final',
        newSession: 'Commencer une nouvelle session'
      },
      status: {
        lineSpeaking: 'Ligne en cours de lecture...',
        startingTTS: 'Démarrage TTS...',
        showingResult: 'Affichage du résultat...',
        autoAdvanceActive: 'Avancement automatique actif',
        manualAdvance: 'Avancement manuel - appuyez sur Suivant'
      },
      yourLine: 'Votre ligne (cachée)',
      you: 'VOUS'
    },
    settings: {
      title: 'Paramètres',
      timeout: {
        title: 'Délai d\'enregistrement automatique',
        description: 'Définissez combien de temps attendre avant d\'afficher votre ligne',
        label: 'Délai',
        fast: 'Rapide',
        medium: 'Moyen',
        slow: 'Lent'
      },
      language: {
        title: 'Langue',
        description: 'Sélectionnez la langue pour la reconnaissance vocale et la synthèse'
      },
      accuracy: {
        title: 'Niveau de précision',
        description: 'Choisissez à quel point vos lignes parlées sont évaluées strictement',
        exact: {
          label: 'Correspondance exacte',
          description: 'Chaque mot doit correspondre parfaitement'
        },
        semantic: {
          label: 'Correspondance sémantique',
          description: 'Le sens et les mots-clés doivent correspondre'
        },
        loose: {
          label: 'Correspondance souple',
          description: 'Une similarité générale est acceptable'
        }
      },
      voice: {
        title: 'Paramètres vocaux',
        description: 'Personnalisez comment les lignes des autres personnages sont parlées',
        voiceLabel: 'Voix',
        available: 'disponible',
        noVoice: 'Aucune voix trouvée pour la langue sélectionnée',
        speed: 'Vitesse',
        volume: 'Volume',
        testVoice: 'Tester la voix'
      },
      saveSettings: 'Sauvegarder les paramètres'
    },
    script: {
      character: 'Personnage',
      scene: 'Scène',
      line: 'Ligne',
      dialogue: 'Dialogue',
      stage: 'Indication scénique',
      act: 'Acte'
    },
    speech: {
      notSupported: 'Reconnaissance vocale non supportée',
      permissionDenied: 'Permission du microphone refusée',
      noMicrophone: 'Aucun microphone trouvé',
      networkError: 'Erreur réseau lors de la reconnaissance vocale'
    },
    time: {
      seconds: 'secondes',
      minutes: 'minutes',
      hours: 'heures'
    },
    common: {
      settings: 'Paramètres',
      previous: 'Précédent',
      next: 'Suivant',
      start: 'Commencer',
      pause: 'Duraklat',
      stop: 'Durdur',
      close: 'Fermer',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      warning: 'Avertissement',
      info: 'Information',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      refresh: 'Actualiser',
      back: 'Retour',
      forward: 'Avant',
      home: 'Accueil',
      menu: 'Menu',
      help: 'Aide',
      about: 'À propos',
      contact: 'Contact',
      privacy: 'Confidentialité',
      terms: 'Conditions d\'utilisation',
      language: 'Langue',
      theme: 'Thème',
      light: 'Clair',
      dark: 'Sombre',
      system: 'Système',
      auto: 'Automatique',
      manual: 'Manuel',
      automatic: 'Automatique',
      manual_advance: 'Avancement Manuel',
      auto_advance: 'Avancement Automatique'
    },

    // Drawer menu
    drawer: {
      title: 'Menu & Paramètres',
      description: 'Choisissez une action ou ajustez vos paramètres.'
    }
  },
  
  es: {
    app: {
      title: 'Rehearsify',
      subtitle: 'Ensayo de Guión Profesional',
      tagline: 'Own The Role'
    },
    common: {
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      start: 'Iniciar',
      stop: 'Detener',
      pause: 'Pausar',
      continue: 'Continuar',
      retry: 'Reintentar',
      save: 'Guardar',
      cancel: 'Cancelar',
      close: 'Cerrar',
      settings: 'Configuración',
      loading: 'Cargando',
      error: 'Error',
      success: 'Éxito',
      completed: 'Completado',
      or: 'o'
    },
    auth: {
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      signOut: 'Cerrar Sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      emailPlaceholder: 'Ingresa tu correo electrónico',
      passwordPlaceholder: 'Ingresa tu contraseña',
      confirmPasswordPlaceholder: 'Confirma tu contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer contraseña',
      sendResetEmail: 'Enviar correo de restablecimiento',
      backToSignIn: 'Volver al inicio de sesión',
      noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      signupSuccess: '¡Cuenta creada! Por favor verifica tu correo electrónico para confirmar tu cuenta.',
      resetEmailSent: '¡Correo de restablecimiento enviado! Revisa tu bandeja de entrada.',
      errors: {
        passwordMismatch: 'Las contraseñas no coinciden'
      }
    },
    library: {
      title: 'Biblioteca de Guiones',
      subtitle: 'Elige entre guiones de demostración o tus guiones guardados para comenzar a ensayar',
      demoScripts: 'Guiones de Demostración',
      myScripts: 'Mis Guiones',
      characters: 'personajes',
      lines: 'líneas',
      startRehearsing: 'Comenzar ensayo',
      signInRequired: 'Inicia sesión para guardar guiones',
      signInDescription: 'Crea una cuenta para guardar tus guiones subidos y seguir tu progreso de ensayo.',
      loading: 'Cargando tus guiones...',
      noScripts: 'Aún no hay guiones',
      uploadFirst: 'Sube tu primer guión para comenzar con ensayos personalizados.',
      deleteScript: 'Eliminar guión',
      confirmDelete: '¿Estás seguro de que quieres eliminar este guión? Esta acción no se puede deshacer.',
      continueRehearsing: "Continuar ensayo",
      progress: "Progreso",
      quality: "Calidad",
      continue: "Continuar",
    },
    upload: {
      title: 'Sube tu guión',
      subtitle: 'Sube un archivo de guión para comenzar a ensayar. Soportamos archivos TXT, DOCX, PDF y RTF con extracción automática de texto y clasificación inteligente de guiones.',
      dropZone: 'Suelta tu guión aquí',
      browseFiles: 'explorar archivos',
      processing: 'Procesando guión...',
      supportedFormats: 'Archivos TXT, DOCX, PDF, RTF',
      saveToLibrary: 'Guardar en mi biblioteca',
      saveToLibraryDescription: 'Guarda este guión en tu biblioteca personal para futuros ensayos',
      formatTips: {
        title: 'Consejos de formato de guión',
        tip1: 'Los nombres de personajes deben estar en MAYÚSCULAS o seguidos de dos puntos',
        tip2: 'Ejemplo: "HAMLET: Ser o no ser, esa es la cuestión."',
        tip3: 'O: "HAMLET" en una línea, diálogo en la siguiente',
        tip4: 'Un formato claro nos ayuda a identificar personajes y líneas con precisión',
        tip5: 'Se admiten caracteres internacionales'
      },
      errors: {
        title: 'Error de carga',
        noCharacters: 'No se encontraron personajes en el guión. Asegúrate de que tu formato de guión incluya nombres de personajes.',
        invalidFormat: 'Por favor sube un formato de archivo compatible (TXT, DOCX, PDF, RTF)',
        fileTooBig: 'El archivo es demasiado grande. Por favor sube un archivo menor a 10MB.'
      }
    },
    characterSelection: {
      title: 'Selecciona tu personaje',
      subtitle: 'Elige el personaje que te gustaría ensayar',
      linesCount: 'líneas para ensayar',
      startRehearsing: 'Comenzar ensayo'
    },
    practice: {
      title: 'Sesión de ensayo',
      subtitle: 'Ensayando como',
      backToCharacters: 'Volver a personajes',
      linesCompleted: 'líneas completadas',
      autoAdvance: 'Avance automático',
      lineView: {
        label: 'Vista de líneas',
        full: 'Completa',
        partial: 'Parcial',
        hidden: 'Oculta'
      },
      recording: {
        recording: 'Grabando...',
        readyToSpeak: 'Listo para hablar',
        speaking: 'Hablando...',
        starting: 'Iniciando...',
        playLine: 'Reproducir'
      },
      accuracy: {
        label: 'Precisión',
        greatJob: '¡Excelente trabajo!',
        tryAgain: 'Inténtalo de nuevo para mejor precisión'
      },
      transcript: {
        label: 'Lo que dijiste'
      },
      completion: {
        title: '¡Ensayo completado!',
        subtitle: 'Has completado todas las líneas para',
        finalScore: 'Puntuación final',
        newSession: 'Iniciar nueva sesión'
      },
      status: {
        lineSpeaking: 'Línea siendo hablada...',
        startingTTS: 'Iniciando TTS...',
        showingResult: 'Mostrando resultado...',
        autoAdvanceActive: 'Avance automático activo',
        manualAdvance: 'Avance manual - presiona Siguiente'
      },
      yourLine: 'Tu línea (oculta)',
      you: 'TÚ'
    },
    settings: {
      title: 'Configuración',
      timeout: {
        title: 'Tiempo de espera de grabación automática',
        description: 'Establece cuánto tiempo esperar antes de mostrar tu línea',
        label: 'Tiempo de espera',
        fast: 'Rápido',
        medium: 'Medio',
        slow: 'Lento'
      },
      language: {
        title: 'Idioma',
        description: 'Selecciona el idioma para reconocimiento de voz y síntesis'
      },
      accuracy: {
        title: 'Nivel de precisión',
        description: 'Elige qué tan estrictamente se evalúan tus líneas habladas',
        exact: {
          label: 'Coincidencia exacta',
          description: 'Cada palabra debe coincidir perfectamente'
        },
        semantic: {
          label: 'Coincidencia semántica',
          description: 'El significado y las palabras clave deben coincidir'
        },
        loose: {
          label: 'Coincidencia flexible',
          description: 'La similitud general es aceptable'
        }
      },
      voice: {
        title: 'Configuración de voz',
        description: 'Personaliza cómo se hablan las líneas de otros personajes',
        voiceLabel: 'Voz',
        available: 'disponible',
        noVoice: 'No se encontró voz para el idioma seleccionado',
        speed: 'Velocidad',
        volume: 'Volumen',
        testVoice: 'Probar voz'
      },
      saveSettings: 'Guardar configuración'
    },
    script: {
      character: 'Personaje',
      scene: 'Escena',
      line: 'Línea',
      dialogue: 'Diálogo',
      stage: 'Acotación escénica',
      act: 'Acto'
    },
    speech: {
      notSupported: 'Reconocimiento de voz no soportado',
      permissionDenied: 'Permiso de micrófono denegado',
      noMicrophone: 'No se encontró micrófono',
      networkError: 'Error de red durante el reconocimiento de voz'
    },
    time: {
      seconds: 'segundos',
      minutes: 'minutos',
      hours: 'horas'
    },
    common: {
      settings: 'Configuración',
      previous: 'Anterior',
      next: 'Siguiente',
      start: 'Iniciar',
      pause: 'Pausar',
      stop: 'Detener',
      close: 'Cerrar',
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
      confirm: 'Confirmar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Agregar',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      refresh: 'Actualizar',
      back: 'Atrás',
      forward: 'Adelante',
      home: 'Inicio',
      menu: 'Menú',
      help: 'Ayuda',
      about: 'Acerca de',
      contact: 'Contacto',
      privacy: 'Privacidad',
      terms: 'Términos de uso',
      language: 'Idioma',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
      auto: 'Automático',
      manual: 'Manual',
      automatic: 'Automático',
      manual_advance: 'Avance Manual',
      auto_advance: 'Avance Automático'
    },

    // Drawer menu
    drawer: {
      title: 'Menú & Configuración',
      description: 'Elige una acción o ajusta tus configuraciones.'
    }
  },
  
  it: {
    app: {
      title: 'Rehearsify',
      subtitle: 'Prova di Copione Professionale',
      tagline: 'Own The Role'
    },
    common: {
      back: 'Indietro',
      next: 'Avanti',
      previous: 'Precedente',
      start: 'Inizia',
      stop: 'Ferma',
      pause: 'Pausa',
      continue: 'Continua',
      retry: 'Riprova',
      save: 'Salva',
      cancel: 'Annulla',
      close: 'Chiudi',
      settings: 'Impostazioni',
      loading: 'Caricamento',
      error: 'Errore',
      success: 'Successo',
      completed: 'Completato',
      or: 'o'
    },
    auth: {
      signIn: 'Accedi',
      signUp: 'Registrati',
      signOut: 'Esci',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Conferma password',
      emailPlaceholder: 'Inserisci la tua email',
      passwordPlaceholder: 'Inserisci la tua password',
      confirmPasswordPlaceholder: 'Conferma la tua password',
      forgotPassword: 'Password dimenticata?',
      resetPassword: 'Reimposta password',
      sendResetEmail: 'Invia email di reset',
      backToSignIn: 'Torna al login',
      noAccount: 'Non hai un account?',
      hasAccount: 'Hai già un account?',
      signupSuccess: 'Account creato! Controlla la tua email per verificare il tuo account.',
      resetEmailSent: 'Email di reset inviata! Controlla la tua casella di posta.',
      errors: {
        passwordMismatch: 'Le password non corrispondono'
      }
    },
    library: {
      title: 'Biblioteca Copioni',
      subtitle: 'Scegli tra copioni demo o i tuoi copioni salvati per iniziare a provare',
      demoScripts: 'Copioni Demo',
      myScripts: 'I Miei Copioni',
      characters: 'personaggi',
      lines: 'righe',
      startRehearsing: 'Inizia prova',
      signInRequired: 'Accedi per salvare i copioni',
      signInDescription: 'Crea un account per salvare i tuoi copioni caricati e tracciare i tuoi progressi di prova.',
      loading: 'Caricamento dei tuoi copioni...',
      noScripts: 'Nessun copione ancora',
      uploadFirst: 'Carica il tuo primo copione per iniziare con prove personalizzate.',
      deleteScript: 'Elimina copione',
      confirmDelete: 'Sei sicuro di voler eliminare questo copione? Questa azione non può essere annullata.',
      continueRehearsing: "Prova a continuare",
      progress: "Progresso",
      quality: "Qualità",
      continue: "Continua",
    },
    upload: {
      title: 'Carica il tuo copione',
      subtitle: 'Carica un file di copione per iniziare a provare. Supportiamo file TXT, DOCX, PDF e RTF con estrazione automatica del testo e classificazione intelligente del copione.',
      dropZone: 'Trascina qui il tuo copione',
      browseFiles: 'sfoglia file',
      processing: 'Elaborazione copione...',
      supportedFormats: 'File TXT, DOCX, PDF, RTF',
      saveToLibrary: 'Salva nella mia biblioteca',
      saveToLibraryDescription: 'Salva questo copione nella tua biblioteca personale per future prove',
      formatTips: {
        title: 'Suggerimenti per il formato del copione',
        tip1: 'I nomi dei personaggi dovrebbero essere in MAIUSCOLO o seguiti da due punti',
        tip2: 'Esempio: "AMLETO: Essere o non essere, questo è il problema."',
        tip3: 'Oppure: "AMLETO" su una riga, dialogo sulla successiva',
        tip4: 'Una formattazione chiara ci aiuta a identificare personaggi e righe accuratamente',
        tip5: 'I caratteri internazionali sono supportati'
      },
      errors: {
        title: 'Errore di caricamento',
        noCharacters: 'Nessun personaggio trovato nel copione. Assicurati che il formato del tuo copione includa nomi di personaggi.',
        invalidFormat: 'Per favore carica un formato di file supportato (TXT, DOCX, PDF, RTF)',
        fileTooBig: 'Il file è troppo grande. Per favore carica un file più piccolo di 10MB.'
      }
    },
    characterSelection: {
      title: 'Seleziona il tuo personaggio',
      subtitle: 'Scegli il personaggio che vorresti provare',
      linesCount: 'righe da provare',
      startRehearsing: 'Inizia prova'
    },
    practice: {
      title: 'Sessione di prova',
      subtitle: 'Provando come',
      backToCharacters: 'Torna ai personaggi',
      linesCompleted: 'righe completate',
      autoAdvance: 'Avanzamento automatico',
      lineView: {
        label: 'Vista righe',
        full: 'Completa',
        partial: 'Parziale',
        hidden: 'Nascosta'
      },
      recording: {
        recording: 'Registrazione...',
        readyToSpeak: 'Pronto a parlare',
        speaking: 'Parlando...',
        starting: 'Avvio...',
        playLine: 'Riproduci'
      },
      accuracy: {
        label: 'Precisione',
        greatJob: 'Ottimo lavoro!',
        tryAgain: 'Riprova per una migliore precisione'
      },
      transcript: {
        label: 'Quello che hai detto'
      },
      completion: {
        title: 'Prova completata!',
        subtitle: 'Hai completato tutte le righe per',
        finalScore: 'P unteggio finale',
        newSession: 'Inizia nuova sessione'
      },
      status: {
        lineSpeaking: 'Riga in riproduzione...',
        startingTTS: 'Avvio TTS...',
        showingResult: 'Mostrando risultato...',
        autoAdvanceActive: 'Avanzamento automatico attivo',
        manualAdvance: 'Avanzamento manuale - premi Avanti'
      },
      yourLine: 'La tua riga (nascosta)',
      you: 'TU'
    },
    settings: {
      title: 'Impostazioni',
      timeout: {
        title: 'Timeout registrazione automatica',
        description: 'Imposta quanto tempo aspettare prima di mostrare la tua riga',
        label: 'Timeout',
        fast: 'Veloce',
        medium: 'Medio',
        slow: 'Lento'
      },
      language: {
        title: 'Lingua',
        description: 'Seleziona la lingua per riconoscimento vocale e sintesi'
      },
      accuracy: {
        title: 'Livello di precisione',
        description: 'Scegli quanto rigorosamente vengono valutate le tue righe parlate',
        exact: {
          label: 'Corrispondenza esatta',
          description: 'Ogni parola deve corrispondere perfettamente'
        },
        semantic: {
          label: 'Corrispondenza semantica',
          description: 'Il significato e le parole chiave devono corrispondere'
        },
        loose: {
          label: 'Corrispondenza flessibile',
          description: 'La somiglianza generale è accettabile'
        }
      },
      voice: {
        title: 'Impostazioni vocali',
        description: 'Personalizza come vengono pronunciate le righe degli altri personaggi',
        voiceLabel: 'Voce',
        available: 'disponibile',
        noVoice: 'Nessuna voce trovata per la lingua selezionata',
        speed: 'Velocità',
        volume: 'Volume',
        testVoice: 'Testa voce'
      },
      saveSettings: 'Salva impostazioni'
    },
    script: {
      character: 'Personaggio',
      scene: 'Scena',
      line: 'Riga',
      dialogue: 'Dialogo',
      stage: 'Didascalia',
      act: 'Atto'
    },
    speech: {
      notSupported: 'Riconoscimento vocale non supportato',
      permissionDenied: 'Permesso microfono negato',
      noMicrophone: 'Nessun microfono trovato',
      networkError: 'Errore di rete durante il riconoscimento vocale'
    },
    time: {
      seconds: 'secondi',
      minutes: 'minuti',
      hours: 'ore'
    },
    common: {
      settings: 'Impostazioni',
      previous: 'Precedente',
      next: 'Avanti',
      start: 'Inizia',
      pause: 'Pausa',
      stop: 'Ferma',
      close: 'Chiudi',
      save: 'Salva',
      cancel: 'Annulla',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
      warning: 'Avertimento',
      info: 'Informazione',
      confirm: 'Conferma',
      delete: 'Elimina',
      edit: 'Modifica',
      add: 'Aggiungi',
      search: 'Cerca',
      filter: 'Filtra',
      sort: 'Ordina',
      refresh: 'Aggiorna',
      back: 'Indietro',
      forward: 'Avanti',
      home: 'Home',
      menu: 'Menu',
      help: 'Aiuto',
      about: 'Informazioni',
      contact: 'Contatto',
      privacy: 'Privacy',
      terms: 'Termini',
      language: 'Lingua',
      theme: 'Tema',
      light: 'Chiaro',
      dark: 'Scuro',
      system: 'Sistema',
      auto: 'Automatico',
      manual: 'Manuale',
      automatic: 'Automatico',
      manual_advance: 'Avance Manuale',
      auto_advance: 'Avance Automatico'
    },

    // Drawer menu
    drawer: {
      title: 'Menu & Impostazioni',
      description: 'Scegli un\'azione o regola le tue impostazioni.'
    }
  }
};

export default translations;