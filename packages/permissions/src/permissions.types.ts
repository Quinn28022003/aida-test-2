import type { MongoAbility } from '@casl/ability';
import type { PermissionKeys } from '@aida/contracts';

/** Catalogue permission key (`subject.action`) from `@aida/contracts`. */
export type Permission = PermissionKeys | (string & {});

/** CASL action parsed from a catalogue key (e.g. `read`, `create`, `invoke`). */
export type PermissionAction = string;

/** CASL subject parsed from a catalogue key (e.g. `conversation`, `message`, `agent`). */
export type PermissionSubject = string;

/** @deprecated Use `PermissionSubject`. */
export type PermissionResource = PermissionSubject;

/** CASL rules use parsed action + subject, not the raw permission key. */
export type AppAbility = MongoAbility<[PermissionAction, PermissionSubject]>;

export type PermissionPayload = {
  permissions: readonly string[];
};

export type DenialReasonCode = 'missing_permission';

export type DenialReason = {
  code: DenialReasonCode;
  action: PermissionAction;
  subject: PermissionSubject;
  message: string;
};
