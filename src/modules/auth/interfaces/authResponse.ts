import { HttpStatus } from "@nestjs/common";

export interface AuthResponse {
  status: HttpStatus;
  data: {
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  };
}


