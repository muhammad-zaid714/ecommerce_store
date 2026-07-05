import type {userRole} from '../db/schema.js';
const VALID: readonly userRole[] = ['customer', 'admin','support']; 
export function parseRole(value: unknown){
    if(typeof value ==='string'&&(VALID as readonly string[]).includes(value)){
        return value as userRole;
    }
    return 'customer';
}
export function isAdmin(role:userRole){
    return role === 'admin';
}
export function isStaff(role:userRole){
    return role === 'admin' || role === 'support';
}