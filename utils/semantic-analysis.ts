/**
 * Semantic analysis utilities for document clustering
 * This implements simplified versions of semantic analysis techniques
 * to better capture document meaning rather than just word frequency
 */

// Stop words to filter out from document analysis
const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
])

// Domain-specific keywords that help identify topics
// These are weighted more heavily in the semantic analysis
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  machine_learning: [
    "algorithm",
    "model",
    "training",
    "prediction",
    "classifier",
    "regression",
    "neural",
    "network",
    "deep",
    "learning",
    "supervised",
    "unsupervised",
    "reinforcement",
    "feature",
    "accuracy",
    "precision",
    "recall",
    "f1",
    "roc",
    "auc",
    "overfitting",
    "underfitting",
    "bias",
    "variance",
  ],
  nlp: [
    "language",
    "processing",
    "nlp",
    "text",
    "sentiment",
    "analysis",
    "named",
    "entity",
    "recognition",
    "ner",
    "tokenization",
    "parsing",
    "pos",
    "tagging",
    "stemming",
    "lemmatization",
    "corpus",
    "word2vec",
    "glove",
    "bert",
    "gpt",
    "transformer",
    "embedding",
    "semantic",
    "syntax",
  ],
  web_development: [
    "html",
    "css",
    "javascript",
    "frontend",
    "backend",
    "fullstack",
    "react",
    "angular",
    "vue",
    "node",
    "express",
    "api",
    "rest",
    "graphql",
    "http",
    "responsive",
    "design",
    "dom",
    "browser",
    "client",
    "server",
    "database",
    "sql",
    "nosql",
    "mongodb",
    "postgresql",
  ],
  data_science: [
    "data",
    "analysis",
    "visualization",
    "statistics",
    "probability",
    "hypothesis",
    "testing",
    "correlation",
    "causation",
    "regression",
    "classification",
    "clustering",
    "dimensionality",
    "reduction",
    "pca",
    "t-sne",
    "pandas",
    "numpy",
    "matplotlib",
    "seaborn",
    "jupyter",
    "notebook",
  ],
  cloud_computing: [
    "cloud",
    "aws",
    "azure",
    "gcp",
    "serverless",
    "container",
    "docker",
    "kubernetes",
    "microservice",
    "scaling",
    "iaas",
    "paas",
    "saas",
    "virtualization",
    "instance",
    "ec2",
    "s3",
    "lambda",
    "function",
  ],
  cybersecurity: [
    "security",
    "encryption",
    "decryption",
    "cryptography",
    "vulnerability",
    "exploit",
    "threat",
    "attack",
    "defense",
    "firewall",
    "malware",
    "virus",
    "ransomware",
    "phishing",
    "authentication",
    "authorization",
    "identity",
    "access",
    "management",
    "iam",
    "penetration",
    "testing",
  ],
  mobile_development: [
    "mobile",
    "android",
    "ios",
    "swift",
    "kotlin",
    "java",
    "objective-c",
    "app",
    "native",
    "hybrid",
    "react-native",
    "flutter",
    "xamarin",
    "responsive",
    "ui",
    "ux",
    "interface",
    "experience",
    "gesture",
  ],
  devops: [
    "devops",
    "ci",
    "cd",
    "pipeline",
    "integration",
    "deployment",
    "automation",
    "testing",
    "monitoring",
    "logging",
    "alerting",
    "infrastructure",
    "code",
    "configuration",
    "management",
    "ansible",
    "puppet",
    "chef",
    "terraform",
    "jenkins",
    "gitlab",
    "github",
    "actions",
  ],
  blockchain: [
    "blockchain",
    "cryptocurrency",
    "bitcoin",
    "ethereum",
    "smart",
    "contract",
    "token",
    "wallet",
    "mining",
    "consensus",
    "distributed",
    "ledger",
    "decentralized",
    "defi",
    "nft",
    "hash",
    "block",
  ],
  iot: [
    "iot",
    "internet",
    "things",
    "sensor",
    "actuator",
    "embedded",
    "arduino",
    "raspberry",
    "pi",
    "mqtt",
    "connectivity",
    "device",
    "smart",
    "home",
    "automation",
    "wearable",
    "telemetry",
  ],
}

