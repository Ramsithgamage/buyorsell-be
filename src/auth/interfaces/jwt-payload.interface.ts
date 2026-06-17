export interface JwtPayload {
  sub?: number;
  email?: string;
  guestId?: string;
  type: 'guest' | 'access' | 'refresh';
}