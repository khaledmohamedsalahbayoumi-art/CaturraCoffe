// Notification Engine for Caturra Specialty Coffee
// Supports: Web Audio Chime, Browser Web Push, Mobile Vibration, and Telegram Bot Webhooks

// 1. Web Audio Chime (Synthesized Dual-Tone Melodic Chime with Auto-Resume)
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Play tone 1 (high crystal chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.5);

    // Play tone 2 (harmonic bell)
    setTimeout(() => {
      try {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
        gain2.gain.setValueAtTime(0.28, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.6);
      } catch (e) {
        // ignore
      }
    }, 110);

    // Play tone 3 (high celebratory ring)
    setTimeout(() => {
      try {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1760, ctx.currentTime); // A6
        gain3.gain.setValueAtTime(0.25, ctx.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start();
        osc3.stop(ctx.currentTime + 0.7);
      } catch (e) {
        // ignore
      }
    }, 220);

  } catch (err) {
    console.warn('AudioContext not allowed or not supported:', err);
  }
};

// 2. Mobile Device Vibration (when supported)
export const vibratePhone = (pattern = [200, 100, 200, 100, 300]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // ignore
  }
};

// 3. Request Browser & Phone Push Notification Permission
export const requestPushPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('caturra_notifications_permission', permission);
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
};

// 4. Send Web Push / System Notification to Device
export const sendSystemNotification = ({
  title,
  body,
  icon = '/caturra_logo.jpg',
  tag = 'caturra-alert',
  onClickUrl = null
}) => {
  // Always trigger sound & vibration if enabled
  const soundEnabled = localStorage.getItem('caturra_sound_enabled') !== 'false';
  if (soundEnabled) {
    playNotificationSound();
    vibratePhone();
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const options = {
    body,
    icon,
    badge: icon,
    tag,
    vibrate: [200, 100, 200],
    data: { url: onClickUrl || '/' }
  };

  // 1. Service Worker showNotification (Essential for mobile OS lockscreen / iOS PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(reg => {
        if (reg && reg.showNotification) {
          return reg.showNotification(title, options);
        }
      })
      .catch(err => console.warn('SW showNotification fallback:', err));
  }

  // 2. Window Notification fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        if (onClickUrl) {
          window.location.href = onClickUrl;
        }
        notif.close();
      };
      return true;
    } catch (err) {
      // Some mobile browsers restrict new Notification constructor
    }
  }
  return true;
};

// 5. Send Instant Telegram Alert (Works 24/7 even with browser closed!)
export const sendTelegramAlert = async (text, config = null) => {
  try {
    const botToken = config?.botToken || localStorage.getItem('caturra_telegram_token');
    const chatId = config?.chatId || localStorage.getItem('caturra_telegram_chat_id');
    const isEnabled = config?.enabled !== undefined 
      ? config.enabled 
      : (localStorage.getItem('caturra_telegram_enabled') === 'true');

    if (!isEnabled || !botToken || !chatId) {
      return { success: false, reason: 'not_configured' };
    }

    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const data = await res.json();
    return { success: data.ok, data };
  } catch (err) {
    console.error('Error sending Telegram alert:', err);
    return { success: false, error: err.message };
  }
};

// 6. Master Dispatcher: Trigger All Channels for an Event
export const dispatchStoreAlert = async ({
  type = 'order', // 'order' | 'low_stock' | 'expiry' | 'sale'
  title,
  body,
  details = null,
  onClickUrl = null
}) => {
  // 1. Play Sound & Vibration
  playNotificationSound();
  vibratePhone();

  // 2. Browser / Device Native Notification
  sendSystemNotification({
    title,
    body,
    onClickUrl
  });

  // 3. Telegram Phone Alert (if configured)
  const isTgEnabled = localStorage.getItem('caturra_telegram_enabled') === 'true';
  if (isTgEnabled) {
    let tgMessage = `🌿 *${title}*\n━━━━━━━━━━━━━━━━━━━━\n${body}`;
    if (details) {
      tgMessage += `\n\n📋 *التفاصيل:*\n${details}`;
    }
    tgMessage += `\n\n⏰ *التوقيت:* ${new Date().toLocaleTimeString('ar-EG-u-nu-latn')}`;
    sendTelegramAlert(tgMessage);
  }
};
