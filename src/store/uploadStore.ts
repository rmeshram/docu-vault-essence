import { create } from 'zustand';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  extractedText: string;
  category?: string;
  uploadedAt: Date;
  thumbnail?: string;
}

interface UploadStore {
  uploadedDocuments: UploadedDocument[];
  addDocument: (document: UploadedDocument) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<UploadedDocument>) => void;
  getDocument: (id: string) => UploadedDocument | undefined;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploadedDocuments: [],
  
  addDocument: (document) =>
    set((state) => ({
      uploadedDocuments: [...state.uploadedDocuments, document],
    })),
  
  removeDocument: (id) =>
    set((state) => ({
      uploadedDocuments: state.uploadedDocuments.filter((doc) => doc.id !== id),
    })),
  
  updateDocument: (id, updates) =>
    set((state) => ({
      uploadedDocuments: state.uploadedDocuments.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    })),
  
  getDocument: (id) => {
    const state = get();
    return state.uploadedDocuments.find((doc) => doc.id === id);
  },
}));