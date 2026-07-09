/**
 * Email Validation & Anti-Fake Email Security Module
 * 
 * This module provides comprehensive email validation to prevent:
 * - Disposable/temporary email registration
 * - Fake/spam email accounts
 * - Email bombing/registration abuse
 * - Bot-generated email accounts
 */

// ====== DISPOSABLE EMAIL DOMAIN BLOCKLIST ======
// Comprehensive list of known disposable/temporary email providers
// Update this list periodically to block new disposable domains
const DISPOSABLE_DOMAINS: Set<string> = new Set([
  // Popular disposable email services
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz',
  'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'tempmail.com', 'temp-mail.org', 'temp-mail.com', 'temporarymail.com',
  'throwaway.email', 'throwawaymail.com', 'throwawayemailaddress.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'yopmail.org', 'yopmail.biz',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  '20minutemail.com', '20minutemail.net',
  '30minutemail.com', '30minutemail.net',
  'maildrop.cc', 'maildrop.ga', 'maildrop.xyz',
  'trashmail.com', 'trashmail.ws', 'trashmail.me', 'trashmail.org',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
  'mailexpire.com', 'mailmoat.com', 'mailnull.com',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'dispostable.com', 'emailondeck.com', 'emailisvalid.com',
  'fakeinbox.com', 'fakeinbox.info', 'fakeinbox.net',
  'mintemail.com', 'meltmail.com', 'mailscrap.com',
  'incognitomail.org', 'incognitomail.com', 'incognitomail.net',
  'mailcatch.com', 'mailcatch.net', 'mailcatch.org',
  'tempail.com', 'tempail.org', 'tempail.net',
  'mohmal.com', 'mohmal.im', 'mohmal.co',
  'burpcollaborator.net', 'mytemp.email', 'mytempemail.com',
  'tempmailaddress.com', 'tempmailaddress.net',
  'emailtemp.info', 'emailtemp.org',
  'tempmailbox.com', 'tempmailbox.net',
  'disposableemailaddresses.emailmiser.com',
  'mailforspam.com', 'mailforspam.net',
  'safetymail.info', 'safetymail.net',
  'instantemailaddress.com', 'instantemailaddress.net',
  'emaillime.com', 'emailmiser.com',
  'tempinbox.com', 'tempinbox.net',
  'recruitmail.me', 'recruitmail.net',
  'trashymail.com', 'trashymail.net',
  'filzmail.com', 'filzmail.net',
  'incinerator.com', 'incinerator.net',
  'jetable.org', 'jetable.com', 'jetable.net',
  'kasmail.com', 'kasmail.net',
  'kaspop.com', 'kaspop.net',
  'lookugly.com', 'lookugly.net',
  'mailblocks.com', 'mailblocks.net',
  'mailme.lv', 'mailme.lu',
  'mailshell.com', 'mailshell.net',
  'mailzilla.com', 'mailzilla.org', 'mailzilla.net',
  'nomail.xl.cx', 'nomail2me.com',
  'objectmail.com', 'objectmail.net',
  'proxymail.eu', 'proxymail.com',
  'rcpt.at', 'reallymymail.com',
  'recode.me', 'regbypass.com',
  'rmqkr.net', 'royal.net',
  's0ny.net', 'safersignup.de',
  'safetypost.de', 'saynotospams.com',
  'scbox.one', 'scbox.one',
  'schafmail.de', 'selfdestructingmail.com',
  'sendspamhere.com', 'sharklasers.com',
  'shiftmail.com', 'shitmail.me',
  'shortmail.net', 'sibmail.com',
  'sinnlos-mail.de', 'slaskpost.se',
  'slushmail.com', 'smashmail.de',
  'snakemail.com', 'solvemail.info',
  'sofortmail.de', 'sogetthis.com',
  'spamavert.com', 'spambog.com',
  'spambog.de', 'spambog.ru',
  'spambox.info', 'spambox.ir',
  'spambox.org', 'spambox.us',
  'spamcannon.com', 'spamcero.com',
  'spamcon.org', 'spamcorptastic.com',
  'spamcowboy.com', 'spamex.com',
  'spamfree24.com', 'spamfree24.de',
  'spamfree24.eu', 'spamfree24.info',
  'spamfree24.net', 'spamfree24.org',
  'spamgoes.in', 'spamgourmet.com',
  'spamgourmet.net', 'spamgourmet.org',
  'spamherelots.com', 'spamhereplease.com',
  'spamhole.com', 'spamify.com',
  'spaminator.de', 'spamkill.info',
  'spaml.com', 'spammotel.com',
  'spamobox.com', 'spamoff.de',
  'spamslicer.com', 'spamspot.com',
  'spamthis.co.uk', 'spamthisplease.com',
  'spamtrail.com', 'spamtrap.co.uk',
  'speed.1s.fr', 'spikio.com',
  'spoofmail.de', 'squizzy.de',
  'squizzy.eu', 'squizzy.net',
  'sroff.com', 'stop-my-spam.com',
  'stuffmail.de', 'supermailer.jp',
  'supergreatmail.com', 'supermailer.jp',
  'superrito.com', 'superstachel.de',
  'suremail.info', 'talkinator.com',
  'teewars.org', 'teleworm.com',
  'teleworm.es', 'teleworm.eu',
  'teleworm.us', 'temp-mail.org',
  'temp-mail.ru', 'temp-mail.de',
  'tempail.com', 'tempalias.com',
  'tempe-mail.com', 'tempemail.biz',
  'tempemail.co.za', 'tempemail.com',
  'tempemail.net', 'tempemail.org',
  'tempinbox.co.uk', 'tempinbox.com',
  'tempmail.co.uk', 'tempmail.com',
  'tempmail.de', 'tempmail.eu',
  'tempmail.it', 'tempmail.net',
  'tempmail.org', 'tempmail.us',
  'tempmail2.com', 'tempmaildemo.com',
  'tempmailer.com', 'tempmailer.de',
  'tempmailer.net', 'tempomail.fr',
  'temporaryemail.net', 'temporaryemail.us',
  'temporaryforwarding.com', 'temporaryinbox.com',
  'temporarymailaddress.com', 'tempthe.net',
  'tempymail.com', 'thc.st',
  'thecloudindex.com', 'thelimestones.com',
  'thismail.net', 'thisurl.net',
  'thraml.com', 'thrma.com',
  'throwawayemailaddress.com', 'throwam.com',
  'tilien.com', 'tittbit.in',
  'tizi.com', 'tmail.ws',
  'toiea.com', 'toomail.biz',
  'topranklist.de', 'tormail.org',
  'tradermail.info', 'trash-amil.com',
  'trash-mail.at', 'trash-mail.com',
  'trash-mail.de', 'trash2009.com',
  'trashemail.de', 'trashemails.de',
  'trashmail.at', 'trashmail.com',
  'trashmail.de', 'trashmail.io',
  'trashmail.me', 'trashmail.net',
  'trashmail.org', 'trashmail.ws',
  'trashmails.com', 'trashymail.com',
  'trashymail.net', 'trayna.com',
  'trbvm.com', 'trbvn.com',
  'trickmail.net', 'trillianpro.com',
  'twinmail.de', 'tyldd.com',
  'uggsrock.com', 'umail.net',
  'unimark.org', 'unmail.ru',
  'upliftnow.com', 'uplipht.com',
  'uroid.com', 'us.af', 'ussv.net',
  'valuemd.com', 'vctmail.com',
  'vidchart.com', 'viralplays.com',
  'vixletdev.com', 'vkcode.ru',
  'vmani.com', 'vmpanda.com',
  'vo.yoo7.com', 'voidbay.com',
  'vomoto.com', 'vpn.st',
  'vsimcard.com', 'vubby.com',
  'w3internet.co.uk', 'wakingupesther.com',
  'walkmail.net', 'walkmail.ru',
  'wasteland.rfc822.org', 'watch-harry-potter.com',
  'watchfull.net', 'wbml.net',
  'web-ideal.fr', 'webemail.me',
  'webm4il.info', 'webmail.co',
  'webtrip.ch', 'webuser.in',
  'wee.my', 'wefjo.grn.cc',
  'weg-werf-email.de', 'wegwerf-email-addressen.de',
  'wegwerf-emails.de', 'wegwerfadresse.de',
  'wegwerfmail.de', 'wegwerfmail.info',
  'wegwerfmail.net', 'wegwerfmail.org',
  'wh4f.org', 'whatiaas.com',
  'whatpaas.com', 'whatsaas.com',
  'whopy.com', 'whtjddn.33mail.com',
  'wickmail.net', 'widaryanto.info',
  'wilemail.com', 'willhackforfood.biz',
  'willselfdestruct.com', 'winemaven.info',
  'wins.com.br', 'wmail.cf',
  'wolfsmail.tk', 'wovz.cu.cc',
  'wr.moeri.org', 'wralawfirm.com',
  'writeme.us', 'wronghead.com',
  'wuzup.net', 'wuzupmail.net',
  'www.e4ward.com', 'www.mailinator.com',
  'x1x.spb.ru', 'x24.com',
  'xagloo.co', 'xemaps.com',
  'xents.com', 'xjoi.com',
  'xl.cx', 'xmail.com',
  'xmaily.com', 'xn--9kq962e.xn--hgbk6aj7f53bba.xn--kgbechtv',
  'xoxox.cc', 'xperiae5.com',
  'xrho.com', 'xwaretech.com',
  'xwaretech.info', 'xwaretech.net',
  'xww.ro', 'xyzfree.net',
  'yabai-oppai.com', 'yahmail.top',
  'yamail.win', 'yandexmail.link',
  'yandi-3d.com', 'yannmail.win',
  'yapmail.com', 'yapped.net',
  'yaqally.com', 'yarpnet.com',
  'ycare.de', 'ycn.ro',
  'ye.vc', 'yedi.org',
  'yep.it', 'yhg.biz',
  'ynm.in', 'yodx.ro',
  'yogamaven.com', 'yomail.info',
  'yoo.ro', 'yopmail.com',
  'yopmail.fr', 'yopmail.net',
  'yopmail.org', 'yopmail.biz',
  'yordanmail.ch', 'yopmail.biz',
  'you-spam.com', 'yougotgoated.com',
  'youmail.ga', 'youmailr.com',
  'youneedmore.info', 'yourdomain.com',
  'youremail.cf', 'yourewrong.com',
  'yourlms.biz', 'yourmail.online',
  'yourspamgoesto.space', 'yourtube.ml',
  'yspend.com', 'ytpayy.com',
  'yugasivapp.com', 'yui.it',
  'yuurok.com', 'yxxnetwork.com',
  'z1p.biz', 'z86.ru',
  'za.com', 'zabmail.com',
  'zaktouni.fr', 'zasod.com',
  'zaym-zaym.ru', 'zdenka.net',
  'zebins.com', 'zebins.eu',
  'zehnminuten.de', 'zehnminutenmail.de',
  'zepp.dk', 'zetmail.com',
  'zfymail.com', 'zhcne.com',
  'zigmusz.at', 'zippymail.info',
  'zipsendtest.com', 'zoemail.com',
  'zoemail.net', 'zoemail.org',
  'zomg.info', 'zumpul.com',
  'zv68.com', 'zxcv.com',
  'zxcvbnm.com', 'zzz.com',
  // Common Iranian/temp email patterns
  'chmail.me', 'chmail.ir',
  'mailyab.com', 'mailfa.com',
  'mihanmail.ir', 'iranimail.com',
  'persianmail.ir', 'iranmail.ir',
  'myiranmail.com', 'iranimail.net',
  // Common patterns with numbers/subdomains
  'mailcatch.com', 'mailhua.com', 'mailslite.com',
  'mailtemp.info', 'mailzilla.org',
  'drdrb.com', 'drdrb.net',
  'dropcake.de', 'dropmail.me',
  'edv.to', 'ee1.pl', 'ee2.pl',
  'eelmail.com', 'efxs.ca',
  'eino.us', 'eintagsmail.de',
  'emailigo.de', 'emailisvalid.com',
  'emailproxsy.com', 'emailtemporanea.com',
  'emailtemporanea.net', 'emailthe.net',
  'emailtmp.com', 'emailure.net',
  'emailxfer.com', 'emeil.in',
  'emeil.ir', 'emeraldwebmail.com',
  'emz.net', 'enterto.com',
  'ephemail.net', 'eram.co.in',
  'ero-tube.org', 'esc.la',
  'esemay.com', 'esgeneri.com',
  'esprity.com', 'euaq.com',
  'evanfox.info', 'evilcomputer.com',
  'evopo.com', 'example.com',
  'exitstageleft.net', 'explodemail.com',
  'expressmail.dk', 'extremail.ru',
  'eyepaste.com', 'ez.lv',
  'ezfill.com', 'fammix.com',
  'fantasymail.de', 'farrse.co.uk',
  'fast-email.com', 'fast-mail.org',
  'fastmail.net', 'fastmail.org',
  'fastmail.fm', 'fastmail.com',
  'fatflap.com', 'fbma.tk',
  'fdn.fr', 'feelings.fr',
  'fellowme.com', 'feng.ee',
  'fettometern.com', 'fictionsite.com',
  'fightallspam.com', 'figjs.com',
  'figshot.com', 'fiifke.de',
  'filbert4u.com', 'filbert4u.net',
  'filzmail.com', 'findu.pl',
  'fivemail.de', 'fixmail.tk',
  'flemail.ru', 'flowu.com',
  'fly-ts.de', 'flyinggeek.net',
  'flyspam.com', 'foobarbot.com',
  'footard.com', 'forecastertests.com',
  'forgetmail.com', 'forspam.net',
  'foxnetwork.fr', 'foxtrotter.info',
  'free-email.tt', 'free-mail.cc',
  'free-mail.cx', 'freebie-eu.com',
  'freelance-france.eu', 'freemail.ms',
  'freemails.cf', 'freemails.ml',
  'freemailzone.com', 'freeplumpervideos.com',
  'freeshipping.info', 'freeteenbums.com',
  'freundin.ru', 'friendlymail.co.uk',
  'front14.org', 'ftp.sh',
  'ftpinc.ca', 'fuckedupload.com',
  'fuckingduh.com', 'fuckme69.club',
  'fucknloveme.top', 'fuckxxme.top',
  'fullangle.org', 'fulvie.com',
  'funnycodesnippets.com', 'funnymail.de',
  'furz.de', 'fux0ringduh.com',
  'fxnxs.com', 'fyii.de',
  'g.hmail.us', 'g8g.eu',
  'gaddic.com', 'galaxy.tv',
  'gally.jp', 'gamail.com',
  'gamgami.com', 'garaselim.com',
  'garbagecollector.de', 'garbagemail.org',
  'gardenscape.ca', 'garizo.com',
  'garliclife.com', 'garrymccooey.com',
  'gav0.com', 'gbcmail.win',
  'gbmail.top', 'gbmx.de',
  'gbsu.de', 'gee-wiz.com',
  'geekforex.com', 'geewaka.com',
  'gehensiemirnichtaufdennerven.de',
  'geldwaschmaschine.de', 'gelitik.in',
  'genms.eu', 'geronra.com',
  'geschent.biz', 'get-mail.cf',
  'get-mail.ml', 'getairmail.cf',
  'getairmail.com', 'getairmail.ga',
  'getairmail.ml', 'getairmail.tk',
  'geteit.com', 'getfun.men',
  'getmails.eu', 'getnbox.com',
  'getnowtoday.cf', 'getover.it',
  'getsimpleemail.com', 'gett.icu',
  'gexik.com', 'ggmal.ml',
  'gholar.com', 'ghosttexter.de',
  'giacmosuaviet.com', 'giantmail.de',
  'ginzi.be', 'ginzi.co.uk',
  'ginzi.es', 'ginzi.net',
  'ginzy.co.uk', 'ginzy.eu',
  'giratex.com', 'girlfriend.ru',
  'girlmail.win', 'gishpuppy.com',
  'giveh2o.com', 'givmail.com',
  'glitch.sx', 'globaltouron.com',
  'glubex.com', 'glucosegrin.com',
  'gmatch.org', 'gmial.com',
  'gmx1mail.com', 'gobet889.com',
  'gocupid.com', 'goemailgo.com',
  'golemico.com', 'gomail.in',
  'goonmail.com', 'goplaygame.ru',
  'gorillaswithdirtyarmpits.com',
  'goround.info', 'gortex2k.com',
  'gotmail.com', 'gotmail.net',
  'gotmail.org', 'gotti.otherinbox.com',
  'govnomail.com', 'grandmamail.com',
  'grandmasmail.com', 'great-host.in',
  'greenhousemail.com', 'greensloth.com',
  'greggamel.com', 'greggamel.net',
  'gregorsky.zone', 'gregorygamel.com',
  'gregorygamel.net', 'grish.de',
  'griuc.schule', 'gryd.co',
  'gsof.org', 'gspma.com',
  'gudzillo.com', 'guerillamail.biz',
  'guerillamail.com', 'guerillamail.de',
  'guerillamail.info', 'guerillamail.net',
  'guerillamail.org', 'guerillamailblock.com',
  'gufum.com', 'gustr.com',
  'gynzi.co.uk', 'gynzi.com',
  'gynzy.at', 'gynzy.com',
  'gynzy.es', 'gynzy.eu',
  'gynzy.gr', 'gynzy.info',
  'gynzy.it', 'gynzy.nl',
  'gynzy.pl', 'gynzy.ro',
  'gynzy.sk', 'gynzy.tv',
]);

