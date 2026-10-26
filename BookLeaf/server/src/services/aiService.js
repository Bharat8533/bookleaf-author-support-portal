const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const KNOWLEDGE_BASE = {
  company: {
    name: 'BookLeaf Publishing',
    regions: 'India and US',
    monthlyBooks: '1,200+',
    totalCatalog: '22,000+',
    packages: ['Standard Free (no upfront cost)', 'Bestseller Breakthrough (premium marketing/distribution)'],
    facilities: 'In-house printing & warehousing in Delhi. Key print partners: Repro India and Epitome Books.'
  },
  royalty: {
    split: '80/20 split: 80% of net profit goes to author, 20% to BookLeaf.',
    calculation: 'Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart at 45-50%), and shipping logistics.',
    cycle: 'Calculated quarterly and disbursed via bank transfer within 45 days after quarter close.',
    threshold: 'Minimum payout threshold is ₹1,000. Balances below ₹1,000 roll over to the next quarter.',
    method: 'Direct NEFT/RTGS bank transfer to the account verified in author profile.'
  },
  isbn: {
    policy: 'Every title is issued an authentic ISBN registered under BookLeaf imprint.',
    imprintChoice: 'Authors desiring custom imprint must provide their independently registered imprint.',
    glitchSLA: 'Catalog and ISBN mismatches receive immediate high-priority escalation with 48h resolution.'
  },
  printing: {
    printers: 'In-house printing in Delhi handles primary runs; large volume uses Repro India or Epitome Books.',
    turnaround: 'Standard print turnaround is 5–7 business days from order confirmation.',
    defectPolicy: 'Complimentary reprint arranged at zero cost upon photo verification of binding, misprint, or color defect.'
  },
  distribution: {
    channels: ['Amazon India', 'Flipkart', 'Amazon US', 'Amazon UK', 'BookLeaf Store'],
    goLiveTime: 'Retail distribution goes live within 7–10 business days after publication is signed off.',
    availabilitySync: 'Unavailable status typically indicates platform stock sync latency; BookLeaf triggers manual re-sync within 24–48 hours.'
  },
  productionStages: [
    'Manuscript Received',
    'Editing (if opted)',
    'Cover Design',
    'Typesetting',
    'Proofreading',
    'ISBN Assignment',
    'Printing',
    'Distribution Setup',
    'Published & Live'
  ]
};

function getTargetedContext(queryText, book) {
  const text = (queryText || '').toLowerCase();
  const contextSlices = [];

  if (text.includes('royalt') || text.includes('payment') || text.includes('payout') || text.includes('money') || text.includes('bank') || text.includes('sold')) {
    contextSlices.push(`[Royalty Policy]: ${JSON.stringify(KNOWLEDGE_BASE.royalty)}`);
  }
  if (text.includes('isbn') || text.includes('metadata') || text.includes('barcode') || text.includes('asin') || text.includes('imprint')) {
    contextSlices.push(`[ISBN & Metadata Policy]: ${JSON.stringify(KNOWLEDGE_BASE.isbn)}`);
  }
  if (text.includes('print') || text.includes('quality') || text.includes('blurry') || text.includes('binding') || text.includes('copy') || text.includes('defect')) {
    contextSlices.push(`[Printing & Quality Policy]: ${JSON.stringify(KNOWLEDGE_BASE.printing)}`);
  }
  if (text.includes('amazon') || text.includes('flipkart') || text.includes('unavailable') || text.includes('listing') || text.includes('distribut')) {
    contextSlices.push(`[Distribution Policy]: ${JSON.stringify(KNOWLEDGE_BASE.distribution)}`);
  }
  if (text.includes('stage') || text.includes('typeset') || text.includes('status') || text.includes('proof') || text.includes('cover') || text.includes('delay') || text.includes('when will')) {
    contextSlices.push(`[Production Stages]: ${KNOWLEDGE_BASE.productionStages.join(' -> ')}`);
  }

  if (contextSlices.length === 0) {
    contextSlices.push(`[Company Overview]: ${JSON.stringify(KNOWLEDGE_BASE.company)}`);
  }

  if (book) {
    contextSlices.push(
      `[Target Book Data]: Title="${book.title}", ISBN="${book.isbn}", Status="${book.status}", MRP=₹${book.mrp}, CopiesSold=${book.totalCopiesSold}, RoyaltyEarned=₹${book.totalRoyaltyEarned}, RoyaltyPaid=₹${book.royaltyPaid}, RoyaltyPending=₹${book.royaltyPending}, LastPayoutDate="${book.lastRoyaltyPayoutDate || 'N/A'}", Platforms="${(book.availableOn || []).join(', ')}"`
    );
  }

  return contextSlices.join('\n');
}

