export interface CreateRoleInput {
    name: string;
    permissionKeys?: string[];
}

export interface UpdateRoleInput {
    name?: string;
}

export interface UpdateRolePermissionsInput {
    permissionKeys: string[];
}