// Semantic relationships between words
// This is a simplified version of word embeddings
const SEMANTIC_RELATIONSHIPS: Record<string, string[]> = {
  algorithm: ["method", "technique", "approach", "procedure", "process"],
  analysis: ["examination", "study", "investigation", "assessment", "evaluation"],
  application: ["program", "software", "app", "system", "tool"],
  architecture: ["structure", "framework", "design", "organization", "layout"],
  cloud: ["online", "web", "internet", "network", "remote"],
  code: ["program", "script", "source", "implementation", "development"],
  data: ["information", "content", "records", "statistics", "facts"],
  database: ["repository", "storage", "warehouse", "collection", "store"],
  development: ["creation", "building", "construction", "implementation", "programming"],
  function: ["method", "procedure", "routine", "operation", "subroutine"],
  implementation: ["execution", "realization", "deployment", "application", "development"],
  interface: ["ui", "frontend", "gui", "interaction", "display"],
  language: ["programming", "code", "syntax", "grammar", "vocabulary"],
  learning: ["training", "education", "study", "practice", "knowledge"],
  model: ["framework", "structure", "representation", "pattern", "template"],
  network: ["system", "infrastructure", "connection", "grid", "web"],
  performance: ["speed", "efficiency", "throughput", "responsiveness", "optimization"],
  process: ["procedure", "operation", "function", "method", "routine"],
  security: ["protection", "safety", "defense", "privacy", "encryption"],
  system: ["platform", "environment", "framework", "infrastructure", "architecture"],
  technology: ["tech", "innovation", "advancement", "development", "engineering"],
  testing: ["validation", "verification", "quality", "assessment", "evaluation"],
  user: ["client", "customer", "end-user", "consumer", "person"],
}

/**
 * Tokenizes and cleans text for semantic analysis
 */
export function tokenizeText(text: string): string[] {
  // Convert to lowercase and replace non-alphanumeric with spaces
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ")

  // Split by whitespace and filter out stop words and short words
  return normalized.split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word))
}

/**
 * Extracts n-grams (phrases) from text to capture multi-word concepts
 */
export function extractNgrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = []

  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(" "))
  }

  return ngrams
}

/**
 * Identifies domain-specific topics in a document
 */
