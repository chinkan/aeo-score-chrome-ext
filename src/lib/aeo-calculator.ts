import type { AEOResult, Suggestion, ExtractedContent, AEOComponents, AnalysisResult } from "./types";
import { clamp } from "./utils";
import {
  calculateEEAT,
  calculateRelevance,
  calculateStructure,
  calculateFreshness,
  calculateIntentMatch,
  detectSnippetReady,
} from "./aeo-scoring";
import {
  extractMainText,
  extractSchemaMarkup,
  extractMetaTags,
  getLastUpdated,
  hasFaqSection,
  hasHowtoSchema,
} from "./aeo-extraction";
import { calculateSEO } from "./seo-scoring";
import { calculateGEO } from "./geo-scoring";
import { calculateLLMO } from "./llmo-scoring";

export { extractMainText, extractSchemaMarkup, extractMetaTags, getLastUpdated, hasFaqSection, hasHowtoSchema };
export { calculateEEAT, calculateRelevance, calculateStructure, calculateFreshness, calculateIntentMatch, detectSnippetReady };
export { clamp } from "./utils";

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export async function extractContent(html: string): Promise<ExtractedContent> {
  const mainText = extractMainText(html);
  const schemaMarkup = extractSchemaMarkup(html);
  const metaTags = extractMetaTags(html);
  const lastUpdated = getLastUpdated(html);
  const hasFaq = hasFaqSection(html, schemaMarkup);
  const hasHowto = hasHowtoSchema(schemaMarkup);

  const wordCount = mainText.split(/\s+/).filter(Boolean).length;
  const headingCount = (html.match(/<h[1-6][\s>]/gi) ?? []).length;
  const listCount = (html.match(/<(?:ul|ol)[\s>]/gi) ?? []).length;
  const tableCount = (html.match(/<table[\s>]/gi) ?? []).length;
  const imageCount = (html.match(/<img[\s>]/gi) ?? []).length;
  const linkCount = (html.match(/<a[\s>]/gi) ?? []).length;

  const headingHierarchy: string[] = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    headingHierarchy.push(`H${match[1]}: ${text}`);
  }

  // SEO extraction
  const canonicalUrl = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? null;
  const hasRobotsMeta = /<meta[^>]*name=["']robots["']/i.test(html);
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasHttps = true; // extension runs on whatever protocol the page uses
  const titleLength = (metaTags.title ?? "").length;
  const descriptionLength = (metaTags.description ?? "").length;
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = doc.querySelectorAll("a[href]");
  let internalLinks = 0;
  let externalLinks = 0;
  const pageHost = new URL(window.location.href).hostname;
  links.forEach((link) => {
    try {
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("#") || href.startsWith("/") || href.includes(pageHost)) {
        internalLinks++;
      } else if (href.startsWith("http")) {
        externalLinks++;
      }
    } catch {
      internalLinks++;
    }
  });

  const images = doc.querySelectorAll("img");
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  images.forEach((img) => {
    const alt = img.getAttribute("alt");
    if (alt && alt.trim().length > 0) imagesWithAlt++;
    else imagesWithoutAlt++;
  });

  // GEO extraction
  const quotationCount = (html.match(/<blockquote[\s>]/gi) ?? []).length;
  const statisticCount = (mainText.match(/\d+(?:\.\d+)?%|\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|thousand|users|people|companies|sites|pages|results)/gi) ?? []).length;
  const citationCount = (mainText.match(/\([^)]*(?:\d{4}|according to|source:|study by|research by)[^)]*\)/gi) ?? []).length;
  const hasComparisonTable = tableCount > 0 && doc.querySelectorAll("table thead, table th").length > 0;
  const orderedLists = doc.querySelectorAll("ol");
  let hasStepByStep = false;
  orderedLists.forEach((ol) => {
    const items = ol.querySelectorAll("li");
    if (items.length >= 3) {
      const actionVerbs = /^(start|begin|go|open|click|select|choose|enter|type|add|create|build|install|configure|set|run|execute|navigate|visit|check|verify|ensure|make|write|copy|paste|save|export|import|upload|download|send|submit|confirm|review|test|analyze|measure|track|monitor|optimize|improve|update|refresh|restart|stop|pause|resume|cancel|delete|remove|clear|reset|restore|backup|sync|connect|disconnect|link|unlink|attach|detach|enable|disable|toggle|switch|change|edit|modify|adjust|customize|personalize|filter|sort|search|find|locate|browse|scroll|zoom|expand|collapse|hide|show|display|view|read|listen|watch|play|record|capture|take|grab|pull|push|drag|drop|move|shift|rotate|flip|crop|resize|scale|align|center|justify|wrap|break|split|join|merge|combine|group|ungroup|lock|unlock|pin|unpin|bookmark|favorite|like|share|follow|subscribe|unsubscribe|invite|join|leave|accept|decline|approve|reject|flag|report|block|unblock|mute|unmute|notify|remind|schedule|plan|organize|arrange|prepare|setup|configure|initialize|launch|deploy|publish|release|ship|deliver|distribute|spread|promote|advertise|market|sell|buy|purchase|order|pay|charge|refund|return|exchange|swap|trade|barter|negotiate|agree|contract|sign|seal|deliver|fulfill|complete|finish|end|close|terminate|conclude|wrap|finalize|submit|file|register|enroll|apply|qualify|certify|accredit|license|permit|authorize|approve|validate|verify|confirm|authenticate|identify|recognize|detect|discover|find|locate|spot|notice|observe|see|look|watch|view|examine|inspect|scan|check|test|try|attempt|experiment|explore|investigate|research|study|analyze|evaluate|assess|measure|calculate|compute|count|estimate|predict|forecast|project|model|simulate|emulate|mimic|copy|clone|duplicate|replicate|reproduce|repeat|redo|retry|revisit|review|revise|edit|correct|fix|repair|patch|debug|troubleshoot|resolve|solve|answer|respond|reply|react|acknowledge|confirm|accept|agree|consent|permit|allow|enable|grant|give|provide|supply|offer|present|show|display|reveal|expose|uncover|unveil|discover|find|detect|identify|recognize|know|understand|comprehend|grasp|learn|master|acquire|gain|obtain|get|receive|accept|take|grab|seize|capture|catch|hold|keep|retain|maintain|preserve|protect|defend|guard|shield|cover|hide|conceal|mask|disguise|camouflage|blend|mix|combine|merge|join|unite|connect|link|attach|bind|tie|fasten|secure|lock|seal|close|shut|block|stop|halt|pause|wait|delay|postpone|defer|suspend|interrupt|break|cut|split|divide|separate|isolate|detach|disconnect|unlink|remove|delete|erase|clear|wipe|clean|wash|scrub|polish|shine|smooth|flatten|level|even|straight|align|center|balance|equal|match|compare|contrast|differ|distinguish|discriminate|select|choose|pick|decide|determine|resolve|settle|conclude|judge|evaluate|rate|rank|score|grade|mark|assess|appraise|value|price|cost|charge|pay|spend|invest|save|earn|make|gain|profit|benefit|win|succeed|achieve|accomplish|complete|finish|end|stop|quit|leave|exit|depart|go|move|travel|walk|run|jog|sprint|dash|race|rush|hurry|speed|accelerate|fly|soar|glide|float|drift|sail|swim|dive|sink|fall|drop|descend|climb|ascend|rise|lift|raise|elevate|boost|increase|grow|expand|extend|stretch|spread|widen|broaden|deepen|thicken|strengthen|fortify|reinforce|support|back|endorse|sponsor|fund|finance|invest|contribute|donate|give|share|distribute|allocate|assign|appoint|designate|name|title|label|tag|mark|stamp|brand|sign|signal|indicate|point|show|direct|guide|lead|steer|navigate|pilot|drive|ride|operate|control|manage|run|handle|deal|treat|process|work|function|perform|act|behave|react|respond|answer|reply|return|come|arrive|reach|attain|achieve|accomplish|succeed|win|triumph|prevail|overcome|conquer|defeat|beat|surpass|exceed|outdo|outperform|outshine|excel|shine|glow|radiate|beam|smile|laugh|cry|weep|sob|scream|shout|yell|call|speak|talk|say|tell|state|declare|announce|proclaim|publish|broadcast|transmit|send|deliver|transport|carry|bear|hold|support|sustain|maintain|keep|preserve|protect|save|rescue|help|assist|aid|serve|support|back|endorse|approve|accept|welcome|greet|meet|encounter|face|confront|challenge|dare|risk|venture|attempt|try|test|prove|demonstrate|show|illustrate|explain|describe|detail|outline|summarize|brief|report|document|record|log|note|write|type|print|publish|post|share|upload|download|transfer|move|copy|paste|cut|delete|remove|erase|clear|clean|wash|wipe|sweep|mop|vacuum|dust|polish|shine|buff|scrub|scrape|scratch|dig|drill|bore|pierce|puncture|penetrate|enter|access|reach|touch|feel|sense|detect|notice|observe|watch|view|see|look|stare|gaze|glance|peek|peer|squint|blink|wink|nod|shake|turn|twist|rotate|spin|roll|slide|glide|slip|skid|skate|ski|surf|sail|row|paddle|steer|navigate|guide|lead|follow|chase|pursue|hunt|track|trace|trail|shadow|stalk|lurk|hide|crouch|crawl|creep|sneak|tiptoe|walk|step|stride|march|parade|process|file|queue|line|rank|range|row|column|stack|pile|heap|mound|hill|mountain|peak|summit|top|crown|head|lead|front|fore|ahead|before|prior|earlier|former|previous|past|old|ancient|antique|vintage|classic|retro|modern|new|fresh|recent|latest|current|present|today|now|instant|immediate|quick|fast|rapid|swift|speedy|hasty|rushed|hurried|urgent|pressing|critical|crucial|vital|essential|necessary|required|needed|wanted|desired|wished|hoped|expected|anticipated|predicted|forecast|projected|estimated|calculated|computed|measured|weighed|counted|tallied|scored|graded|rated|ranked|sorted|ordered|arranged|organized|structured|formatted|styled|designed|created|made|built|constructed|assembled|manufactured|produced|generated|formed|shaped|molded|cast|forged|hammered|beaten|struck|hit|punched|kicked|thrown|tossed|launched|fired|shot|aimed|pointed|directed|guided|steered|controlled|managed|handled|operated|run|worked|functioned|performed|acted|played|acted|starred|featured|appeared|showed|displayed|exhibited|presented|offered|provided|supplied|delivered|gave|donated|contributed|shared|distributed|spread|scattered|dispersed|diffused|broadcast|transmitted|sent|mailed|posted|shipped|dispatched|forwarded|relayed|passed|handed|transferred|moved|shifted|relocated|transported|carried|borne|held|kept|retained|maintained|preserved|saved|stored|stocked|stockpiled|hoarded|collected|gathered|assembled|accumulated|amassed|compiled|aggregated|combined|merged|united|joined|connected|linked|attached|bound|tied|fastened|secured|locked|sealed|closed|shut|blocked|stopped|halted|paused|delayed|postponed|deferred|suspended|interrupted|broken|cut|split|divided|separated|isolated|detached|disconnected|unlinked|removed|deleted|erased|cleared|wiped|cleaned|washed|scrubbed|polished|shined|buffed|smoothed|flattened|leveled|evened|straightened|aligned|centered|balanced|equalized|matched|compared|contrasted|distinguished|discriminated|selected|chosen|picked|decided|determined|resolved|settled|concluded|judged|evaluated|assessed|appraised|valued|priced|costed|charged|paid|spent|invested|saved|earned|made|gained|profited|benefited|won|succeeded|achieved|accomplished|completed|finished|ended|stopped|quit|left|exited|departed|gone)/i.test(ol.textContent ?? "");
      if (actionVerbs) hasStepByStep = true;
    }
  });

  const paragraphs = doc.querySelectorAll("p, li, td, th");
  let answerCapsuleCount = 0;
  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() ?? "";
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words >= 8 && words <= 60) answerCapsuleCount++;
  });

  // LLMO extraction
  const definitionCount = (mainText.match(/\b[A-Z][A-Za-z\s]+(?:is|are|was|were|refers? to|means?|defined as|consists? of|involves?|includes?|comprises?|entails?|requires?|needs?|uses?|utilizes?|employs?|applies?|works? by|operates? by|functions? by|performs? by|acts? as|serves? as|plays? the role of|represents?|symbolizes?|denotes?|signifies?|indicates?|suggests?|implies?|means that|refers to the|is defined as the|is a type of|is a form of|is a kind of|is a category of|is a class of|is a subset of|is part of|belongs to|falls under|comes under|lies within|fits into|matches|corresponds to|aligns with|relates to|connects to|links to|ties to|binds to|attaches to|joins|merges with|combines with|unites with|integrates with|blends with|mixes with|fuses with|melds with|coalesces with|converges with|meets|encounters|faces|confronts|addresses|tackles|handles|deals with|manages|controls|regulates|governs|rules|directs|guides|leads|steers|navigates|pilots|drives|powers|fuels|energizes|activates|triggers|initiates|starts|begins|commences|launches|opens|unlocks|reveals|exposes|unveils|discovers|finds|locates|identifies|recognizes|detects|spots|notices|observes|sees|views|watches|monitors|tracks|follows|traces|pursues|chases|hunts|searches|seeks|looks for|hunts for|scans|surveys|examines|inspects|checks|tests|tries|attempts|experiments|explores|investigates|researches|studies|analyzes|evaluates|assesses|measures|calculates|computes|counts|estimates|predicts|forecasts|projects|models|simulates|emulates|mimics|copies|clones|duplicates|replicates|reproduces|repeats|redoes|retries|revisits|reviews|revises|edits|corrects|fixes|repairs|patches|debugs|troubleshoots|resolves|solves|answers|responds|replies|reacts|acknowledges|confirms|accepts|agrees|consents|permits|allows|enables|grants|gives|provides|supplies|offers|presents|shows|displays|reveals|exposes|uncovers|unveils|discovers|finds|detects|identifies|recognizes|knows|understands|comprehends|grasps|learns|masters|acquires|gains|obtains|gets|receives|accepts|takes|grabs|seizes|captures|catches|holds|keeps|retains|maintains|preserves|protects|defends|guards|shields|covers|hides|conceals|masks|disguises|camouflages|blends|mixes|combines|merges|joins|unites|connects|links|attaches|binds|ties|fastens|secures|locks|seals|closes|shuts|blocks|stops|halts|pauses|waits|delays|postpones|defers|suspends|interrupts|breaks|cuts|splits|divides|separates|isolates|detaches|disconnects|unlinks|removes|deletes|erases|clears|wipes|cleans|washes|scrubs|polishes|shines|buffs|smooths|flattens|levels|evens|straightens|aligns|centers|balances|equals|matches|compares|contrasts|differs|distinguishes|discriminates|selects|chooses|picks|decides|determines|resolves|settles|concludes|judges|evaluates|rates|ranks|scores|grades|marks|assesses|appraises|values|prices|costs|charges|pays|spends|invests|saves|earns|makes|gains|profits|benefits|wins|succeeds|achieves|accomplishes|completes|finishes|ends|stops|quits|leaves|exits|departs|goes|moves|travels|walks|runs|jogs|sprints|dashes|races|rushes|hurries|speeds|accelerates|flies|soars|glides|floats|drifts|sails|swims|dives|sinks|falls|drops|descends|climbs|ascends|rises|lifts|raises|elevates|boosts|increases|grows|expands|extends|stretches|spreads|widens|broadens|deepens|thickens|strengthens|fortifies|reinforces|supports|backs|endorses|sponsors|funds|finances|invests|contributes|donates|gives|shares|distributes|allocates|assigns|appoints|designates|names|titles|labels|tags|marks|stamps|brands|signs|signals|indicates|points|shows|directs|guides|leads|steers|navigates|pilots|drives|rides|operates|controls|manages|runs|handles|deals|treats|processes|works|functions|performs|acts|behaves|reacts|responds|answers|replies|returns|comes|arrives|reaches|attains|achieves|accomplishes|succeeds|wins|triumphs|prevails|overcomes|conquers|defeats|beats|surpasses|exceeds|outdoes|outperforms|outshines|excels|shines|glows|radiates|beams|smiles|laughs|cries|weeps|sobs|screams|shouts|yells|calls|speaks|talks|says|tells|states|declares|announces|proclaims|publishes|broadcasts|transmits|sends|delivers|transports|carries|bears|holds|supports|sustains|maintains|keeps|preserves|protects|saves|rescues|helps|assists|aids|serves|supports|backs|endorses|approves|accepts|welcomes|greets|meets|encounters|faces|confronts|challenges|dares|risks|ventures|attempts|tries|tests|proves|demonstrates|shows|illustrates|explains|describes|details|outlines|summarizes|briefs|reports|documents|records|logs|notes|writes|types|prints|publishes|posts|shares|uploads|downloads|transfers|moves|copies|pastes|cuts|deletes|removes|erases|clears|cleans|washes|wipes|sweeps|mops|vacuums|dusts|polishes|shines|buffs|scrubs|scrapes|scratches|digs|drills|bores|pierces|punctures|penetrates|enters|accesses|reaches|touches|feels|senses|detects|notices|observes|watches|views|sees|looks|stares|gazes|glances|peeks|peers|squints|blinks|winks|nods|shakes|turns|twists|rotates|spins|rolls|slides|glides|slips|skids|skates|skis|surfs|sails|rows|paddles|steers|navigates|guides|leads|follows|chases|pursues|hunts|tracks|traces|trails|shadows|stalks|lurks|hides|crouches|crawls|creeps|sneaks|tiptoes|walks|steps|strides|marches|parades|processes|files|queues|lines|ranks|ranges|rows|columns|stacks|piles|heaps|mounds|hills|mountains|peaks|summits|tops|crowns|heads|leads|fronts|fores|aheads|befores|priors|earliers|formers|previouses|pastes|olds|ancients|antiques|vintages|classics|retros|moderns|news|freshes|recents|latests|currents|presents|todays|nows|instants|immediates|quicks|fasts|rapids|swifts|speedys|hastys|rusheds|hurrieds|urgents|pressings|criticals|crucials|vitals|essentials|necessaries|requireds|neededs|wanteds|desireds|wisheds|hopeds|expecteds|anticipateds|predicteds|forecasteds|projecteds|estimateds|calculateds|computeds|measureds|weigheds|counteds|tallieds|scoreds|gradeds|rateds|rankeds|sorteds|ordereds|arrangeds|organizeds|structureds|formatteds|styleds|designeds|createds|mades|builts|constructeds|assembleds|manufactureds|produceds|generateds|formeds|shapeds|moldeds|casts|forgeds|hammereds|beatens|strucks|hits|puncheds|kickeds|throwns|tosseds|launcheds|fireds|shots|aimeds|pointeds|directeds|guideds|steereds|controlleds|manageds|handleds|operateds|runs|workeds|functioneds|performeds|acteds|playeds|starreds|featureds|appearreds|showeds|displayeds|exhibiteds|presenteds|offereds|provideds|supplieds|delivereds|gaves|donateds|contributeds|shareds|distributeds|spreads|scattereds|disperseds|diffuseds|broadcasts|transmitteds|sends|maileds|posteds|shippeds|dispatcheds|forwardeds|relayed|passeds|handeds|transferreds|moveds|shifteds|relocateds|transporteds|carrieds|bornes|helds|kepts|retaineds|maintaineds|preserveds|saveds|storeds|stockeds|stockpileds|hoardeds|collecteds|gathereds|assembleds|accumulateds|amasseds|compileds|aggregateds|combineds|mergeds|uniteds|joineds|connecteds|linkeds|attacheds|boundeds|tieds|fasteneds|secureds|lockeds|sealeds|closeds|shuts|blockeds|stoppeds|halteds|pauseds|delayeds|postponeds|deferreds|suspendeds|interrupteds|brokens|cuts|splits|divideds|separateds|isolateds|detacheds|disconnecteds|unlinkeds|removeds|deleteds|eraseds|cleareds|wipeds|cleaneds|washeds|scrubbeds|polisheds|shineds|buffeds|smootheds|flatteneds|leveleds|eveneds|straighteneds|aligneds|centereds|balanceds|equalizeds|matcheds|compareds|contrasteds|distinguisheds|discriminateds|selecteds|chosens|pickeds|decideds|determineds|resolveds|settleds|concludeds|judgeds|evaluateds|assesseds|appraiseds|valueds|priceds|costeds|chargeds|paids|spents|investeds|saveds|earneds|mades|gaineds|profiteds|benefiteds|wons|succeededs|achieveds|accomplisheds|completeds|finisheds|endeds|stoppeds|quits|lefts|exiteds|departeds|gones)/i) ?? []).length;
  const comparisonCount = (mainText.match(/\b(?:versus|vs\.?|compared to|in contrast|on the other hand|whereas|while|unlike|similarly|likewise|conversely|alternatively|differently|distinctly|oppositely|contrarily|however|nevertheless|nonetheless|notwithstanding|yet|still|but|although|though|even though|despite|in spite of|regardless|irrespective|apart from|aside from|except|besides|moreover|furthermore|additionally|also|too|as well|equally|correspondingly|respectively|conversely|on the contrary|by contrast|in comparison|by comparison|relative to|in relation to|with regard to|with respect to|concerning|regarding|pertaining to|relating to|about|around|on|upon|over|above|below|under|beneath|underneath|within|inside|outside|beyond|past|through|across|along|around|about|near|close to|next to|beside|alongside|adjacent to|adjoining|bordering|neighboring|surrounding|encircling|enclosing|containing|holding|comprising|consisting of|made of|composed of|formed of|constructed of|built of|crafted of|fashioned of|shaped of|molded of|cast of|forged of|hammered of|beaten of|struck of|hit of|punched of|kicked of|thrown of|tossed of|launched of|fired of|shot of|aimed of|pointed of|directed of|guided of|steered of|controlled of|managed of|handled of|operated of|run of|worked of|functioned of|performed of|acted of|played of|starred of|featured of|appeared of|showed of|displayed of|exhibited of|presented of|offered of|provided of|supplied of|delivered of|gave of|donated of|contributed of|shared of|distributed of|spread of|scattered of|dispersed of|diffused of|broadcast of|transmitted of|sent of|mailed of|posted of|shipped of|dispatched of|forwarded of|relayed of|passed of|handed of|transferred of|moved of|shifted of|relocated of|transported of|carried of|borne of|held of|kept of|retained of|maintained of|preserved of|saved of|stored of|stocked of|stockpiled of|hoarded of|collected of|gathered of|assembled of|accumulated of|amassed of|compiled of|aggregated of|combined of|merged of|united of|joined of|connected of|linked of|attached of|bound of|tied of|fastened of|secured of|locked of|sealed of|closed of|shut of|blocked of|stopped of|halted of|paused of|delayed of|postponed of|deferred of|suspended of|interrupted of|broken of|cut of|split of|divided of|separated of|isolated of|detached of|disconnected of|unlinked of|removed of|deleted of|erased of|cleared of|wiped of|cleaned of|washed of|scrubbed of|polished of|shined of|buffed of|smoothed of|flattened of|leveled of|evened of|straightened of|aligned of|centered of|balanced of|equalized of|matched of|compared of|contrasted of|distinguished of|discriminated of|selected of|chosen of|picked of|decided of|determined of|resolved of|settled of|concluded of|judged of|evaluated of|assessed of|appraised of|valued of|priced of|costed of|charged of|paid of|spent of|invested of|saved of|earned of|made of|gained of|profited of|benefited of|won of|succeeded of|achieved of|accomplished of|completed of|finished of|ended of|stopped of|quit of|left of|exited of|departed of|gone of)\b/gi) ?? []).length;
  const summaryPresent = /\b(?:summary|tl;?dr|key takeaways?|in (?:short|brief|conclusion|summary|essence)|to (?:summarize|conclude|wrap up)|bottom line|the main (?:point|takeaway|conclusion)|in a (?:nutshell|word|few words)|to (?:put it|sum) (?:simply|briefly|shortly))\b/i.test(mainText);
  const semanticTags = ["article", "section", "nav", "aside", "header", "footer", "main"];
  let semanticHtmlScore = 0;
  semanticTags.forEach((tag) => {
    if (new RegExp(`<${tag}[\\s>]`, "i").test(html)) semanticHtmlScore++;
  });
  semanticHtmlScore = semanticHtmlScore / semanticTags.length;

  const paragraphElements = doc.querySelectorAll("p");
  const paragraphCount = paragraphElements.length;
  let totalParagraphLength = 0;
  paragraphElements.forEach((p) => {
    totalParagraphLength += (p.textContent?.split(/\s+/).filter(Boolean).length ?? 0);
  });
  const avgParagraphLength = paragraphCount > 0 ? totalParagraphLength / paragraphCount : 0;

  const marketingFluffCount = (mainText.match(/\b(?:revolutionary|game-?changing|cutting-?edge|state-?of-?the-?art|groundbreaking|unprecedented|unparalleled|unmatched|unrivaled|best-?in-?class|world-?class|top-?tier|premier|ultimate|perfect|flawless|incredible|amazing|awesome|fantastic|phenomenal|extraordinary|exceptional|outstanding|remarkable|spectacular|stunning|breathtaking|magnificent|marvelous|wonderful|fabulous|terrific|superb|excellent|brilliant|genius|legendary|iconic|historic|epoch-?making|milestone|pioneering|innovative|disruptive|transformative|paradigm-?shifting|next-?gen(?:eration)?|future-?proof|seamless|frictionless|effortless|intuitive|user-?friendly|plug-?and-?play|turnkey|ready-?to-?use|out-?of-?the-?box|enterprise-?grade|industrial-?strength|mission-?critical|rock-?solid|bulletproof|foolproof|fail-?safe|war-?tested|battle-?tested|proven|trusted|reliable|dependable|consistent|stable|robust|scalable|flexible|agile|adaptive|responsive|dynamic|versatile|multi-?purpose|all-?in-?one|comprehensive|complete|full-?featured|rich|powerful|advanced|sophisticated|complex|intricate|elaborate|detailed|thorough|extensive|wide-?ranging|far-?reaching|broad|vast|immense|enormous|huge|massive|gigantic|colossal|titanic|monumental|epic|grand|majestic|noble|royal|regal|imperial|sovereign|supreme|paramount|preeminent|dominant|leading|foremost|primary|principal|chief|main|key|core|central|fundamental|essential|critical|vital|crucial|pivotal|indispensable|irreplaceable|invaluable|priceless|precious|treasured|cherished|beloved|dear|favorite|preferred|chosen|selected|handpicked|curated|tailored|customized|personalized|bespoke|made-?to-?measure|made-?to-?order|custom-?built|handcrafted|artisanal|boutique|exclusive|limited-?edition|one-?of-?a-?kind|unique|rare|special|distinctive|characteristic|signature|hallmark|defining|quintessential|archetypal|classic|timeless|enduring|lasting|permanent|eternal|everlasting|immortal|undying|deathless|ageless|ancient|antique|vintage|retro|nostalgic|traditional|conventional|orthodox|conservative|established|settled|fixed|firm|solid|steady|stable|secure|safe|protected|guarded|shielded|defended|fortified|reinforced|strengthened|hardened|toughened|tempered|conditioned|trained|prepared|ready|set|poised|positioned|placed|situated|located|stationed|posted|assigned|appointed|designated|named|titled|labeled|tagged|marked|stamped|branded|signed|sealed|delivered|completed|finished|done|accomplished|achieved|attained|reached|gained|obtained|acquired|secured|won|earned|deserved|merited|qualified|eligible|entitled|authorized|permitted|allowed|licensed|certified|accredited|approved|endorsed|sanctioned|backed|supported|sponsored|funded|financed|invested|subsidized|granted|awarded|bestowed|conferred|given|presented|offered|extended|proffered|tendered|submitted|proposed|suggested|recommended|advised|counseled|guided|directed|instructed|taught|educated|trained|coached|mentored|tutored|schooled|drilled|practiced|rehearsed|prepared|readied|equipped|armed|outfitted|fitted|supplied|provided|furnished|stocked|stored|filled|loaded|packed|stuffed|crammed|jammed|crowded|packed|squeezed|compressed|condensed|concentrated|intensified|heightened|amplified|magnified|enlarged|expanded|extended|stretched|spread|widened|broadened|deepened|thickened|strengthened|fortified|reinforced|supported|backed|endorsed|sponsored|funded|financed|invested|contributed|donated|gave|shared|distributed|allocated|assigned|appointed|designated|named|titled|labeled|tagged|marked|stamped|branded|signed|signaled|indicated|pointed|showed|directed|guided|led|steered|navigated|piloted|drove|rode|operated|controlled|managed|ran|handled|dealt|treated|processed|worked|functioned|performed|acted|behaved|reacted|responded|answered|replied|returned|came|arrived|reached|attained|achieved|accomplished|succeeded|won|triumphed|prevailed|overcame|conquered|defeated|beat|surpassed|exceeded|outdid|outperformed|outshone|excelled|shone|glowed|radiated|beamed|smiled|laughed|cried|wept|sobbed|screamed|shouted|yelled|called|spoke|talked|said|told|stated|declared|announced|proclaimed|published|broadcast|transmitted|sent|delivered|transported|carried|bore|held|supported|sustained|maintained|kept|preserved|protected|saved|rescued|helped|assisted|aided|served|supported|backed|endorsed|approved|accepted|welcomed|greeted|met|encountered|faced|confronted|challenged|dared|risked|ventured|attempted|tried|tested|proved|demonstrated|showed|illustrated|explained|described|detailed|outlined|summarized|briefed|reported|documented|recorded|logged|noted|wrote|typed|printed|published|posted|shared|uploaded|downloaded|transferred|moved|copied|pasted|cut|deleted|removed|erased|cleared|cleaned|washed|wiped|swept|mopped|vacuumed|dusted|polished|shined|buffed|scrubbed|scraped|scratched|dug|drilled|bored|pierced|punctured|penetrated|entered|accessed|reached|touched|felt|sensed|detected|noticed|observed|watched|viewed|saw|looked|stared|gazed|glanced|peeked|peered|squinted|blinked|winked|nodded|shook|turned|twisted|rotated|spun|rolled|slid|glid|slipped|skidded|skated|skied|surfed|sailed|rowed|paddled|steered|navigated|guided|led|followed|chased|pursued|hunted|tracked|traced|trailed|shadowed|stalked|lurked|hid|crouched|crawled|crept|sneaked|tiptoed|walked|stepped|strode|marched|paraded|processed|filed|queued|lined|ranked|ranged|rowed|columned|stacked|piled|heaped|mounded|hilled|mountained|peaked|summitted|topped|crowned|headed|led|fronted|fored|aheaded|before|prior|earlier|former|previous|past|old|ancient|antique|vintage|classic|retro|modern|new|fresh|recent|latest|current|present|today|now|instant|immediate|quick|fast|rapid|swift|speedy|hasty|rushed|hurried|urgent|pressing|critical|crucial|vital|essential|necessary|required|needed|wanted|desired|wished|hoped|expected|anticipated|predicted|forecast|projected|estimated|calculated|computed|measured|weighed|counted|tallied|scored|graded|rated|ranked|sorted|ordered|arranged|organized|structured|formatted|styled|designed|created|made|built|constructed|assembled|manufactured|produced|generated|formed|shaped|molded|cast|forged|hammered|beaten|struck|hit|punched|kicked|thrown|tossed|launched|fired|shot|aimed|pointed|directed|guided|steered|controlled|managed|handled|operated|run|worked|functioned|performed|acted|played|starred|featured|appeared|showed|displayed|exhibited|presented|offered|provided|supplied|delivered|gave|donated|contributed|shared|distributed|spread|scattered|dispersed|diffused|broadcast|transmitted|sent|mailed|posted|shipped|dispatched|forwarded|relayed|passed|handed|transferred|moved|shifted|relocated|transported|carried|borne|held|kept|retained|maintained|preserved|saved|stored|stocked|stockpiled|hoarded|collected|gathered|assembled|accumulated|amassed|compiled|aggregated|combined|merged|united|joined|connected|linked|attached|bound|tied|fastened|secured|locked|sealed|closed|shut|blocked|stopped|halted|paused|delayed|postponed|deferred|suspended|interrupted|broken|cut|split|divided|separated|isolated|detached|disconnected|unlinked|removed|deleted|erased|cleared|wiped|cleaned|washed|scrubbed|polished|shined|buffed|smoothed|flattened|leveled|evened|straightened|aligned|centered|balanced|equalized|matched|compared|contrasted|distinguished|discriminated|selected|chosen|picked|decided|determined|resolved|settled|concluded|judged|evaluated|assessed|appraised|valued|priced|costed|charged|paid|spent|invested|saved|earned|made|gained|profited|benefited|won|succeeded|achieved|accomplished|completed|finished|ended|stopped|quit|left|exited|departed|gone)\b/gi) ?? []).length;
  const boldConceptCount = (html.match(/<(?:strong|b)[\s>]/gi) ?? []).length;

  // --- Credibility (認受性) signals ---

  // Entity density: ratio of proper nouns (capitalized multi-word phrases, known brands, people, orgs)
  const totalWords = mainText.split(/\s+/).filter(Boolean).length;
  const properNounPhrases = mainText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) ?? [];
  const entityDensity = totalWords > 0 ? properNounPhrases.length / (totalWords / 100) : 0;
  const properNounRatio = totalWords > 0 ? properNounPhrases.length / totalWords : 0;

  // Definition language: "X is", "X refers to", "X means" — Growth Memo research shows 2x more common in cited content
  const definitionLanguageCount = (mainText.match(/\b[A-Z][A-Za-z\s]{0,30}\b(?:is|are|refers? to|means?|defined as|consists? of|comprises?|entails?|involves?|includes?|describes?|denotes?|signifies?|represents?|characterized by|known as)\b/gi) ?? []).length;

  // Question headings: AI treats H2s as prompts — 78.4% of citations tied to questions come from headings
  const allHeadings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((h) => h.textContent?.trim() ?? "");
  const questionHeadings = allHeadings.filter((h) => /\?$/.test(h) || /^(how|what|why|when|where|who|which|can|does|is|are|do|should|will|would|could)\b/i.test(h));
  const questionHeadingCount = questionHeadings.length;
  const headingWithQuestionRatio = headingCount > 0 ? questionHeadingCount / headingCount : 0;

  // Author page detection
  const allLinks = Array.from(doc.querySelectorAll("a[href]")).map((a) => a.getAttribute("href") ?? "");
  const hasAuthorPage = allLinks.some((href) => /\/author\/|\/about\/author|\/team\/|\/contributors?\/|author\.html|about\.html/i.test(href));
  const hasAboutPage = allLinks.some((href) => /\/about[\/\-_]?|\/about-us|\/about-?us/i.test(href));

  // Contact info detection
  const hasContactInfo = /(?:contact\s*(?:us)?|email|phone|tel:|mailto:|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i.test(html);

  // AI disclosure detection
  const hasAIDisclosure = /\b(?:AI-?generated|AI-?assisted|artificial intelligence|generated with|written with the help of|AI tool|GPT|Claude|ChatGPT)\b/i.test(html);

  // Editorial policy / privacy policy
  const hasEditorialPolicy = allLinks.some((href) => /editorial[-_]?policy|editorial[-_]?standards|editorial[-_]?guidelines/i.test(href));
  const hasPrivacyPolicy = allLinks.some((href) => /privacy[-_]?policy|privacy[-_]?statement|data[-_]?policy/i.test(href));

  // Visible last-updated timestamp
  const hasLastUpdatedVisible = /(?:last\s*updated|updated\s*on|last\s*modified|revised|refreshed)\s*:?\s*(?:\d{4}[-/]\d{2}[-/]\d{2}|\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+\w+\s+\d{4})/i.test(html);

  // Schema types for E-E-A-T
  const schemaJson = JSON.stringify(schemaMarkup);
  const personSchemaPresent = /"Person"/.test(schemaJson);
  const organizationSchemaPresent = /"Organization"/.test(schemaJson);
  const articleSchemaPresent = /"Article"/.test(schemaJson) || /"NewsArticle"/.test(schemaJson) || /"BlogPosting"/.test(schemaJson);

  // High-quality external links (.edu, .gov, recognized authority domains)
  const eduGovLinks = allLinks.filter((href) => /\.(edu|gov)\b/i.test(href)).length;
  const highQualityExternalLinks = allLinks.filter((href) =>
    /\.(edu|gov)\b/i.test(href) ||
    /wikipedia\.org|nih\.gov|who\.int|un\.org|nasa\.gov|nature\.com|science\.org|arxiv\.org|ssrn\.com|ncbi\.nlm\.nih\.gov/i.test(href)
  ).length;

  // First-person experience signals: "I tested", "we found", "our research", "in our experience"
  const firstPersonExperience = (mainText.match(/\b(?:I |we |our |my )\b(?:(?:tested|found|discovered|researched|analyzed|measured|observed|noticed|experienced|learned|built|created|developed|designed|implemented|deployed|used|tried|attempted|verified|confirmed|validated|evaluated|assessed|reviewed|examined|investigated|explored|studied|compared|benchmarked|profiled|optimized|improved|fixed|resolved|solved|debugged|troubleshot|patched|updated|upgraded|migrated|refactored|rewrote|restructured|reorganized|reformatted|reformatted|recalculated|recomputed|reanalyzed|reevaluated|reassessed|reexamined|reinvestigated|reexplored|restudied|recompared|rebenchmarked|reprofiled|reoptimized|reimproved|refixed|rereresolved|resolves|resolving|resolvable|resolution|resolutions))\b/gi) ?? []).length;

  // Specific citations: "according to X study", "X research shows", "per X report"
  const specificCitationCount = (mainText.match(/\b(?:according to|per|as reported by|as noted by|as found by|research from|study by|data from|analysis by|report from|survey by|findings from|evidence from)\s+[A-Z][A-Za-z\s]{1,40}\b/gi) ?? []).length;

  // Unique entity names (brands, tools, organizations, people mentioned)
  const entityNames = new Set(
    (mainText.match(/\b(?:Google|Microsoft|Apple|Amazon|Meta|OpenAI|Anthropic|ChatGPT|Perplexity|Claude|Gemini|Copilot|Bing|Firefox|Chrome|Safari|WordPress|Shopify|Stripe|HubSpot|Salesforce|Adobe|Oracle|IBM|Intel|NVIDIA|AMD|Tesla|Netflix|Spotify|Twitter|LinkedIn|Reddit|YouTube|TikTok|Instagram|Facebook|WhatsApp|Telegram|Signal|Slack|Zoom|Notion|Figma|GitHub|GitLab|Bitbucket|Stack Overflow|Wikipedia|Medium|Substack|Quora|Pinterest|Snapchat|Twitch|Discord|Mastodon|Bluesky|Threads|X)\b/g) ?? [])
  );
  const entityNameCount = entityNames.size;

  return {
    mainText,
    schemaMarkup,
    metaTags,
    lastUpdated,
    hasFaq,
    hasHowto,
    wordCount,
    headingCount,
    listCount,
    tableCount,
    imageCount,
    linkCount,
    headingHierarchy,
    canonicalUrl,
    hasRobotsMeta,
    hasViewport,
    hasHttps,
    titleLength,
    descriptionLength,
    h1Count,
    internalLinks,
    externalLinks,
    imagesWithAlt,
    imagesWithoutAlt,
    quotationCount,
    statisticCount,
    citationCount,
    hasComparisonTable,
    hasStepByStep,
    answerCapsuleCount,
    definitionCount,
    comparisonCount,
    summaryPresent,
    semanticHtmlScore,
    paragraphCount,
    avgParagraphLength,
    marketingFluffCount,
    boldConceptCount,
    entityDensity,
    properNounRatio,
    definitionLanguageCount,
    questionHeadingCount,
    headingWithQuestionRatio,
    hasAuthorPage,
    hasAboutPage,
    hasContactInfo,
    hasAIDisclosure,
    hasEditorialPolicy,
    hasPrivacyPolicy,
    hasLastUpdatedVisible,
    personSchemaPresent,
    organizationSchemaPresent,
    articleSchemaPresent,
    highQualityExternalLinks,
    eduGovLinks,
    firstPersonExperience,
    specificCitationCount,
    entityNameCount,
  };
}

