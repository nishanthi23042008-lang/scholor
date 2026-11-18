import dns from 'node:dns/promises';
import net from 'node:net';

export interface HeuristicFinding {
  check: string;
  severity: 'pass' | 'warning' | 'danger' | 'info';
  detail: string;
}

export interface UrlScanOutput {
  targetUrl: string;
  normalizedHost: string;
  verdict: 'GREEN' | 'YELLOW' | 'RED';
  reasons: string[];
  heuristicFindings: HeuristicFinding[];
  safeBrowsingStatus: string;
  virusTotalStatus: string;
  redirectChain: string[];
  httpsAvailable: boolean;
  limitationsNote: string;
  scannedAt: string;
}

const OFFICIAL_DOMAINS = [
  'scholarships.gov.in',
  'aicte-india.org',
  'ugc.ac.in',
  'online-inspire.gov.in',
  'mahadbt.maharashtra.gov.in',
  'scholarship.up.gov.in',
  'ssp.postmatric.karnataka.gov.in',
  'education.gov.in',
  'ncs.gov.in',
  'nta.ac.in',
  'oasis.gov.in',
  'wbmdfcscholarship.in',
  'vidyalakshmi.co.in',
  'buddy4study.com',
];

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'rb.gy',
  'cutt.ly',
  'shorturl.at',
]);

const SUSPICIOUS_TLDS = new Set([
  '.xyz',
  '.top',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.click',
  '.work',
  '.buzz',
  '.loan',
  '.support',
]);

const PHISHING_KEYWORDS = [
  'registration-fee',
  'claim-fee',
  'upi-verify',
  'pay-fee',
  'free-laptop',
  'instant-grant',
  'kyc-update',
  'aadhaar-verify',
  'scholarship-claim',
  'govt-grant-apply',
  'nsp-verify',
  'nsp-claim',
];

function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // Link-local / Cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true; // Multicast & reserved
  return false;
}

function isPrivateOrReservedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true; // Link-local
  }
  if (lower.startsWith('::ffff:')) {
    const mappedV4 = lower.slice(7);
    if (net.isIPv4(mappedV4)) return isPrivateOrReservedIPv4(mappedV4);
  }
  return false;
}

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateOrReservedIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateOrReservedIPv6(ip);
  return true;
}

async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid URL format. Include http:// or https://.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs are permitted for scanning.');
  }

  if (parsed.username || parsed.password) {
    throw new Error('URLs containing embedded userinfo credentials are rejected.');
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    throw new Error('Local or internal network addresses cannot be scanned.');
  }

  if (net.isIP(host)) {
    if (isBlockedIp(host)) {
      throw new Error('Private or reserved IP ranges are blocked for security.');
    }
    return parsed;
  }

  try {
    const records = await dns.lookup(host, { all: true });
    if (!records.length) {
      return parsed; // Allow structural analysis even if DNS fails to resolve
    }
    for (const rec of records) {
      if (isBlockedIp(rec.address)) {
        throw new Error('Resolved destination IP is in a restricted internal or loopback range.');
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('restricted')) {
      throw err;
    }
    // Non-resolving domain still undergoes structural/threat-intel checks
  }

  return parsed;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

async function inspectRedirectsSafely(initialUrl: URL): Promise<{
  chain: string[];
  httpsAvailable: boolean;
  reachableNote: string;
}> {
  const chain: string[] = [initialUrl.toString()];
  let currentUrl = initialUrl;
  let reachableNote = 'Reachability check completed.';

  for (let hop = 0; hop < 3; hop++) {
    try {
      const res = await fetch(currentUrl.toString(), {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent': 'ScholarShield-SecurityInspector/1.0',
        },
      });

      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        const nextParsed = new URL(location, currentUrl);
        await assertSafeExternalUrl(nextParsed.toString());
        chain.push(nextParsed.toString());
        currentUrl = nextParsed;
        continue;
      }
      reachableNote = `HTTP ${res.status} received without further redirects.`;
      break;
    } catch {
      reachableNote = 'Live HTTP HEAD check timed out or was blocked by target host.';
      break;
    }
  }

  const finalHttps = currentUrl.protocol === 'https:';
  return { chain, httpsAvailable: finalHttps, reachableNote };
}

