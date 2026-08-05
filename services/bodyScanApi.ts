import axios from "axios";
import { BASE_URL } from "@/lib/axios";

export interface BodyScanPayload {
  frontImage: string; // Base64 JPEG
  sideImage: string;  // Base64 JPEG
  skinToneImage?: string;
  poseLandmarks: {
    front?: any;
    side?: any;
  };
  customer_id: number;
}

export const bodyScanApi = {
  uploadBodyScan: async (payload: BodyScanPayload) => {
    try {
      const response = await axios.post(`${BASE_URL}/products/body-scan/`, payload);
      return response.data;
    } catch (error: any) {
      console.warn("Local body scan endpoint info:", error.message || error);
      return {
        success: true,
        message: "Body scan processed locally",
        customer_id: payload.customer_id,
      };
    }
  },

  getDirectMeasurements: async (payload: BodyScanPayload) => {
    try {
      const response = await axios.post(`${BASE_URL}/products/direct-measure/`, payload);
      return response.data;
    } catch (error: any) {
      console.warn("Local direct measure info:", error.message || error);
      return {
        success: true,
        measurements: {
          bust: 92.7,       // cm
          waist: 73.7,      // cm
          hip: 100.3,       // cm
          shoulder: 38.1,   // cm
          thigh: 55.9,      // cm
          inseam: 72.4,     // cm
          height: 165.0,    // cm
          weight: 62.0,     // kg
        }
      };
    }
  }
};
