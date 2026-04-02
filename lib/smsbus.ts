const BASE_URL = "https://sms-bus.com/api/control";
const API_KEY = process.env.SMSBUS_API_KEY!;

interface SmsBusResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

async function request<T>(endpoint: string, params: Record<string, string> = {}): Promise<SmsBusResponse<T>> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("token", API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  return res.json();
}

export interface Country {
  id: number;
  title: string;
  code: string;
}

export interface Project {
  id: number;
  title: string;
  code: string;
}

export interface PriceInfo {
  country_id: number;
  project_id: number;
  cost: number;
  total_count: number;
  title: string;
  code: string;
}

export interface NumberInfo {
  request_id: number;
  number: string;
}

export const smsbus = {
  async getBalance() {
    return request<{ frozen: number; balance: number }>("get/balance");
  },

  async getCountries() {
    return request<Record<string, Country>>("list/countries");
  },

  async getProjects() {
    return request<Record<string, Project>>("list/projects");
  },

  async getPrices(countryId: number) {
    return request<Record<string, PriceInfo>>("list/prices", {
      country_id: countryId.toString(),
    });
  },

  async getNumber(countryId: number, projectId: number) {
    return request<NumberInfo>("get/number", {
      country_id: countryId.toString(),
      project_id: projectId.toString(),
    });
  },

  async getSms(requestId: string) {
    return request<string>("get/sms", { request_id: requestId });
  },

  async cancelRequest(requestId: string) {
    return request("cancel", { request_id: requestId });
  },

  async reuseNumber(countryId: number, projectId: number, mobileNumber: string) {
    return request<NumberInfo>("reuse", {
      country_id: countryId.toString(),
      project_id: projectId.toString(),
      mobile_number: mobileNumber,
    });
  },
};
