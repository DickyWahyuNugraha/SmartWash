/**
 * Auth-related types for admin and user
 */

export interface Admin {
  id: string;  
  email: string;
  fullName: string;
  password: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  catName: string;
  catType: string;
  age: number;
  ageUnit: "weeks" | "months" | "years";
  weight: number;
  password: string;
  createdAt: string;
  tipeBulu?: number;
  furType?: string;
  gender?: "jantan" | "betina";
}

export interface Session {
  id: string;
  type: "admin" | "user";
  email?: string;
  catName?: string;
}
