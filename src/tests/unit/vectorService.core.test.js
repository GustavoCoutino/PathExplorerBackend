jest.mock("@langchain/openai");
jest.mock("node-cache");

const { OpenAIEmbeddings } = require("@langchain/openai");
const NodeCache = require("node-cache");

const mockEmbeddings = {
  embedQuery: jest.fn(),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

OpenAIEmbeddings.mockImplementation(() => mockEmbeddings);
NodeCache.mockImplementation(() => mockCache);

const {
  cosineSimilarity,
  invalidateUserVectorCache,
} = require("../../services/vectorService");

describe("vectorService - Core Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cosineSimilarity", () => {
    test("should calculate cosine similarity correctly for identical vectors", () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];

      const result = cosineSimilarity(vecA, vecB);

      expect(result).toBe(1);
    });

    test("should calculate cosine similarity correctly for orthogonal vectors", () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];

      const result = cosineSimilarity(vecA, vecB);

      expect(result).toBe(0);
    });

    test("should calculate cosine similarity correctly for opposite vectors", () => {
      const vecA = [1, 0, 0];
      const vecB = [-1, 0, 0];

      const result = cosineSimilarity(vecA, vecB);

      expect(result).toBe(-1);
    });

    test("should handle vectors with different magnitudes", () => {
      const vecA = [3, 4];
      const vecB = [4, 3];

      const result = cosineSimilarity(vecA, vecB);

      // (3*4 + 4*3) / (5 * 5) = 24/25 = 0.96
      expect(result).toBeCloseTo(0.96, 2);
    });
  });

  describe("invalidateUserVectorCache", () => {
    test("should call cache.del with correct key", () => {
      const id_persona = 2;

      invalidateUserVectorCache(id_persona);

      expect(mockCache.del).toHaveBeenCalledWith(`user_vector_${id_persona}`);
    });
  });
});
