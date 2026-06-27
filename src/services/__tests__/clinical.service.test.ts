import apiClient from "../../api/client";
import {
  getClinicalProfile,
  getClinicalReadings,
  postClinicalReading,
  updateAiConsent,
  updateClinicalProfile,
} from "../clinical.service";

jest.mock("../../api/client", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

describe("clinical.service", () => {
  const mockToken = "test-token";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Perfil ────────────────────────────────────────────────────────────────

  it("debe obtener el perfil clínico con enums string (respuesta plana)", async () => {
    const profile = {
      bloodType: "O",
      rhFactor: "Positive",
      hasGlucose: true,
      hasDyslipidemia: false,
      allowAiUsage: false,
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: profile });

    const result = await getClinicalProfile(mockToken);

    expect(apiClient.get).toHaveBeenCalledWith("/api/clinical/profile", {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    expect(result).toEqual(profile);
  });

  it("debe desenvolver el perfil cuando viene en { data }", async () => {
    const profile = {
      bloodType: null,
      rhFactor: null,
      hasGlucose: false,
      hasDyslipidemia: false,
      allowAiUsage: false,
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: profile } });

    const result = await getClinicalProfile(mockToken);
    expect(result).toEqual(profile);
  });

  it("debe actualizar el perfil enviando el payload sin allowAiUsage", async () => {
    const payload = {
      bloodType: "O" as const,
      rhFactor: "Positive" as const,
      hasGlucose: true,
      hasDyslipidemia: false,
    };
    const updated = { ...payload, allowAiUsage: false };
    (apiClient.put as jest.Mock).mockResolvedValue({ data: updated });

    const result = await updateClinicalProfile(payload, mockToken);

    expect(apiClient.put).toHaveBeenCalledWith(
      "/api/clinical/profile",
      payload,
      { headers: { Authorization: `Bearer ${mockToken}` } },
    );
    expect(result).toEqual(updated);
  });

  it("debe enviar el consentimiento de IA como { enabled }", async () => {
    const updated = {
      bloodType: null,
      rhFactor: null,
      hasGlucose: false,
      hasDyslipidemia: false,
      allowAiUsage: true,
    };
    (apiClient.put as jest.Mock).mockResolvedValue({ data: updated });

    const result = await updateAiConsent(true, mockToken);

    expect(apiClient.put).toHaveBeenCalledWith(
      "/api/clinical/ai-consent",
      { enabled: true },
      { headers: { Authorization: `Bearer ${mockToken}` } },
    );
    expect(result.allowAiUsage).toBe(true);
  });

  // ─── Lecturas ────────────────────────────────────────────────────────────────

  it("debe registrar una lectura con solo los campos cargados", async () => {
    const payload = { glucoseMgDl: 110 };
    const created = {
      id: "f3a1-guid",
      date: "2026-06-24",
      capturedAt: "2026-06-24T23:33:29.123Z",
      glucoseMgDl: 110,
      totalCholesterolMgDl: null,
      hdlMgDl: null,
      ldlMgDl: null,
      triglyceridesMgDl: null,
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: created });

    const result = await postClinicalReading(payload, mockToken);

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/clinical/readings",
      payload,
      { headers: { Authorization: `Bearer ${mockToken}` } },
    );
    expect(result).toEqual(created);
  });

  it("debe normalizar el historial paginado (respuesta plana)", async () => {
    const paged = {
      page: 1,
      pageSize: 10,
      totalCount: 23,
      items: [
        {
          id: "f3a1-guid",
          date: "2026-06-24",
          capturedAt: "2026-06-24T23:33:29.123Z",
          glucoseMgDl: 110,
          totalCholesterolMgDl: null,
          hdlMgDl: null,
          ldlMgDl: null,
          triglyceridesMgDl: null,
        },
      ],
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: paged });

    const result = await getClinicalReadings(mockToken, 1, 10);

    expect(apiClient.get).toHaveBeenCalledWith("/api/clinical/readings", {
      params: { page: 1, pageSize: 10 },
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    expect(result).toEqual(paged);
  });

  it("debe desenvolver el historial cuando viene en { data } y tolerar items ausentes", async () => {
    const paged = { page: 2, pageSize: 5, totalCount: 0 };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: paged } });

    const result = await getClinicalReadings(mockToken, 2, 5);

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(5);
    expect(result.totalCount).toBe(0);
    expect(result.items).toEqual([]);
  });
});
