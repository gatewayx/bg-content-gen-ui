import { supabase } from '../lib/supabase';

export interface TableRow {
  id?: string;
  created_at?: string;
  user_id: string;
  [key: string]: any;
}

export async function createRow(tableName: string, data: Omit<TableRow, 'id' | 'created_at'>) {
  try {
    const { data: row, error } = await supabase
      .from(tableName)
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return row;
  } catch (error) {
    console.error(`Error creating row in ${tableName}:`, error);
    throw error;
  }
}

export async function getRows(tableName: string, query: string = '*') {
  try {
    const { data: rows, error } = await supabase
      .from(tableName)
      .select(query);

    if (error) throw error;
    return rows;
  } catch (error) {
    console.error(`Error getting rows from ${tableName}:`, error);
    throw error;
  }
}

export async function getRowById(tableName: string, id: string) {
  try {
    const { data: row, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return row;
  } catch (error) {
    console.error(`Error getting row from ${tableName}:`, error);
    throw error;
  }
}

export async function updateRow(tableName: string, id: string, data: Partial<TableRow>) {
  try {
    const { data: row, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return row;
  } catch (error) {
    console.error(`Error updating row in ${tableName}:`, error);
    throw error;
  }
}

export async function deleteRow(tableName: string, id: string) {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting row from ${tableName}:`, error);
    throw error;
  }
} 