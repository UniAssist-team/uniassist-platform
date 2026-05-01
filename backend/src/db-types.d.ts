import type { Knex } from "knex";

export type Role = "student" | "staff" | "admin";

export interface UserRow {
	id: string;
	email: string;
	password_hash: string;
	role: Role;
	created_at: string;
	name: string | null;
}

export interface UserInsert {
	id: string;
	email: string;
	password_hash: string;
	role?: Role;
	created_at?: string;
	name?: string | null;
}

export interface UserUpdate {
	email?: string;
	password_hash?: string;
	role?: Role;
	name?: string | null;
}

export interface SessionRow {
	id: string;
	user_id: string;
	token: string;
	expires_at: string;
	created_at: string;
}

export interface SessionInsert {
	id: string;
	user_id: string;
	token: string;
	expires_at: string;
	created_at?: string;
}

export interface DocumentRow {
	id: string;
	user_id: string;
	filename: string;
	storage_path: string;
	uploaded_at: string;
	matches: string;
}

export interface DocumentInsert {
	id: string;
	user_id: string;
	filename: string;
	storage_path: string;
	uploaded_at?: string;
	matches?: string;
}

export interface DiscountRow {
	id: string;
	name: string;
	description: string;
	required_documents: string;
	benefits: string;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ApplicationRow {
	id: string;
	user_id: string;
	discount_id: string;
	status: ApplicationStatus;
	reviewed_by: string | null;
	review_note: string | null;
	created_at: string;
	updated_at: string;
}

export interface ApplicationInsert {
	id: string;
	user_id: string;
	discount_id: string;
	status?: ApplicationStatus;
	reviewed_by?: string | null;
	review_note?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface ApplicationUpdate {
	status?: ApplicationStatus;
	reviewed_by?: string | null;
	review_note?: string | null;
	updated_at?: string;
}

export interface ApplicationDocumentRow {
	application_id: string;
	document_id: string;
}

declare module "knex/types/tables" {
	interface Tables {
		users: Knex.CompositeTableType<UserRow, UserInsert, UserUpdate>;
		sessions: Knex.CompositeTableType<SessionRow, SessionInsert>;
		documents: Knex.CompositeTableType<DocumentRow, DocumentInsert>;
		discounts: DiscountRow;
		applications: Knex.CompositeTableType<
			ApplicationRow,
			ApplicationInsert,
			ApplicationUpdate
		>;
		application_documents: ApplicationDocumentRow;
	}
}
