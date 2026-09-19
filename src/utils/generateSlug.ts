import crypto from 'node:crypto';

export function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const suffix = crypto.randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
}