// Common free email providers that are ALLOWED (not disposable)
const ALLOWED_FREE_PROVIDERS: Set<string> = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it', 'yahoo.co.jp',
  'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de',
  'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.it', 'live.jp',
  'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'zoho.com', 'mail.com', 'gmx.com', 'gmx.net', 'gmx.de',
  'yandex.com', 'yandex.ru', 'yandex.ua',
  'tutanota.com', 'tuta.io',
  'fastmail.com', 'fastmail.fm',
  'rediffmail.com', 'qq.com', '163.com', '126.com',
  'naver.com', 'hanmail.net', 'daum.net',
  'mail.ru', 'inbox.ru', 'bk.ru', 'list.ru',
  'rambler.ru', 'yandex.com',
  // Iranian email providers
  'chmail.ir', 'ymail.com',
]);

// Suspicious patterns in email addresses
const SUSPICIOUS_PATTERNS = [
  /^.{50,}@/,              // Very long local part
  /\+.*\+/,                // Multiple + signs
  /\.\./,                   // Consecutive dots
  /\.@/,                    // Dot before @
  /^\.|\.$/,                // Starts or ends with dot in local part
];

interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
  isDisposable: boolean;
  isSuspicious: boolean;
}

/**
 * Comprehensive email validation
 * Checks: format, disposable domains, suspicious patterns, and common typos
 */
