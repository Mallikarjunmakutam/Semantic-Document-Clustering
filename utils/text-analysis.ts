/**
 * Text analysis utilities for document clustering
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

/**
 * Tokenizes and cleans text for analysis
 */
export function tokenizeText(text: string): string[] {
  // Convert to lowercase and replace non-alphanumeric with spaces
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ")

  // Split by whitespace and filter out stop words and short words
  return normalized.split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word))
}

/**
 * Extracts term frequency (TF) from a document
 */
export function extractTermFrequency(tokens: string[]): Map<string, number> {
  const termFreq = new Map<string, number>()

  for (const token of tokens) {
    termFreq.set(token, (termFreq.get(token) || 0) + 1)
  }

  return termFreq
}

/**
 * Calculates TF-IDF vectors for a collection of documents
 */
export function calculateTfIdfVectors(documents: string[]): number[][] {
  // Step 1: Tokenize all documents
  const tokenizedDocs = documents.map((doc) => tokenizeText(doc))

  // Step 2: Build vocabulary (all unique terms across documents)
  const vocabulary = new Set<string>()
  tokenizedDocs.forEach((tokens) => {
    tokens.forEach((token) => vocabulary.add(token))
  })

  // Create a mapping from term to index in the vector
  const termToIndex = new Map<string, number>()
  Array.from(vocabulary).forEach((term, index) => {
    termToIndex.set(term, index)
  })

  // Step 3: Calculate document frequencies (DF) for each term
  const docFrequencies = new Map<string, number>()
  tokenizedDocs.forEach((tokens) => {
    // Count each term only once per document
    const uniqueTerms = new Set(tokens)
    uniqueTerms.forEach((term) => {
      docFrequencies.set(term, (docFrequencies.get(term) || 0) + 1)
    })
  })

  // Step 4: Calculate TF-IDF vectors for each document
  const vectors: number[][] = []
  const totalDocs = documents.length

  tokenizedDocs.forEach((tokens) => {
    // Initialize vector with zeros
    const vector = new Array(vocabulary.size).fill(0)

    // Calculate term frequencies for this document
    const termFreq = extractTermFrequency(tokens)

    // Calculate TF-IDF for each term in the document
    termFreq.forEach((freq, term) => {
      const termIndex = termToIndex.get(term)
      if (termIndex !== undefined) {
        // TF = term frequency in this document
        const tf = freq / tokens.length

        // IDF = log(total docs / number of docs containing the term)
        const df = docFrequencies.get(term) || 1
        const idf = Math.log(totalDocs / df)

        // TF-IDF = TF * IDF
        vector[termIndex] = tf * idf
      }
    })

    vectors.push(vector)
  })

  return vectors
}

/**
 * Calculates cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Calculates Euclidean distance between two vectors
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
  let sum = 0

  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

/**
 * Extracts key terms from a document using TF-IDF
 */
export function extractKeyTerms(document: string, allDocuments: string[], count = 5): string[] {
  const tokens = tokenizeText(document)
  if (tokens.length === 0) return []

  // Calculate term frequencies for this document
  const termFreq = extractTermFrequency(tokens)

  // Calculate document frequencies
  const docFrequencies = new Map<string, number>()
  allDocuments.forEach((doc) => {
    const docTokens = new Set(tokenizeText(doc))
    docTokens.forEach((term) => {
      if (termFreq.has(term)) {
        docFrequencies.set(term, (docFrequencies.get(term) || 0) + 1)
      }
    })
  })

  // Calculate TF-IDF scores
  const tfidfScores: [string, number][] = []
  const totalDocs = allDocuments.length

  termFreq.forEach((freq, term) => {
    const tf = freq / tokens.length
    const df = docFrequencies.get(term) || 1
    const idf = Math.log(totalDocs / df)
    tfidfScores.push([term, tf * idf])
  })

  // Sort by score and return top terms
  return tfidfScores
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map((item) => item[0])
}