export function identifyTopics(tokens: string[]): Map<string, number> {
  const topicScores = new Map<string, number>()

  // Check for domain keywords
  for (const [topic, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0

    for (const keyword of keywords) {
      // Count exact matches
      const exactMatches = tokens.filter((token) => token === keyword).length
      score += exactMatches * 2 // Weight exact matches more heavily

      // Count partial matches (e.g., "neural" would partially match "neural network")
      const partialMatches =
        tokens.filter((token) => token.includes(keyword) || keyword.includes(token)).length - exactMatches
      score += partialMatches
    }

    // Check for bigrams and trigrams that might match domain concepts
    const bigrams = extractNgrams(tokens, 2)
    const trigrams = extractNgrams(tokens, 3)

    for (const keyword of keywords) {
      // Check if any bigrams or trigrams contain this keyword
      const bigramMatches = bigrams.filter((bigram) => bigram.includes(keyword)).length
      const trigramMatches = trigrams.filter((trigram) => trigram.includes(keyword)).length

      score += bigramMatches * 1.5 // Weight bigram matches
      score += trigramMatches * 2 // Weight trigram matches more heavily
    }

    // Normalize by document length to avoid bias toward longer documents
    const normalizedScore = score / Math.sqrt(tokens.length)

    if (normalizedScore > 0) {
      topicScores.set(topic, normalizedScore)
    }
  }

  return topicScores
}

/**
 * Expands tokens with semantically related words to capture broader meaning
 */
export function expandWithSemanticRelationships(tokens: string[]): string[] {
  const expandedTokens = [...tokens]

  for (const token of tokens) {
    if (SEMANTIC_RELATIONSHIPS[token]) {
      expandedTokens.push(...SEMANTIC_RELATIONSHIPS[token])
    }
  }

  return [...new Set(expandedTokens)] // Remove duplicates
}

/**
 * Creates a semantic fingerprint for a document
 * This is a vector representation that captures the semantic meaning
 */
export function createSemanticFingerprint(document: string): number[] {
  // Tokenize the document
  const tokens = tokenizeText(document)

  if (tokens.length === 0) {
    return new Array(Object.keys(DOMAIN_KEYWORDS).length).fill(0)
  }

  // Expand tokens with semantic relationships
  const expandedTokens = expandWithSemanticRelationships(tokens)

  // Identify topics in the document
  const topicScores = identifyTopics(expandedTokens)

  // Create a vector with scores for each topic domain
  const fingerprint: number[] = []

  for (const topic of Object.keys(DOMAIN_KEYWORDS)) {
    fingerprint.push(topicScores.get(topic) || 0)
  }

  // Add additional semantic features

  // Feature: Document length (normalized)
  fingerprint.push(Math.min(1, tokens.length / 1000))

  // Feature: Average word length
  const avgWordLength = tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length
  fingerprint.push(Math.min(1, avgWordLength / 10))

  // Feature: Vocabulary richness (unique words / total words)
  const uniqueTokens = new Set(tokens)
  fingerprint.push(uniqueTokens.size / tokens.length)

  // Normalize the fingerprint
  const magnitude = Math.sqrt(fingerprint.reduce((sum, val) => sum + val * val, 0))

  if (magnitude > 0) {
    return fingerprint.map((val) => val / magnitude)
  }

  return fingerprint
}

/**
 * Calculates semantic similarity between two documents
 */
export function calculateSemanticSimilarity(docA: string, docB: string): number {
  const fingerprintA = createSemanticFingerprint(docA)
  const fingerprintB = createSemanticFingerprint(docB)

  // Calculate cosine similarity between fingerprints
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < fingerprintA.length; i++) {
    dotProduct += fingerprintA[i] * fingerprintB[i]
    normA += fingerprintA[i] * fingerprintA[i]
    normB += fingerprintB[i] * fingerprintB[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Creates semantic vectors for a collection of documents
 */
export function createSemanticVectors(documents: string[]): number[][] {
  return documents.map((doc) => createSemanticFingerprint(doc))
}

/**
 * Extracts key topics from a document
 */
export function extractKeyTopics(document: string, count = 3): string[] {
  const tokens = tokenizeText(document)

  if (tokens.length === 0) return []

  // Identify topics in the document
  const topicScores = identifyTopics(expandWithSemanticRelationships(tokens))

  // Sort topics by score and return top ones
  return Array.from(topicScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map((entry) => formatTopicName(entry[0]))
}

/**
 * Formats a topic name for display
 */
function formatTopicName(topic: string): string {
  return topic
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Performs Latent Semantic Analysis (simplified version)
 * This helps identify hidden semantic structures in the document collection
 */
export function performSimplifiedLSA(documents: string[]): number[][] {
  // Create document-term matrix using semantic fingerprints
  const vectors = createSemanticVectors(documents)

  // This is a simplified version of LSA
  // In a full implementation, we would perform SVD here

  return vectors
}

/**
 * Generates a descriptive name for a cluster based on common topics
 */
export function generateClusterName(documents: string[], indices: number[]): string {
  // Extract documents in this cluster
  const clusterDocs = indices.map((idx) => documents[idx])

  // Identify topics in each document
  const allTopicScores = new Map<string, number>()

  for (const doc of clusterDocs) {
    const tokens = tokenizeText(doc)
    const expandedTokens = expandWithSemanticRelationships(tokens)
    const topicScores = identifyTopics(expandedTokens)

    // Aggregate topic scores across all documents
    for (const [topic, score] of topicScores.entries()) {
      allTopicScores.set(topic, (allTopicScores.get(topic) || 0) + score)
    }
  }

  // Find the dominant topics
  const sortedTopics = Array.from(allTopicScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((entry) => formatTopicName(entry[0]))

  if (sortedTopics.length === 0) {
    return "Miscellaneous"
  }

  return sortedTopics.join(" & ")
}
