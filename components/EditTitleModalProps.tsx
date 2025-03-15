import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

interface EditTitleModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
  currentTitle: string;
}

export function EditTitleModal({
  isVisible,
  onClose,
  onConfirm,
  currentTitle,
}: EditTitleModalProps) {
  const [title, setTitle] = useState(currentTitle);

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 flex items-center justify-center bg-black/50">
      <View className="m-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <Text className="text-lg font-semibold text-gray-800">Edit Chat Title</Text>
        <TextInput
          className="mt-2 rounded-lg border border-gray-300 p-2"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter new title"
        />
        <View className="mt-6 flex-row justify-end space-x-3">
          <Pressable onPress={onClose} className="rounded-lg border border-gray-300 px-4 py-2">
            <Text className="font-medium text-gray-700">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (title.trim()) {
                onConfirm(title.trim());
              }
            }}
            className="rounded-lg bg-sky-500 px-4 py-2">
            <Text className="font-medium text-white">Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
