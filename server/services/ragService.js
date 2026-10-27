import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { generateEmbedding, cosineSimilarity, callChatCompletion } from './openRouterService.js';

/**
 * Split text into semantic chunks with overlap
 */
export const chunkText = (text, chunkSize = 400, overlap = 50) => {
  const words = text.split(/\s+/);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunkWords = words.slice(start, end);
    chunks.push(chunkWords.join(' '));
    if (end === words.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
};

/**
 * Ingest or re-index a knowledge document into chunks and vector embeddings
 */
export const ingestKnowledgeDocument = async ({
  title,
  sourceUrl,
  sourceReference,
  documentType,
  departmentScope,
  rawText,
  uploadedBy,
}) => {
  // Check if document already exists by title
  let doc = await KnowledgeDocument.findOne({ title });
  if (doc) {
    doc.sourceUrl = sourceUrl || doc.sourceUrl;
    doc.sourceReference = sourceReference || doc.sourceReference;
    doc.documentType = documentType || doc.documentType;
    doc.departmentScope = departmentScope || doc.departmentScope;
    doc.rawText = rawText;
    doc.uploadedBy = uploadedBy || doc.uploadedBy;
    await doc.save();
    // Delete existing chunks for clean re-indexing
    await KnowledgeChunk.deleteMany({ documentId: doc._id });
  } else {
    doc = await KnowledgeDocument.create({
      title,
      sourceUrl,
      sourceReference,
      documentType,
      departmentScope: departmentScope || 'UNIVERSITY_WIDE',
      rawText,
      uploadedBy,
    });
  }

  // Chunk text
  const textChunks = chunkText(rawText, 350, 40);
  const chunkDocs = [];

  for (let i = 0; i < textChunks.length; i++) {
    const content = textChunks[i];
    const embedding = await generateEmbedding(content);

    chunkDocs.push({
      documentId: doc._id,
      documentTitle: doc.title,
      documentType: doc.documentType,
      departmentScope: doc.departmentScope,
      chunkIndex: i,
      content,
      sourceUrl: doc.sourceUrl,
      embedding,
      tokenCount: content.split(/\s+/).length,
    });
  }

  if (chunkDocs.length > 0) {
    await KnowledgeChunk.insertMany(chunkDocs);
  }

  doc.chunkCount = chunkDocs.length;
  doc.approvalStatus = 'APPROVED';
  await doc.save();

  return doc;
};

/**
 * Retrieve top relevant chunks using vector similarity or keyword fallback
 */
export const retrieveRelevantChunks = async (query, { departmentScope, topK = 4 } = {}) => {
  const queryEmbedding = await generateEmbedding(query);

  const filter = {};
  if (departmentScope && departmentScope !== 'UNIVERSITY_WIDE') {
    filter.$or = [{ departmentScope }, { departmentScope: 'UNIVERSITY_WIDE' }];
  }

  const allChunks = await KnowledgeChunk.find(filter).lean();

  if (!allChunks || allChunks.length === 0) {
    return [];
  }

  // Calculate similarity scores
  const scoredChunks = allChunks.map((chunk) => {
    let score = 0;
    if (chunk.embedding && chunk.embedding.length > 0 && queryEmbedding) {
      score = cosineSimilarity(queryEmbedding, chunk.embedding);
    } else {
      // Keyword fallback
      const queryWords = query.toLowerCase().split(/\s+/);
      const text = chunk.content.toLowerCase();
      const matches = queryWords.filter((w) => w.length > 2 && text.includes(w)).length;
      score = matches / (queryWords.length || 1);
    }
    return { ...chunk, score };
  });

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK);
};

/**
 * Ask university knowledge question using grounded RAG
 */
export const answerUniversityQuestionRAG = async (studentQuery, { departmentScope, userRole = 'STUDENT' } = {}) => {
  const relevantChunks = await retrieveRelevantChunks(studentQuery, { departmentScope, topK: 4 });

  // If no chunks or similarity is too low
  const contextPassages = relevantChunks
    .map((chunk, idx) => `[Source ${idx + 1}: ${chunk.documentTitle}] (Reference: ${chunk.sourceUrl || 'Official University Documentation'})\n${chunk.content}`)
    .join('\n\n');

  const sources = relevantChunks.map((c) => ({
    title: c.documentTitle,
    documentType: c.documentType,
    url: c.sourceUrl || '',
    relevanceScore: Math.round((c.score || 0) * 100) / 100,
  }));

  try {
    const systemPrompt = `You are the South Eastern University of Sri Lanka (SEUSL) Campus Policy & Knowledge Assistant.
Answer the student's question accurately using ONLY the provided official university knowledge sources below.
RULES:
1. Ground your answer strictly on the provided sources. Do not invent university policies, contact numbers, or staff names.
2. If the answer cannot be determined or verified from the provided context, state clearly: "This information is not covered in the current official university student handbook or verified regulations. Please contact the Student Support Services and Welfare (SSSW) or your faculty office directly."
3. Include references to the relevant source titles.
4. Keep answers friendly, respectful, clear, and actionable.`;

    const userPrompt = `Student Question: ${studentQuery}\n\nOfficial University Knowledge Context:\n${contextPassages || 'No matching policy documents found.'}`;

    const answer = await callChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return {
      answer,
      sources,
      isGrounded: relevantChunks.length > 0,
      retrievedChunksCount: relevantChunks.length,
    };
  } catch (err) {
    // Fallback answer when OpenRouter is offline
    if (relevantChunks.length > 0) {
      return {
        answer: `According to **${relevantChunks[0].documentTitle}**:\n\n${relevantChunks[0].content.slice(0, 400)}...\n\n*(Full verified document available in University Knowledge Centre)*`,
        sources,
        isGrounded: true,
        retrievedChunksCount: relevantChunks.length,
      };
    }

    return {
      answer: "I am unable to retrieve verified university policies for this query at the moment. Please refer to the official South Eastern University of Sri Lanka website (https://www.seu.ac.lk/) or visit your Faculty Dean's Office / Student Support Services and Welfare division.",
      sources: [],
      isGrounded: false,
      retrievedChunksCount: 0,
    };
  }
};
