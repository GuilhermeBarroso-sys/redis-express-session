interface UserSession {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
declare namespace Express {
  export interface Request {
    session: UserSession | null;
  }
}
