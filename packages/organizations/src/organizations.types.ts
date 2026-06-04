import type {
  IOrganizationsContextService,
  IOrganizationsRepository,
  IOrganizationsService,
} from "@aida/contracts";
import type { Database } from "@aida/db";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OrganizationsSupabaseClient = SupabaseClient<Database>;

export type OrganizationsRepository = IOrganizationsRepository<OrganizationsSupabaseClient>;

export type OrganizationsService = IOrganizationsService;

export type OrganizationsContextService = IOrganizationsContextService;
