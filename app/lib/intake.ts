export type IntakeStep = 'name' | 'phone' | 'email' | 'address' | 'problem';

const GREETING_ONLY = /^(?:hi|hello|hey|hiya|howdy|good\s+(?:morning|afternoon|evening)|greetings)(?:\s+there)?[!?.\s]*$/i;
const GREETING_SMALLTALK = /^(?:hi|hello|hey|hiya|howdy)\b[\s,!.:-]+(?:how\s+(?:(?:are|r)\s+(?:you|u)|(?:u|you))(?:\s+doing)?|how['’]s\s+(?:it\s+going|everything|life)|what['’]?s\s+up)\b/i;
const SMALLTALK = /\bhow\s+(?:(?:are|r)\s+(?:you|u)|(?:u|you))(?:\s+doing)?\b/i;
const REFUSAL = /^(?:no|nope|nah|rather not|prefer not|i(?:'m| am) not comfortable|don't want to|not telling you|unknown|n\/a|na)[!.\s]*$/i;
// Keep this sentence-level: single-word names such as May, Will, and Can are valid.
const QUESTION = /[?]|^(?:what|why|how|when|where|who)\s+|^(?:can|could|would|do|does|is|are|will|may)\s+(?:you|i|we|it|this|there|the|a|an|he|she|they)\b|^tell\s+me\b/i;
// Do not blacklist ordinary surnames (for example Price or Tech); only reject an
// explicit request/action phrase. The caller checks the normalized candidate.
const ACTION_PHRASE = /\b(?:book|booking|schedule|appointment|service\s+call|come\s+out|quote|cost)\b/i;
const ISSUE_FIRST = /^(?:my\s+)?(?:ac|air\s*condition(?:er)?|furnace|boiler|hvac|heating|cooling|thermostat|system)\b.*\b(?:broken|broke|failed|fail(?:ed|ing)?|isn't|is\s+not|not\s+working|leak(?:ing)?|no\s+(?:heat|cool)|won't)\b/i;
const SELF_INTRO = /^(?:hi|hello|hey)[,\s]+(?:i(?:'m| am)|my\s+name\s+is)\s+(.+?)[!\.\s]*$/i;
const MY_NAME = /^(?:my\s+name\s+is|i(?:'m| am))\s+(.+?)[!\.\s]*$/i;
const NAME_CORRECTION_START = /^(?:my\s+name\s+is\s+not\b|that(?:['’]s|\s+is)\s+not\s+my\s+name\b|not\s+my\s+name\b)[\s,:;—-]*/i;
const NAME_CORRECTION_INTRO = /\b(?:my\s+name\s+is|i(?:'m| am)|it(?:'s| is)|is)\s+/gi;

function clean(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
}

function normalizeNameCandidate(value: unknown): string {
  const candidate = clean(value).replace(/^[,.:;\-\s]+|[,.:;\-\s]+$/g, '');
  if (!candidate || candidate.length > 80 || GREETING_ONLY.test(candidate) || GREETING_SMALLTALK.test(candidate) || SMALLTALK.test(candidate) || REFUSAL.test(candidate) || QUESTION.test(candidate) || ACTION_PHRASE.test(candidate) || ISSUE_FIRST.test(candidate)) return '';
  // Names may contain letters from any script, marks, spaces, apostrophes, periods, and hyphens.
  const namePattern = new RegExp("^[\\p{L}\\p{M}][\\p{L}\\p{M}'’.\\- ]*[\\p{L}\\p{M}]$|^[\\p{L}\\p{M}]$", 'u');
  if (!namePattern.test(candidate)) return '';
  return candidate;
}

/** Parse an explicit correction while distinguishing it from an ordinary answer. */
export function parseNameCorrection(value: unknown): { matched: boolean; name: string } {
  const input = clean(value);
  const start = input.match(NAME_CORRECTION_START);
  if (!start) return { matched: false, name: '' };

  const remainder = input.slice(start[0].length);
  const markerPattern = new RegExp(NAME_CORRECTION_INTRO.source, 'gi');
  let last: RegExpExecArray | null = null;
  let marker = markerPattern.exec(remainder);
  while (marker) {
    last = marker;
    marker = markerPattern.exec(remainder);
  }
  if (!last) return { matched: true, name: '' };
  return { matched: true, name: normalizeNameCandidate(remainder.slice(last.index + last[0].length)) };
}

/** Normalize a person's name without title-casing or otherwise changing their spelling. */
export function normalizeName(value: unknown): string {
  const input = clean(value);
  if (!input || input.length > 120 || GREETING_ONLY.test(input) || GREETING_SMALLTALK.test(input) || REFUSAL.test(input) || ISSUE_FIRST.test(input)) return '';

  const correction = parseNameCorrection(input);
  if (correction.matched) return correction.name;
  const intro = input.match(SELF_INTRO) ?? input.match(MY_NAME);
  return normalizeNameCandidate(intro?.[1] ?? input);
}

export function isSmallTalk(value: unknown): boolean {
  const answer = clean(value);
  return SMALLTALK.test(answer) || GREETING_SMALLTALK.test(answer);
}

export function normalizeAnswer(step: IntakeStep, value: unknown): string {
  const answer = clean(value);
  return step === 'email' ? answer.toLowerCase() : answer;
}

export function isQuestionOrSideRequest(value: unknown): boolean {
  const answer = clean(value);
  return !answer || QUESTION.test(answer) || GREETING_ONLY.test(answer) || GREETING_SMALLTALK.test(answer) || isSmallTalk(answer) || /\b(?:are you (?:a|an?)?\s*ai|what (?:do you|service)|what(?:'s| is) the (?:service|cost|price)|how much|available|availability|why do you need)\b/i.test(answer);
}

export function validateIntakeAnswer(step: IntakeStep, answer: string): string {
  if (answer.length > (step === 'problem' ? 800 : 240)) return 'That reply is too long. Please shorten it and try again.';
  if (step === 'name' && !normalizeName(answer)) return 'Please share the name you’d like me to use.';
  if (step === 'phone' && answer.replace(/\D/g, '').length < 7) return 'That number looks a little short. Could you include at least seven digits?';
  if (step === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) return 'Please check the email address and try again.';
  if (step === 'address' && answer.length < 5) return 'Could you include the street and area for the property?';
  if (step === 'problem' && answer.length < 8) return 'Could you share a little more about what the heating or cooling system is doing?';
  return '';
}

export function fieldQuestion(step: IntakeStep, name = ''): string {
  if (step === 'phone' && name) return `And ${name}, what’s the best phone number for the team to reach you on?`;
  if (step === 'email' && name) return `And ${name}, which email address would you like us to use for your appointment details?`;
  if (step === 'address' && name) return `And ${name}, what’s the property address for the visit?`;
  if (step === 'problem' && name) return `One last thing, ${name}: could you tell me a little about the heating or cooling issue?`;
  return ({
    name: 'To get us started, what name would you like me to use?',
    phone: 'What’s the best phone number for the team to reach you on?',
    email: 'Which email address would you like us to use for your appointment details?',
    address: 'What’s the property address for the visit?',
    problem: 'Could you tell me a little about the heating or cooling issue?',
  } as const)[step];
}