async function checkGoogleSafeBrowsing(targetUrl: string): Promise<{
  status: string;
  threatDetected: boolean;
  details: string[];
}> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return {
      status: 'Not Configured (GOOGLE_SAFE_BROWSING_API_KEY missing)',
      threatDetected: false,
      details: [],
    };
  }

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        client: { clientId: 'scholarshield', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: targetUrl }],
        },
      }),
    });

    if (!response.ok) {
      return {
        status: `Safe Browsing API error (HTTP ${response.status})`,
        threatDetected: false,
        details: [],
      };
    }

    const data = (await response.json()) as {
      matches?: Array<{ threatType?: string; platformType?: string }>;
    };
    const matches = data.matches || [];
    if (matches.length > 0) {
      return {
        status: `Threat Match Found (${matches.map((m) => m.threatType).join(', ')})`,
        threatDetected: true,
        details: matches.map((m) => `Google Safe Browsing flagged ${m.threatType || 'unsafe content'}.`),
      };
    }
    return {
      status: 'No threat matches returned by Google Safe Browsing API',
      threatDetected: false,
      details: [],
    };
  } catch {
    return {
      status: 'Safe Browsing request timed out or failed',
      threatDetected: false,
      details: [],
    };
  }
}

async function checkVirusTotal(targetUrl: string): Promise<{
  status: string;
  maliciousCount: number;
  suspiciousCount: number;
}> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return {
      status: 'Not Configured (VIRUSTOTAL_API_KEY missing)',
      maliciousCount: 0,
      suspiciousCount: 0,
    };
  }

  try {
    // Use VirusTotal URL ID (base64url without padding) to query existing report first without uploading private parameters
    const urlId = Buffer.from(targetUrl).toString('base64url');
    const lookupRes = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      method: 'GET',
      headers: { 'x-apikey': apiKey },
      signal: AbortSignal.timeout(5000),
    });

    if (lookupRes.status === 404) {
      return {
        status: 'URL not yet indexed in VirusTotal public dataset',
        maliciousCount: 0,
        suspiciousCount: 0,
      };
    }

    if (!lookupRes.ok) {
      return {
        status: `VirusTotal API error (HTTP ${lookupRes.status})`,
        maliciousCount: 0,
        suspiciousCount: 0,
      };
    }

    const json = (await lookupRes.json()) as {
      data?: {
        attributes?: {
          last_analysis_stats?: { malicious?: number; suspicious?: number; harmless?: number };
        };
      };
    };

    const stats = json.data?.attributes?.last_analysis_stats;
    const malicious = stats?.malicious ?? 0;
    const suspicious = stats?.suspicious ?? 0;

    return {
      status: `VirusTotal vendors: ${malicious} malicious, ${suspicious} suspicious`,
      maliciousCount: malicious,
      suspiciousCount: suspicious,
    };
  } catch {
    return {
      status: 'VirusTotal lookup timed out or failed',
      maliciousCount: 0,
      suspiciousCount: 0,
    };
  }
}