function classifyRuleBased(subject, description, book) {
  const text = `${subject} ${description}`.toLowerCase();

  let category = 'General Inquiry';
  let priority = 'Medium';
  let rationale = 'Standard informational inquiry with normal operational turnaround';

  if (text.includes('royalt') || text.includes('payout') || text.includes('payment') || text.includes('bank') || text.includes('sold')) {
    category = 'Royalty & Payments';
    if (text.includes('not received') || text.includes("haven't received") || text.includes('month') || text.includes('missing') || text.includes('overdue')) {
      priority = 'Critical';
      rationale = 'Overdue or unreceived author royalty payout requiring immediate accounts audit';
    } else {
      priority = 'High';
      rationale = 'Royalty amount or calculation verification against net profit formula';
    }
  } else if (text.includes('isbn') || text.includes('metadata') || text.includes('barcode') || text.includes('asin')) {
    category = 'ISBN & Metadata Issues';
    priority = 'Critical';
    rationale = 'ISBN mismatch directly affects retailer indexing, search discovery, and book orders';
  } else if (text.includes('quality') || text.includes('misprint') || text.includes('blurry') || text.includes('binding') || text.includes('defect') || text.includes('damaged') || text.includes('terrible')) {
    category = 'Printing & Quality';
    priority = 'High';
    rationale = 'Physical copy quality defect requiring photo review and complimentary reprint';
  } else if (text.includes('unavailable') || text.includes('amazon') || text.includes('flipkart') || text.includes('out of stock') || text.includes('distribut') || text.includes('buy')) {
    category = 'Distribution & Availability';
    priority = 'High';
    rationale = 'Retail store availability block halting immediate reader purchases';
  } else if (text.includes('typesetting') || text.includes('proofreading') || text.includes('cover') || text.includes('manuscript') || text.includes('stage') || text.includes('still in') || text.includes('when will')) {
    category = 'Book Status & Production Updates';
    if (text.includes('week') || text.includes('delayed') || text.includes('still')) {
      priority = 'Medium';
      rationale = 'Production milestone timeline inquiry requiring status clarification';
    } else {
      priority = 'Low';
      rationale = 'Routine manuscript production progress check';
    }
  } else {
    category = 'General Inquiry';
    priority = 'Low';
    rationale = 'General account or metadata update with standard response turnaround';
  }

  return { category, priority, rationale };
}

