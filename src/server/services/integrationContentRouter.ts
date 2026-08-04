export type IntegrationDestination =
  | "job_tracker"
  | "calendar"
  | "assignments"
  | "projects"
  | "crm"
  | "finances"
  | "people"
  | "documents"
  | "knowledge";

export interface RoutedIntegrationContent {
  destinations: IntegrationDestination[];
  matchedKeywords: string[];
}

const ROUTES: Array<{ destination: IntegrationDestination; keywords: RegExp[] }> = [
  {
    destination: "job_tracker",
    keywords: [
      /\bjob(s)?\b/i,
      /\bapplicant(s)?\b/i,
      /\bapplication(s)?\b/i,
      /\brole(s)?\b/i,
      /\bposition(s)?\b/i,
      /\bintern(ship)?\b/i,
      /\brecruit(er|ing|ment)?\b/i,
      /\bhir(e|ing)\b/i,
      /\binterview(s|ed|ing)?\b/i,
      /\boffer letter\b/i,
    ],
  },
  {
    destination: "calendar",
    keywords: [/\bmeeting(s)?\b/i, /\bappointment(s)?\b/i, /\bevent(s)?\b/i, /\bschedul(e|ed|ing)\b/i, /\bdeadline(s)?\b/i, /\bdue date(s)?\b/i, /\bwebinar(s)?\b/i],
  },
  {
    destination: "assignments",
    keywords: [/\bassignment(s)?\b/i, /\bhomework\b/i, /\bquiz(zes)?\b/i, /\bexam(s)?\b/i, /\bsyllabus\b/i, /\bcoursework\b/i, /\bgrade(s|d)?\b/i, /\bprofessor(s)?\b/i],
  },
  {
    destination: "projects",
    keywords: [/\bproject(s)?\b/i, /\btask(s)?\b/i, /\bmilestone(s)?\b/i, /\bdeliverable(s)?\b/i, /\bsprint(s)?\b/i, /\bboard(s)?\b/i],
  },
  {
    destination: "crm",
    keywords: [/\bcustomer(s)?\b/i, /\bclient(s)?\b/i, /\blead(s)?\b/i, /\bprospect(s)?\b/i, /\bdeal(s)?\b/i, /\bopportunit(y|ies)\b/i, /\bcontact(s)?\b/i],
  },
  {
    destination: "finances",
    keywords: [/\binvoice(s)?\b/i, /\breceipt(s)?\b/i, /\bpayment(s)?\b/i, /\bexpense(s)?\b/i, /\brevenue\b/i, /\bbudget(s)?\b/i, /\bbilling\b/i],
  },
  {
    destination: "people",
    keywords: [/\bemployee(s)?\b/i, /\bstaff\b/i, /\bteam member(s)?\b/i, /\bonboarding\b/i, /\bpayroll\b/i, /\btime off\b/i, /\bpto\b/i],
  },
];

/**
 * Deterministically routes provider-owned content by its visible metadata.
 * Files always remain available in Documents and Knowledge; keyword matches
 * add the most relevant workspace destinations without moving or rewriting
 * the provider's original item.
 */
export function routeIntegrationContent(
  parts: Array<string | null | undefined>,
  options: { isFile?: boolean } = {}
): RoutedIntegrationContent {
  const text = parts.filter(Boolean).join(" \n ").replace(/\s+/g, " ").trim();
  const destinations: IntegrationDestination[] = [];
  const matchedKeywords = new Set<string>();

  if (options.isFile) destinations.push("documents", "knowledge");

  for (const route of ROUTES) {
    for (const keyword of route.keywords) {
      const match = text.match(keyword);
      if (!match) continue;
      if (!destinations.includes(route.destination)) destinations.push(route.destination);
      matchedKeywords.add(match[0].toLowerCase());
    }
  }

  return { destinations, matchedKeywords: [...matchedKeywords] };
}

const STRONG_JOB_SIGNALS = [
  /thank you for (your )?(interest|application|applying)/i,
  /application (was |has been )?(received|submitted|updated)/i,
  /interview (invitation|request|scheduled)/i,
  /invited? (you )?to interview/i,
  /offer (letter|of employment)/i,
  /application status/i,
  /not (moving|proceeding) forward/i,
];

export function isJobApplicationMessage(parts: Array<string | null | undefined>): boolean {
  const text = parts.filter(Boolean).join(" ");
  if (STRONG_JOB_SIGNALS.some((signal) => signal.test(text))) return true;
  const routed = routeIntegrationContent(parts);
  const jobMatches = routed.matchedKeywords.filter((match) =>
    /job|applicant|application|role|position|intern|recruit|hir|interview|offer/.test(match)
  );
  return jobMatches.length >= 2;
}

