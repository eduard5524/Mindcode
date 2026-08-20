import { v4 as uuid } from "uuid";

export function newId(): string {
  return uuid();
}
