import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getPool } from "./pool";

export { getPool, closePool } from "./pool";

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export type ExecuteResult = {
  affectedRows: number;
  insertId: number;
};

export async function execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
  const [result] = await getPool().query<ResultSetHeader>(sql, params);
  return { affectedRows: result.affectedRows, insertId: result.insertId };
}