export function validateEmailSecurity(email: string): EmailValidationResult {
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, reason: 'فرمت ایمیل معتبر نیست', isDisposable: false, isSuspicious: false };
  }

  // Extract domain
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { isValid: false, reason: 'فرمت ایمیل معتبر نیست', isDisposable: false, isSuspicious: false };
  }

  // Check for disposable email domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, reason: 'ایمیل‌های موقت و یکبار مصرف قابل قبول نیستند. لطفاً از یک ایمیل دائمی استفاده کنید.', isDisposable: true, isSuspicious: false };
  }

  // Check for suspicious patterns
  const localPart = email.split('@')[0];
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(localPart)) {
      return { isValid: false, reason: 'فرمت ایمیل مشکوک است. لطفاً از یک ایمیل معتبر استفاده کنید.', isDisposable: false, isSuspicious: true };
    }
  }

  // Check for very short domains (likely temporary)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isValid: false, reason: 'دامنه ایمیل معتبر نیست', isDisposable: false, isSuspicious: true };
  }

  // Check for numeric-only subdomains (often temporary)
  if (/^\d+\..*\..*$/.test(domain)) {
    return { isValid: false, reason: 'ایمیل‌های با دامنه عددی قابل قبول نیستند', isDisposable: false, isSuspicious: true };
  }

  // Check for very new/random looking domains (not in allowed list and not common)
  // This is a soft check - we just flag it but don't block
  const isKnownProvider = ALLOWED_FREE_PROVIDERS.has(domain);
  const isSuspiciousDomain = !isKnownProvider && domain.length > 20;

  // Warning for uncommon domains but don't block
  if (isSuspiciousDomain) {
    // Still valid but suspicious
    return { isValid: true, isDisposable: false, isSuspicious: true };
  }

  return { isValid: true, isDisposable: false, isSuspicious: false };
}

/**
 * Check if an email domain is a known disposable provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

/**
 * Normalize email address for comparison
 * Handles: lowercase, trimming, removing +aliases for gmail
 */
export function normalizeEmail(email: string): string {
  let normalized = email.toLowerCase().trim();
  
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;

  // For Gmail: remove dots in local part and everything after +
  if (domain === 'gmail.com') {
    const cleanLocal = localPart.replace(/\./g, '').split('+')[0];
    normalized = `${cleanLocal}@${domain}`;
  }
  
  // For Outlook/Hotmail: remove everything after +
  if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) {
    const cleanLocal = localPart.split('+')[0];
    normalized = `${cleanLocal}@${domain}`;
  }

  return normalized;
}
