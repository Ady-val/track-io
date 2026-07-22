import type {
  AnalyzeInsightsParams,
  InsightAnalysisResponse,
  InsightAnalysisResult,
  InsightsHealth,
} from "@/types/insights";

import apiClient from "../api";

// La llamada agrega eventos + invoca el modelo de IA: puede tardar varios
// segundos, más que el timeout por defecto del cliente (10s).
const ANALYZE_TIMEOUT_MS = 60000;

class InsightsService {
  private readonly baseUrl = "/insights";

  async analyze(params: AnalyzeInsightsParams): Promise<InsightAnalysisResult> {
    const response = await apiClient.post<InsightAnalysisResponse>(
      `${this.baseUrl}/analyze`,
      params,
      { timeout: ANALYZE_TIMEOUT_MS }
    );

    return response.data.data;
  }

  async getHealth(): Promise<InsightsHealth> {
    const response = await apiClient.get<InsightsHealth>(
      `${this.baseUrl}/health`
    );

    return response.data;
  }
}

const insightsService = new InsightsService();

export default insightsService;