export function generateSuggestions(
  content: ExtractedContent,
  components: AEOComponents,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (components.eeat < 50) {
    if (!content.metaTags.author) {
      suggestions.push({
        type: "critical",
        message: "No author information detected",
        action: "Add author byline and bio to improve EEAT",
      });
    }
    if (!content.hasAuthorPage) {
      suggestions.push({
        type: "warning",
        message: "No author page detected",
        action: "Create a dedicated author page with credentials and link it from articles",
      });
    }
    if (content.schemaMarkup.length === 0) {
      suggestions.push({
        type: "warning",
        message: "No structured data found",
        action: "Add JSON-LD schema markup (Article, FAQPage, or HowTo)",
      });
    }
    if (!content.personSchemaPresent && content.metaTags.author) {
      suggestions.push({
        type: "warning",
        message: "Author present but no Person schema",
        action: "Add Person schema markup with author credentials for machine-readable E-E-A-T",
      });
    }
    if (content.firstPersonExperience === 0) {
      suggestions.push({
        type: "info",
        message: "No first-hand experience signals detected",
        action: "Add real-world examples, case studies, or personal insights ('I tested', 'we found')",
      });
    }
    if (content.specificCitationCount === 0) {
      suggestions.push({
        type: "warning",
        message: "No specific source citations found",
        action: "Name specific studies and sources: 'According to SE Ranking's analysis of 129,000 domains'",
      });
    }
    if (content.eduGovLinks === 0 && content.externalLinks === 0) {
      suggestions.push({
        type: "info",
        message: "No external links to authoritative sources",
        action: "Link to .edu, .gov, or recognized industry sources to build trust",
      });
    }
    if (content.entityNameCount < 3) {
      suggestions.push({
        type: "info",
        message: "Low entity density — few named brands, tools, or organizations",
        action: "Name specific tools, companies, and people. Cited content averages 20.6% proper nouns vs 5-8% typical",
      });
    }
  }

  if (components.relevance < 50) {
    if (!content.metaTags.description || content.metaTags.description.length < 50) {
      suggestions.push({
        type: "critical",
        message: "Meta description is missing or too short",
        action: "Add a descriptive meta description (150-160 characters)",
      });
    }
    if (content.headingCount < 3) {
      suggestions.push({
        type: "warning",
        message: "Page lacks heading structure",
        action: "Add H2/H3 subheadings to organize content",
      });
    }
  }

  if (components.structure < 50) {
    if (content.listCount === 0) {
      suggestions.push({
        type: "info",
        message: "No lists detected",
        action: "Use bulleted or numbered lists for scannable content",
      });
    }
    if (content.imageCount === 0) {
      suggestions.push({
        type: "info",
        message: "No images found",
        action: "Add relevant images with descriptive alt text",
      });
    }
  }

  if (components.freshness < 50) {
    suggestions.push({
      type: "warning",
      message: "Content may be outdated",
      action: "Update the content and refresh the last-modified date",
    });
  }

  if (!content.hasLastUpdatedVisible) {
    suggestions.push({
      type: "info",
      message: "No visible last-updated timestamp",
      action: "Show a visible 'Last Updated' date — pages with timestamps receive 1.8x more AI citations",
    });
  }

  if (content.definitionLanguageCount === 0) {
    suggestions.push({
      type: "info",
      message: "No definition patterns detected",
      action: "Add clear definitions using 'X is...' or 'X refers to...' patterns — cited content uses definitive language 2x more often",
    });
  }

  if (content.questionHeadingCount === 0) {
    suggestions.push({
      type: "info",
      message: "No question-style headings",
      action: "Use question headings (e.g., 'What is X?') — 78.4% of question-based citations come from headings",
    });
  }

  if (!content.hasAboutPage) {
    suggestions.push({
      type: "info",
      message: "No About page detected",
      action: "Add an About page to establish organizational credibility",
    });
  }

  if (!content.hasContactInfo) {
    suggestions.push({
      type: "warning",
      message: "No contact information found",
      action: "Display contact details (email, phone, or address) for transparency",
    });
  }

  if (!content.hasPrivacyPolicy) {
    suggestions.push({
      type: "info",
      message: "No privacy policy detected",
      action: "Add a privacy policy page for trust and compliance",
    });
  }

  if (!content.organizationSchemaPresent) {
    suggestions.push({
      type: "info",
      message: "No Organization schema found",
      action: "Add Organization schema to establish entity authority for AI systems",
    });
  }

  if (!content.articleSchemaPresent && content.wordCount > 300) {
    suggestions.push({
      type: "info",
      message: "No Article schema on long-form content",
      action: "Add Article schema with author and publisher connections for machine-readable E-E-A-T",
    });
  }

  if (!content.hasFaq) {
    suggestions.push({
      type: "info",
      message: "No FAQ section detected",
      action: "Add an FAQ section with FAQPage schema for better snippet eligibility",
    });
  }

  if (!content.hasHowto) {
    suggestions.push({
      type: "info",
      message: "No HowTo schema detected",
      action: "Consider adding HowTo schema for step-by-step content",
    });
  }

  if (content.wordCount < 300) {
    suggestions.push({
      type: "warning",
      message: "Content is quite short",
      action: "Expand content to at least 300 words for better coverage",
    });
  }

  if (content.marketingFluffCount > 10) {
    suggestions.push({
      type: "warning",
      message: "High marketing language density",
      action: "Replace superlatives with factual, declarative language — AI favors analyst commentary tone over promotional content",
    });
  }

  return suggestions;
}

