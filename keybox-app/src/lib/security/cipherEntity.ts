// Cipher entity implementation following Bitwarden's approach
// Handles encrypted storage and retrieval of password entries with proper metadata

import { 
  EncryptedCipher, 
  EncryptedString, 
  UserKey, 
  EncryptionType 
} from './types';
import { WebCryptoService } from './cryptoService';
import { PasswordEntry, CustomField } from '../../types/password';

export enum CipherType {
  PASSWORD = 0,
  NOTE = 1,
  CARD = 2,
  IDENTITY = 3,
  SECURE_NOTE = 4,
}

export enum CipherRepromptType {
  NONE = 0,
  PASSWORD = 1,
}

export interface CipherData {
  // Common fields for all cipher types
  name?: string;
  notes?: string;
  
  // Password-specific fields
  username?: string;
  password?: string;
  uris?: CipherUri[];
  
  // Card-specific fields
  cardholderName?: string;
  brand?: string;
  number?: string;
  expMonth?: string;
  expYear?: string;
  code?: string;
  
  // Identity-specific fields
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  company?: string;
  email?: string;
  phone?: string;
  ssn?: string;
  licenseNumber?: string;
  passportNumber?: string;
  
  // Custom fields
  customFields?: CustomField[];
}

export interface CipherUri {
  uri?: string;
  match?: UriMatchType;
}

export enum UriMatchType {
  DOMAIN = 0,
  HOST = 1,
  STARTS_WITH = 2,
  EXACT = 3,
  REGEX = 4,
  NEVER = 5,
}

export interface CipherAttachment {
  id: string;
  fileName: string;
  size: number;
  sizeName: string;
  key?: EncryptedString;
  url?: string;
}

export class Cipher {
  id: string;
  organizationId?: string;
  folderId?: string;
  type: CipherType;
  name: EncryptedString;
  notes?: EncryptedString;
  favorite: boolean;
  reprompt: CipherRepromptType;
  data: EncryptedString;
  attachments?: { [id: string]: CipherAttachment };
  key?: EncryptedString;
  creationDate: Date;
  revisionDate: Date;
  deletedDate?: Date;

  private cryptoService: WebCryptoService;

  constructor(data: Partial<Cipher> = {}) {
    this.id = data.id || this.generateId();
    this.organizationId = data.organizationId;
    this.folderId = data.folderId;
    this.type = data.type || CipherType.PASSWORD;
    this.name = data.name || { encryptionType: EncryptionType.AES_GCM_256, data: '' };
    this.notes = data.notes;
    this.favorite = data.favorite || false;
    this.reprompt = data.reprompt || CipherRepromptType.NONE;
    this.data = data.data || { encryptionType: EncryptionType.AES_GCM_256, data: '' };
    this.attachments = data.attachments;
    this.key = data.key;
    this.creationDate = data.creationDate || new Date();
    this.revisionDate = data.revisionDate || new Date();
    this.deletedDate = data.deletedDate;

    this.cryptoService = WebCryptoService.getInstance();
  }

  // Create cipher from password entry
  static async fromPasswordEntry(entry: PasswordEntry, userKey: UserKey): Promise<Cipher> {
    const cipher = new Cipher({
      id: entry.id,
      type: CipherType.PASSWORD,
      favorite: entry.isFavorite,
      creationDate: new Date(entry.createdAt),
      revisionDate: new Date(entry.updatedAt),
    });

    await cipher.encryptFromPasswordEntry(entry, userKey);
    return cipher;
  }

  // Convert to password entry
  async toPasswordEntry(userKey: UserKey): Promise<PasswordEntry> {
    const decryptedName = await this.cryptoService.decrypt(this.name, userKey.key);
    const decryptedData = await this.cryptoService.decrypt(this.data, userKey.key);
    const cipherData: CipherData = JSON.parse(decryptedData);

    let decryptedNotes = '';
    if (this.notes) {
      decryptedNotes = await this.cryptoService.decrypt(this.notes, userKey.key);
    }

    return {
      id: this.id,
      title: decryptedName,
      categoryId: this.folderId || 'default',
      username: cipherData.username || '',
      password: cipherData.password || '',
      website: cipherData.uris?.[0]?.uri || '',
      description: '', // Legacy field
      notes: decryptedNotes,
      customFields: cipherData.customFields || [],
      tags: [], // Would need to be handled separately
      createdAt: this.creationDate.toISOString(),
      updatedAt: this.revisionDate.toISOString(),
      isFavorite: this.favorite,
    };
  }

  // Encrypt cipher data from password entry
  private async encryptFromPasswordEntry(entry: PasswordEntry, userKey: UserKey): Promise<void> {
    // Encrypt name
    this.name = await this.cryptoService.encrypt(
      entry.title,
      userKey.key,
      EncryptionType.AES_GCM_256
    );

    // Prepare cipher data
    const cipherData: CipherData = {
      username: entry.username,
      password: entry.password,
      uris: entry.website ? [{ uri: entry.website, match: UriMatchType.DOMAIN }] : [],
      customFields: entry.customFields,
    };

    // Encrypt cipher data
    this.data = await this.cryptoService.encrypt(
      JSON.stringify(cipherData),
      userKey.key,
      EncryptionType.AES_GCM_256
    );

    // Encrypt notes if present
    if (entry.notes) {
      this.notes = await this.cryptoService.encrypt(
        entry.notes,
        userKey.key,
        EncryptionType.AES_GCM_256
      );
    }

    this.revisionDate = new Date();
  }