export async function analyzeScholarshipUrl(rawUrl: string): Promise<UrlScanOutput> {
  const parsed = await assertSafeExternalUrl(rawUrl);
  const host = parsed.hostname.toLowerCase();
  const fullLower = parsed.toString().toLowerCase();

  const findings: HeuristicFinding[] = [];
  const reasons: string[] = [];
  let riskScore = 0; // 0 = clean, 1-2 = warning (YELLOW), 3+ = high risk (RED)

  // 1. Official exact or subdomain match
  const exactOfficial = OFFICIAL_DOMAINS.find(
    (d) => host === d || host.endsWith(`.${d}`)
  );
  if (exactOfficial) {
    findings.push({
      check: 'Official Domain Verification',
      severity: 'pass',
      detail: `Hostname matches verified official portal domain (${exactOfficial}).`,
    });
  }

  // 2. HTTPS Check
  if (parsed.protocol === 'https:') {
    findings.push({
      check: 'HTTPS Transport',
      severity: 'pass',
      detail: 'URL uses HTTPS encryption.',
    });
  } else {
    riskScore += 2;
    reasons.push('Website uses unencrypted HTTP instead of HTTPS.');
    findings.push({
      check: 'HTTPS Transport',
      severity: 'warning',
      detail: 'Unencrypted http:// URL detected. Never enter academic or personal details on non-HTTPS forms.',
    });
  }

  // 3. IP address host check
  if (net.isIP(host)) {
    riskScore += 3;
    reasons.push('URL uses a raw numeric IP address instead of an official domain name.');
    findings.push({
      check: 'Domain Reputation Structure',
      severity: 'danger',
      detail: 'Legitimate Indian scholarship portals use named .gov.in, .ac.in, or institutional domains—not raw IP addresses.',
    });
  }

  // 4. Punycode / Homograph check
  if (host.includes('xn--')) {
    riskScore += 3;
    reasons.push('Internationalized Punycode domain (xn--) detected, which can disguise lookalike characters.');
    findings.push({
      check: 'Homograph / Punycode Inspection',
      severity: 'danger',
      detail: 'Punycode encoding detected in hostname; check carefully for character-substitution spoofing.',
    });
  }

  // 5. Typosquatting & Brand Impersonation check
  if (!exactOfficial) {
    for (const official of OFFICIAL_DOMAINS) {
      const baseOfficial = official.split('.')[0];
      const hostTokens = host.split('.');
      const primaryLabel = hostTokens.length >= 2 ? hostTokens[hostTokens.length - 2] : host;

      const dist = levenshtein(host, official);
      if (dist > 0 && dist <= 2) {
        riskScore += 3;
        reasons.push(`Domain "${host}" closely resembles official domain "${official}" (possible typosquatting).`);
        findings.push({
          check: 'Brand Impersonation & Spelling',
          severity: 'danger',
          detail: `Close spelling match to ${official} (edit distance ${dist}) on an unverified domain.`,
        });
        break;
      }

      if (
        (host.includes('scholarships-gov') ||
          host.includes('nsp-') ||
          host.includes('aicte-') ||
          host.includes('mahadbt-') ||
          host.includes('gov-in') ||
          (baseOfficial.length > 4 && host.includes(baseOfficial))) &&
        !host.endsWith('.gov.in') &&
        !host.endsWith('.nic.in') &&
        !host.endsWith('.ac.in')
      ) {
        riskScore += 3;
        reasons.push(`Suspicious brand impersonation: "${host}" references "${baseOfficial}" outside official .gov.in / .nic.in domains.`);
        findings.push({
          check: 'Suspicious Subdomain / Brand Impersonation',
          severity: 'danger',
          detail: `Official scheme keywords appear in a non-government hostname (${host}).`,
        });
        break;
      }

      if (primaryLabel === baseOfficial && !host.endsWith('.gov.in') && !host.endsWith('.ac.in')) {
        riskScore += 2;
        reasons.push(`Domain "${host}" uses "${primaryLabel}" on a non-official TLD.`);
        findings.push({
          check: 'TLD Authenticity',
          severity: 'warning',
          detail: `Matches institutional name "${primaryLabel}" without an official .gov.in or .ac.in domain suffix.`,
        });
        break;
      }
    }
  }

  // 6. URL shorteners
  if (URL_SHORTENERS.has(host)) {
    riskScore += 2;
    reasons.push('Shortened URL hides the true destination portal until opened.');
    findings.push({
      check: 'URL Shortener Check',
      severity: 'warning',
      detail: `Shortener domain (${host}) obscures the final application destination.`,
    });
  }

  // 7. Suspicious TLDs
  for (const tld of SUSPICIOUS_TLDS) {
    if (host.endsWith(tld)) {
      riskScore += 2;
      reasons.push(`Uses high-risk or commonly abused top-level domain (${tld}).`);
      findings.push({
        check: 'Top-Level Domain Check',
        severity: 'warning',
        detail: `Domain ends with ${tld}, which is atypical for official Indian scholarship bodies.`,
      });
      break;
    }
  }

  // 8. Excessive subdomain depth
  const subdomainCount = host.split('.').length;
  if (subdomainCount >= 5 && !exactOfficial) {
    riskScore += 1;
    reasons.push('Unusually deep subdomain nesting detected.');
    findings.push({
      check: 'Subdomain Depth',
      severity: 'warning',
      detail: `${subdomainCount} hostname segments detected, a common pattern in phishing sub-URLs.`,
    });
  }

  // 9. Phishing lure keywords
  const matchedKeywords = PHISHING_KEYWORDS.filter((kw) => fullLower.includes(kw));
  if (matchedKeywords.length > 0) {
    riskScore += 3;
    reasons.push(`Phishing or fee-scam keywords detected in URL: ${matchedKeywords.join(', ')}.`);
    findings.push({
      check: 'URL Path & Lure Terms',
      severity: 'danger',
      detail: `Contains suspicious lure terms (${matchedKeywords.join(', ')}). Official Indian government scholarships never charge registration/UPI verification fees via third-party links.`,
    });
  }

  // 10. Safe Redirect Inspection (no student PII sent)
  const redirectRes = await inspectRedirectsSafely(parsed);
  if (redirectRes.chain.length > 1) {
    const finalHost = new URL(redirectRes.chain[redirectRes.chain.length - 1]).hostname.toLowerCase();
    if (finalHost !== host) {
      riskScore += 1;
      reasons.push(`URL redirects to a different domain (${finalHost}).`);
    }
    findings.push({
      check: 'Redirect Behaviour',
      severity: finalHost !== host ? 'warning' : 'info',
      detail: `${redirectRes.chain.length - 1} redirect hop(s) observed. Final host: ${finalHost}.`,
    });
  } else {
    findings.push({
      check: 'Redirect Behaviour',
      severity: 'info',
      detail: redirectRes.reachableNote,
    });
  }

  // 11. Threat Intelligence APIs (Server-side only)
  const [safeBrowsing, virusTotal] = await Promise.all([
    checkGoogleSafeBrowsing(parsed.toString()),
    checkVirusTotal(parsed.toString()),
  ]);

  if (safeBrowsing.threatDetected) {
    riskScore += 5;
    reasons.push(...safeBrowsing.details);
    findings.push({
      check: 'Google Safe Browsing',
      severity: 'danger',
      detail: safeBrowsing.status,
    });
  } else {
    findings.push({
      check: 'Google Safe Browsing',
      severity: 'info',
      detail: safeBrowsing.status,
    });
  }

  if (virusTotal.maliciousCount > 0) {
    riskScore += 5;
    reasons.push(`${virusTotal.maliciousCount} security vendors flagged this URL on VirusTotal.`);
    findings.push({
      check: 'VirusTotal Intelligence',
      severity: 'danger',
      detail: virusTotal.status,
    });
  } else if (virusTotal.suspiciousCount > 0) {
    riskScore += 2;
    reasons.push(`${virusTotal.suspiciousCount} security vendors marked this URL as suspicious on VirusTotal.`);
    findings.push({
      check: 'VirusTotal Intelligence',
      severity: 'warning',
      detail: virusTotal.status,
    });
  } else {
    findings.push({
      check: 'VirusTotal Intelligence',
      severity: 'info',
      detail: virusTotal.status,
    });
  }

  let verdict: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
  if (riskScore >= 3) {
    verdict = 'RED';
  } else if (riskScore >= 1) {
    verdict = 'YELLOW';
  }

  if (verdict === 'GREEN' && reasons.length === 0) {
    reasons.push(
      exactOfficial
        ? `Matches known official domain (${exactOfficial}) with no threat indicators detected.`
        : 'No known phishing signatures or external threat matches detected during structural inspection.'
    );
  }

  return {
    targetUrl: parsed.toString(),
    normalizedHost: host,
    verdict,
    reasons,
    heuristicFindings: findings,
    safeBrowsingStatus: safeBrowsing.status,
    virusTotalStatus: virusTotal.status,
    redirectChain: redirectRes.chain,
    httpsAvailable: redirectRes.httpsAvailable,
    limitationsNote:
      'Security scans detect known threat indicators and structural anomalies but NEVER guarantee a website is completely safe. Always verify scholarship URLs against official .gov.in / institutional notices and never pay application or UPI verification fees.',
    scannedAt: new Date().toISOString(),
  };
}