function generateFallbackResponse({ subject, description, category, authorName, book }) {
  const text = `${subject} ${description}`.toLowerCase();
  const firstName = authorName ? authorName.split(' ')[0] : 'Author';
  const bookTitle = book ? `"${book.title}"` : 'your book';

  if (category === 'Royalty & Payments') {
    if (text.includes('not received') || text.includes("haven't received") || text.includes('month')) {
      const pending = book ? `₹${book.royaltyPending.toLocaleString('en-IN')}` : 'your pending royalties';
      return `Dear ${firstName},

Thank you for reaching out, and I completely understand your concern regarding the pending royalty payout for ${bookTitle}. As an author, receiving your rightful earnings on schedule is vital, and we take this matter very seriously.

At BookLeaf, royalties are calculated on a quarterly cycle and disbursed within 45 days following the quarter's end, subject to our ₹1,000 minimum payout threshold. Our records currently show pending royalties of ${pending}.

To resolve this promptly:
1. Please confirm that your bank account details and IFSC code are up-to-date in your author dashboard.
2. We have escalated this query directly to our accounts team for an expedited audit.

We will verify the transfer status and provide you with an updated disbursement schedule within 48 hours. Please let us know if you have recently modified your bank information.

Warm regards,
BookLeaf Author Support Team`;
    }

    return `Dear ${firstName},

Thank you for contacting us regarding the royalty calculations for ${bookTitle}. I appreciate the opportunity to clarify how your earnings are computed.

BookLeaf operates on an 80/20 royalty model on net profit:
• Net Profit = MRP minus printing cost, distributor/platform commission (Amazon/Flipkart at 45-50%), and shipping logistics.
• 80% of this calculated net profit is credited directly to you.

${book ? `For ${bookTitle} (MRP: ₹${book.mrp}), total sales recorded stand at ${book.totalCopiesSold} copies with cumulative earnings of ₹${book.totalRoyaltyEarned.toLocaleString('en-IN')}.` : ''}

Our team can provide an itemized statement detailing sales and deductions across each platform. Please let us know if you would like us to email this report to your registered address.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === 'ISBN & Metadata Issues') {
    return `Dear ${firstName},

Thank you for alerting us immediately regarding the ISBN discrepancy for ${bookTitle}. Having the correct ISBN registered across all retail listings is critical, and we treat catalog integrity as a top priority.

Every BookLeaf title is assigned an official ISBN under our publisher imprint. A metadata discrepancy directly impacts retailer indexing and customer orders.

We have escalated this ticket as High Priority to our Production & Metadata team. We are cross-referencing your physical proof barcode with Amazon's ASIN link to push an authoritative catalog refresh.

We will provide you with a resolution update within 48 hours once the metadata refresh has propagated across the distributor feeds.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === 'Printing & Quality') {
    return `Dear ${firstName},

Please accept our sincere apologies for the condition of your author copies of ${bookTitle}. We take great pride in our printing standards, and receiving blurred images or misaligned pages does not reflect the quality we strive for.

We want to make this right immediately:
1. BookLeaf will arrange a complimentary reprint of your defective copies at zero cost to you.
2. Kindly reply to this ticket with 2–3 clear photographs showing the affected pages or binding defects, along with the quantity affected.

Once our print quality team verifies the photos (typically within 24 hours), we will initiate a fresh print run with a standard turnaround of 5–7 business days and share the dispatch tracking number with you.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === 'Distribution & Availability') {
    return `Dear ${firstName},

Thank you for reaching out regarding ${bookTitle} showing as "Currently Unavailable" on Amazon. I understand how concerning this is after your book has been published.

This status almost always reflects inventory sync latency across fulfillment nodes rather than a true out-of-stock situation. When regional stock levels update, Amazon periodically pauses listing visibility while data reconciles.

Our distribution team has initiated a manual inventory re-sync with Amazon's Seller Central feed. The listing typically returns to live status within 24 to 48 hours.

We will monitor the listing and update you as soon as the buy-box is restored.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === 'Book Status & Production Updates') {
    const currentStatus = book ? book.status : 'Typesetting';
    return `Dear ${firstName},

Thank you for checking in on the progress of ${bookTitle}. I am happy to share an update on where your manuscript stands in our production pipeline.

Your book is currently in the "${currentStatus}" phase. Standard typesetting and layout design typically require 2–3 weeks depending on the complexity of formatting and author review rounds.

Our production team is currently finalizing the interior formatting and margins. We anticipate sharing your formatted digital proof for your review within the next 3 to 4 business days. Once you approve the proof, we will proceed immediately to proofreading and ISBN assignment.

Warm regards,
BookLeaf Author Support Team`;
  }

  return `Dear ${firstName},

Thank you for getting in touch with BookLeaf Publishing regarding ${bookTitle}.

${text.includes('description') || text.includes('bio') ? `You can update your book description, author biography, or keywords at any time. Please reply to this ticket with your updated text, and our metadata team will push the revisions to Amazon, Flipkart, and the BookLeaf Store within 3 to 5 business days.` : `We have received your query and our author support team is currently reviewing your account details.`}

Please feel free to share any further details if needed, and we will be delighted to assist you.

Warm regards,
BookLeaf Author Support Team`;
}

async function callGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600
      }
    }),
    signal: controller.signal
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAI(messages, responseFormatJson = false) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: 600,
      ...(responseFormatJson ? { response_format: { type: 'json_object' } } : {})
    }),
    signal: controller.signal
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function classifyTicket({ subject, description, book }) {
  const fallback = classifyRuleBased(subject, description, book);

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  if (!hasApiKey) {
    return {
      category: fallback.category,
      priority: fallback.priority,
      rationale: fallback.rationale,
      source: 'fallback',
      modelUsed: 'BookLeaf Knowledge-Base Rule Engine'
    };
  }

  const prompt = `You are the AI Ticket Classifier for BookLeaf Publishing author support.
Classify the following author support query into one category and priority level.

Supported Categories (MUST be one of these exact strings):
- "Royalty & Payments"
- "ISBN & Metadata Issues"
- "Printing & Quality"
- "Distribution & Availability"
- "Book Status & Production Updates"
- "General Inquiry"

Supported Priorities (MUST be one of these exact strings):
- "Critical" (e.g. overdue royalty payment, ISBN mismatch on retail, major publishing block)
- "High" (e.g. royalty calculation question, print defect/damage, Amazon unavailable)
- "Medium" (e.g. production timeline inquiry, typesetting status)
- "Low" (e.g. routine metadata update, general bio/account question)

Ticket Subject: ${subject}
Ticket Description: ${description}
Related Book: ${book ? `${book.title} (Status: ${book.status})` : 'General / Account Level'}

Return STRICTLY a JSON object with this exact shape:
{
  "category": "Royalty & Payments" | "ISBN & Metadata Issues" | "Printing & Quality" | "Distribution & Availability" | "Book Status & Production Updates" | "General Inquiry",
  "priority": "Critical" | "High" | "Medium" | "Low",
  "rationale": "Short 1-sentence rationale explaining the classification"
}`;

  try {
    let rawOutput = '';
    let modelUsed = '';

    if (process.env.GEMINI_API_KEY) {
      rawOutput = await callGemini(prompt, 'You are a JSON-only response engine.');
      modelUsed = 'Google Gemini (gemini-1.5-flash)';
    } else if (process.env.OPENAI_API_KEY) {
      rawOutput = await callOpenAI([{ role: 'user', content: prompt }], true);
      modelUsed = 'OpenAI (gpt-4o-mini)';
    }

    const cleaned = rawOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const validCategory = CATEGORIES.includes(parsed.category) ? parsed.category : fallback.category;
    const validPriority = PRIORITIES.includes(parsed.priority) ? parsed.priority : fallback.priority;
    const rationale = parsed.rationale || fallback.rationale;

    return {
      category: validCategory,
      priority: validPriority,
      rationale,
      source: 'ai',
      modelUsed
    };
  } catch (err) {
    return {
      category: fallback.category,
      priority: fallback.priority,
      rationale: fallback.rationale,
      source: 'fallback',
      modelUsed: 'BookLeaf Knowledge-Base Rule Engine (Fallback)'
    };
  }
}

