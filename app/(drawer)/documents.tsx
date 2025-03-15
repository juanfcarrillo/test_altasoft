import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';

import { useAuth } from '../../context/AuthContext';

import { useUser } from '~/hooks/useUser';
import { supabase } from '~/utils/supabase';

interface Document {
  name: string;
  title: string;
  author: string;
  type: string;
  pages: number;
}

interface DeleteModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentTitle: string;
}

function DeleteModal({ isVisible, onClose, onConfirm, documentTitle }: DeleteModalProps) {
  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 flex items-center justify-center bg-black/50">
      <View className="m-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <Text className="text-lg font-semibold text-gray-800">Delete Document</Text>
        <Text className="mt-2 text-gray-600">
          Are you sure you want to delete "{documentTitle}"? This action cannot be undone.
        </Text>
        <View className="mt-6 flex-row justify-end space-x-3">
          <Pressable onPress={onClose} className="rounded-lg border border-gray-300 px-4 py-2">
            <Text className="font-medium text-gray-700">Cancel</Text>
          </Pressable>
          <Pressable onPress={onConfirm} className="rounded-lg bg-red-500 px-4 py-2">
            <Text className="font-medium text-white">Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function DocumentsScreen() {
  const { session } = useAuth();
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isVisible: false,
    documentToDelete: null as Document | null,
  });

  const handleDelete = async (doc: Document) => {
    setDeleteModal({
      isVisible: true,
      documentToDelete: doc,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.documentToDelete) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('metadata->>s3Name', deleteModal.documentToDelete.name);

      if (error) throw error;

      // Refresh the documents list
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeleteModal({ isVisible: false, documentToDelete: null });
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // TODO: Implement your API call to fetch documents
      const { data, error } = await supabase.rpc('get_grouped_documents');

      console.log('data', data);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (!session || user?.role !== 'admin') {
    return <Redirect href="/" />;
  }

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setUploading(true);
      const file = result.assets[0];

      // Create form data for upload
      const formData = new FormData();

      if (Platform.OS === 'web') {
        formData.append('file', file.file!);
      } else {
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType,
          name: file.name,
        } as any);
      }

      formData.append('fileName', file.name);

      const { error: sessionError, data: sessionData } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) throw sessionError;

      const { error } = await supabase.functions.invoke('upload-document', {
        body: formData,
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4">
        <Pressable
          className="flex-row items-center justify-center rounded-lg bg-[#38BDF8] p-4"
          onPress={handleUpload}
          disabled={uploading}>
          <MaterialIcons name="file-upload" size={24} color="white" />
          <Text className="ml-2 font-medium text-white">
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {documents.map((doc) => (
            <View key={doc.name} className="mb-3 rounded-lg bg-white p-4 shadow-sm">
              <View className="flex-row items-center">
                <MaterialIcons
                  name={doc.type === 'application/pdf' ? 'picture-as-pdf' : 'description'}
                  size={24}
                  color="#64748B"
                />
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-gray-800">{doc.title || doc.name}</Text>
                  <Text className="text-sm text-gray-500">
                    {doc.author} • {doc.pages} pages
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(doc)}
                  className="ml-4 rounded-full p-2 hover:bg-red-50"
                  hitSlop={10}>
                  <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))}

          {documents.length === 0 && (
            <View className="items-center justify-center p-8">
              <Text className="text-gray-500">No documents uploaded yet</Text>
            </View>
          )}
        </ScrollView>
      )}
      <DeleteModal
        isVisible={deleteModal.isVisible}
        onClose={() => setDeleteModal({ isVisible: false, documentToDelete: null })}
        onConfirm={handleConfirmDelete}
        documentTitle={
          deleteModal.documentToDelete?.title || deleteModal.documentToDelete?.name || ''
        }
      />
    </View>
  );
}