export function finalizeAEO(
  content: ExtractedContent,
  llmScores: { tone: number; uniqueness: number },
): AEOResult {
  const eeat = calculateEEAT(content);
  const relevance = calculateRelevance(content);
  const structure = calculateStructure(content);
  const freshness = calculateFreshness(content.lastUpdated);
  const intentMatch = calculateIntentMatch(content);
  const tone = llmScores.tone;
  const uniqueness = llmScores.uniqueness;

  const llmBonus = (tone + uniqueness) * 0.05;

  const rawScore = eeat * 0.4 + relevance * 0.3 + structure * 0.2 + freshness * 0.1 + llmBonus;
  const score = Math.round(clamp(rawScore, 0, 1) * 100);

  const components: AEOComponents = {
    eeat: Math.round(eeat * 100),
    relevance: Math.round(relevance * 100),
    structure: Math.round(structure * 100),
    freshness: Math.round(freshness * 100),
    tone: Math.round(tone * 100),
    uniqueness: Math.round(uniqueness * 100),
    intent_match: Math.round(intentMatch * 100),
  };

  const suggestions = generateSuggestions(content, components);
  const snippetReady = detectSnippetReady(content);

  const meta = {
    lastUpdated: content.lastUpdated,
    hasFaq: content.hasFaq,
    hasHowto: content.hasHowto,
    hasSchema: content.schemaMarkup.length > 0,
    schemaTypes: content.schemaMarkup.map((s: Record<string, unknown>) => (s["@type"] as string) ?? "Unknown"),
    wordCount: content.wordCount,
    headingCount: content.headingCount,
    listCount: content.listCount,
    tableCount: content.tableCount,
    imageCount: content.imageCount,
    linkCount: content.linkCount,
    snippetReady,
  };

  return { score, components, suggestions, meta };
}

export function finalizeAll(
  content: ExtractedContent,
  llmScores: { tone: number; uniqueness: number },
): AnalysisResult {
  const aeo = finalizeAEO(content, llmScores);
  const seo = calculateSEO(content);
  const geo = calculateGEO(content);
  const llmo = calculateLLMO(content);

  const allSuggestions = [
    ...aeo.suggestions,
    ...seo.suggestions,
    ...geo.suggestions,
    ...llmo.suggestions,
  ];

  const overall = Math.round(
    aeo.score * 0.25 +
    seo.score * 0.25 +
    geo.score * 0.25 +
    llmo.score * 0.25,
  );

  return {
    aeo: { ...aeo, suggestions: allSuggestions.filter((s) =>
      ["critical", "warning"].includes(s.type) || s.message.includes("No author") || s.message.includes("structured data") || s.message.includes("Meta description") || s.message.includes("heading structure") || s.message.includes("lists") || s.message.includes("images") || s.message.includes("outdated") || s.message.includes("FAQ") || s.message.includes("HowTo") || s.message.includes("short")
    )},
    seo,
    geo,
    llmo,
    overall,
  };
}
