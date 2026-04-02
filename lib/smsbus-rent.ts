const RENT_BASE = "https://api.sms-bus.com/v1/rent";
const API_KEY = process.env.SMSBUS_API_KEY!;

interface RentResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

async function rentRequest<T>(path: string, params: Record<string, string> = {}): Promise<RentResponse<T>> {
  const url = new URL(`${RENT_BASE}/${path}`);
  url.searchParams.set("token", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  return res.json();
}

export type RentalArea = {
  area_code: string;
  area_title: string;
  unit_price: number;
  min_month: number;
  total: number;
};

export type RentNumberResult = {
  order_id: string;
  mobile_number: string;
  dialing_code: string;
  area_code: string;
  expire_at: string;
  keep_at: string;
};

export type RentedNumberRow = {
  area_code: string;
  area_name: string;
  dialing_code: string;
  mobile_number: string;
  first_seen_at: string;
  expire_at: string;
  keep_at: string;
  auto_renew: boolean;
  sms_link: string;
  allow_link: boolean;
};

export type RentalOrderRow = {
  order_id: string;
  area_code: string;
  area_name: string;
  dialing_code: string;
  mobile_number: string;
  rent_month: number;
  amount: number;
  status: string;
  order_at: string;
  begin_at: string;
  expire_at: string;
  keep_at: string;
};

export type Paginated<T> = {
  page_num: number;
  page_size: number;
  total_page: number;
  total: number;
  list: T[];
};

export const smsbusRent = {
  listAreas() {
    return rentRequest<RentalArea[]>("list/area");
  },

  getNumber(areaCode: string, months: number) {
    return rentRequest<RentNumberResult>("get/number", {
      area_code: areaCode,
      time: String(months),
    });
  },

  renew(areaCode: string, mobileNumber: string, months: number) {
    return rentRequest<RentNumberResult>("renew/number", {
      area_code: areaCode,
      mobile_number: mobileNumber,
      time: String(months),
    });
  },

  cancelOrder(orderId: string) {
    return rentRequest<string>("cancel/order", { order_id: orderId });
  },

  listNumbers(params: {
    area_code?: string;
    mobile_number?: string;
    only_active?: boolean;
    page_num?: number;
    page_size?: number;
  }) {
    const q: Record<string, string> = {};
    if (params.area_code) q.area_code = params.area_code;
    if (params.mobile_number) q.mobile_number = params.mobile_number;
    if (params.only_active !== undefined) q.only_active = String(params.only_active);
    q.page_num = String(params.page_num ?? 1);
    q.page_size = String(Math.min(params.page_size ?? 20, 500));
    return rentRequest<Paginated<RentedNumberRow>>("list/number", q);
  },

  listOrders(params: {
    area_code?: string;
    mobile_number?: string;
    page_num?: number;
    page_size?: number;
  }) {
    const q: Record<string, string> = {};
    if (params.area_code) q.area_code = params.area_code;
    if (params.mobile_number) q.mobile_number = params.mobile_number;
    q.page_num = String(params.page_num ?? 1);
    q.page_size = String(Math.min(params.page_size ?? 20, 500));
    return rentRequest<Paginated<RentalOrderRow>>("list/order", q);
  },

  getLatestSms(areaCode: string, mobileNumber: string) {
    return rentRequest<{ content: string; receive_at: string }>("get/sms", {
      area_code: areaCode,
      mobile_number: mobileNumber,
    });
  },

  listSms(
    areaCode: string,
    mobileNumber: string,
    page_num = 1,
    page_size = 20
  ) {
    return rentRequest<Paginated<{ content: string; receive_at: string }>>("list/sms", {
      area_code: areaCode,
      mobile_number: mobileNumber,
      page_num: String(page_num),
      page_size: String(Math.min(page_size, 500)),
    });
  },

  changeLinkStatus(areaCode: string, mobileNumber: string, status: boolean) {
    return rentRequest<boolean>("change/link/status", {
      area_code: areaCode,
      mobile_number: mobileNumber,
      status: String(status),
    });
  },
};