async function generateDraftResponse({ subject, description, category, authorName, book, messages = [] }) {
  const fallbackDraft = generateFallbackResponse({ subject, description, category, authorName, book });

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  if (!hasApiKey) {
    return {
      draftResponse: fallbackDraft,
      source: 'fallback',
      modelUsed: 'BookLeaf Policy Template Engine'
    };
  }

  const targetedContext = getTargetedContext(`${subject} ${description}`, book);

  const recentContext = (messages || [])
    .slice(-2)
    .map((m) => `${m.senderRole === 'admin' ? 'Support Agent' : 'Author'}: ${m.content}`)
    .join('\n');

  const prompt = `You are an empathetic, professional Senior Author Support Specialist at BookLeaf Publishing.
Draft a complete, ready-to-send support email response to the author.

Guidelines for BookLeaf Author Support Tone & Policy:
1. Treat authors as creative partners, not customers to manage.
2. Sincerity: Acknowledge the author's emotion or concern immediately and warmly.
3. Policy Compliance: Follow BookLeaf's actual rules strictly:
   - Royalties: 80/20 split on net profit (MRP minus print cost, Amazon 45-50% commission, shipping). Paid quarterly within 45 days. Minimum ₹1,000 threshold.
   - Print Quality: Complimentary reprint upon verification of photos. Turnaround 5-7 business days.
   - ISBN Mismatch: High priority investigation with 48h turnaround.
   - Amazon Unavailable: Stock sync latency; manual re-sync initiated within 24-48h.
4. Accuracy: NEVER invent fake payment dates, fictitious completed bank transfers, or false book statuses.
5. Actionable Next Step: Explain the concrete next step clearly and what is required (if anything) from the author.
6. Format: Plain email text addressed to the author's first name, signed off with:
Warm regards,
BookLeaf Author Support Team

Knowledge Base Policy Context:
${targetedContext}

Author: ${authorName || 'Author'}
Book: ${book ? `${book.title} (ISBN: ${book.isbn}, Status: ${book.status})` : 'General / Account Level'}
Subject: ${subject}
Query: ${description}
${recentContext ? `Recent Thread History:\n${recentContext}` : ''}

Draft the complete response email:`;

  try {
    let draftText = '';
    let modelUsed = '';

    if (process.env.GEMINI_API_KEY) {
      draftText = await callGemini(prompt, 'You are an author support assistant for BookLeaf Publishing.');
      modelUsed = 'Google Gemini (gemini-1.5-flash)';
    } else if (process.env.OPENAI_API_KEY) {
      draftText = await callOpenAI([{ role: 'user', content: prompt }], false);
      modelUsed = 'OpenAI (gpt-4o-mini)';
    }

    if (draftText && draftText.trim()) {
      return {
        draftResponse: draftText.trim(),
        source: 'ai',
        modelUsed
      };
    }
  } catch (err) {
  }

  return {
    draftResponse: fallbackDraft,
    source: 'fallback',
    modelUsed: 'BookLeaf Policy Template Engine (Fallback)'
  };
}

async function processTicketAI({ subject, description, authorName, authorEmail, book }) {
  const classification = await classifyTicket({ subject, description, book });
  const draft = await generateDraftResponse({
    subject,
    description,
    category: classification.category,
    authorName,
    book
  });

  return {
    category: classification.category,
    priority: classification.priority,
    priorityReason: classification.rationale,
    classificationSource: classification.source,
    draftResponse: draft.draftResponse,
    draftSource: draft.source,
    modelUsed: classification.modelUsed
  };
}

module.exports = {
  CATEGORIES,
  PRIORITIES,
  KNOWLEDGE_BASE,
  getTargetedContext,
  classifyTicket,
  classifyRuleBased,
  generateDraftResponse,
  generateFallbackResponse,
  processTicketAI
};
