// Stubs for bcrypt in frontend
export interface SaltOptions {
  rounds?: number;
  minor?: string;
}

export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string> {
  return Promise.resolve('hashed_password');
}

export function hashSync(data: string | Buffer, saltOrRounds: string | number): string {
  return 'hashed_password';
}

export function compare(data: string | Buffer, encrypted: string): Promise<boolean> {
  return Promise.resolve(true);
}

export function compareSync(data: string | Buffer, encrypted: string): boolean {
  return true;
}

export function genSalt(rounds?: number): Promise<string> {
  return Promise.resolve('salt');
}

export function genSaltSync(rounds?: number): string {
  return 'salt';
}

export function getRounds(encrypted: string): number {
  return 10;
}
