import { HttpStatus } from "@nestjs/common";
import { Restaurant } from './../../../modules/resto/schema/resto.schema';

// Generic CRUD Response interface
export interface CrudResponse<T> {
  status: HttpStatus;
  data: {
    message?: string;
    error?: string;
    result?: T | T[];
    count?: number;
  };
}

// Specific Restaurant CRUD Response interfaces
export interface RestaurantResponse extends CrudResponse<Restaurant> {
  data: {
    message?: string;
    error?: string;
    result?: Restaurant;
  };
}

export interface RestaurantsResponse extends CrudResponse<Restaurant> {
  data: {
    message?: string;
    error?: string;
    result?: Restaurant[];
    count?: number;
  };
}

// Optional: Specific response interfaces for different operations
export interface CreateRestaurantResponse extends RestaurantResponse {}

export interface UpdateRestaurantResponse extends RestaurantResponse {}

export interface DeleteRestaurantResponse {
  status: HttpStatus;
  data: {
    message?: string;
    error?: string;
    deleted?: boolean;
  };
}