  // Update cipher from password entry
  async updateFromPasswordEntry(entry: PasswordEntry, userKey: UserKey): Promise<void> {
    await this.encryptFromPasswordEntry(entry, userKey);
  }

  // Clone cipher
  clone(): Cipher {
    return new Cipher({
      id: this.id,
      organizationId: this.organizationId,
      folderId: this.folderId,
      type: this.type,
      name: { ...this.name },
      notes: this.notes ? { ...this.notes } : undefined,
      favorite: this.favorite,
      reprompt: this.reprompt,
      data: { ...this.data },
      attachments: this.attachments ? { ...this.attachments } : undefined,
      key: this.key ? { ...this.key } : undefined,
      creationDate: new Date(this.creationDate),
      revisionDate: new Date(this.revisionDate),
      deletedDate: this.deletedDate ? new Date(this.deletedDate) : undefined,
    });
  }

  // Generate new ID
  private generateId(): string {
    return crypto.randomUUID();
  }

  // Set new ID (for cloning/copying)
  setNewId(): void {
    this.id = this.generateId();
    this.creationDate = new Date();
    this.revisionDate = new Date();
  }

  // Check if cipher is deleted
  isDeleted(): boolean {
    return this.deletedDate !== undefined;
  }

  // Soft delete cipher
  delete(): void {
    this.deletedDate = new Date();
    this.revisionDate = new Date();
  }

  // Restore deleted cipher
  restore(): void {
    this.deletedDate = undefined;
    this.revisionDate = new Date();
  }

  // Add attachment
  addAttachment(attachment: CipherAttachment): void {
    if (!this.attachments) {
      this.attachments = {};
    }
    this.attachments[attachment.id] = attachment;
    this.revisionDate = new Date();
  }

  // Remove attachment
  removeAttachment(attachmentId: string): void {
    if (this.attachments && this.attachments[attachmentId]) {
      delete this.attachments[attachmentId];
      this.revisionDate = new Date();
    }
  }

  // Get attachment by ID
  getAttachment(attachmentId: string): CipherAttachment | undefined {
    return this.attachments?.[attachmentId];
  }

  // Get all attachments
  getAttachments(): CipherAttachment[] {
    return this.attachments ? Object.values(this.attachments) : [];
  }

  // Check if cipher has attachments
  hasAttachments(): boolean {
    return this.attachments && Object.keys(this.attachments).length > 0;
  }

  // Validate cipher data
  validate(): string[] {
    const errors: string[] = [];

    if (!this.id) {
      errors.push('Cipher ID is required');
    }

    if (!this.name || !this.name.data) {
      errors.push('Cipher name is required');
    }

    if (!this.data || !this.data.data) {
      errors.push('Cipher data is required');
    }

    if (!this.creationDate) {
      errors.push('Creation date is required');
    }

    if (!this.revisionDate) {
      errors.push('Revision date is required');
    }

    return errors;
  }

  // Convert to JSON for storage
  toJSON(): any {
    return {
      id: this.id,
      organizationId: this.organizationId,
      folderId: this.folderId,
      type: this.type,
      name: this.name,
      notes: this.notes,
      favorite: this.favorite,
      reprompt: this.reprompt,
      data: this.data,
      attachments: this.attachments,
      key: this.key,
      creationDate: this.creationDate.toISOString(),
      revisionDate: this.revisionDate.toISOString(),
      deletedDate: this.deletedDate?.toISOString(),
    };
  }

  // Create from JSON
  static fromJSON(json: any): Cipher {
    return new Cipher({
      id: json.id,
      organizationId: json.organizationId,
      folderId: json.folderId,
      type: json.type,
      name: json.name,
      notes: json.notes,
      favorite: json.favorite,
      reprompt: json.reprompt,
      data: json.data,
      attachments: json.attachments,
      key: json.key,
      creationDate: new Date(json.creationDate),
      revisionDate: new Date(json.revisionDate),
      deletedDate: json.deletedDate ? new Date(json.deletedDate) : undefined,
    });
  }
}

// Cipher collection for managing multiple ciphers
export class CipherCollection {
  private ciphers: Map<string, Cipher> = new Map();

  // Add cipher to collection
  add(cipher: Cipher): void {
    this.ciphers.set(cipher.id, cipher);
  }

  // Remove cipher from collection
  remove(cipherId: string): void {
    this.ciphers.delete(cipherId);
  }

  // Get cipher by ID
  get(cipherId: string): Cipher | undefined {
    return this.ciphers.get(cipherId);
  }

  // Get all ciphers
  getAll(): Cipher[] {
    return Array.from(this.ciphers.values());
  }

  // Get ciphers by type
  getByType(type: CipherType): Cipher[] {
    return this.getAll().filter(cipher => cipher.type === type);
  }

  // Get favorite ciphers
  getFavorites(): Cipher[] {
    return this.getAll().filter(cipher => cipher.favorite);
  }

  // Get deleted ciphers
  getDeleted(): Cipher[] {
    return this.getAll().filter(cipher => cipher.isDeleted());
  }

  // Get active (non-deleted) ciphers
  getActive(): Cipher[] {
    return this.getAll().filter(cipher => !cipher.isDeleted());
  }

  // Clear collection
  clear(): void {
    this.ciphers.clear();
  }

  // Get collection size
  size(): number {
    return this.ciphers.size;
  }

  // Check if collection is empty
  isEmpty(): boolean {
    return this.ciphers.size === 0;
  }
}
